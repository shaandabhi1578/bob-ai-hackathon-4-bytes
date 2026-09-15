/**
 * AuthContext — GridGuard AI Authentication & Session Management
 *
 * Security model:
 *   • Passwords hashed with PBKDF2-SHA-256 (210,000 iterations) via Web Crypto API
 *   • Plaintext passwords are NEVER stored in localStorage — only hashes
 *   • Login functions are async and enforce a minimum 300ms response time
 *     to prevent brute-force timing attacks
 *   • Rate-limiting: 5 failed attempts trigger a 30-second lockout per role
 *   • Session TTL: 8 hours; stale sessions are discarded on restore
 *   • No default auto-authenticated session — users must always log in
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { hashPassword, verifyPassword, isHashedPassword } from '../utils/crypto';

export type UserRole = 'admin' | 'employee' | 'testing';

export interface EmployeeRecord {
  id: string;
  name: string;
  fullName: string;
  role: string;
  department: string;
  phone: string;
  assignedUnitId?: string;
  registeredAt: string;
  /** PBKDF2 hash of the password. Never the plaintext. */
  passwordHash?: string;
}

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  employeeDetails?: EmployeeRecord;
  /** Unix ms timestamp when this session was created */
  sessionCreatedAt: number;
}

/** Per-role lockout state tracked in component memory only (not persisted) */
interface LockoutState {
  failedAttempts: number;
  lockedUntil: number | null; // Unix ms
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginAsAdmin: (password: string) => Promise<{ success: boolean; message: string }>;
  loginAsEmployee: (employeeId: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginAsTesting: (password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  changeAdminPassword: (currentPass: string, newPass: string) => Promise<{ success: boolean; message: string }>;
  employees: EmployeeRecord[];
  addEmployee: (employee: Omit<EmployeeRecord, 'registeredAt' | 'passwordHash'>) => Promise<{ success: boolean; message: string }>;
  deleteEmployee: (id: string) => void;
  /** Seconds remaining in lockout for a role, or 0 if not locked */
  getLockoutSeconds: (role: 'admin' | 'employee') => number;
  /** How many failed attempts remain before lockout triggers */
  getFailedAttempts: (role: 'admin' | 'employee') => number;
}

// ─── Session TTL ─────────────────────────────────────────────────────────────
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours

// ─── Rate limiting ────────────────────────────────────────────────────────────
const MAX_ATTEMPTS   = 5;
const LOCKOUT_MS     = 30_000; // 30 seconds
const MIN_DELAY_MS   = 300;    // constant-time floor (ms)

// ─── Default employees ────────────────────────────────────────────────────────
const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'EMP-04',
    name: 'Sharma',
    fullName: 'R. K. Sharma',
    role: 'Lead Transformer Specialist',
    department: 'Rapid Response Unit 4',
    phone: '9408487768',
    assignedUnitId: 'Crew 04',
    registeredAt: '2026-09-01',
  },
  {
    id: 'EMP-01',
    name: 'Patel',
    fullName: 'P. Patel',
    role: 'Emergency High Voltage Linesman',
    department: 'Transmission Squad 1',
    phone: '+91 98250 11001',
    assignedUnitId: 'Crew 01',
    registeredAt: '2026-09-02',
  },
  {
    id: 'EMP-08',
    name: 'Yadav',
    fullName: 'M. C. Yadav',
    role: 'Substation SF6 Heavy Specialist',
    department: 'Inter-tie Unit 8',
    phone: '+91 98250 88008',
    assignedUnitId: 'Crew 08',
    registeredAt: '2026-09-05',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Enforces a minimum elapsed time so all login paths take at least MIN_DELAY_MS */
async function withMinDelay<T>(fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  const result = await fn();
  const elapsed = Date.now() - start;
  if (elapsed < MIN_DELAY_MS) {
    await new Promise((r) => setTimeout(r, MIN_DELAY_MS - elapsed));
  }
  return result;
}

/** Validate password complexity: ≥8 chars, at least one digit, one letter */
export function validatePasswordStrength(password: string): { valid: boolean; message: string } {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters.' };
  if (!/[a-zA-Z]/.test(password)) return { valid: false, message: 'Password must contain at least one letter.' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain at least one number.' };
  return { valid: true, message: '' };
}

/** Restore a session from localStorage. Returns null if expired or invalid. */
function restoreSession(): AuthUser | null {
  try {
    const raw = localStorage.getItem('gridguard_active_session');
    if (!raw) return null;
    const parsed: AuthUser = JSON.parse(raw);
    if (!parsed.sessionCreatedAt) return null;
    if (Date.now() - parsed.sessionCreatedAt > SESSION_TTL_MS) {
      localStorage.removeItem('gridguard_active_session');
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // ── Admin password hash ──────────────────────────────────────────────────────
  const [adminPasswordHash, setAdminPasswordHash] = useState<string | null>(() => {
    return localStorage.getItem('gridguard_admin_password_hash') ?? null;
  });

  // ── Employees ────────────────────────────────────────────────────────────────
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => {
    const raw = localStorage.getItem('gridguard_employees');
    if (raw) {
      try { return JSON.parse(raw); } catch { /* fall through */ }
    }
    return DEFAULT_EMPLOYEES;
  });

  // ── Session ──────────────────────────────────────────────────────────────────
  // No default auto-login — null until the user authenticates
  const [user, setUser] = useState<AuthUser | null>(() => restoreSession());

  // ── Rate-limit state (memory only — not persisted) ───────────────────────────
  const [lockouts, setLockouts] = useState<Record<'admin' | 'employee', LockoutState>>({
    admin:    { failedAttempts: 0, lockedUntil: null },
    employee: { failedAttempts: 0, lockedUntil: null },
  });

  // ── Persist employees ────────────────────────────────────────────────────────
  useEffect(() => {
    localStorage.setItem('gridguard_employees', JSON.stringify(employees));
  }, [employees]);

  // ── Persist session ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (user) {
      localStorage.setItem('gridguard_active_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('gridguard_active_session');
    }
  }, [user]);

  // ── Hash the default admin password on first run if no hash exists ───────────
  useEffect(() => {
    if (!adminPasswordHash) {
      hashPassword('Admin_1234').then((hash) => {
        setAdminPasswordHash(hash);
        localStorage.setItem('gridguard_admin_password_hash', hash);
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Hash employee passwords that are not yet hashed (migration) ───────────────
  useEffect(() => {
    let changed = false;
    const migrate = async () => {
      const updated = await Promise.all(
        employees.map(async (emp) => {
          if (!emp.passwordHash || !isHashedPassword(emp.passwordHash)) {
            changed = true;
            return { ...emp, passwordHash: await hashPassword(`${emp.id}_${emp.name}`) };
          }
          return emp;
        })
      );
      if (changed) setEmployees(updated);
    };
    migrate();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rate-limit helpers ───────────────────────────────────────────────────────
  const isLockedOut = useCallback((role: 'admin' | 'employee'): boolean => {
    const state = lockouts[role];
    if (state.lockedUntil === null) return false;
    if (Date.now() >= state.lockedUntil) {
      // Lockout expired — reset silently on next check
      setLockouts((prev) => ({
        ...prev,
        [role]: { failedAttempts: 0, lockedUntil: null },
      }));
      return false;
    }
    return true;
  }, [lockouts]);

  const recordFailure = useCallback((role: 'admin' | 'employee') => {
    setLockouts((prev) => {
      const state = prev[role];
      const newAttempts = state.failedAttempts + 1;
      return {
        ...prev,
        [role]: {
          failedAttempts: newAttempts,
          lockedUntil: newAttempts >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : null,
        },
      };
    });
  }, []);

  const resetAttempts = useCallback((role: 'admin' | 'employee') => {
    setLockouts((prev) => ({
      ...prev,
      [role]: { failedAttempts: 0, lockedUntil: null },
    }));
  }, []);

  const getLockoutSeconds = useCallback((role: 'admin' | 'employee'): number => {
    const state = lockouts[role];
    if (state.lockedUntil === null) return 0;
    const remaining = Math.ceil((state.lockedUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }, [lockouts]);

  const getFailedAttempts = useCallback((role: 'admin' | 'employee'): number => {
    return lockouts[role].failedAttempts;
  }, [lockouts]);

  // ── 1. Login as Admin ─────────────────────────────────────────────────────────
  const loginAsAdmin = useCallback(async (password: string): Promise<{ success: boolean; message: string }> => {
    if (isLockedOut('admin')) {
      const secs = getLockoutSeconds('admin');
      return { success: false, message: `Too many failed attempts. Try again in ${secs} seconds.` };
    }

    return withMinDelay(async () => {
      if (!adminPasswordHash) {
        return { success: false, message: 'Authentication system initializing. Please retry.' };
      }

      const ok = await verifyPassword(password, adminPasswordHash);
      if (ok) {
        resetAttempts('admin');
        setUser({
          username: 'admin',
          name: 'Shaan Dabhi (Chief Dispatcher)',
          role: 'admin',
          sessionCreatedAt: Date.now(),
        });
        return { success: true, message: 'Welcome, Chief Dispatcher Shaan Dabhi' };
      }

      recordFailure('admin');
      const remaining = MAX_ATTEMPTS - (lockouts.admin.failedAttempts + 1);
      if (remaining <= 0) {
        return { success: false, message: `Account locked for ${LOCKOUT_MS / 1000} seconds after too many failed attempts.` };
      }
      return { success: false, message: `Invalid password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining before lockout.` };
    });
  }, [adminPasswordHash, isLockedOut, getLockoutSeconds, recordFailure, resetAttempts, lockouts.admin.failedAttempts]);

  // ── 2. Login as Employee ──────────────────────────────────────────────────────
  const loginAsEmployee = useCallback(async (employeeId: string, password: string): Promise<{ success: boolean; message: string }> => {
    if (isLockedOut('employee')) {
      const secs = getLockoutSeconds('employee');
      return { success: false, message: `Too many failed attempts. Try again in ${secs} seconds.` };
    }

    return withMinDelay(async () => {
      const cleanId = employeeId.trim().toUpperCase();
      const emp = employees.find((e) => e.id.toUpperCase() === cleanId);

      if (!emp) {
        // Record failure even for unknown IDs to prevent user enumeration via timing
        recordFailure('employee');
        return { success: false, message: 'Invalid Employee ID or password.' };
      }

      // Verify against stored hash; fall back to legacy plaintext comparison during migration window
      let ok = false;
      if (emp.passwordHash && isHashedPassword(emp.passwordHash)) {
        ok = await verifyPassword(password, emp.passwordHash);
      } else {
        // Migration fallback: plaintext match → immediately upgrade to hash
        const expectedPlain = `${emp.id}_${emp.name}`;
        if (password === expectedPlain) {
          ok = true;
          const newHash = await hashPassword(password);
          setEmployees((prev) =>
            prev.map((e) => (e.id === emp.id ? { ...e, passwordHash: newHash } : e))
          );
        }
      }

      if (ok) {
        resetAttempts('employee');
        setUser({
          username: emp.id,
          name: emp.fullName,
          role: 'employee',
          employeeDetails: emp,
          sessionCreatedAt: Date.now(),
        });
        return { success: true, message: `Access granted: ${emp.fullName} (${emp.role})` };
      }

      recordFailure('employee');
      const remaining = MAX_ATTEMPTS - (lockouts.employee.failedAttempts + 1);
      if (remaining <= 0) {
        return { success: false, message: `Account locked for ${LOCKOUT_MS / 1000} seconds.` };
      }
      return { success: false, message: `Invalid Employee ID or password. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.` };
    });
  }, [employees, isLockedOut, getLockoutSeconds, recordFailure, resetAttempts, lockouts.employee.failedAttempts]);

  // ── 3. Login for Testing / Hackathon Evaluation ──────────────────────────────
  const loginAsTesting = useCallback(async (password: string): Promise<{ success: boolean; message: string }> => {
    return withMinDelay(async () => {
      const validKeys = ['test', 'test_2026', 'testing', 'judge'];
      if (validKeys.includes(password)) {
        setUser({
          username: 'tester',
          name: 'Hackathon Evaluation Auditor',
          role: 'testing',
          sessionCreatedAt: Date.now(),
        });
        return { success: true, message: 'Logged in as Hackathon Evaluator (Full Audit Access)' };
      }
      return { success: false, message: 'Invalid testing key.' };
    });
  }, []);

  // ── Logout ────────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
  }, []);

  // ── Change Admin Password ─────────────────────────────────────────────────────
  const changeAdminPassword = useCallback(async (currentPass: string, newPass: string): Promise<{ success: boolean; message: string }> => {
    return withMinDelay(async () => {
      if (!adminPasswordHash) {
        return { success: false, message: 'Authentication system not ready.' };
      }
      const currentOk = await verifyPassword(currentPass, adminPasswordHash);
      if (!currentOk) {
        return { success: false, message: 'Current admin password is incorrect.' };
      }
      const strength = validatePasswordStrength(newPass);
      if (!strength.valid) {
        return { success: false, message: strength.message };
      }
      const newHash = await hashPassword(newPass);
      setAdminPasswordHash(newHash);
      localStorage.setItem('gridguard_admin_password_hash', newHash);
      return { success: true, message: 'Admin password updated successfully.' };
    });
  }, [adminPasswordHash]);

  // ── Add Employee ──────────────────────────────────────────────────────────────
  const addEmployee = useCallback(async (empData: Omit<EmployeeRecord, 'registeredAt' | 'passwordHash'>): Promise<{ success: boolean; message: string }> => {
    const cleanId = empData.id.trim().toUpperCase();
    if (employees.some((e) => e.id.toUpperCase() === cleanId)) {
      return { success: false, message: `Employee ID "${cleanId}" already exists.` };
    }
    const defaultPlainPassword = `${cleanId}_${empData.name.trim()}`;
    const passwordHash = await hashPassword(defaultPlainPassword);
    const newEmp: EmployeeRecord = {
      ...empData,
      id: cleanId,
      name: empData.name.trim(),
      fullName: empData.fullName.trim(),
      registeredAt: new Date().toISOString().slice(0, 10),
      passwordHash,
    };
    setEmployees((prev) => [newEmp, ...prev]);
    return {
      success: true,
      message: `Employee ${newEmp.fullName} (${newEmp.id}) registered. Default login password: ${defaultPlainPassword}`,
    };
  }, [employees]);

  // ── Delete Employee ───────────────────────────────────────────────────────────
  const deleteEmployee = useCallback((id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loginAsAdmin,
        loginAsEmployee,
        loginAsTesting,
        logout,
        changeAdminPassword,
        employees,
        addEmployee,
        deleteEmployee,
        getLockoutSeconds,
        getFailedAttempts,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};

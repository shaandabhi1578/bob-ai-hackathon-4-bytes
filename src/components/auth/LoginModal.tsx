import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Users,
  KeyRound,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Timer,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth, UserRole, validatePasswordStrength } from '../../context/AuthContext';

// ── Password strength visual helper ────────────────────────────────────────
function StrengthBar({ password }: { password: string }) {
  if (!password) return null;
  const hasLen    = password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasDigit  = /[0-9]/.test(password);
  const hasSpec   = /[^a-zA-Z0-9]/.test(password);
  const score     = [hasLen, hasLetter, hasDigit, hasSpec].filter(Boolean).length;

  const label  = ['', 'Weak', 'Fair', 'Good', 'Strong'][score];
  const colors = ['', '#ef4444', '#f59e0b', '#3b82d4', '#16a34a'];
  const widths = ['0%', '25%', '50%', '75%', '100%'];

  return (
    <div style={{ marginTop: '0.3rem' }}>
      <div style={{ height: '4px', background: '#e5e7eb', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: widths[score],
          background: colors[score],
          borderRadius: '2px',
          transition: 'width 0.25s ease',
        }} />
      </div>
      <div style={{ fontSize: '0.68rem', color: colors[score], marginTop: '0.15rem', fontWeight: 600 }}>
        {label && `Password strength: ${label}`}
      </div>
    </div>
  );
}

// ── Countdown display ───────────────────────────────────────────────────────
function LockoutBanner({ seconds }: { seconds: number }) {
  if (seconds <= 0) return null;
  return (
    <div style={{
      marginBottom: '1rem',
      padding: '0.65rem 0.85rem',
      background: '#fef2f2',
      border: '1px solid #fecaca',
      borderRadius: '6px',
      color: '#991b1b',
      fontSize: '0.78rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
    }}>
      <Timer size={15} style={{ flexShrink: 0 }} />
      <span>
        Account temporarily locked. Please wait <strong>{seconds}s</strong> before retrying.
      </span>
    </div>
  );
}

// ── Attempt counter ─────────────────────────────────────────────────────────
function AttemptsWarning({ attempts }: { attempts: number }) {
  if (attempts === 0) return null;
  const remaining = 5 - attempts;
  if (remaining <= 0) return null;
  return (
    <div style={{
      fontSize: '0.72rem',
      color: remaining <= 2 ? '#991b1b' : '#92400e',
      background: remaining <= 2 ? '#fef2f2' : '#fffbeb',
      border: `1px solid ${remaining <= 2 ? '#fecaca' : '#fde68a'}`,
      borderRadius: '4px',
      padding: '0.3rem 0.6rem',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.35rem',
    }}>
      <AlertCircle size={12} />
      <span>{remaining} attempt{remaining === 1 ? '' : 's'} remaining before 30-second lockout</span>
    </div>
  );
}

export const LoginModal: React.FC = () => {
  const {
    loginAsAdmin,
    loginAsEmployee,
    loginAsTesting,
    getLockoutSeconds,
    getFailedAttempts,
  } = useAuth();

  const [activeTab, setActiveTab]         = useState<UserRole>('admin');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPwd, setShowAdminPwd]   = useState(false);
  const [employeeId, setEmployeeId]       = useState('');
  const [employeePassword, setEmployeePassword] = useState('');
  const [showEmpPwd, setShowEmpPwd]       = useState(false);
  const [testingPassword, setTestingPassword]   = useState('');
  const [errorMessage, setErrorMessage]   = useState('');
  const [isSubmitting, setIsSubmitting]   = useState(false);

  // Live lockout countdown — tick every second
  const [lockoutSecsAdmin, setLockoutSecsAdmin]   = useState(0);
  const [lockoutSecsEmp,   setLockoutSecsEmp]     = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLockoutSecsAdmin(getLockoutSeconds('admin'));
      setLockoutSecsEmp(getLockoutSeconds('employee'));
    }, 500);
    return () => clearInterval(interval);
  }, [getLockoutSeconds]);

  const clearError = useCallback(() => setErrorMessage(''), []);

  // ── Admin submit ────────────────────────────────────────────────────────────
  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (lockoutSecsAdmin > 0) return;
    setIsSubmitting(true);
    try {
      const res = await loginAsAdmin(adminPassword);
      if (!res.success) setErrorMessage(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Employee submit ─────────────────────────────────────────────────────────
  const handleEmployeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (lockoutSecsEmp > 0) return;
    setIsSubmitting(true);
    try {
      const res = await loginAsEmployee(employeeId, employeePassword);
      if (!res.success) setErrorMessage(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Testing submit ──────────────────────────────────────────────────────────
  const handleTestingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setIsSubmitting(true);
    try {
      const res = await loginAsTesting(testingPassword);
      if (!res.success) setErrorMessage(res.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const adminAttempts = getFailedAttempts('admin');
  const empAttempts   = getFailedAttempts('employee');

  // Shared tab button style factory
  const tabStyle = (tab: UserRole) => ({
    padding: '0.85rem 0.5rem',
    border: 'none',
    borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
    background: activeTab === tab ? '#ffffff' : 'transparent',
    color: activeTab === tab ? '#0f172a' : '#64748b',
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: '0.78rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: '0.2rem',
  });

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        background: '#ffffff',
        borderRadius: '12px',
        border: '1px solid #e2e8f0',
        boxShadow: '0 25px 50px rgba(0,0,0,0.35)',
        overflow: 'hidden',
      }}>

        {/* ── Branding header ─────────────────────────────────────────────── */}
        <div style={{
          padding: '1.5rem',
          background: '#0f172a',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          borderBottom: '1px solid #1e293b',
        }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: '#1e293b', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#38bdf8',
          }}>
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              GridGuard AI
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: '0.1rem' }}>
              Restricted Utility Control Access Portal
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.68rem', color: '#4ade80' }}>
            <ShieldCheck size={13} />
            <span>PBKDF2-SHA-256</span>
          </div>
        </div>

        {/* ── Role tabs ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          borderBottom: '1px solid #e2e8f0',
          background: '#f8fafc',
        }}>
          <button onClick={() => { setActiveTab('admin');    clearError(); }} style={tabStyle('admin')}>
            <Lock size={15} color={activeTab === 'admin' ? '#2563eb' : '#64748b'} />
            <span>1. Admin</span>
          </button>
          <button onClick={() => { setActiveTab('employee'); clearError(); }} style={tabStyle('employee')}>
            <Users size={15} color={activeTab === 'employee' ? '#2563eb' : '#64748b'} />
            <span>2. Employee</span>
          </button>
          <button onClick={() => { setActiveTab('testing');  clearError(); }} style={tabStyle('testing')}>
            <Sparkles size={15} color={activeTab === 'testing' ? '#2563eb' : '#64748b'} />
            <span>3. Evaluator</span>
          </button>
        </div>

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div style={{ padding: '1.5rem' }}>

          {/* Error banner */}
          {errorMessage && (
            <div style={{
              marginBottom: '1rem',
              padding: '0.65rem 0.85rem',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '6px',
              color: '#991b1b',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── TAB 1: ADMIN ───────────────────────────────────────────────── */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Chief Dispatcher — Admin Access
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Master control privileges. Sessions expire after 8 hours.
                </div>
              </div>

              <LockoutBanner seconds={lockoutSecsAdmin} />
              <AttemptsWarning attempts={adminAttempts} />

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Admin Password
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type={showAdminPwd ? 'text' : 'password'}
                    placeholder="Enter admin password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.4rem' }}
                    autoFocus
                    required
                    disabled={lockoutSecsAdmin > 0 || isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminPwd((v) => !v)}
                    style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    tabIndex={-1}
                  >
                    {showAdminPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
                disabled={lockoutSecsAdmin > 0 || isSubmitting}
              >
                <span>{isSubmitting ? 'Authenticating…' : 'Authorize Admin Access'}</span>
                {!isSubmitting && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* ── TAB 2: EMPLOYEE ────────────────────────────────────────────── */}
          {activeTab === 'employee' && (
            <form onSubmit={handleEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Field Engineer & Operator Access
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Authorized utility personnel only. Read-only field terminal.
                </div>
              </div>

              <LockoutBanner seconds={lockoutSecsEmp} />
              <AttemptsWarning attempts={empAttempts} />

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Employee ID
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="e.g. EMP-04"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', textTransform: 'uppercase' }}
                    required
                    disabled={lockoutSecsEmp > 0 || isSubmitting}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type={showEmpPwd ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem', paddingRight: '2.4rem' }}
                    required
                    disabled={lockoutSecsEmp > 0 || isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEmpPwd((v) => !v)}
                    style={{ position: 'absolute', right: '10px', top: '9px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    tabIndex={-1}
                  >
                    {showEmpPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
                disabled={lockoutSecsEmp > 0 || isSubmitting}
              >
                <span>{isSubmitting ? 'Authenticating…' : 'Login as Employee'}</span>
                {!isSubmitting && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* ── TAB 3: TESTING / EVALUATOR ─────────────────────────────────── */}
          {activeTab === 'testing' && (
            <form onSubmit={handleTestingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Hackathon Evaluation Session
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                  IBM Bob Hackathon judge inspection mode.
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Evaluator Passcode
                </label>
                <input
                  type="password"
                  placeholder='Enter passcode (try "judge")'
                  value={testingPassword}
                  onChange={(e) => setTestingPassword(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Verifying…' : 'Enter Evaluation Session'}</span>
                {!isSubmitting && <ArrowRight size={15} />}
              </button>
            </form>
          )}

          {/* ── Footer note ──────────────────────────────────────────────────── */}
          <div style={{
            marginTop: '1.25rem',
            paddingTop: '0.85rem',
            borderTop: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.68rem',
            color: '#94a3b8',
          }}>
            <ShieldCheck size={12} color="#16a34a" />
            <span>
              Passwords stored as PBKDF2-SHA-256 hashes · Rate-limited · 8-hour session TTL
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

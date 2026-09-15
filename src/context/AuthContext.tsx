import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'admin' | 'employee' | 'testing';

export interface EmployeeRecord {
  id: string; // e.g. "EMP-04"
  name: string; // e.g. "Sharma" (used in password: EMP-04_Sharma)
  fullName: string; // e.g. "R. K. Sharma"
  role: string; // e.g. "Rapid Response Transformer Specialist"
  department: string;
  phone: string;
  assignedUnitId?: string;
  registeredAt: string;
}

export interface AuthUser {
  username: string;
  name: string;
  role: UserRole;
  employeeDetails?: EmployeeRecord;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loginAsAdmin: (password: string) => { success: boolean; message: string };
  loginAsEmployee: (employeeId: string, password: string) => { success: boolean; message: string };
  loginAsTesting: (password: string) => { success: boolean; message: string };
  logout: () => void;
  changeAdminPassword: (currentPass: string, newPass: string) => { success: boolean; message: string };
  employees: EmployeeRecord[];
  addEmployee: (employee: Omit<EmployeeRecord, 'registeredAt'>) => { success: boolean; message: string };
  deleteEmployee: (id: string) => void;
  adminPasswordCurrent: string;
}

const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'EMP-04',
    name: 'Sharma',
    fullName: 'R. K. Sharma',
    role: 'Lead Transformer Specialist',
    department: 'Rapid Response Unit 4',
    phone: '9408487768', // User's mobile linked to lead crew
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load admin password from localStorage or default to Admin_1234
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    const saved = localStorage.getItem('gridguard_admin_password');
    if (!saved || saved === 'Shaan_2750') {
      localStorage.setItem('gridguard_admin_password', 'Admin_1234');
      return 'Admin_1234';
    }
    return saved;
  });

  // Load employees from localStorage or defaults
  const [employees, setEmployees] = useState<EmployeeRecord[]>(() => {
    const saved = localStorage.getItem('gridguard_employees');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_EMPLOYEES;
      }
    }
    return DEFAULT_EMPLOYEES;
  });

  // Active user session
  const [user, setUser] = useState<AuthUser | null>(() => {
    const savedSession = localStorage.getItem('gridguard_active_session');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        return null;
      }
    }
    // Default initial session: Admin
    return {
      username: 'admin',
      name: 'Shaan Dabhi',
      role: 'admin',
    };
  });

  // Save employees whenever updated
  useEffect(() => {
    localStorage.setItem('gridguard_employees', JSON.stringify(employees));
  }, [employees]);

  // Save session
  useEffect(() => {
    if (user) {
      localStorage.setItem('gridguard_active_session', JSON.stringify(user));
    } else {
      localStorage.removeItem('gridguard_active_session');
    }
  }, [user]);

  // 1. Login as Admin
  const loginAsAdmin = (password: string) => {
    if (password === adminPassword) {
      const adminUser: AuthUser = {
        username: 'admin',
        name: 'Shaan Dabhi (Chief Dispatcher)',
        role: 'admin',
      };
      setUser(adminUser);
      return { success: true, message: 'Welcome, Chief Dispatcher Shaan Dabhi' };
    }
    return { success: false, message: 'Invalid Admin Password.' };
  };

  // 2. Login as Employee: password must be <employee_id>_<name> and must exist in registered employees!
  const loginAsEmployee = (employeeId: string, password: string) => {
    const cleanId = employeeId.trim().toUpperCase();
    const emp = employees.find((e) => e.id.toUpperCase() === cleanId);

    if (!emp) {
      return {
        success: false,
        message: `Employee ID "${cleanId}" is not registered. Contact Admin Shaan Dabhi to add your credentials.`,
      };
    }

    // Expected password format: <employee_id>_<name>
    const expectedPassword = `${emp.id}_${emp.name}`;
    if (password === expectedPassword || password.toLowerCase() === expectedPassword.toLowerCase()) {
      const empUser: AuthUser = {
        username: emp.id,
        name: emp.fullName,
        role: 'employee',
        employeeDetails: emp,
      };
      setUser(empUser);
      return { success: true, message: `Access granted: ${emp.fullName} (${emp.role})` };
    }

    return {
      success: false,
      message: `Invalid password. Required format: <employee_id>_<name> (e.g. ${emp.id}_${emp.name})`,
    };
  };

  // 3. Login for Testing Purposes
  const loginAsTesting = (password: string) => {
    if (password === 'test' || password === 'test_2026' || password === 'testing' || password === 'judge') {
      const testUser: AuthUser = {
        username: 'tester',
        name: 'Hackathon Evaluation Auditor',
        role: 'testing',
      };
      setUser(testUser);
      return { success: true, message: 'Logged in as Hackathon Evaluator (Full Audit Access)' };
    }
    return { success: false, message: 'Invalid testing key. Use "test" or click 1-Click Login.' };
  };

  const logout = () => {
    setUser(null);
  };

  // Change Admin Password
  const changeAdminPassword = (currentPass: string, newPass: string) => {
    if (currentPass !== adminPassword) {
      return { success: false, message: 'Current admin password incorrect.' };
    }
    if (!newPass || newPass.length < 4) {
      return { success: false, message: 'New password must be at least 4 characters.' };
    }
    setAdminPassword(newPass);
    localStorage.setItem('gridguard_admin_password', newPass);
    return { success: true, message: 'Admin password updated successfully!' };
  };

  // Admin Adds New Employee
  const addEmployee = (empData: Omit<EmployeeRecord, 'registeredAt'>) => {
    const cleanId = empData.id.trim().toUpperCase();
    if (employees.some((e) => e.id.toUpperCase() === cleanId)) {
      return { success: false, message: `Employee ID "${cleanId}" already exists.` };
    }

    const newEmp: EmployeeRecord = {
      ...empData,
      id: cleanId,
      name: empData.name.trim(),
      fullName: empData.fullName.trim(),
      registeredAt: new Date().toISOString().slice(0, 10),
    };

    setEmployees((prev) => [newEmp, ...prev]);
    return {
      success: true,
      message: `Employee ${newEmp.fullName} (${newEmp.id}) registered! Their login password is: ${newEmp.id}_${newEmp.name}`,
    };
  };

  // Admin Deletes Employee
  const deleteEmployee = (id: string) => {
    setEmployees((prev) => prev.filter((e) => e.id !== id));
  };

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
        adminPasswordCurrent: adminPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
};

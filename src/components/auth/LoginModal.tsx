import React, { useState } from 'react';
import {
  ShieldAlert,
  Lock,
  User,
  Users,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Radio,
  FileCode,
} from 'lucide-react';
import { useAuth, UserRole } from '../../context/AuthContext';

export const LoginModal: React.FC = () => {
  const {
    loginAsAdmin,
    loginAsEmployee,
    loginAsTesting,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<UserRole>('admin');

  // Admin form
  const [adminPassword, setAdminPassword] = useState('');

  // Employee form
  const [employeeId, setEmployeeId] = useState('');
  const [employeePassword, setEmployeePassword] = useState('');

  // Testing form
  const [testingPassword, setTestingPassword] = useState('');

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = loginAsAdmin(adminPassword);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const handleEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = loginAsEmployee(employeeId, employeePassword);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  const handleTestingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const res = loginAsTesting(testingPassword);
    if (!res.success) {
      setErrorMessage(res.message);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          borderRadius: '10px',
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          animation: 'slide-up 0.2s ease-out',
        }}
      >
        {/* Modal Top Branding */}
        <div
          style={{
            padding: '1.5rem',
            background: '#0f172a',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            borderBottom: '1px solid #1e293b',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: '#1e293b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#38bdf8',
            }}
          >
            <ShieldAlert size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.02em' }}>
              GridGuard AI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Restricted Utility Control Access Portal
            </div>
          </div>
        </div>

        {/* 3 Role Selection Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            borderBottom: '1px solid #e2e8f0',
            background: '#f8fafc',
          }}
        >
          <button
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage('');
            }}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              borderBottom: activeTab === 'admin' ? '2px solid #2563eb' : '2px solid transparent',
              background: activeTab === 'admin' ? '#ffffff' : 'transparent',
              color: activeTab === 'admin' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'admin' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Lock size={15} color={activeTab === 'admin' ? '#2563eb' : '#64748b'} />
            <span>1. Admin</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('employee');
              setErrorMessage('');
            }}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              borderBottom: activeTab === 'employee' ? '2px solid #2563eb' : '2px solid transparent',
              background: activeTab === 'employee' ? '#ffffff' : 'transparent',
              color: activeTab === 'employee' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'employee' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Users size={15} color={activeTab === 'employee' ? '#2563eb' : '#64748b'} />
            <span>2. Employee</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('testing');
              setErrorMessage('');
            }}
            style={{
              padding: '0.85rem 0.5rem',
              border: 'none',
              borderBottom: activeTab === 'testing' ? '2px solid #2563eb' : '2px solid transparent',
              background: activeTab === 'testing' ? '#ffffff' : 'transparent',
              color: activeTab === 'testing' ? '#0f172a' : '#64748b',
              fontWeight: activeTab === 'testing' ? 700 : 500,
              fontSize: '0.78rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            <Sparkles size={15} color={activeTab === 'testing' ? '#2563eb' : '#64748b'} />
            <span>3. Testing / Judge</span>
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '1.5rem' }}>
          {errorMessage && (
            <div
              style={{
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
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: ADMIN LOGIN */}
          {activeTab === 'admin' && (
            <form onSubmit={handleAdminSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Super Admin Credentials
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Chief Grid Dispatcher • Master Control Privileges
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Admin Password
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="password"
                    placeholder="Enter Admin Password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem' }}
                    autoFocus
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', height: '40px' }}
              >
                <span>Authorize Admin Access</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* TAB 2: EMPLOYEE LOGIN */}
          {activeTab === 'employee' && (
            <form onSubmit={handleEmployeeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Field Engineer & Operator Access
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Authorized Utility Personnel Only
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Employee ID
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="text"
                    placeholder="Enter Employee ID"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Employee Password
                </label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                  <input
                    type="password"
                    placeholder="Enter Password"
                    value={employeePassword}
                    onChange={(e) => setEmployeePassword(e.target.value)}
                    className="form-input"
                    style={{ paddingLeft: '2.2rem' }}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.25rem', height: '40px' }}
              >
                <span>Login as Employee</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}

          {/* TAB 3: TESTING / JUDGE LOGIN */}
          {activeTab === 'testing' && (
            <form onSubmit={handleTestingSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>
                  Hackathon Evaluation Session
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
                  Inspection Mode for Evaluators
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.3rem' }}>
                  Passcode
                </label>
                <input
                  type="password"
                  placeholder="Enter Passcode"
                  value={testingPassword}
                  onChange={(e) => setTestingPassword(e.target.value)}
                  className="form-input"
                  style={{ fontFamily: 'var(--font-mono)' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '40px' }}
              >
                <span>Verify & Enter Evaluation Session</span>
                <ArrowRight size={15} />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

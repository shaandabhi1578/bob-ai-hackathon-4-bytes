import React, { useState } from 'react';
import {
  Sliders,
  Save,
  Radio,
  KeyRound,
  Users,
  UserPlus,
  Trash2,
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Flame,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';
import { sendFirebaseOutageAlert } from '../../services/firebaseMessagingService';

export const SettingsView: React.FC = () => {
  const { showToast } = useGrid();
  const {
    user,
    changeAdminPassword,
    employees,
    addEmployee,
    deleteEmployee,
    adminPasswordCurrent,
  } = useAuth();

  // Model weights state
  const [sensorWeight, setSensorWeight] = useState(40);
  const [weatherWeight, setWeatherWeight] = useState(25);
  const [historyWeight, setHistoryWeight] = useState(20);
  const [critWeight, setCritWeight] = useState(15);
  const [telemetryRate, setTelemetryRate] = useState('1000');

  // Change Admin Password Form
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');

  // Add Employee Form
  const [empId, setEmpId] = useState('');
  const [empLastName, setEmpLastName] = useState('');
  const [empFullName, setEmpFullName] = useState('');
  const [empRole, setEmpRole] = useState('Rapid Response Technician');
  const [empPhone, setEmpPhone] = useState('');
  const [empError, setEmpError] = useState('');
  const [empSuccess, setEmpSuccess] = useState('');

  // Firebase Cloud Messaging (FCM) State
  const [fcmTestResult, setFcmTestResult] = useState<string | null>(null);
  const [isSendingFCMTest, setIsSendingFCMTest] = useState(false);

  const handleSendTestFCM = async () => {
    setIsSendingFCMTest(true);
    setFcmTestResult(null);
    const res = await sendFirebaseOutageAlert({
      title: '⚡ GRIDGUARD TELEMETRY HEARTBEAT',
      body: 'Firebase Cloud Messaging test broadcast from GridGuard AI to topic (gridguard-outages). System nominal.',
      topic: 'gridguard-outages',
      data: {
        type: 'test_heartbeat',
        source: 'settings_panel',
      },
    });
    setIsSendingFCMTest(false);
    if (res.success) {
      setFcmTestResult(`Delivered to Firebase topic "${res.topic}". Message ID: ${res.messageId}`);
      showToast('Firebase FCM Dispatched', `Delivered to topic "${res.topic}"`, 'success');
    } else {
      setFcmTestResult(`Error: ${res.error}`);
      showToast('Firebase Error', res.error || 'Failed to dispatch FCM', 'critical');
    }
  };

  const isAdmin = user?.role === 'admin';

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (newPass !== confirmPass) {
      setPassError('New passwords do not match.');
      return;
    }

    const res = changeAdminPassword(currentPass, newPass);
    if (res.success) {
      setPassSuccess(res.message);
      showToast('Admin Password Changed', 'Admin credentials updated successfully.', 'success');
      setCurrentPass('');
      setNewPass('');
      setConfirmPass('');
    } else {
      setPassError(res.message);
    }
  };

  const handleAddEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    setEmpError('');
    setEmpSuccess('');

    if (!empId || !empLastName || !empFullName) {
      setEmpError('Please fill in Employee ID, Last Name, and Full Name.');
      return;
    }

    const res = addEmployee({
      id: empId,
      name: empLastName,
      fullName: empFullName,
      role: empRole,
      department: 'Gujarat SLDC Field Division',
      phone: empPhone || '9408487768',
    });

    if (res.success) {
      setEmpSuccess(res.message);
      showToast('Employee Added', `Employee ${empFullName} (${empId}) added to access roster.`, 'success');
      setEmpId('');
      setEmpLastName('');
      setEmpFullName('');
      setEmpPhone('');
    } else {
      setEmpError(res.message);
    }
  };

  if (!isAdmin) {
    return (
      <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div
          style={{
            maxWidth: '520px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '2.5rem 2rem',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fef2f2',
              color: '#dc2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
              border: '2px solid #fecaca',
            }}
          >
            <ShieldCheck size={28} />
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
            Restricted Administrator Console
          </h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            You are currently logged in with a field technician profile (<strong>{user?.name}</strong>). Employee accounts have <strong>read-only telemetry access</strong> and are restricted from changing passwords, modifying AI risk weights, or altering employee rosters.
          </p>
          <div
            style={{
              padding: '0.75rem',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '0.74rem',
              color: '#475569',
              textAlign: 'left',
            }}
          >
            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '0.25rem' }}>Active Employee Session:</div>
            <div>• Employee ID: <strong>{user?.employeeDetails?.id || 'EMP-04'}</strong></div>
            <div>• Assigned Unit: <strong>{user?.employeeDetails?.assignedUnitId || 'Crew 04'}</strong></div>
            <div>• Registered Phone: <strong>+91 {user?.employeeDetails?.phone || '9408487768'}</strong></div>
            <div>• Clearance Level: <strong>Limited / Field Operational</strong></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          System Settings & Platform Administration
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Manage admin security, employee access credentials roster, AI model weights, and dispatch gateways.
        </p>
      </div>

      {/* 1. ADMIN SECURITY & PASSWORD MANAGEMENT */}
      <div className="control-card">
        <div className="control-card-header">
          <div className="control-card-title">
            <KeyRound size={16} color="#2563eb" />
            <span>Admin Authentication & Password Management</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Current Admin: <strong style={{ color: '#0f172a' }}>{user?.name || 'Shaan Dabhi'}</strong>
          </span>
        </div>

        <div className="control-card-body">
          <form onSubmit={handlePasswordChange} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '600px' }}>
            {passError && (
              <div style={{ padding: '0.65rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', fontSize: '0.78rem' }}>
                {passError}
              </div>
            )}
            {passSuccess && (
              <div style={{ padding: '0.65rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '0.78rem' }}>
                {passSuccess}
              </div>
            )}

            <div>
              <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                Current Admin Password
              </label>
              <input
                type="password"
                placeholder="Enter current admin password"
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                className="form-input"
                required
              />
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                Active password key: <code style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>{adminPasswordCurrent}</code>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  New Admin Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.76rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.25rem' }}>
                  Confirm New Password
                </label>
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPass}
                  onChange={(e) => setConfirmPass(e.target.value)}
                  className="form-input"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary btn-sm" style={{ width: 'fit-content' }}>
              <Save size={13} />
              <span>Update Admin Password</span>
            </button>
          </form>
        </div>
      </div>

      {/* 2. EMPLOYEE ROSTER & CREDENTIALS MANAGEMENT (ADMIN ONLY) */}
      <div className="control-card">
        <div className="control-card-header">
          <div className="control-card-title">
            <Users size={16} color="#0f172a" />
            <span>Authorized Employee Directory & Login Management</span>
          </div>
          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Strict Access Control • Only Listed Employees Can Log In
          </span>
        </div>

        <div className="control-card-body">
          <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1.25rem' }}>
            Employees must log in with their assigned <strong>Employee ID</strong> and password format{' '}
            <code style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#2563eb' }}>employee_id_name</code>.
            Only employees added to this registry will be allowed access.
          </p>

          {/* Add Employee Form */}
          <form
            onSubmit={handleAddEmployee}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <UserPlus size={15} color="#2563eb" />
              <span>Register New Employee Credentials</span>
            </div>

            {empError && (
              <div style={{ padding: '0.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', color: '#991b1b', fontSize: '0.75rem' }}>
                {empError}
              </div>
            )}
            {empSuccess && (
              <div style={{ padding: '0.5rem', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '4px', color: '#166534', fontSize: '0.75rem' }}>
                {empSuccess}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Employee ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. EMP-05"
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Last Name (For Password)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Solanki"
                  value={empLastName}
                  onChange={(e) => setEmpLastName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. V. K. Solanki"
                  value={empFullName}
                  onChange={(e) => setEmpFullName(e.target.value)}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '0.2rem' }}>
                  Mobile Phone
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9408487768"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  className="form-input"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.35rem' }}>
              <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Generated Login Password will be:{' '}
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>
                  {empId && empLastName ? `${empId.trim().toUpperCase()}_${empLastName.trim()}` : '<id>_<name>'}
                </strong>
              </div>

              <button type="submit" className="btn-primary btn-sm">
                <UserPlus size={13} />
                <span>Add Employee to Roster</span>
              </button>
            </div>
          </form>

          {/* Employee Directory Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Full Name</th>
                  <th>Role & Department</th>
                  <th>Mobile</th>
                  <th>Login Password Key</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp.id}>
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{emp.id}</td>
                    <td style={{ fontWeight: 600, color: '#0f172a' }}>{emp.fullName}</td>
                    <td>
                      <div style={{ fontSize: '0.78rem' }}>{emp.role}</div>
                      <div style={{ fontSize: '0.68rem', color: '#64748b' }}>{emp.department}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{emp.phone}</td>
                    <td>
                      <code
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.74rem',
                          padding: '0.15rem 0.45rem',
                          background: '#eff6ff',
                          borderRadius: '4px',
                          color: '#1d4ed8',
                        }}
                      >
                        {emp.id}_{emp.name}
                      </code>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          if (confirm(`Revoke access for ${emp.fullName}?`)) {
                            deleteEmployee(emp.id);
                            showToast('Access Revoked', `${emp.fullName} removed from authorized roster.`, 'info');
                          }
                        }}
                        className="btn-secondary btn-sm"
                        style={{ color: '#dc2626', borderColor: '#fecaca' }}
                        title="Revoke Credentials"
                      >
                        <Trash2 size={12} />
                        <span>Revoke</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. FIREBASE CLOUD MESSAGING (FCM) SERVICE ACCOUNT */}
      <div className="control-card" style={{ border: '2px solid #f59e0b', background: '#fffdfa' }}>
        <div className="control-card-header" style={{ background: '#fef3c7', borderBottom: '1px solid #fde68a' }}>
          <div className="control-card-title">
            <Flame size={18} color="#d97706" />
            <span style={{ color: '#92400e', fontWeight: 700 }}>
              Firebase Cloud Messaging (FCM) & Push Dispatcher
            </span>
          </div>
          <span className="badge" style={{ background: '#dcfce7', color: '#166534', fontWeight: 700 }}>
            PROJECT: gridguard-ai-730f6 (ACTIVE)
          </span>
        </div>

        <div className="control-card-body">
          <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1rem' }}>
            Enterprise serverless push broadcast engine authenticated via Google Service Account (<strong>firebase-adminsdk-fbsvc@gridguard-ai-730f6.iam.gserviceaccount.com</strong>). Dispatches instantaneous high-priority alerts to the <code>gridguard-outages</code> FCM topic.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.65rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>FIREBASE PROJECT ID</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.15rem' }}>
                gridguard-ai-730f6
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.65rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>DEFAULT FCM TOPIC</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#d97706', marginTop: '0.15rem' }}>
                /topics/gridguard-outages
              </div>
            </div>

            <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.65rem 0.75rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600 }}>KEY ID</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.15rem' }}>
                8788ce8ba6c0...
              </div>
            </div>
          </div>

          {fcmTestResult && (
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                background: fcmTestResult.startsWith('Error') ? '#fef2f2' : '#f0fdf4',
                border: `1px solid ${fcmTestResult.startsWith('Error') ? '#fecaca' : '#bbf7d0'}`,
                fontSize: '0.76rem',
                color: fcmTestResult.startsWith('Error') ? '#991b1b' : '#166534',
              }}
            >
              <strong>FCM Status:</strong> {fcmTestResult}
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleSendTestFCM}
              disabled={isSendingFCMTest}
              className="btn-primary btn-sm"
              style={{ background: '#d97706', borderColor: '#d97706' }}
            >
              <Flame size={13} />
              <span>{isSendingFCMTest ? 'Broadcasting to FCM...' : 'Broadcast Test FCM Alert to Topic'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

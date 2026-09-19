import React, { useState, useEffect } from 'react';
import {
  Zap,
  Bell,
  Sparkles,
  PlayCircle,
  Clock,
  Radio,
  Sliders,
  LogOut,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    setIsCopilotOpen,
    isCopilotOpen,
    criticalAssetsCount,
    isDemoTourActive,
    setIsDemoTourActive,
    setActiveTab,
    setSelectedAssetId,
    adminAlerts,
    dismissAdminAlert,
  } = useGrid();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [frequency, setFrequency] = useState<string>('49.98');
  const [showNotificationsMenu, setShowNotificationsMenu] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          weekday: 'short',
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      );
      // Realistic minor grid frequency fluctuation
      const fluc = (49.97 + Math.random() * 0.04).toFixed(2);
      setFrequency(fluc);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="top-header">
      <div className="header-left">
        <div className="header-title-block">
          <h1>GridGuard AI</h1>
          <p>Transmission & Substation Intelligence Command Center</p>
        </div>

        <div className="header-status-badge">
          <span className={`status-dot ${criticalAssetsCount > 0 ? 'critical' : 'healthy'}`} />
          <span>{criticalAssetsCount > 0 ? `${criticalAssetsCount} AT-RISK ASSETS` : 'SYSTEM NOMINAL'}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Master Clock */}
        <div className="clock-telemetry">
          <div className="time">{currentTime || '12:00:00'} IST</div>
          <div className="freq">
            {currentDate} • <span style={{ fontFamily: 'var(--font-mono)' }}>{frequency} Hz</span>
          </div>
        </div>

        {/* Demo Tour Guide Toggle Button */}
        <button
          onClick={() => setIsDemoTourActive(!isDemoTourActive)}
          className={`btn-secondary btn-sm ${isDemoTourActive ? 'active-tour' : ''}`}
          style={{
            borderColor: isDemoTourActive ? '#2563eb' : '#cbd5e1',
            backgroundColor: isDemoTourActive ? '#eff6ff' : '#ffffff',
            color: isDemoTourActive ? '#1d4ed8' : '#334155',
            fontWeight: 600,
          }}
          title="Toggle Hackathon Guided Walkthrough (Steps 1–21)"
        >
          <PlayCircle size={14} color={isDemoTourActive ? '#2563eb' : '#475569'} />
          <span>{isDemoTourActive ? 'Demo Mode Active' : 'Guided Tour'}</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
            title="Admin & Fleet Risk Alerts"
            style={{ position: 'relative' }}
          >
            <Bell size={16} />
            {adminAlerts.length > 0 && (
              <span className="icon-btn-badge" style={{ backgroundColor: '#dc2626' }}>
                {adminAlerts.length}
              </span>
            )}
          </button>

          {showNotificationsMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '42px',
                width: '360px',
                maxHeight: '420px',
                overflowY: 'auto',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.85rem',
                zIndex: 60,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '0.5rem',
                  marginBottom: '0.65rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>Admin Risk Broadcasts</div>
                  <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Live Fleet Early-Warning Feeds</div>
                </div>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    background: adminAlerts.length > 0 ? '#fef2f2' : '#f0fdf4',
                    color: adminAlerts.length > 0 ? '#dc2626' : '#16a34a',
                    border: `1px solid ${adminAlerts.length > 0 ? '#fecaca' : '#bbf7d0'}`,
                  }}
                >
                  {adminAlerts.length} Active {adminAlerts.length === 1 ? 'Alert' : 'Alerts'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {adminAlerts.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b', fontSize: '0.78rem' }}>
                    <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>🛡️</div>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>All Assets Healthy</div>
                    <div>No high-risk grid anomalies detected across Gujarat telemetry.</div>
                  </div>
                ) : (
                  adminAlerts.map((alert) => (
                    <div
                      key={alert.id}
                      style={{
                        padding: '0.65rem',
                        background: alert.status === 'Critical' ? '#fef2f2' : '#fffbeb',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        border: `1px solid ${alert.status === 'Critical' ? '#fecaca' : '#fde68a'}`,
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontWeight: 700, color: alert.status === 'Critical' ? '#991b1b' : '#92400e' }}>
                          {alert.status === 'Critical' ? '🔴' : '🟡'} {alert.assetName} ({alert.assetId})
                        </div>
                        <span
                          style={{
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: alert.status === 'Critical' ? '#dc2626' : '#d97706',
                          }}
                        >
                          {alert.riskScore}% Risk
                        </span>
                      </div>
                      <div style={{ color: '#334155', marginTop: '0.25rem', fontSize: '0.72rem', lineHeight: 1.35 }}>
                        {alert.primaryReason}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem', paddingTop: '0.4rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                        <span style={{ fontSize: '0.66rem', color: '#64748b' }}>📍 {alert.substation}</span>
                        <div style={{ display: 'flex', gap: '0.35rem' }}>
                          <button
                            onClick={() => {
                              setSelectedAssetId(alert.assetId);
                              setActiveTab('failure-prediction');
                              setShowNotificationsMenu(false);
                            }}
                            className="btn-secondary btn-sm"
                            style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              setSelectedAssetId(alert.assetId);
                              setActiveTab('crew-management');
                              setShowNotificationsMenu(false);
                            }}
                            className="btn-primary btn-sm"
                            style={{ fontSize: '0.68rem', padding: '0.15rem 0.45rem' }}
                          >
                            Dispatch
                          </button>
                          <button
                            onClick={() => dismissAdminAlert(alert.id)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: '#94a3b8',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              padding: '0 0.2rem',
                            }}
                            title="Dismiss Alert"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Copilot Assistant Trigger */}
        <button
          className="copilot-trigger-btn"
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          title="Open AI Copilot"
        >
          <Sparkles size={14} color="#38bdf8" />
          <span>GridGuard Copilot</span>
        </button>

        {/* User / Dispatcher Profile with Logout */}
        <div className="user-profile-badge" style={{ gap: '0.75rem' }}>
          <div
            className="user-avatar-initials"
            style={{
              backgroundColor: user?.role === 'admin' ? '#1e3a8a' : user?.role === 'employee' ? '#166534' : '#92400e',
              color: '#ffffff',
            }}
          >
            {user?.role === 'admin' ? 'SD' : user?.role === 'employee' ? 'EM' : 'TE'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.78rem', color: '#0f172a' }}>
                {user?.name || 'Authorized Operator'}
              </span>
              <span
                style={{
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  padding: '0.1rem 0.35rem',
                  borderRadius: '3px',
                  backgroundColor: user?.role === 'admin' ? '#eff6ff' : user?.role === 'employee' ? '#f0fdf4' : '#fffbeb',
                  color: user?.role === 'admin' ? '#1d4ed8' : user?.role === 'employee' ? '#166534' : '#92400e',
                  border: `1px solid ${user?.role === 'admin' ? '#bfdbfe' : user?.role === 'employee' ? '#bbf7d0' : '#fde68a'}`,
                }}
              >
                {user?.role}
              </span>
            </div>
            <span style={{ fontSize: '0.66rem', color: '#64748b', marginTop: '0.1rem' }}>
              {user?.role === 'admin' ? 'Super Admin • Desk 01' : user?.role === 'employee' ? 'Field Technician' : 'Audit Session'}
            </span>
          </div>

          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              padding: '0.2rem',
              display: 'flex',
              alignItems: 'center',
              marginLeft: '0.25rem',
            }}
            title="Sign Out / Switch Role"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};

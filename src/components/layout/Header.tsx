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
          <p>Power Grid Intelligence & Maintenance Command Center</p>
        </div>

        <div className="header-status-badge">
          <span className="status-dot healthy" />
          <span>GRID STABLE — ELEVATED WEATHER RISK</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.75rem',
            color: '#64748b',
            borderLeft: '1px solid #e2e8f0',
            paddingLeft: '0.75rem',
          }}
        >
          <Radio size={13} color="#16a34a" />
          <span>Telemetry Live (99.8%)</span>
        </div>
      </div>

      <div className="header-right">
        {/* Master Clock & Grid Frequency */}
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
          <span>{isDemoTourActive ? 'Demo Mode Active' : 'Hackathon Demo Flow'}</span>
        </button>

        {/* Quick Simulator Shortcut */}
        <button
          onClick={() => {
            setSelectedAssetId('T-104');
            setActiveTab('failure-prediction');
          }}
          className="btn-secondary btn-sm"
          title="Open AI Risk Prediction & Live Simulator"
        >
          <Sliders size={14} />
          <span>AI Simulator</span>
        </button>

        {/* Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            className="icon-btn"
            onClick={() => setShowNotificationsMenu(!showNotificationsMenu)}
            title="System Alerts"
          >
            <Bell size={16} />
            {criticalAssetsCount > 0 && (
              <span className="icon-btn-badge">{criticalAssetsCount}</span>
            )}
          </button>

          {showNotificationsMenu && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '42px',
                width: '320px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: 'var(--shadow-lg)',
                padding: '0.75rem',
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
                  marginBottom: '0.5rem',
                }}
              >
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Active System Alerts</span>
                <span style={{ fontSize: '0.7rem', color: '#64748b' }}>{criticalAssetsCount} Critical</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div
                  style={{
                    padding: '0.5rem',
                    background: '#fef2f2',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    border: '1px solid #fecaca',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedAssetId('T-104');
                    setActiveTab('failure-prediction');
                    setShowNotificationsMenu(false);
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#991b1b' }}>🔴 Transformer T-104: 87% Failure Risk</div>
                  <div style={{ color: '#7f1d1d', marginTop: '0.2rem' }}>Thermal ramp (91°C) & severe weather approaching Sabarmati.</div>
                </div>
                <div
                  style={{
                    padding: '0.5rem',
                    background: '#fef2f2',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    border: '1px solid #fecaca',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    setSelectedAssetId('T-208');
                    setActiveTab('failure-prediction');
                    setShowNotificationsMenu(false);
                  }}
                >
                  <div style={{ fontWeight: 600, color: '#991b1b' }}>🔴 Transformer T-208: 81% Failure Risk</div>
                  <div style={{ color: '#7f1d1d', marginTop: '0.2rem' }}>Abnormal vibration pattern (5.2 mm/s) at Vastral bay.</div>
                </div>
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

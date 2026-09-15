import React from 'react';
import { ShieldAlert, Bell, Radio, CheckCircle, X, Truck } from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';

export const RealtimeAlertBanner: React.FC = () => {
  const { liveBroadcastAlert, clearBroadcastAlert, setActiveTab } = useGrid();
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  if (!liveBroadcastAlert) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '72px',
        right: '1.5rem',
        zIndex: 90,
        background: '#0f172a',
        color: '#ffffff',
        border: isEmployee ? '2px solid #10b981' : '2px solid #ef4444',
        borderRadius: '8px',
        padding: '1rem 1.25rem',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
        maxWidth: '460px',
        animation: 'slide-up 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: isEmployee ? '#10b981' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: isEmployee ? '0 0 10px rgba(16, 185, 129, 0.5)' : '0 0 10px rgba(239, 68, 68, 0.5)',
            }}
          >
            {isEmployee ? <Truck size={18} /> : <Radio size={18} className="map-pulse" />}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: isEmployee ? '#34d399' : '#f87171' }}>
              {isEmployee ? '🚨 FIELD WORK ORDER DISPATCH' : liveBroadcastAlert.title}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              From: {liveBroadcastAlert.sender} • {liveBroadcastAlert.timestamp}
            </div>
          </div>
        </div>

        <button
          onClick={clearBroadcastAlert}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
        >
          <X size={15} />
        </button>
      </div>

      <div style={{ fontSize: '0.82rem', color: '#f1f5f9', marginTop: '0.6rem', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
        {liveBroadcastAlert.message}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.75rem' }}>
        {isEmployee && (
          <button
            onClick={() => {
              setActiveTab('crew-management');
              clearBroadcastAlert();
            }}
            className="btn-secondary btn-sm"
            style={{ background: '#1e293b', borderColor: '#475569', color: '#e2e8f0', fontSize: '0.74rem' }}
          >
            <span>View Unit Status</span>
          </button>
        )}
        <button
          onClick={clearBroadcastAlert}
          className="btn-primary btn-sm"
          style={{
            background: isEmployee ? '#10b981' : '#2563eb',
            borderColor: isEmployee ? '#10b981' : '#2563eb',
            fontSize: '0.74rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle size={13} />
          <span>{isEmployee ? 'Acknowledge Work Order' : 'Acknowledge Alarm'}</span>
        </button>
      </div>
    </div>
  );
};

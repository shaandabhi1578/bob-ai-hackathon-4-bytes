import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, Info, X } from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const Toast: React.FC = () => {
  const { toast, clearToast } = useGrid();

  if (!toast) return null;

  const Icon =
    toast.type === 'success'
      ? CheckCircle2
      : toast.type === 'critical'
      ? AlertOctagon
      : toast.type === 'warning'
      ? AlertTriangle
      : Info;

  const iconColor =
    toast.type === 'success'
      ? '#16a34a'
      : toast.type === 'critical'
      ? '#dc2626'
      : toast.type === 'warning'
      ? '#d97706'
      : '#2563eb';

  return (
    <div className="toast-container">
      <div className={`toast-box ${toast.type}`}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.65rem' }}>
          <Icon size={18} color={iconColor} style={{ marginTop: '2px', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#0f172a' }}>
              {toast.title}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.15rem', lineHeight: 1.35 }}>
              {toast.message}
            </div>
          </div>
        </div>

        <button
          onClick={clearToast}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            padding: '2px',
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

import React from 'react';
import { AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const CriticalAlertsPanel: React.FC = () => {
  const { assets, setSelectedAssetId, setActiveTab } = useGrid();

  // Top 3 most important alerts
  const alertAssets = [
    {
      asset: assets.find((a) => a.id === 'T-104') || assets[0],
      iconColor: '#dc2626',
      badgeClass: 'badge-critical',
      shortReason: '87% failure probability (Thermal ramp to 91°C + approaching storm)',
    },
    {
      asset: assets.find((a) => a.id === 'S-17') || assets[2],
      iconColor: '#d97706',
      badgeClass: 'badge-warning',
      shortReason: 'High weather exposure (48 km/h squalls + direct lightning track)',
    },
    {
      asset: assets.find((a) => a.id === 'T-208') || assets[1],
      iconColor: '#dc2626',
      badgeClass: 'badge-critical',
      shortReason: 'Abnormal vibration pattern (5.2 mm/s harmonic peak load stress)',
    },
  ];

  return (
    <div className="control-card" style={{ marginTop: '1.25rem' }}>
      <div className="control-card-header">
        <div className="control-card-title">
          <AlertOctagon size={16} color="#dc2626" />
          <span>Priority Operational Alerts</span>
        </div>
        <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
          Top 3 Critical Vectors Requiring Immediate Dispatcher Action
        </span>
      </div>

      <div style={{ padding: '0.75rem 1.25rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {alertAssets.map(({ asset, iconColor, badgeClass, shortReason }) => (
          <div
            key={asset.id}
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              padding: '0.9rem',
              background: asset.status === 'Critical' ? '#fffbfb' : '#fffdfa',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: iconColor }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0f172a' }}>
                    {asset.name}
                  </span>
                </div>
                <span className={`badge ${badgeClass}`}>
                  {asset.failureRisk}% Risk
                </span>
              </div>

              <div style={{ fontSize: '0.76rem', color: '#475569', marginBottom: '0.6rem', lineHeight: 1.35 }}>
                {shortReason}
              </div>

              <div
                style={{
                  fontSize: '0.72rem',
                  color: '#334155',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '0.4rem 0.55rem',
                  borderRadius: '4px',
                  marginBottom: '0.75rem',
                }}
              >
                <span style={{ fontWeight: 600, color: '#64748b' }}>Action: </span>
                <span>{asset.recommendedAction}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedAssetId(asset.id);
                setActiveTab('failure-prediction');
              }}
              className="btn-secondary btn-sm"
              style={{ justifyContent: 'space-between', width: '100%' }}
            >
              <span>View Asset & Explain</span>
              <ArrowRight size={13} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

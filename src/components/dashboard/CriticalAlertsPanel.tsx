import React from 'react';
import { AlertOctagon, ArrowRight, ShieldAlert } from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const CriticalAlertsPanel: React.FC = () => {
  const { assets, setSelectedAssetId, setActiveTab } = useGrid();

  // Dynamically compute the top 3 highest-risk assets from live fleet state
  const sortedAssets = [...assets].sort((a, b) => b.failureRisk - a.failureRisk);
  const alertAssets = sortedAssets.slice(0, 3).map((asset) => {
    let reason = asset.recommendedAction;
    if (asset.temperature > 80) {
      reason = `Thermal ramp (${asset.temperature}°C) exceeding safety margins`;
    } else if (asset.vibration > 4.0) {
      reason = `Abnormal mechanical vibration (${asset.vibration} mm/s)`;
    } else if (asset.oilQuality === 'Poor' || asset.oilQuality === 'Critical') {
      reason = `Degraded dielectric oil quality (${asset.oilQuality})`;
    } else if (asset.failureRisk < 40) {
      reason = `Normal telemetry readings across all SCADA sensor channels`;
    }

    return {
      asset,
      iconColor: asset.failureRisk >= 80 ? '#dc2626' : asset.failureRisk >= 50 ? '#d97706' : '#16a34a',
      badgeClass: asset.status === 'Critical' ? 'badge-critical' : asset.status === 'Warning' ? 'badge-warning' : 'badge-healthy',
      shortReason: `${asset.failureRisk}% failure probability (${reason})`,
    };
  });

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

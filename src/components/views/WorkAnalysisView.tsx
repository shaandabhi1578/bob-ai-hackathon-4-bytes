import React from 'react';
import {
  BarChart3,
  ListOrdered,
  Clock,
  DollarSign,
  AlertOctagon,
  ShieldCheck,
  TrendingDown,
  ArrowRight,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { WORK_ANALYSIS_METRICS } from '../../data/incidents';

export const WorkAnalysisView: React.FC = () => {
  const { assets, setSelectedAssetId, setActiveTab } = useGrid();

  // Calculated Maintenance Priority Queue: Failure Probability × Grid Impact × Weather Risk × Criticality
  const rankedQueue = [...assets]
    .map((asset) => {
      const weatherFactor = asset.weatherExposure === 'High' ? 1.4 : asset.weatherExposure === 'Medium' ? 1.1 : 0.9;
      const score = Math.round(
        (asset.failureRisk / 100) *
          (asset.gridImpactCustomers / 1000) *
          weatherFactor *
          (asset.healthScore < 50 ? 1.5 : 1.0) *
          10
      );
      return {
        ...asset,
        priorityScore: score,
      };
    })
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
          Work & Fleet Reliability Analytics
        </h2>
        <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Operator analytical workspace: incident patterns, maintenance backlog ratios, and multi-factor work prioritization.
        </p>
      </div>

      {/* Top 4 KPI Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="control-card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Fleet Incidents (12 Mo)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.2rem' }}>
            {WORK_ANALYSIS_METRICS.totalFailures12Mo}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            ↓ 14% vs previous trailing 12 months
          </div>
        </div>

        <div className="control-card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Mean Time to Repair (MTTR)
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.2rem' }}>
            {WORK_ANALYSIS_METRICS.avgRepairTimeHours}h
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Avg outage clearance duration
          </div>
        </div>

        <div className="control-card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Preventive vs Emergency Ratio
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.2rem' }}>
            {WORK_ANALYSIS_METRICS.preventiveMaintenancePct}% <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {WORK_ANALYSIS_METRICS.emergencyMaintenancePct}%</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: '#16a34a', marginTop: '0.2rem' }}>
            Exceeds 65% target benchmark
          </div>
        </div>

        <div className="control-card" style={{ padding: '1.1rem' }}>
          <div style={{ fontSize: '0.74rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Avg Work Order Cost
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a', marginTop: '0.2rem' }}>
            ${WORK_ANALYSIS_METRICS.avgMaintenanceCostUSD.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
            Including crane & oil dehydration
          </div>
        </div>
      </div>

      {/* SECTION 12: PRIORITIZED MAINTENANCE PLAN (Maintenance Priority Queue) */}
      <div className="control-card">
        <div className="control-card-header">
          <div className="control-card-title">
            <ListOrdered size={16} color="#2563eb" />
            <span>Automated Maintenance Priority Queue</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Ranked by: Failure Probability × Grid Impact × Weather Risk × Asset Criticality
          </span>
        </div>

        <div className="control-card-body" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Rank</th>
                  <th>Asset & Location</th>
                  <th>Failure Risk</th>
                  <th>Customers Affected</th>
                  <th>Weather Exposure</th>
                  <th>Recommended Maintenance</th>
                  <th>Current State</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rankedQueue.slice(0, 6).map((asset, index) => (
                  <tr
                    key={asset.id}
                    style={{
                      backgroundColor: index === 0 ? '#fffafa' : index === 1 ? '#fffdf7' : 'transparent',
                    }}
                  >
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '0.82rem',
                          fontFamily: 'var(--font-mono)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px',
                          backgroundColor: index === 0 ? '#dc2626' : index === 1 ? '#d97706' : '#f1f5f9',
                          color: index <= 1 ? '#ffffff' : '#334155',
                        }}
                      >
                        P{index + 1}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{asset.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{asset.substation}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <span
                        style={{
                          color: asset.failureRisk >= 80 ? '#dc2626' : asset.failureRisk >= 50 ? '#d97706' : '#16a34a',
                        }}
                      >
                        {asset.failureRisk}%
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {asset.gridImpactCustomers.toLocaleString()}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          asset.weatherExposure === 'High'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {asset.weatherExposure} Risk
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: '#1e293b' }}>
                      {asset.recommendedAction}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          asset.assignedCrewId
                            ? 'badge-healthy'
                            : asset.status === 'Critical'
                            ? 'badge-critical'
                            : 'badge-warning'
                        }`}
                      >
                        {asset.assignedCrewId ? `${asset.assignedCrewId} Dispatched` : asset.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => {
                          setSelectedAssetId(asset.id);
                          setActiveTab('crew-management');
                        }}
                        className="btn-primary btn-sm"
                        style={{ fontSize: '0.74rem' }}
                      >
                        <span>Dispatch Crew</span>
                        <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Maintenance Backlog & Historical Patterns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Left: Overdue Assets & Backlog */}
        <div className="control-card">
          <div className="control-card-header">
            <div className="control-card-title">
              <Clock size={16} color="#d97706" />
              <span>Overdue Maintenance Backlog ({WORK_ANALYSIS_METRICS.overdueAssetsCount} Units)</span>
            </div>
            <span className="badge badge-warning">Action Required</span>
          </div>

          <div className="control-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {WORK_ANALYSIS_METRICS.overdueAssets.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem',
                  border: '1px solid #e2e8f0',
                  borderRadius: '6px',
                  background: '#f8fafc',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.84rem', color: '#0f172a' }}>{item.asset}</div>
                  <div style={{ fontSize: '0.74rem', color: '#dc2626', marginTop: '0.1rem' }}>{item.overdueBy}</div>
                </div>
                <button
                  onClick={() => {
                    setSelectedAssetId(item.id);
                    setActiveTab('failure-prediction');
                  }}
                  className="btn-secondary btn-sm"
                >
                  Inspect
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Root Cause Breakdown */}
        <div className="control-card">
          <div className="control-card-header">
            <div className="control-card-title">
              <BarChart3 size={16} color="#2563eb" />
              <span>Historical Failure Classification</span>
            </div>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Last 18 Recorded Trips</span>
          </div>

          <div className="control-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {[
              { type: 'Insulation Breakdown & Thermal Overheating', pct: 44, color: '#dc2626' },
              { type: 'SF6 Breaker Seal & Depressurization', pct: 24, color: '#f59e0b' },
              { type: 'Lightning / Galloping Line Flashover', pct: 18, color: '#2563eb' },
              { type: 'Tap-Changer Mechanical Stalling', pct: 14, color: '#64748b' },
            ].map((f) => (
              <div key={f.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.25rem' }}>
                  <span style={{ color: '#334155' }}>{f.type}</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{f.pct}%</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.pct}%`, background: f.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

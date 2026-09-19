import React from 'react';
import { SummaryCards } from '../dashboard/SummaryCards';
import { RealLeafletMap } from '../dashboard/RealLeafletMap';
import { CriticalAlertsPanel } from '../dashboard/CriticalAlertsPanel';
import { ArrowUpRight, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const DashboardView: React.FC = () => {
  const {
    setActiveTab,
    setSelectedAssetId,
    assets,
    gridHealthScore,
    criticalAssetsCount,
    activeWeatherRegion,
    nearestCrewToSelected,
  } = useGrid();

  // Dynamically find the highest-risk asset in the fleet
  const topRiskAsset = assets.reduce(
    (max, a) => (a.failureRisk > max.failureRisk ? a : max),
    assets[0]
  );

  return (
    <div className="page-content">
      {/* Admin Risk Broadcast Banner */}
      {criticalAssetsCount > 0 && topRiskAsset && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '0.85rem 1.25rem',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '0.75rem',
            boxShadow: '0 2px 6px rgba(220, 38, 38, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertTriangle size={18} color="#dc2626" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#991b1b' }}>
                ADMIN BROADCAST: {criticalAssetsCount} {criticalAssetsCount === 1 ? 'Asset is' : 'Assets are'} Operating at High Risk of Failure
              </div>
              <div style={{ fontSize: '0.74rem', color: '#7f1d1d' }}>
                Primary threat: <strong>{topRiskAsset.name}</strong> ({topRiskAsset.substation}) at <strong>{topRiskAsset.failureRisk}% probability</strong>. Upstream hospitals and municipal facilities monitored on map.
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={() => {
                setSelectedAssetId(topRiskAsset.id);
                setActiveTab('failure-prediction');
              }}
              className="btn-secondary btn-sm"
              style={{ background: '#ffffff', borderColor: '#fca5a5', color: '#991b1b', fontWeight: 600 }}
            >
              Analyze Prediction
            </button>
            <button
              onClick={() => {
                setSelectedAssetId(topRiskAsset.id);
                setActiveTab('crew-management');
              }}
              className="btn-primary btn-sm"
              style={{ background: '#dc2626', borderColor: '#dc2626' }}
            >
              Dispatch Crew
            </button>
          </div>
        </div>
      )}

      {/* 4 Summary Cards */}
      <SummaryCards />

      {/* Center Interactive Real Geospatial Leaflet Grid Map */}
      <RealLeafletMap />

      {/* Critical Alerts Panel (Top 3 most important) */}
      <CriticalAlertsPanel />

      {/* Operator Strategic Overview Strip */}
      <div
        style={{
          marginTop: '1.25rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1.25rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Fleet Reliability Status
          </div>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: gridHealthScore >= 80 ? '#16a34a' : '#d97706',
              marginTop: '0.2rem',
            }}
          >
            {gridHealthScore}% Fleet Stability
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
            Nominal voltage across 400kV corridors.
          </div>
        </div>

        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Highest Risk Substation
          </div>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: topRiskAsset.failureRisk >= 80 ? '#dc2626' : '#d97706',
              marginTop: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              setSelectedAssetId(topRiskAsset.id);
              setActiveTab('failure-prediction');
            }}
            title="Open failure prediction"
          >
            {topRiskAsset.substation} ({topRiskAsset.name})
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
            Thermal ramp detected • {topRiskAsset.failureRisk}% probability.
          </div>
        </div>

        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Active Weather Vector
          </div>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#dc2626' : '#0f172a',
              marginTop: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              setActiveTab('weather');
            }}
            title="Open weather portal"
          >
            {activeWeatherRegion.name} ({activeWeatherRegion.condition})
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
            Wind: {activeWeatherRegion.windSpeed} km/h • Rain: {activeWeatherRegion.rainfallProb}%.
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Recommended Field Action
          </div>
          <div
            style={{
              fontSize: '0.88rem',
              fontWeight: 700,
              color: '#2563eb',
              marginTop: '0.2rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
            }}
            onClick={() => {
              setSelectedAssetId(topRiskAsset.id);
              setActiveTab('crew-management');
            }}
          >
            <span>
              {topRiskAsset.assignedCrewId
                ? `${topRiskAsset.assignedCrewId} Assigned on-site`
                : nearestCrewToSelected.crew
                ? `Dispatch ${nearestCrewToSelected.crew.id}`
                : `Inspect ${topRiskAsset.id}`}
            </span>
            <ArrowUpRight size={13} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.15rem' }}>
            {topRiskAsset.assignedCrewId
              ? `Work order active on ${topRiskAsset.id}.`
              : nearestCrewToSelected.crew
              ? `Staged ${nearestCrewToSelected.distanceKm} km away (${nearestCrewToSelected.etaMinutes} min ETA).`
              : 'Standby mode.'}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { SummaryCards } from '../dashboard/SummaryCards';
import { RealLeafletMap } from '../dashboard/RealLeafletMap';
import { CriticalAlertsPanel } from '../dashboard/CriticalAlertsPanel';
import { ArrowUpRight } from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const DashboardView: React.FC = () => {
  const {
    setActiveTab,
    setSelectedAssetId,
    assets,
    gridHealthScore,
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
      {/* 4 Summary Cards */}
      <SummaryCards />

      {/* Center Interactive Real Geospatial Leaflet Grid Map */}
      <RealLeafletMap />

      {/* Critical Alerts Panel (Top 3 most important) */}
      <CriticalAlertsPanel />

      {/* Operator Quick Reference Strip (Dynamically Answers the 4 essential SCADA questions) */}
      <div
        style={{
          marginTop: '1.25rem',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '1rem 1.25rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            1. Is the grid healthy?
          </div>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: gridHealthScore >= 80 ? '#16a34a' : gridHealthScore >= 60 ? '#d97706' : '#dc2626',
              marginTop: '0.2rem',
            }}
          >
            {gridHealthScore >= 80 ? 'Yes' : 'Elevated Stress'} ({gridHealthScore}% Fleet Stability)
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
            {gridHealthScore >= 80 ? 'Nominal voltage across 400kV corridor.' : 'Active thermal & weather degradation.'}
          </div>
        </div>

        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            2. Where is the biggest problem?
          </div>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: topRiskAsset.failureRisk >= 80 ? '#dc2626' : '#d97706',
              marginTop: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              setSelectedAssetId(topRiskAsset.id);
              setActiveTab('failure-prediction');
            }}
            title="Open failure prediction for highest risk asset"
          >
            {topRiskAsset.substation}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
            {topRiskAsset.name} ({topRiskAsset.failureRisk}% failure probability).
          </div>
        </div>

        <div style={{ borderRight: '1px solid #f1f5f9', paddingRight: '0.75rem' }}>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            3. What needs attention right now?
          </div>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              color: activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#dc2626' : '#d97706',
              marginTop: '0.2rem',
              cursor: 'pointer',
            }}
            onClick={() => {
              setActiveTab('weather');
            }}
            title="Open weather portal"
          >
            {activeWeatherRegion.condition}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
            {activeWeatherRegion.name}: {activeWeatherRegion.windSpeed} km/h • {activeWeatherRegion.rainfallProb}% rain.
          </div>
        </div>

        <div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            4. What should I do next?
          </div>
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
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
                ? `Manage ${topRiskAsset.assignedCrewId} on ${topRiskAsset.id}`
                : nearestCrewToSelected.crew
                ? `Dispatch ${nearestCrewToSelected.crew.id} to ${topRiskAsset.id}`
                : `Inspect ${topRiskAsset.id} (All Units Busy)`}
            </span>
            <ArrowUpRight size={13} />
          </div>
          <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
            {topRiskAsset.assignedCrewId
              ? `Unit ${topRiskAsset.assignedCrewId} active on-site.`
              : nearestCrewToSelected.crew
              ? `Nearest unit staged ${nearestCrewToSelected.distanceKm} km away (${nearestCrewToSelected.etaMinutes} min ETA).`
              : 'Zero units currently available in depot.'}
          </div>
        </div>
      </div>
    </div>
  );
};

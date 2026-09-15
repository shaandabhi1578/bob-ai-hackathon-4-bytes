import React from 'react';
import {
  Activity,
  AlertTriangle,
  AlertOctagon,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const SummaryCards: React.FC = () => {
  const {
    gridHealthScore,
    atRiskAssetsCount,
    criticalAssetsCount,
    availableCrewsCount,
    totalCrewsCount,
    setActiveTab,
  } = useGrid();

  return (
    <div className="summary-cards-grid">
      {/* 1. Grid Health */}
      <div
        className="summary-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('asset-health')}
      >
        <div>
          <div className="summary-card-label">Grid Health</div>
          <div className="summary-card-value">{gridHealthScore}%</div>
          <div className="summary-card-sub" style={{ color: '#16a34a' }}>
            <CheckCircle2 size={13} color="#16a34a" />
            <span>Healthy baseline operating range</span>
          </div>
        </div>
        <div
          className="summary-card-icon"
          style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}
        >
          <Activity size={18} />
        </div>
      </div>

      {/* 2. At-Risk Assets */}
      <div
        className="summary-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('asset-health')}
      >
        <div>
          <div className="summary-card-label">At-Risk Assets</div>
          <div className="summary-card-value">{atRiskAssetsCount}</div>
          <div className="summary-card-sub">
            <span>2 Critical • 5 Advisory Warning</span>
          </div>
        </div>
        <div
          className="summary-card-icon"
          style={{ backgroundColor: '#fffbeb', color: '#d97706' }}
        >
          <AlertTriangle size={18} />
        </div>
      </div>

      {/* 3. Critical Assets */}
      <div
        className="summary-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('failure-prediction')}
      >
        <div>
          <div className="summary-card-label">Critical Assets</div>
          <div
            className="summary-card-value"
            style={{ color: '#dc2626' }}
          >
            {criticalAssetsCount}
          </div>
          <div className="summary-card-sub" style={{ color: '#991b1b' }}>
            <span>T-104 (87%) & T-208 (81%)</span>
          </div>
        </div>
        <div
          className="summary-card-icon"
          style={{ backgroundColor: '#fef2f2', color: '#dc2626' }}
        >
          <AlertOctagon size={18} />
        </div>
      </div>

      {/* 4. Active Crews */}
      <div
        className="summary-card"
        style={{ cursor: 'pointer' }}
        onClick={() => setActiveTab('crew-management')}
      >
        <div>
          <div className="summary-card-label">Active Crews</div>
          <div className="summary-card-value">
            {availableCrewsCount} <span style={{ fontSize: '1.1rem', color: '#64748b', fontWeight: 400 }}>/ {totalCrewsCount}</span>
          </div>
          <div className="summary-card-sub">
            <span>{availableCrewsCount} Available • {totalCrewsCount - availableCrewsCount} Assigned/Standby</span>
          </div>
        </div>
        <div
          className="summary-card-icon"
          style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}
        >
          <Users size={18} />
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Layers,
  CloudRain,
  Users,
  Maximize2,
  Navigation,
  ArrowRight,
  ShieldAlert,
  Zap,
  CheckCircle,
  Truck,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { GridAsset } from '../../types';

export const GridRiskMap: React.FC = () => {
  const {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    crews,
    setActiveTab,
    assignCrew,
  } = useGrid();

  const [activeAsset, setActiveAsset] = useState<GridAsset | null>(
    assets.find((a) => a.id === selectedAssetId) || assets[0]
  );

  const [showLines, setShowLines] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(true);
  const [showCrews, setShowCrews] = useState(true);
  const [filterType, setFilterType] = useState<'All' | 'Critical' | 'Warning' | 'Healthy'>('All');

  const filteredAssets = assets.filter((a) => {
    if (filterType === 'All') return true;
    return a.status === filterType;
  });

  const handleAssetClick = (asset: GridAsset) => {
    setActiveAsset(asset);
    setSelectedAssetId(asset.id);
  };

  // Transmission line links connecting coordinates
  const transmissionLines = [
    { from: { x: 28, y: 34 }, to: { x: 38, y: 48 }, kv: 400, name: 'TL-400A Sabarmati - Vastrapur' },
    { from: { x: 38, y: 48 }, to: { x: 68, y: 62 }, kv: 220, name: 'TL-220B Vastrapur - Vastral' },
    { from: { x: 28, y: 34 }, to: { x: 62, y: 16 }, kv: 220, name: 'TL-220C Sabarmati - Gandhinagar' },
    { from: { x: 28, y: 34 }, to: { x: 14, y: 72 }, kv: 220, name: 'TL-220D Sabarmati - Sanand GIDC' },
    { from: { x: 14, y: 72 }, to: { x: 20, y: 56 }, kv: 132, name: 'TL-132E Sanand - Bopal' },
    { from: { x: 20, y: 56 }, to: { x: 38, y: 48 }, kv: 132, name: 'TL-132F Bopal - Vastrapur' },
    { from: { x: 68, y: 62 }, to: { x: 78, y: 42 }, kv: 132, name: 'TL-132G Vastral - Naroda' },
    { from: { x: 78, y: 42 }, to: { x: 74, y: 12 }, kv: 132, name: 'TL-132H Naroda - Sector 10' },
    { from: { x: 38, y: 48 }, to: { x: 42, y: 78 }, kv: 220, name: 'TL-220J Vastrapur - Vadodara Link' },
  ];

  return (
    <div className="control-card" style={{ height: '620px', display: 'flex', flexDirection: 'column' }}>
      {/* Map Control Bar */}
      <div className="control-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div className="control-card-title">
            <Navigation size={16} color="#2563eb" />
            <span>Interactive Grid Risk Topology & Telemetry Map</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Gujarat Western Load Region • Real-time Feeder Overlay
          </span>
        </div>

        {/* Map Layer Filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.15rem', borderRadius: '6px' }}>
            {(['All', 'Critical', 'Warning', 'Healthy'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                style={{
                  fontSize: '0.72rem',
                  fontWeight: filterType === t ? 600 : 400,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: filterType === t ? '#ffffff' : 'transparent',
                  color: filterType === t ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: filterType === t ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowWeatherOverlay(!showWeatherOverlay)}
            className="btn-secondary btn-sm"
            style={{
              background: showWeatherOverlay ? '#eff6ff' : '#ffffff',
              borderColor: showWeatherOverlay ? '#93c5fd' : '#cbd5e1',
              color: showWeatherOverlay ? '#1e40af' : '#475569',
            }}
            title="Toggle Weather Radar Overlay"
          >
            <CloudRain size={13} />
            <span>Storm Radar</span>
          </button>

          <button
            onClick={() => setShowCrews(!showCrews)}
            className="btn-secondary btn-sm"
            style={{
              background: showCrews ? '#eff6ff' : '#ffffff',
              borderColor: showCrews ? '#93c5fd' : '#cbd5e1',
              color: showCrews ? '#1e40af' : '#475569',
            }}
            title="Toggle Crew Vehicle Units"
          >
            <Truck size={13} />
            <span>Crews</span>
          </button>

          <button
            onClick={() => setShowLines(!showLines)}
            className="btn-secondary btn-sm"
            style={{
              background: showLines ? '#eff6ff' : '#ffffff',
              borderColor: showLines ? '#93c5fd' : '#cbd5e1',
              color: showLines ? '#1e40af' : '#475569',
            }}
            title="Toggle Transmission Line Traces"
          >
            <Layers size={13} />
            <span>Lines</span>
          </button>
        </div>
      </div>

      {/* Map Surface & Compact Overlay Panel */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', backgroundColor: '#f8fafc' }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '100%', cursor: 'grab' }}
        >
          <defs>
            {/* Grid background pattern */}
            <pattern id="grid-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e2e8f0" strokeWidth="0.35" />
            </pattern>

            {/* Weather storm gradient */}
            <radialGradient id="storm-radar" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#3b82f6" stopOpacity="0.22" />
              <stop offset="85%" stopColor="#3b82f6" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Clean Engineering Grid */}
          <rect width="100" height="100" fill="#fcfdfd" />
          <rect width="100" height="100" fill="url(#grid-pattern)" />

          {/* Regional Geographic River & Boundary Indicators */}
          <path
            d="M 22,0 C 26,20 32,35 34,50 C 36,65 42,85 45,100"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="1.2"
            strokeDasharray="2 1"
          />
          <text x="35" y="88" fill="#94a3b8" fontSize="1.8" fontFamily="var(--font-mono)">
            Sabarmati River Basin
          </text>
          <text x="5" y="8" fill="#94a3b8" fontSize="2.0" fontWeight="600">
            GUJARAT GRID CONTROL • AHMEDABAD METRO CORRIDOR
          </text>

          {/* Weather Storm Front Zone Overlay */}
          {showWeatherOverlay && (
            <g>
              <ellipse
                cx="30"
                cy="32"
                rx="24"
                ry="18"
                fill="url(#storm-radar)"
              />
              <path
                d="M 10,22 Q 28,18 48,28 Q 54,34 38,44 Z"
                fill="#f59e0b"
                fillOpacity="0.08"
                stroke="#f59e0b"
                strokeWidth="0.4"
                strokeDasharray="1.5 1.5"
              />
              <text x="14" y="26" fill="#b45309" fontSize="1.8" fontWeight="600" fontFamily="var(--font-mono)">
                ⛈ SEVERE STORM CELL (48 km/h Gusts)
              </text>
            </g>
          )}

          {/* High Voltage Transmission Lines */}
          {showLines &&
            transmissionLines.map((line, idx) => (
              <g key={idx}>
                <line
                  x1={line.from.x}
                  y1={line.from.y}
                  x2={line.to.x}
                  y2={line.to.y}
                  stroke={line.kv === 400 ? '#64748b' : line.kv === 220 ? '#94a3b8' : '#cbd5e1'}
                  strokeWidth={line.kv === 400 ? 0.7 : 0.45}
                  strokeDasharray={line.kv === 400 ? 'none' : '2 1'}
                />
              </g>
            ))}

          {/* Crew Units Markers */}
          {showCrews &&
            crews
              .filter((c) => c.status === 'Available' || c.status === 'Assigned')
              .map((crew) => {
                const isAssigned = crew.status === 'Assigned';
                return (
                  <g
                    key={crew.id}
                    transform={`translate(${crew.coordinates.x}, ${crew.coordinates.y})`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setActiveTab('crew-management');
                    }}
                  >
                    <circle
                      r="1.6"
                      fill={isAssigned ? '#f59e0b' : '#2563eb'}
                      stroke="#ffffff"
                      strokeWidth="0.4"
                    />
                    <text
                      x="2.4"
                      y="0.6"
                      fill="#1e293b"
                      fontSize="1.6"
                      fontWeight="600"
                      fontFamily="var(--font-mono)"
                    >
                      {crew.id}
                    </text>
                  </g>
                );
              })}

          {/* Grid Assets Pins */}
          {filteredAssets.map((asset) => {
            const isSelected = activeAsset?.id === asset.id;
            const isCritical = asset.status === 'Critical';
            const isWarning = asset.status === 'Warning';
            const pinColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#16a34a';

            return (
              <g
                key={asset.id}
                transform={`translate(${asset.coordinates.x}, ${asset.coordinates.y})`}
                onClick={() => handleAssetClick(asset)}
                style={{ cursor: 'pointer' }}
              >
                {/* Pulse ring for critical failure assets (T-104, T-208) */}
                {isCritical && (
                  <circle
                    r="4.2"
                    fill="none"
                    stroke="#dc2626"
                    strokeWidth="0.5"
                    className="map-pulse"
                  />
                )}

                {/* Selection halo */}
                {isSelected && (
                  <circle
                    r="3.2"
                    fill="none"
                    stroke="#0f172a"
                    strokeWidth="0.6"
                    strokeDasharray="1 0.8"
                  />
                )}

                {/* Main pin body */}
                <circle
                  r="2.0"
                  fill={pinColor}
                  stroke="#ffffff"
                  strokeWidth="0.5"
                />

                {/* Asset Label */}
                <text
                  x="2.8"
                  y="0.7"
                  fill="#0f172a"
                  fontSize="2.0"
                  fontWeight={isSelected || isCritical ? '700' : '500'}
                  fontFamily="var(--font-mono)"
                >
                  {asset.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay at Bottom-Left */}
        <div
          style={{
            position: 'absolute',
            bottom: '1rem',
            left: '1rem',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(4px)',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
            padding: '0.6rem 0.85rem',
            fontSize: '0.72rem',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.35rem',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.1rem' }}>Map Legend</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#dc2626' }} />
            <span>Critical Asset (High Failure Risk)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706' }} />
            <span>Warning (Elevated Risk)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16a34a' }} />
            <span>Healthy (Nominal Operations)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
            <span>Maintenance Crew Vehicle</span>
          </div>
        </div>

        {/* Compact Asset Information Panel (Floating Right Side of Map) */}
        {activeAsset && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              width: '320px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              boxShadow: 'var(--shadow-md)',
              padding: '1.1rem',
              zIndex: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a' }}>
                  {activeAsset.name}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                  {activeAsset.substation}
                </div>
              </div>
              <span
                className={`badge ${
                  activeAsset.status === 'Critical'
                    ? 'badge-critical'
                    : activeAsset.status === 'Warning'
                    ? 'badge-warning'
                    : 'badge-healthy'
                }`}
              >
                {activeAsset.status}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.9rem', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '0.75rem 0' }}>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Failure Risk</div>
                <div
                  style={{
                    fontSize: '1.4rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    color: activeAsset.failureRisk >= 80 ? '#dc2626' : activeAsset.failureRisk >= 50 ? '#d97706' : '#16a34a',
                  }}
                >
                  {activeAsset.failureRisk}%
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Predicted Failure</div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a', marginTop: '0.2rem' }}>
                  {activeAsset.predictedFailureWindow}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Grid Impact</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  {activeAsset.gridImpactCustomers.toLocaleString()} customers
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>Health Score</div>
                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                  {activeAsset.healthScore} / 100
                </div>
              </div>
            </div>

            {/* Recommended Action */}
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                Recommended Action
              </div>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: activeAsset.status === 'Critical' ? '#991b1b' : '#334155',
                  background: activeAsset.status === 'Critical' ? '#fef2f2' : '#f8fafc',
                  padding: '0.5rem 0.65rem',
                  borderRadius: '4px',
                  border: `1px solid ${activeAsset.status === 'Critical' ? '#fecaca' : '#e2e8f0'}`,
                }}
              >
                {activeAsset.recommendedAction}
              </div>
            </div>

            {/* Navigation Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <button
                onClick={() => {
                  setSelectedAssetId(activeAsset.id);
                  setActiveTab('failure-prediction');
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
              >
                <span>View AI Failure Prediction</span>
                <ArrowRight size={14} />
              </button>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => {
                    setSelectedAssetId(activeAsset.id);
                    setActiveTab('asset-health');
                  }}
                  className="btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span>Sensor Telemetry</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedAssetId(activeAsset.id);
                    setActiveTab('crew-management');
                  }}
                  className="btn-secondary btn-sm"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <span>Dispatch Crew</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

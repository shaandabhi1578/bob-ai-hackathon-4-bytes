import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Activity,
  ArrowUpDown,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Cpu,
  Clock,
  Layers,
  Thermometer,
  Gauge,
  Droplets,
  Zap,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { GridAsset, AssetType, AssetStatus } from '../../types';
import { generateSensorHistory, SENSOR_THRESHOLDS } from '../../data/sensors';

export const AssetHealthView: React.FC = () => {
  const {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    setActiveTab,
  } = useGrid();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sortField, setSortField] = useState<keyof GridAsset>('failureRisk');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sensor Telemetry time range
  const [sensorTimeframe, setSensorTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d');
  const [activeMetric, setActiveMetric] = useState<
    'temperature' | 'vibration' | 'oilQualityIndex' | 'partialDischarge' | 'load'
  >('temperature');

  // Filtered and sorted assets
  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        const matchesSearch =
          a.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
          a.substation.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
        const matchesType = typeFilter === 'ALL' || a.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'desc' ? valB - valA : valA - valB;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'desc'
            ? valB.localeCompare(valA)
            : valA.localeCompare(valB);
        }
        return 0;
      });
  }, [assets, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  // Sensor data for currently selected asset
  const sensorData = useMemo(() => {
    return generateSensorHistory(selectedAssetId, sensorTimeframe);
  }, [selectedAssetId, sensorTimeframe]);

  const handleSort = (field: keyof GridAsset) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Sensor chart calculations
  const threshold = SENSOR_THRESHOLDS[activeMetric];
  const metricValues = sensorData.map((pt) => pt[activeMetric]);
  const minVal = Math.min(...metricValues, threshold.normalMax * 0.7);
  const maxVal = Math.max(...metricValues, threshold.criticalMax * 1.1);
  const range = maxVal - minVal || 1;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Asset Health & Condition Monitoring
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Real-time fleet telemetry, diagnostic threshold deviations, and failure risk indices.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setActiveTab('failure-prediction')}
            className="btn-primary btn-sm"
          >
            <span>Run AI Prediction Engine</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {/* Asset Table Card */}
      <div className="control-card">
        <div className="control-card-header">
          {/* Search & Filters */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '10px', top: '9px' }}
              />
              <input
                type="text"
                placeholder="Search Asset ID, Substation, Feeder..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.8rem' }}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '0.15rem' }}>
              {(['ALL', 'Critical', 'Warning', 'Healthy'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: statusFilter === st ? 600 : 400,
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: statusFilter === st ? '#ffffff' : 'transparent',
                    color: statusFilter === st ? '#0f172a' : '#64748b',
                    cursor: 'pointer',
                    boxShadow: statusFilter === st ? 'var(--shadow-sm)' : 'none',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ width: '160px', height: '34px', fontSize: '0.78rem' }}
            >
              <option value="ALL">All Asset Types</option>
              <option value="Transformer">Transformers</option>
              <option value="Substation">Substations</option>
              <option value="Circuit Breaker">Circuit Breakers</option>
              <option value="Transmission Line">Transmission Lines</option>
              <option value="Disconnect Switch">Disconnect Switches</option>
            </select>
          </div>

          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            Showing {filteredAssets.length} of {assets.length} grid assets
          </span>
        </div>

        {/* Data Table */}
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('id')} style={{ cursor: 'pointer' }}>
                  Asset ID <ArrowUpDown size={11} style={{ display: 'inline' }} />
                </th>
                <th onClick={() => handleSort('type')} style={{ cursor: 'pointer' }}>
                  Asset Type
                </th>
                <th>Substation / Location</th>
                <th onClick={() => handleSort('healthScore')} style={{ cursor: 'pointer' }}>
                  Health Score
                </th>
                <th onClick={() => handleSort('failureRisk')} style={{ cursor: 'pointer' }}>
                  Failure Risk <ArrowUpDown size={11} style={{ display: 'inline' }} />
                </th>
                <th onClick={() => handleSort('temperature')} style={{ cursor: 'pointer' }}>
                  Temp
                </th>
                <th>Vibration</th>
                <th>Oil Quality</th>
                <th>Last Maint.</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssets.map((asset) => {
                const isSelected = selectedAssetId === asset.id;
                return (
                  <tr
                    key={asset.id}
                    className={isSelected ? 'selected' : ''}
                    onClick={() => setSelectedAssetId(asset.id)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {asset.id}
                    </td>
                    <td>{asset.type}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{asset.location}</div>
                      <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{asset.substation}</div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      <span
                        style={{
                          color:
                            asset.healthScore < 50
                              ? '#dc2626'
                              : asset.healthScore < 75
                              ? '#d97706'
                              : '#16a34a',
                        }}
                      >
                        {asset.healthScore}
                      </span>
                      <span style={{ color: '#94a3b8', fontSize: '0.7rem' }}> / 100</span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      <span
                        style={{
                          color:
                            asset.failureRisk >= 80
                              ? '#dc2626'
                              : asset.failureRisk >= 50
                              ? '#d97706'
                              : '#16a34a',
                        }}
                      >
                        {asset.failureRisk}%
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span
                        style={{
                          color: asset.temperature >= 85 ? '#dc2626' : asset.temperature >= 75 ? '#d97706' : '#0f172a',
                          fontWeight: asset.temperature >= 85 ? 700 : 400,
                        }}
                      >
                        {asset.temperature}°C
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      <span
                        style={{
                          color: asset.vibration >= 4.0 ? '#dc2626' : asset.vibration >= 2.5 ? '#d97706' : '#0f172a',
                          fontWeight: asset.vibration >= 4.0 ? 700 : 400,
                        }}
                      >
                        {asset.vibration} mm/s
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          asset.oilQuality === 'Poor' || asset.oilQuality === 'Critical'
                            ? 'badge-critical'
                            : asset.oilQuality === 'Moderate'
                            ? 'badge-warning'
                            : 'badge-healthy'
                        }`}
                      >
                        {asset.oilQuality}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {asset.lastMaintenance}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          asset.status === 'Critical'
                            ? 'badge-critical'
                            : asset.status === 'Warning'
                            ? 'badge-warning'
                            : 'badge-healthy'
                        }`}
                      >
                        {asset.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAssetId(asset.id);
                          setActiveTab('failure-prediction');
                        }}
                        className="btn-secondary btn-sm"
                        style={{ fontSize: '0.72rem' }}
                      >
                        <span>Analyze</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SENSOR DATA VIEW: Historical Telemetry Deep Dive */}
      <div className="control-card">
        <div className="control-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div className="control-card-title">
              <Activity size={16} color="#2563eb" />
              <span>Live Sensor Telemetry — {selectedAsset.name} ({selectedAsset.substation})</span>
            </div>
            <span
              className={`badge ${
                selectedAsset.status === 'Critical'
                  ? 'badge-critical'
                  : selectedAsset.status === 'Warning'
                  ? 'badge-warning'
                  : 'badge-healthy'
              }`}
            >
              {selectedAsset.status}
            </span>
          </div>

          {/* Time Range Selector */}
          <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '0.15rem' }}>
            {(['24h', '7d', '30d', '90d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setSensorTimeframe(tf)}
                style={{
                  fontSize: '0.74rem',
                  fontWeight: sensorTimeframe === tf ? 600 : 400,
                  padding: '0.25rem 0.75rem',
                  borderRadius: '4px',
                  border: 'none',
                  background: sensorTimeframe === tf ? '#ffffff' : 'transparent',
                  color: sensorTimeframe === tf ? '#0f172a' : '#64748b',
                  cursor: 'pointer',
                  boxShadow: sensorTimeframe === tf ? 'var(--shadow-sm)' : 'none',
                }}
              >
                Last {tf}
              </button>
            ))}
          </div>
        </div>

        <div className="control-card-body">
          {/* Sensor Tabs for Quick Switching */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {[
              { id: 'temperature', label: 'Winding Temp', val: `${selectedAsset.temperature}°C`, isWarn: selectedAsset.temperature >= 85 },
              { id: 'vibration', label: 'Core Vibration', val: `${selectedAsset.vibration} mm/s`, isWarn: selectedAsset.vibration >= 4.0 },
              { id: 'oilQualityIndex', label: 'DGA Oil Index', val: `${selectedAsset.oilQuality}`, isWarn: selectedAsset.oilQuality === 'Poor' },
              { id: 'partialDischarge', label: 'Partial Discharge', val: `${selectedAsset.partialDischarge} pC`, isWarn: selectedAsset.partialDischarge > 200 },
              { id: 'load', label: 'Load Capacity', val: `${selectedAsset.loadPercentage}%`, isWarn: selectedAsset.loadPercentage > 85 },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setActiveMetric(m.id as any)}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '6px',
                  border: `1px solid ${activeMetric === m.id ? '#0f172a' : '#e2e8f0'}`,
                  background: activeMetric === m.id ? '#f8fafc' : '#ffffff',
                  textAlign: 'left',
                  cursor: 'pointer',
                  minWidth: '130px',
                }}
              >
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>{m.label}</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: m.isWarn ? '#dc2626' : '#0f172a' }}>
                  {m.val}
                </div>
              </button>
            ))}
          </div>

          {/* Clean Time-Series SVG Chart */}
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '6px', padding: '1rem', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>{threshold.metric} ({threshold.unit})</span>
                <span style={{ fontSize: '0.72rem', color: '#64748b', marginLeft: '0.5rem' }}>• {threshold.description}</span>
              </div>

              {/* Threshold legend */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.72rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '2px', background: '#16a34a' }} />
                  <span>Normal (&lt; {threshold.normalMax} {threshold.unit})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '2px', background: '#d97706' }} />
                  <span>Warning (&gt; {threshold.warningMax} {threshold.unit})</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '12px', height: '2px', background: '#dc2626' }} />
                  <span>Critical (&gt; {threshold.criticalMax} {threshold.unit})</span>
                </div>
              </div>
            </div>

            {/* SVG Chart Rendering */}
            <div style={{ width: '100%', height: '220px', position: 'relative' }}>
              <svg viewBox="0 0 500 160" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                {/* Horizontal reference lines */}
                <line x1="0" y1="40" x2="500" y2="40" stroke="#fecaca" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="80" x2="500" y2="80" stroke="#fde68a" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="120" x2="500" y2="120" stroke="#f1f5f9" strokeWidth="1" />

                {/* Plot trend line */}
                {(() => {
                  const points = sensorData.map((pt, idx) => {
                    const x = (idx / (sensorData.length - 1)) * 500;
                    const val = pt[activeMetric];
                    const y = 140 - ((val - minVal) / range) * 120;
                    return { x, y, val, label: pt.timeLabel };
                  });

                  const pathD = points.reduce((acc, curr, i) => {
                    return i === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
                  }, '');

                  const areaD = `${pathD} L 500 150 L 0 150 Z`;

                  return (
                    <g>
                      <path d={areaD} fill="#eff6ff" fillOpacity="0.4" />
                      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2" />
                      {points.map((p, i) => (
                        <circle
                          key={i}
                          cx={p.x}
                          cy={p.y}
                          r={i === points.length - 1 ? 4 : 2}
                          fill={p.val >= threshold.warningMax ? '#dc2626' : '#2563eb'}
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                      ))}
                    </g>
                  );
                })()}
              </svg>
            </div>

            {/* X-axis timestamps */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
              <span>{sensorData[0]?.timeLabel}</span>
              <span>{sensorData[Math.floor(sensorData.length / 2)]?.timeLabel}</span>
              <span>{sensorData[sensorData.length - 1]?.timeLabel} (Latest Telemetry)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

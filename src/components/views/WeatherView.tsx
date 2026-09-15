import React from 'react';
import {
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Compass,
  ArrowRight,
  ShieldAlert,
  Zap,
  RotateCw,
  Sliders,
  Sparkles,
  MapPin,
  ExternalLink,
  Flame,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { WeatherRegion } from '../../types';

export const WeatherView: React.FC = () => {
  const {
    weatherRegions,
    activeWeatherRegion,
    setActiveWeatherRegionId,
    updateWeatherRegion,
    fetchLiveWeatherForActiveRegion,
    fetchLiveWeatherForAllRegions,
    applyWeatherPreset,
    isWeatherLoading,
    weatherLastSyncedAt,
    assets,
    setSelectedAssetId,
    setActiveTab,
  } = useGrid();

  // Helper to filter assets located in the active region
  const regionalAssets = assets.filter((a) => {
    const loc = a.location.toLowerCase();
    if (activeWeatherRegion.id === 'reg-gn') return loc.includes('gandhinagar') || loc.includes('sachivalaya');
    if (activeWeatherRegion.id === 'reg-vad') return loc.includes('vadodara') || loc.includes('petrochemical');
    if (activeWeatherRegion.id === 'reg-san') return loc.includes('sanand');
    return loc.includes('ahmedabad') || loc.includes('sabarmati') || loc.includes('vastral');
  });

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Region Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              Weather Intelligence & Atmospheric Grid Risk
            </h2>
            <span
              className="badge"
              style={{
                background: '#eff6ff',
                color: '#1d4ed8',
                border: '1px solid #bfdbfe',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
              }}
            >
              <Radio size={11} color="#2563eb" />
              LIVE TELEMETRY
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Real-time Doppler radar vectors, ambient thermal stress, and atmospheric squall correlation across transmission corridors.
          </p>
        </div>

        {/* Region Selector Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {weatherRegions.map((reg) => (
            <button
              key={reg.id}
              onClick={() => setActiveWeatherRegionId(reg.id)}
              className="btn-secondary btn-sm"
              style={{
                borderColor: activeWeatherRegion.id === reg.id ? '#0f172a' : '#cbd5e1',
                backgroundColor: activeWeatherRegion.id === reg.id ? '#f1f5f9' : '#ffffff',
                fontWeight: activeWeatherRegion.id === reg.id ? 700 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <span>{reg.name}</span>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor:
                    reg.gridWeatherRisk === 'HIGH'
                      ? '#dc2626'
                      : reg.gridWeatherRisk === 'MEDIUM'
                      ? '#d97706'
                      : '#16a34a',
                }}
              />
            </button>
          ))}
        </div>
      </div>

      {/* Live Data Sync Bar */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloudLightning size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                Open-Meteo & IMD Doppler Live Meteorological Feed
              </span>
              <span className="badge badge-healthy" style={{ fontSize: '0.66rem' }}>
                ACTIVE SYNCHRONIZER
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.1rem' }}>
              GPS anchor for {activeWeatherRegion.name} • Last synchronized:{' '}
              <strong>{weatherLastSyncedAt || 'Live Simulation Mode'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={fetchLiveWeatherForActiveRegion}
            disabled={isWeatherLoading}
            className="btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Fetch live temperature, wind speed, and rain probability from Open-Meteo"
          >
            <RotateCw size={13} className={isWeatherLoading ? 'spin-anim' : ''} />
            <span>{isWeatherLoading ? 'Syncing...' : 'Fetch Live Weather'}</span>
          </button>

          <button
            onClick={fetchLiveWeatherForAllRegions}
            disabled={isWeatherLoading}
            className="btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            title="Sync all Gujarat transmission regions simultaneously"
          >
            <Zap size={13} color="#2563eb" />
            <span>Sync All Regions</span>
          </button>
        </div>
      </div>

      {/* Severe Weather Warning Banner */}
      {activeWeatherRegion.warningMessage && (
        <div
          style={{
            background: activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#fecaca' : '#fde68a'}`,
            borderRadius: '6px',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertTriangle
            size={18}
            color={activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#dc2626' : '#d97706'}
            style={{ flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: '0.82rem',
                color: activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#991b1b' : '#92400e',
              }}
            >
              Meteorological Advisory — {activeWeatherRegion.name}:{' '}
            </span>
            <span
              style={{
                fontSize: '0.8rem',
                color: activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#7f1d1d' : '#78350f',
              }}
            >
              {activeWeatherRegion.warningMessage}
            </span>
          </div>
          <span
            className={`badge ${
              activeWeatherRegion.gridWeatherRisk === 'HIGH' ? 'badge-critical' : 'badge-warning'
            }`}
          >
            {activeWeatherRegion.gridWeatherRisk} EXPOSURE
          </span>
        </div>
      )}

      {/* Main Meteorological Grid: Radar Map + Live Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '1.25rem' }}>
        {/* Left: Interactive Weather Radar Map Graphic */}
        <div className="control-card">
          <div className="control-card-header">
            <div className="control-card-title">
              <Compass size={16} color="#2563eb" />
              <span>Atmospheric Exposure Map — {activeWeatherRegion.name}</span>
            </div>
            <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
              Doppler reflectivity: {Math.round(20 + activeWeatherRegion.rainfallProb * 0.45)} dBZ
            </span>
          </div>

          <div style={{ height: '320px', background: '#0f172a', position: 'relative', overflow: 'hidden' }}>
            {/* SVG Weather Map Graphic */}
            <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              {/* Radar background grid */}
              <circle cx="50" cy="40" r="14" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              <circle cx="50" cy="40" r="28" fill="none" stroke="#1e293b" strokeWidth="0.5" />
              <circle cx="50" cy="40" r="42" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 1" />
              <line x1="50" y1="0" x2="50" y2="80" stroke="#1e293b" strokeWidth="0.5" />
              <line x1="0" y1="40" x2="100" y2="40" stroke="#1e293b" strokeWidth="0.5" />

              {/* Dynamic Storm Cloud / Thermal Contour based on active state */}
              {activeWeatherRegion.gridWeatherRisk === 'HIGH' ? (
                <>
                  <path
                    d="M 30,22 Q 54,14 72,30 Q 64,56 42,50 Q 24,44 30,22 Z"
                    fill="#dc2626"
                    fillOpacity="0.35"
                    stroke="#ef4444"
                    strokeWidth="0.8"
                  />
                  <path
                    d="M 38,28 Q 54,20 62,34 Q 56,44 42,40 Z"
                    fill="#ef4444"
                    fillOpacity="0.5"
                    stroke="#f87171"
                    strokeWidth="0.6"
                  />
                </>
              ) : activeWeatherRegion.gridWeatherRisk === 'MEDIUM' ? (
                <path
                  d="M 34,26 Q 52,18 66,32 Q 60,52 44,46 Q 30,42 34,26 Z"
                  fill="#f59e0b"
                  fillOpacity="0.3"
                  stroke="#d97706"
                  strokeWidth="0.7"
                />
              ) : (
                <path
                  d="M 38,30 Q 50,26 60,34 Q 56,46 44,42 Q 36,40 38,30 Z"
                  fill="#10b981"
                  fillOpacity="0.2"
                  stroke="#059669"
                  strokeWidth="0.5"
                />
              )}

              {/* Substation markers */}
              <circle cx="48" cy="34" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.5" />
              <text x="52" y="35" fill="#f8fafc" fontSize="2.2" fontWeight="700">
                S-17 Sabarmati 400kV
              </text>

              <circle cx="64" cy="52" r="1.8" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.4" />
              <text x="68" y="53" fill="#cbd5e1" fontSize="2.0">
                S-04 Vastral 220kV
              </text>

              {/* Dynamic Wind Vector Arrow */}
              <path
                d="M 18,64 L 34,48"
                stroke="#60a5fa"
                strokeWidth={activeWeatherRegion.windSpeed > 45 ? '1.2' : '0.8'}
              />
              <polygon points="34,48 29,51 32,54" fill="#60a5fa" />
              <text x="14" y="70" fill="#93c5fd" fontSize="2.0" fontWeight="600">
                Wind {activeWeatherRegion.windSpeed} km/h SW → NE
              </text>
            </svg>

            {/* Float badge */}
            <div
              style={{
                position: 'absolute',
                top: '1rem',
                left: '1rem',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(6px)',
                border: '1px solid #334155',
                borderRadius: '6px',
                padding: '0.6rem 0.9rem',
                fontSize: '0.75rem',
                color: '#ffffff',
              }}
            >
              <div style={{ fontWeight: 700, color: '#38bdf8' }}>{activeWeatherRegion.condition}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                Precipitation: {activeWeatherRegion.rainfallProb}% • Lightning: {activeWeatherRegion.lightningRisk}
              </div>
            </div>
          </div>

          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.35rem' }}>
              Grid Asset Operational Impact
            </div>
            <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, margin: 0 }}>
              {activeWeatherRegion.explanation}
            </p>
          </div>
        </div>

        {/* Right: Live Current Weather Metrics & Quick Correlation */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="control-card" style={{ flex: 1 }}>
            <div className="control-card-header">
              <div className="control-card-title">
                <CloudLightning size={16} color="#d97706" />
                <span>Current Sensor Vector</span>
              </div>
              <span
                className={`badge ${
                  activeWeatherRegion.gridWeatherRisk === 'HIGH'
                    ? 'badge-critical'
                    : activeWeatherRegion.gridWeatherRisk === 'MEDIUM'
                    ? 'badge-warning'
                    : 'badge-healthy'
                }`}
              >
                {activeWeatherRegion.gridWeatherRisk} RISK
              </span>
            </div>

            <div className="control-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {/* Rain Probability */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Droplets size={16} color="#2563eb" />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>Precipitation Prob.</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {activeWeatherRegion.rainfallProb}%
                </div>
              </div>

              {/* Surface Wind */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Wind size={16} color="#0891b2" />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>Surface Wind Speed</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {activeWeatherRegion.windSpeed} km/h
                </div>
              </div>

              {/* Ambient Temp */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Thermometer size={16} color="#ea580c" />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>Ambient Temperature</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {activeWeatherRegion.temperature}°C
                </div>
              </div>

              {/* Relative Humidity */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Droplets size={16} color="#6366f1" />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>Relative Humidity</span>
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                  {activeWeatherRegion.humidity}%
                </div>
              </div>

              {/* Lightning Strike Risk */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Zap size={16} color="#eab308" />
                  <span style={{ fontSize: '0.8rem', color: '#475569' }}>Lightning Ground Density</span>
                </div>
                <div
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    color:
                      activeWeatherRegion.lightningRisk === 'Severe'
                        ? '#dc2626'
                        : activeWeatherRegion.lightningRisk === 'High'
                        ? '#ea580c'
                        : '#d97706',
                  }}
                >
                  {activeWeatherRegion.lightningRisk}
                </div>
              </div>

              {/* 1-Click Action */}
              <button
                onClick={() => {
                  setSelectedAssetId('T-104');
                  setActiveTab('failure-prediction');
                }}
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
              >
                <span>Correlate with T-104 Failure Risk</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: INTERACTIVE WEATHER OVERRIDE & SCENARIO SIMULATOR */}
      <div
        className="control-card"
        style={{
          border: '2px solid #2563eb',
          background: '#f8fbff',
        }}
      >
        <div
          className="control-card-header"
          style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={16} color="#2563eb" />
            <span style={{ fontWeight: 700, color: '#1e3a8a' }}>
              Interactive Weather Simulator & Live Grid Ripple Engine
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600 }}>
            Changes immediately recalculate failure risks across SCADA map, AI predictions, and crew recommendations
          </span>
        </div>

        <div className="control-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* 4 Quick Scenario Presets */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.5rem' }}>
              One-Click Atmospheric Scenario Presets:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <button
                onClick={() => applyWeatherPreset('severe-squall')}
                className="btn-secondary"
                style={{
                  justifyContent: 'center',
                  background: '#fef2f2',
                  borderColor: '#fca5a5',
                  color: '#991b1b',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                <Zap size={14} color="#dc2626" />
                <span>⚡ Severe Squall</span>
              </button>

              <button
                onClick={() => applyWeatherPreset('extreme-heatwave')}
                className="btn-secondary"
                style={{
                  justifyContent: 'center',
                  background: '#fff7ed',
                  borderColor: '#fdba74',
                  color: '#9a3412',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                <Flame size={14} color="#ea580c" />
                <span>🔥 Extreme Heatwave</span>
              </button>

              <button
                onClick={() => applyWeatherPreset('monsoon-downpour')}
                className="btn-secondary"
                style={{
                  justifyContent: 'center',
                  background: '#f0f9ff',
                  borderColor: '#7dd3fc',
                  color: '#075985',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                <Droplets size={14} color="#0284c7" />
                <span>⛈️ Monsoon Downpour</span>
              </button>

              <button
                onClick={() => applyWeatherPreset('nominal-clear')}
                className="btn-secondary"
                style={{
                  justifyContent: 'center',
                  background: '#f0fdf4',
                  borderColor: '#86efac',
                  color: '#166534',
                  fontWeight: 600,
                  fontSize: '0.78rem',
                }}
              >
                <CheckCircle2 size={14} color="#16a34a" />
                <span>☀️ Nominal Clear</span>
              </button>
            </div>
          </div>

          {/* Interactive Sliders Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '1rem',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '1rem',
            }}
          >
            {/* Slider 1: Ambient Temperature */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#334155', fontWeight: 600 }}>Ambient Temperature</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: activeWeatherRegion.temperature > 38 ? '#dc2626' : '#0f172a' }}>
                  {activeWeatherRegion.temperature}°C
                </strong>
              </div>
              <input
                type="range"
                min={15}
                max={50}
                step={1}
                value={activeWeatherRegion.temperature}
                onChange={(e) => updateWeatherRegion(activeWeatherRegion.id, { temperature: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#ea580c', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>15°C</span>
                <span>50°C</span>
              </div>
            </div>

            {/* Slider 2: Surface Wind Speed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#334155', fontWeight: 600 }}>Surface Wind Speed</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: activeWeatherRegion.windSpeed > 45 ? '#dc2626' : '#0f172a' }}>
                  {activeWeatherRegion.windSpeed} km/h
                </strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={2}
                value={activeWeatherRegion.windSpeed}
                onChange={(e) => updateWeatherRegion(activeWeatherRegion.id, { windSpeed: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>0 km/h</span>
                <span>100 km/h</span>
              </div>
            </div>

            {/* Slider 3: Precipitation Probability */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#334155', fontWeight: 600 }}>Rain Probability</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: activeWeatherRegion.rainfallProb > 70 ? '#dc2626' : '#0f172a' }}>
                  {activeWeatherRegion.rainfallProb}%
                </strong>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={activeWeatherRegion.rainfallProb}
                onChange={(e) => updateWeatherRegion(activeWeatherRegion.id, { rainfallProb: Number(e.target.value) })}
                style={{ width: '100%', accentColor: '#2563eb', cursor: 'pointer' }}
              />
              <div style={{ fontSize: '0.68rem', color: '#64748b', display: 'flex', justifyContent: 'space-between' }}>
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Select 4: Lightning Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                <span style={{ color: '#334155', fontWeight: 600 }}>Lightning Density</span>
                <strong
                  style={{
                    color:
                      activeWeatherRegion.lightningRisk === 'Severe'
                        ? '#dc2626'
                        : activeWeatherRegion.lightningRisk === 'High'
                        ? '#ea580c'
                        : '#d97706',
                  }}
                >
                  {activeWeatherRegion.lightningRisk}
                </strong>
              </div>
              <select
                value={activeWeatherRegion.lightningRisk}
                onChange={(e) =>
                  updateWeatherRegion(activeWeatherRegion.id, {
                    lightningRisk: e.target.value as WeatherRegion['lightningRisk'],
                  })
                }
                className="form-select"
                style={{ height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Low">Low (&lt; 2 strikes/km²)</option>
                <option value="Moderate">Moderate (2–8 strikes/km²)</option>
                <option value="High">High (8–20 strikes/km²)</option>
                <option value="Severe">Severe (&gt; 20 strikes/km²)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION: AFFECTED REGIONAL TRANSMISSION ASSETS */}
      <div className="control-card">
        <div className="control-card-header">
          <div className="control-card-title">
            <MapPin size={16} color="#0f172a" />
            <span>
              Synchronized Transmission Assets in {activeWeatherRegion.name} ({regionalAssets.length} Units)
            </span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Risk scores recalculate automatically as weather conditions shift
          </span>
        </div>

        <div className="control-card-body" style={{ padding: 0 }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name & Substation</th>
                  <th>Operating Status</th>
                  <th>Total Failure Risk</th>
                  <th>Weather Risk Factor</th>
                  <th>Core Temp</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {regionalAssets.map((asset) => (
                  <tr key={asset.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#0f172a' }}>
                      {asset.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{asset.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{asset.substation}</div>
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
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontFamily: 'var(--font-mono)',
                            color: asset.failureRisk >= 80 ? '#dc2626' : asset.failureRisk >= 50 ? '#d97706' : '#16a34a',
                          }}
                        >
                          {asset.failureRisk}%
                        </span>
                        <div style={{ width: '40px', height: '5px', background: '#f1f5f9', borderRadius: '2px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${asset.failureRisk}%`,
                              height: '100%',
                              background: asset.failureRisk >= 80 ? '#dc2626' : asset.failureRisk >= 50 ? '#d97706' : '#16a34a',
                            }}
                          />
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {asset.weatherRisk}%
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {asset.temperature}°C
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setActiveTab('dashboard');
                          }}
                          className="btn-secondary btn-sm"
                          title="Locate on Leaflet Map"
                        >
                          Map
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setActiveTab('failure-prediction');
                          }}
                          className="btn-primary btn-sm"
                          title="Open AI Failure Diagnostics"
                        >
                          Diagnose
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssetId(asset.id);
                            setActiveTab('crew-management');
                          }}
                          className="btn-secondary btn-sm"
                          title="Dispatch Field Crew"
                        >
                          Crew
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

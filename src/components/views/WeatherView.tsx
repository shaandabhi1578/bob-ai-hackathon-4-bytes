import React, { useState } from 'react';
import {
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Compass,
  ArrowRight,
  Zap,
  RotateCw,
  Sliders,
  Sparkles,
  MapPin,
  Flame,
  Radio,
  CheckCircle2,
  Clock,
  Calendar,
  Sun,
  Eye,
  Gauge,
  Sunrise,
  Sunset,
  Layers,
  Activity,
  CloudRain,
  Cloud,
  ChevronRight,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { WeatherRegion } from '../../types';
import {
  getAtmosphericMetrics,
  generateHourlyForecast,
  generateDailyForecast,
  HourlyForecastItem,
  DailyForecastItem,
} from '../../services/weatherService';

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

  // Radar time-scrubber state
  const [radarTimeOffset, setRadarTimeOffset] = useState<'minus60' | 'minus30' | 'live' | 'plus60' | 'plus120'>('live');

  // Selected hour in hourly forecast
  const [selectedHourIndex, setSelectedHourIndex] = useState<number>(0);

  // Derive rich atmospheric telemetry and forecasts
  const atmospheric = getAtmosphericMetrics(
    activeWeatherRegion.temperature,
    activeWeatherRegion.windSpeed,
    activeWeatherRegion.humidity,
    activeWeatherRegion.rainfallProb,
    activeWeatherRegion.lightningRisk
  );

  const hourlyForecast = generateHourlyForecast(
    activeWeatherRegion.temperature,
    activeWeatherRegion.rainfallProb,
    activeWeatherRegion.windSpeed,
    activeWeatherRegion.condition,
    activeWeatherRegion.gridWeatherRisk
  );

  const dailyForecast = generateDailyForecast(
    activeWeatherRegion.temperature,
    activeWeatherRegion.rainfallProb,
    activeWeatherRegion.gridWeatherRisk
  );

  // Helper to filter assets located in the active region
  const regionalAssets = assets.filter((a) => {
    const loc = a.location.toLowerCase();
    if (activeWeatherRegion.id === 'reg-gn') return loc.includes('gandhinagar') || loc.includes('sachivalaya');
    if (activeWeatherRegion.id === 'reg-vad') return loc.includes('vadodara') || loc.includes('petrochemical');
    if (activeWeatherRegion.id === 'reg-san') return loc.includes('sanand');
    return loc.includes('ahmedabad') || loc.includes('sabarmati') || loc.includes('vastral');
  });

  // Determine dynamic sky gradient class
  const getSkyClass = () => {
    const cond = activeWeatherRegion.condition.toLowerCase();
    const risk = activeWeatherRegion.gridWeatherRisk;
    if (cond.includes('thunder') || cond.includes('squall') || activeWeatherRegion.lightningRisk === 'Severe') {
      return 'weather-sky-thunderstorm';
    }
    if (activeWeatherRegion.temperature >= 40 || cond.includes('heatwave')) {
      return 'weather-sky-heatwave';
    }
    if (cond.includes('rain') || cond.includes('monsoon') || activeWeatherRegion.rainfallProb >= 65) {
      return 'weather-sky-monsoon';
    }
    if (cond.includes('clear') || cond.includes('sunny') || activeWeatherRegion.temperature >= 35) {
      return 'weather-sky-sunny';
    }
    return 'weather-sky-overcast';
  };

  // Weather condition icon renderer
  const renderWeatherIcon = (type: HourlyForecastItem['iconType'] | DailyForecastItem['iconType'], size = 20) => {
    switch (type) {
      case 'lightning':
        return <Zap size={size} color="#facc15" />;
      case 'rain':
        return <CloudRain size={size} color="#38bdf8" />;
      case 'wind':
        return <Wind size={size} color="#67e8f9" />;
      case 'sun':
        return <Sun size={size} color="#fbbf24" />;
      default:
        return <Cloud size={size} color="#cbd5e1" />;
    }
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '1440px', margin: '0 auto', width: '100%' }}>
      
      {/* ── TOP HEADER & REGION TABS (WEATHER APP STYLE) ──────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
              Meteorological Grid Intelligence Portal
            </h1>
            <span className="badge" style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Radio size={12} color="#2563eb" />
              LIVE DOPPLER FEED
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '0.15rem' }}>
            Synchronous Open-Meteo & IMD Doppler radar vectors correlated with Gujarat 400kV/220kV transmission line stability.
          </p>
        </div>

        {/* Region Switcher Pills (Weather App City Switcher) */}
        <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', background: '#f1f5f9', padding: '0.3rem', borderRadius: '10px' }}>
          {weatherRegions.map((reg) => {
            const isSelected = activeWeatherRegion.id === reg.id;
            return (
              <button
                key={reg.id}
                onClick={() => setActiveWeatherRegionId(reg.id)}
                style={{
                  border: isSelected ? '1px solid #cbd5e1' : '1px solid transparent',
                  background: isSelected ? '#ffffff' : 'transparent',
                  color: isSelected ? '#0f172a' : '#64748b',
                  borderRadius: '7px',
                  padding: '0.4rem 0.85rem',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{reg.name.replace(' Region', '').replace(' Corridor', '').replace(' Cluster', '')}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#2563eb' : '#94a3b8' }}>
                  {reg.temperature}°
                </span>
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
                  title={`Grid Risk: ${reg.gridWeatherRisk}`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── LIVE DATA SYNC CONTROLLER BAR ─────────────────────────────────── */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '0.75rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloudLightning size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#0f172a' }}>
                Open-Meteo & IMD Live Doppler Synchronizer
              </span>
              <span className="badge badge-healthy" style={{ fontSize: '0.66rem' }}>
                CONNECTED
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Region: <strong>{activeWeatherRegion.name}</strong> • Last sync: <strong>{weatherLastSyncedAt || 'Live Simulation Mode'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button
            onClick={fetchLiveWeatherForActiveRegion}
            disabled={isWeatherLoading}
            className="btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.85rem' }}
          >
            <RotateCw size={13} className={isWeatherLoading ? 'spin-anim' : ''} />
            <span>{isWeatherLoading ? 'Syncing...' : 'Fetch Live Weather'}</span>
          </button>

          <button
            onClick={fetchLiveWeatherForAllRegions}
            disabled={isWeatherLoading}
            className="btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.45rem 0.85rem' }}
          >
            <Zap size={13} color="#2563eb" />
            <span>Sync All Gujarat</span>
          </button>
        </div>
      </div>

      {/* ── HERO ATMOSPHERIC WEATHER APP CARD ─────────────────────────────── */}
      <div
        className={`weather-glass-card ${getSkyClass()}`}
        style={{
          borderRadius: '20px',
          padding: '2rem 2.25rem',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.4)',
          position: 'relative',
        }}
      >
        {/* Top Region & Coordinate Tag */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: 'rgba(255,255,255,0.85)', fontSize: '0.85rem', fontWeight: 600 }}>
              <MapPin size={15} color="#38bdf8" />
              <span>{activeWeatherRegion.name}</span>
              <span style={{ opacity: 0.6 }}>•</span>
              <span style={{ opacity: 0.8, fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}>
                {activeWeatherRegion.id === 'reg-amd' ? '23.02°N, 72.57°E' : activeWeatherRegion.id === 'reg-gn' ? '23.22°N, 72.64°E' : activeWeatherRegion.id === 'reg-vad' ? '22.31°N, 73.18°E' : '22.99°N, 72.38°E'}
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.2rem' }}>
              SLDC Gujarat Transmission Node • Live Weather Sensor Array
            </div>
          </div>

          {/* Grid Vulnerability Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="weather-glass-pill"
              style={{
                background:
                  activeWeatherRegion.gridWeatherRisk === 'HIGH'
                    ? 'rgba(220, 38, 38, 0.35)'
                    : activeWeatherRegion.gridWeatherRisk === 'MEDIUM'
                    ? 'rgba(217, 119, 6, 0.35)'
                    : 'rgba(22, 163, 74, 0.35)',
                borderColor:
                  activeWeatherRegion.gridWeatherRisk === 'HIGH'
                    ? 'rgba(239, 68, 68, 0.6)'
                    : activeWeatherRegion.gridWeatherRisk === 'MEDIUM'
                    ? 'rgba(245, 158, 11, 0.6)'
                    : 'rgba(34, 197, 94, 0.6)',
              }}
            >
              <Zap size={13} color={activeWeatherRegion.gridWeatherRisk === 'HIGH' ? '#fca5a5' : activeWeatherRegion.gridWeatherRisk === 'MEDIUM' ? '#fde68a' : '#86efac'} />
              <span>{activeWeatherRegion.gridWeatherRisk} GRID STRAIN</span>
            </span>

            <span className="weather-glass-pill">
              <Compass size={13} color="#38bdf8" />
              <span>{Math.round(20 + activeWeatherRegion.rainfallProb * 0.45)} dBZ Doppler</span>
            </span>
          </div>
        </div>

        {/* Big Weather App Center Hero */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '2rem', marginTop: '1.5rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.75rem' }}>
            {/* Giant Digital Temperature */}
            <div style={{ display: 'flex', alignItems: 'flex-start' }}>
              <span
                style={{
                  fontSize: '5.2rem',
                  fontWeight: 800,
                  lineHeight: 0.95,
                  letterSpacing: '-0.04em',
                  fontFamily: 'var(--font-sans)',
                  textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                }}
              >
                {activeWeatherRegion.temperature}
              </span>
              <span style={{ fontSize: '2.5rem', fontWeight: 300, lineHeight: 1, marginTop: '0.2rem', opacity: 0.85 }}>
                °C
              </span>
            </div>

            {/* Condition Headline & Subtext */}
            <div>
              <div style={{ fontSize: '1.45rem', fontWeight: 700, letterSpacing: '-0.01em', textShadow: '0 2px 10px rgba(0,0,0,0.3)' }}>
                {activeWeatherRegion.condition}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)', marginTop: '0.25rem' }}>
                Feels like <strong>{Math.round(activeWeatherRegion.temperature + (activeWeatherRegion.humidity > 70 ? 4 : 1))}°C</strong> • H: {activeWeatherRegion.temperature + 4}° L: {activeWeatherRegion.temperature - 7}°
              </div>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.7)', marginTop: '0.15rem' }}>
                Rain Chance: <strong>{activeWeatherRegion.rainfallProb}%</strong> • Wind: <strong>{activeWeatherRegion.windSpeed} km/h {atmospheric.windCardinal}</strong>
              </div>
            </div>
          </div>

          {/* Quick Action Button to High Risk Asset */}
          <div>
            <button
              onClick={() => {
                setSelectedAssetId('T-104');
                setActiveTab('failure-prediction');
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.35)',
                color: '#ffffff',
                borderRadius: '12px',
                padding: '0.75rem 1.25rem',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
            >
              <span>Correlate with T-104 Asset Risk</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* Advisory Callout Strip inside Hero Card */}
        {activeWeatherRegion.warningMessage && (
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid rgba(255, 255, 255, 0.18)',
              backdropFilter: 'blur(8px)',
              borderRadius: '10px',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
            }}
          >
            <AlertTriangle size={18} color="#facc15" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '0.78rem', color: '#ffffff', lineHeight: 1.4 }}>
              <strong>Operational Advisory:</strong> {activeWeatherRegion.warningMessage}
            </div>
          </div>
        )}
      </div>

      {/* ── 24-HOUR HOURLY FORECAST CAROUSEL (APPLE WEATHER STYLE) ────────── */}
      <div
        className="control-card"
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          border: '1px solid #334155',
          borderRadius: '16px',
        }}
      >
        <div
          style={{
            padding: '0.85rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Clock size={15} color="#38bdf8" />
            <span>24-Hour Hourly Forecast & Line Impact Trajectory</span>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
            Swipe or scroll horizontally • Click hour to inspect
          </span>
        </div>

        <div style={{ padding: '0.75rem 1.25rem 1rem 1.25rem' }}>
          <div className="hourly-scroll-container">
            {hourlyForecast.map((item, idx) => {
              const isSelected = idx === selectedHourIndex;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedHourIndex(idx)}
                  className={`hourly-item-card ${isSelected ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <span style={{ fontSize: '0.74rem', fontWeight: 600, color: isSelected ? '#ffffff' : '#94a3b8' }}>
                    {item.time}
                  </span>

                  <div style={{ margin: '0.5rem 0' }}>
                    {renderWeatherIcon(item.iconType, 22)}
                  </div>

                  <span style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {item.temp}°
                  </span>

                  {/* Precipitation Probability */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.35rem', fontSize: '0.68rem', color: '#38bdf8', fontWeight: 600 }}>
                    <Droplets size={10} />
                    <span>{item.rainProb}%</span>
                  </div>

                  {/* Grid Risk Pill */}
                  <span
                    style={{
                      marginTop: '0.45rem',
                      fontSize: '0.6rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px',
                      background:
                        item.gridRisk === 'HIGH'
                          ? 'rgba(220, 38, 38, 0.35)'
                          : item.gridRisk === 'MEDIUM'
                          ? 'rgba(217, 119, 6, 0.35)'
                          : 'rgba(22, 163, 74, 0.35)',
                      color:
                        item.gridRisk === 'HIGH'
                          ? '#fca5a5'
                          : item.gridRisk === 'MEDIUM'
                          ? '#fde68a'
                          : '#86efac',
                      border: `1px solid ${
                        item.gridRisk === 'HIGH'
                          ? 'rgba(239, 68, 68, 0.5)'
                          : item.gridRisk === 'MEDIUM'
                          ? 'rgba(245, 158, 11, 0.5)'
                          : 'rgba(34, 197, 94, 0.5)'
                      }`,
                    }}
                  >
                    {item.gridRisk}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── TWO COLUMN MAIN BODY: 7-DAY OUTLOOK + BENTO METRIC TILES ─────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.85fr', gap: '1.25rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: 7-DAY EXTENDED FORECAST & RADAR STUDIO */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* 7-Day Extended Outlook (Apple Weather Style with Temperature Range Bars) */}
          <div className="control-card">
            <div className="control-card-header">
              <div className="control-card-title">
                <Calendar size={16} color="#2563eb" />
                <span>7-Day Gujarat Weather Outlook</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Transmission Vulnerability
              </span>
            </div>

            <div style={{ padding: '0.75rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {dailyForecast.map((dayItem, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.85rem',
                    paddingBottom: idx === dailyForecast.length - 1 ? 0 : '0.75rem',
                    borderBottom: idx === dailyForecast.length - 1 ? 'none' : '1px solid #f1f5f9',
                  }}
                >
                  {/* Day Label */}
                  <div style={{ width: '52px', fontSize: '0.82rem', fontWeight: idx === 0 ? 700 : 500, color: idx === 0 ? '#0f172a' : '#475569' }}>
                    {dayItem.day}
                  </div>

                  {/* Icon + Rain Chance */}
                  <div style={{ width: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {renderWeatherIcon(dayItem.iconType, 18)}
                    <span style={{ fontSize: '0.65rem', color: '#0284c7', fontWeight: 600, marginTop: '0.1rem' }}>
                      {dayItem.rainProb}%
                    </span>
                  </div>

                  {/* Min Temp */}
                  <div style={{ width: '30px', textAlign: 'right', fontSize: '0.78rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                    {dayItem.minTemp}°
                  </div>

                  {/* Temperature Gradient Range Bar */}
                  <div className="temp-range-track">
                    <div
                      className="temp-range-fill"
                      style={{
                        left: `${Math.max(0, ((dayItem.minTemp - 15) / (50 - 15)) * 100)}%`,
                        width: `${Math.max(20, ((dayItem.maxTemp - dayItem.minTemp) / (50 - 15)) * 100)}%`,
                      }}
                    />
                    {dayItem.currentTemp && (
                      <div
                        className="temp-range-dot"
                        style={{
                          left: `${Math.max(5, Math.min(95, ((dayItem.currentTemp - 15) / (50 - 15)) * 100))}%`,
                        }}
                        title={`Current: ${dayItem.currentTemp}°C`}
                      />
                    )}
                  </div>

                  {/* Max Temp */}
                  <div style={{ width: '30px', fontSize: '0.82rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)' }}>
                    {dayItem.maxTemp}°
                  </div>

                  {/* Risk Badge */}
                  <span
                    className={`badge ${
                      dayItem.gridRisk === 'HIGH'
                        ? 'badge-critical'
                        : dayItem.gridRisk === 'MEDIUM'
                        ? 'badge-warning'
                        : 'badge-healthy'
                    }`}
                    style={{ fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}
                  >
                    {dayItem.gridRisk}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive SCADA Doppler Radar Graphic & Timeline Scrubber */}
          <div className="control-card">
            <div className="control-card-header">
              <div className="control-card-title">
                <Compass size={16} color="#2563eb" />
                <span>Doppler Scan Studio — {activeWeatherRegion.name}</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Doppler: {Math.round(20 + activeWeatherRegion.rainfallProb * 0.45)} dBZ
              </span>
            </div>

            <div style={{ height: '260px', background: '#0b1120', position: 'relative', overflow: 'hidden' }}>
              <svg viewBox="0 0 100 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
                {/* Radar Grid Rings */}
                <circle cx="50" cy="40" r="14" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                <circle cx="50" cy="40" r="28" fill="none" stroke="#1e293b" strokeWidth="0.5" />
                <circle cx="50" cy="40" r="42" fill="none" stroke="#334155" strokeWidth="0.5" strokeDasharray="1 1" />
                <line x1="50" y1="0" x2="50" y2="80" stroke="#1e293b" strokeWidth="0.5" />
                <line x1="0" y1="40" x2="100" y2="40" stroke="#1e293b" strokeWidth="0.5" />

                {/* Animated Rotating Radar Sweep Beam */}
                <g className="radar-sweep-beam">
                  <path
                    d="M 50,40 L 92,40 A 42,42 0 0,0 79.7,10.3 Z"
                    fill="url(#radarGradient)"
                    opacity="0.5"
                  />
                  <line x1="50" y1="40" x2="92" y2="40" stroke="#38bdf8" strokeWidth="0.8" opacity="0.8" />
                </g>

                <defs>
                  <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Storm Cloud / Rain Density Contour */}
                {activeWeatherRegion.gridWeatherRisk === 'HIGH' ? (
                  <>
                    <path
                      d="M 28,20 Q 56,12 74,28 Q 66,58 40,52 Q 22,46 28,20 Z"
                      fill="#dc2626"
                      fillOpacity="0.35"
                      stroke="#ef4444"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M 36,26 Q 54,18 64,32 Q 58,46 42,42 Z"
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

                {/* Substation Markers */}
                <circle cx="48" cy="34" r="2.2" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
                <text x="52" y="35" fill="#f8fafc" fontSize="2.2" fontWeight="700">
                  S-17 Sabarmati
                </text>

                <circle cx="64" cy="52" r="1.8" fill="#94a3b8" stroke="#ffffff" strokeWidth="0.4" />
                <text x="68" y="53" fill="#cbd5e1" fontSize="2.0">
                  S-04 Vastral
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
                  top: '0.75rem',
                  left: '0.75rem',
                  background: 'rgba(15, 23, 42, 0.85)',
                  backdropFilter: 'blur(6px)',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  padding: '0.45rem 0.75rem',
                  fontSize: '0.72rem',
                  color: '#ffffff',
                }}
              >
                <div style={{ fontWeight: 700, color: '#38bdf8' }}>{activeWeatherRegion.condition}</div>
                <div style={{ color: '#94a3b8', fontSize: '0.68rem' }}>
                  Precip: {activeWeatherRegion.rainfallProb}% • Lightning: {activeWeatherRegion.lightningRisk}
                </div>
              </div>
            </div>

            {/* Radar Timeline Scrubber Buttons */}
            <div style={{ padding: '0.65rem 1.25rem', background: '#ffffff', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b' }}>Doppler Playback:</span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                {(['minus60', 'minus30', 'live', 'plus60', 'plus120'] as const).map((step) => (
                  <button
                    key={step}
                    onClick={() => setRadarTimeOffset(step)}
                    style={{
                      border: '1px solid',
                      borderColor: radarTimeOffset === step ? '#2563eb' : '#e2e8f0',
                      background: radarTimeOffset === step ? '#eff6ff' : '#ffffff',
                      color: radarTimeOffset === step ? '#1d4ed8' : '#64748b',
                      borderRadius: '4px',
                      padding: '0.2rem 0.5rem',
                      fontSize: '0.68rem',
                      fontWeight: radarTimeOffset === step ? 700 : 500,
                      cursor: 'pointer',
                    }}
                  >
                    {step === 'minus60' ? '-1h' : step === 'minus30' ? '-30m' : step === 'live' ? '● LIVE' : step === 'plus60' ? '+1h' : '+2h'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: APPLE WEATHER BENTO METRIC TILES GRID */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            
            {/* TILE 1: WIND & COMPASS ROSE */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Wind size={14} color="#0284c7" />
                  <span>Wind & Transmission Sway</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {activeWeatherRegion.windSpeed}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>km/h</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.2rem' }}>
                  Gusts up to <strong>{atmospheric.windGusts} km/h</strong> • Direction: <strong>{atmospheric.windCardinal} ({atmospheric.windDeg}°)</strong>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <span style={{ fontSize: '0.72rem', color: activeWeatherRegion.windSpeed > 45 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                  {activeWeatherRegion.windSpeed > 45 ? '⚠️ Conductor Galloping Danger' : '✓ Normal Line Deflection'}
                </span>
                {/* Visual Compass Needle */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `rotate(${atmospheric.windDeg}deg)`,
                    transition: 'transform 0.4s ease',
                  }}
                  title={`Wind Vector: ${atmospheric.windDeg}°`}
                >
                  <div style={{ width: '3px', height: '18px', background: 'linear-gradient(180deg, #ef4444 50%, #3b82f6 50%)', borderRadius: '2px' }} />
                </div>
              </div>
            </div>

            {/* TILE 2: UV INDEX & SOLAR LOAD */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Sun size={14} color="#ea580c" />
                  <span>UV Index & Solar Heating</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {atmospheric.uvIndex}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 700 }}>
                    {atmospheric.uvLevel}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.2rem' }}>
                  Peak solar heating: <strong>11:30 AM – 3:30 PM</strong>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ height: '6px', width: '100%', borderRadius: '3px', background: 'linear-gradient(90deg, #22c55e 0%, #eab308 35%, #f97316 65%, #ef4444 100%)', position: 'relative' }}>
                  <div
                    style={{
                      position: 'absolute',
                      left: `${Math.min(95, (atmospheric.uvIndex / 11) * 100)}%`,
                      top: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      background: '#ffffff',
                      border: '2px solid #0f172a',
                    }}
                  />
                </div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.35rem' }}>
                  Transformer ambient derating: {atmospheric.uvIndex >= 8 ? '-12% MVA capacity' : 'Nominal'}
                </div>
              </div>
            </div>

            {/* TILE 3: PRECIPITATION & RAIN GAUGE */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Droplets size={14} color="#2563eb" />
                  <span>Precipitation & Flashover</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {atmospheric.rainAccumulationMm}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>mm in 24h</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.2rem' }}>
                  Storm probability: <strong>{activeWeatherRegion.rainfallProb}%</strong>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#64748b' }}>
                  <span>Yard Drainage:</span>
                  <strong style={{ color: activeWeatherRegion.rainfallProb > 70 ? '#dc2626' : '#16a34a' }}>
                    {activeWeatherRegion.rainfallProb > 70 ? 'Pumps on Standby' : 'Normal Gravity Runoff'}
                  </strong>
                </div>
              </div>
            </div>

            {/* TILE 4: AIR QUALITY & PARTICULATE DEPOSIT */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Activity size={14} color="#16a34a" />
                  <span>Air Quality & Saline Coating</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {atmospheric.aqi}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: atmospheric.aqi > 150 ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                    {atmospheric.aqiStatus}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.2rem' }}>
                  Insulator flashover risk: <strong>{atmospheric.flashoverRisk}</strong>
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Saline particulate deposits: {atmospheric.flashoverRisk === 'High' ? 'Washing cycle recommended' : 'Within dielectric limits'}
                </div>
              </div>
            </div>

            {/* TILE 5: SUNRISE & SUNSET ARC */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Sunrise size={14} color="#f59e0b" />
                  <span>Daylight & Solar Generation Arc</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <div>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Sunrise</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                      {atmospheric.sunrise}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.68rem', color: '#64748b' }}>Sunset</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                      {atmospheric.sunset}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sun Arc SVG */}
              <div style={{ marginTop: '0.8rem', paddingTop: '0.6rem', borderTop: '1px solid #f1f5f9' }}>
                <svg viewBox="0 0 100 35" style={{ width: '100%', height: '35px' }}>
                  <path d="M 10,30 Q 50,2 90,30" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 3" />
                  <circle cx="62" cy="11" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                  <line x1="0" y1="30" x2="100" y2="30" stroke="#cbd5e1" strokeWidth="1" />
                </svg>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center', marginTop: '0.2rem' }}>
                  Peak solar PV input: <strong>4,200 MW</strong>
                </div>
              </div>
            </div>

            {/* TILE 6: HUMIDITY & DEW POINT */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Droplets size={14} color="#6366f1" />
                  <span>Humidity & Dew Point</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {activeWeatherRegion.humidity}%
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.2rem' }}>
                  The dew point is <strong>{atmospheric.dewPoint}°C</strong> right now.
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Bushings condensation: {activeWeatherRegion.humidity > 80 ? 'Heavy surface dampness' : 'Dry surface conditions'}
                </div>
              </div>
            </div>

            {/* TILE 7: BAROMETRIC PRESSURE */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Gauge size={14} color="#8b5cf6" />
                  <span>Barometric Pressure</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {atmospheric.pressureHpa}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>hPa</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: atmospheric.pressureTrend === 'Falling' ? '#dc2626' : '#16a34a', fontWeight: 600, marginTop: '0.2rem' }}>
                  Trend: {atmospheric.pressureTrend}
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  Cyclonic isobar gradient: {atmospheric.pressureTrend === 'Falling' ? 'Rapid depression approaching' : 'Stable atmospheric ridge'}
                </div>
              </div>
            </div>

            {/* TILE 8: VISIBILITY & DRONE DISPATCH */}
            <div className="weather-bento-tile">
              <div>
                <div className="weather-bento-tile-header">
                  <Eye size={14} color="#0f766e" />
                  <span>Visibility & Aerial Patrols</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.35rem' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                    {atmospheric.visibilityKm}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>km</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#334155', marginTop: '0.2rem' }}>
                  Haze & particulate attenuation
                </div>
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '0.72rem', color: atmospheric.visibilityKm < 5 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                  {atmospheric.visibilityKm < 5 ? '⚠️ Drone Line Patrols Grounded' : '✓ Visual Flight Inspection Nominal'}
                </div>
              </div>
            </div>

          </div>

          {/* SECTION: INTERACTIVE WEATHER SCENARIO SIMULATOR & SLIDERS */}
          <div
            className="control-card"
            style={{
              border: '2px solid #2563eb',
              background: '#f8fbff',
              borderRadius: '16px',
            }}
          >
            <div
              className="control-card-header"
              style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Sliders size={16} color="#2563eb" />
                <span style={{ fontWeight: 700, color: '#1e3a8a' }}>
                  Interactive Atmospheric Simulator & Live Grid Ripple Engine
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 600 }}>
                Recalculates SCADA map, AI predictions, and crew actions in real time
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
                      padding: '0.5rem 0.35rem',
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
                      padding: '0.5rem 0.35rem',
                    }}
                  >
                    <Flame size={14} color="#ea580c" />
                    <span>🔥 Heatwave</span>
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
                      padding: '0.5rem 0.35rem',
                    }}
                  >
                    <Droplets size={14} color="#0284c7" />
                    <span>⛈️ Monsoon</span>
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
                      padding: '0.5rem 0.35rem',
                    }}
                  >
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span>☀️ Clear Sky</span>
                  </button>
                </div>
              </div>

              {/* Sliders Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '1rem',
                  background: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  padding: '1rem',
                }}
              >
                {/* Temperature Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>Ambient Temp</span>
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

                {/* Wind Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>Surface Wind</span>
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

                {/* Rain Slider */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>Rain Prob.</span>
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

                {/* Lightning Select */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#334155', fontWeight: 600 }}>Lightning Risk</span>
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

        </div>

      </div>

      {/* ── REGIONAL TRANSMISSION ASSETS SYNCHRONIZED TABLE ───────────────── */}
      <div className="control-card" style={{ borderRadius: '16px' }}>
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

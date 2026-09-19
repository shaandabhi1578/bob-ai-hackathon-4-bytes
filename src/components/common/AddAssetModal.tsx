import React, { useState } from 'react';
import {
  PlusCircle,
  X,
  MapPin,
  Cpu,
  Layers,
  Activity,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { AssetType, AssetStatus, GridAsset } from '../../types';
import { useGrid } from '../../context/GridContext';

interface AddAssetModalProps {
  onClose: () => void;
}

const GUJARAT_ZONE_PRESETS = [
  { label: 'Ahmedabad West', lat: 23.0825, lng: 72.5654, sub: 'Substation S-17 (Sabarmati 400kV)' },
  { label: 'Ahmedabad East', lat: 23.0012, lng: 72.6482, sub: 'Substation S-04 (Vastral 220kV)' },
  { label: 'Ahmedabad Central', lat: 23.0372, lng: 72.5458, sub: 'Substation S-04 (Ellisbridge Bay)' },
  { label: 'Gandhinagar', lat: 23.2156, lng: 72.6369, sub: 'Substation S-02 (Gandhinagar 220kV)' },
  { label: 'Vadodara Inter-tie', lat: 22.3072, lng: 73.1812, sub: 'Substation S-07 (Vadodara 220kV)' },
  { label: 'Sanand Auto Hub', lat: 22.9927, lng: 72.3813, sub: 'Substation S-09 (Sanand GIDC 220kV)' },
];

export const AddAssetModal: React.FC<AddAssetModalProps> = ({ onClose }) => {
  const { addAsset, assets } = useGrid();

  const [id, setId] = useState(`T-${Math.floor(300 + Math.random() * 599)}`);
  const [name, setName] = useState('');
  const [type, setType] = useState<AssetType>('Transformer');
  const [location, setLocation] = useState('Ahmedabad West');
  const [substation, setSubstation] = useState('Substation S-17 (Sabarmati 400kV)');
  const [lat, setLat] = useState<number>(23.0825);
  const [lng, setLng] = useState<number>(72.5654);
  const [feederLine, setFeederLine] = useState('FL-22A (Sabarmati Industrial Express)');
  const [healthScore, setHealthScore] = useState<number>(88);
  const [failureRisk, setFailureRisk] = useState<number>(12);
  const [status, setStatus] = useState<AssetStatus>('Healthy');
  const [temperature, setTemperature] = useState<number>(64);
  const [vibration, setVibration] = useState<number>(1.4);
  const [oilQuality, setOilQuality] = useState<'Good' | 'Moderate' | 'Poor'>('Good');
  const [voltageKV, setVoltageKV] = useState<number>(220);
  const [loadPercentage, setLoadPercentage] = useState<number>(70);
  const [gridImpactCustomers, setGridImpactCustomers] = useState<number>(14500);
  const [commissionYear, setCommissionYear] = useState<number>(2026);
  const [recommendedAction, setRecommendedAction] = useState('Continuous SCADA monitoring');

  const applyZonePreset = (preset: typeof GUJARAT_ZONE_PRESETS[0]) => {
    setLocation(preset.label);
    setSubstation(preset.sub);
    setLat(preset.lat);
    setLng(preset.lng);
  };

  const handleHealthChange = (newHealth: number) => {
    setHealthScore(newHealth);
    if (newHealth < 50) {
      setStatus('Critical');
      setFailureRisk(Math.max(80, 100 - newHealth));
      setRecommendedAction('Immediate emergency inspection & thermal scan within 12 hours');
    } else if (newHealth < 75) {
      setStatus('Warning');
      setFailureRisk(Math.max(50, 100 - newHealth));
      setRecommendedAction('Schedule maintenance and oil test within 48 hours');
    } else {
      setStatus('Healthy');
      setFailureRisk(Math.min(25, Math.round((100 - newHealth) * 0.8)));
      setRecommendedAction('Continuous SCADA monitoring; nominal baseline');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    addAsset({
      id: id.trim().toUpperCase(),
      name: name.trim() || `Transformer ${id.trim().toUpperCase()}`,
      type,
      location,
      substation,
      coordinates: {
        lat,
        lng,
        x: 50,
        y: 50,
      },
      healthScore,
      failureRisk,
      status,
      gridImpactCustomers,
      predictedFailureWindow: status === 'Critical' ? 'Next 3–7 days' : status === 'Warning' ? 'Next 14–21 days' : 'Nominal (> 120 days)',
      recommendedAction,
      priority: status === 'Critical' ? 'P1 - Critical' : status === 'Warning' ? 'P2 - High' : 'P4 - Routine',
      temperature,
      vibration,
      oilQuality,
      oilTemperature: Math.round(temperature - 5),
      partialDischarge: status === 'Critical' ? 280 : status === 'Warning' ? 120 : 35,
      loadPercentage,
      voltageKV,
      currentA: Math.round((voltageKV * 1000) / 400),
      lastMaintenance: 'Newly commissioned',
      weatherExposure: 'Medium',
      sensorRisk: failureRisk,
      weatherRisk: 15,
      historicalRisk: 20,
      confidence: 90,
      reasons: [
        `Newly commissioned into ${substation}`,
        status === 'Critical'
          ? 'Thermal hot-spot detected on commissioning baseline'
          : 'Initial insulation resistance and Doble power factor within IEEE tolerance',
      ],
      commissionYear,
      feederLine,
    });

    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '94vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          border: '1px solid #cbd5e1',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            padding: '1.1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid #2563eb',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.2)',
                border: '1px solid rgba(37, 99, 235, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <PlusCircle size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Register New Grid Asset to Inventory
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Adds asset to live SCADA fleet telemetry, dashboard KPIs, and interactive map.
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              padding: '0.35rem',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Asset Identity Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 180px', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Asset ID *
              </label>
              <input
                type="text"
                required
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder="e.g. T-305"
                className="form-input"
                style={{ height: '34px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Asset Description / Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Transformer T-305 (North Bay 160MVA)"
                className="form-input"
                style={{ height: '34px', fontSize: '0.82rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Asset Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="form-select"
                style={{ height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Transformer">Transformer</option>
                <option value="Substation">Substation</option>
                <option value="Circuit Breaker">Circuit Breaker</option>
                <option value="Transmission Line">Transmission Line</option>
                <option value="Disconnect Switch">Disconnect Switch</option>
              </select>
            </div>
          </div>

          {/* Quick Zone Presets */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Quick Location & Substation Presets (Gujarat Grid)
            </label>
            <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
              {GUJARAT_ZONE_PRESETS.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => applyZonePreset(p)}
                  className="btn-secondary btn-sm"
                  style={{
                    fontSize: '0.72rem',
                    background: location === p.label ? '#eff6ff' : '#ffffff',
                    borderColor: location === p.label ? '#93c5fd' : '#cbd5e1',
                    color: location === p.label ? '#1d4ed8' : '#475569',
                    fontWeight: location === p.label ? 600 : 400,
                  }}
                >
                  <MapPin size={11} />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Location & Coordinates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 120px 120px', gap: '0.75rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Substation Corridor
              </label>
              <input
                type="text"
                value={substation}
                onChange={(e) => setSubstation(e.target.value)}
                className="form-input"
                style={{ height: '34px', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Feeder Line
              </label>
              <input
                type="text"
                value={feederLine}
                onChange={(e) => setFeederLine(e.target.value)}
                className="form-input"
                style={{ height: '34px', fontSize: '0.8rem' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Latitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(Number(e.target.value))}
                className="form-input"
                style={{ height: '34px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                Longitude
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(Number(e.target.value))}
                className="form-input"
                style={{ height: '34px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>
          </div>

          {/* Operational Baseline & Status */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Health Score & SCADA Baseline Telemetry
              </span>
              <span
                className={`badge ${
                  status === 'Critical' ? 'badge-critical' : status === 'Warning' ? 'badge-warning' : 'badge-healthy'
                }`}
              >
                Initial Status: {status} ({failureRisk}% Risk)
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Health Score: {healthScore}/100
                </label>
                <input
                  type="range"
                  min="20"
                  max="99"
                  value={healthScore}
                  onChange={(e) => handleHealthChange(Number(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Winding Temp (°C)
                </label>
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Vibration (mm/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={vibration}
                  onChange={(e) => setVibration(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Oil Quality
                </label>
                <select
                  value={oilQuality}
                  onChange={(e) => setOilQuality(e.target.value as any)}
                  className="form-select"
                  style={{ height: '32px', fontSize: '0.78rem' }}
                >
                  <option value="Good">Good</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', marginTop: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Voltage Rating (kV)
                </label>
                <input
                  type="number"
                  value={voltageKV}
                  onChange={(e) => setVoltageKV(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Connected Customers
                </label>
                <input
                  type="number"
                  value={gridImpactCustomers}
                  onChange={(e) => setGridImpactCustomers(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Commission Year
                </label>
                <input
                  type="number"
                  value={commissionYear}
                  onChange={(e) => setCommissionYear(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          {/* Modal Footer Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              style={{ padding: '0.45rem 1.1rem' }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '0.45rem 1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <CheckCircle2 size={16} />
              <span>Save & Register Asset to SCADA Grid</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

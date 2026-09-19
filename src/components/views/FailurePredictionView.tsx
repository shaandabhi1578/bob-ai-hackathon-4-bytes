import React from 'react';
import {
  AlertTriangle,
  Sparkles,
  Sliders,
  RotateCcw,
  ArrowRight,
  ShieldAlert,
  Clock,
  CheckCircle2,
  Users,
  Send,
  Thermometer,
  Gauge,
  Droplets,
  Wind,
  Zap,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';

export const FailurePredictionView: React.FC = () => {
  const {
    assets,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    simulationParams,
    updateSimulationParam,
    resetSimulation,
    predictionResult,
    setActiveTab,
    nearestCrewToSelected,
    assignCrew,
    crews,
    activeWeatherRegion,
    commitSimulationToAsset,
  } = useGrid();

  // Baseline risk for delta calculation
  const baselineRisk = selectedAsset.failureRisk;
  const riskDelta = predictionResult.combinedRisk - baselineRisk;
  const activeAssignedCrew = selectedAsset.assignedCrewId
    ? crews.find((c) => c.id === selectedAsset.assignedCrewId)
    : null;

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header with Asset Selector */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
              AI Failure Prediction & Diagnostic Engine
            </h2>
            <span className="badge badge-neutral" style={{ fontSize: '0.7rem' }}>
              MULTI-VECTOR MODEL
            </span>
          </div>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Combines live SCADA sensors, Doppler weather vectors, and fleet reliability records.
          </p>
        </div>

        {/* Asset Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Select Asset:</span>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="form-select"
            style={{ width: '260px', height: '36px', fontWeight: 600 }}
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} — {a.name} ({a.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Prediction Breakdown & Explanation Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.6fr', gap: '1.25rem' }}>
        {/* Left: Overall Risk Gauge & 4-Factor Breakdown */}
        <div className="control-card">
          <div className="control-card-header">
            <div className="control-card-title">
              <AlertTriangle size={16} color={predictionResult.combinedRisk >= 80 ? '#dc2626' : '#2563eb'} />
              <span>Multi-Factor Risk Assessment</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Model Confidence:</span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                {predictionResult.confidence}%
              </span>
            </div>
          </div>

          <div className="control-card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Big Risk Display */}
            <div
              style={{
                background:
                  predictionResult.combinedRisk >= 80
                    ? '#fef2f2'
                    : predictionResult.combinedRisk >= 60
                    ? '#fffbeb'
                    : '#f0fdf4',
                border: `1px solid ${
                  predictionResult.combinedRisk >= 80
                    ? '#fecaca'
                    : predictionResult.combinedRisk >= 60
                    ? '#fde68a'
                    : '#bbf7d0'
                }`,
                borderRadius: '8px',
                padding: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Combined Failure Probability
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.2rem' }}>
                  <span
                    style={{
                      fontSize: '2.8rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color:
                        predictionResult.combinedRisk >= 80
                          ? '#dc2626'
                          : predictionResult.combinedRisk >= 60
                          ? '#d97706'
                          : '#16a34a',
                      lineHeight: 1,
                    }}
                  >
                    {predictionResult.combinedRisk}%
                  </span>

                  {riskDelta !== 0 && (
                    <span
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: riskDelta > 0 ? '#dc2626' : '#16a34a',
                      }}
                    >
                      {riskDelta > 0 ? `+${riskDelta}% (Simulated)` : `${riskDelta}% (Simulated)`}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#475569', marginTop: '0.35rem' }}>
                  Status: <strong>{predictionResult.status}</strong> • Priority:{' '}
                  <strong>{predictionResult.priority}</strong>
                </div>
              </div>

              {/* Progress Arc Visual */}
              <div style={{ width: '90px', height: '90px', position: 'relative' }}>
                <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e2e8f0"
                    strokeWidth="3.2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke={
                      predictionResult.combinedRisk >= 80
                        ? '#dc2626'
                        : predictionResult.combinedRisk >= 60
                        ? '#d97706'
                        : '#16a34a'
                    }
                    strokeDasharray={`${predictionResult.combinedRisk}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {predictionResult.combinedRisk}%
                </div>
              </div>
            </div>

            {/* Sub-Vector Breakdown Bars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ fontSize: '0.74rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                Sub-Vector Risk Weights
              </div>

              {/* Sensor Risk */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#334155' }}>Sensor Telemetry Risk (40% Weight)</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{predictionResult.sensorRisk}%</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${predictionResult.sensorRisk}%`,
                      background: predictionResult.sensorRisk >= 75 ? '#dc2626' : '#2563eb',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Weather Risk */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#334155' }}>Weather Forecast Risk (25% Weight)</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{predictionResult.weatherRisk}%</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${predictionResult.weatherRisk}%`,
                      background: predictionResult.weatherRisk >= 70 ? '#dc2626' : '#0891b2',
                      borderRadius: '3px',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Historical Pattern */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#334155' }}>Historical Failure Pattern (20% Weight)</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{predictionResult.historicalRisk}%</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${predictionResult.historicalRisk}%`,
                      background: '#64748b',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>

              {/* Criticality */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.2rem' }}>
                  <span style={{ color: '#334155' }}>Grid Criticality & Load (15% Weight)</span>
                  <strong style={{ fontFamily: 'var(--font-mono)' }}>{predictionResult.criticalityRisk}%</strong>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${predictionResult.criticalityRisk}%`,
                      background: '#d97706',
                      borderRadius: '3px',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Predicted Horizon Box */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                borderTop: '1px solid #f1f5f9',
                paddingTop: '0.9rem',
              }}
            >
              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>
                  Predicted Failure Horizon
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', marginTop: '0.2rem' }}>
                  {predictionResult.predictedWindow}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>
                  Downstream Population
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                  {selectedAsset.gridImpactCustomers.toLocaleString()} customers
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Transparent AI Explanation & Recommended Action */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="control-card" style={{ flex: 1 }}>
            <div className="control-card-header">
              <div className="control-card-title">
                <Sparkles size={16} color="#0284c7" />
                <span>AI Attribution: Why is this Asset at Risk?</span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                Human-Readable Diagnostic Logic
              </span>
            </div>

            <div className="control-card-body">
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.75rem' }}>
                Primary Root Cause Contributors (Attribution Ranked):
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {predictionResult.reasons.map((reason, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.6rem',
                      fontSize: '0.8rem',
                      color: '#1e293b',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '6px',
                      padding: '0.6rem 0.8rem',
                      lineHeight: 1.4,
                    }}
                  >
                    <span
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#dc2626' : idx === 1 ? '#ea580c' : '#2563eb',
                        color: '#ffffff',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '1px',
                      }}
                    >
                      {idx + 1}
                    </span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              {/* Recommended Action Card */}
              <div
                style={{
                  marginTop: '1.25rem',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '6px',
                  padding: '1rem',
                }}
              >
                <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                  Recommended Protocol
                </div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#7f1d1d', marginTop: '0.2rem' }}>
                  {predictionResult.recommendedAction}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#991b1b', marginTop: '0.25rem' }}>
                  {activeAssignedCrew ? (
                    <span>
                      ✓ Active Unit Dispatched: <strong>{activeAssignedCrew.id}</strong> ({activeAssignedCrew.name} • On-Site Staging)
                    </span>
                  ) : nearestCrewToSelected.crew ? (
                    <span>
                      Nearest Qualified Unit: <strong>{nearestCrewToSelected.crew.id}</strong> ({nearestCrewToSelected.crew.specialization}, {nearestCrewToSelected.distanceKm} km away, {nearestCrewToSelected.etaMinutes} min ETA)
                    </span>
                  ) : (
                    <span>
                      Field Dispatch Warning: <strong>All field units currently deployed or off duty</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button
                  onClick={() => {
                    setActiveTab('crew-management');
                  }}
                  className="btn-primary"
                  style={{
                    flex: 1,
                    justifyContent: 'center',
                    background: activeAssignedCrew ? '#16a34a' : nearestCrewToSelected.crew ? '#2563eb' : '#64748b',
                    borderColor: activeAssignedCrew ? '#16a34a' : nearestCrewToSelected.crew ? '#2563eb' : '#64748b',
                  }}
                >
                  <Users size={15} />
                  <span>
                    {activeAssignedCrew
                      ? `Manage Unit (${activeAssignedCrew.id})`
                      : nearestCrewToSelected.crew
                      ? `Dispatch ${nearestCrewToSelected.crew.id}`
                      : 'View Crew Staging'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('outage-notifications');
                  }}
                  className="btn-secondary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  <Send size={15} />
                  <span>Draft Outage Notice</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 10: INTERACTIVE SIMULATION / DEMO MODE */}
      <div className="control-card" style={{ border: '2px solid #3b82f6', background: '#fafcff' }}>
        <div
          className="control-card-header"
          style={{ background: '#f0f7ff', borderBottom: '1px solid #bfdbfe' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sliders size={16} color="#2563eb" />
            <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e3a8a' }}>
              Demo Simulator Mode — Live Telemetry & Atmospheric Injection
            </div>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                background: '#2563eb',
                color: '#ffffff',
                padding: '0.15rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              HACKATHON EVALUATION
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <button
              onClick={() => commitSimulationToAsset(selectedAsset.id)}
              className="btn-primary btn-sm"
              style={{
                background: '#2563eb',
                borderColor: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontWeight: 700,
              }}
              title="Apply simulated telemetry directly to the live asset and update dashboard map"
            >
              <Zap size={13} />
              <span>Apply to Fleet & Map</span>
            </button>

            <button
              onClick={resetSimulation}
              className="btn-secondary btn-sm"
              style={{ background: '#ffffff' }}
              title="Reset sliders to baseline"
            >
              <RotateCcw size={13} />
              <span>Reset Baseline</span>
            </button>
          </div>
        </div>

        <div className="control-card-body">
          <p style={{ fontSize: '0.78rem', color: '#475569', marginBottom: '1.25rem' }}>
            Adjust physical and environmental stress variables in real time to observe dynamic recalculation of the AI Failure Probability and attribution reasons.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
            {/* 1. Temperature Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                  <Thermometer size={13} color="#ea580c" />
                  <span>Winding Temp</span>
                </span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: simulationParams.temperature >= 88 ? '#dc2626' : '#0f172a' }}>
                  {simulationParams.temperature}°C
                </strong>
              </div>
              <input
                type="range"
                min="60"
                max="110"
                value={simulationParams.temperature}
                onChange={(e) => updateSimulationParam('temperature', Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>60°C (Cold)</span>
                <span>80°C (Nominal)</span>
                <span>110°C (Trip)</span>
              </div>
            </div>

            {/* 2. Vibration Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                  <Gauge size={13} color="#6366f1" />
                  <span>Core Vibration</span>
                </span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: simulationParams.vibration >= 4.0 ? '#dc2626' : '#0f172a' }}>
                  {simulationParams.vibration} mm/s
                </strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="8.0"
                step="0.1"
                value={simulationParams.vibration}
                onChange={(e) => updateSimulationParam('vibration', Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>0.5 mm/s</span>
                <span>3.8 mm/s</span>
                <span>8.0 mm/s</span>
              </div>
            </div>

            {/* 3. Oil Quality */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                  <Droplets size={13} color="#0891b2" />
                  <span>DGA Oil Quality</span>
                </span>
                <strong style={{ color: simulationParams.oilQuality === 'Critical' || simulationParams.oilQuality === 'Poor' ? '#dc2626' : '#16a34a' }}>
                  {simulationParams.oilQuality}
                </strong>
              </div>
              <select
                value={simulationParams.oilQuality}
                onChange={(e) => updateSimulationParam('oilQuality', e.target.value as any)}
                className="form-select"
                style={{ height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Good">Good (IEEE Level 1)</option>
                <option value="Moderate">Moderate (IEEE Level 2)</option>
                <option value="Poor">Poor (High Acetylene)</option>
                <option value="Critical">Critical (Arcing Gas DGA)</option>
              </select>
            </div>

            {/* 4. Load % */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ color: '#334155' }}>Load Capacity</span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{simulationParams.load}%</strong>
              </div>
              <input
                type="range"
                min="40"
                max="120"
                value={simulationParams.load}
                onChange={(e) => updateSimulationParam('load', Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>40%</span>
                <span>80%</span>
                <span>120% (Overload)</span>
              </div>
            </div>

            {/* 5. Wind Speed */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                  <Wind size={13} color="#0284c7" />
                  <span>Wind Velocity</span>
                </span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{simulationParams.windSpeed} km/h</strong>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={simulationParams.windSpeed}
                onChange={(e) => updateSimulationParam('windSpeed', Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>10 km/h</span>
                <span>50 km/h</span>
                <span>100 km/h (Squall)</span>
              </div>
            </div>

            {/* 6. Rain Probability */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                  <Droplets size={13} color="#2563eb" />
                  <span>Rain Probability</span>
                </span>
                <strong style={{ fontFamily: 'var(--font-mono)' }}>{simulationParams.rainProbability}%</strong>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simulationParams.rainProbability}
                onChange={(e) => updateSimulationParam('rainProbability', Number(e.target.value))}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                <span>0% (Dry)</span>
                <span>50%</span>
                <span>100% (Downpour)</span>
              </div>
            </div>

            {/* 7. Lightning Risk */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: '0.35rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#334155' }}>
                  <Zap size={13} color="#eab308" />
                  <span>Lightning Strike Risk</span>
                </span>
                <strong style={{ color: simulationParams.lightningRisk === 'Severe' ? '#dc2626' : '#d97706' }}>
                  {simulationParams.lightningRisk}
                </strong>
              </div>
              <select
                value={simulationParams.lightningRisk}
                onChange={(e) => updateSimulationParam('lightningRisk', e.target.value as any)}
                className="form-select"
                style={{ height: '34px', fontSize: '0.8rem' }}
              >
                <option value="Low">Low (&lt; 2 strikes/km²)</option>
                <option value="Moderate">Moderate (2–8 strikes/km²)</option>
                <option value="High">High (8–20 strikes/km²)</option>
                <option value="Severe">Severe (&gt; 20 strikes/km²)</option>
              </select>
            </div>

            {/* Simulated Delta Summary */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase' }}>
                Recalculated Outcome
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: predictionResult.combinedRisk >= 80 ? '#dc2626' : '#16a34a' }}>
                {predictionResult.combinedRisk}% Risk
              </div>
              <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                Delta vs live: {riskDelta >= 0 ? `+${riskDelta}%` : `${riskDelta}%`}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

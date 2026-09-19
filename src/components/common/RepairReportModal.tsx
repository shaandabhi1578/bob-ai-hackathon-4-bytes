import React, { useState, useMemo } from 'react';
import {
  Wrench,
  CheckCircle2,
  X,
  Thermometer,
  Activity,
  Droplets,
  Zap,
  Sparkles,
  ShieldCheck,
  FileText,
  User,
} from 'lucide-react';
import { GridAsset, RepairReport } from '../../types';
import { useGrid } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';

interface RepairReportModalProps {
  asset: GridAsset;
  onClose: () => void;
}

const COMMON_REPAIR_ACTIONS = [
  'Vacuum oil dehydration & particulate filtration',
  'On-Load Tap Changer (OLTC) contact refurbishment',
  'Phase-B high-voltage bushing replacement & torque check',
  'Core harmonic damping clamps tightened to 120 Nm',
  'Radiator forced-air cooling fan motor overhaul',
  'SF6 gas replenishment to nominal 6.2 bar operating pressure',
  'Infrared thermal hotspot rectification on secondary terminals',
  'Lightning arrester lead re-termination & ground resistance check',
];

export const RepairReportModal: React.FC<RepairReportModalProps> = ({ asset, onClose }) => {
  const { repairAsset } = useGrid();
  const { user } = useAuth();

  const [technicianName, setTechnicianName] = useState(
    user?.employeeDetails?.fullName || user?.name || 'R. K. Sharma'
  );
  const [technicianRole, setTechnicianRole] = useState(
    user?.employeeDetails?.role || 'Lead High-Voltage Maintenance Specialist'
  );
  const [workSummary, setWorkSummary] = useState(
    `Completed full emergency diagnostic and mechanical overhaul on ${asset.name} at ${asset.substation}. All anomalous thermal and vibrational indicators resolved.`
  );
  const [selectedActions, setSelectedActions] = useState<string[]>([
    COMMON_REPAIR_ACTIONS[0],
    COMMON_REPAIR_ACTIONS[1],
    COMMON_REPAIR_ACTIONS[3],
  ]);

  // Post-repair telemetry inputs
  const [newTemperature, setNewTemperature] = useState<number>(56);
  const [newVibration, setNewVibration] = useState<number>(1.2);
  const [newOilQuality, setNewOilQuality] = useState<'Good' | 'Moderate' | 'Poor' | 'Critical'>('Good');
  const [newPartialDischarge, setNewPartialDischarge] = useState<number>(28);

  const toggleAction = (action: string) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  // Live calculation of projected health score and failure risk
  const projectedMetrics = useMemo(() => {
    let score = 98;
    // Temp deductions
    if (newTemperature > 70) score -= (newTemperature - 70) * 1.2;
    // Vibration deductions
    if (newVibration > 2.0) score -= (newVibration - 2.0) * 8;
    // Oil deductions
    if (newOilQuality === 'Moderate') score -= 12;
    if (newOilQuality === 'Poor' || newOilQuality === 'Critical') score -= 30;
    // Partial discharge deductions
    if (newPartialDischarge > 100) score -= 15;

    const finalHealth = Math.max(80, Math.min(99, Math.round(score)));
    const finalRisk = Math.max(3, Math.min(20, Math.round((100 - finalHealth) * 0.75)));
    const status = finalHealth >= 75 ? 'Healthy' : finalHealth >= 50 ? 'Warning' : 'Critical';

    return { healthScore: finalHealth, failureRisk: finalRisk, status };
  }, [newTemperature, newVibration, newOilQuality, newPartialDischarge]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    repairAsset(asset.id, {
      assetId: asset.id,
      assetName: asset.name,
      technicianName,
      technicianRole,
      technicianPhone: user?.employeeDetails?.phone || '9408487768',
      crewId: asset.assignedCrewId || undefined,
      workSummary,
      actionsTaken: selectedActions,
      partsReplaced: ['Insulation Gaskets', 'Auxiliary Contactor Seals'],
      metricsBefore: {
        healthScore: asset.healthScore,
        failureRisk: asset.failureRisk,
        temperature: asset.temperature,
        vibration: asset.vibration,
        oilQuality: asset.oilQuality,
        partialDischarge: asset.partialDischarge,
      },
      metricsAfter: {
        healthScore: projectedMetrics.healthScore,
        failureRisk: projectedMetrics.failureRisk,
        temperature: newTemperature,
        vibration: newVibration,
        oilQuality: newOilQuality,
        partialDischarge: newPartialDischarge,
        loadPercentage: 68,
      },
      statusAfter: projectedMetrics.status as any,
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
          maxWidth: '680px',
          maxHeight: '92vh',
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
            borderBottom: '2px solid #3b82f6',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(59, 130, 246, 0.2)',
                border: '1px solid rgba(59, 130, 246, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
              }}
            >
              <Wrench size={18} />
            </div>
            <div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>
                Field Repair Report & Health Calibration
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                {asset.name} ({asset.id}) • {asset.substation}
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
              borderRadius: '6px',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Current vs Projected Health Score Ribbon */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '0.85rem 1.25rem',
            }}
          >
            {/* Pre-repair stats */}
            <div>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
                Pre-Repair Baseline
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#dc2626', fontFamily: 'var(--font-mono)' }}>
                  {asset.healthScore}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/ 100 Health</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 600 }}>
                {asset.failureRisk}% Failure Risk ({asset.status})
              </div>
            </div>

            <div style={{ color: '#94a3b8', fontSize: '1.2rem', fontWeight: 700 }}>➔</div>

            {/* Post-repair projected stats */}
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.68rem', color: '#15803d', textTransform: 'uppercase', fontWeight: 600 }}>
                Post-Repair Projection
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'flex-end', gap: '0.4rem', marginTop: '0.2rem' }}>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                  {projectedMetrics.healthScore}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#15803d', fontWeight: 600 }}>/ 100 Health</span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>
                {projectedMetrics.failureRisk}% Failure Risk (Healthy)
              </div>
            </div>
          </div>

          {/* Technician & Lead Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Lead Technician / Specialist Name
              </label>
              <div style={{ position: 'relative' }}>
                <User size={14} color="#64748b" style={{ position: 'absolute', left: '10px', top: '10px' }} />
                <input
                  type="text"
                  required
                  value={technicianName}
                  onChange={(e) => setTechnicianName(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
                Designation / Crew Assignment
              </label>
              <input
                type="text"
                value={technicianRole}
                onChange={(e) => setTechnicianRole(e.target.value)}
                className="form-input"
                style={{ height: '34px', fontSize: '0.82rem' }}
              />
            </div>
          </div>

          {/* Action Checklist */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.4rem' }}>
              Maintenance Actions Completed on Asset
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.5rem',
                maxHeight: '140px',
                overflowY: 'auto',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '0.6rem',
                background: '#fafafa',
              }}
            >
              {COMMON_REPAIR_ACTIONS.map((action) => {
                const isChecked = selectedActions.includes(action);
                return (
                  <label
                    key={action}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.45rem',
                      fontSize: '0.73rem',
                      color: isChecked ? '#0f172a' : '#64748b',
                      cursor: 'pointer',
                      background: isChecked ? '#eff6ff' : 'transparent',
                      padding: '0.3rem 0.45rem',
                      borderRadius: '4px',
                      border: `1px solid ${isChecked ? '#bfdbfe' : 'transparent'}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleAction(action)}
                      style={{ marginTop: '2px' }}
                    />
                    <span>{action}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Post-Repair Sensor Telemetry Readings */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <Activity size={15} color="#2563eb" />
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0f172a' }}>
                Post-Repair SCADA Sensor Calibrations
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Winding Temp (°C)
                </label>
                <input
                  type="number"
                  min="40"
                  max="90"
                  value={newTemperature}
                  onChange={(e) => setNewTemperature(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '0.65rem', color: '#16a34a' }}>Target: 50–65°C</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Vibration (mm/s)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="5.0"
                  value={newVibration}
                  onChange={(e) => setNewVibration(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '0.65rem', color: '#16a34a' }}>Target: &lt; 1.8 mm/s</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Oil Quality Index
                </label>
                <select
                  value={newOilQuality}
                  onChange={(e) => setNewOilQuality(e.target.value as any)}
                  className="form-select"
                  style={{ height: '32px', fontSize: '0.78rem' }}
                >
                  <option value="Good">Good (Dielectric &gt; 60kV)</option>
                  <option value="Moderate">Moderate (Filtered)</option>
                  <option value="Poor">Poor</option>
                </select>
                <span style={{ fontSize: '0.65rem', color: '#16a34a' }}>Nominal</span>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Partial Discharge (pC)
                </label>
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={newPartialDischarge}
                  onChange={(e) => setNewPartialDischarge(Number(e.target.value))}
                  className="form-input"
                  style={{ height: '32px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '0.65rem', color: '#16a34a' }}>Target: &lt; 50 pC</span>
              </div>
            </div>
          </div>

          {/* Work Summary Notes */}
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.35rem' }}>
              Final Technician Sign-Off & Incident Closure Notes
            </label>
            <textarea
              rows={2}
              required
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              className="form-input"
              style={{ fontSize: '0.8rem', resize: 'vertical' }}
            />
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
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                borderColor: '#15803d',
                padding: '0.45rem 1.25rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Submit Repair & Restore Health ({projectedMetrics.healthScore}%)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

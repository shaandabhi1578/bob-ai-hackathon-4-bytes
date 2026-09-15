import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Navigation,
  Truck,
  Shield,
  ArrowRight,
  AlertOctagon,
  Phone,
  UserCheck,
} from 'lucide-react';
import { useGrid } from '../../context/GridContext';
import { useAuth } from '../../context/AuthContext';
import { calculateDistanceKm } from '../../utils/riskEngine';

export const CrewManagementView: React.FC = () => {
  const {
    crews,
    assets,
    selectedAssetId,
    setSelectedAssetId,
    selectedAsset,
    nearestCrewToSelected,
    assignCrew,
    unassignCrew,
    availableCrewsCount,
    totalCrewsCount,
  } = useGrid();

  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';
  const employeeCrewId = user?.employeeDetails?.assignedUnitId || (isEmployee ? 'Crew 04' : undefined);
  const employeeCrew = employeeCrewId ? crews.find((c) => c.id === employeeCrewId) : null;

  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const assignedCrewsCount = crews.filter((c) => c.status === 'Assigned').length;
  const offDutyCrewsCount = crews.filter((c) => c.status === 'Off Duty').length;

  const filteredCrews = crews.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  const recommendedCrew = nearestCrewToSelected.crew;
  const isRecommendedAssigned = recommendedCrew?.status === 'Assigned';

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Field Crew Management & Spatial Dispatch
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Live utility unit telemetry, specialized skills matrix, and algorithmic proximity routing.
          </p>
        </div>

        {/* Target Asset Selector for Distance & Routing */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#475569' }}>Target Incident:</span>
          <select
            value={selectedAssetId}
            onChange={(e) => setSelectedAssetId(e.target.value)}
            className="form-select"
            style={{ width: '250px', height: '36px', fontWeight: 600 }}
          >
            {assets.map((a) => (
              <option key={a.id} value={a.id}>
                {a.id} ({a.status}) — {a.location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        <div className="summary-card">
          <div>
            <div className="summary-card-label">Total Field Units</div>
            <div className="summary-card-value">{totalCrewsCount}</div>
            <div className="summary-card-sub">Gujarat SLDC Service Pool</div>
          </div>
          <div className="summary-card-icon" style={{ background: '#f1f5f9', color: '#0f172a' }}>
            <Users size={18} />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <div className="summary-card-label">Available for Dispatch</div>
            <div className="summary-card-value" style={{ color: '#16a34a' }}>
              {availableCrewsCount}
            </div>
            <div className="summary-card-sub" style={{ color: '#16a34a' }}>
              Immediate response status
            </div>
          </div>
          <div className="summary-card-icon" style={{ background: '#f0fdf4', color: '#16a34a' }}>
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <div className="summary-card-label">Active / Assigned</div>
            <div className="summary-card-value" style={{ color: '#d97706' }}>
              {assignedCrewsCount}
            </div>
            <div className="summary-card-sub">En-route or on work order</div>
          </div>
          <div className="summary-card-icon" style={{ background: '#fffbeb', color: '#d97706' }}>
            <Clock size={18} />
          </div>
        </div>

        <div className="summary-card">
          <div>
            <div className="summary-card-label">Off Duty / Rest</div>
            <div className="summary-card-value" style={{ color: '#64748b' }}>
              {offDutyCrewsCount}
            </div>
            <div className="summary-card-sub">Shift handover relief</div>
          </div>
          <div className="summary-card-icon" style={{ background: '#f8fafc', color: '#64748b' }}>
            <Shield size={18} />
          </div>
        </div>
      </div>

      {/* EMPLOYEE ROLE: DEDICATED WORK ORDER & READ-ONLY ACCESS CARD */}
      {isEmployee && (
        <div
          style={{
            background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
            color: '#ffffff',
            borderRadius: '10px',
            padding: '1.25rem 1.5rem',
            border: '2px solid #10b981',
            boxShadow: '0 4px 20px rgba(16, 185, 129, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Truck size={22} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                    My Assigned Field Unit: {employeeCrew?.id || 'Crew 04'} ({employeeCrew?.name || 'Sabarmati Rapid Response Transformer Unit'})
                  </span>
                  <span
                    style={{
                      background: employeeCrew?.status === 'Assigned' ? '#ef4444' : '#10b981',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      padding: '0.15rem 0.5rem',
                      borderRadius: '9999px',
                      textTransform: 'uppercase',
                    }}
                  >
                    {employeeCrew?.status || 'Available'}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#a7f3d0', marginTop: '0.2rem' }}>
                  Logged in as: <strong>{user?.name}</strong> • Phone: <strong>+91 {user?.employeeDetails?.phone || '9408487768'}</strong> • Clearance: <strong>Read-Only Field Terminal</strong>
                </div>
              </div>
            </div>

            <div
              style={{
                fontSize: '0.72rem',
                padding: '0.35rem 0.75rem',
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '6px',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
              }}
            >
              🔒 Dispatch control is locked to Chief Dispatcher / Admin
            </div>
          </div>

          <div
            style={{
              background: 'rgba(15, 23, 42, 0.65)',
              borderRadius: '8px',
              padding: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Active Work Order / Mission</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: employeeCrew?.currentAssignment ? '#fde047' : '#ffffff', marginTop: '0.2rem' }}>
                {employeeCrew?.currentAssignment || 'Standby at Staging Bay — Waiting for Admin Dispatch'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Staging Depot Location</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                {employeeCrew?.currentLocation || 'Sabarmati 400kV Staging Yard'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Vehicle & Equipment</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                {employeeCrew?.vehicle || 'GJ-01-TG-4402 (SF6 Crane Unit)'}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase' }}>Crew Members</div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ffffff', marginTop: '0.2rem' }}>
                {employeeCrew?.membersCount || 4} Specialists on duty
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 14: NEAREST CREW RECOMMENDATION PANEL */}
      <div
        className="control-card"
        style={{
          border: '2px solid #2563eb',
          background: '#f8fbff',
        }}
      >
        <div className="control-card-header" style={{ background: '#eff6ff', borderBottom: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Navigation size={16} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: '0.92rem', color: '#1e3a8a' }}>
              Algorithmic Nearest Crew Recommendation for {selectedAsset.name}
            </span>
          </div>
          <span className="badge badge-warning">
            {selectedAsset.status.toUpperCase()} INCIDENT
          </span>
        </div>

        <div className="control-card-body">
          {recommendedCrew ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem', alignItems: 'center' }}>
              {/* Incident Details & Crew Match */}
              <div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Failure Location & Impact
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a' }}>
                  {selectedAsset.name} — {selectedAsset.substation}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '0.2rem' }}>
                  Location: <strong>{selectedAsset.location}</strong> • Downstream Customers: <strong>{selectedAsset.gridImpactCustomers.toLocaleString()}</strong>
                </div>

                <div
                  style={{
                    marginTop: '0.9rem',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '0.85rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                        {recommendedCrew.id}
                      </span>
                      <span style={{ fontSize: '0.8rem', color: '#475569' }}>
                        ({recommendedCrew.name})
                      </span>
                    </div>
                    <span
                      className={`badge ${
                        recommendedCrew.status === 'Available'
                          ? 'badge-healthy'
                          : recommendedCrew.status === 'Assigned'
                          ? 'badge-warning'
                          : 'badge-neutral'
                      }`}
                    >
                      {recommendedCrew.status}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', fontSize: '0.76rem', color: '#475569', marginTop: '0.5rem' }}>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>DISTANCE</span>
                      <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: '#0f172a' }}>
                        {nearestCrewToSelected.distanceKm} km
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>EST. ARRIVAL</span>
                      <strong style={{ fontSize: '0.95rem', fontFamily: 'var(--font-mono)', color: '#16a34a' }}>
                        {nearestCrewToSelected.etaMinutes} minutes
                      </strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', display: 'block', fontSize: '0.68rem' }}>SPECIALIZATION</span>
                      <strong style={{ color: '#0f172a' }}>{recommendedCrew.specialization}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dispatch Action Trigger */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: '#334155', lineHeight: 1.4 }}>
                  <strong>{recommendedCrew.id}</strong> ({recommendedCrew.lead}) is staged at <strong>{recommendedCrew.currentLocation}</strong> with vehicle{' '}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{recommendedCrew.vehicle}</span>.
                </div>

                {isEmployee ? (
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>
                      🔒 Read-Only Dispatch Terminal
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>
                      Only Chief Dispatcher / Admin accounts can reassign or dispatch units.
                    </div>
                  </div>
                ) : isRecommendedAssigned || selectedAsset.assignedCrewId ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      disabled
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', background: '#16a34a', borderColor: '#16a34a', opacity: 0.95 }}
                    >
                      <UserCheck size={16} />
                      <span>Currently Assigned ({selectedAsset.assignedCrewId || recommendedCrew.id})</span>
                    </button>
                    <button
                      onClick={() => unassignCrew(selectedAsset.assignedCrewId || recommendedCrew.id)}
                      className="btn-secondary btn-sm"
                      style={{ background: '#fff7ed', borderColor: '#fed7aa', color: '#c2410c', fontWeight: 600 }}
                    >
                      Release
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => assignCrew(recommendedCrew.id, selectedAsset.id)}
                    className="btn-primary"
                    style={{
                      height: '44px',
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      justifyContent: 'center',
                      background: '#16a34a',
                      borderColor: '#16a34a',
                    }}
                  >
                    <Truck size={17} />
                    <span>Assign {recommendedCrew.id} (1-Click Dispatch)</span>
                  </button>
                )}

                <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
                  {isEmployee
                    ? 'Receives automatic real-time push orders and audible SCADA chimes upon admin dispatch.'
                    : 'Dispatches emergency work order and transmits geo-coordinates to mobile terminal.'}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                padding: '2rem 1.5rem',
                textAlign: 'center',
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <AlertOctagon size={28} color="#ea580c" />
              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.95rem' }}>
                All Field Crews Currently Dispatched or Off-Duty
              </div>
              <div style={{ fontSize: '0.78rem', color: '#64748b', maxWidth: '420px' }}>
                Zero available units in the SLDC staging pool. Release an active unit from another completed incident or recall off-duty personnel.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Crews Fleet Table */}
      <div className="control-card">
        <div className="control-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="control-card-title">
              <Users size={16} color="#0f172a" />
              <span>Full Field Crew Directory</span>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '6px', padding: '0.15rem' }}>
              {(['ALL', 'Available', 'Assigned', 'Off Duty'] as const).map((st) => (
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
          </div>

          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {filteredCrews.length} Units Listed
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Crew ID</th>
                <th>Unit Name & Lead</th>
                <th>Status</th>
                <th>Current Staging Location</th>
                <th>Specialization</th>
                <th>Distance to {selectedAsset.id}</th>
                <th>Current Assignment</th>
                <th style={{ textAlign: 'right' }}>Dispatch Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCrews.map((crew) => {
                const dist = calculateDistanceKm(
                  selectedAsset.coordinates.lat,
                  selectedAsset.coordinates.lng,
                  crew.coordinates.lat,
                  crew.coordinates.lng
                );
                const isSelectedCrew = crew.id === 'Crew 04';

                return (
                  <tr
                    key={crew.id}
                    style={{
                      background: isSelectedCrew ? '#f8fbff' : 'transparent',
                    }}
                  >
                    <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {crew.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{crew.name}</div>
                      <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Lead: {crew.lead} • {crew.membersCount} Crew Members</div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          crew.status === 'Available'
                            ? 'badge-healthy'
                            : crew.status === 'Assigned'
                            ? 'badge-warning'
                            : 'badge-neutral'
                        }`}
                      >
                        {crew.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem' }}>{crew.currentLocation}</td>
                    <td style={{ fontSize: '0.78rem', fontWeight: 500 }}>{crew.specialization}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {dist} km
                    </td>
                    <td style={{ fontSize: '0.75rem', color: crew.currentAssignment ? '#92400e' : '#94a3b8' }}>
                      {crew.currentAssignment || 'None (Staged on standby)'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isEmployee ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            color: '#64748b',
                            border: '1px solid #e2e8f0',
                            fontWeight: 500,
                          }}
                        >
                          Read-Only
                        </span>
                      ) : crew.status === 'Available' ? (
                        <button
                          onClick={() => assignCrew(crew.id, selectedAsset.id)}
                          className="btn-primary btn-sm"
                          style={{ fontSize: '0.74rem' }}
                        >
                          <span>Dispatch</span>
                        </button>
                      ) : crew.status === 'Assigned' ? (
                        <button
                          onClick={() => unassignCrew(crew.id)}
                          className="btn-secondary btn-sm"
                          style={{ fontSize: '0.72rem' }}
                        >
                          <span>Release</span>
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Off Duty</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

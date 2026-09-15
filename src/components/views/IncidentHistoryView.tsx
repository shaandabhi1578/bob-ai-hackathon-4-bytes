import React, { useState, useMemo } from 'react';
import {
  History,
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';
import { HISTORICAL_INCIDENTS } from '../../data/incidents';
import { useGrid } from '../../context/GridContext';

export const IncidentHistoryView: React.FC = () => {
  const { showToast } = useGrid();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const filteredIncidents = useMemo(() => {
    return HISTORICAL_INCIDENTS.filter((inc) => {
      const matchesSearch =
        inc.assetName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.cause.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.crewUsed.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'ALL' || inc.type.includes(typeFilter);
      return matchesSearch && matchesType;
    });
  }, [searchTerm, typeFilter]);

  const handleExportCSV = () => {
    showToast('Export Generated', 'Incident history audit trail exported to CSV (regulatory archive)', 'success');
  };

  return (
    <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Historical Incident Audit & RCA Logs
          </h2>
          <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Root cause analysis, customer interruption indices, and crew restoration metrics for fleet failure pattern training.
          </p>
        </div>

        <button onClick={handleExportCSV} className="btn-secondary btn-sm">
          <Download size={13} />
          <span>Export Audit Log</span>
        </button>
      </div>

      {/* Filter and Table Card */}
      <div className="control-card">
        <div className="control-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ position: 'relative', width: '280px' }}>
              <Search
                size={14}
                color="#64748b"
                style={{ position: 'absolute', left: '10px', top: '9px' }}
              />
              <input
                type="text"
                placeholder="Search Incident, Asset, Cause..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: '2rem', height: '34px', fontSize: '0.8rem' }}
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="form-select"
              style={{ width: '200px', height: '34px', fontSize: '0.78rem' }}
            >
              <option value="ALL">All Failure Modes</option>
              <option value="Insulation">Insulation & Flashover</option>
              <option value="SF6">SF6 Gas Depressurization</option>
              <option value="Phase">Phase-to-Ground Fault</option>
              <option value="Tap Changer">Tap Changer Stalling</option>
              <option value="Busbar">Busbar Overheating</option>
            </select>
          </div>

          <span style={{ fontSize: '0.74rem', color: '#64748b' }}>
            {filteredIncidents.length} Records Retrieved
          </span>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Incident ID</th>
                <th>Date</th>
                <th>Asset Name</th>
                <th>Failure Classification</th>
                <th>Root Cause Analysis</th>
                <th>Downtime</th>
                <th>Customers</th>
                <th>Repair Time</th>
                <th>Crew Unit</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((inc) => (
                <tr key={inc.id}>
                  <td style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{inc.id}</td>
                  <td style={{ fontSize: '0.78rem', color: '#64748b' }}>{inc.date}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{inc.assetName}</td>
                  <td>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem' }}>
                      {inc.type}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.76rem', color: '#475569', maxWidth: '300px', whiteSpace: 'normal' }}>
                    {inc.cause}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{inc.downtimeHours}h</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{inc.customersAffected.toLocaleString()}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: '#16a34a' }}>{inc.repairTimeHours}h</td>
                  <td style={{ fontWeight: 600, color: '#2563eb' }}>{inc.crewUsed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

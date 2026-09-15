import React from 'react';
import {
  PlayCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useGrid, NavigationTab } from '../../context/GridContext';

export interface DemoStepConfig {
  step: number;
  title: string;
  instruction: string;
  targetTab: NavigationTab;
  targetAssetId?: string;
  autoActionText?: string;
  action?: () => void;
}

export const DemoTourBar: React.FC = () => {
  const {
    demoStep,
    setDemoStep,
    isDemoTourActive,
    setIsDemoTourActive,
    setActiveTab,
    setSelectedAssetId,
    assignCrew,
    nearestCrewToSelected,
    sendOutageNotification,
    selectedAsset,
    recipients,
  } = useGrid();

  if (!isDemoTourActive) return null;

  const STEPS: DemoStepConfig[] = [
    {
      step: 1,
      title: 'Open Dashboard',
      instruction: 'Main command overview displaying high-level SCADA status and live topology.',
      targetTab: 'dashboard',
    },
    {
      step: 2,
      title: 'Verify Grid Health: 94%',
      instruction: 'Observe top summary card: 94% Grid Health, 7 At-Risk, 2 Critical, 14/21 Active Crews.',
      targetTab: 'dashboard',
    },
    {
      step: 3,
      title: 'Inspect Critical Asset T-104',
      instruction: 'Locate Sabarmati Substation S-17 pin on the interactive risk map and select Transformer T-104.',
      targetTab: 'dashboard',
      targetAssetId: 'T-104',
    },
    {
      step: 4,
      title: 'Show Sensor Telemetry',
      instruction: 'Examine abnormal temperature ramp (72°C → 91°C) and elevated core vibration (4.8 mm/s).',
      targetTab: 'asset-health',
      targetAssetId: 'T-104',
    },
    {
      step: 5,
      title: 'Open Weather Panel',
      instruction: 'Review regional meteorological intelligence and Doppler radar reflectivity.',
      targetTab: 'weather',
    },
    {
      step: 6,
      title: 'Show Severe Weather Approaching',
      instruction: 'Severe squall (48 km/h winds, 72% precipitation) approaching Ahmedabad West corridor.',
      targetTab: 'weather',
    },
    {
      step: 7,
      title: 'Open Failure Prediction Engine',
      instruction: 'Enter the multi-vector AI risk diagnostic workspace for Transformer T-104.',
      targetTab: 'failure-prediction',
      targetAssetId: 'T-104',
    },
    {
      step: 8,
      title: 'Review Failure Probability: 87%',
      instruction: 'Combined risk model calculates 87% failure probability with 89% model confidence.',
      targetTab: 'failure-prediction',
      targetAssetId: 'T-104',
    },
    {
      step: 9,
      title: 'Explain WHY Probability is High',
      instruction: 'Review ranked AI attribution reasons (temperature spike, vibration, DGA oil breakdown, storm).',
      targetTab: 'failure-prediction',
      targetAssetId: 'T-104',
    },
    {
      step: 10,
      title: 'Open Crew Management',
      instruction: 'Inspect Gujarat SLDC field pool (14 available, 5 assigned, 2 off duty).',
      targetTab: 'crew-management',
    },
    {
      step: 11,
      title: 'Show Nearest Available Crew',
      instruction: 'Algorithmic proximity identifies Crew 04 (4.2 km away, 12 min arrival time, Transformer Specialist).',
      targetTab: 'crew-management',
      targetAssetId: 'T-104',
    },
    {
      step: 12,
      title: 'Assign Crew 04',
      instruction: 'Click "Assign Crew 04" to transition unit to Assigned and dispatch emergency work order.',
      targetTab: 'crew-management',
      autoActionText: 'Dispatch Crew 04',
      action: () => assignCrew('Crew 04', 'T-104'),
    },
    {
      step: 13,
      title: 'Generate Prioritized Maintenance Plan',
      instruction: 'Review Maintenance Priority Queue ranked by Risk × Impact × Weather × Criticality.',
      targetTab: 'work-analysis',
    },
    {
      step: 14,
      title: 'Open Outage Notifications',
      instruction: 'Access consumer notification and emergency broadcast scheduling system.',
      targetTab: 'outage-notifications',
      targetAssetId: 'T-104',
    },
    {
      step: 15,
      title: 'Select Affected Region',
      instruction: 'Ahmedabad West / Sabarmati Industrial Feeder automatically targeted.',
      targetTab: 'outage-notifications',
      targetAssetId: 'T-104',
    },
    {
      step: 16,
      title: 'Generate Outage Message',
      instruction: 'Automated broadcast message formulated with regulatory advisory disclosures.',
      targetTab: 'outage-notifications',
    },
    {
      step: 17,
      title: 'Set Outage Window: 14:30 – 17:00',
      instruction: 'Low-impact window confirmed based on minimum load valley and Crew 04 ETA.',
      targetTab: 'outage-notifications',
    },
    {
      step: 18,
      title: 'Select Recipients',
      instruction: 'Verify registered hospital, municipal water, and commercial feeder contacts.',
      targetTab: 'outage-notifications',
    },
    {
      step: 19,
      title: 'Send Simulated Notification',
      instruction: 'Simulated telecom transmission broadcasted successfully with delivery audit stamp.',
      targetTab: 'outage-notifications',
      autoActionText: 'Send Simulated Notice',
      action: () => {
        sendOutageNotification({
          region: 'Ahmedabad West',
          affectedAssetId: 'T-104',
          affectedAssetName: 'Transformer T-104',
          windowStart: '14:30',
          windowEnd: '17:00',
          durationHours: 2.5,
          reason: 'Emergency transformer maintenance following detected failure risk',
          recipientsCount: recipients.length,
          messageText: `[GRIDGUARD ALERT] Region: Ahmedabad West\nAffected: Transformer T-104\nWindow: 14:30 - 17:00 (2.5 hrs)`,
        });
      },
    },
    {
      step: 20,
      title: 'Return to Dashboard',
      instruction: 'Navigate back to the main control-room interface.',
      targetTab: 'dashboard',
    },
    {
      step: 21,
      title: 'Verify Updated Operational State',
      instruction: 'Notice Crew 04 is now assigned, active crew count updated, and action logs recorded.',
      targetTab: 'dashboard',
    },
  ];

  const currentStepConfig = STEPS[demoStep - 1] || STEPS[0];

  const handleNext = () => {
    if (demoStep < STEPS.length) {
      const nextStep = demoStep + 1;
      setDemoStep(nextStep);
      const nextConfig = STEPS[nextStep - 1];
      setActiveTab(nextConfig.targetTab);
      if (nextConfig.targetAssetId) {
        setSelectedAssetId(nextConfig.targetAssetId);
      }
    }
  };

  const handlePrev = () => {
    if (demoStep > 1) {
      const prevStep = demoStep - 1;
      setDemoStep(prevStep);
      const prevConfig = STEPS[prevStep - 1];
      setActiveTab(prevConfig.targetTab);
      if (prevConfig.targetAssetId) {
        setSelectedAssetId(prevConfig.targetAssetId);
      }
    }
  };

  const executeAutoAction = () => {
    if (currentStepConfig.action) {
      currentStepConfig.action();
    }
    handleNext();
  };

  return (
    <div
      style={{
        position: 'sticky',
        top: '64px',
        zIndex: 25,
        backgroundColor: '#0f172a',
        color: '#ffffff',
        borderBottom: '1px solid #334155',
        padding: '0.65rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div
          style={{
            background: '#2563eb',
            color: '#ffffff',
            padding: '0.2rem 0.55rem',
            borderRadius: '4px',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
          }}
        >
          DEMO FLOW: {demoStep} / 21
        </div>

        <div>
          <span style={{ fontWeight: 700, fontSize: '0.86rem', marginRight: '0.5rem' }}>
            {currentStepConfig.title}:
          </span>
          <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
            {currentStepConfig.instruction}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {currentStepConfig.action && (
          <button
            onClick={executeAutoAction}
            className="btn-primary btn-sm"
            style={{
              background: '#16a34a',
              borderColor: '#16a34a',
              fontWeight: 600,
            }}
          >
            <CheckCircle2 size={13} />
            <span>{currentStepConfig.autoActionText || 'Execute Step'}</span>
          </button>
        )}

        <button
          onClick={handlePrev}
          disabled={demoStep === 1}
          className="btn-secondary btn-sm"
          style={{
            background: '#1e293b',
            color: '#cbd5e1',
            borderColor: '#334155',
            opacity: demoStep === 1 ? 0.5 : 1,
          }}
        >
          <ChevronLeft size={14} />
          <span>Prev</span>
        </button>

        <button
          onClick={handleNext}
          disabled={demoStep === 21}
          className="btn-primary btn-sm"
          style={{
            background: '#2563eb',
            borderColor: '#2563eb',
            fontWeight: 600,
            opacity: demoStep === 21 ? 0.5 : 1,
          }}
        >
          <span>Next Step</span>
          <ChevronRight size={14} />
        </button>

        <button
          onClick={() => setIsDemoTourActive(false)}
          className="icon-btn"
          style={{
            background: '#1e293b',
            borderColor: '#334155',
            color: '#94a3b8',
            width: '28px',
            height: '28px',
          }}
          title="Close Walkthrough"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

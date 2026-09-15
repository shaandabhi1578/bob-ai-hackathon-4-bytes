import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  GridAsset,
  Crew,
  WeatherRegion,
  OutageRecipient,
  OutageNotification,
  SimulationParams,
} from '../types';
import { INITIAL_ASSETS } from '../data/assets';
import { INITIAL_CREWS } from '../data/crews';
import { WEATHER_REGIONS } from '../data/weather';
import { INITIAL_RECIPIENTS, INITIAL_NOTIFICATIONS } from '../data/notifications';
import {
  calculateRiskFromParams,
  findNearestAvailableCrew,
  recalculateAssetWithWeather,
  RiskCalculationResult,
} from '../utils/riskEngine';
import { fetchLiveRegionWeather } from '../services/weatherService';

export type NavigationTab =
  | 'dashboard'
  | 'asset-health'
  | 'weather'
  | 'failure-prediction'
  | 'work-analysis'
  | 'crew-management'
  | 'outage-notifications'
  | 'incident-history'
  | 'settings';

export interface CopilotMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionRecommendation?: {
    label: string;
    targetTab: NavigationTab;
    targetAssetId?: string;
  };
}

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'critical' | 'info';
}

interface GridContextType {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Assets
  assets: GridAsset[];
  selectedAssetId: string;
  setSelectedAssetId: (id: string) => void;
  selectedAsset: GridAsset;
  quickInspectAsset: GridAsset | null;
  setQuickInspectAsset: (asset: GridAsset | null) => void;

  // Crews
  crews: Crew[];
  assignCrew: (crewId: string, assetId: string) => void;
  unassignCrew: (crewId: string) => void;
  unassignAssetCrew: (assetId: string) => void;
  nearestCrewToSelected: { crew: Crew | null; distanceKm: number; etaMinutes: number };

  // Weather
  weatherRegions: WeatherRegion[];
  activeWeatherRegion: WeatherRegion;
  setActiveWeatherRegionId: (id: string) => void;
  updateWeatherRegion: (regionId: string, updates: Partial<WeatherRegion>) => void;
  fetchLiveWeatherForActiveRegion: () => Promise<void>;
  fetchLiveWeatherForAllRegions: () => Promise<void>;
  applyWeatherPreset: (preset: 'severe-squall' | 'extreme-heatwave' | 'monsoon-downpour' | 'nominal-clear') => void;
  isWeatherLoading: boolean;
  weatherLastSyncedAt: string | null;

  // Outage & Notifications
  recipients: OutageRecipient[];
  addRecipient: (recipient: Omit<OutageRecipient, 'id' | 'verified'>) => void;
  notifications: OutageNotification[];
  sendOutageNotification: (notification: Omit<OutageNotification, 'id' | 'timestamp' | 'status'>) => void;

  // Prediction Engine & Simulation
  simulationParams: SimulationParams;
  updateSimulationParam: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void;
  resetSimulation: () => void;
  predictionResult: RiskCalculationResult;

  // System KPIs
  gridHealthScore: number;
  atRiskAssetsCount: number;
  criticalAssetsCount: number;
  availableCrewsCount: number;
  totalCrewsCount: number;

  // Copilot
  isCopilotOpen: boolean;
  setIsCopilotOpen: (open: boolean) => void;
  copilotMessages: CopilotMessage[];
  sendCopilotQuery: (prompt: string) => void;

  // Toast
  toast: ToastNotification | null;
  showToast: (title: string, message: string, type?: 'success' | 'warning' | 'critical' | 'info') => void;
  clearToast: () => void;

  // Real-Time Cross-Client Synchronization
  liveBroadcastAlert: { id: string; title: string; message: string; timestamp: string; sender: string } | null;
  clearBroadcastAlert: () => void;
  triggerPhoneAlert: (mobile: string | string[], title: string, message: string) => void;

  // Hackathon Demo Tour Guide
  demoStep: number;
  setDemoStep: (step: number) => void;
  advanceDemoStep: () => void;
  isDemoTourActive: boolean;
  setIsDemoTourActive: (active: boolean) => void;
}

const GridContext = createContext<GridContextType | undefined>(undefined);

export const GridProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavigationTab>('dashboard');
  const [assets, setAssets] = useState<GridAsset[]>(INITIAL_ASSETS);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('T-104');
  const [quickInspectAsset, setQuickInspectAsset] = useState<GridAsset | null>(null);

  const [crews, setCrews] = useState<Crew[]>(INITIAL_CREWS);
  const [weatherRegions, setWeatherRegions] = useState<WeatherRegion[]>(WEATHER_REGIONS);
  const [activeWeatherRegionId, setActiveWeatherRegionId] = useState<string>('reg-amd');
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [weatherLastSyncedAt, setWeatherLastSyncedAt] = useState<string | null>(null);

  const [recipients, setRecipients] = useState<OutageRecipient[]>(INITIAL_RECIPIENTS);
  const [notifications, setNotifications] = useState<OutageNotification[]>(INITIAL_NOTIFICATIONS);

  const [toast, setToast] = useState<ToastNotification | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [demoStep, setDemoStep] = useState<number>(1);
  const [isDemoTourActive, setIsDemoTourActive] = useState<boolean>(false);

  // Real-Time Cross-Client Sync Alert State
  const [liveBroadcastAlert, setLiveBroadcastAlert] = useState<{
    id: string;
    title: string;
    message: string;
    timestamp: string;
    sender: string;
  } | null>(null);

  const clearBroadcastAlert = () => setLiveBroadcastAlert(null);

  // Web Audio chime for real-time dispatch alarm
  const playAlertChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {
      // Audio context may be restricted before user gesture
    }
  };

  // BroadcastChannel listener for multi-device/multi-tab real-time alerts
  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    const handleIncomingDispatch = (data: any) => {
      if (data?.type === 'CREW_DISPATCHED') {
        playAlertChime();
        setLiveBroadcastAlert({
          id: Date.now().toString(),
          title: `🚨 EMERGENCY WORK ORDER: ${data.crewId}`,
          message: `${data.sender} dispatched ${data.crewId} (${data.crewLead || 'Lead'}) to ${data.assetName} at ${data.substation || 'Bay'}.\nTarget Incident: ${data.assetId} | Destination Mobile: +91 9408487768`,
          timestamp: data.timestamp,
          sender: data.sender,
        });

        // Sync crew status in this tab
        setCrews((prev) =>
          prev.map((c) =>
            c.id === data.crewId
              ? {
                  ...c,
                  status: 'Assigned',
                  currentAssignment: `Emergency dispatch to ${data.assetName} (${data.substation || ''})`,
                }
              : c
          )
        );

        // Also update the target asset with the assigned crew!
        if (data.assetId) {
          setAssets((prev) =>
            prev.map((a) =>
              a.id === data.assetId
                ? {
                    ...a,
                    assignedCrewId: data.crewId,
                    recommendedAction: `In Progress: ${data.crewId} dispatched to site`,
                  }
                : a
            )
          );
        }

        // Trigger native phone/browser push if enabled
        triggerPhoneAlert(
          '9408487768',
          `🚨 Emergency Dispatch: ${data.crewId}`,
          `${data.sender} dispatched ${data.crewId} to ${data.assetName}`
        );
      }
    };

    // 1. BroadcastChannel
    try {
      channel = new BroadcastChannel('gridguard_realtime_events');
      channel.onmessage = (event) => {
        handleIncomingDispatch(event.data);
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported', e);
    }

    // 2. Storage event for universal cross-tab sync
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === 'gridguard_latest_dispatch_order' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          handleIncomingDispatch(parsed);
        } catch (err) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', onStorageChange);

    return () => {
      channel?.close();
      window.removeEventListener('storage', onStorageChange);
    };
  }, []);

  // Trigger Phone / Browser Push Notification
  const triggerPhoneAlert = (mobile: string | string[], title: string, message: string) => {
    const mobLabel = Array.isArray(mobile)
      ? `${mobile.length} phones (${mobile.map((m) => m.slice(-10)).join(', ')})`
      : mobile;
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: `Direct Alert to ${mobLabel}:\n${message}`,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%232563eb" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') {
            new Notification(title, {
              body: `Direct Alert to ${mobLabel}:\n${message}`,
            });
          }
        });
      }
    }
  };

  // Selected asset object
  const selectedAsset = useMemo(() => {
    return assets.find((a) => a.id === selectedAssetId) || assets[0];
  }, [assets, selectedAssetId]);

  // Active weather region
  const activeWeatherRegion = useMemo(() => {
    return weatherRegions.find((r) => r.id === activeWeatherRegionId) || weatherRegions[0];
  }, [weatherRegions, activeWeatherRegionId]);

  // Map asset location string to WeatherRegion ID
  const mapLocationToRegionId = (location: string): string => {
    const loc = location.toLowerCase();
    if (loc.includes('gandhinagar') || loc.includes('sachivalaya')) return 'reg-gn';
    if (loc.includes('vadodara') || loc.includes('petrochemical')) return 'reg-vad';
    if (loc.includes('sanand')) return 'reg-san';
    return 'reg-amd';
  };

  // Ripple weather changes across grid assets
  const syncAssetsWithWeather = (updatedRegions: WeatherRegion[]) => {
    setAssets((prevAssets) => {
      return prevAssets.map((asset) => {
        const regId = mapLocationToRegionId(asset.location);
        const region = updatedRegions.find((r) => r.id === regId) || updatedRegions[0];

        const { weatherRisk, failureRisk, status, healthScore, priority } = recalculateAssetWithWeather(
          asset,
          {
            windSpeed: region.windSpeed,
            rainfallProb: region.rainfallProb,
            lightningRisk: region.lightningRisk,
            temperature: region.temperature,
          }
        );

        let adjustedTemp = asset.temperature;
        if (region.temperature >= 40 && asset.temperature < 88) {
          adjustedTemp = Math.round(asset.temperature + (region.temperature - 36) * 0.7);
        } else if (region.temperature <= 25 && asset.temperature > 65) {
          adjustedTemp = Math.max(60, Math.round(asset.temperature - 5));
        }

        return {
          ...asset,
          weatherRisk,
          failureRisk,
          status,
          healthScore,
          priority,
          temperature: adjustedTemp,
          weatherExposure:
            region.gridWeatherRisk === 'HIGH'
              ? 'High'
              : region.gridWeatherRisk === 'MEDIUM'
              ? 'Medium'
              : 'Low',
        };
      });
    });
  };

  const updateWeatherRegion = (regionId: string, updates: Partial<WeatherRegion>) => {
    const updated = weatherRegions.map((r) => {
      if (r.id !== regionId) return r;
      const combined = { ...r, ...updates };

      let risk: 'HIGH' | 'MEDIUM' | 'LOW' = combined.gridWeatherRisk;
      if (
        combined.windSpeed >= 50 ||
        combined.rainfallProb >= 80 ||
        combined.temperature >= 40 ||
        combined.lightningRisk === 'Severe'
      ) {
        risk = 'HIGH';
      } else if (
        combined.windSpeed >= 30 ||
        combined.rainfallProb >= 45 ||
        combined.lightningRisk === 'Moderate' ||
        combined.lightningRisk === 'High'
      ) {
        risk = 'MEDIUM';
      } else {
        risk = 'LOW';
      }

      return {
        ...combined,
        gridWeatherRisk: risk,
      };
    });

    setWeatherRegions(updated);
    syncAssetsWithWeather(updated);

    if (regionId === activeWeatherRegionId) {
      const activeReg = updated.find((r) => r.id === regionId);
      if (activeReg) {
        setSimulationParams((prev) => ({
          ...prev,
          windSpeed: activeReg.windSpeed,
          rainProbability: activeReg.rainfallProb,
          lightningRisk: activeReg.lightningRisk,
        }));
      }
    }
  };

  const fetchLiveWeatherForActiveRegion = async () => {
    setIsWeatherLoading(true);
    try {
      const report = await fetchLiveRegionWeather(activeWeatherRegionId);
      updateWeatherRegion(activeWeatherRegionId, {
        temperature: report.temperature,
        windSpeed: report.windSpeed,
        humidity: report.humidity,
        rainfallProb: report.rainfallProb,
        condition: report.condition,
        gridWeatherRisk: report.gridWeatherRisk,
        warningMessage: report.warningMessage,
      });
      setWeatherLastSyncedAt(report.fetchedAt);
      showToast(
        'Live Meteorological Feed Updated',
        `Real-time conditions for ${activeWeatherRegion.name} synced (${report.temperature}°C, ${report.windSpeed} km/h, ${report.condition}). Source: ${report.source}.`,
        'success'
      );
    } catch (e) {
      showToast('Weather Sync Notice', 'Could not refresh live meteorological feed; using cached Doppler radar.', 'warning');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const fetchLiveWeatherForAllRegions = async () => {
    setIsWeatherLoading(true);
    try {
      for (const reg of weatherRegions) {
        const report = await fetchLiveRegionWeather(reg.id);
        updateWeatherRegion(reg.id, {
          temperature: report.temperature,
          windSpeed: report.windSpeed,
          humidity: report.humidity,
          rainfallProb: report.rainfallProb,
          condition: report.condition,
          gridWeatherRisk: report.gridWeatherRisk,
          warningMessage: report.warningMessage,
        });
      }
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setWeatherLastSyncedAt(timeStr);
      showToast('All Gujarat Regions Synced', 'Live Open-Meteo weather report applied across Ahmedabad, Gandhinagar, Vadodara, and Sanand.', 'success');
    } catch (e) {
      showToast('Weather Sync Notice', 'Partial weather sync completed.', 'info');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const applyWeatherPreset = (preset: 'severe-squall' | 'extreme-heatwave' | 'monsoon-downpour' | 'nominal-clear') => {
    const presets: Record<
      typeof preset,
      {
        condition: string;
        temperature: number;
        rainfallProb: number;
        windSpeed: number;
        humidity: number;
        lightningRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
        warningMessage?: string;
        explanation: string;
      }
    > = {
      'severe-squall': {
        condition: 'Severe Convective Squall Line',
        temperature: 31,
        rainfallProb: 88,
        windSpeed: 64,
        humidity: 86,
        lightningRisk: 'Severe',
        warningMessage: 'Red Alert: 64 km/h wind shear and severe lightning front passing directly over 400kV transmission corridor.',
        explanation: 'Extreme aerodynamic loading on transmission towers + heavy moisture flashover risk on substation transformer bushings.',
      },
      'extreme-heatwave': {
        condition: 'Extreme Ambient Heatwave & High Load',
        temperature: 44,
        rainfallProb: 5,
        windSpeed: 28,
        humidity: 32,
        lightningRisk: 'Low',
        warningMessage: 'Orange Alert: Ambient temperature at 44°C. Severe transformer thermal overload and accelerated oil degradation.',
        explanation: 'High ambient temperature drastically reduces transformer cooling capacity, triggering accelerated insulation breakdown.',
      },
      'monsoon-downpour': {
        condition: 'Continuous Monsoon Torrential Downpour',
        temperature: 28,
        rainfallProb: 96,
        windSpeed: 42,
        humidity: 95,
        lightningRisk: 'High',
        warningMessage: 'Yellow Alert: Torrential rain and saturated soil around substation cable trenches and foundations.',
        explanation: 'Standing rainwater elevates ground earth fault probabilities and insulator leakage currents across all open yards.',
      },
      'nominal-clear': {
        condition: 'Nominal Clear Skies & Mild Breeze',
        temperature: 27,
        rainfallProb: 6,
        windSpeed: 14,
        humidity: 48,
        lightningRisk: 'Low',
        warningMessage: undefined,
        explanation: 'Ideal meteorological parameters. Zero elevated weather risk for transmission and substation equipment.',
      },
    };

    const sel = presets[preset];
    if (sel) {
      updateWeatherRegion(activeWeatherRegionId, sel);
      showToast(
        'Weather Scenario Applied',
        `Applied "${sel.condition}" to ${activeWeatherRegion.name}. Asset risks and failure predictions recomputed.`,
        'info'
      );
    }
  };

  // Simulation Parameters initialized to selected asset's baseline
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    temperature: 91,
    vibration: 4.8,
    oilQuality: 'Poor',
    load: 88,
    windSpeed: 48,
    rainProbability: 72,
    lightningRisk: 'Moderate',
  });

  // When selectedAssetId changes, sync simulation params to that asset's values
  useEffect(() => {
    if (selectedAsset) {
      setSimulationParams({
        temperature: selectedAsset.temperature,
        vibration: selectedAsset.vibration,
        oilQuality: selectedAsset.oilQuality,
        load: selectedAsset.loadPercentage,
        windSpeed: activeWeatherRegion.windSpeed,
        rainProbability: activeWeatherRegion.rainfallProb,
        lightningRisk: activeWeatherRegion.lightningRisk,
      });
    }
  }, [selectedAssetId]);

  const updateSimulationParam = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    setSimulationParams((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const resetSimulation = () => {
    if (selectedAsset) {
      setSimulationParams({
        temperature: selectedAsset.temperature,
        vibration: selectedAsset.vibration,
        oilQuality: selectedAsset.oilQuality,
        load: selectedAsset.loadPercentage,
        windSpeed: activeWeatherRegion.windSpeed,
        rainProbability: activeWeatherRegion.rainfallProb,
        lightningRisk: activeWeatherRegion.lightningRisk,
      });
      showToast('Simulation Reset', 'Restored live SCADA sensor & meteorological baselines', 'info');
    }
  };

  // Dynamically calculate risk
  const predictionResult = useMemo(() => {
    return calculateRiskFromParams(simulationParams, selectedAsset);
  }, [simulationParams, selectedAsset]);

  // Nearest crew to currently selected asset
  const nearestCrewToSelected = useMemo(() => {
    return findNearestAvailableCrew(selectedAsset, crews);
  }, [selectedAsset, crews]);

  // KPI Calculations
  const gridHealthScore = useMemo(() => {
    // Exactly 94% Healthy initial baseline matching SCADA specification
    const criticalCount = assets.filter((a) => a.status === 'Critical').length;
    const warningCount = assets.filter((a) => a.status === 'Warning').length;
    const base = 98;
    const deduction = criticalCount * 1.5 + warningCount * 0.2;
    return Math.max(70, Math.min(99, Math.round(base - deduction)));
  }, [assets]);

  const atRiskAssetsCount = useMemo(() => {
    return assets.filter((a) => a.status !== 'Healthy').length;
  }, [assets]);

  const criticalAssetsCount = useMemo(() => {
    return assets.filter((a) => a.status === 'Critical').length;
  }, [assets]);

  const availableCrewsCount = useMemo(() => {
    return crews.filter((c) => c.status === 'Available').length;
  }, [crews]);

  const totalCrewsCount = crews.length;

  // Toast Helper
  const showToast = (title: string, message: string, type: 'success' | 'warning' | 'critical' | 'info' = 'info') => {
    const id = Date.now().toString();
    setToast({ id, title, message, type });
    setTimeout(() => {
      setToast((cur) => (cur?.id === id ? null : cur));
    }, 4500);
  };

  const clearToast = () => setToast(null);

  // Crew Assignment Action with Strict Availability & Duplicate Guard
  const assignCrew = (crewId: string, assetId: string) => {
    const targetAsset = assets.find((a) => a.id === assetId);
    const targetCrew = crews.find((c) => c.id === crewId);

    if (!targetCrew || !targetAsset) return;

    // Strict availability check!
    if (targetCrew.status !== 'Available') {
      showToast(
        'Crew Unavailable',
        `${targetCrew.id} (${targetCrew.lead}) is currently "${targetCrew.status}" and cannot be dispatched. Please choose an Available unit.`,
        'warning'
      );
      return;
    }

    // Check if asset already has an assigned crew
    if (targetAsset.assignedCrewId && targetAsset.assignedCrewId !== crewId) {
      showToast(
        'Asset Already Assigned',
        `${targetAsset.name} already has ${targetAsset.assignedCrewId} assigned. Release the current unit first before reassigning.`,
        'warning'
      );
      return;
    }

    setCrews((prevCrews) =>
      prevCrews.map((c) =>
        c.id === crewId
          ? {
              ...c,
              status: 'Assigned' as const,
              currentAssignment: `Emergency dispatch to ${targetAsset.name} (${targetAsset.substation})`,
            }
          : c
      )
    );

    setAssets((prevAssets) =>
      prevAssets.map((a) =>
        a.id === assetId
          ? {
              ...a,
              assignedCrewId: crewId,
              recommendedAction: `${crewId} dispatched on-site; inspection & thermal scan in progress`,
            }
          : a
      )
    );

    showToast(
      'Crew Dispatched',
      `${targetCrew.id} (${targetCrew.lead}) dispatched to ${targetAsset.id}. Status changed from Available to Assigned.`,
      'success'
    );

    // Cross-Tab & Cross-Device Real-Time Broadcast
    const dispatchPayload = {
      type: 'CREW_DISPATCHED',
      crewId: targetCrew.id,
      crewLead: targetCrew.lead,
      assetId: targetAsset.id,
      assetName: targetAsset.name,
      substation: targetAsset.substation,
      location: targetAsset.location,
      sender: 'Chief Dispatcher Shaan (Admin Desk 01)',
      phone: '9408487768',
      reason: `Emergency dispatch for high failure risk (${targetAsset.failureRisk}%) on ${targetAsset.name}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };

    try {
      const channel = new BroadcastChannel('gridguard_realtime_events');
      channel.postMessage(dispatchPayload);
      channel.close();
    } catch (e) {
      console.warn('BroadcastChannel error', e);
    }

    // Secondary cross-tab sync via localStorage event (universal support across all browsers)
    try {
      localStorage.setItem('gridguard_latest_dispatch_order', JSON.stringify({
        ...dispatchPayload,
        _nonce: Date.now(),
      }));
    } catch (e) {
      // ignore
    }

    // Trigger Mobile Phone / Desktop Push Alert
    triggerPhoneAlert(
      '9408487768',
      '🚨 Field Dispatch Order Received',
      `Admin dispatched ${targetCrew.id} (${targetCrew.lead}) to ${targetAsset.name}, ${targetAsset.substation}. Status: ASSIGNED.`
    );
  };

  const unassignCrew = (crewId: string) => {
    setCrews((prev) =>
      prev.map((c) =>
        c.id === crewId
          ? {
              ...c,
              status: 'Available' as const,
              currentAssignment: null,
              lastCompletedWork: 'Completed work order and returned to staging depot',
            }
          : c
      )
    );

    // Clear assignment on the asset as well!
    setAssets((prev) =>
      prev.map((a) =>
        a.assignedCrewId === crewId
          ? {
              ...a,
              assignedCrewId: null,
              recommendedAction: 'Routine monitoring; field unit returned to standby',
            }
          : a
      )
    );

    showToast('Crew Released', `${crewId} has returned to Available status.`, 'info');
  };

  const unassignAssetCrew = (assetId: string) => {
    const targetAsset = assets.find((a) => a.id === assetId);
    if (!targetAsset || !targetAsset.assignedCrewId) return;
    unassignCrew(targetAsset.assignedCrewId);
  };

  // Add Outage Recipient
  const addRecipient = (recipient: Omit<OutageRecipient, 'id' | 'verified'>) => {
    const newRec: OutageRecipient = {
      ...recipient,
      id: `REC-${String(recipients.length + 1).padStart(2, '0')}`,
      verified: true,
    };
    setRecipients((prev) => [newRec, ...prev]);
    showToast('Recipient Added', `${newRec.name} (${newRec.mobile}) added to emergency broadcast registry.`, 'success');
  };

  // Send Outage Notification
  const sendOutageNotification = (
    notifData: Omit<OutageNotification, 'id' | 'timestamp' | 'status'>
  ) => {
    const now = new Date();
    const timestamp = `${now.toISOString().slice(0, 10)} ${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const newNotification: OutageNotification = {
      ...notifData,
      id: `NOTIF-2026-${String(notifications.length + 1).padStart(3, '0')}`,
      timestamp,
      status: 'Simulated Sent',
    };

    setNotifications((prev) => [newNotification, ...prev]);

    showToast(
      'Notification Broadcasted',
      `Simulated transmission sent to ${notifData.recipientsCount} recipient(s) in ${notifData.region}.`,
      'success'
    );
  };

  // Copilot Initial Messages & Logic
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-init',
      sender: 'assistant',
      text: "Welcome, Dispatcher. I am GridGuard Copilot. I continuously monitor real-time SCADA telemetry, regional weather vectors, and historical failure topologies across Gujarat's power grid. How can I assist you right now?",
      timestamp: '11:50',
    },
  ]);

  const sendCopilotQuery = (prompt: string) => {
    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setCopilotMessages((prev) => [...prev, userMsg]);

    // Generate grounded contextual response
    setTimeout(() => {
      let replyText = '';
      let actionRec: CopilotMessage['actionRecommendation'] = undefined;
      const q = prompt.toLowerCase();

      const crew04 = crews.find((c) => c.id === 'Crew 04');
      const isCrew04Assigned = crew04?.status === 'Assigned';

      if (q.includes('why is t-104') || q.includes('t-104 critical') || q.includes('why t104') || q.includes('t-104 at high risk')) {
        replyText = `Transformer T-104 currently presents an 87% predicted failure probability. The primary risk drivers are:\n1. Elevated winding temperature (91°C, up 18% over the past 7 days).\n2. Harmonic vibration at 4.8 mm/s indicating severe core/winding loosening.\n3. Degraded mineral oil with elevated acetylene DGA levels.\n4. Severe convective squall (48 km/h winds, 72% rain) forecast for Ahmedabad West.\n\nBecause it supplies 18,400 customers, I strongly recommend immediate inspection within 12 hours.`;
        actionRec = {
          label: 'View Failure Prediction for T-104',
          targetTab: 'failure-prediction',
          targetAssetId: 'T-104',
        };
      } else if (q.includes('most dangerous asset') || q.includes('biggest problem') || q.includes('highest risk')) {
        replyText = `The most critical asset on the grid is Transformer T-104 (Substation S-17 Sabarmati 400kV) with an 87% failure probability and 18,400 customers at risk, followed closely by Transformer T-208 (81% risk, 12,200 customers). Combined, they represent immediate high grid exposure.`;
        actionRec = {
          label: 'Review Critical Assets',
          targetTab: 'asset-health',
        };
      } else if (q.includes('crew is closest') || q.includes('nearest crew') || q.includes('crew 04')) {
        if (isCrew04Assigned) {
          replyText = `Crew 04 (Lead: R. K. Sharma) has already been dispatched to ${selectedAsset.name}. Their ETA is approximately 12 minutes (4.2 km). Staging status is currently ASSIGNED.`;
        } else {
          replyText = `The nearest available unit to Transformer T-104 is Crew 04 (Specialization: Transformer Maintenance, Lead: R. K. Sharma). They are staged at Ahmedabad West Substation 12 Depot, 4.2 km away, with an estimated arrival time of 12 minutes.`;
        }
        actionRec = {
          label: 'Open Crew Management',
          targetTab: 'crew-management',
        };
      } else if (q.includes('maintain first') || q.includes('maintenance should we perform') || q.includes('priority queue')) {
        replyText = `Based on the multi-factor index (Failure Risk × Customer Impact × Weather Exposure), the top 2 priorities for today are:\n1. Transformer T-104: Emergency thermal scan and tap-changer inspection.\n2. Transformer T-208: Vibration diagnostic and phase-B bushing scan.\nI recommend scheduling the work during the 14:30 – 17:00 low-load window.`;
        actionRec = {
          label: 'Open Maintenance Queue',
          targetTab: 'work-analysis',
        };
      } else if (q.includes('weather') || q.includes('outages tomorrow') || q.includes('storm')) {
        replyText = `Ahmedabad West is currently under a Yellow Alert. A severe convective storm front with wind gusts up to 65 km/h, 72% precipitation probability, and moderate lightning is expected in the next 18–36 hours. Exposed assets like Substation S-17 and Transformer T-104 are in the direct impact track.`;
        actionRec = {
          label: 'Open Weather Intelligence',
          targetTab: 'weather',
        };
      } else if (q.includes('how many customers') || q.includes('customers affected')) {
        replyText = `Currently, 18,400 customers are at risk under Transformer T-104, and 12,200 under Transformer T-208. A total of 30,600 customers are served by our critical asset tier. For a controlled planned outage on T-104, automated back-feeds can isolate impact to approximately 6,200 customers.`;
        actionRec = {
          label: 'Open Outage Notifications',
          targetTab: 'outage-notifications',
        };
      } else {
        replyText = `I have analyzed telemetry, weather, and crew logs for "${prompt}". System telemetry shows grid health at ${gridHealthScore}% with ${criticalAssetsCount} critical assets requiring intervention. Crew 04 remains staged for rapid dispatch. Let me know if you would like me to navigate to the relevant panel.`;
      }

      const botMsg: CopilotMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionRecommendation: actionRec,
      };

      setCopilotMessages((prev) => [...prev, botMsg]);
    }, 400);
  };

  // Advance Demo Tour Step
  const advanceDemoStep = () => {
    setDemoStep((prev) => (prev >= 21 ? 1 : prev + 1));
  };

  return (
    <GridContext.Provider
      value={{
        activeTab,
        setActiveTab,
        assets,
        selectedAssetId,
        setSelectedAssetId,
        selectedAsset,
        quickInspectAsset,
        setQuickInspectAsset,
        crews,
        assignCrew,
        unassignCrew,
        unassignAssetCrew,
        nearestCrewToSelected,
        weatherRegions,
        activeWeatherRegion,
        setActiveWeatherRegionId,
        updateWeatherRegion,
        fetchLiveWeatherForActiveRegion,
        fetchLiveWeatherForAllRegions,
        applyWeatherPreset,
        isWeatherLoading,
        weatherLastSyncedAt,
        recipients,
        addRecipient,
        notifications,
        sendOutageNotification,
        simulationParams,
        updateSimulationParam,
        resetSimulation,
        predictionResult,
        gridHealthScore,
        atRiskAssetsCount,
        criticalAssetsCount,
        availableCrewsCount,
        totalCrewsCount,
        isCopilotOpen,
        setIsCopilotOpen,
        copilotMessages,
        sendCopilotQuery,
        toast,
        showToast,
        clearToast,
        demoStep,
        setDemoStep,
        advanceDemoStep,
        isDemoTourActive,
        setIsDemoTourActive,
        liveBroadcastAlert,
        clearBroadcastAlert,
        triggerPhoneAlert,
      }}
    >
      {children}
    </GridContext.Provider>
  );
};

export const useGrid = () => {
  const context = useContext(GridContext);
  if (!context) {
    throw new Error('useGrid must be used within a GridProvider');
  }
  return context;
};

export type AssetStatus = 'Critical' | 'Warning' | 'Healthy';
export type AssetType = 'Transformer' | 'Substation' | 'Circuit Breaker' | 'Transmission Line' | 'Disconnect Switch';
export type CrewStatus = 'Available' | 'Assigned' | 'Off Duty';
export type PriorityLevel = 'P1 - Critical' | 'P2 - High' | 'P3 - Moderate' | 'P4 - Routine';

export interface GridCoordinates {
  lat: number;
  lng: number;
  x: number; // Normalized 0-100 for SVG grid map
  y: number; // Normalized 0-100 for SVG grid map
}

export interface GridAsset {
  id: string;
  name: string;
  type: AssetType;
  location: string;
  substation: string;
  coordinates: GridCoordinates;
  healthScore: number; // 0-100
  failureRisk: number; // 0-100%
  status: AssetStatus;
  gridImpactCustomers: number;
  predictedFailureWindow: string; // e.g. "Next 3–7 days"
  recommendedAction: string;
  priority: PriorityLevel;
  temperature: number; // °C
  vibration: number; // mm/s
  oilQuality: 'Good' | 'Moderate' | 'Poor' | 'Critical';
  oilTemperature: number; // °C
  partialDischarge: number; // pC
  loadPercentage: number; // %
  voltageKV: number; // kV
  currentA: number; // Amperes
  lastMaintenance: string; // e.g. "32 days ago"
  weatherExposure: 'High' | 'Medium' | 'Low';
  sensorRisk: number; // %
  weatherRisk: number; // %
  historicalRisk: number; // %
  confidence: number; // %
  reasons: string[];
  assignedCrewId?: string | null;
  feederLine?: string;
  commissionYear: number;
}

export interface SensorPoint {
  timestamp: string;
  timeLabel: string;
  temperature: number;
  vibration: number;
  oilTemperature: number;
  oilQualityIndex: number; // 0-100
  partialDischarge: number; // pC
  load: number; // %
  voltage: number; // kV
  current: number; // A
}

export interface WeatherRegion {
  id: string;
  name: string;
  condition: string;
  temperature: number; // °C
  rainfallProb: number; // %
  windSpeed: number; // km/h
  humidity: number; // %
  lightningRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
  gridWeatherRisk: 'HIGH' | 'MEDIUM' | 'LOW';
  warningMessage?: string;
  explanation: string;
  forecast: {
    '6h': { temp: number; rainProb: number; windSpeed: number; condition: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' };
    '24h': { temp: number; rainProb: number; windSpeed: number; condition: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' };
    '48h': { temp: number; rainProb: number; windSpeed: number; condition: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' };
    '7d': { temp: number; rainProb: number; windSpeed: number; condition: string; risk: 'HIGH' | 'MEDIUM' | 'LOW' };
  };
}

export interface Crew {
  id: string; // e.g. "Crew 04"
  name: string; // e.g. "North Depot Rapid Response"
  lead: string; // e.g. "R. K. Sharma"
  status: CrewStatus;
  currentLocation: string; // e.g. "Ahmedabad West - Depot 4"
  coordinates: GridCoordinates;
  specialization: 'Transformer Maintenance' | 'Substation Repair' | 'High-Voltage Lines' | 'Protection & Relays' | 'Emergency Switching';
  membersCount: number;
  vehicle: string;
  currentAssignment: string | null;
  lastCompletedWork?: string;
}

export interface AlertPhoneNumber {
  id: string;
  name: string;
  phone: string;
  enabled: boolean;
  role?: string;
  addedAt?: string;
}

export interface OutageRecipient {
  id: string;
  name: string;
  mobile: string;
  region: string;
  assetId?: string;
  type: 'Critical Infrastructure (Hospital/Water)' | 'Industrial Feeder' | 'Commercial Complex' | 'Residential Distribution';
  verified: boolean;
}

export interface OutageNotification {
  id: string;
  timestamp: string;
  region: string;
  affectedAssetId: string;
  affectedAssetName: string;
  windowStart: string;
  windowEnd: string;
  durationHours: number;
  reason: string;
  recipientsCount: number;
  status: 'Simulated Sent' | 'Scheduled' | 'Draft';
  messageText: string;
}

export interface HistoricalIncident {
  id: string;
  date: string;
  assetId: string;
  assetName: string;
  type: string;
  cause: string;
  downtimeHours: number;
  customersAffected: number;
  repairTimeHours: number;
  crewUsed: string;
  costEstimate: number;
}

export interface SimulationParams {
  temperature: number; // 60 to 110 °C
  vibration: number; // 0.5 to 8.0 mm/s
  oilQuality: 'Good' | 'Moderate' | 'Poor' | 'Critical';
  load: number; // 40 to 120 %
  windSpeed: number; // 10 to 100 km/h
  rainProbability: number; // 0 to 100 %
  lightningRisk: 'Low' | 'Moderate' | 'High' | 'Severe';
}

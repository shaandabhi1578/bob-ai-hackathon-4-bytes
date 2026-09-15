import { SensorPoint } from '../types';

export interface MetricThreshold {
  metric: string;
  unit: string;
  normalMax: number;
  warningMax: number;
  criticalMax: number;
  description: string;
}

export const SENSOR_THRESHOLDS: Record<string, MetricThreshold> = {
  temperature: {
    metric: 'Winding Temperature',
    unit: '°C',
    normalMax: 75,
    warningMax: 88,
    criticalMax: 105,
    description: 'IEEE C57.91 limit for standard mineral oil transformers',
  },
  vibration: {
    metric: 'Core Vibration',
    unit: 'mm/s',
    normalMax: 2.2,
    warningMax: 3.8,
    criticalMax: 7.0,
    description: 'ISO 10816-3 mechanical vibration limit for rotating/core equipment',
  },
  oilTemperature: {
    metric: 'Top-Oil Temperature',
    unit: '°C',
    normalMax: 70,
    warningMax: 82,
    criticalMax: 95,
    description: 'Upper tank oil temperature sensor',
  },
  oilQualityIndex: {
    metric: 'DGA Oil Health Index',
    unit: '/100',
    normalMax: 100,
    warningMax: 55,
    criticalMax: 35,
    description: 'Composite IEEE gas-in-oil index (higher is healthier)',
  },
  partialDischarge: {
    metric: 'Partial Discharge (PD)',
    unit: 'pC',
    normalMax: 100,
    warningMax: 250,
    criticalMax: 500,
    description: 'High-frequency acoustic/electrical discharge sensor',
  },
  load: {
    metric: 'Load Capacity',
    unit: '%',
    normalMax: 80,
    warningMax: 95,
    criticalMax: 115,
    description: 'Percentage of rated continuous MVA capability',
  },
  voltage: {
    metric: 'Bus Voltage',
    unit: 'kV',
    normalMax: 228,
    warningMax: 235,
    criticalMax: 245,
    description: 'Nominal bus voltage level',
  },
  current: {
    metric: 'Phase Current',
    unit: 'A',
    normalMax: 750,
    warningMax: 880,
    criticalMax: 1000,
    description: 'RMS line load current',
  },
};

/**
 * Generates realistic time-series sensor points for any asset and timeframe.
 */
export function generateSensorHistory(
  assetId: string,
  timeframe: '24h' | '7d' | '30d' | '90d'
): SensorPoint[] {
  const pointsCount = timeframe === '24h' ? 24 : timeframe === '7d' ? 28 : timeframe === '30d' ? 30 : 45;
  const isCriticalT104 = assetId === 'T-104';
  const isT208 = assetId === 'T-208';

  const points: SensorPoint[] = [];
  const now = new Date();

  for (let i = pointsCount - 1; i >= 0; i--) {
    const d = new Date(now);
    let timeLabel = '';

    if (timeframe === '24h') {
      d.setHours(d.getHours() - i);
      timeLabel = `${String(d.getHours()).padStart(2, '0')}:00`;
    } else if (timeframe === '7d') {
      d.setHours(d.getHours() - i * 6);
      timeLabel = `${d.toLocaleDateString('en-US', { weekday: 'short' })} ${d.getHours()}h`;
    } else if (timeframe === '30d') {
      d.setDate(d.getDate() - i);
      timeLabel = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    } else {
      d.setDate(d.getDate() - i * 2);
      timeLabel = `${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`;
    }

    const progressRatio = (pointsCount - 1 - i) / (pointsCount - 1); // 0 at start, 1 at end
    const diurnal = Math.sin((i / 24) * Math.PI * 2) * 3; // day/night oscillation

    let temp = 64 + diurnal;
    let vib = 1.4 + (Math.sin(i) * 0.2);
    let oilTemp = 58 + diurnal;
    let oilQuality = 85 - (progressRatio * 5);
    let pd = 40 + Math.random() * 15;
    let load = 68 + diurnal * 2;
    let voltage = 220 + (Math.cos(i) * 1.5);
    let current = 620 + diurnal * 20;

    if (isCriticalT104) {
      // Escalating degradation curve over the window: 72°C -> 91°C, vibration 2.0 -> 4.8 mm/s
      temp = Math.round((72 + progressRatio * 19 + diurnal * 1.5) * 10) / 10;
      vib = Math.round((1.8 + progressRatio * 3.0 + Math.random() * 0.4) * 10) / 10;
      oilTemp = Math.round((64 + progressRatio * 20 + diurnal * 1.2) * 10) / 10;
      oilQuality = Math.round(75 - progressRatio * 42); // falls to 33 (poor)
      pd = Math.round(90 + progressRatio * 230 + Math.random() * 30); // rises to 320 pC
      load = Math.round(74 + progressRatio * 14 + diurnal);
      voltage = Math.round((221 - progressRatio * 3.5 + Math.sin(i) * 0.8) * 10) / 10;
      current = Math.round(680 + progressRatio * 140 + diurnal * 15);
    } else if (isT208) {
      temp = Math.round((70 + progressRatio * 16 + diurnal) * 10) / 10;
      vib = Math.round((2.2 + progressRatio * 3.0 + Math.random() * 0.5) * 10) / 10;
      oilTemp = Math.round((63 + progressRatio * 16) * 10) / 10;
      oilQuality = Math.round(78 - progressRatio * 30);
      pd = Math.round(80 + progressRatio * 200);
      load = Math.round(76 + progressRatio * 16);
      voltage = 132 + Math.sin(i) * 1.2;
      current = Math.round(520 + progressRatio * 120);
    }

    points.push({
      timestamp: d.toISOString(),
      timeLabel,
      temperature: Number(temp.toFixed(1)),
      vibration: Number(vib.toFixed(1)),
      oilTemperature: Number(oilTemp.toFixed(1)),
      oilQualityIndex: Math.round(oilQuality),
      partialDischarge: Math.round(pd),
      load: Math.round(load),
      voltage: Number(voltage.toFixed(1)),
      current: Math.round(current),
    });
  }

  return points;
}

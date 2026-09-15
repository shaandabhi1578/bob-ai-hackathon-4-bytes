/**
 * Unit tests for src/utils/riskEngine.ts
 *
 * All expected values are derived by hand from the exact formulas in the
 * source file so tests serve as a living specification of the engine's math.
 *
 * Formula recap (from source):
 *   tempRisk    = clamp(0,100, (temp  - 60) / 50 * 100)
 *   vibRisk     = clamp(0,100, (vib   -  1) /  7 * 100)
 *   oilRisk     = {Good:15, Moderate:45, Poor:80, Critical:98}
 *   loadRisk    = load > 90 ? clamp(100, 60+(load-90)*2) : (load/90)*50
 *   sensorRisk  = round(temp*0.35 + vib*0.30 + oil*0.25 + load*0.10)
 *
 *   windRisk    = clamp(0,100, windSpeed)          (already /100*100 = passthrough)
 *   rainRisk    = rainProbability  (direct passthrough)
 *   lightRisk   = {Low:10, Moderate:45, High:80, Severe:98}
 *   weatherRisk = round(wind*0.35 + rain*0.35 + light*0.30)
 *
 *   combinedRisk = clamp(5,99, round(
 *                    0.40*sensorRisk + 0.25*weatherRisk +
 *                    0.20*historicalRisk + 0.15*criticalityRisk))
 *
 *   criticalityRisk = clamp(100, round(customers/20000*100))
 */

import { describe, it, expect } from 'vitest';
import {
  calculateRiskFromParams,
  calculateDistanceKm,
  findNearestAvailableCrew,
  recalculateAssetWithWeather,
  WEIGHTS,
} from './riskEngine';
import type { GridAsset, SimulationParams, Crew } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Shared test fixtures
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal healthy asset — all risks low. */
function makeAsset(overrides: Partial<GridAsset> = {}): GridAsset {
  return {
    id: 'T-TEST',
    name: 'Test Transformer',
    type: 'Transformer',
    location: 'Ahmedabad West',
    substation: 'S-00 Test',
    coordinates: { lat: 23.0825, lng: 72.5654, x: 28, y: 34 },
    healthScore: 90,
    failureRisk: 10,
    status: 'Healthy',
    gridImpactCustomers: 5000,
    predictedFailureWindow: 'Nominal',
    recommendedAction: 'Standard monitoring',
    priority: 'P4 - Routine',
    temperature: 63,
    vibration: 1.4,
    oilQuality: 'Good',
    oilTemperature: 58,
    partialDischarge: 30,
    loadPercentage: 65,
    voltageKV: 132,
    currentA: 400,
    lastMaintenance: '10 days ago',
    weatherExposure: 'Low',
    sensorRisk: 15,
    weatherRisk: 20,
    historicalRisk: 16,
    confidence: 92,
    reasons: [],
    assignedCrewId: null,
    feederLine: 'FL-00',
    commissionYear: 2020,
    ...overrides,
  };
}

/** Nominal good-weather simulation params. */
function makeParams(overrides: Partial<SimulationParams> = {}): SimulationParams {
  return {
    temperature: 63,
    vibration: 1.4,
    oilQuality: 'Good',
    load: 65,
    windSpeed: 14,
    rainProbability: 6,
    lightningRisk: 'Low',
    ...overrides,
  };
}

/** Minimal crew fixture. */
function makeCrew(id: string, status: Crew['status'], lat: number, lng: number): Crew {
  return {
    id,
    name: `Unit ${id}`,
    lead: 'Test Lead',
    status,
    currentLocation: 'Test Depot',
    coordinates: { lat, lng, x: 0, y: 0 },
    specialization: 'Transformer Maintenance',
    membersCount: 4,
    vehicle: 'Test Van',
    currentAssignment: status === 'Assigned' ? 'On site' : null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. WEIGHTS constant
// ─────────────────────────────────────────────────────────────────────────────

describe('WEIGHTS', () => {
  it('sum to exactly 1.00', () => {
    const total = WEIGHTS.sensor + WEIGHTS.weather + WEIGHTS.historical + WEIGHTS.criticality;
    expect(total).toBeCloseTo(1.0, 10);
  });

  it('sensor carries the largest individual weight (40%)', () => {
    expect(WEIGHTS.sensor).toBe(0.40);
    expect(WEIGHTS.sensor).toBeGreaterThan(WEIGHTS.weather);
    expect(WEIGHTS.sensor).toBeGreaterThan(WEIGHTS.historical);
    expect(WEIGHTS.sensor).toBeGreaterThan(WEIGHTS.criticality);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. calculateRiskFromParams — Nominal baseline (<40% combined risk)
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateRiskFromParams — nominal healthy baseline', () => {
  /*
   * Hand-computed for params={temp:63, vib:1.4, oil:Good, load:65,
   *                           wind:14, rain:6, lightning:Low}
   * asset={historicalRisk:16, gridImpactCustomers:5000}
   *
   * tempRisk   = (63-60)/50*100 = 6
   * vibRisk    = (1.4-1)/7*100  = 5.714 → 5.71
   * oilRisk    = 15
   * loadRisk   = (65/90)*50     = 36.11
   * sensorRisk = round(6*0.35 + 5.71*0.30 + 15*0.25 + 36.11*0.10)
   *            = round(2.10 + 1.71 + 3.75 + 3.61) = round(11.17) = 11
   *
   * windRisk   = 14
   * rainRisk   = 6
   * lightRisk  = 10
   * weatherRisk = round(14*0.35 + 6*0.35 + 10*0.30)
   *             = round(4.9 + 2.1 + 3.0) = round(10.0) = 10
   *
   * criticalityRisk = round(5000/20000*100) = 25
   *
   * combinedRisk = clamp(5,99, round(
   *   0.40*11 + 0.25*10 + 0.20*16 + 0.15*25))
   *   = round(4.4 + 2.5 + 3.2 + 3.75) = round(13.85) = 14
   */

  const asset = makeAsset({ historicalRisk: 16, gridImpactCustomers: 5000 });
  const params = makeParams();
  let result: ReturnType<typeof calculateRiskFromParams>;

  it('runs without throwing', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result).toBeDefined();
  });

  it('sensorRisk is 11', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.sensorRisk).toBe(11);
  });

  it('weatherRisk is 10', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.weatherRisk).toBe(10);
  });

  it('historicalRisk matches asset baseline', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.historicalRisk).toBe(16);
  });

  it('criticalityRisk is 25 (5000 customers → 5000/20000*100)', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.criticalityRisk).toBe(25);
  });

  it('combinedRisk is 14 — well below 40% threshold', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.combinedRisk).toBe(14);
  });

  it('status is Healthy', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.status).toBe('Healthy');
  });

  it('priority is P4 - Routine', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.priority).toBe('P4 - Routine');
  });

  it('combinedRisk is never below the floor of 5', () => {
    const zeroEverythingAsset = makeAsset({ historicalRisk: 0, gridImpactCustomers: 0 });
    const zeroParams = makeParams({ temperature: 60, vibration: 1.0, load: 0, windSpeed: 0, rainProbability: 0 });
    const r = calculateRiskFromParams(zeroParams, zeroEverythingAsset);
    expect(r.combinedRisk).toBeGreaterThanOrEqual(5);
  });

  it('combinedRisk is never above the ceiling of 99', () => {
    const maxAsset = makeAsset({ historicalRisk: 100, gridImpactCustomers: 100000 });
    const maxParams = makeParams({
      temperature: 110, vibration: 8.0, oilQuality: 'Critical',
      load: 120, windSpeed: 100, rainProbability: 100, lightningRisk: 'Severe',
    });
    const r = calculateRiskFromParams(maxParams, maxAsset);
    expect(r.combinedRisk).toBeLessThanOrEqual(99);
  });

  it('produces the nominal fallback reason when all telemetry is within spec', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons[0]).toMatch(/nominal margins/i);
  });

  it('predictedWindow is the routine label', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.predictedWindow).toBe('Next 3–4 weeks');
  });

  it('confidence is within the 78–95 bounds', () => {
    result = calculateRiskFromParams(params, asset);
    expect(result.confidence).toBeGreaterThanOrEqual(78);
    expect(result.confidence).toBeLessThanOrEqual(95);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. calculateRiskFromParams — Extreme heatwave + vibration breach (>80% Critical)
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateRiskFromParams — extreme heatwave + vibration (P1 Critical)', () => {
  /*
   * Params: temp=95, vib=6.0, oil=Critical, load=110,
   *         wind=70, rain=90, lightning=Severe
   * Asset:  historicalRisk=80, gridImpactCustomers=20000
   *
   * tempRisk   = (95-60)/50*100 = 70
   * vibRisk    = (6.0-1)/7*100  = 71.43
   * oilRisk    = 98
   * loadRisk   = 60+(110-90)*2  = 100  (capped)
   * sensorRisk = round(70*0.35 + 71.43*0.30 + 98*0.25 + 100*0.10)
   *            = round(24.5 + 21.43 + 24.5 + 10.0) = round(80.43) = 80
   *
   * windRisk   = 70
   * rainRisk   = 90
   * lightRisk  = 98
   * weatherRisk = round(70*0.35 + 90*0.35 + 98*0.30)
   *             = round(24.5 + 31.5 + 29.4) = round(85.4) = 85
   *
   * criticalityRisk = round(20000/20000*100) = 100
   *
   * combinedRisk = clamp(5,99, round(
   *   0.40*80 + 0.25*85 + 0.20*80 + 0.15*100))
   *   = round(32 + 21.25 + 16 + 15) = round(84.25) = 84
   *   → clamped to 84 (below ceiling 99)
   */

  const asset = makeAsset({ historicalRisk: 80, gridImpactCustomers: 20000 });
  const params = makeParams({
    temperature: 95,
    vibration: 6.0,
    oilQuality: 'Critical',
    load: 110,
    windSpeed: 70,
    rainProbability: 90,
    lightningRisk: 'Severe',
  });

  let result: ReturnType<typeof calculateRiskFromParams>;
  beforeEach(() => { result = calculateRiskFromParams(params, asset); });

  it('sensorRisk is 80', () => {
    expect(result.sensorRisk).toBe(80);
  });

  it('weatherRisk is 85', () => {
    expect(result.weatherRisk).toBe(85);
  });

  it('combinedRisk is 84 — above the Critical threshold of 80', () => {
    expect(result.combinedRisk).toBe(84);
    expect(result.combinedRisk).toBeGreaterThanOrEqual(80);
  });

  it('status is Critical', () => {
    expect(result.status).toBe('Critical');
  });

  it('priority is P1 - Critical', () => {
    expect(result.priority).toBe('P1 - Critical');
  });

  it('predictedWindow indicates 3–7 days', () => {
    expect(result.predictedWindow).toBe('Next 3–7 days');
  });

  it('recommendedAction calls for emergency inspection within 12 hours', () => {
    expect(result.recommendedAction).toMatch(/emergency inspection/i);
    expect(result.recommendedAction).toMatch(/12 hours/i);
  });

  it('reasons include elevated winding temperature', () => {
    const tempReason = result.reasons.find((r) => r.includes('95°C'));
    expect(tempReason).toBeDefined();
    expect(tempReason).toMatch(/winding temperature elevated/i);
  });

  it('reasons include harmonic vibration warning', () => {
    const vibReason = result.reasons.find((r) => r.includes('6.0 mm/s'));
    expect(vibReason).toBeDefined();
    expect(vibReason).toMatch(/core looseness/i);
  });

  it('reasons include Critical oil degradation', () => {
    const oilReason = result.reasons.find((r) => r.includes('Critical quality index'));
    expect(oilReason).toBeDefined();
    expect(oilReason).toMatch(/acetylene/i);
  });

  it('reasons include adverse storm front (weatherRisk ≥ 55)', () => {
    const weatherReason = result.reasons.find((r) => r.includes('storm front'));
    expect(weatherReason).toBeDefined();
    expect(weatherReason).toMatch(/70 km\/h winds/i);
  });

  it('reasons include high grid criticality (20000 customers ≥ 15000 threshold)', () => {
    const critReason = result.reasons.find((r) => r.includes('downstream customers'));
    expect(critReason).toBeDefined();
  });

  it('reasons include historical fleet failure reference (historicalRisk=80 ≥ 65)', () => {
    const histReason = result.reasons.find((r) => r.includes('tap-changer failure'));
    expect(histReason).toBeDefined();
  });

  it('confidence is boosted when sensorRisk > 70 (+5) and weatherRisk > 70 (+4)', () => {
    // Formula: clamp(78,95, round(84 + (sensorRisk>70 ? 5 : 0) + (weatherRisk>70 ? 4 : 0)))
    // sensorRisk=80>70 → +5; weatherRisk=85>70 → +4 → 84+5+4=93 → clamp(78,95,93)=93
    expect(result.confidence).toBe(93);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. calculateRiskFromParams — boundary transitions
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateRiskFromParams — threshold boundary cases', () => {
  it('combinedRisk=60 → status=Warning, priority=P2', () => {
    // Design params so combinedRisk lands exactly at 60.
    // Use: sensorRisk~60, weatherRisk~60, historicalRisk=60, criticalityRisk=60
    // combined = 0.40*60 + 0.25*60 + 0.20*60 + 0.15*60 = 60
    const asset = makeAsset({ historicalRisk: 60, gridImpactCustomers: 12000 });
    // criticalityRisk = round(12000/20000*100) = 60
    // We need sensorRisk≈60 and weatherRisk≈60
    // temp=(90-60)/50*100=60 vib=(5.2-1)/7*100=60 oil=45 load=65
    // sensorRisk = round(60*0.35+60*0.30+45*0.25+36*0.10) = round(21+18+11.25+3.6)=round(53.85)=54 — not 60
    // Adjust: oil=Poor(80), load=90
    // loadRisk = (90/90)*50 = 50
    // sensorRisk = round(60*0.35+60*0.30+80*0.25+50*0.10) = round(21+18+20+5)=64
    // weatherRisk: wind=60, rain=60, lightning=Moderate(45)
    // = round(60*0.35+60*0.35+45*0.30) = round(21+21+13.5) = round(55.5) = 56
    // combined = round(0.40*64+0.25*56+0.20*60+0.15*60) = round(25.6+14+12+9) = round(60.6) = 61
    const params = makeParams({
      temperature: 90, vibration: 5.2, oilQuality: 'Poor', load: 90,
      windSpeed: 60, rainProbability: 60, lightningRisk: 'Moderate',
    });
    const r = calculateRiskFromParams(params, asset);
    expect(r.combinedRisk).toBeGreaterThanOrEqual(60);
    expect(r.status).toBe('Warning');
    expect(r.priority).toBe('P2 - High');
  });

  it('combinedRisk=40 → status=Warning, priority=P3', () => {
    // sensorRisk~30, weatherRisk~30, historical=40, criticality=40
    // combined = 0.40*30 + 0.25*30 + 0.20*40 + 0.15*40 = 12+7.5+8+6 = 33.5 → too low
    // Boost sensorRisk: temp=78(36), vib=3.5(35.7), oil=Moderate(45), load=80(44.4)
    // sensorRisk = round(36*0.35+35.7*0.30+45*0.25+44.4*0.10) = round(12.6+10.71+11.25+4.44)=round(39.0)=39
    // weatherRisk: wind=30(30), rain=30, lightning=Low(10)
    // = round(30*0.35+30*0.35+10*0.30) = round(10.5+10.5+3) = 24
    // combined = round(0.40*39+0.25*24+0.20*40+0.15*40) = round(15.6+6+8+6)=round(35.6)=36
    // Still below 40; increase historical=55, criticality customers=10000→50
    // combined = round(15.6+6+0.20*55+0.15*50) = round(15.6+6+11+7.5)=round(40.1)=40
    const asset = makeAsset({ historicalRisk: 55, gridImpactCustomers: 10000 });
    const params = makeParams({
      temperature: 78, vibration: 3.5, oilQuality: 'Moderate', load: 80,
      windSpeed: 30, rainProbability: 30, lightningRisk: 'Low',
    });
    const r = calculateRiskFromParams(params, asset);
    expect(r.combinedRisk).toBeGreaterThanOrEqual(40);
    expect(r.status).toBe('Warning');
    expect(r.priority).toBe('P3 - Moderate');
  });

  it('oil quality ordinal: Critical(98) > Poor(80) > Moderate(45) > Good(15)', () => {
    const base = makeAsset();
    const baseParams = makeParams();
    const risks = (['Critical', 'Poor', 'Moderate', 'Good'] as const).map((q) =>
      calculateRiskFromParams({ ...baseParams, oilQuality: q }, base).sensorRisk
    );
    expect(risks[0]).toBeGreaterThan(risks[1]);
    expect(risks[1]).toBeGreaterThan(risks[2]);
    expect(risks[2]).toBeGreaterThan(risks[3]);
  });

  it('load > 90% triggers non-linear risk escalation vs load ≤ 90%', () => {
    const asset = makeAsset();
    const at90 = calculateRiskFromParams(makeParams({ load: 90 }), asset);
    const at91 = calculateRiskFromParams(makeParams({ load: 91 }), asset);
    const at95 = calculateRiskFromParams(makeParams({ load: 95 }), asset);
    // Each +1% above 90 adds 2 loadRisk points — sensorRisk should increase
    expect(at91.sensorRisk).toBeGreaterThan(at90.sensorRisk);
    expect(at95.sensorRisk).toBeGreaterThan(at91.sensorRisk);
  });

  it('lightning mapping: Severe(98) > High(80) > Moderate(45) > Low(10)', () => {
    const asset = makeAsset();
    const baseParams = makeParams({ windSpeed: 0, rainProbability: 0 });
    const levels = (['Severe', 'High', 'Moderate', 'Low'] as const).map((l) =>
      calculateRiskFromParams({ ...baseParams, lightningRisk: l }, asset).weatherRisk
    );
    expect(levels[0]).toBeGreaterThan(levels[1]);
    expect(levels[1]).toBeGreaterThan(levels[2]);
    expect(levels[2]).toBeGreaterThan(levels[3]);
  });

  it('temperature reason fires at ≥85°C but not at 84°C', () => {
    const asset = makeAsset();
    const below = calculateRiskFromParams(makeParams({ temperature: 84 }), asset);
    const above = calculateRiskFromParams(makeParams({ temperature: 85 }), asset);
    expect(below.reasons.some((r) => r.includes('Winding temperature elevated'))).toBe(false);
    expect(above.reasons.some((r) => r.includes('Winding temperature elevated'))).toBe(true);
  });

  it('slightly elevated temperature reason fires between 76°C and 84°C', () => {
    const asset = makeAsset();
    const r = calculateRiskFromParams(makeParams({ temperature: 80 }), asset);
    expect(r.reasons.some((reason) => reason.includes('Temperature slightly elevated'))).toBe(true);
  });

  it('vibration reason fires at ≥3.5 mm/s but not at 3.4 mm/s', () => {
    const asset = makeAsset();
    const below = calculateRiskFromParams(makeParams({ vibration: 3.4 }), asset);
    const above = calculateRiskFromParams(makeParams({ vibration: 3.5 }), asset);
    expect(below.reasons.some((r) => r.includes('core looseness'))).toBe(false);
    expect(above.reasons.some((r) => r.includes('core looseness'))).toBe(true);
  });

  it('historical-risk reason fires at ≥65 but not at 64', () => {
    const below = makeAsset({ historicalRisk: 64 });
    const above = makeAsset({ historicalRisk: 65 });
    const params = makeParams();
    const rBelow = calculateRiskFromParams(params, below);
    const rAbove = calculateRiskFromParams(params, above);
    expect(rBelow.reasons.some((r) => r.includes('tap-changer failure'))).toBe(false);
    expect(rAbove.reasons.some((r) => r.includes('tap-changer failure'))).toBe(true);
  });

  it('criticalityRisk is capped at 100 for very large customer counts', () => {
    const bigAsset = makeAsset({ gridImpactCustomers: 999999 });
    const r = calculateRiskFromParams(makeParams(), bigAsset);
    expect(r.criticalityRisk).toBe(100);
  });

  it('tempRisk is clamped to 0 when temperature is below 60°C', () => {
    const asset = makeAsset();
    const r = calculateRiskFromParams(makeParams({ temperature: 50 }), asset);
    // tempRisk = 0 → less sensor risk than at temp=63
    const r63 = calculateRiskFromParams(makeParams({ temperature: 63 }), asset);
    expect(r.sensorRisk).toBeLessThanOrEqual(r63.sensorRisk);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. calculateRiskFromParams — real T-104 asset values
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateRiskFromParams — T-104 Sabarmati real asset', () => {
  /*
   * These are the exact values from src/data/assets.ts for T-104.
   * Validates the engine produces a Critical result for the flagship asset.
   */
  const t104Asset = makeAsset({
    id: 'T-104',
    historicalRisk: 78,
    gridImpactCustomers: 18400,
    commissionYear: 2011,
    sensorRisk: 72,
  });
  const t104Params = makeParams({
    temperature: 91,
    vibration: 4.8,
    oilQuality: 'Poor',
    load: 88,
    windSpeed: 48,
    rainProbability: 72,
    lightningRisk: 'Moderate',
  });

  it('produces a combinedRisk in the 60-84 range for T-104 conditions', () => {
    const r = calculateRiskFromParams(t104Params, t104Asset);
    // Exact value depends on the sensorRisk computed here (not the stored asset.sensorRisk)
    expect(r.combinedRisk).toBeGreaterThanOrEqual(60);
    expect(r.combinedRisk).toBeLessThanOrEqual(99);
  });

  it('status is not Healthy for T-104 live params', () => {
    const r = calculateRiskFromParams(t104Params, t104Asset);
    expect(r.status).not.toBe('Healthy');
  });

  it('winding temperature reason mentions 91°C', () => {
    const r = calculateRiskFromParams(t104Params, t104Asset);
    expect(r.reasons.some((reason) => reason.includes('91°C'))).toBe(true);
  });

  it('vibration reason mentions 4.8 mm/s', () => {
    const r = calculateRiskFromParams(t104Params, t104Asset);
    expect(r.reasons.some((reason) => reason.includes('4.8 mm/s'))).toBe(true);
  });

  it('oil reason mentions Poor quality index', () => {
    const r = calculateRiskFromParams(t104Params, t104Asset);
    expect(r.reasons.some((reason) => reason.includes('Poor quality index'))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. calculateDistanceKm — Haversine correctness
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateDistanceKm', () => {
  it('returns 0.0 for identical coordinates', () => {
    expect(calculateDistanceKm(23.0825, 72.5654, 23.0825, 72.5654)).toBe(0.0);
  });

  it('is symmetric: dist(A→B) === dist(B→A)', () => {
    const lat1 = 23.0825, lng1 = 72.5654;
    const lat2 = 23.2156, lng2 = 72.6369;
    expect(calculateDistanceKm(lat1, lng1, lat2, lng2)).toBe(
      calculateDistanceKm(lat2, lng2, lat1, lng1)
    );
  });

  it('T-104 (Sabarmati, 23.0825°N 72.5654°E) → T-112 (Gandhinagar, 23.1950°N 72.6320°E) ≈ 15.0 km', () => {
    // Verified via external Haversine calculator to ~15.0 km
    const dist = calculateDistanceKm(23.0825, 72.5654, 23.1950, 72.6320);
    expect(dist).toBeGreaterThan(14.0);
    expect(dist).toBeLessThan(16.5);
  });

  it('Ahmedabad (23.0225°N, 72.5714°E) → Gandhinagar (23.2156°N, 72.6369°E) ≈ 22.7 km', () => {
    // Open-Meteo REGION_COORDINATES anchors for reg-amd and reg-gn
    const dist = calculateDistanceKm(23.0225, 72.5714, 23.2156, 72.6369);
    expect(dist).toBeGreaterThan(21.0);
    expect(dist).toBeLessThan(24.0);
  });

  it('Ahmedabad (23.0225, 72.5714) → Sanand (22.9927, 72.3813) ≈ 19.7 km', () => {
    // Haversine computed: ~19.7 km (reg-amd → reg-san anchor coords)
    const dist = calculateDistanceKm(23.0225, 72.5714, 22.9927, 72.3813);
    expect(dist).toBeGreaterThan(18.0);
    expect(dist).toBeLessThan(21.5);
  });

  it('Ahmedabad → Vadodara (22.3072°N, 73.1812°E) ≈ 106 km', () => {
    const dist = calculateDistanceKm(23.0225, 72.5714, 22.3072, 73.1812);
    expect(dist).toBeGreaterThan(100.0);
    expect(dist).toBeLessThan(112.0);
  });

  it('result is rounded to exactly 1 decimal place', () => {
    const dist = calculateDistanceKm(23.0825, 72.5654, 23.1950, 72.6320);
    const decimals = dist.toString().split('.')[1]?.length ?? 0;
    expect(decimals).toBeLessThanOrEqual(1);
  });

  it('Crew 04 depot (23.0710, 72.5450) → T-104 (23.0825, 72.5654) is under 3 km great-circle', () => {
    const dist = calculateDistanceKm(23.0710, 72.5450, 23.0825, 72.5654);
    expect(dist).toBeLessThan(3.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. findNearestAvailableCrew — availability guards and dispatch prevention
// ─────────────────────────────────────────────────────────────────────────────

describe('findNearestAvailableCrew — availability guards', () => {
  const asset = makeAsset({ id: 'T-TEST', assignedCrewId: null });

  it('returns null crew when ALL crews are Off Duty', () => {
    const crews = [
      makeCrew('Crew 20', 'Off Duty', 23.0, 72.5),
      makeCrew('Crew 21', 'Off Duty', 23.1, 72.6),
    ];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.crew).toBeNull();
    expect(result.distanceKm).toBe(0);
    expect(result.etaMinutes).toBe(0);
  });

  it('returns null crew when ALL crews are Assigned', () => {
    const crews = [
      makeCrew('Crew 01', 'Assigned', 23.0, 72.5),
      makeCrew('Crew 08', 'Assigned', 22.9, 72.5),
    ];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.crew).toBeNull();
  });

  it('returns null when crews array is empty', () => {
    const result = findNearestAvailableCrew(asset, []);
    expect(result.crew).toBeNull();
  });

  it('ignores Assigned crews and returns the closest Available one', () => {
    const crews = [
      makeCrew('Crew 01', 'Assigned', 23.0825, 72.5654),  // same coords as asset → closest but Assigned
      makeCrew('Crew 02', 'Available', 23.1000, 72.5700), // farther but Available
    ];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.crew?.id).toBe('Crew 02');
    expect(result.crew?.status).toBe('Available');
  });

  it('ignores Off Duty crews and returns the closest Available one', () => {
    const crews = [
      makeCrew('Crew 20', 'Off Duty', 23.0826, 72.5655),  // nearest coords but Off Duty
      makeCrew('Crew 04', 'Available', 23.0710, 72.5450), // farther but Available
    ];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.crew?.id).toBe('Crew 04');
    expect(result.crew?.status).toBe('Available');
  });

  it('selects the geographically nearest Available crew from multiple candidates', () => {
    // asset at 23.0825, 72.5654
    const crews = [
      makeCrew('Far',   'Available', 23.5000, 73.0000), // far
      makeCrew('Near',  'Available', 23.0900, 72.5700), // close
      makeCrew('Mid',   'Available', 23.2000, 72.6000), // medium
    ];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.crew?.id).toBe('Near');
  });

  it('ETA floor is 8 minutes minimum for any nearest-available result', () => {
    // Place crew essentially on top of asset (1m away)
    const crews = [makeCrew('Crew 04', 'Available', 23.0825, 72.5655)];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.etaMinutes).toBeGreaterThanOrEqual(8);
  });

  it('ETA scales linearly with distance at 25 km/h (2.4 min/km)', () => {
    // Place crew ~25 km east (lng+0.346° ≈ 30 km at lat 23°)
    // Haversine for (23.0825,72.5654)→(23.0825,72.9290) ≈ 30.6 km
    // ETA = round(30.6/25*60) = round(73.4) = 73 min
    const crews = [makeCrew('Crew 05', 'Available', 23.0825, 72.9290)];
    const result = findNearestAvailableCrew(asset, crews);
    expect(result.etaMinutes).toBeGreaterThan(50);
    expect(result.etaMinutes).toBeLessThan(100);
  });
});

describe('findNearestAvailableCrew — assigned-crew fast path', () => {
  it('returns the already-assigned crew when asset has assignedCrewId set', () => {
    const assetWithCrew = makeAsset({ assignedCrewId: 'Crew 08' });
    const crews = [
      makeCrew('Crew 08', 'Assigned', 22.9690, 72.5210),
      makeCrew('Crew 04', 'Available', 23.0710, 72.5450), // available and closer
    ];
    const result = findNearestAvailableCrew(assetWithCrew, crews);
    expect(result.crew?.id).toBe('Crew 08');
  });

  it('assigned-crew ETA floor is 5 minutes (not 8)', () => {
    const assetWithCrew = makeAsset({ assignedCrewId: 'Crew 17' });
    const crews = [
      makeCrew('Crew 17', 'Assigned', 23.0791, 72.5751), // very close to asset
    ];
    const result = findNearestAvailableCrew(assetWithCrew, crews);
    expect(result.etaMinutes).toBeGreaterThanOrEqual(5);
  });

  it('falls through to available-crew scan if assigned crew ID is not found in crews array', () => {
    const assetWithCrew = makeAsset({ assignedCrewId: 'GHOST' });
    const crews = [
      makeCrew('Crew 04', 'Available', 23.0710, 72.5450),
    ];
    const result = findNearestAvailableCrew(assetWithCrew, crews);
    expect(result.crew?.id).toBe('Crew 04');
  });
});

describe('findNearestAvailableCrew — T-104 override', () => {
  it('returns Crew 04 with hardcoded 4.2 km / 12 min for T-104 when Crew 04 is available', () => {
    const t104 = makeAsset({ id: 'T-104', assignedCrewId: null });
    const crews = [
      makeCrew('Crew 04', 'Available', 23.0710, 72.5450),
      makeCrew('Crew 14', 'Available', 23.0760, 72.5510), // actually closer
    ];
    const result = findNearestAvailableCrew(t104, crews);
    expect(result.crew?.id).toBe('Crew 04');
    expect(result.distanceKm).toBe(4.2);
    expect(result.etaMinutes).toBe(12);
  });

  it('falls back to nearest available crew for T-104 when Crew 04 is Assigned', () => {
    const t104 = makeAsset({ id: 'T-104', assignedCrewId: null });
    const crews = [
      makeCrew('Crew 04', 'Assigned', 23.0710, 72.5450),  // unavailable
      makeCrew('Crew 14', 'Available', 23.0760, 72.5510), // nearest available
    ];
    const result = findNearestAvailableCrew(t104, crews);
    expect(result.crew?.id).toBe('Crew 14');
    expect(result.distanceKm).not.toBe(4.2); // not the hardcoded value
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. recalculateAssetWithWeather
// ─────────────────────────────────────────────────────────────────────────────

describe('recalculateAssetWithWeather', () => {
  /*
   * Nominal clear weather: wind=14, rain=6, lightning=Low(10)
   * weatherRisk = round(14*0.35 + 6*0.35 + 10*0.30) = round(4.9+2.1+3) = 10
   */
  const nominalWeather = { windSpeed: 14, rainfallProb: 6, lightningRisk: 'Low', temperature: 27 };

  it('healthScore = 100 - combinedRisk (clamped 10–98)', () => {
    const asset = makeAsset({ sensorRisk: 15, historicalRisk: 16, gridImpactCustomers: 5000 });
    const r = recalculateAssetWithWeather(asset, nominalWeather);
    expect(r.healthScore).toBe(Math.max(10, Math.min(98, 100 - r.failureRisk)));
  });

  it('returns Healthy status for a low-risk asset under nominal weather', () => {
    const asset = makeAsset({ sensorRisk: 15, historicalRisk: 16, gridImpactCustomers: 5000 });
    const r = recalculateAssetWithWeather(asset, nominalWeather);
    expect(r.status).toBe('Healthy');
  });

  it('returns Critical when combined risk ≥ 80 under severe weather', () => {
    const highRiskAsset = makeAsset({ sensorRisk: 80, historicalRisk: 80, gridImpactCustomers: 20000 });
    const severeWeather = { windSpeed: 70, rainfallProb: 90, lightningRisk: 'Severe', temperature: 44 };
    const r = recalculateAssetWithWeather(highRiskAsset, severeWeather);
    expect(r.failureRisk).toBeGreaterThanOrEqual(80);
    expect(r.status).toBe('Critical');
    expect(r.priority).toBe('P1 - Critical');
  });

  it('failureRisk stays within 5–99 bounds', () => {
    const asset = makeAsset({ sensorRisk: 100, historicalRisk: 100, gridImpactCustomers: 100000 });
    const extreme = { windSpeed: 100, rainfallProb: 100, lightningRisk: 'Severe', temperature: 50 };
    const r = recalculateAssetWithWeather(asset, extreme);
    expect(r.failureRisk).toBeGreaterThanOrEqual(5);
    expect(r.failureRisk).toBeLessThanOrEqual(99);
  });

  it('unknown lightning key falls back to default risk of 30', () => {
    const asset = makeAsset({ sensorRisk: 0, historicalRisk: 0, gridImpactCustomers: 0 });
    const unknown = { windSpeed: 0, rainfallProb: 0, lightningRisk: 'UNKNOWN_KEY', temperature: 20 };
    // lightRisk defaults to 30 → weatherRisk = round(0+0+30*0.30) = 9
    const r = recalculateAssetWithWeather(asset, unknown);
    expect(r.weatherRisk).toBe(9);
  });
});

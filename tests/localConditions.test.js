import { loadLocalConditions } from '../utils/localConditions';
import { fetchLocalWarnings, fetchLocalFloodWarnings, fetchLocalHeatWarnings } from '../utils/ninaWarnings';
import { fetchCurrentTemperature } from '../utils/currentTemperature';
import { fetchNearestWaterLevel } from '../utils/waterLevels';
import { getBestAvailableLocation } from '../utils/reliableLocation';
import { loadWarningCache, saveWarningCache } from '../utils/warningCache';

jest.mock('../utils/ninaWarnings', () => ({
  ...jest.requireActual('../utils/ninaWarnings'),
  fetchLocalWarnings: jest.fn(),
  fetchLocalFloodWarnings: jest.fn(),
  fetchLocalHeatWarnings: jest.fn(),
}));
jest.mock('../utils/currentTemperature', () => ({ fetchCurrentTemperature: jest.fn() }));
jest.mock('../utils/waterLevels', () => ({ fetchNearestWaterLevel: jest.fn() }));
jest.mock('../utils/reliableLocation', () => ({ getBestAvailableLocation: jest.fn() }));
jest.mock('../utils/warningCache', () => ({
  ...jest.requireActual('../utils/warningCache'),
  loadWarningCache: jest.fn(),
  saveWarningCache: jest.fn(),
}));

const coordinates = { latitude: 52.5, longitude: 13.4 };
const warning = { id: 'real-warning', title: 'River rising', severity: 'Severe' };
const settings = { usePreciseLocation: false, simulatedEmergency: false };

beforeEach(() => {
  jest.resetAllMocks();
  getBestAvailableLocation.mockResolvedValue({ coordinates });
  fetchLocalWarnings.mockResolvedValue([warning]);
  fetchLocalFloodWarnings.mockResolvedValue([warning]);
  fetchLocalHeatWarnings.mockResolvedValue([]);
  fetchNearestWaterLevel.mockResolvedValue({ value: 120, unit: 'cm' });
  fetchCurrentTemperature.mockResolvedValue({ value: 22, unit: '°C' });
  loadWarningCache.mockResolvedValue(null);
  saveWarningCache.mockResolvedValue(undefined);
});

test('preserves live warnings and reports a cache write failure without reading old data', async () => {
  saveWarningCache.mockRejectedValue(new Error('Storage full'));
  const result = await loadLocalConditions(settings);
  expect(result.warnings).toEqual([warning]);
  expect(result.warningError).toBeNull();
  expect(result.locationNotice).toMatch(/could not be saved/);
  expect(loadWarningCache).not.toHaveBeenCalled();
  expect(result.temperature.value).toBe(22);
});

test('isolates a failed feed while retaining successful warnings and measurements', async () => {
  fetchLocalHeatWarnings.mockRejectedValue(new Error('Offline'));
  fetchNearestWaterLevel.mockRejectedValue(new Error('Server unavailable'));
  const result = await loadLocalConditions(settings);
  expect(result.warnings).toEqual([warning]);
  expect(result.floodWarnings).toEqual([warning]);
  expect(result.heatWarnings).toEqual([]);
  expect(result.heatError).toMatch(/unavailable/);
  expect(result.waterLevel).toBeNull();
  expect(result.waterLevelError).toMatch(/unavailable/);
  expect(result.temperature).toEqual({ value: 22, unit: '°C' });
});

test('falls back to a recent local cache and removes expired or cancelled warnings', async () => {
  fetchLocalWarnings.mockRejectedValue(new Error('Offline'));
  const savedAt = new Date().toISOString();
  loadWarningCache.mockResolvedValue({
    coordinates,
    savedAt,
    warnings: [warning, { id: 'expired', expires: '2000-01-01' }, { id: 'cancelled', type: 'Cancel' }],
  });
  const result = await loadLocalConditions(settings);
  expect(result.warnings).toEqual([{ ...warning, isCached: true }]);
  expect(result.lastUpdated).toEqual(new Date(savedAt));
  expect(result.warningError).toMatch(/cached warning data/);
});

test.each([
  { coordinates, savedAt: '2000-01-01T00:00:00Z' },
  { coordinates: { latitude: 40, longitude: 10 }, savedAt: new Date().toISOString() },
])('does not display stale or distant cached warnings: %j', async (cache) => {
  fetchLocalWarnings.mockRejectedValue(new Error('Offline'));
  loadWarningCache.mockResolvedValue({ ...cache, warnings: [warning] });
  const result = await loadLocalConditions(settings);
  expect(result.warnings).toEqual([]);
  expect(result.lastUpdated).toBeNull();
  expect(result.warningError).toMatch(/too old or belongs to another location/);
});

test('a cache read failure does not discard the other feeds', async () => {
  fetchLocalWarnings.mockRejectedValue(new Error('Offline'));
  loadWarningCache.mockRejectedValue(new Error('Storage unavailable'));
  const result = await loadLocalConditions(settings);
  expect(result.warningError).toMatch(/unavailable/);
  expect(result.floodWarnings).toEqual([warning]);
  expect(result.temperature.value).toBe(22);
});

test.each(['permission', 'services'])('does not fetch data when location is unavailable: %s', async (reason) => {
  getBestAvailableLocation.mockResolvedValue({ coordinates: null, reason });
  const result = await loadLocalConditions(settings);
  expect(result.location).toBeNull();
  expect(result.warnings).toEqual([]);
  expect(result.warningError).toMatch(reason === 'permission' ? /permission/ : /services/);
  expect(fetchLocalWarnings).not.toHaveBeenCalled();
  expect(fetchLocalFloodWarnings).not.toHaveBeenCalled();
  expect(fetchCurrentTemperature).not.toHaveBeenCalled();
});

test('location failure returns an unavailable state without fetching for an old location', async () => {
  getBestAvailableLocation.mockRejectedValue(new Error('Location request timed out'));
  const result = await loadLocalConditions(settings);
  expect(result.location).toBeNull();
  expect(result.warningError).toMatch(/Location is unavailable/);
  expect(result.floodError).toMatch(/unavailable/);
  expect(fetchLocalWarnings).not.toHaveBeenCalled();
});

test('a superseded request cannot start a cache write', async () => {
  let finishFetch;
  fetchLocalWarnings.mockReturnValue(
    new Promise((resolve) => {
      finishFetch = resolve;
    }),
  );
  let current = true;
  const pending = loadLocalConditions(settings, () => current);
  await Promise.resolve();
  current = false;
  finishFetch([warning]);
  await pending;
  expect(saveWarningCache).not.toHaveBeenCalled();
});

test('simulation is displayed only when enabled and is never saved in the live warning cache', async () => {
  const result = await loadLocalConditions({ ...settings, simulatedEmergency: true });
  expect(result.warnings.map(({ id }) => id)).toEqual(['real-warning', 'dev-local-emergency-001']);
  expect(saveWarningCache).toHaveBeenCalledWith([warning], coordinates);
  expect(getBestAvailableLocation).toHaveBeenCalledWith({ precise: false });
  expect((await loadLocalConditions(settings)).warnings).toEqual([warning]);
});

import * as Location from 'expo-location';
import { getBestAvailableLocation } from '../utils/reliableLocation';

jest.mock('expo-location', () => ({
  Accuracy: { Balanced: 3, Low: 2 },
  getForegroundPermissionsAsync: jest.fn(),
  hasServicesEnabledAsync: jest.fn(),
  getLastKnownPositionAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));

const coords = { latitude: 52.5, longitude: 13.4, accuracy: 10 };

beforeEach(() => {
  jest.resetAllMocks();
  jest.useFakeTimers();
  Location.getForegroundPermissionsAsync.mockResolvedValue({ granted: true });
  Location.hasServicesEnabledAsync.mockResolvedValue(true);
  Location.getLastKnownPositionAsync.mockResolvedValue({ coords });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords });
});
afterEach(() => jest.useRealTimers());

test('clears the timeout after a successful location request', async () => {
  expect(await getBestAvailableLocation()).toMatchObject({ coordinates: coords, stale: false });
  expect(jest.getTimerCount()).toBe(0);
});

test('falls back to the last known location when the current request hangs', async () => {
  Location.getCurrentPositionAsync.mockReturnValue(new Promise(() => {}));
  const pending = getBestAvailableLocation();
  await jest.advanceTimersByTimeAsync(12000);
  expect(await pending).toMatchObject({ coordinates: coords, stale: true, reason: 'last-known' });
  expect(jest.getTimerCount()).toBe(0);
});

test('rejects when both the current and last known coordinates are invalid', async () => {
  Location.getLastKnownPositionAsync.mockResolvedValue({ coords: { latitude: 200, longitude: 13 } });
  Location.getCurrentPositionAsync.mockResolvedValue({ coords: { latitude: NaN, longitude: 13 } });
  await expect(getBestAvailableLocation()).rejects.toThrow('invalid coordinates');
  expect(jest.getTimerCount()).toBe(0);
});

test('still obtains a fresh location when last known location storage fails', async () => {
  Location.getLastKnownPositionAsync.mockRejectedValue(new Error('Unavailable'));
  expect(await getBestAvailableLocation()).toMatchObject({ coordinates: coords, stale: false });
});

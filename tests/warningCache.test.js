import AsyncStorage from '@react-native-async-storage/async-storage';
import { isWarningCacheUsable, loadWarningCache, WARNING_CACHE_MAX_AGE_MS } from '../utils/warningCache';

test.each(['not json', 'null', '{"warnings":{}}'])(
  'treats malformed saved cache as unavailable: %s',
  async (stored) => {
    AsyncStorage.getItem.mockResolvedValueOnce(stored);
    await expect(loadWarningCache()).resolves.toBeNull();
  },
);

test('continues without a cache when device storage cannot be read', async () => {
  AsyncStorage.getItem.mockRejectedValueOnce(new Error('Storage unavailable'));
  await expect(loadWarningCache()).resolves.toBeNull();
});

describe('warning cache validity', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => jest.useRealTimers());

  test('accepts a recent cache for the same area', () => {
    expect(
      isWarningCacheUsable(
        { warnings: [], savedAt: '2026-01-01T11:00:00Z', coordinates: { latitude: 52.5, longitude: 13.4 } },
        { latitude: 52.6, longitude: 13.5 },
      ),
    ).toBe(true);
  });

  test('rejects missing, stale, and distant cache entries', () => {
    expect(isWarningCacheUsable(null)).toBe(false);
    expect(isWarningCacheUsable({ warnings: [], savedAt: '2025-12-31T00:00:00Z' })).toBe(false);
    expect(
      isWarningCacheUsable(
        { warnings: [], savedAt: '2026-01-01T11:00:00Z', coordinates: { latitude: 50, longitude: 10 } },
        { latitude: 52, longitude: 13 },
      ),
    ).toBe(false);
    expect(WARNING_CACHE_MAX_AGE_MS).toBe(6 * 60 * 60 * 1000);
  });
});

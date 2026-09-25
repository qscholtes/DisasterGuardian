import AsyncStorage from '@react-native-async-storage/async-storage';

const WARNING_CACHE_KEY = '@DisasterGuardian:WarningCache';
// Keep offline warning data for up to six hours. The loader still removes expired warnings.
export const WARNING_CACHE_MAX_AGE_MS = 6 * 60 * 60 * 1000;
export async function saveWarningCache(warnings, coordinates = null) {
  const cacheEntry = { warnings, coordinates, savedAt: new Date().toISOString() };
  await AsyncStorage.setItem(WARNING_CACHE_KEY, JSON.stringify(cacheEntry));
  return cacheEntry;
}
export function isWarningCacheUsable(cache, coordinates = null) {
  if (!cache?.savedAt || !Array.isArray(cache.warnings)) {
    return false;
  }

  const savedAt = new Date(cache.savedAt).getTime();
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > WARNING_CACHE_MAX_AGE_MS) {
    return false;
  }

  if (coordinates && cache.coordinates) {
    // Treat locations within 0.25 degrees on each axis as the same area.
    // This is a rough box, not a fixed distance, its width varies with latitude.
    const latitudeDelta = Math.abs(cache.coordinates.latitude - coordinates.latitude);
    const longitudeDelta = Math.abs(cache.coordinates.longitude - coordinates.longitude);
    if (latitudeDelta > 0.25 || longitudeDelta > 0.25) {
      return false;
    }
  }

  return true;
}
export async function loadWarningCache() {
  try {
    const storedJson = await AsyncStorage.getItem(WARNING_CACHE_KEY);
    if (!storedJson) return null;
    const cachedWarnings = JSON.parse(storedJson);
    return Array.isArray(cachedWarnings.warnings) && cachedWarnings.savedAt ? cachedWarnings : null;
  } catch {
    return null;
  }
}

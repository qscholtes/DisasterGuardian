import * as Location from 'expo-location';

const LOCATION_TIMEOUT_MS = 12000;
function isValidCoordinates(coordinates) {
  return (
    coordinates &&
    Number.isFinite(coordinates.latitude) &&
    Number.isFinite(coordinates.longitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

function getAccuracyMessage(coordinates) {
  if (!Number.isFinite(coordinates?.accuracy)) {
    return null;
  }

  if (coordinates.accuracy > 1000) {
    return 'Your location is approximate. Local warnings may cover a wider area.';
  }

  if (coordinates.accuracy > 250) {
    return 'Location accuracy is limited. Local warning results may be approximate.';
  }

  return null;
}

// Try a fresh position first, with a 12-second limit on that request. If it fails,
// fall back to a position up to 30 minutes old and tell the user it may be out of date.
// The fallback keeps local lookups available, but the user may have moved since then.
export async function getBestAvailableLocation({ precise = true } = {}) {
  const permission = await Location.getForegroundPermissionsAsync();
  if (!permission.granted) {
    return { coordinates: null, reason: 'permission' };
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    return { coordinates: null, reason: 'services' };
  }

  const requestedAccuracy = precise ? Location.Accuracy.Balanced : Location.Accuracy.Low;
  let lastKnown = null;
  try {
    lastKnown = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 });
  } catch {
    lastKnown = null;
  }

  let timeout;
  try {
    // The timeout stops us waiting; it doesn't cancel the underlying location request.
    const currentPosition = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: requestedAccuracy }),
      new Promise((_, reject) => {
        timeout = setTimeout(() => reject(new Error('Location request timed out.')), LOCATION_TIMEOUT_MS);
      }),
    ]);
    if (!isValidCoordinates(currentPosition.coords)) {
      throw new Error('Location returned invalid coordinates.');
    }
    return {
      coordinates: currentPosition.coords,
      stale: false,
      reason: null,
      qualityMessage: getAccuracyMessage(currentPosition.coords),
    };
  } catch (error) {
    if (isValidCoordinates(lastKnown?.coords)) {
      return {
        coordinates: lastKnown.coords,
        stale: true,
        reason: 'last-known',
        qualityMessage: 'Using your last known location. Local warning results may be out of date.',
      };
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

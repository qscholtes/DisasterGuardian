import {
  fetchLocalWarnings,
  fetchLocalFloodWarnings,
  fetchLocalHeatWarnings,
  isCurrentWarning,
  mapWarning,
  pointInGeometry,
} from './ninaWarnings';
import { fetchCurrentTemperature } from './currentTemperature';
import { fetchNearestWaterLevel } from './waterLevels';
import { getBestAvailableLocation } from './reliableLocation';
import { isWarningCacheUsable, loadWarningCache, saveWarningCache } from './warningCache';
import { createSimulatedWarning } from './simulatedWarning';

export function emptyLocalConditions(warningError = null) {
  return {
    warnings: [],
    floodWarnings: [],
    heatWarnings: [],
    floodError: warningError ? 'Flood risk data is temporarily unavailable.' : null,
    heatError: warningError ? 'Heat risk data is temporarily unavailable.' : null,
    waterLevel: null,
    waterLevelError: warningError ? 'Water level data is temporarily unavailable.' : null,
    temperature: null,
    temperatureError: warningError ? 'Temperature data is temporarily unavailable.' : null,
    location: null,
    locationNotice: null,
    warningError,
    lastUpdated: null,
  };
}

async function loadWarnings(coordinates, isCurrent) {
  let warnings;
  try {
    warnings = await fetchLocalWarnings(coordinates);
  } catch {
    // Cache reads already fall back to null when storage is unreadable.
    const cached = await loadWarningCache();
    if (isWarningCacheUsable(cached, coordinates)) {
      return {
        warnings: cached.warnings.filter(isCurrentWarning).map((warning) => ({ ...warning, isCached: true })),
        lastUpdated: new Date(cached.savedAt),
        warningError: `Showing cached warning data from ${new Date(cached.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      };
    }
    return {
      warnings: [],
      lastUpdated: null,
      warningError: cached
        ? 'Saved warning data is too old or belongs to another location. Check your connection for current warnings.'
        : 'Local warning status is temporarily unavailable.',
    };
  }

  let cacheNotice = null;
  if (isCurrent()) {
    try {
      await saveWarningCache(warnings, coordinates);
    } catch {
      // Offline persistence must not replace a successful live response with old data.
      cacheNotice = 'Live warnings are available, but could not be saved for offline use.';
    }
  }
  return { warnings, lastUpdated: new Date(), warningError: null, cacheNotice };
}

// Return warnings, measurements, location details, and an error for each failed feed.
// isCurrent stops an old request from starting a cache write. It doesn't cancel
// network calls, so screens still need to check before applying the returned data.
export async function loadLocalConditions(settings, isCurrent = () => true) {
  let locationResult;
  try {
    locationResult = await getBestAvailableLocation({ precise: settings.usePreciseLocation });
  } catch {
    return emptyLocalConditions('Location is unavailable. Check location services and try again.');
  }

  if (!locationResult.coordinates) {
    const result = emptyLocalConditions();
    result.warningError =
      locationResult.reason === 'services'
        ? 'Location services are turned off. Enable them to check local warnings.'
        : 'Location permission is not available. Enable it in Profile to check local warnings.';
    // Permission denial has a dedicated setup state, disabled services are an error.
    if (locationResult.reason === 'services') {
      result.floodError = result.heatError = result.warningError;
    }
    return result;
  }

  const location = locationResult.coordinates;
  const result = {
    ...emptyLocalConditions(),
    location,
    locationNotice: locationResult.qualityMessage || null,
  };
  const [warningsResult, ...measurements] = await Promise.allSettled([
    loadWarnings(location, isCurrent),
    fetchLocalFloodWarnings(location),
    fetchLocalHeatWarnings(location),
    fetchNearestWaterLevel(location),
    fetchCurrentTemperature(location),
  ]);

  if (warningsResult.status === 'fulfilled') {
    const { cacheNotice, ...warningData } = warningsResult.value;
    Object.assign(result, warningData);
    result.locationNotice = [result.locationNotice, cacheNotice].filter(Boolean).join(' ') || null;
  } else {
    result.warningError = 'Local warning status is temporarily unavailable.';
  }

  const fields = [
    ['floodWarnings', 'floodError', 'Flood risk'],
    ['heatWarnings', 'heatError', 'Heat risk'],
    ['waterLevel', 'waterLevelError', 'Water level'],
    ['temperature', 'temperatureError', 'Temperature'],
  ];
  measurements.forEach((measurement, index) => {
    const [valueKey, errorKey, label] = fields[index];
    if (measurement.status === 'fulfilled') {
      result[valueKey] = measurement.value;
    } else {
      result[errorKey] = `${label} data is temporarily unavailable.`;
    }
  });

  if (settings.simulatedEmergency) {
    const simulated = createSimulatedWarning(location);
    if (isCurrentWarning(simulated) && pointInGeometry([location.longitude, location.latitude], simulated.geometry)) {
      result.warnings = [...result.warnings, mapWarning(simulated)];
    }
  }
  return result;
}

export const NINA_API_BASE = 'https://warnung.bund.de/api31';
export const NINA_WARNINGS_URL = `${NINA_API_BASE}/mowas/mapData.json`;
export const NINA_FLOOD_WARNINGS_URL = `${NINA_API_BASE}/lhp/mapData.json`;
export const NINA_HEAT_WARNINGS_URL = `${NINA_API_BASE}/dwd/mapData.json`;

// Checks whether a location falls inside the outside boundary of a GeoJSON
// polygon. A horizontal ray is cast from the location and the result flips
// each time that ray crosses an edge, which gives the even-odd test.
//
// GeoJSON [longitude, latitude] coordinate documentation: https://datatracker.ietf.org/doc/html/rfc7946#section-3.1.1
// Code implementation is based off of: https://github.com/Turfjs/turf/blob/master/packages/turf-boolean-point-in-polygon/index.ts
export function pointInRing([longitude, latitude], ring) {
  let inside = false;

  for (
    let ringIndex = 0, previousRingIndex = ring.length - 1;
    ringIndex < ring.length;
    previousRingIndex = ringIndex++
  ) {
    const [currentLongitude, currentLatitude] = ring[ringIndex];
    const [previousLongitude, previousLatitude] = ring[previousRingIndex];
    const intersects =
      currentLatitude > latitude !== previousLatitude > latitude &&
      longitude <
        ((previousLongitude - currentLongitude) * (latitude - currentLatitude)) / (previousLatitude - currentLatitude) +
          currentLongitude;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

// Polygon checks only use the outer ring, so points inside a hole also count as inside.
export function pointInGeometry(point, geometry) {
  if (!geometry) {
    return false;
  }

  if (geometry.type === 'Polygon') {
    return geometry.coordinates[0] ? pointInRing(point, geometry.coordinates[0]) : false;
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates.some((polygon) => polygon[0] && pointInRing(point, polygon[0]));
  }

  if (geometry.type === 'GeometryCollection') {
    return geometry.geometries.some((childGeometry) => pointInGeometry(point, childGeometry));
  }

  // Point warnings have no boundary here, so use a box extending 0.25 degrees
  // in each direction. This is an approximation, not the warning's actual coverage.
  return (
    geometry.type === 'Point' &&
    Math.abs(geometry.coordinates[0] - point[0]) < 0.25 &&
    Math.abs(geometry.coordinates[1] - point[1]) < 0.25
  );
}
export function isCurrentWarning(feature) {
  const properties = feature.properties || feature;
  const expires = properties.expiresDate || properties.expiryDate || properties.expires;
  return properties.type !== 'Cancel' && (!expires || new Date(expires).getTime() > Date.now());
}
function warningText(warning) {
  return [warning.type, warning.event, warning.title, warning.description, warning.instruction]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}
export function classifyWarning(warning) {
  const text = warningText(warning);

  if (/flood|hochwasser|überschwemm|überflutung|sturzflut|storm surge|storm tide/.test(text)) {
    return 'flood';
  }

  if (/heat wave|heatwave|extreme heat|heat warning|hitze|hitzewelle|hitzewarnung/.test(text)) {
    return 'heat';
  }

  if (/wildfire|forest fire|waldbrand|vegetationsbrand/.test(text)) {
    return 'wildfire';
  }

  if (/earthquake|erdbeben|seismic|tsunami|tornado|storm|sturm|orkan|unwetter|starkregen|gewitter/.test(text)) {
    return 'storm';
  }

  return 'general';
}
export function getRecommendedAction(disasterType = 'general', severity = 'Active') {
  const highSeverity = ['Severe', 'Extreme', 'High'].includes(severity);
  const moderateSeverity = ['Moderate', 'Minor', 'Active'].includes(severity);

  const actions = {
    flood: {
      high: 'Move to higher ground, avoid floodwater, and follow evacuation instructions.',
      moderate: 'Avoid flooded areas and underpasses, prepare your go-bag, and monitor local updates.',
      low: 'Review your flood checklist and identify a safe route to higher ground.',
    },
    heat: {
      high: 'Move somewhere cool, drink water, and check on older or vulnerable people nearby.',
      moderate: 'Stay hydrated, avoid strenuous activity during the hottest hours, and keep cool.',
      low: 'Prepare water and review ways to stay cool during hot weather.',
    },
    wildfire: {
      high: 'Follow evacuation instructions immediately and leave using the recommended route.',
      moderate: 'Prepare your go-bag, keep windows closed if there is smoke, and monitor local updates.',
      low: 'Review your evacuation route and remove dry, flammable material near your home.',
    },
    storm: {
      high: 'Stay indoors away from windows and follow official instructions until the danger has passed.',
      moderate: 'Secure loose outdoor items, avoid unnecessary travel, and monitor local updates.',
      low: 'Review your emergency supplies and check local weather updates.',
    },
    general: {
      high: 'Follow official instructions and move away from immediate danger.',
      moderate: 'Review the warning details and follow local authority guidance.',
      low: 'Keep your preparedness tasks and emergency contacts up to date.',
    },
  };

  const level = highSeverity ? 'high' : moderateSeverity ? 'moderate' : 'low';
  return actions[disasterType]?.[level] || actions.general[level];
}
export function mapWarning(feature) {
  const properties = feature.properties || feature;
  const id = properties.identifier || properties.id || feature.id;
  const title = properties.i18nTitle?.de || properties.headline || properties.event || 'Local emergency warning';
  const baseWarning = {
    type: properties.event || properties.type || 'Emergency warning',
    event: properties.event,
    title,
    description: properties.description,
    instruction: properties.instruction,
  };
  return {
    id: String(id),
    type: baseWarning.type,
    disasterType: classifyWarning(baseWarning),
    severity: properties.severity || 'Warning',
    urgency: properties.urgency || null,
    certainty: properties.certainty || null,
    status: properties.msgType || properties.type || null,
    source: properties.provider || properties.sender || 'NINA',
    title,
    detail:
      properties.description || properties.instruction || 'Follow the instructions from the responsible authorities.',
    instruction: properties.instruction || null,
    updated: properties.sent || properties.startDate || null,
    expires: properties.expiresDate || properties.expiryDate || properties.expires || null,
    officialUrl: String(id).startsWith('dev-')
      ? null
      : `https://warnung.bund.de/meldung/${encodeURIComponent(String(id))}/0/`,
    geometry: feature.geometry,
  };
}

async function fetchWithTimeout(url, timeoutMs = 15000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}
// The map feed contains warning summaries, so each warning needs a second request
// for its geometry. Warnings without usable geometry are left out of local results.
async function fetchWarningsForUrl(coordinates, warningsUrl, includeSummary = () => true) {
  const warningsResponse = await fetchWithTimeout(warningsUrl);
  if (!warningsResponse.ok) {
    throw new Error(`NINA request failed with status ${warningsResponse.status}`);
  }

  const warningPayload = await warningsResponse.json();
  const warningSummaries = Array.isArray(warningPayload) ? warningPayload : warningPayload.features || [];
  const locationPoint = [coordinates.longitude, coordinates.latitude];
  const detailedWarnings = await Promise.all(
    warningSummaries
      .filter(isCurrentWarning)
      .filter(includeSummary)
      .map(async (warningSummary) => {
        try {
          const warningDetailResponse = await fetchWithTimeout(
            `${NINA_API_BASE}/warnings/${encodeURIComponent(warningSummary.id)}.geojson`,
          );
          if (!warningDetailResponse.ok) {
            return null;
          }
          const warningDetail = await warningDetailResponse.json();
          const detailFeature =
            warningDetail.type === 'FeatureCollection'
              ? warningDetail.features?.[0]
              : warningDetail.type === 'Feature'
                ? warningDetail
                : warningDetail;
          return {
            ...warningSummary,
            geometry: detailFeature?.geometry || warningDetail.geometry,
            properties: {
              ...warningSummary,
              ...(detailFeature?.properties || warningDetail.properties || {}),
            },
          };
        } catch {
          return null;
        }
      }),
  );

  return detailedWarnings
    .filter(Boolean)
    .filter((feature) => pointInGeometry(locationPoint, feature.geometry))
    .map(mapWarning)
    .filter((warning) => warning.id !== 'undefined');
}

export async function fetchLocalWarnings(coordinates) {
  return fetchWarningsForUrl(coordinates, NINA_WARNINGS_URL);
}

export async function fetchLocalFloodWarnings(coordinates) {
  return fetchWarningsForUrl(coordinates, NINA_FLOOD_WARNINGS_URL);
}

function isHeatWarning(summary) {
  const title = summary.i18nTitle?.de || summary.headline || '';
  return /hitze|hitzewarnung|extreme heat|heat warning/i.test(`${summary.type || ''} ${summary.event || ''} ${title}`);
}

export async function fetchLocalHeatWarnings(coordinates) {
  return fetchWarningsForUrl(coordinates, NINA_HEAT_WARNINGS_URL, isHeatWarning);
}

export function getFloodRiskStatus(warnings, { hasLocation = true, error = null } = {}) {
  return getRiskStatus(warnings, {
    hasLocation,
    error,
    riskType: 'flood',
    emptyDetail: 'No active flood warnings were found for your current location.',
  });
}

export function getHeatRiskStatus(warnings, { hasLocation = true, error = null } = {}) {
  return getRiskStatus(warnings, {
    hasLocation,
    error,
    riskType: 'heat',
    emptyDetail: 'No active heat warnings were found for your current location.',
  });
}

function getRiskStatus(warnings, { hasLocation, error, riskType, emptyDetail }) {
  const riskLabel = riskType === 'heat' ? 'heat' : 'flood';
  const capitalizedRiskLabel = riskLabel[0].toUpperCase() + riskLabel.slice(1);

  if (!hasLocation) {
    return {
      label: 'Location required',
      detail: `Enable location permissions to check ${riskLabel} risk for your current area.`,
      accent: '#f59e0b',
    };
  }

  if (error) {
    return {
      label: 'Unavailable',
      detail: `${capitalizedRiskLabel} risk data is temporarily unavailable.`,
      accent: '#f59e0b',
    };
  }

  const severityRank = { Minor: 1, Moderate: 2, Severe: 3, Extreme: 4 };
  const highestWarning = [...warnings].sort(
    (first, second) => (severityRank[second.severity] || 0) - (severityRank[first.severity] || 0),
  )[0];

  if (!highestWarning) {
    return {
      label: 'Low',
      detail: emptyDetail,
      accent: '#22c55e',
    };
  }
  const riskBySeverity = {
    Minor: { label: 'Minor', accent: '#eab308' },
    Moderate: { label: 'Moderate', accent: '#f59e0b' },
    Severe: { label: 'High', accent: '#b4534b' },
    Extreme: { label: 'Extreme', accent: '#7f1d1d' },
  };
  const risk = riskBySeverity[highestWarning.severity] || { label: 'Active', accent: '#f59e0b' };

  return {
    ...risk,
    detail: highestWarning.title,
  };
}

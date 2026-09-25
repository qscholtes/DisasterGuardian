import { distanceInKilometres } from './geography';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

const FACILITY_TYPES = {
  hospital: 'Hospital',
  police: 'Police station',
  fire_station: 'Fire station',
  emergency_shelter: 'Mapped/potential shelter',
};

function getCoordinates(osmElement) {
  if (Number.isFinite(osmElement.lat) && Number.isFinite(osmElement.lon)) {
    return { latitude: osmElement.lat, longitude: osmElement.lon };
  }
  if (Number.isFinite(osmElement.center?.lat) && Number.isFinite(osmElement.center?.lon)) {
    return { latitude: osmElement.center.lat, longitude: osmElement.center.lon };
  }
  return null;
}

function mapFacility(osmElement, userCoordinates) {
  const tags = osmElement.tags || {};
  const coordinates = getCoordinates(osmElement);
  if (!coordinates) {
    return null;
  }
  const type =
    tags.amenity === 'shelter' || tags.emergency === 'shelter'
      ? FACILITY_TYPES.emergency_shelter
      : FACILITY_TYPES[tags.amenity] || 'Emergency facility';

  return {
    id: `${osmElement.type}-${osmElement.id}`,
    name: tags.name || tags.official_name || 'Unnamed facility',
    type,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    distance: distanceInKilometres(userCoordinates, coordinates),
    isPotentialShelter: type === FACILITY_TYPES.emergency_shelter,
    phone: tags.phone || tags['contact:phone'] || null,
    website: tags.website || tags['contact:website'] || null,
    openingHours: tags.opening_hours || null,
    address:
      [
        [tags['addr:housenumber'], tags['addr:street']].filter(Boolean).join(' '),
        [tags['addr:postcode'], tags['addr:city']].filter(Boolean).join(' '),
      ]
        .filter(Boolean)
        .join(', ') || null,
  };
}

export const DEFAULT_FACILITY_RADIUS_METRES = 5000;
export async function fetchNearbyEmergencyFacilities(coordinates, radiusMetres = DEFAULT_FACILITY_RADIUS_METRES) {
  const query = `[out:json][timeout:20];(
    nwr["amenity"="hospital"](around:${radiusMetres},${coordinates.latitude},${coordinates.longitude});
    nwr["amenity"="police"](around:${radiusMetres},${coordinates.latitude},${coordinates.longitude});
    nwr["amenity"="fire_station"](around:${radiusMetres},${coordinates.latitude},${coordinates.longitude});
    nwr["amenity"="shelter"]["shelter_type"="emergency_shelter"](around:${radiusMetres},${coordinates.latitude},${coordinates.longitude});
    nwr["emergency"="shelter"](around:${radiusMetres},${coordinates.latitude},${coordinates.longitude});
  );out center;`;
  const overpassResponse = await fetch(OVERPASS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!overpassResponse.ok) {
    throw new Error(`Overpass request failed with status ${overpassResponse.status}`);
  }

  const facilitiesPayload = await overpassResponse.json();
  return (facilitiesPayload.elements || [])
    .map((osmElement) => mapFacility(osmElement, coordinates))
    .filter(Boolean)
    .sort((firstFacility, secondFacility) => firstFacility.distance - secondFacility.distance);
}

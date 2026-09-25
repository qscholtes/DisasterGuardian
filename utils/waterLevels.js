import { distanceInKilometres } from './geography';

const PEGELONLINE_BASE_URL = 'https://www.pegelonline.wsv.de/webservices/rest-api/v2';

export async function fetchNearestWaterLevel(coordinates) {
  const query = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    radius: '30',
    includeTimeseries: 'true',
    includeCurrentMeasurement: 'true',
  });
  const waterLevelResponse = await fetch(`${PEGELONLINE_BASE_URL}/stations.json?${query.toString()}`);
  if (!waterLevelResponse.ok) {
    throw new Error(`PEGELONLINE request failed with status ${waterLevelResponse.status}`);
  }

  const stationPayload = await waterLevelResponse.json();
  const stationRecords = Array.isArray(stationPayload) ? stationPayload : stationPayload.stations || [];
  const nearestStationWithLevel = stationRecords
    .map((stationRecord) => ({
      station: stationRecord,
      waterSeries: (stationRecord.timeseries || []).find((series) => series.shortname === 'W'),
    }))
    .filter(
      ({ waterSeries }) =>
        waterSeries?.currentMeasurement && Number.isFinite(Number(waterSeries.currentMeasurement.value)),
    )
    .map(({ station, waterSeries }) => ({
      station,
      waterSeries,
      distance: distanceInKilometres(coordinates, station),
    }))
    .sort((firstStation, secondStation) => firstStation.distance - secondStation.distance)[0];

  if (!nearestStationWithLevel) {
    return null;
  }

  const { station, waterSeries, distance } = nearestStationWithLevel;
  return {
    stationName: station.longname || station.shortname || 'Nearest gauge',
    waterName: station.water?.longname || station.water?.shortname || null,
    value: Number(waterSeries.currentMeasurement.value),
    unit: waterSeries.unit || 'cm',
    timestamp: waterSeries.currentMeasurement.timestamp || null,
    distance,
  };
}

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
export async function fetchCurrentTemperature(coordinates) {
  const query = new URLSearchParams({
    latitude: String(coordinates.latitude),
    longitude: String(coordinates.longitude),
    current: 'temperature_2m,apparent_temperature',
    temperature_unit: 'celsius',
    timezone: 'auto',
  });
  const weatherResponse = await fetch(`${OPEN_METEO_URL}?${query.toString()}`);
  if (!weatherResponse.ok) {
    throw new Error(`Open-Meteo request failed with status ${weatherResponse.status}`);
  }

  const payload = await weatherResponse.json();
  const currentTemperatureValue = Number(payload.current?.temperature_2m);
  const apparentTemperature = Number(payload.current?.apparent_temperature);
  if (!Number.isFinite(currentTemperatureValue)) {
    throw new Error('Open-Meteo returned no current temperature.');
  }
  return {
    value: currentTemperatureValue,
    feelsLike: Number.isFinite(apparentTemperature) ? apparentTemperature : null,
    unit: payload.current_units?.temperature_2m || '°C',
    timestamp: payload.current?.time || null,
  };
}

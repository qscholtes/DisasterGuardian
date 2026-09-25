export function createSimulatedWarning(coordinates) {
  const latitudeOffset = 0.08;
  const longitudeOffset = 0.12;
  const { latitude, longitude } = coordinates;

  return {
    id: 'dev-local-emergency-001',
    type: 'Flood warning',
    severity: 'Severe',
    startDate: new Date().toISOString(),
    expiresDate: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    i18nTitle: { de: 'TESTWARNUNG: Simulierte Hochwasserwarnung' },
    description:
      'This is a development-only simulated flood warning. Avoid floodwater, move to higher ground if needed, and follow official instructions in a real emergency.',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [longitude - longitudeOffset, latitude - latitudeOffset],
          [longitude + longitudeOffset, latitude - latitudeOffset],
          [longitude + longitudeOffset, latitude + latitudeOffset],
          [longitude - longitudeOffset, latitude + latitudeOffset],
          [longitude - longitudeOffset, latitude - latitudeOffset],
        ],
      ],
    },
  };
}

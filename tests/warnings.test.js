import {
  classifyWarning,
  getFloodRiskStatus,
  getHeatRiskStatus,
  getRecommendedAction,
  isCurrentWarning,
  mapWarning,
  pointInGeometry,
} from '../utils/ninaWarnings';

describe('warning logic', () => {
  test.each([
    ['Hochwasser in der Region', 'flood'],
    ['Extreme heat warning', 'heat'],
    ['Waldbrandgefahr', 'wildfire'],
    ['Sturmwarnung', 'storm'],
    ['Road closure', 'general'],
  ])('classifies %s as %s', (title, expectedType) => {
    expect(classifyWarning({ title })).toBe(expectedType);
  });

  test('accepts points inside a polygon and rejects points outside it', () => {
    const square = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    };
    expect(pointInGeometry([5, 5], square)).toBe(true);
    expect(pointInGeometry([20, 5], square)).toBe(false);
  });

  test('ignores cancelled and expired warnings', () => {
    expect(isCurrentWarning({ properties: { type: 'Cancel' } })).toBe(false);
    expect(isCurrentWarning({ properties: { expires: '2000-01-01T00:00:00Z' } })).toBe(false);
    expect(isCurrentWarning({ properties: { expires: '2999-01-01T00:00:00Z' } })).toBe(true);
  });

  test('returns location and error states before severity states', () => {
    expect(getFloodRiskStatus([], { hasLocation: false }).label).toBe('Location required');
    expect(getHeatRiskStatus([], { error: new Error('offline') }).label).toBe('Unavailable');
    expect(getFloodRiskStatus([{ severity: 'Extreme', title: 'River warning' }]).label).toBe('Extreme');
  });

  test('chooses an action based on hazard type and severity', () => {
    expect(getRecommendedAction('flood', 'Extreme')).toMatch(/higher ground/i);
    expect(getRecommendedAction('heat', 'Moderate')).toMatch(/hydrated/i);
    expect(getRecommendedAction('unknown', 'Minor')).toMatch(/warning details/i);
  });

  test('maps warning fields into the screen model', () => {
    const warning = mapWarning({
      id: 'warning-1',
      properties: { event: 'Flood', headline: 'River rising', severity: 'Severe' },
      geometry: null,
    });
    expect(warning).toMatchObject({
      id: 'warning-1',
      title: 'River rising',
      severity: 'Severe',
      disasterType: 'flood',
    });
    expect(warning.officialUrl).toContain('warning-1');
  });
});

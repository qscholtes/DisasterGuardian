import { distanceInKilometres } from '../utils/geography';

describe('geography', () => {
  test('returns zero for identical coordinates', () => {
    const point = { latitude: 52.52, longitude: 13.405 };
    expect(distanceInKilometres(point, point)).toBe(0);
  });

  test('calculates a realistic distance between two cities', () => {
    const berlin = { latitude: 52.52, longitude: 13.405 };
    const hamburg = { latitude: 53.5511, longitude: 9.9937 };
    expect(distanceInKilometres(berlin, hamburg)).toBeGreaterThan(250);
    expect(distanceInKilometres(berlin, hamburg)).toBeLessThan(260);
  });
});

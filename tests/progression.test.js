import { getLevelFromXp, getLevelProgress, getXpForLevel } from '../utils/progression';

describe('progression', () => {
  test('uses zero XP for the first level and a monotonic threshold curve', () => {
    expect(getXpForLevel(1)).toBe(0);
    expect(getXpForLevel(2)).toBeGreaterThan(getXpForLevel(1));
    expect(getXpForLevel(5)).toBeGreaterThan(getXpForLevel(4));
  });

  test('returns the highest level reached by total XP', () => {
    expect(getLevelFromXp(0)).toBe(1);
    expect(getLevelFromXp(getXpForLevel(3))).toBe(3);
    expect(getLevelFromXp(getXpForLevel(3) - 1)).toBe(2);
  });

  test('reports progress within the current level', () => {
    const progress = getLevelProgress(getXpForLevel(2) + 1);
    expect(progress.level).toBe(2);
    expect(progress.currentLevelXp).toBe(getXpForLevel(2));
    expect(progress.nextLevelXp).toBe(getXpForLevel(3));
    expect(progress.progress).toBe(1);
    expect(progress.progressPercent).toBeGreaterThanOrEqual(0);
    expect(progress.progressPercent).toBeLessThanOrEqual(100);
  });
});

const XP_BASE = 100;
const XP_EXPONENT = 1.5;

export function getXpForLevel(level) {
  if (level <= 1) {
    return 0;
  }

  return Math.round(XP_BASE * Math.pow(level, XP_EXPONENT));
}
export function getLevelFromXp(totalXp) {
  let level = 1;

  while (totalXp >= getXpForLevel(level + 1)) {
    level += 1;
  }

  return level;
}
export function getLevelProgress(totalXp) {
  const level = getLevelFromXp(totalXp);
  const currentLevelXp = getXpForLevel(level);
  const nextLevelXp = getXpForLevel(level + 1);
  const levelSpanXp = Math.max(1, nextLevelXp - currentLevelXp);
  const earnedLevelXp = totalXp - currentLevelXp;

  return {
    level,
    currentLevelXp,
    nextLevelXp,
    progress: earnedLevelXp,
    progressPercent: Math.min(100, Math.round((earnedLevelXp / levelSpanXp) * 100)),
  };
}

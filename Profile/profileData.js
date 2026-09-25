export const preparednessTasks = [
  {
    key: 'emergency-kit',
    title: 'Emergency kit challenge',
    detail: 'Choose the supplies that matter most when space and time are limited.',
    type: 'challenge',
  },
  {
    key: 'quiz-flood',
    title: 'Flood safety quiz',
    detail: 'Practise the decisions that matter before, during, and after flooding.',
    type: 'quiz',
  },
  {
    key: 'quiz-heat',
    title: 'Heat-wave safety quiz',
    detail: 'Work through ways to stay safe, hydrated, and alert during extreme heat.',
    type: 'quiz',
  },
  {
    key: 'quiz-wildfire',
    title: 'Wildfire safety quiz',
    detail: 'Test what you would do around smoke, evacuation routes, and household risks.',
    type: 'quiz',
  },
  {
    key: 'quiz-severe-storm',
    title: 'Severe storm safety quiz',
    detail: 'Practise safer choices around high winds, debris, and damaged power lines.',
    type: 'quiz',
  },
];

const RANK_THRESHOLDS = { beginner: 25, advanced: 50, expert: 100 };

export function getRankLabel(level) {
  if (level >= RANK_THRESHOLDS.expert) return 'Expert';
  if (level >= RANK_THRESHOLDS.advanced) return 'Advanced';
  if (level >= RANK_THRESHOLDS.beginner) return 'Beginner';
  return 'Rookie';
}

export function getNextRankProgress(level) {
  if (level < RANK_THRESHOLDS.beginner) return { remaining: RANK_THRESHOLDS.beginner - level, nextRank: 'Beginner' };
  if (level < RANK_THRESHOLDS.advanced) return { remaining: RANK_THRESHOLDS.advanced - level, nextRank: 'Advanced' };
  if (level < RANK_THRESHOLDS.expert) return { remaining: RANK_THRESHOLDS.expert - level, nextRank: 'Expert' };
  return { remaining: 0, nextRank: 'Max rank reached' };
}

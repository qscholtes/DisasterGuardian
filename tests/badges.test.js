import { getBadgeProgress, getNextBadge } from '../utils/badges';

describe('badge progress', () => {
  test('calculates checklist, quiz, kit, streak, and permission progress', () => {
    const appState = {
      dailyStreak: 7,
      tasks: { floodChecklist: true, emergencyContacts: true, goBagReview: true },
      permissions: { location: true, notifications: true },
    };
    const challengeProgress = {
      taskProgress: {
        'quiz-flood': { attempts: 1, averageAccuracy: 90 },
        'quiz-heat': { attempts: 1, averageAccuracy: 80 },
        'emergency-kit': { attempts: 1, averageAccuracy: 85, bestScore: 400 },
      },
    };
    const progress = getBadgeProgress(appState, challengeProgress, { water: true, radio: true });
    const alertReady = progress.find((badge) => badge.id === 'alert-ready');
    const kitPerfectionist = progress.find((badge) => badge.id === 'kit-perfectionist');
    expect(alertReady).toMatchObject({ current: 2, earned: true, progressPercent: 100 });
    expect(kitPerfectionist).toMatchObject({ current: 400, earned: true });
  });

  test('returns the first unearned badge or the final badge', () => {
    const badges = [
      { id: 'earned', earned: true },
      { id: 'next', earned: false },
      { id: 'last', earned: false },
    ];
    expect(getNextBadge(badges).id).toBe('next');
    expect(getNextBadge([{ id: 'complete', earned: true }]).id).toBe('complete');
  });
});

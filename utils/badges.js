const QUIZ_IDS = ['flood', 'heat', 'wildfire', 'severe-storm'];

export const BADGES = [
  {
    id: 'preparedness-starter',
    name: 'Preparedness Starter',
    description: 'Prepare your first five go-bag items.',
    category: 'Go-bag',
    target: 5,
    getCurrent: ({ checklistCount }) => checklistCount,
    unit: 'items',
  },
  {
    id: 'go-bag-ready',
    name: 'Go-Bag Ready',
    description: 'Complete every item on the go-bag checklist.',
    category: 'Go-bag',
    target: 31,
    getCurrent: ({ checklistCount }) => checklistCount,
    unit: 'items',
  },
  {
    id: 'preparedness-planner',
    name: 'Preparedness Planner',
    description: 'Complete all three core preparedness tasks.',
    category: 'Go-bag',
    target: 3,
    getCurrent: ({ dashboardTasksCompleted }) => dashboardTasksCompleted,
    unit: 'tasks',
  },
  {
    id: 'knowledge-seeker',
    name: 'Knowledge Seeker',
    description: 'Complete your first disaster-safety quiz.',
    category: 'Disaster quizzes',
    target: 1,
    getCurrent: ({ quizAttempts }) => quizAttempts,
    unit: 'quiz',
  },
  {
    id: 'quiz-explorer',
    name: 'Quiz Explorer',
    description: 'Try quizzes across three different disaster topics.',
    category: 'Disaster quizzes',
    target: 3,
    getCurrent: ({ quizzesCompleted }) => quizzesCompleted,
    unit: 'topics',
  },
  {
    id: 'safety-scholar',
    name: 'Safety Scholar',
    description: 'Complete all four disaster-safety quizzes.',
    category: 'Disaster quizzes',
    target: 4,
    getCurrent: ({ quizzesCompleted }) => quizzesCompleted,
    unit: 'quizzes',
  },
  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    description: 'Score at least 80% on every disaster-safety quiz.',
    category: 'Disaster quizzes',
    target: 4,
    getCurrent: ({ quizzesWithStrongAccuracy }) => quizzesWithStrongAccuracy,
    unit: 'quizzes at 80%+',
  },
  {
    id: 'kit-builder',
    name: 'Kit Builder',
    description: 'Complete the emergency-kit challenge once.',
    category: 'Emergency kit',
    target: 1,
    getCurrent: ({ kitAttempts }) => kitAttempts,
    unit: 'challenge',
  },
  {
    id: 'kit-perfectionist',
    name: 'Kit Perfectionist',
    description: 'Reach a score of 400 AP in the emergency-kit challenge.',
    category: 'Emergency kit',
    target: 400,
    getCurrent: ({ kitBestScore }) => kitBestScore,
    unit: 'AP',
  },
  {
    id: 'kit-expert',
    name: 'Kit Expert',
    description: 'Reach 80% average accuracy in the emergency-kit challenge.',
    category: 'Emergency kit',
    target: 80,
    getCurrent: ({ kitAccuracy }) => kitAccuracy,
    unit: '% accuracy',
  },
  {
    id: 'flood-ready',
    name: 'Flood Ready',
    description: 'Complete the flood checklist and flood-safety quiz.',
    category: 'Go-bag',
    target: 2,
    getCurrent: ({ floodChecklistComplete, floodQuizCompleted }) => floodChecklistComplete + floodQuizCompleted,
    unit: 'actions',
  },
  {
    id: 'alert-ready',
    name: 'Alert Ready',
    description: 'Enable location and emergency notifications.',
    category: 'Guardian milestones',
    target: 2,
    getCurrent: ({ permissionsReady }) => permissionsReady,
    unit: 'settings',
  },
  {
    id: 'streak-guardian',
    name: 'Streak Guardian',
    description: 'Maintain a seven-day preparedness streak.',
    category: 'Guardian milestones',
    target: 7,
    getCurrent: ({ streak }) => streak,
    unit: 'days',
  },
];
// Convert checklist, quiz, challenge, permission, and streak data into the
// common measurements used by the badge definitions.
function getMetrics(appState = {}, challengeProgress = {}, checklistState = {}) {
  const taskProgress = challengeProgress.taskProgress || {};
  const quizProgress = QUIZ_IDS.map((id) => taskProgress[`quiz-${id}`]).filter(Boolean);
  const kitProgress = taskProgress['emergency-kit'] || {};

  return {
    checklistCount: Object.values(checklistState).filter(Boolean).length,
    quizAttempts: quizProgress.reduce((total, quiz) => total + (quiz.attempts || 0), 0),
    quizzesCompleted: quizProgress.filter((quiz) => (quiz.attempts || 0) > 0).length,
    quizzesWithStrongAccuracy: quizProgress.filter((quiz) => (quiz.averageAccuracy || 0) >= 80).length,
    kitAttempts: kitProgress.attempts || 0,
    kitAccuracy: kitProgress.averageAccuracy || 0,
    streak: appState.dailyStreak || 0,
    dashboardTasksCompleted: ['floodChecklist', 'emergencyContacts', 'goBagReview'].filter(
      (key) => appState.tasks?.[key],
    ).length,
    floodChecklistComplete: appState.tasks?.floodChecklist ? 1 : 0,
    floodQuizCompleted: taskProgress['quiz-flood']?.attempts > 0 ? 1 : 0,
    kitBestScore: kitProgress.bestScore || 0,
    permissionsReady: [appState.permissions?.location, appState.permissions?.notifications].filter(Boolean).length,
  };
}
export function getBadgeProgress(appState, challengeProgress, checklistState) {
  const metrics = getMetrics(appState, challengeProgress, checklistState);
  return BADGES.map((badge) => {
    const badgeProgressValue = Math.min(badge.target, badge.getCurrent(metrics));
    return {
      ...badge,
      current: badgeProgressValue,
      earned: badgeProgressValue >= badge.target,
      progressPercent: Math.round((badgeProgressValue / badge.target) * 100),
      progressLabel: `${badgeProgressValue} / ${badge.target} ${badge.unit}`,
    };
  });
}
export function getNextBadge(badgeProgress) {
  return badgeProgress.find((badge) => !badge.earned) || badgeProgress[badgeProgress.length - 1];
}

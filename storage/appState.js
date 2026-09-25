import AsyncStorage from '@react-native-async-storage/async-storage';

export const APP_STATE_KEY = '@DisasterGuardian:AppState';
export const PREPAREDNESS_PROGRESS_KEY = '@DisasterGuardian:PreparednessProgress';
export const CHECKLIST_STATE_KEY = '@DisasterGuardian:ChecklistState';
export const PERSONAL_PROFILE_KEY = '@DisasterGuardian:PersonalProfile';
const defaultTaskState = {
  floodChecklist: false,
  emergencyContacts: false,
  goBagReview: false,
};
const defaultSettingsState = {
  usePreciseLocation: true,
  emergencyAlerts: true,
  preparednessReminders: true,
  achievementAlerts: true,
  emergencyMode: false,
  largeText: false,
  highContrast: false,
  reducedMotion: false,
  simulatedEmergency: false,
};
export const DEFAULT_APP_STATE = {
  onboardingComplete: false,
  mode: null,
  displayName: '',
  dailyStreak: 0,
  lastOpenedDate: null,
  permissions: {
    location: false,
    notifications: false,
  },
  settings: defaultSettingsState,
  tasks: defaultTaskState,
};
export const DEFAULT_PREPAREDNESS_PROGRESS = {
  totalAp: 0,
  totalAttempts: 0,
  bestScore: 0,
  averageAccuracy: 0,
  badgesEarned: [],
  taskProgress: {},
  recentApActions: [],
};

export const DEFAULT_CHECKLIST_STATE = {};
export const DEFAULT_PERSONAL_PROFILE = {
  householdSize: 1,
  hasChildren: false,
  hasOlderAdults: false,
  hasAccessibilityNeeds: false,
  hasPets: false,
  customChecklistItems: [],
  contacts: [],
};
function getLocalDateKey(date = new Date()) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
function getCalendarDayDifference(previousDateKey, nextDateKey) {
  const [previousYear, previousMonth, previousDay] = previousDateKey.split('-').map(Number);
  const [nextYear, nextMonth, nextDay] = nextDateKey.split('-').map(Number);

  const previous = new Date(previousYear, previousMonth - 1, previousDay);
  const nextDate = new Date(nextYear, nextMonth - 1, nextDay);

  return Math.round((nextDate - previous) / 86400000);
}

// Merge saved data with the current defaults so older installations continue
// to work when new settings or state fields are added.
function normalizeAppState(savedState = {}) {
  return {
    ...DEFAULT_APP_STATE,
    ...savedState,
    permissions: {
      ...DEFAULT_APP_STATE.permissions,
      ...(savedState.permissions || {}),
    },
    settings: {
      ...defaultSettingsState,
      ...(savedState.settings || {}),
    },
    tasks: {
      ...defaultTaskState,
      ...(savedState.tasks || {}),
    },
  };
}
function normalizePreparednessProgress(savedProgress = {}) {
  return {
    ...DEFAULT_PREPAREDNESS_PROGRESS,
    ...savedProgress,
    taskProgress: {
      ...DEFAULT_PREPAREDNESS_PROGRESS.taskProgress,
      ...(savedProgress.taskProgress || {}),
    },
    recentApActions: Array.isArray(savedProgress.recentApActions) ? savedProgress.recentApActions : [],
  };
}

export async function loadAppState() {
  try {
    const storedJson = await AsyncStorage.getItem(APP_STATE_KEY);
    return storedJson ? normalizeAppState(JSON.parse(storedJson)) : DEFAULT_APP_STATE;
  } catch {
    return DEFAULT_APP_STATE;
  }
}

export async function updateAppState(patch) {
  const storedAppState = await loadAppState();
  const updatedAppState = normalizeAppState({
    ...storedAppState,
    ...patch,
    permissions: {
      ...storedAppState.permissions,
      ...(patch.permissions || {}),
    },
    settings: {
      ...storedAppState.settings,
      ...(patch.settings || {}),
    },
    tasks: {
      ...storedAppState.tasks,
      ...(patch.tasks || {}),
    },
  });

  await AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(updatedAppState));
  return updatedAppState;
}
export async function loadPreparednessProgress() {
  try {
    const storedJson = await AsyncStorage.getItem(PREPAREDNESS_PROGRESS_KEY);
    return storedJson ? normalizePreparednessProgress(JSON.parse(storedJson)) : DEFAULT_PREPAREDNESS_PROGRESS;
  } catch {
    return DEFAULT_PREPAREDNESS_PROGRESS;
  }
}
export async function loadChecklistState() {
  try {
    const storedJson = await AsyncStorage.getItem(CHECKLIST_STATE_KEY);
    if (!storedJson) {
      return DEFAULT_CHECKLIST_STATE;
    }

    const parsedChecklistState = JSON.parse(storedJson);
    return parsedChecklistState && typeof parsedChecklistState === 'object' && !Array.isArray(parsedChecklistState)
      ? parsedChecklistState
      : DEFAULT_CHECKLIST_STATE;
  } catch {
    return DEFAULT_CHECKLIST_STATE;
  }
}
export async function saveChecklistState(checklistStateToSave) {
  const normalizedChecklistState =
    checklistStateToSave && typeof checklistStateToSave === 'object' && !Array.isArray(checklistStateToSave)
      ? checklistStateToSave
      : DEFAULT_CHECKLIST_STATE;
  await AsyncStorage.setItem(CHECKLIST_STATE_KEY, JSON.stringify(normalizedChecklistState));
  return normalizedChecklistState;
}

// Clean profile values loaded from storage before they are used by the screens.
function normalizePersonalProfile(savedProfile = {}) {
  return {
    ...DEFAULT_PERSONAL_PROFILE,
    ...savedProfile,
    householdSize: Math.max(1, Number(savedProfile.householdSize) || 1),
    customChecklistItems: Array.isArray(savedProfile.customChecklistItems)
      ? savedProfile.customChecklistItems.filter(
          (checklistItem) => typeof checklistItem === 'string' && checklistItem.trim(),
        )
      : [],
    contacts: Array.isArray(savedProfile.contacts) ? savedProfile.contacts : [],
  };
}
export async function loadPersonalProfile() {
  try {
    const storedJson = await AsyncStorage.getItem(PERSONAL_PROFILE_KEY);
    return storedJson ? normalizePersonalProfile(JSON.parse(storedJson)) : DEFAULT_PERSONAL_PROFILE;
  } catch {
    return DEFAULT_PERSONAL_PROFILE;
  }
}
export async function savePersonalProfile(profileToSave) {
  const normalizedProfile = normalizePersonalProfile(profileToSave);
  await AsyncStorage.setItem(PERSONAL_PROFILE_KEY, JSON.stringify(normalizedProfile));
  return normalizedProfile;
}
export async function recordPreparednessAttempt(
  taskId,
  { type = 'task', score = 0, accuracy = 0, activityTitle = null, progressPatch = {} } = {},
) {
  const storedProgress = await loadPreparednessProgress();
  const previousTaskProgress = storedProgress.taskProgress[taskId] || {
    type,
    attempts: 0,
    bestScore: 0,
    averageAccuracy: 0,
  };
  const taskAttempts = previousTaskProgress.attempts + 1;
  const accumulatedAccuracy = previousTaskProgress.averageAccuracy * previousTaskProgress.attempts + accuracy;

  const updatedProgress = normalizePreparednessProgress({
    ...storedProgress,
    ...progressPatch,
    totalAttempts: (storedProgress.totalAttempts || 0) + 1,
    totalAp: storedProgress.totalAp + score,
    bestScore: Math.max(storedProgress.bestScore, score),
    averageAccuracy: Math.round(
      (storedProgress.averageAccuracy * (storedProgress.totalAttempts || 0) + accuracy) /
        ((storedProgress.totalAttempts || 0) + 1),
    ),
    taskProgress: {
      ...storedProgress.taskProgress,
      [taskId]: {
        ...previousTaskProgress,
        type: previousTaskProgress.type || type,
        attempts: taskAttempts,
        bestScore: Math.max(previousTaskProgress.bestScore, score),
        averageAccuracy: Math.round(accumulatedAccuracy / taskAttempts),
      },
    },
    recentApActions: [
      {
        id: `${taskId}-${Date.now()}`,
        taskId,
        type,
        title: activityTitle || taskId,
        ap: score,
        createdAt: new Date().toISOString(),
      },
      ...storedProgress.recentApActions,
    ].slice(0, 20),
  });

  await AsyncStorage.setItem(PREPAREDNESS_PROGRESS_KEY, JSON.stringify(updatedProgress));
  return updatedProgress;
}
export async function resetLocalData() {
  await AsyncStorage.multiRemove([
    APP_STATE_KEY,
    PREPAREDNESS_PROGRESS_KEY,
    CHECKLIST_STATE_KEY,
    '@DisasterGuardian:EmergencyKitProgress',
    '@DisasterGuardian:WarningCache',
    PERSONAL_PROFILE_KEY,
  ]);
}
// Track days using the device's local calendar. Reopening on the same date earns
// nothing extra, opening the next day continues the streak, and a gap resets it to one.
export async function processDailyStreakReward(now = new Date()) {
  const [storedAppState, storedProgress] = await Promise.all([loadAppState(), loadPreparednessProgress()]);

  const todayKey = getLocalDateKey(now);
  if (storedAppState.lastOpenedDate === todayKey) {
    return {
      appState: storedAppState,
      preparednessProgress: storedProgress,
      bonusAp: 0,
      streakChanged: false,
    };
  }

  const previousStreak = storedAppState.dailyStreak || 0;
  let updatedStreak = 1;

  if (storedAppState.lastOpenedDate) {
    const gap = getCalendarDayDifference(storedAppState.lastOpenedDate, todayKey);
    if (gap === 1) {
      updatedStreak = previousStreak + 1;
    }
  }

  // Day one earns no streak AP. Each consecutive day after that earns 100 AP,
  // plus 1,000 every 20 days. Every 60 days, that milestone bonus is 2,000 instead.
  let bonusAp = 0;
  if (updatedStreak > 1) {
    bonusAp += 100;
  }

  if (updatedStreak % 20 === 0) {
    bonusAp += updatedStreak % 60 === 0 ? 2000 : 1000;
  }

  const updatedAppState = normalizeAppState({
    ...storedAppState,
    dailyStreak: updatedStreak,
    lastOpenedDate: todayKey,
  });

  const updatedProgress = normalizePreparednessProgress({
    ...storedProgress,
    totalAp: storedProgress.totalAp + bonusAp,
  });

  await Promise.all([
    AsyncStorage.setItem(APP_STATE_KEY, JSON.stringify(updatedAppState)),
    AsyncStorage.setItem(PREPAREDNESS_PROGRESS_KEY, JSON.stringify(updatedProgress)),
  ]);

  return {
    appState: updatedAppState,
    preparednessProgress: updatedProgress,
    bonusAp,
    streakChanged: true,
  };
}

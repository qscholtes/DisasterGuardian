export const taskMetadata = [
  {
    key: 'floodChecklist',
    title: 'Flood checklist',
    detail: 'Check what to move, pack, and do before water reaches your home.',
  },
  {
    key: 'emergencyContacts',
    title: 'Emergency contacts',
    detail: 'Make sure the people you may need can be reached quickly.',
  },
  {
    key: 'goBagReview',
    title: 'Go-bag review',
    detail: 'Check your water, torch, radio, medication, and essential documents.',
  },
];

const SEVERITY_RANK = { Minor: 1, Moderate: 2, Severe: 3, Extreme: 4, High: 3, Active: 2 };
const HIGH_SEVERITIES = new Set(['Severe', 'Extreme', 'High']);

export function getBadgeIcon(category) {
  if (category === 'Go-bag') return 'bag-personal-outline';
  if (category === 'Disaster quizzes') return 'school-outline';
  if (category === 'Emergency kit') return 'briefcase-variant-outline';
  return 'shield-check-outline';
}

export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function getRiskIcon(severity) {
  if (severity === 'High' || severity === 'Active') return 'alert-circle-outline';
  if (severity === 'Unknown') return 'help-circle-outline';
  if (severity === 'Setup') return 'map-marker-alert-outline';
  return 'check-circle-outline';
}

export function getWarningSeverityRank(severity) {
  return SEVERITY_RANK[severity] || 1;
}

export function getRecommendedTask(appState) {
  if (!appState) return null;
  const pendingTask = taskMetadata.find((task) => !appState.tasks[task.key]);
  if (pendingTask) {
    return {
      title: pendingTask.title,
      detail: pendingTask.detail,
      action: 'Mark prepared',
      type: 'task',
      taskKey: pendingTask.key,
    };
  }
  return {
    title: 'Emergency Kit Challenge',
    detail: 'Choose the supplies that matter most when space and time are limited.',
    action: 'Start challenge',
    type: 'challenge',
  };
}

export function getCurrentRisk({
  appState,
  localWarnings,
  floodWarnings,
  heatWarnings,
  warningError,
  getRecommendedAction,
}) {
  if (!appState) return null;

  const combinedWarnings = [
    ...localWarnings,
    ...floodWarnings.map((warning) => ({ ...warning, disasterType: warning.disasterType || 'flood' })),
    ...heatWarnings.map((warning) => ({ ...warning, disasterType: warning.disasterType || 'heat' })),
  ];

  if (!appState.permissions.location) {
    return {
      headline: 'Location setup pending',
      detail: 'Dashboard is in offline mode. Enable location later to support local alerts and nearby aid.',
      severity: 'Setup',
      accent: '#f59e0b',
      action: 'Enable location in Profile to check local warnings.',
    };
  }

  if (warningError && !combinedWarnings.length) {
    return {
      headline: 'Warning status unavailable',
      detail: warningError,
      severity: 'Unknown',
      accent: '#f59e0b',
      action: 'Try refreshing the dashboard or check official local emergency sources.',
    };
  }

  if (combinedWarnings.length) {
    const warning = [...combinedWarnings].sort(
      (first, second) => getWarningSeverityRank(second.severity) - getWarningSeverityRank(first.severity),
    )[0];
    const highSeverity = HIGH_SEVERITIES.has(warning.severity);
    return {
      headline: `${combinedWarnings.length} active warning${combinedWarnings.length === 1 ? '' : 's'} nearby`,
      detail: warning.title,
      disasterType: warning.disasterType || 'general',
      warning,
      severity: highSeverity ? 'High' : 'Active',
      accent: highSeverity ? '#b4534b' : '#f59e0b',
      action: getRecommendedAction(warning.disasterType, warning.severity),
    };
  }

  return {
    headline: 'No active emergency',
    detail: appState.permissions.notifications
      ? 'Push notifications are enabled. You will receive alerts for emergencies.'
      : 'Local risk view is available, but emergency notifications are currently disabled.',
    severity: 'Low',
    accent: '#22c55e',
    action: 'Keep your preparedness tasks and emergency contacts up to date.',
  };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export const SEEN_WARNING_IDS_KEY = '@DisasterGuardian:SeenWarningIds';
export const PREPAREDNESS_REMINDER_ID_KEY = '@DisasterGuardian:PreparednessReminderId';
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
// Store warning IDs after processing so the same warning is not notified again.
// Only the latest 100 IDs are kept to prevent the saved list growing indefinitely.
export async function notifyNewWarnings(warnings) {
  const storedWarningIds = JSON.parse((await AsyncStorage.getItem(SEEN_WARNING_IDS_KEY)) || '[]');
  const seenIds = new Set(storedWarningIds);
  const newWarnings = warnings.filter((warning) => !seenIds.has(warning.id));

  if (newWarnings.length) {
    const permission = await Notifications.getPermissionsAsync();
    const notificationsAllowed =
      permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

    if (notificationsAllowed) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Emergency warning near you',
          body:
            newWarnings.length === 1
              ? newWarnings[0].title
              : `${newWarnings.length} emergency warnings affect your area.`,
          data: {
            warningId: newWarnings[0].id,
            route: 'EmergencyResponse',
            warning: newWarnings[0],
          },
        },
        trigger: null,
      });
    }
  }

  await AsyncStorage.setItem(
    SEEN_WARNING_IDS_KEY,
    JSON.stringify(Array.from(new Set([...storedWarningIds, ...warnings.map((warning) => warning.id)])).slice(-100)),
  );

  return newWarnings;
}
export async function notifySimulatedWarning(warning) {
  const permission = await Notifications.getPermissionsAsync();
  const notificationsAllowed =
    permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!notificationsAllowed) {
    return false;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Simulated emergency warning',
      body: warning.title,
      data: { warningId: warning.id, route: 'EmergencyResponse', warning },
    },
    trigger: null,
  });

  const storedWarningIds = JSON.parse((await AsyncStorage.getItem(SEEN_WARNING_IDS_KEY)) || '[]');
  await AsyncStorage.setItem(
    SEEN_WARNING_IDS_KEY,
    JSON.stringify(Array.from(new Set([...storedWarningIds, warning.id])).slice(-100)),
  );
  return true;
}
export async function cancelPreparednessReminder() {
  const reminderId = await AsyncStorage.getItem(PREPAREDNESS_REMINDER_ID_KEY);
  if (reminderId) {
    try {
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch {
      // Keep the ID for retry. A local-data reset can still proceed, but scheduling
      // a replacement must stop to avoid leaving two reminders active.
      return false;
    }
    await AsyncStorage.removeItem(PREPAREDNESS_REMINDER_ID_KEY);
  }
  return true;
}
export async function syncPreparednessReminder(appState) {
  if (!(await cancelPreparednessReminder())) {
    throw new Error('Previous preparedness reminder could not be cancelled.');
  }

  if (!appState?.settings?.preparednessReminders || !appState?.permissions?.notifications) {
    return null;
  }

  const permission = await Notifications.getPermissionsAsync();
  const notificationsAllowed =
    permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  if (!notificationsAllowed) {
    return null;
  }

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Keep your preparedness up to date',
      body: 'You have not opened DisasterGuardian for five days. Review your go-bag, emergency kit, or safety quizzes.',
      data: { route: 'PrepareOverview' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5 * 24 * 60 * 60,
      repeats: false,
    },
  });

  await AsyncStorage.setItem(PREPAREDNESS_REMINDER_ID_KEY, reminderId);
  return reminderId;
}
export async function sendTestEmergencyNotification() {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test emergency notification',
      body: 'This is a local test notification. No real emergency has been detected.',
      data: {
        route: 'EmergencyResponse',
        warning: {
          title: 'Test notification',
          detail: 'This is a development-only notification test.',
          severity: 'Test',
        },
      },
    },
    trigger: null,
  });
}

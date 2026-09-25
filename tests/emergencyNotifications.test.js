import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import {
  cancelPreparednessReminder,
  notifyNewWarnings,
  PREPAREDNESS_REMINDER_ID_KEY,
  SEEN_WARNING_IDS_KEY,
  syncPreparednessReminder,
} from '../utils/emergencyNotifications';

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelScheduledNotificationAsync: jest.fn(),
  IosAuthorizationStatus: { PROVISIONAL: 3 },
  SchedulableTriggerInputTypes: { TIME_INTERVAL: 'timeInterval' },
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  Notifications.getPermissionsAsync.mockResolvedValue({ granted: true });
  Notifications.scheduleNotificationAsync.mockResolvedValue('new-reminder');
  Notifications.cancelScheduledNotificationAsync.mockResolvedValue(undefined);
});

test('keeps the reminder ID and avoids scheduling a duplicate when cancellation fails', async () => {
  await AsyncStorage.setItem(PREPAREDNESS_REMINDER_ID_KEY, 'existing-reminder');
  Notifications.cancelScheduledNotificationAsync.mockRejectedValueOnce(new Error('Cancellation failed'));
  await expect(
    syncPreparednessReminder({
      settings: { preparednessReminders: true },
      permissions: { notifications: true },
    }),
  ).rejects.toThrow('Previous preparedness reminder could not be cancelled.');
  expect(await AsyncStorage.getItem(PREPAREDNESS_REMINDER_ID_KEY)).toBe('existing-reminder');
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
  await cancelPreparednessReminder();
  expect(await AsyncStorage.getItem(PREPAREDNESS_REMINDER_ID_KEY)).toBeNull();
});

test('a failed warning notification is eligible for retry and keeps its navigation destination', async () => {
  const warning = { id: 'flood-1', title: 'Flood warning' };
  Notifications.scheduleNotificationAsync.mockRejectedValueOnce(new Error('Scheduling failed'));
  await expect(notifyNewWarnings([warning])).rejects.toThrow('Scheduling failed');
  expect(await AsyncStorage.getItem(SEEN_WARNING_IDS_KEY)).toBeNull();
  await notifyNewWarnings([warning]);
  expect(Notifications.scheduleNotificationAsync).toHaveBeenLastCalledWith(
    expect.objectContaining({
      content: expect.objectContaining({ data: { warningId: 'flood-1', route: 'EmergencyResponse', warning } }),
      trigger: null,
    }),
  );
  expect(JSON.parse(await AsyncStorage.getItem(SEEN_WARNING_IDS_KEY))).toEqual(['flood-1']);
});

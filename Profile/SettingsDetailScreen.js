import React, { useCallback, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/Styles';

import { loadAppState, updateAppState } from '../storage/appState';
import { sendTestEmergencyNotification, syncPreparednessReminder } from '../utils/emergencyNotifications';

function notificationsGranted(status) {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

function SettingRow({ title, detail, value, onChange, largeText }) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingCopy}>
        <Text style={[styles.settingTitle, largeText && styles.largeBody]}>{title}</Text>
        <Text style={[styles.settingDetail, largeText && styles.largeDetail]}>{detail}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        thumbColor={value ? '#ffffff' : '#f5f5f5'}
        trackColor={{ false: '#d4d4d4', true: '#404040' }}
        accessibilityRole="switch"
        accessibilityLabel={title}
        accessibilityHint={detail}
      />
    </View>
  );
}

export default function SettingsDetailScreen({ route, navigation }) {
  const category = route.params?.category || 'accessibility';
  const [appState, setAppState] = useState(null);

  const refreshSettings = useCallback(async () => {
    setAppState(await loadAppState());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshSettings().catch(() => {
        Alert.alert('Settings unavailable', 'Your settings could not be loaded. Return to Profile and try again.');
      });
    }, [refreshSettings]),
  );

  const updateSettings = async (patch) => {
    let nextState;
    try {
      nextState = await updateAppState({ settings: patch });
    } catch {
      Alert.alert('Settings not saved', 'Your change could not be saved. Please try again.');
      return;
    }
    setAppState(nextState);
    if (Object.prototype.hasOwnProperty.call(patch, 'preparednessReminders')) {
      syncPreparednessReminder(nextState).catch(() => {
        Alert.alert(
          'Reminder not updated',
          'Your setting was saved, but the notification reminder could not be updated. Please try again.',
        );
      });
    }
  };

  const updateLocationPermission = async (value) => {
    if (value) {
      const status = await Location.requestForegroundPermissionsAsync();
      await updateAppState({ permissions: { location: status.granted } }).then(setAppState);
      if (!status.granted && !status.canAskAgain) {
        Alert.alert(
          'Location permission blocked',
          'Enable location access in system settings to use local hazard features.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }

    const status = await Location.getForegroundPermissionsAsync();
    if (!status.granted) {
      await updateAppState({ permissions: { location: false } }).then(setAppState);
      return;
    }
    Alert.alert(
      'Change location permission',
      'Location access is controlled by the operating system. Open settings to revoke it.',
      [
        { text: 'Keep enabled', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  const updateNotificationPermission = async (value) => {
    if (value) {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'Default',
          importance: Notifications.AndroidImportance.DEFAULT,
        });
      }
      const status = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      await updateAppState({ permissions: { notifications: notificationsGranted(status) } }).then(setAppState);
      if (!notificationsGranted(status) && !status.canAskAgain) {
        Alert.alert(
          'Notification permission blocked',
          'Enable notifications in system settings to receive emergency alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open settings', onPress: () => Linking.openSettings() },
          ],
        );
      }
      return;
    }

    const status = await Notifications.getPermissionsAsync();
    if (!notificationsGranted(status)) {
      await updateAppState({ permissions: { notifications: false } }).then(setAppState);
      return;
    }
    Alert.alert(
      'Change notification permission',
      'Notification access is controlled by the operating system. Open settings to revoke it.',
      [
        { text: 'Keep enabled', style: 'cancel' },
        { text: 'Open settings', onPress: () => Linking.openSettings() },
      ],
    );
  };

  if (!appState) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loading}>
          <Text>Loading settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const largeText = Boolean(appState.settings.largeText);
  const highContrast = Boolean(appState.settings.highContrast);
  const isAccessibility = category === 'accessibility';

  if (category === 'hub') {
    return (
      <SafeAreaView
        style={[styles.safeArea, highContrast && styles.highContrastBackground]}
        edges={['left', 'right', 'bottom']}
      >
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.heroCard, highContrast && styles.highContrastCard]}>
            <Text style={styles.eyebrow}>Profile settings</Text>
            <Text style={[styles.title, largeText && styles.largeTitle]}>Settings</Text>
          </View>
          <View style={[styles.settingsCard, highContrast && styles.highContrastCard]}>
            <Pressable
              style={styles.settingsLinkButton}
              onPress={() => navigation.setParams({ category: 'location-notifications' })}
              accessibilityRole="button"
              accessibilityLabel="Open location and notification settings"
            >
              <View style={styles.settingsLinkCopy}>
                <Text style={[styles.settingsLinkTitle, largeText && styles.largeBody]}>
                  Location and notifications
                </Text>
                <Text style={[styles.settingDetail, largeText && styles.largeDetail]}>
                  Manage location access, warnings, reminders, and alerts.
                </Text>
              </View>
              <Text style={styles.settingsLinkArrow}>›</Text>
            </Pressable>
            <Pressable
              style={styles.settingsLinkButton}
              onPress={() => navigation.setParams({ category: 'accessibility' })}
              accessibilityRole="button"
              accessibilityLabel="Open accessibility settings"
            >
              <View style={styles.settingsLinkCopy}>
                <Text style={[styles.settingsLinkTitle, largeText && styles.largeBody]}>Accessibility settings</Text>
                <Text style={[styles.settingDetail, largeText && styles.largeDetail]}>
                  Adjust emergency mode, text size, contrast, and animations.
                </Text>
              </View>
              <Text style={styles.settingsLinkArrow}>›</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, highContrast && styles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, highContrast && styles.highContrastCard]}>
          <Text style={styles.eyebrow}>Profile settings</Text>
          <Text style={[styles.title, largeText && styles.largeTitle]}>
            {isAccessibility ? 'Accessibility settings' : 'Location and notifications'}
          </Text>
          <Text style={[styles.body, largeText && styles.largeBody]}>
            {isAccessibility
              ? 'Adjust how DisasterGuardian presents information and motion.'
              : 'Control the permissions and alerts used for local emergency support.'}
          </Text>
        </View>

        <View style={[styles.settingsCard, highContrast && styles.highContrastCard]}>
          {isAccessibility ? (
            <>
              <SettingRow
                title="Emergency mode"
                detail="Show a simplified dashboard with quick access to emergency help and guidance."
                value={appState.settings.emergencyMode}
                onChange={(value) => updateSettings({ emergencyMode: value })}
                largeText={largeText}
              />
              <SettingRow
                title="Larger text"
                detail="Increase text size in key dashboard, profile, and emergency guidance screens."
                value={appState.settings.largeText}
                onChange={(value) => updateSettings({ largeText: value })}
                largeText={largeText}
              />
              <SettingRow
                title="High contrast"
                detail="Use stronger text, borders, and status colours to improve visual clarity."
                value={appState.settings.highContrast}
                onChange={(value) => updateSettings({ highContrast: value })}
                largeText={largeText}
              />
              <SettingRow
                title="Reduce animations"
                detail="Turn off animated scrolling and challenge item return animations."
                value={appState.settings.reducedMotion}
                onChange={(value) => updateSettings({ reducedMotion: value })}
                largeText={largeText}
              />
            </>
          ) : (
            <>
              <SettingRow
                title="Location permission"
                detail="Allow local hazard status and nearby support features."
                value={appState.permissions.location}
                onChange={updateLocationPermission}
                largeText={largeText}
              />
              <SettingRow
                title="Use precise location in app"
                detail="Prefer precise location when permission is already granted."
                value={appState.settings.usePreciseLocation}
                onChange={(value) => updateSettings({ usePreciseLocation: value })}
                largeText={largeText}
              />
              <SettingRow
                title="Notification permission"
                detail="Master toggle for emergency and progress notifications."
                value={appState.permissions.notifications}
                onChange={updateNotificationPermission}
                largeText={largeText}
              />
              <SettingRow
                title="Emergency alerts"
                detail="Receive warning-state messaging and response prompts."
                value={appState.settings.emergencyAlerts}
                onChange={(value) => updateSettings({ emergencyAlerts: value })}
                largeText={largeText}
              />
              <SettingRow
                title="Preparedness reminders"
                detail="Get checklist and readiness nudges for routine progress."
                value={appState.settings.preparednessReminders}
                onChange={(value) => updateSettings({ preparednessReminders: value })}
                largeText={largeText}
              />
              <SettingRow
                title="Achievement alerts"
                detail="Show AP and badge milestone updates."
                value={appState.settings.achievementAlerts}
                onChange={(value) => updateSettings({ achievementAlerts: value })}
                largeText={largeText}
              />
              {__DEV__ ? (
                <Pressable
                  style={styles.testNotificationButton}
                  onPress={() =>
                    sendTestEmergencyNotification().catch(() => {
                      Alert.alert(
                        'Test notification failed',
                        'The notification could not be sent. Check notification permissions and try again.',
                      );
                    })
                  }
                  accessibilityRole="button"
                  accessibilityLabel="Send test emergency notification"
                >
                  <Text style={styles.testNotificationText}>Send test emergency notification</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  highContrastBackground: { backgroundColor: '#ffffff' },
  highContrastCard: { borderColor: '#171717', borderWidth: 2 },
  content: { padding: 18, gap: 14, paddingBottom: 28 },
  heroCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 18,
    gap: 7,
  },
  eyebrow: { color: '#5f6b63', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#171717', fontSize: 26, fontWeight: '700' },
  body: { color: '#525252', fontSize: 14, lineHeight: 20 },
  settingsCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 15,
  },
  settingsLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ecebe7',
    paddingVertical: 13,
  },
  settingsLinkCopy: { flex: 1, gap: 3 },
  settingsLinkTitle: { color: '#171717', fontSize: 15, fontWeight: '700' },
  settingsLinkArrow: { color: '#5f6b63', fontSize: 28, fontWeight: '300' },
  testNotificationButton: {
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9a3412',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 4,
  },
  testNotificationText: { color: '#9a3412', fontSize: 13, fontWeight: '700' },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingCopy: { flex: 1, gap: 3 },
  settingTitle: { color: '#171717', fontSize: 14, fontWeight: '700' },
  settingDetail: { color: '#6b7280', fontSize: 12, lineHeight: 17 },
  largeTitle: { fontSize: 32 },
  largeBody: { fontSize: 17, lineHeight: 25 },
  largeDetail: { fontSize: 15, lineHeight: 22 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

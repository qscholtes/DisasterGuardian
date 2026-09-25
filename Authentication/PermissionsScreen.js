import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { accessibilityStyles } from '../styles/accessibilityStyles';

export default function PermissionsScreen({ navigation, onComplete, route }) {
  const initialMode = route.params?.mode || 'guest';
  const initialName = route.params?.displayName || '';

  const [displayName, setDisplayName] = useState(initialName);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  const summaryText = useMemo(() => {
    if (locationEnabled && notificationsEnabled) {
      return 'Dashboard alerts, local risk messaging, and reminders are enabled for this device profile.';
    }
    if (!locationEnabled && !notificationsEnabled) {
      return 'The app will still work offline, but local alerts and reminders stay disabled until you update setup.';
    }
    return 'Partial setup is saved locally. You can enable the other permission later from Profile.';
  }, [locationEnabled, notificationsEnabled]);

  const finishSetup = async (overrides = {}) => {
    let locationGranted = overrides.location ?? locationEnabled;
    let notificationsGranted = overrides.notifications ?? notificationsEnabled;

    if (locationGranted) {
      const permission = await Location.requestForegroundPermissionsAsync();
      locationGranted = permission.granted;
    }

    if (notificationsGranted) {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('emergency-alerts', {
          name: 'Emergency alerts',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#9a3412',
        });
      }
      const permission = await Notifications.requestPermissionsAsync({
        ios: { allowAlert: true, allowBadge: true, allowSound: true },
      });
      notificationsGranted =
        permission.granted || permission.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
    }

    await onComplete({
      onboardingComplete: true,
      mode: initialMode,
      displayName: displayName.trim(),
      permissions: {
        location: locationGranted,
        notifications: notificationsGranted,
      },
      settings: {
        largeText,
        highContrast,
      },
    });

    navigation.reset({
      index: 0,
      routes: [{ name: 'HomeDashboard' }],
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, highContrast && accessibilityStyles.highContrastBackground]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, largeText && accessibilityStyles.largeTextTitle]}>Finish setup</Text>
          <Text style={[styles.subtitle, largeText && accessibilityStyles.largeTextBody]}>
            Choose which local alerts and location features you want to enable. You can change these choices later in
            Profile.
          </Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.namePanel, highContrast && accessibilityStyles.highContrastCard]}>
            <Text style={[styles.label, largeText && accessibilityStyles.largeTextHeading]}>Display name</Text>
            <TextInput
              onChangeText={setDisplayName}
              placeholder="Guest user"
              placeholderTextColor="#64748b"
              style={[
                styles.input,
                highContrast && styles.highContrastInput,
                largeText && accessibilityStyles.largeTextBody,
              ]}
              value={displayName}
            />
            <Text style={[styles.helperText, largeText && accessibilityStyles.largeTextSmall]}>
              Leave blank to use the default guest label on the dashboard.
            </Text>
          </View>

          <View style={[styles.permissionPanel, highContrast && accessibilityStyles.highContrastCard]}>
            <View style={styles.permissionRow}>
              <View style={styles.permissionCopy}>
                <Text style={[styles.permissionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                  Location monitoring
                </Text>
                <Text style={[styles.permissionText, largeText && accessibilityStyles.largeTextBody]}>
                  Show local risk status and unlock nearby support flows later.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Enable location monitoring"
                onValueChange={setLocationEnabled}
                thumbColor={locationEnabled ? '#ffffff' : '#f5f5f5'}
                trackColor={{ false: '#d4d4d4', true: '#404040' }}
                value={locationEnabled}
              />
            </View>

            <View style={styles.permissionRow}>
              <View style={styles.permissionCopy}>
                <Text style={[styles.permissionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                  Preparedness and alert notifications
                </Text>
                <Text style={[styles.permissionText, largeText && accessibilityStyles.largeTextBody]}>
                  Enable reminders, AP updates, and emergency banner behavior.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Enable preparedness and alert notifications"
                onValueChange={setNotificationsEnabled}
                thumbColor={notificationsEnabled ? '#ffffff' : '#f5f5f5'}
                trackColor={{ false: '#d4d4d4', true: '#404040' }}
                value={notificationsEnabled}
              />
            </View>
          </View>

          <View style={[styles.accessibilityPanel, highContrast && accessibilityStyles.highContrastCard]}>
            <Text style={[styles.summaryTitle, largeText && accessibilityStyles.largeTextSmall]}>Accessibility</Text>
            <View style={styles.accessibilityRow}>
              <View style={styles.permissionCopy}>
                <Text style={[styles.permissionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                  Larger text
                </Text>
                <Text style={[styles.permissionText, largeText && accessibilityStyles.largeTextBody]}>
                  Increase text sizes throughout the app.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Enable larger text"
                onValueChange={setLargeText}
                thumbColor={largeText ? '#ffffff' : '#f5f5f5'}
                trackColor={{ false: '#d4d4d4', true: highContrast ? '#000000' : '#404040' }}
                value={largeText}
              />
            </View>
            <View style={styles.accessibilityRow}>
              <View style={styles.permissionCopy}>
                <Text style={[styles.permissionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                  High contrast
                </Text>
                <Text style={[styles.permissionText, largeText && accessibilityStyles.largeTextBody]}>
                  Use stronger borders and contrast for easier reading.
                </Text>
              </View>
              <Switch
                accessibilityLabel="Enable high contrast"
                onValueChange={setHighContrast}
                thumbColor={highContrast ? '#ffffff' : '#f5f5f5'}
                trackColor={{ false: '#d4d4d4', true: '#000000' }}
                value={highContrast}
              />
            </View>
          </View>

          <View style={[styles.summaryPanel, highContrast && accessibilityStyles.highContrastCard]}>
            <Text style={[styles.summaryTitle, largeText && accessibilityStyles.largeTextSmall]}>Saved locally</Text>
            <Text style={[styles.summaryText, largeText && accessibilityStyles.largeTextBody]}>{summaryText}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Pressable
            style={[styles.primaryButton, highContrast && accessibilityStyles.highContrastPrimary]}
            onPress={finishSetup}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryButtonText, largeText && accessibilityStyles.largeTextButton]}>
              Open Dashboard
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f2',
  },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    gap: 8,
    marginTop: 4,
  },
  title: {
    color: '#171717',
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  content: {
    gap: 12,
  },
  namePanel: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
    gap: 7,
  },
  label: {
    color: '#404040',
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#f5f5f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d6d3d1',
    color: '#171717',
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  helperText: {
    color: '#737373',
    fontSize: 12,
    lineHeight: 17,
  },
  permissionPanel: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
    gap: 14,
  },
  permissionRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  permissionCopy: {
    flex: 1,
    gap: 4,
  },
  permissionTitle: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '700',
  },
  permissionText: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  summaryPanel: {
    backgroundColor: '#fafaf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
    gap: 5,
  },
  accessibilityPanel: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 14,
    gap: 14,
  },
  accessibilityRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  highContrastInput: {
    borderColor: '#171717',
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  summaryTitle: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  summaryText: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  footer: {
    gap: 12,
    marginTop: 14,
  },
  primaryButton: {
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fafaf9',
    fontSize: 15,
    fontWeight: '700',
  },
});

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import {
  loadAppState,
  loadChecklistState,
  loadPersonalProfile,
  loadPreparednessProgress,
  resetLocalData,
  savePersonalProfile,
  updateAppState,
} from '../storage/appState';
import { getLevelProgress } from '../utils/progression';
import { getBadgeProgress } from '../utils/badges';
import { accessibilityStyles } from '../styles/accessibilityStyles';
import { commonStyles } from '../styles/Styles';
import { cancelPreparednessReminder } from '../utils/emergencyNotifications';
import PreparednessTasksSection from './PreparednessTasksSection';
import BadgeProgressSection from './BadgeProgressSection';
import { getNextRankProgress, getRankLabel, preparednessTasks } from './profileData';
import { ProfileIdentityCard, ProfileRankCard } from './ProfileSummaryCards';

function notificationsGranted(status) {
  return status.granted || status.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

async function getLocationPermissionGranted() {
  const status = await Location.getForegroundPermissionsAsync();
  return status.granted;
}

async function getNotificationPermissionGranted() {
  const status = await Notifications.getPermissionsAsync();
  return notificationsGranted(status);
}

export default function ProfileScreen({ route, navigation }) {
  const [appState, setAppState] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState(null);
  const [checklistState, setChecklistState] = useState({});
  const [badgesOpen, setBadgesOpen] = useState(false);
  const [openBadgeCategories, setOpenBadgeCategories] = useState({});
  const scrollViewRef = useRef(null);
  const badgeSectionY = useRef(null);
  const apSectionY = useRef(null);
  const contactSectionY = useRef(null);
  const [tasksOpen, setTasksOpen] = useState(false);
  const [expandedTaskKey, setExpandedTaskKey] = useState(null);
  const [personalProfile, setPersonalProfile] = useState(null);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [customItem, setCustomItem] = useState('');
  const refreshProfile = useCallback(async ({ syncState = true } = {}) => {
    const [storedAppState, storedChallengeProgress, storedChecklistState, storedPersonalProfile] = await Promise.all([
      loadAppState(),
      loadPreparednessProgress(),
      loadChecklistState(),
      loadPersonalProfile(),
    ]);

    let updatedAppState = storedAppState;

    if (syncState) {
      const [locationGranted, notificationGranted] = await Promise.all([
        getLocationPermissionGranted(),
        getNotificationPermissionGranted(),
      ]);

      if (
        storedAppState.permissions.location !== locationGranted ||
        storedAppState.permissions.notifications !== notificationGranted
      ) {
        updatedAppState = await updateAppState({
          permissions: {
            location: locationGranted,
            notifications: notificationGranted,
          },
        });
      }
    }

    setAppState(updatedAppState);
    setChallengeProgress(storedChallengeProgress);
    setChecklistState(storedChecklistState);
    setPersonalProfile(storedPersonalProfile);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshProfile();
    }, [refreshProfile]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!route?.params?.expandContacts) {
        return undefined;
      }

      const scrollTimer = setTimeout(() => {
        if (contactSectionY.current !== null) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, contactSectionY.current - 12),
            animated: appState?.settings.reducedMotion !== true,
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimer);
    }, [appState?.settings.reducedMotion, route?.params?.expandContacts]),
  );

  useFocusEffect(
    useCallback(() => {
      if (!route?.params?.expandBadges) {
        return undefined;
      }

      setBadgesOpen(true);
      const scrollTimer = setTimeout(() => {
        if (badgeSectionY.current !== null) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, badgeSectionY.current - 12),
            animated: appState?.settings.reducedMotion !== true,
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimer);
    }, [appState?.settings.reducedMotion, route?.params?.expandBadges]),
  );

  useEffect(() => {
    if (!route?.params?.expandBadges || !badgesOpen || badgeSectionY.current === null) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({
        y: Math.max(0, badgeSectionY.current - 12),
        animated: appState?.settings.reducedMotion !== true,
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [appState?.settings.reducedMotion, badgesOpen, route?.params?.expandBadges]);

  useFocusEffect(
    useCallback(() => {
      if (!route?.params?.expandAp) {
        return undefined;
      }

      const scrollTimer = setTimeout(() => {
        if (apSectionY.current !== null) {
          scrollViewRef.current?.scrollTo({
            y: Math.max(0, apSectionY.current - 12),
            animated: appState?.settings.reducedMotion !== true,
          });
        }
      }, 100);

      return () => clearTimeout(scrollTimer);
    }, [appState?.settings.reducedMotion, route?.params?.expandAp]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshProfile();
      }
    });

    return () => subscription.remove();
  }, [refreshProfile]);

  const handlePersonalProfilePatch = async (patch) => {
    const nextProfile = await savePersonalProfile({ ...personalProfile, ...patch });
    setPersonalProfile(nextProfile);
  };
  const addEmergencyContact = async () => {
    const name = contactName.trim();
    const phone = contactPhone.trim();
    if (!name || !phone) {
      Alert.alert('Add a contact', 'Enter both a name and a phone number.');
      return;
    }
    await handlePersonalProfilePatch({
      contacts: [...(personalProfile.contacts || []), { id: `${Date.now()}`, name, phone }],
    });
    const updatedAppState = await updateAppState({ tasks: { emergencyContacts: true } });
    setAppState(updatedAppState);
    setContactName('');
    setContactPhone('');
  };
  const removeEmergencyContact = (contactId) => {
    Alert.alert('Remove contact?', 'This removes the contact from your local profile.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () =>
          handlePersonalProfilePatch({
            contacts: personalProfile.contacts.filter((contact) => contact.id !== contactId),
          }),
      },
    ]);
  };
  const addCustomChecklistItem = async () => {
    const checklistLabel = customItem.trim();
    if (!checklistLabel) {
      return;
    }
    if (
      (personalProfile.customChecklistItems || []).some(
        (existingItem) => existingItem.toLowerCase() === checklistLabel.toLowerCase(),
      )
    ) {
      Alert.alert('Item already added', 'This item is already on your personalised checklist.');
      return;
    }
    await handlePersonalProfilePatch({
      customChecklistItems: [...(personalProfile.customChecklistItems || []), checklistLabel],
    });
    setCustomItem('');
  };

  const removeCustomChecklistItem = (itemToRemove) => {
    handlePersonalProfilePatch({
      customChecklistItems: (personalProfile.customChecklistItems || []).filter((item) => item !== itemToRemove),
    });
  };
  const handleResetLocalData = () => {
    Alert.alert(
      'Reset local data?',
      'This removes the local profile, streak, badges, AP, and preparedness task history from this device.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await cancelPreparednessReminder();
            await resetLocalData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ],
    );
  };

  if (!appState || !challengeProgress || !personalProfile) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalAp = challengeProgress.totalAp;
  const { level, nextLevelXp, progressPercent } = getLevelProgress(totalAp);
  const rank = getRankLabel(level);
  const nextRankProgress = getNextRankProgress(level);
  const toggleTasksCard = () => {
    setTasksOpen((tasksWereOpen) => {
      const tasksShouldRemainOpen = !tasksWereOpen;
      if (!tasksShouldRemainOpen) {
        setExpandedTaskKey(null);
      }
      return tasksShouldRemainOpen;
    });
  };
  const toggleTask = (taskKey) => {
    setExpandedTaskKey((current) => (current === taskKey ? null : taskKey));
  };
  const dailyStreak = appState.dailyStreak || 0;
  const streakCycleProgress = dailyStreak % 60 === 0 ? (dailyStreak > 0 ? 60 : 0) : dailyStreak % 60;
  const streakCycleFill = Math.min(100, Math.round((streakCycleProgress / 60) * 100));
  const nextStreakReward =
    'Every day beyond a 1 day streak awards +100 AP. Reach 20 days for +1000 AP, 40 days for another +1000 AP, and 60 days for +2000 AP before the progress bar cycles.';
  const displayName = appState.displayName || (appState.mode === 'guest' ? 'Guest user' : 'User');
  const largeText = Boolean(appState.settings.largeText);
  const highContrast = Boolean(appState.settings.highContrast);
  const badgeProgress = getBadgeProgress(appState, challengeProgress, checklistState);
  const badgeCategories = ['Go-bag', 'Disaster quizzes', 'Emergency kit', 'Guardian milestones'];
  const badgeGroups = badgeCategories.map((category) => ({
    category,
    badges: badgeProgress.filter((badge) => badge.category === category),
  }));

  return (
    <SafeAreaView
      style={[styles.safeArea, highContrast && accessibilityStyles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.content}>
        <ProfileIdentityCard
          displayName={displayName}
          guestMode={appState.mode === 'guest'}
          largeText={largeText}
          highContrast={highContrast}
          styles={styles}
          accessibilityStyles={accessibilityStyles}
        />
        <ProfileRankCard
          rank={rank}
          nextRankProgress={nextRankProgress}
          largeText={largeText}
          highContrast={highContrast}
          styles={styles}
          accessibilityStyles={accessibilityStyles}
        />

        {false && (
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.settingDetail}>Open a focused settings screen to reduce visual clutter.</Text>
            <Pressable
              style={styles.settingsLinkButton}
              onPress={() => navigation.navigate('ProfileSettingsDetail', { category: 'location-notifications' })}
              accessibilityRole="button"
              accessibilityLabel="Open location and notification settings"
            >
              <View style={styles.settingsLinkCopy}>
                <Text style={styles.settingsLinkTitle}>Location and notifications</Text>
                <Text style={styles.settingDetail}>Manage location access, warnings, reminders, and alerts.</Text>
              </View>
              <Text style={styles.settingsLinkArrow}>›</Text>
            </Pressable>
            <Pressable
              style={styles.settingsLinkButton}
              onPress={() => navigation.navigate('ProfileSettingsDetail', { category: 'accessibility' })}
              accessibilityRole="button"
              accessibilityLabel="Open accessibility settings"
            >
              <View style={styles.settingsLinkCopy}>
                <Text style={styles.settingsLinkTitle}>Accessibility settings</Text>
                <Text style={styles.settingDetail}>Adjust emergency mode, text size, contrast, and animations.</Text>
              </View>
              <Text style={styles.settingsLinkArrow}>›</Text>
            </Pressable>
          </View>
        )}

        <View
          style={[styles.statsCard, highContrast && accessibilityStyles.highContrastCard]}
          onLayout={(event) => {
            apSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <View style={styles.statsHeader}>
            <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
              Achievement points
            </Text>
            <Text style={styles.levelPill}>Level {level}</Text>
          </View>
          <Text style={[styles.apValue, largeText && accessibilityStyles.largeTextValue]}>{totalAp} AP</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={[styles.statsHelper, largeText && accessibilityStyles.largeTextBody]}>
            Next level at {nextLevelXp} AP
          </Text>
          <Text style={[styles.apDescription, largeText && accessibilityStyles.largeTextBody]}>
            Earn more AP by completing preparedness tasks, finishing quizzes, improving your emergency-kit score, and
            maintaining your daily streak.
          </Text>
        </View>

        <View style={[styles.streakCard, highContrast && accessibilityStyles.highContrastCard]}>
          <View style={styles.streakHeader}>
            <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>Daily streak</Text>
            <Text style={[styles.streakValue, largeText && accessibilityStyles.largeTextValue]}>
              {dailyStreak} days
            </Text>
          </View>
          <Text style={styles.streakMeta}>Day {streakCycleProgress || 0} of 60</Text>
          <View style={styles.streakTrackWrap}>
            <View style={styles.progressTrack}>
              <View style={styles.streakMarker20} />
              <View style={styles.streakMarker40} />
              <View style={[styles.streakFill, { width: `${streakCycleFill}%` }]} />
            </View>
            <View style={styles.streakGuideRow}>
              <View style={styles.streakGuide20}>
                <Text style={styles.streakGuideText}>20</Text>
              </View>
              <View style={styles.streakGuide40}>
                <Text style={styles.streakGuideText}>40</Text>
              </View>
            </View>
          </View>
          <Text style={[styles.streakHelper, largeText && accessibilityStyles.largeTextBody]}>{nextStreakReward}</Text>
        </View>

        <BadgeProgressSection
          badgeProgress={badgeProgress}
          badgeGroups={badgeGroups}
          badgesOpen={badgesOpen}
          onToggleBadges={() => setBadgesOpen((current) => !current)}
          openBadgeCategories={openBadgeCategories}
          onToggleCategory={(category) =>
            setOpenBadgeCategories((current) => ({ ...current, [category]: !current[category] }))
          }
          largeText={largeText}
          highContrast={highContrast}
          onLayout={(event) => {
            badgeSectionY.current = event.nativeEvent.layout.y;
          }}
        />

        <PreparednessTasksSection
          tasks={preparednessTasks}
          challengeProgress={challengeProgress}
          tasksOpen={tasksOpen}
          onToggleTasks={toggleTasksCard}
          expandedTaskKey={expandedTaskKey}
          onToggleTask={toggleTask}
          largeText={largeText}
          highContrast={highContrast}
        />

        <View style={[styles.settingsCard, highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
            My preparedness profile
          </Text>
          <Text style={[styles.settingDetail, largeText && accessibilityStyles.largeTextBody]}>
            These details stay on this device.
          </Text>
          <View style={styles.householdRow}>
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>Household size</Text>
              <Text style={styles.settingDetail}>Used to suggest suitable water supplies.</Text>
            </View>
            <TextInput
              style={styles.numberInput}
              value={String(personalProfile.householdSize)}
              onChangeText={(value) =>
                handlePersonalProfilePatch({ householdSize: value.replace(/[^0-9]/g, '').slice(0, 2) || '1' })
              }
              keyboardType="number-pad"
              maxLength={2}
              accessibilityLabel="Household size"
            />
          </View>
          {(personalProfile.customChecklistItems || []).map((item) => (
            <View key={item} style={styles.customItemRow}>
              <Text style={styles.customItemText}>{item}</Text>
              <Pressable
                onPress={() => removeCustomChecklistItem(item)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item} from personalised checklist`}
              >
                <Text style={styles.removeContactText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <Text style={styles.settingTitle}>Custom checklist items</Text>
          <Text style={styles.settingDetail}>These items are added to the go-bag checklist.</Text>
          <TextInput
            value={customItem}
            onChangeText={setCustomItem}
            placeholder="Add a personal checklist item"
            placeholderTextColor="#737373"
            style={styles.textInput}
            accessibilityLabel="Personal checklist item"
            onSubmitEditing={addCustomChecklistItem}
            returnKeyType="done"
          />
          <Pressable
            style={styles.addContactButton}
            onPress={addCustomChecklistItem}
            accessibilityRole="button"
            accessibilityLabel="Add personal checklist item"
          >
            <Text style={styles.addContactText}>Add checklist item</Text>
          </Pressable>
          <Text style={styles.settingDetail}>
            Think about pets, medication, mobility aids, children, important documents, glasses, communication needs,
            and anything else you may need during an evacuation.
          </Text>
        </View>

        <View
          style={[styles.settingsCard, highContrast && accessibilityStyles.highContrastCard]}
          onLayout={(event) => {
            contactSectionY.current = event.nativeEvent.layout.y;
          }}
        >
          <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
            Emergency contacts
          </Text>
          <Text style={[styles.settingDetail, largeText && accessibilityStyles.largeTextBody]}>
            Save trusted contacts for quick access. Contacts are stored locally and are not uploaded.
          </Text>
          {(personalProfile.contacts || []).map((contact) => (
            <View key={contact.id} style={styles.contactRow}>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingTitle, largeText && accessibilityStyles.largeTextHeading]}>
                  {contact.name}
                </Text>
                <Text style={[styles.settingDetail, largeText && accessibilityStyles.largeTextBody]}>
                  {contact.phone}
                </Text>
              </View>
              <Pressable
                style={styles.callContactButton}
                onPress={() => Linking.openURL(`tel:${contact.phone}`).catch(() => {})}
                accessibilityRole="button"
                accessibilityLabel={`Call ${contact.name}`}
              >
                <Text style={[styles.callContactText, largeText && accessibilityStyles.largeTextButton]}>Call</Text>
              </Pressable>
              <Pressable
                onPress={() => removeEmergencyContact(contact.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${contact.name}`}
              >
                <Text style={styles.removeContactText}>Remove</Text>
              </Pressable>
            </View>
          ))}
          <TextInput
            value={contactName}
            onChangeText={setContactName}
            placeholder="Contact name"
            placeholderTextColor="#737373"
            style={styles.textInput}
            accessibilityLabel="Emergency contact name"
          />
          <TextInput
            value={contactPhone}
            onChangeText={setContactPhone}
            placeholder="Phone number"
            placeholderTextColor="#737373"
            style={styles.textInput}
            keyboardType="phone-pad"
            accessibilityLabel="Emergency contact phone number"
          />
          <Pressable
            style={styles.addContactButton}
            onPress={addEmergencyContact}
            accessibilityRole="button"
            accessibilityLabel="Add emergency contact"
          >
            <Text style={styles.addContactText}>Add emergency contact</Text>
          </Pressable>
        </View>

        {false && (
          <View style={styles.settingsCard}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <Text style={styles.settingDetail}>Open a focused settings screen to reduce visual clutter.</Text>
            <Pressable
              style={styles.settingsLinkButton}
              onPress={() => navigation.navigate('ProfileSettingsDetail', { category: 'location-notifications' })}
              accessibilityRole="button"
              accessibilityLabel="Open location and notification settings"
            >
              <View style={styles.settingsLinkCopy}>
                <Text style={styles.settingsLinkTitle}>Location and notifications</Text>
                <Text style={styles.settingDetail}>Manage location access, warnings, reminders, and alerts.</Text>
              </View>
              <Text style={styles.settingsLinkArrow}>›</Text>
            </Pressable>
            <Pressable
              style={styles.settingsLinkButton}
              onPress={() => navigation.navigate('ProfileSettingsDetail', { category: 'accessibility' })}
              accessibilityRole="button"
              accessibilityLabel="Open accessibility settings"
            >
              <View style={styles.settingsLinkCopy}>
                <Text style={styles.settingsLinkTitle}>Accessibility settings</Text>
                <Text style={styles.settingDetail}>Adjust emergency mode, text size, contrast, and animations.</Text>
              </View>
              <Text style={styles.settingsLinkArrow}>›</Text>
            </Pressable>
          </View>
        )}

        <View style={[styles.privacyCard, highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={styles.sectionTitle}>Privacy and data</Text>
          <Text style={styles.settingDetail}>
            Your guest profile, checklist, quiz results, badges, and AP are stored locally on this device. Location is
            used to look up nearby warning data and is not saved by DisasterGuardian.
          </Text>
          <Text style={styles.settingDetail}>
            Warning data is retrieved from external services when you refresh the app. If a service is unavailable, the
            app will show an unavailable status instead of treating missing data as safe.
          </Text>
          <Text style={styles.settingDetail}>
            You can remove locally stored profile and preparedness data at any time using the reset option below.
          </Text>
        </View>

        <View style={styles.devCard}>
          <Text style={styles.sectionTitle}>Delete local data</Text>
          <Text style={styles.settingDetail}>
            Remove your locally stored profile, checklist, quiz results, streak, badges, and AP from this device.
          </Text>
          <Pressable style={styles.resetButton} onPress={handleResetLocalData}>
            <Text style={styles.resetButtonText}>Delete local data</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f2',
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#525252',
    fontSize: 15,
    fontWeight: '600',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 28,
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 18,
    gap: 6,
  },
  eyebrow: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  name: {
    color: '#171717',
    fontSize: 28,
    fontWeight: '700',
  },
  modeText: {
    color: '#6b7280',
    fontSize: 14,
    lineHeight: 20,
  },
  statsCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 8,
  },
  rankCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 6,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
  },
  rankValue: {
    color: '#171717',
    fontSize: 28,
    fontWeight: '700',
  },
  rankHelper: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  levelPill: {
    color: '#171717',
    backgroundColor: '#efeee8',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    fontWeight: '700',
  },
  apValue: {
    color: '#171717',
    fontSize: 30,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#e7e5e4',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#171717',
  },
  statsHelper: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  apDescription: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  streakCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 8,
  },
  streakHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  streakValue: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  streakMeta: {
    color: '#6b7280',
    fontSize: 13,
    fontWeight: '600',
  },
  streakTrackWrap: {
    gap: 6,
  },
  streakFill: {
    height: '100%',
    backgroundColor: '#171717',
  },
  streakMarker20: {
    position: 'absolute',
    left: '33.333%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#8a8a83',
    borderRadius: 999,
    zIndex: 2,
  },
  streakMarker40: {
    position: 'absolute',
    left: '66.666%',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#8a8a83',
    borderRadius: 999,
    zIndex: 2,
  },
  streakGuideRow: {
    position: 'relative',
    height: 22,
  },
  streakGuide20: {
    position: 'absolute',
    left: '33.333%',
    top: 0,
    transform: [{ translateX: -8 }],
    alignItems: 'center',
  },
  streakGuide40: {
    position: 'absolute',
    left: '66.666%',
    top: 0,
    transform: [{ translateX: -8 }],
    alignItems: 'center',
  },
  streakGuideText: {
    color: '#8a8a83',
    fontSize: 11,
    fontWeight: '700',
  },
  streakHelper: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  settingsCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 14,
  },
  householdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  numberInput: {
    width: 52,
    height: 42,
    borderWidth: 1,
    borderColor: '#cfcfc7',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  customItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingTop: 10,
  },
  customItemText: {
    flex: 1,
    color: '#2f2f2f',
    fontSize: 14,
    lineHeight: 19,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingTop: 10,
  },
  textInput: {
    height: 44,
    borderWidth: 1,
    borderColor: '#cfcfc7',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    color: '#171717',
    paddingHorizontal: 12,
    fontSize: 14,
  },
  addContactButton: {
    alignItems: 'center',
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 12,
  },
  addContactText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  callContactButton: {
    borderWidth: 1,
    borderColor: '#171717',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  callContactText: {
    color: '#171717',
    fontSize: 12,
    fontWeight: '800',
  },
  removeContactText: {
    color: '#9a3412',
    fontSize: 11,
    fontWeight: '700',
  },
  devCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 16,
    gap: 10,
  },
  privacyCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 10,
  },
  resetButton: {
    alignItems: 'center',
    backgroundColor: '#9a3412',
    borderRadius: 8,
    paddingVertical: 12,
  },
  resetButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  settingCopy: {
    flex: 1,
    gap: 4,
  },
  settingTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  settingDetail: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  settingsLinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingVertical: 12,
  },
  settingsLinkCopy: { flex: 1, gap: 3 },
  settingsLinkTitle: { color: '#171717', fontSize: 15, fontWeight: '700' },
  settingsLinkArrow: { color: '#5f6b63', fontSize: 28, fontWeight: '300' },
  ...accessibilityStyles,
});

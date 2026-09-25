import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { loadAppState, loadChecklistState, loadPreparednessProgress, updateAppState } from '../storage/appState';
import { getLevelFromXp, getLevelProgress } from '../utils/progression';
import { getBadgeProgress, getNextBadge } from '../utils/badges';
import { getFloodRiskStatus, getHeatRiskStatus, getRecommendedAction } from '../utils/ninaWarnings';
import { notifyNewWarnings } from '../utils/emergencyNotifications';
import { emptyLocalConditions, loadLocalConditions } from '../utils/localConditions';
import useLatestRequest from '../hooks/useLatestRequest';
import { accessibilityStyles } from '../styles/accessibilityStyles';
import { commonStyles } from '../styles/Styles';

import { getResourceLinkForDisaster } from '../ResourceHub/disasterContent';
import { getDisasterPresentation } from '../utils/disasterPresentation';
import DashboardFooter from './DashboardFooter';
import EmergencyResponseCard from './EmergencyResponseCard';
import {
  getBadgeIcon,
  getCurrentRisk,
  getRecommendedTask,
  getRiskIcon,
  getTimeGreeting,
  taskMetadata,
} from './homeDashboardData';

const footerLinks = [
  { key: 'learn', label: 'Learn', route: 'ResourceHub', icon: 'book-open-variant' },
  { key: 'prepare', label: 'Prepare', route: 'PrepareOverview', icon: 'check-circle-outline' },
  { key: 'profile', label: 'Profile', route: 'ProfileSettings', icon: 'account-circle-outline' },
  { key: 'alerts', label: 'Alerts', route: 'AlertsOverview', icon: 'bell-alert-outline' },
];

// Main overview of local hazards and the user's preparedness progress.
// Local conditions refresh when the screen opens and while the app is active.
export default function HomeDashboardScreen({ navigation }) {
  const [timeGreeting, setTimeGreeting] = useState(() => getTimeGreeting());
  const [appState, setAppState] = useState(null);
  const [challengeProgress, setChallengeProgress] = useState(null);
  const [checklistState, setChecklistState] = useState({});
  const [conditions, setConditions] = useState(emptyLocalConditions);
  const [showRiskDetails, setShowRiskDetails] = useState(false);
  const { begin: beginRefresh, cancel: cancelRefresh } = useLatestRequest();
  const {
    warnings: localWarnings,
    floodWarnings,
    floodError,
    heatWarnings,
    heatError,
    waterLevel,
    waterLevelError,
    temperature,
    temperatureError,
    warningError,
    locationNotice,
  } = conditions;

  useEffect(() => {
    const greetingTimer = setInterval(() => setTimeGreeting(getTimeGreeting()), 60 * 1000);
    return () => clearInterval(greetingTimer);
  }, []);

  // Load saved progress first, then fetch location-based conditions.
  // Each update checks that it still belongs to the latest refresh.
  const refreshDashboard = useCallback(async () => {
    const isCurrent = beginRefresh();
    try {
      const [storedAppState, storedChallengeProgress, storedChecklistState] = await Promise.all([
        loadAppState(),
        loadPreparednessProgress(),
        loadChecklistState(),
      ]);
      if (!isCurrent()) return;
      setAppState(storedAppState);
      setChallengeProgress(storedChallengeProgress);
      setChecklistState(storedChecklistState);

      const nextConditions = await loadLocalConditions(storedAppState.settings, isCurrent);
      if (!isCurrent()) return;
      setConditions(nextConditions);

      if (storedAppState.settings.emergencyAlerts && !nextConditions.warningError) {
        try {
          // The dashboard displays simulations, but only alerts for live real warnings.
          await notifyNewWarnings(nextConditions.warnings.filter((warning) => !warning.id.startsWith('dev-')));
        } catch {
          if (isCurrent()) {
            setConditions((current) => ({
              ...current,
              locationNotice: [
                current.locationNotice,
                'Emergency notifications could not be delivered. Check Alerts for warnings.',
              ]
                .filter(Boolean)
                .join(' '),
            }));
          }
        }
      }
    } catch {
      if (isCurrent()) {
        setConditions(emptyLocalConditions('Unable to refresh local conditions. Try again.'));
      }
    }
  }, [beginRefresh]);

  useFocusEffect(
    useCallback(() => {
      refreshDashboard();
      return cancelRefresh;
    }, [refreshDashboard, cancelRefresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshDashboard();
      }
    });
    // Refresh periodically while the dashboard remains mounted.
    const refreshTimer = setInterval(refreshDashboard, 5 * 60 * 1000);

    return () => {
      subscription.remove();
      clearInterval(refreshTimer);
    };
  }, [refreshDashboard]);

  // Turn the saved progress and latest conditions into the summaries shown on the dashboard.
  const recommendedTask = getRecommendedTask(appState);
  const currentRisk = getCurrentRisk({
    appState,
    localWarnings,
    floodWarnings,
    heatWarnings,
    warningError,
    getRecommendedAction,
  });
  const floodRisk = getFloodRiskStatus(floodWarnings, {
    hasLocation: Boolean(appState?.permissions.location),
    error: floodError,
  });
  const heatRisk = getHeatRiskStatus(heatWarnings, {
    hasLocation: Boolean(appState?.permissions.location),
    error: heatError,
  });

  const handleTaskToggle = async (taskKey) => {
    if (taskKey === 'emergencyContacts') {
      navigation.navigate('ProfileSettings');
      return;
    }
    const nextValue = !appState.tasks[taskKey];
    const nextState = await updateAppState({
      tasks: {
        [taskKey]: nextValue,
      },
    });
    setAppState(nextState);
  };

  const handleRecommendedAction = async () => {
    if (!recommendedTask) {
      return;
    }

    if (recommendedTask.type === 'challenge') {
      navigation.navigate('EmergencyKitChallenge');
      return;
    }

    await handleTaskToggle(recommendedTask.taskKey);
  };

  if (!appState || !challengeProgress || !recommendedTask || !currentRisk) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'top']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const displayName = appState.displayName || (appState.mode === 'guest' ? 'Guest user' : 'User');
  const totalAp = challengeProgress.totalAp;
  const level = getLevelFromXp(totalAp);
  const { progressPercent } = getLevelProgress(totalAp);
  const badgeProgress = getBadgeProgress(appState, challengeProgress, checklistState);
  const nextBadge = getNextBadge(badgeProgress);
  const offlineMode = !appState.permissions.location || Boolean(warningError);
  const warningResourceLink = getResourceLinkForDisaster(currentRisk.warning?.disasterType);
  const currentRiskPresentation = currentRisk.disasterType ? getDisasterPresentation(currentRisk.disasterType) : null;
  const openWarningResource = () => {
    if (warningResourceLink) {
      navigation.navigate('DisasterTopic', warningResourceLink);
    }
  };

  if (appState.settings.emergencyMode) {
    return (
      <SafeAreaView
        style={[
          styles.safeArea,
          styles.emergencyModeSafeArea,
          appState.settings.highContrast && styles.highContrastBackground,
        ]}
        edges={['left', 'right', 'top']}
      >
        <ScrollView contentContainerStyle={styles.emergencyModeContent}>
          <View style={[styles.emergencyModeHeader, appState.settings.highContrast && styles.highContrastCard]}>
            <MaterialCommunityIcons name="alert-octagon-outline" size={34} color="#ffffff" accessible={false} />
            <Text style={[styles.emergencyModeEyebrow, appState.settings.largeText && styles.largeTextSmall]}>
              EMERGENCY MODE
            </Text>
            <Text style={[styles.emergencyModeTitle, appState.settings.largeText && styles.largeTextTitle]}>
              Stay calm. Take action.
            </Text>
            <Text style={[styles.emergencyModeDetail, appState.settings.largeText && styles.largeTextBody]}>
              Quick access to help, local guidance, and your emergency contacts.
            </Text>
          </View>
          <View style={[styles.emergencyModeStatus, appState.settings.highContrast && styles.highContrastCard]}>
            <View style={styles.emergencyModeStatusRow}>
              <MaterialCommunityIcons
                name={getRiskIcon(currentRisk.severity)}
                size={24}
                color={currentRisk.accent}
                accessible={false}
              />
              <Text style={[styles.emergencyModeStatusTitle, appState.settings.largeText && styles.largeTextHeading]}>
                {currentRisk.severity}: {currentRisk.headline}
              </Text>
            </View>
            <Text style={[styles.emergencyModeStatusDetail, appState.settings.largeText && styles.largeTextBody]}>
              {currentRisk.detail}
            </Text>
            {currentRiskPresentation ? (
              <View
                style={[
                  styles.disasterTypeIndicator,
                  { backgroundColor: currentRiskPresentation.backgroundColor },
                  appState.settings.highContrast && styles.highContrastTypeIndicator,
                ]}
                accessibilityLabel={currentRiskPresentation.label}
              >
                <MaterialCommunityIcons
                  name={currentRiskPresentation.icon}
                  size={18}
                  color={currentRiskPresentation.color}
                  accessible={false}
                />
                <Text
                  style={[
                    styles.disasterTypeText,
                    { color: currentRiskPresentation.color },
                    appState.settings.largeText && styles.largeTextSmall,
                  ]}
                >
                  {currentRiskPresentation.label}
                </Text>
              </View>
            ) : null}
            {locationNotice ? (
              <Text style={[styles.locationNotice, appState.settings.largeText && styles.largeTextSmall]}>
                {locationNotice}
              </Text>
            ) : null}
            <Text style={[styles.emergencyModeAction, appState.settings.largeText && styles.largeTextBody]}>
              Recommended action: {currentRisk.action}
            </Text>
            {warningResourceLink ? (
              <Pressable
                style={styles.emergencyModeResourceLink}
                onPress={openWarningResource}
                accessibilityRole="button"
                accessibilityLabel={warningResourceLink.label}
              >
                <MaterialCommunityIcons name="book-open-variant" size={17} color="#ffffff" accessible={false} />
                <Text
                  style={[styles.emergencyModeResourceLinkText, appState.settings.largeText && styles.largeTextSmall]}
                >
                  {warningResourceLink.label}
                </Text>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            style={[styles.emergencyModePrimary, appState.settings.highContrast && styles.highContrastPrimary]}
            onPress={() => navigation.navigate('EmergencyResponse', { warning: currentRisk.warning })}
            accessibilityRole="button"
            accessibilityLabel="Open emergency response guidance"
          >
            <MaterialCommunityIcons name="shield-alert-outline" size={22} color="#ffffff" accessible={false} />
            <Text style={[styles.emergencyModeButtonText, appState.settings.largeText && styles.largeTextButton]}>
              Open emergency guidance
            </Text>
          </Pressable>
          <Pressable
            style={styles.emergencyModeExit}
            onPress={() => updateAppState({ settings: { emergencyMode: false } }).then(setAppState)}
            accessibilityRole="button"
            accessibilityLabel="Exit emergency mode"
          >
            <Text style={styles.emergencyModeExitText}>Exit emergency mode</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, appState.settings.highContrast && styles.highContrastBackground]}
      edges={['left', 'right', 'top']}
    >
      <View style={styles.headerDock}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={[styles.greeting, appState.settings.largeText && styles.largeTextTitle]}>{timeGreeting}</Text>
            <Text style={[styles.displayName, appState.settings.largeText && styles.largeTextHeading]}>
              {displayName}
            </Text>
          </View>
          <View style={styles.emergencyModeHeaderAction}>
            <Pressable
              style={({ pressed }) => [
                styles.emergencyModeHeaderButton,
                pressed && styles.emergencyModeHeaderButtonPressed,
                appState.settings.highContrast && styles.highContrastHeaderButton,
              ]}
              onPress={() => updateAppState({ settings: { emergencyMode: true } }).then(setAppState)}
              accessibilityRole="button"
              accessibilityLabel="Activate emergency mode"
              accessibilityHint="Open a simplified dashboard with emergency guidance"
            >
              <MaterialCommunityIcons name="alert-octagon-outline" size={21} color="#9a3412" accessible={false} />
            </Pressable>
            <Text style={[styles.emergencyModeHeaderButtonText, appState.settings.largeText && styles.largeTextSmall]}>
              Emergency mode
            </Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {offlineMode ? (
          <View style={[styles.offlineCard, appState.settings.highContrast && styles.highContrastCard]}>
            <View style={styles.offlineHeader}>
              <MaterialCommunityIcons name="wifi-off" size={20} color="#9a3412" accessible={false} />
              <Text style={[styles.offlineTitle, appState.settings.largeText && styles.largeTextHeading]}>
                Offline emergency information
              </Text>
            </View>
            <Text style={[styles.offlineDetail, appState.settings.largeText && styles.largeTextBody]}>
              Live warnings may be unavailable. Your saved guidance, contacts, and checklist are still available on this
              device.
            </Text>
            <View style={styles.offlineActions}>
              <Pressable
                style={styles.offlineActionButton}
                onPress={() => navigation.navigate('EmergencyResponse')}
                accessibilityRole="button"
                accessibilityLabel="Open offline emergency guidance"
              >
                <Text style={styles.offlineActionText}>Emergency guidance</Text>
              </Pressable>
              <Pressable
                style={styles.offlineActionButton}
                onPress={() => navigation.navigate('Checklist')}
                accessibilityRole="button"
                accessibilityLabel="Open saved go-bag checklist"
              >
                <Text style={styles.offlineActionText}>Go-bag checklist</Text>
              </Pressable>
              <Pressable
                style={styles.offlineActionButton}
                onPress={() => navigation.navigate('ProfileSettings', { expandContacts: true })}
                accessibilityRole="button"
                accessibilityLabel="Open saved emergency contacts"
              >
                <Text style={styles.offlineActionText}>Contacts</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <View style={[styles.riskCard, appState.settings.highContrast && styles.highContrastCard]}>
          <View style={styles.riskHeader}>
            <Text style={[styles.riskLabel, appState.settings.largeText && styles.largeTextSmall]}>Current risk</Text>
            <View style={[styles.severityPill, { backgroundColor: currentRisk.accent }]}>
              <MaterialCommunityIcons
                name={getRiskIcon(currentRisk.severity)}
                size={15}
                color="#ffffff"
                accessible={false}
              />
              <Text style={[styles.severityText, appState.settings.largeText && styles.largeTextSmall]}>
                {currentRisk.severity}
              </Text>
            </View>
          </View>
          <Text style={[styles.riskHeadline, appState.settings.largeText && styles.largeTextHeading]}>
            {currentRisk.headline}
          </Text>
          {currentRiskPresentation ? (
            <View
              style={[
                styles.disasterTypeIndicator,
                { backgroundColor: currentRiskPresentation.backgroundColor },
                appState.settings.highContrast && styles.highContrastTypeIndicator,
              ]}
              accessibilityLabel={currentRiskPresentation.label}
            >
              <MaterialCommunityIcons
                name={currentRiskPresentation.icon}
                size={18}
                color={currentRiskPresentation.color}
                accessible={false}
              />
              <Text
                style={[
                  styles.disasterTypeText,
                  { color: currentRiskPresentation.color },
                  appState.settings.largeText && styles.largeTextSmall,
                ]}
              >
                {currentRiskPresentation.label}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.riskDetail, appState.settings.largeText && styles.largeTextBody]}>
            {currentRisk.detail}
          </Text>
          {locationNotice ? (
            <Text style={[styles.locationNotice, appState.settings.largeText && styles.largeTextSmall]}>
              {locationNotice}
            </Text>
          ) : null}
          <Text style={[styles.riskAction, appState.settings.largeText && styles.largeTextBody]}>
            Recommended action: {currentRisk.action}
          </Text>
          {warningResourceLink ? (
            <Pressable
              style={styles.riskResourceLink}
              onPress={openWarningResource}
              accessibilityRole="button"
              accessibilityLabel={warningResourceLink.label}
            >
              <MaterialCommunityIcons name="book-open-variant" size={16} color="#4d7c5a" accessible={false} />
              <Text style={[styles.riskResourceLinkText, appState.settings.largeText && styles.largeTextSmall]}>
                {warningResourceLink.label}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={({ pressed }) => [styles.riskDetailsButton, pressed && styles.riskDetailsButtonPressed]}
            onPress={() => setShowRiskDetails((visible) => !visible)}
            accessibilityRole="button"
            accessibilityLabel={
              showRiskDetails ? 'Hide flood and heat risk details' : 'Show flood and heat risk details'
            }
            accessibilityState={{ expanded: showRiskDetails }}
            accessibilityHint={
              showRiskDetails
                ? 'Double tap to hide additional local risk details'
                : 'Double tap to show additional local risk details'
            }
          >
            <Text style={[styles.riskDetailsButtonText, appState.settings.largeText && styles.largeTextButton]}>
              {showRiskDetails ? 'Hide risk details' : 'Show risk details'}
            </Text>
            <Text style={styles.riskDetailsChevron}>{showRiskDetails ? '−' : '+'}</Text>
          </Pressable>
          {showRiskDetails ? (
            <View style={styles.riskDetailsPanel}>
              <View style={styles.floodRiskRow}>
                <Text style={[styles.floodRiskLabel, appState.settings.largeText && styles.largeTextBody]}>
                  Flood risk
                </Text>
                <View style={[styles.floodRiskPill, { backgroundColor: floodRisk.accent }]}>
                  <Text style={styles.floodRiskPillText}>{floodRisk.label}</Text>
                </View>
              </View>
              {floodRisk.label !== 'Low' ? (
                <Text style={[styles.floodRiskDetail, appState.settings.largeText && styles.largeTextBody]}>
                  {floodRisk.detail}
                </Text>
              ) : null}
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Flood risk: {floodRisk.label}
              </Text>
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Source: NINA/LHP
              </Text>
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Water level:{' '}
                {waterLevel
                  ? `${waterLevel.value} ${waterLevel.unit} at ${waterLevel.stationName}`
                  : waterLevelError || 'Unavailable'}
              </Text>
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Source: Pegelonline
              </Text>
              <View style={styles.floodRiskRow}>
                <Text style={[styles.floodRiskLabel, appState.settings.largeText && styles.largeTextBody]}>
                  Heat risk
                </Text>
                <View style={[styles.floodRiskPill, { backgroundColor: heatRisk.accent }]}>
                  <Text style={styles.floodRiskPillText}>{heatRisk.label}</Text>
                </View>
              </View>
              {heatRisk.label !== 'Low' ? (
                <Text style={[styles.floodRiskDetail, appState.settings.largeText && styles.largeTextBody]}>
                  {heatRisk.detail}
                </Text>
              ) : null}
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Heat risk: {heatRisk.label}
              </Text>
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Source: DWD via NINA
              </Text>
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Current temperature:{' '}
                {temperature
                  ? `${temperature.value.toFixed(1)} ${temperature.unit}`
                  : temperatureError || 'Unavailable'}
              </Text>
              <Text style={[styles.riskDataText, appState.settings.largeText && styles.largeTextSmall]}>
                Feels like:{' '}
                {temperature?.feelsLike != null
                  ? `${temperature.feelsLike.toFixed(1)} ${temperature.unit}`
                  : 'Unavailable'}
              </Text>
              <Text style={[styles.riskDataHint, appState.settings.largeText && styles.largeTextSmall]}>
                Source: Open-Meteo
              </Text>
              <Text style={[styles.riskDataHint, appState.settings.largeText && styles.largeTextSmall]}>
                Heat stress guide: strong heat stress generally begins at perceived temperatures around ≥32 °C; extreme
                heat stress at ≥38 °C.
              </Text>
              <Text style={[styles.riskDataHint, appState.settings.largeText && styles.largeTextSmall]}>
                Source: DWD
              </Text>
            </View>
          ) : null}
        </View>

        <EmergencyResponseCard
          navigation={navigation}
          warning={currentRisk.warning}
          largeText={appState.settings.largeText}
          highContrast={appState.settings.highContrast}
          styles={styles}
        />

        <View style={styles.metricsRow}>
          <View
            style={[
              styles.metricCard,
              styles.metricCardWide,
              styles.badgeNextCard,
              appState.settings.highContrast && styles.highContrastCard,
            ]}
          >
            <View style={styles.badgeNextHeader}>
              <View style={styles.badgeNextIcon}>
                <MaterialCommunityIcons
                  name={getBadgeIcon(nextBadge.category)}
                  size={21}
                  color="#4d7c5a"
                  accessible={false}
                />
              </View>
              <View style={styles.badgeNextCopy}>
                <Text style={[styles.metricLabel, appState.settings.largeText && styles.largeTextSmall]}>
                  Next achievement
                </Text>
                <Text style={[styles.badgeNextName, appState.settings.largeText && styles.largeTextHeading]}>
                  {nextBadge.name}
                </Text>
              </View>
            </View>
            <Text style={styles.metricHelper}>{nextBadge.earned ? 'All badges completed' : nextBadge.description}</Text>
            <View
              style={styles.progressTrack}
              accessible
              accessibilityRole="progressbar"
              accessibilityLabel={`Progress towards ${nextBadge.name}`}
              accessibilityValue={{ min: 0, max: 100, now: nextBadge.progressPercent }}
            >
              <View style={[styles.badgeNextFill, { width: `${nextBadge.progressPercent}%` }]} />
            </View>
            <View style={styles.badgeNextFooter}>
              <Text style={styles.metricHelper}>{nextBadge.progressLabel}</Text>
              <Pressable
                onPress={() => navigation.navigate('ProfileSettings', { expandBadges: true })}
                accessibilityRole="button"
                accessibilityLabel="View all badges"
              >
                <Text style={styles.viewBadgesText}>View all</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.metricCard,
              appState.settings.highContrast && styles.highContrastCard,
              pressed && styles.metricCardPressed,
            ]}
            onPress={() => navigation.navigate('ProfileSettings', { expandAp: true })}
            accessibilityRole="button"
            accessibilityLabel={`Achievement points: ${totalAp} AP, level ${level}. ${progressPercent}% towards level ${level + 1}`}
            accessibilityHint="Double tap to view achievement points progress in your profile"
          >
            <Text style={[styles.metricLabel, appState.settings.largeText && styles.largeTextSmall]}>AP</Text>
            <Text style={[styles.metricValue, appState.settings.largeText && styles.largeTextHeading]}>{totalAp}</Text>
            <Text style={[styles.metricHelper, appState.settings.largeText && styles.largeTextBody]}>
              Level {level}
            </Text>
            <Text style={[styles.metricHelper, appState.settings.largeText && styles.largeTextBody]}>
              {progressPercent}% to level {level + 1}
            </Text>
            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: progressPercent }}
            >
              <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
            </View>
            <Text style={styles.viewBadgesText}>View progress</Text>
          </Pressable>
        </View>

        <View style={[styles.recommendedCard, appState.settings.highContrast && styles.highContrastCard]}>
          <Text style={styles.sectionTitle}>Recommended</Text>
          <Text style={[styles.recommendedTitle, appState.settings.largeText && styles.largeTextHeading]}>
            {recommendedTask.title}
          </Text>
          <Text style={[styles.recommendedDetail, appState.settings.largeText && styles.largeTextBody]}>
            {recommendedTask.detail}
          </Text>
          <Pressable
            style={styles.primaryAction}
            onPress={handleRecommendedAction}
            accessibilityRole="button"
            accessibilityLabel={recommendedTask.action}
          >
            <Text style={styles.primaryActionText}>{recommendedTask.action}</Text>
          </Pressable>
        </View>

        <View style={[styles.taskCard, appState.settings.highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, appState.settings.largeText && styles.largeTextHeading]}>
            Preparedness tasks
          </Text>
          {taskMetadata.map((task) => {
            const complete = appState.tasks[task.key];
            return (
              <Pressable
                key={task.key}
                style={[styles.taskRow, appState.settings.highContrast && styles.highContrastSecondary]}
                onPress={() => handleTaskToggle(task.key)}
                accessibilityRole="checkbox"
                accessibilityLabel={task.title}
                accessibilityHint={task.detail}
                accessibilityState={{ checked: complete }}
              >
                <View style={[styles.taskCheck, complete && styles.taskCheckComplete]}>
                  <Text style={styles.taskCheckText}>{complete ? '✓' : ''}</Text>
                </View>
                <View style={styles.taskCopy}>
                  <Text style={[styles.taskTitle, appState.settings.largeText && styles.largeTextHeading]}>
                    {task.title}
                  </Text>
                  <Text style={[styles.taskDetail, appState.settings.largeText && styles.largeTextBody]}>
                    {task.detail}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <DashboardFooter navigationItems={footerLinks} onNavigate={(route) => navigation.navigate(route)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  emergencyModeSafeArea: { backgroundColor: '#fff7f6' },
  highContrastBackground: { backgroundColor: '#ffffff' },
  highContrastCard: { borderColor: '#171717', borderWidth: 2 },
  highContrastPrimary: { backgroundColor: '#000000' },
  highContrastSecondary: { borderColor: '#000000', borderWidth: 2 },
  ...accessibilityStyles,
  emergencyModeContent: { padding: 18, gap: 14, paddingBottom: 30 },
  emergencyModeHeader: { backgroundColor: '#9a3412', borderRadius: 10, padding: 20, gap: 8 },
  emergencyModeEyebrow: { color: '#ffe4df', fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  emergencyModeTitle: { color: '#ffffff', fontSize: 28, lineHeight: 34, fontWeight: '800' },
  emergencyModeDetail: { color: '#fff7f6', fontSize: 15, lineHeight: 21 },
  emergencyModeStatusDetail: { color: '#292929', fontSize: 15, lineHeight: 21 },
  emergencyModeStatus: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0aaa5',
    padding: 16,
    gap: 9,
  },
  emergencyModeStatusRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  emergencyModeStatusTitle: { flex: 1, color: '#171717', fontSize: 18, lineHeight: 24, fontWeight: '800' },
  emergencyModeAction: { color: '#4d7c5a', fontSize: 14, lineHeight: 20, fontWeight: '700' },
  locationNotice: {
    color: '#8a5a00',
    backgroundColor: '#fff8e7',
    borderRadius: 6,
    padding: 8,
    fontSize: 12,
    lineHeight: 17,
  },
  emergencyModeResourceLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    alignSelf: 'flex-start',
    paddingVertical: 3,
  },
  emergencyModeResourceLinkText: { color: '#4d7c5a', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
  disasterTypeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 7,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  highContrastTypeIndicator: { borderWidth: 2, borderColor: '#171717' },
  disasterTypeText: { fontSize: 13, fontWeight: '800' },
  emergencyModePrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9a3412',
    borderRadius: 9,
    paddingVertical: 17,
  },
  emergencyModeButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  emergencyModeSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#171717',
    borderRadius: 9,
    paddingVertical: 16,
  },
  emergencyModeSecondaryText: { color: '#171717', fontSize: 15, fontWeight: '800' },
  emergencyModeExit: { alignItems: 'center', paddingVertical: 10 },
  emergencyModeExitText: { color: '#5f6b63', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
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
  scrollView: {
    flex: 1,
  },
  headerDock: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 170,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerCopy: {
    flexShrink: 1,
    flexGrow: 1,
    maxWidth: '64%',
  },
  emergencyModeHeaderButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7f6',
    borderWidth: 1,
    borderColor: '#e0aaa5',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: '#7c2d12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  emergencyModeHeaderAction: { alignItems: 'center', minWidth: 64, maxWidth: '36%' },
  emergencyModeHeaderButtonPressed: { opacity: 0.75 },
  highContrastHeaderButton: { backgroundColor: '#000000', borderWidth: 2, borderColor: '#171717' },
  emergencyModeHeaderButtonText: {
    color: '#9a3412',
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.1,
    marginTop: 3,
  },
  greeting: {
    color: '#171717',
    fontSize: 26,
    fontWeight: '700',
  },
  displayName: {
    marginTop: 2,
    color: '#171717',
    fontSize: 18,
    fontWeight: '600',
  },
  subheading: {
    marginTop: 4,
    color: '#6b7280',
    fontSize: 13,
  },
  riskCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 18,
    gap: 8,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riskLabel: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  severityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  severityText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  riskHeadline: {
    color: '#171717',
    fontSize: 20,
    fontWeight: '700',
  },
  riskDetail: {
    color: '#292929',
    fontSize: 14,
    lineHeight: 20,
  },
  offlineCard: {
    backgroundColor: '#fff8e7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8c778',
    padding: 15,
    gap: 9,
  },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  offlineTitle: { color: '#171717', fontSize: 15, fontWeight: '800' },
  offlineDetail: { color: '#525252', fontSize: 13, lineHeight: 19 },
  offlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  offlineActionButton: {
    borderWidth: 1,
    borderColor: '#9a3412',
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
  },
  offlineActionText: { color: '#9a3412', fontSize: 12, fontWeight: '800' },
  riskAction: {
    color: '#4d7c5a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  riskResourceLink: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingVertical: 3 },
  riskResourceLinkText: { color: '#4d7c5a', fontSize: 13, fontWeight: '800', textDecorationLine: 'underline' },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff7f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0aaa5',
    padding: 14,
  },
  emergencyCardPressed: { opacity: 0.8 },
  emergencyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#9a3412',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCopy: { flex: 1, gap: 3 },
  emergencyTitle: { color: '#171717', fontSize: 15, fontWeight: '800' },
  emergencyDetail: { color: '#525252', fontSize: 12, lineHeight: 17 },
  floodRiskRow: {
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  floodRiskLabel: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  floodRiskPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  floodRiskPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  floodRiskDetail: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  riskDetailsButton: {
    marginTop: 8,
    minHeight: 42,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  riskDetailsButtonPressed: {
    opacity: 0.65,
  },
  riskDetailsButtonText: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '800',
  },
  riskDetailsChevron: {
    color: '#5f6b63',
    fontSize: 22,
    lineHeight: 22,
    fontWeight: '400',
  },
  riskDetailsPanel: {
    gap: 4,
  },
  riskDataText: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },
  riskDataHint: { color: '#6b7280', fontSize: 11, lineHeight: 16 },
  inlineLink: {
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  inlineLinkText: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '700',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 8,
  },
  metricCardWide: {
    flex: 1.5,
  },
  badgeNextCard: {
    gap: 9,
  },
  metricCardPressed: {
    opacity: 0.8,
  },
  badgeNextHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgeNextIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeNextCopy: {
    flex: 1,
    gap: 3,
  },
  badgeNextName: {
    color: '#171717',
    fontSize: 17,
    lineHeight: 21,
    fontWeight: '700',
  },
  badgeNextFill: {
    height: '100%',
    backgroundColor: '#4d7c5a',
  },
  badgeNextFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  viewBadgesText: {
    color: '#4d7c5a',
    fontSize: 12,
    fontWeight: '800',
  },
  metricLabel: {
    color: '#6b7280',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: '#171717',
    fontSize: 28,
    fontWeight: '700',
  },
  metricHelper: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
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
  badgeCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 8,
  },
  badgeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionTitle: {
    color: '#171717',
    fontSize: 16,
    fontWeight: '700',
  },
  badgeLevel: {
    color: '#5f6b63',
    fontSize: 13,
    fontWeight: '800',
  },
  badgeDetail: {
    color: '#525252',
    fontSize: 14,
  },
  badgeFill: {
    height: '100%',
    backgroundColor: '#7c8b80',
  },
  recommendedCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 8,
  },
  recommendedTitle: {
    color: '#171717',
    fontSize: 21,
    fontWeight: '700',
  },
  recommendedDetail: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryAction: {
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  primaryActionText: {
    color: '#fafaf9',
    fontSize: 14,
    fontWeight: '700',
  },
  taskCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 14,
  },
  taskRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  taskCheck: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#c4c4c4',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  taskCheckComplete: {
    backgroundColor: '#171717',
    borderColor: '#171717',
  },
  taskCheckText: {
    color: '#ffffff',
    fontWeight: '900',
  },
  taskCopy: {
    flex: 1,
    gap: 3,
  },
  taskTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  taskDetail: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
});

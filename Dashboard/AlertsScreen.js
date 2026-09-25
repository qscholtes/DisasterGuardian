import React, { useCallback, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';

import { loadAppState, loadPreparednessProgress, updateAppState } from '../storage/appState';
import { notifyNewWarnings, notifySimulatedWarning } from '../utils/emergencyNotifications';
import { emptyLocalConditions, loadLocalConditions } from '../utils/localConditions';
import useLatestRequest from '../hooks/useLatestRequest';
import { accessibilityStyles } from '../styles/accessibilityStyles';
import { commonStyles } from '../styles/Styles';

import RiskSummaryCard, { getStatusIcon } from './RiskSummaryCard';
import { formatActionDate } from './alertPresentation';

function getWarningTimestampLabel(disaster, error) {
  if (error) return `Cached data · ${error}`;
  if (disaster.updated) return `Issued ${formatActionDate(disaster.updated)}`;
  return 'Current warning';
}

function DisasterStatus({ hasLocation, warnings, loading, error, lastUpdated, largeText, highContrast }) {
  if (!hasLocation) {
    return (
      <View style={[styles.emptyCard, highContrast && accessibilityStyles.highContrastCard]}>
        <MaterialCommunityIcons name="map-marker-alert-outline" size={18} color="#b7791f" accessible={false} />
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, largeText && accessibilityStyles.largeTextHeading]}>
            Location setup pending
          </Text>
          <Text style={[styles.emptyDetail, largeText && accessibilityStyles.largeTextBody]}>
            Enable location permissions to check warnings for your current area.
          </Text>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.emptyCard, highContrast && accessibilityStyles.highContrastCard]}>
        <MaterialCommunityIcons name="progress-clock" size={18} color="#b7791f" accessible={false} />
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, largeText && accessibilityStyles.largeTextHeading]}>
            Checking local warnings...
          </Text>
          <Text style={[styles.emptyDetail, largeText && accessibilityStyles.largeTextBody]}>
            Reading the latest available NINA emergency feed.
          </Text>
        </View>
      </View>
    );
  }

  if (error && !warnings.length) {
    return (
      <View style={[styles.emptyCard, highContrast && accessibilityStyles.highContrastCard]}>
        <MaterialCommunityIcons name="help-circle-outline" size={18} color="#b7791f" accessible={false} />
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, largeText && accessibilityStyles.largeTextHeading]}>
            Warnings unavailable
          </Text>
          <Text style={[styles.emptyDetail, largeText && accessibilityStyles.largeTextBody]}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!warnings.length) {
    return (
      <View style={[styles.emptyCard, highContrast && accessibilityStyles.highContrastCard]}>
        <MaterialCommunityIcons name="check-circle-outline" size={18} color="#4d7c5a" accessible={false} />
        <View style={styles.emptyCopy}>
          <Text style={[styles.emptyTitle, largeText && accessibilityStyles.largeTextHeading]}>
            No active disasters
          </Text>
          <Text style={[styles.emptyDetail, largeText && accessibilityStyles.largeTextBody]}>
            No current warnings were found for your location.
          </Text>
          {lastUpdated ? (
            <Text style={styles.updatedText}>
              Checked {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          ) : null}
        </View>
      </View>
    );
  }

  return warnings.map((disaster) => (
    <View key={disaster.id} style={[styles.disasterCard, highContrast && accessibilityStyles.highContrastCard]}>
      <View style={styles.disasterHeader}>
        <Text style={styles.disasterType}>{disaster.type}</Text>
        <View style={styles.severityGroup}>
          <MaterialCommunityIcons
            name={getStatusIcon(disaster.severity)}
            size={15}
            color="#9a3412"
            accessible={false}
          />
          <Text style={styles.severity}>{disaster.severity}</Text>
        </View>
      </View>
      <Text style={[styles.disasterTitle, largeText && accessibilityStyles.largeTextHeading]}>{disaster.title}</Text>
      <Text style={[styles.disasterDetail, largeText && accessibilityStyles.largeTextBody]}>{disaster.detail}</Text>
      <Text style={styles.disasterTime}>{getWarningTimestampLabel(disaster, error)}</Text>
    </View>
  ));
}

export default function AlertsScreen({ navigation }) {
  const [appState, setAppState] = useState(null);
  const [progress, setProgress] = useState(null);
  const [conditions, setConditions] = useState(emptyLocalConditions);
  const [loadingWarnings, setLoadingWarnings] = useState(false);
  const [simulationEnabled, setSimulationEnabled] = useState(false);
  const simulationNotificationSentRef = useRef(false);
  const { begin: beginRefresh, cancel: cancelRefresh } = useLatestRequest();
  const {
    warnings,
    floodWarnings,
    floodError,
    heatWarnings,
    heatError,
    waterLevel,
    waterLevelError,
    temperature,
    temperatureError,
    location,
    warningError,
    lastUpdated,
    locationNotice,
  } = conditions;

  // Refresh local conditions and send notifications for newly discovered warnings.
  // Results are applied only if this is still the most recent refresh.
  const refreshAlerts = useCallback(
    async (simulationOverride = simulationEnabled) => {
      const isCurrent = beginRefresh();
      setLoadingWarnings(true);
      try {
        const [refreshedAppState, refreshedProgress] = await Promise.all([loadAppState(), loadPreparednessProgress()]);
        if (!isCurrent()) return;
        setAppState(refreshedAppState);
        setProgress(refreshedProgress);

        const nextConditions = await loadLocalConditions(
          {
            ...refreshedAppState.settings,
            simulatedEmergency: simulationOverride,
          },
          isCurrent,
        );
        if (!isCurrent()) return;
        setConditions(nextConditions);

        if (!refreshedAppState.settings.emergencyAlerts || !nextConditions.location) return;
        let notificationFailed = false;
        if (simulationOverride && !simulationNotificationSentRef.current) {
          const simulatedWarning = nextConditions.warnings.find((warning) => warning.id === 'dev-local-emergency-001');
          try {
            if (simulatedWarning && (await notifySimulatedWarning(simulatedWarning)) && isCurrent()) {
              simulationNotificationSentRef.current = true;
            }
          } catch {
            notificationFailed = true;
          }
        }
        if (!isCurrent()) return;
        try {
          await notifyNewWarnings(nextConditions.warnings);
        } catch {
          notificationFailed = true;
        }
        if (notificationFailed && isCurrent()) {
          setConditions((current) => ({
            ...current,
            locationNotice: [
              current.locationNotice,
              'Emergency notifications could not be delivered. Warnings remain available here.',
            ]
              .filter(Boolean)
              .join(' '),
          }));
        }
      } catch {
        if (isCurrent()) {
          setConditions(emptyLocalConditions('Check your connection and try again.'));
        }
      } finally {
        if (isCurrent()) setLoadingWarnings(false);
      }
    },
    [simulationEnabled, beginRefresh],
  );

  const saveSimulationSetting = (enabled) => {
    updateAppState({ settings: { simulatedEmergency: enabled } }).catch(() => {
      Alert.alert(
        'Setting not saved',
        'The simulation setting could not be saved. Your selection applies to this screen until you leave.',
      );
    });
  };

  useFocusEffect(
    useCallback(() => {
      refreshAlerts();
      return cancelRefresh;
    }, [refreshAlerts, cancelRefresh]),
  );

  useFocusEffect(
    useCallback(() => {
      const refreshTimer = setInterval(() => refreshAlerts(), 5 * 60 * 1000);
      return () => clearInterval(refreshTimer);
    }, [refreshAlerts]),
  );

  if (!appState || !progress) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading alerts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const recentActions = progress.recentApActions || [];
  const largeText = Boolean(appState.settings.largeText);
  const highContrast = Boolean(appState.settings.highContrast);

  return (
    <SafeAreaView
      style={[styles.safeArea, highContrast && accessibilityStyles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.eyebrow, largeText && accessibilityStyles.largeTextSmall]}>Alerts</Text>
          <Text style={[styles.title, largeText && accessibilityStyles.largeTextTitle]}>
            Know what is happening nearby
          </Text>
          <Text style={[styles.body, largeText && accessibilityStyles.largeTextBody]}>
            Check local warnings, understand the current risk, and see which preparedness actions you have completed.
          </Text>
        </View>

        {!appState.permissions.location || warningError ? (
          <View style={[styles.offlineCard, highContrast && accessibilityStyles.highContrastCard]}>
            <View style={styles.offlineHeader}>
              <MaterialCommunityIcons name="wifi-off" size={20} color="#9a3412" accessible={false} />
              <Text style={[styles.offlineTitle, largeText && accessibilityStyles.largeTextHeading]}>
                Offline or stale warning data
              </Text>
            </View>
            <Text style={[styles.offlineDetail, largeText && accessibilityStyles.largeTextBody]}>
              Live warnings may be unavailable. Saved emergency guidance and local preparedness data remain available on
              this device.
            </Text>
            <Text style={[styles.offlineDetail, largeText && accessibilityStyles.largeTextBody]}>
              Always follow official emergency instructions.
            </Text>
            <Pressable
              style={styles.offlineActionButton}
              onPress={() => navigation.navigate('EmergencyResponse')}
              accessibilityRole="button"
              accessibilityLabel="Open offline emergency guidance"
            >
              <Text style={[styles.offlineActionText, largeText && accessibilityStyles.largeTextButton]}>
                Open emergency guidance
              </Text>
            </Pressable>
          </View>
        ) : null}

        <View style={[styles.sectionCard, highContrast && accessibilityStyles.highContrastCard]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                Active disasters
              </Text>
              <Text style={[styles.sectionDetail, largeText && accessibilityStyles.largeTextSmall]}>
                {location ? 'Based on your current location' : 'Local emergency status'}
              </Text>
              {locationNotice ? (
                <Text style={[styles.locationNotice, largeText && accessibilityStyles.largeTextSmall]}>
                  {locationNotice}
                </Text>
              ) : null}
            </View>
            <Text style={styles.livePill}>LOCAL</Text>
          </View>
          <DisasterStatus
            hasLocation={appState.permissions.location}
            warnings={warnings}
            loading={loadingWarnings}
            error={warningError}
            lastUpdated={lastUpdated}
            largeText={largeText}
            highContrast={highContrast}
          />
          <Pressable
            style={styles.refreshButton}
            onPress={() => {
              setSimulationEnabled(false);
              saveSimulationSetting(false);
              refreshAlerts(false);
            }}
            disabled={loadingWarnings}
          >
            <Text style={[styles.refreshButtonText, largeText && accessibilityStyles.largeTextButton]}>
              {loadingWarnings ? 'Checking...' : 'Refresh local warnings'}
            </Text>
          </Pressable>
          {__DEV__ ? (
            <Pressable
              style={[styles.simulationButton, simulationEnabled && styles.simulationButtonActive]}
              onPress={() => {
                const nextSimulationEnabled = !simulationEnabled;
                setSimulationEnabled(nextSimulationEnabled);
                saveSimulationSetting(nextSimulationEnabled);
                if (!nextSimulationEnabled) {
                  simulationNotificationSentRef.current = false;
                }
                refreshAlerts(nextSimulationEnabled);
              }}
            >
              <Text style={[styles.simulationButtonText, simulationEnabled && styles.simulationButtonTextActive]}>
                {simulationEnabled ? 'Disable simulated emergency' : 'Simulate local emergency'}
              </Text>
            </Pressable>
          ) : null}
        </View>

        <RiskSummaryCard
          riskType="flood"
          hasLocation={appState.permissions.location}
          warnings={floodWarnings}
          loading={loadingWarnings}
          error={floodError}
          waterLevel={waterLevel}
          waterLevelError={waterLevelError}
          largeText={largeText}
          highContrast={highContrast}
        />

        <RiskSummaryCard
          riskType="heat"
          hasLocation={appState.permissions.location}
          warnings={heatWarnings}
          loading={loadingWarnings}
          error={heatError}
          temperature={temperature}
          temperatureError={temperatureError}
          largeText={largeText}
          highContrast={highContrast}
        />

        <View style={[styles.sectionCard, highContrast && accessibilityStyles.highContrastCard]}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionCopy}>
              <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
                Recent AP activity
              </Text>
              <Text style={[styles.sectionDetail, largeText && accessibilityStyles.largeTextSmall]}>
                Your latest preparedness progress
              </Text>
            </View>
            <Text style={styles.apHeader}>AP</Text>
          </View>

          {recentActions.length ? (
            recentActions.map((action) => (
              <View key={action.id} style={styles.actionRow}>
                <View style={styles.actionIcon}>
                  <Text style={styles.actionIconText}>+</Text>
                </View>
                <View style={styles.actionCopy}>
                  <Text style={[styles.actionTitle, largeText && accessibilityStyles.largeTextBody]}>
                    {action.title}
                  </Text>
                  <Text style={styles.actionDate}>{formatActionDate(action.createdAt)}</Text>
                </View>
                <Text style={styles.actionAp}>+{action.ap} AP</Text>
              </View>
            ))
          ) : (
            <View style={styles.activityEmpty}>
              <Text style={styles.emptyTitle}>No AP activity yet</Text>
              <Text style={styles.emptyDetail}>Complete a quiz or preparedness challenge to see it here.</Text>
            </View>
          )}
        </View>

        <Pressable style={styles.button} onPress={() => navigation.navigate('HomeDashboard')}>
          <Text style={[commonStyles.primaryButtonText, largeText && accessibilityStyles.largeTextButton]}>
            Back to dashboard
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#525252', fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 18, paddingBottom: 28, gap: 14 },
  offlineCard: {
    backgroundColor: '#fff8e7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8c778',
    padding: 15,
    gap: 8,
  },
  offlineHeader: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  offlineTitle: { color: '#171717', fontSize: 15, fontWeight: '800' },
  offlineDetail: { color: '#525252', fontSize: 13, lineHeight: 19 },
  offlineActionButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#9a3412',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: '#ffffff',
  },
  offlineActionText: { color: '#9a3412', fontSize: 12, fontWeight: '800' },
  locationNotice: { color: '#8a5a00', fontSize: 12, lineHeight: 17, marginTop: 3 },
  eyebrow: { color: '#5f6b63', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#171717', fontSize: 24, fontWeight: '700' },
  body: { color: '#525252', fontSize: 14, lineHeight: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionCopy: { flex: 1, gap: 3 },
  livePill: {
    color: '#5f6b63',
    backgroundColor: '#e9eee9',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    fontSize: 11,
    fontWeight: '800',
  },
  apHeader: { color: '#5f6b63', fontSize: 14, fontWeight: '800' },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e1',
    backgroundColor: '#ffffff',
    padding: 14,
  },
  emptyCopy: { flex: 1, gap: 4 },
  emptyTitle: { color: '#292929', fontSize: 14, fontWeight: '700' },
  emptyDetail: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  disasterCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7aa',
    padding: 14,
    gap: 6,
  },
  disasterHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  severityGroup: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  disasterType: { color: '#9a3412', fontSize: 11, fontWeight: '800', textTransform: 'uppercase' },
  severity: { color: '#9a3412', fontSize: 11, fontWeight: '800' },
  disasterTitle: { color: '#171717', fontSize: 17, fontWeight: '700' },
  disasterDetail: { color: '#525252', fontSize: 13, lineHeight: 18 },
  disasterTime: { color: '#9a3412', fontSize: 12, fontWeight: '600' },
  updatedText: { color: '#737373', fontSize: 12, marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
  },
  actionIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e9eee9',
  },
  actionIconText: { color: '#4d7c5a', fontSize: 18, fontWeight: '800' },
  actionCopy: { flex: 1, gap: 2 },
  actionTitle: { color: '#292929', fontSize: 14, fontWeight: '700' },
  actionDate: { color: '#737373', fontSize: 12 },
  actionAp: { color: '#5f6b63', fontSize: 13, fontWeight: '800' },
  activityEmpty: { borderTopWidth: 1, borderTopColor: '#ecebe7', paddingTop: 12, gap: 4 },
  refreshButton: {
    borderWidth: 1,
    borderColor: '#cfcfc7',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  refreshButtonText: { color: '#171717', fontSize: 13, fontWeight: '700' },
  simulationButton: {
    borderWidth: 1,
    borderColor: '#e0aaa5',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#fff7f6',
  },
  simulationButtonActive: { backgroundColor: '#b4534b', borderColor: '#b4534b' },
  simulationButtonText: { color: '#9a3412', fontSize: 13, fontWeight: '700' },
  simulationButtonTextActive: { color: '#ffffff' },
  button: { backgroundColor: '#171717', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  ...accessibilityStyles,
});

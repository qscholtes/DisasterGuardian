import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { accessibilityStyles } from '../styles/accessibilityStyles';
import { getFloodRiskStatus, getHeatRiskStatus } from '../utils/ninaWarnings';

export function getStatusIcon(label) {
  if (['Severe', 'Extreme', 'High', 'Active'].includes(label)) return 'alert-circle-outline';
  if (['Unavailable', 'Unknown', 'Checking...'].includes(label)) return 'help-circle-outline';
  return 'check-circle-outline';
}

function getRiskAction(label) {
  if (['Severe', 'Extreme', 'High'].includes(label))
    return 'Follow official instructions and move away from immediate danger.';
  if (label === 'Active') return 'Review the warning details and follow local authority guidance.';
  if (label === 'Unavailable' || label === 'Unknown')
    return 'Try refreshing later and check official local emergency sources.';
  return 'Keep your preparedness tasks and emergency contacts up to date.';
}

export default function RiskSummaryCard({
  riskType,
  hasLocation,
  warnings,
  loading,
  error,
  waterLevel,
  waterLevelError,
  temperature,
  temperatureError,
  largeText,
  highContrast,
}) {
  const isFlood = riskType === 'flood';
  const risk = isFlood
    ? getFloodRiskStatus(warnings, { hasLocation, error })
    : getHeatRiskStatus(warnings, { hasLocation, error });
  const displayedRisk =
    loading && hasLocation
      ? {
          label: 'Checking...',
          detail: `Reading the latest ${isFlood ? 'flood' : 'heat'} warnings for your current location.`,
          accent: '#f59e0b',
        }
      : risk;
  const title = isFlood ? 'Flood risk' : 'Heat risk';

  return (
    <View style={[styles.riskCard, highContrast && accessibilityStyles.highContrastCard]}>
      <View style={styles.riskHeader}>
        <View style={styles.sectionCopy}>
          <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>{title}</Text>
          <Text style={[styles.sectionDetail, largeText && accessibilityStyles.largeTextSmall]}>
            Based on your current location
          </Text>
        </View>
        <View style={[styles.riskPill, { backgroundColor: displayedRisk.accent }]}>
          <MaterialCommunityIcons
            name={getStatusIcon(displayedRisk.label)}
            size={15}
            color="#ffffff"
            accessible={false}
          />
          <Text style={styles.riskPillText}>{displayedRisk.label}</Text>
        </View>
      </View>
      {displayedRisk.label !== 'Low' ? (
        <Text style={[styles.riskDetail, largeText && accessibilityStyles.largeTextBody]}>{displayedRisk.detail}</Text>
      ) : null}
      <Text style={styles.riskData}>
        {title}: {displayedRisk.label}
      </Text>
      <Text style={styles.riskData}>{isFlood ? 'Source: NINA/LHP' : 'Source: DWD via NINA'}</Text>
      <Text style={[styles.riskAction, largeText && accessibilityStyles.largeTextBody]}>
        Recommended action: {getRiskAction(displayedRisk.label)}
      </Text>
      {isFlood ? (
        <>
          <Text style={styles.riskData}>
            Water level:{' '}
            {waterLevel
              ? `${waterLevel.value} ${waterLevel.unit} at ${waterLevel.stationName}`
              : waterLevelError || 'Unavailable'}
          </Text>
          <Text style={styles.riskData}>Source: Pegelonline</Text>
        </>
      ) : (
        <>
          <Text style={styles.riskData}>
            Current temperature:{' '}
            {temperature ? `${temperature.value.toFixed(1)} ${temperature.unit}` : temperatureError || 'Unavailable'}
          </Text>
          <Text style={styles.riskData}>
            Feels like:{' '}
            {temperature?.feelsLike != null ? `${temperature.feelsLike.toFixed(1)} ${temperature.unit}` : 'Unavailable'}
          </Text>
          <Text style={styles.riskData}>Source: Open-Meteo</Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  riskCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 10,
  },
  riskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  sectionCopy: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '700',
  },
  sectionDetail: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 3,
  },
  riskPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  riskPillText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  riskDetail: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  riskData: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },
  riskAction: {
    color: '#4d7c5a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
});

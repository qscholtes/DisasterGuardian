import React, { useCallback, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/Styles';
import { loadAppState, loadPersonalProfile } from '../storage/appState';
import { getResourceLinkForDisaster } from '../ResourceHub/disasterContent';
import { getDisasterLabel, getDisasterPresentation } from '../utils/disasterPresentation';

const RESPONSE_STEPS = {
  flood: [
    'Move to higher ground if instructed and take your phone, medicine, and emergency kit if it is safe.',
    'Do not walk or drive through floodwater. Use official routes only.',
    'Stay away from damaged buildings, fallen power lines, and contaminated water.',
  ],
  heat: [
    'Move somewhere cool, drink water regularly, and avoid strenuous activity during the hottest hours.',
    'Check on children, older people, neighbours, and anyone who may need extra help.',
    'Never leave children, vulnerable people, or animals alone in a parked car.',
  ],
  wildfire: [
    'Follow evacuation instructions immediately and leave using the recommended route.',
    'Keep windows and doors closed if there is smoke, and take your emergency kit if it is safe.',
    'Do not return until emergency services say the area is safe.',
  ],
  storm: [
    'Stay indoors and keep away from windows, trees, open ground, and damaged areas.',
    'Do not touch fallen cables or enter areas blocked by emergency services.',
    'Follow official updates before travelling or clearing damage.',
  ],
  general: [
    'Move away from danger and follow instructions from emergency services.',
    'Take your emergency kit, phone, medicine, and important documents if it is safe.',
    'Check on children, older people, neighbours, and anyone who needs extra help.',
  ],
};

function formatWarningDate(dateValue) {
  if (!dateValue) return 'Unknown';
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? 'Unknown'
    : date.toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function getFreshnessLabel(warning) {
  if (warning?.isCached) return `Cached warning · issued ${formatWarningDate(warning.updated)}`;
  return `Live warning · issued ${formatWarningDate(warning?.updated)}`;
}

export default function EmergencyResponseScreen({ navigation, route }) {
  const [contacts, setContacts] = useState([]);
  const [appState, setAppState] = useState(null);
  const warning = route.params?.warning;
  const resourceLink = getResourceLinkForDisaster(warning?.disasterType);
  const disasterPresentation = getDisasterPresentation(warning?.disasterType);
  const steps = RESPONSE_STEPS[warning?.disasterType] || RESPONSE_STEPS.general;

  const callEmergencyServices = () => Linking.openURL('tel:112');
  const openMap = () => navigation.navigate('EmergencyServices');

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadPersonalProfile(), loadAppState()])
        .then(([profile, storedAppState]) => {
          if (active) {
            setContacts(profile.contacts || []);
            setAppState(storedAppState);
          }
        })
        .catch(() => {
          if (active) {
            setContacts([]);
            setAppState(null);
          }
        });
      return () => {
        active = false;
      };
    }, []),
  );

  const largeText = Boolean(appState?.settings.largeText);
  const highContrast = Boolean(appState?.settings.highContrast);

  return (
    <SafeAreaView
      style={[styles.safeArea, highContrast && styles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, highContrast && styles.highContrastCard]}>
          <View style={[styles.heroIcon, { backgroundColor: disasterPresentation.color }]}>
            <MaterialCommunityIcons name={disasterPresentation.icon} size={28} color="#ffffff" accessible={false} />
          </View>
          <Text style={styles.eyebrow}>Emergency response</Text>
          {warning ? (
            <View
              style={[
                styles.disasterTypeBanner,
                { backgroundColor: disasterPresentation.backgroundColor },
                highContrast && styles.highContrastTypeBanner,
              ]}
              accessibilityLabel={disasterPresentation.label}
            >
              <MaterialCommunityIcons
                name={disasterPresentation.icon}
                size={20}
                color={disasterPresentation.color}
                accessible={false}
              />
              <Text
                style={[
                  styles.disasterTypeBannerText,
                  { color: disasterPresentation.color },
                  largeText && styles.largeBody,
                ]}
              >
                {disasterPresentation.label}
              </Text>
            </View>
          ) : null}
          <Text style={[styles.title, largeText && styles.largeTitle]}>Stay calm. Take action.</Text>
          <Text style={[styles.body, largeText && styles.largeBody]}>
            {warning?.title || 'Use these steps to respond safely during an emergency.'}
          </Text>
          <Text style={styles.disclaimer}>This guidance does not replace instructions from emergency services.</Text>
          <Text style={styles.offlineNote}>
            Core safety steps on this screen are available offline. Live warning details may not be.
          </Text>
        </View>

        {warning ? (
          <View style={[styles.sectionCard, highContrast && styles.highContrastCard]}>
            <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>Warning details</Text>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Type</Text>
              <Text style={styles.metadataValue}>{getDisasterLabel(warning.disasterType)}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Severity</Text>
              <Text style={styles.metadataValue}>{warning.severity || 'Unknown'}</Text>
            </View>
            <View style={styles.metadataRow}>
              <Text style={styles.metadataLabel}>Status</Text>
              <Text style={styles.metadataValue}>{warning.status || 'Alert'}</Text>
            </View>
            <Text style={[styles.freshnessText, largeText && styles.largeBody]}>{getFreshnessLabel(warning)}</Text>
            {warning.expires ? (
              <Text style={styles.freshnessText}>Valid until {formatWarningDate(warning.expires)}</Text>
            ) : null}
            <Text style={styles.sourceText}>Source: {warning.source || 'NINA'}</Text>
          </View>
        ) : null}

        {warning?.instruction ? (
          <View style={[styles.officialCard, highContrast && styles.highContrastCard]}>
            <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>Official instructions</Text>
            <Text style={[styles.officialText, largeText && styles.largeBody]}>{warning.instruction}</Text>
          </View>
        ) : null}

        <View style={[styles.actionCard, highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>Need immediate help?</Text>
          <Text style={[styles.sectionDetail, largeText && styles.largeBody]}>
            Call emergency services if someone is in danger or needs urgent medical help.
          </Text>
          <Pressable
            style={[styles.emergencyButton, highContrast && styles.highContrastButton]}
            onPress={callEmergencyServices}
            accessibilityRole="button"
            accessibilityLabel="Call emergency services on 112"
          >
            <MaterialCommunityIcons name="phone" size={20} color="#ffffff" accessible={false} />
            <Text style={styles.emergencyButtonText}>Call emergency services · 112</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>Your emergency contacts</Text>
          <Text style={[styles.sectionDetail, largeText && styles.largeBody]}>
            Contact someone you trust for support or to let them know you are safe.
          </Text>
          {contacts.length ? (
            contacts.map((contact) => (
              <View key={contact.id} style={styles.contactRow}>
                <View style={styles.contactIcon}>
                  <MaterialCommunityIcons name="account-outline" size={20} color="#4d7c5a" accessible={false} />
                </View>
                <View style={styles.contactCopy}>
                  <Text style={styles.contactName}>{contact.name}</Text>
                  <Text style={styles.contactPhone}>{contact.phone}</Text>
                </View>
                <Pressable
                  style={styles.contactCallButton}
                  onPress={() => Linking.openURL(`tel:${contact.phone}`).catch(() => {})}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${contact.name}`}
                >
                  <MaterialCommunityIcons name="phone" size={17} color="#ffffff" accessible={false} />
                  <Text style={styles.contactCallText}>Call</Text>
                </Pressable>
              </View>
            ))
          ) : (
            <View style={styles.emptyContactCard}>
              <Text style={styles.emptyContactText}>No personal contacts added yet.</Text>
              <Pressable
                onPress={() => navigation.navigate('ProfileSettings', { expandContacts: true })}
                accessibilityRole="button"
                accessibilityLabel="Add an emergency contact"
              >
                <Text style={styles.linkButtonText}>Add contacts in Profile</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={[styles.sectionCard, highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>What to do now</Text>
          {steps.map((step, index) => (
            <View key={step} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{index + 1}</Text>
              </View>
              <Text style={[styles.stepText, largeText && styles.largeBody]}>{step}</Text>
            </View>
          ))}
        </View>

        {resourceLink ? (
          <View style={[styles.actionCard, highContrast && styles.highContrastCard]}>
            <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>
              More {warning.disasterType} guidance
            </Text>
            <Text style={[styles.sectionDetail, largeText && styles.largeBody]}>
              Open the Resource Hub for detailed advice about what to do during this type of emergency.
            </Text>
            <Pressable
              style={[styles.secondaryButton, highContrast && styles.highContrastSecondary]}
              onPress={() => navigation.navigate('DisasterTopic', resourceLink)}
              accessibilityRole="button"
              accessibilityLabel={resourceLink.label}
            >
              <MaterialCommunityIcons name="book-open-variant" size={19} color="#171717" accessible={false} />
              <Text style={styles.secondaryButtonText}>{resourceLink.label}</Text>
            </Pressable>
            {warning.officialUrl ? (
              <Pressable
                style={styles.linkButton}
                onPress={() => Linking.openURL(warning.officialUrl).catch(() => {})}
                accessibilityRole="link"
                accessibilityLabel="View the official warning source"
              >
                <Text style={styles.linkButtonText}>View official warning</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={[styles.actionCard, highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, largeText && styles.largeHeading]}>Find nearby support</Text>
          <Text style={[styles.sectionDetail, largeText && styles.largeBody]}>
            Browse nearby hospitals, police stations, fire stations, and mapped shelters.
          </Text>
          <Pressable
            style={[styles.secondaryButton, highContrast && styles.highContrastSecondary]}
            onPress={openMap}
            accessibilityRole="button"
            accessibilityLabel="Find nearby emergency support"
          >
            <MaterialCommunityIcons name="map-marker-radius-outline" size={19} color="#171717" />
            <Text style={styles.secondaryButtonText}>Find nearby support</Text>
          </Pressable>
          <Pressable
            style={styles.linkButton}
            onPress={() => navigation.navigate('EmergencyServices')}
            accessibilityRole="button"
            accessibilityLabel="Open resource hub contacts"
          >
            <Text style={styles.linkButtonText}>Open resource hub contacts</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Return to safety dashboard"
        >
          <Text style={styles.backButtonText}>Return to safety dashboard</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  highContrastBackground: { backgroundColor: '#ffffff' },
  highContrastCard: { borderColor: '#171717', borderWidth: 2 },
  highContrastButton: { backgroundColor: '#000000' },
  highContrastSecondary: { borderColor: '#000000', borderWidth: 2 },
  largeTitle: { fontSize: 32, lineHeight: 39 },
  largeHeading: { fontSize: 20 },
  largeBody: { fontSize: 17, lineHeight: 25 },
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  content: { padding: 18, gap: 14, paddingBottom: 30 },
  heroCard: {
    backgroundColor: '#fff7f6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0aaa5',
    padding: 18,
    gap: 8,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#9a3412',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  disasterTypeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 8,
    borderRadius: 7,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  highContrastTypeBanner: { borderWidth: 2, borderColor: '#171717' },
  disasterTypeBannerText: { fontSize: 16, fontWeight: '800' },
  eyebrow: { color: '#9a3412', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  title: { color: '#171717', fontSize: 26, fontWeight: '700' },
  body: { color: '#525252', fontSize: 15, lineHeight: 21 },
  disclaimer: {
    color: '#8a5a00',
    backgroundColor: '#fff8e7',
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    lineHeight: 17,
  },
  offlineNote: {
    color: '#5f6b63',
    backgroundColor: '#eef3ee',
    borderRadius: 6,
    padding: 10,
    fontSize: 12,
    lineHeight: 17,
  },
  actionCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 9,
  },
  sectionCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 14,
  },
  sectionTitle: { color: '#171717', fontSize: 17, fontWeight: '700' },
  sectionDetail: { color: '#525252', fontSize: 13, lineHeight: 19 },
  metadataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingTop: 8,
  },
  metadataLabel: { color: '#6b7280', fontSize: 13 },
  metadataValue: { flex: 1, color: '#171717', fontSize: 13, fontWeight: '800', textAlign: 'right' },
  freshnessText: { color: '#5f6b63', fontSize: 12, lineHeight: 17 },
  sourceText: { color: '#6b7280', fontSize: 12, lineHeight: 17 },
  officialCard: {
    backgroundColor: '#fff8e7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e8c778',
    padding: 16,
    gap: 9,
  },
  officialText: { color: '#6b4f00', fontSize: 14, lineHeight: 21 },
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#9a3412',
    borderRadius: 8,
    paddingVertical: 14,
  },
  emergencyButtonText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  stepNumber: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#e9eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: { color: '#4d7c5a', fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, color: '#2f2f2f', fontSize: 14, lineHeight: 20 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingTop: 11,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e9eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactCopy: { flex: 1, gap: 2 },
  contactName: { color: '#171717', fontSize: 14, fontWeight: '800' },
  contactPhone: { color: '#6b7280', fontSize: 13 },
  contactCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#4d7c5a',
    borderRadius: 7,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  contactCallText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  emptyContactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e1',
    padding: 12,
    gap: 7,
  },
  emptyContactText: { color: '#6b7280', fontSize: 13 },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#171717',
    borderRadius: 8,
    paddingVertical: 12,
  },
  secondaryButtonText: { color: '#171717', fontSize: 13, fontWeight: '800' },
  linkButton: { alignItems: 'center', paddingVertical: 5 },
  linkButtonText: { color: '#5f6b63', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
  backButton: { backgroundColor: '#171717', borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  backButtonText: { color: '#fafaf9', fontSize: 14, fontWeight: '700' },
});

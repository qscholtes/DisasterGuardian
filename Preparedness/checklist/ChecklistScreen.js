import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../../styles/Styles';

import { loadChecklistState, loadPersonalProfile, saveChecklistState } from '../../storage/appState';
import { ignoreError } from '../../utils/ignoreError';

const CHECKLIST_SECTIONS = [
  {
    title: 'Documents',
    items: [
      'ID/Passport',
      'Cash (small bills)',
      'Important phone numbers',
      'Insurance documents (copies)',
      'Vaccination card',
    ],
  },
  {
    title: 'Food & Water',
    items: [
      'Drinking water (at least 1L per person)',
      'Energy bars',
      'Granola bars',
      'Glucose tablets',
      'Water bottle (refillable)',
    ],
  },
  {
    title: 'Clothing',
    items: [
      'Weather-resistant clothing',
      'Sturdy shoes',
      'Change of underwear',
      'Blanket/Sleeping bag',
      'Hat/head covering',
      'Gloves',
    ],
  },
  {
    title: 'Medical & Hygiene',
    items: ['First aid kit', 'Personal medication', 'Hygiene products', 'Disinfectant', 'FFP2 masks', 'Wet wipes'],
  },
  {
    title: 'Equipment',
    items: ['Flashlight with batteries', 'Battery/hand-crank radio', 'Power bank', 'Whistle (signal device)'],
  },
  {
    title: 'Other',
    items: [
      'Phone and charger',
      'Spare glasses/hearing aids',
      'Notepad and pen',
      'Garbage bags',
      'Games/book for children',
    ],
  },
];

function getPersonalisedSections(profile) {
  const items = [...(profile.customChecklistItems || [])];
  if (profile.householdSize > 1) items.push(`Water for ${profile.householdSize} household members`);
  return items.length ? [{ title: 'Personalised items', items }] : [];
}

function getChecklistItemId(label) {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export default function ChecklistScreen() {
  const [checkedItems, setCheckedItems] = useState({});
  const [personalProfile, setPersonalProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([loadChecklistState(), loadPersonalProfile()]).then(([storedState, storedProfile]) => {
        if (!active) return;
        setCheckedItems(storedState);
        setPersonalProfile(storedProfile);
        setLoaded(true);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  const checklistSections = useMemo(
    () => [...CHECKLIST_SECTIONS, ...getPersonalisedSections(personalProfile || {})],
    [personalProfile],
  );
  const checklistItems = useMemo(() => checklistSections.flatMap((section) => section.items), [checklistSections]);

  const completedCount = useMemo(
    () => checklistItems.filter((item) => checkedItems[getChecklistItemId(item)]).length,
    [checkedItems, checklistItems],
  );

  const toggleItem = (item) => {
    const checklistItemId = getChecklistItemId(item);
    setCheckedItems((current) => {
      const nextState = { ...current, [checklistItemId]: !current[checklistItemId] };
      saveChecklistState(nextState).catch(ignoreError);
      return nextState;
    });
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
        <View style={styles.loadingState}>
          <Text style={styles.loadingText}>Loading checklist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Preparedness</Text>
          <Text style={styles.title}>Go-bag checklist</Text>
          <Text style={styles.description}>
            Check off each item you have ready. Your progress is saved automatically.
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressLabel}>Ready</Text>
            <Text style={styles.progressValue}>
              {completedCount} / {checklistItems.length}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${(completedCount / checklistItems.length) * 100}%` }]} />
          </View>
        </View>

        {checklistSections.map((section) => (
          <View key={section.title} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const checked = Boolean(checkedItems[getChecklistItemId(item)]);
              return (
                <Pressable
                  key={item}
                  onPress={() => toggleItem(item)}
                  style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={item}
                  accessibilityHint={
                    checked ? 'Double tap to mark this item as not ready' : 'Double tap to mark this item as ready'
                  }
                  accessibilityState={{ checked }}
                >
                  <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                    {checked ? <Text style={styles.checkmark}>✓</Text> : null}
                  </View>
                  <Text style={[styles.itemText, checked && styles.itemTextChecked]}>{item}</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  loadingState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#525252', fontSize: 15, fontWeight: '600' },
  content: { paddingHorizontal: 18, paddingBottom: 28, gap: 14 },
  heroCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 18,
  },
  eyebrow: { color: '#5f6b63', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  title: { color: '#171717', fontSize: 26, fontWeight: '700', marginTop: 5 },
  description: { color: '#525252', fontSize: 14, lineHeight: 20, marginTop: 7 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 7 },
  progressLabel: { color: '#5f6b63', fontSize: 13, fontWeight: '700' },
  progressValue: { color: '#171717', fontSize: 13, fontWeight: '700' },
  progressTrack: { height: 8, borderRadius: 999, backgroundColor: '#e7e5e4', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#171717' },
  sectionCard: { backgroundColor: '#fbfbf9', borderRadius: 8, borderWidth: 1, borderColor: '#dfdfd8', padding: 16 },
  sectionTitle: { color: '#171717', fontSize: 17, fontWeight: '700', marginBottom: 8 },
  itemRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingVertical: 9,
    gap: 12,
  },
  itemRowPressed: { backgroundColor: '#f1f1ec' },
  checkbox: {
    width: 25,
    height: 25,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#b8b8b1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: '#171717', borderColor: '#171717' },
  checkmark: { color: '#ffffff', fontSize: 17, lineHeight: 20, fontWeight: '800' },
  itemText: { flex: 1, color: '#2f2f2f', fontSize: 14, lineHeight: 19 },
  itemTextChecked: { color: '#737373', textDecorationLine: 'line-through' },
});

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/Styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DISASTER_CONTENT } from './disasterContent';
import useAccessibilitySettings from '../hooks/useAccessibilitySettings';

export default function LearnScreen({ navigation }) {
  const settings = useAccessibilitySettings();

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && styles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, settings.highContrast && styles.highContrastCard]}>
          <Text style={[styles.title, settings.largeText && styles.largeTitle]}>Learn</Text>
          <Text style={[styles.body, settings.largeText && styles.largeBody]}>
            Find practical guidance for floods, storms, heat, cold weather, and nearby emergency services.
          </Text>
        </View>

        <View style={[styles.sectionCard, settings.highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, settings.largeText && styles.largeHeading]}>Emergency services</Text>
          <Text style={[styles.sectionDetail, settings.largeText && styles.largeBody]}>
            Use your location to find hospitals, police, fire stations, and possible shelters nearby.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.primaryOption, pressed && styles.topicRowPressed]}
            onPress={() => navigation.navigate('EmergencyServices')}
          >
            <View style={styles.optionCopy}>
              <Text style={styles.primaryTitle}>Search for nearby help</Text>
              <Text style={styles.primaryDetail}>Search OpenStreetMap facilities around your current location.</Text>
            </View>
            <Text style={styles.optionArrow}>›</Text>
          </Pressable>
        </View>

        <View style={[styles.sectionCard, settings.highContrast && styles.highContrastCard]}>
          <Text style={[styles.sectionTitle, settings.largeText && styles.largeHeading]}>Resource hub</Text>
          <Text style={[styles.sectionDetail, settings.largeText && styles.largeBody]}>
            Choose a hazard to see what to do before, during, and after it happens.
          </Text>
          {DISASTER_CONTENT.map((topic) => (
            <Pressable
              key={topic.id}
              style={({ pressed }) => [styles.topicRow, pressed && styles.topicRowPressed]}
              onPress={() => navigation.navigate('DisasterTopic', { topicId: topic.id })}
              accessibilityRole="button"
              accessibilityLabel={`Open ${topic.title} guidance`}
            >
              <View style={styles.topicIcon}>
                <MaterialCommunityIcons name={topic.icon} size={20} color="#4d7c5a" accessible={false} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={[styles.topicTitle, settings.largeText && styles.largeBody]}>{topic.title}</Text>
                <Text style={[styles.topicDetail, settings.largeText && styles.largeBody]}>{topic.detail}</Text>
              </View>
              <Text style={styles.topicArrow}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  highContrastBackground: { backgroundColor: '#ffffff' },
  highContrastCard: { borderColor: '#171717', borderWidth: 2 },
  largeTitle: { fontSize: 32 },
  largeHeading: { fontSize: 21 },
  largeBody: { fontSize: 17, lineHeight: 25 },
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  content: { paddingHorizontal: 18, paddingBottom: 28, gap: 14 },
  heroCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 18,
    gap: 6,
  },
  title: { color: '#171717', fontSize: 26, fontWeight: '700' },
  body: { color: '#525252', fontSize: 14, lineHeight: 20 },
  sectionCard: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 10,
  },
  sectionTitle: { color: '#171717', fontSize: 18, fontWeight: '700' },
  sectionDetail: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  primaryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ecebe7',
    borderRadius: 8,
    padding: 14,
    gap: 12,
    marginTop: 4,
  },
  optionCopy: { flex: 1, gap: 3 },
  primaryTitle: { color: '#171717', fontSize: 15, fontWeight: '700' },
  primaryDetail: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  optionArrow: { color: '#5f6b63', fontSize: 28, fontWeight: '300' },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#ecebe7',
    paddingVertical: 12,
    gap: 12,
  },
  topicIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e9eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicRowPressed: { opacity: 0.65 },
  topicTitle: { color: '#171717', fontSize: 15, fontWeight: '700' },
  topicDetail: { color: '#6b7280', fontSize: 13, lineHeight: 18 },
  topicArrow: { color: '#5f6b63', fontSize: 26 },
});

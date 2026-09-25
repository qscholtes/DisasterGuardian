import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { commonStyles } from '../styles/Styles';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDisasterContent } from './disasterContent';
import useAccessibilitySettings from '../hooks/useAccessibilitySettings';

export default function DisasterTopicScreen({ route }) {
  const topic = getDisasterContent(route.params?.topicId);
  const scrollViewRef = useRef(null);
  const [sectionPositions, setSectionPositions] = useState({});
  const settings = useAccessibilitySettings();
  const focusSection = route.params?.focusSection ?? route.params?.sectionIndex;

  useEffect(() => {
    if (!Number.isInteger(focusSection)) {
      return undefined;
    }

    const targetY = sectionPositions[focusSection];
    if (Number.isFinite(targetY)) {
      const timeout = setTimeout(() => {
        const scrollView = scrollViewRef.current;
        if (scrollView && typeof scrollView.scrollTo === 'function') {
          scrollView.scrollTo({ y: Math.max(0, targetY - 12), animated: true });
        }
      }, 100);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [focusSection, sectionPositions]);

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && styles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView ref={scrollViewRef} contentContainerStyle={styles.container}>
        <Text style={[styles.eyebrow, settings.largeText && styles.largeBody]}>Resource hub</Text>
        <View style={styles.titleRow}>
          <View style={styles.topicIcon}>
            <MaterialCommunityIcons name={topic.icon} size={25} color="#4d7c5a" accessible={false} />
          </View>
          <Text style={[styles.title, settings.largeText && styles.largeTitle]}>{topic.title}</Text>
        </View>
        <Text style={[styles.body, settings.largeText && styles.largeBody]}>{topic.detail}</Text>
        <View style={[styles.notice, settings.highContrast && styles.highContrastCard]}>
          <Text style={[styles.noticeText, settings.largeText && styles.largeBody]}>
            Use this as a quick reminder, not a replacement for instructions from local emergency services.
          </Text>
        </View>
        {topic.sections.map((section, sectionIndex) => (
          <View
            key={section.title}
            onLayout={(event) => {
              const targetY = event?.nativeEvent?.layout?.y;
              if (Number.isFinite(targetY)) {
                setSectionPositions((positions) => ({ ...positions, [sectionIndex]: targetY }));
              }
            }}
            style={[styles.panel, settings.highContrast && styles.highContrastCard]}
          >
            <Text style={[styles.panelTitle, settings.largeText && styles.largeHeading]}>{section.title}</Text>
            {section.items.map((item) => (
              <View key={item} style={styles.itemRow}>
                <Text style={styles.itemBullet}>•</Text>
                <Text style={[styles.panelBody, settings.largeText && styles.largeBody]}>{item}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={[styles.sourcePanel, settings.highContrast && styles.highContrastCard]}>
          <Text style={[styles.sourceTitle, settings.largeText && styles.largeHeading]}>Sources and references</Text>
          <Pressable
            style={styles.sourceButton}
            onPress={() => Linking.openURL(topic.sourceUrl).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={`Open source: ${topic.sourceLabel}`}
          >
            <Text style={styles.sourceButtonText}>{topic.sourceLabel}</Text>
          </Pressable>
          <Pressable
            style={styles.sourceButton}
            onPress={() =>
              Linking.openURL(
                'https://www.bbk.bund.de/DE/Warnung-Vorsorge/Vorsorge/Mit-Naturgefahren-umgehen/mit-naturgefahren-umgehen_node.html',
              ).catch(() => {})
            }
            accessibilityRole="link"
            accessibilityLabel="Open BBK natural hazards overview"
          >
            <Text style={styles.sourceButtonText}>BBK: Natural hazards overview</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  highContrastBackground: { backgroundColor: '#ffffff' },
  highContrastCard: { borderColor: '#171717', borderWidth: 2 },
  largeTitle: { fontSize: 32, lineHeight: 39 },
  largeHeading: { fontSize: 20 },
  largeBody: { fontSize: 17, lineHeight: 25 },
  safeArea: { flex: 1, backgroundColor: '#f5f5f2' },
  container: { padding: 18, gap: 12, paddingBottom: 30 },
  eyebrow: { color: '#5f6b63', fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9eee9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, color: '#171717', fontSize: 28, fontWeight: '700', marginTop: 2 },
  body: { color: '#525252', fontSize: 15, lineHeight: 22 },
  notice: { backgroundColor: '#fff8e7', borderWidth: 1, borderColor: '#e8c778', borderRadius: 8, padding: 12 },
  noticeText: { color: '#6b4f00', fontSize: 13, lineHeight: 19 },
  panel: { backgroundColor: '#fbfbf9', borderWidth: 1, borderColor: '#dfdfd8', borderRadius: 8, padding: 16, gap: 9 },
  panelTitle: { color: '#171717', fontSize: 16, fontWeight: '700' },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  itemBullet: { color: '#4d7c5a', fontSize: 18, lineHeight: 20, fontWeight: '800' },
  panelBody: { flex: 1, color: '#525252', fontSize: 14, lineHeight: 20 },
  sourcePanel: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfdfd8',
    borderRadius: 8,
    padding: 16,
    gap: 8,
  },
  sourceTitle: { color: '#171717', fontSize: 16, fontWeight: '700' },
  sourceButton: { alignSelf: 'flex-start', paddingVertical: 3 },
  sourceButtonText: { color: '#4d7c5a', fontSize: 13, fontWeight: '700', textDecorationLine: 'underline' },
});

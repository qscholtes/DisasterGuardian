import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { accessibilityStyles } from '../styles/accessibilityStyles';
import { commonStyles } from '../styles/Styles';
import useAccessibilitySettings from '../hooks/useAccessibilitySettings';

const preparationOptions = [
  {
    key: 'emergency-kit',
    title: 'Emergency kit challenge',
    detail: 'Sort useful supplies from distractions and earn AP as you build a better emergency kit.',
    route: 'EmergencyKitChallenge',
    primary: true,
  },
  {
    key: 'quizzes',
    title: 'Quizzes',
    detail: 'Test decisions you may need to make when conditions change quickly.',
    route: 'Quizzes',
  },
  {
    key: 'checklist',
    title: 'Go-bag checklist',
    detail: 'Work through the supplies and documents you would want before leaving home.',
    route: 'Checklist',
  },
];

export default function PrepareScreen({ navigation }) {
  const settings = useAccessibilitySettings();

  return (
    <SafeAreaView
      style={[styles.safeArea, settings.highContrast && accessibilityStyles.highContrastBackground]}
      edges={['left', 'right', 'bottom']}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.heroCard, settings.highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.title, settings.largeText && accessibilityStyles.largeTextTitle]}>
            Preparedness tasks
          </Text>
          <Text style={[styles.body, settings.largeText && accessibilityStyles.largeTextBody]}>
            Build a practical plan with a kit challenge, short quizzes, and a go-bag checklist.
          </Text>
        </View>

        <View style={[styles.sectionCard, settings.highContrast && accessibilityStyles.highContrastCard]}>
          <Text style={[styles.sectionTitle, settings.largeText && accessibilityStyles.largeTextHeading]}>
            Press an option to start a task
          </Text>
          {preparationOptions.map((item) => {
            const Container = item.unavailable ? View : Pressable;
            const containerProps = item.unavailable ? {} : { onPress: () => navigation.navigate(item.route) };

            return (
              <Container
                key={item.key}
                style={[styles.optionCard, settings.highContrast && accessibilityStyles.highContrastSecondary]}
                {...containerProps}
              >
                <View style={styles.optionHeader}>
                  <Text style={[styles.optionTitle, settings.largeText && accessibilityStyles.largeTextHeading]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.optionPill, settings.largeText && accessibilityStyles.largeTextSmall]}>
                    {item.unavailable ? 'Soon' : 'Start'}
                  </Text>
                </View>
                <Text style={[styles.optionDetail, settings.largeText && accessibilityStyles.largeTextBody]}>
                  {item.detail}
                </Text>
              </Container>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ...commonStyles,
  content: {
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 28,
    gap: 14,
  },
  title: {
    color: '#171717',
    fontSize: 24,
    fontWeight: '700',
  },
  body: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
  },
  optionCard: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e1',
    backgroundColor: '#ffffff',
    padding: 14,
    gap: 8,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  optionTitle: {
    flex: 1,
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  optionPill: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
  },
  optionDetail: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
});

import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { accessibilityStyles } from '../../styles/accessibilityStyles';
// Introduces the emergency-kit challenge and starts a new attempt.
export default function EmergencyKitIntro({ progress, largeText, highContrast, onStart }) {
  return (
    <SafeAreaView style={[styles.screen, highContrast && accessibilityStyles.highContrastBackground]}>
      <ScrollView
        contentContainerStyle={[styles.introPanel, highContrast && accessibilityStyles.highContrastBackground]}
      >
        <Text style={[styles.introEyebrow, largeText && accessibilityStyles.largeTextSmall]}>PREPARE</Text>
        <Text style={[styles.title, largeText && accessibilityStyles.largeTextTitle]}>Build your emergency kit</Text>
        <Text style={[styles.description, largeText && accessibilityStyles.largeTextBody]}>
          Pack an emergency preparedness backpack before time runs out.
        </Text>

        <View style={styles.instructions}>
          <Text
            style={[
              styles.instruction,
              highContrast && accessibilityStyles.highContrastCard,
              largeText && accessibilityStyles.largeTextBody,
            ]}
          >
            Drag or tap items to pack them.
          </Text>
          <Text
            style={[
              styles.instruction,
              highContrast && accessibilityStyles.highContrastCard,
              largeText && accessibilityStyles.largeTextBody,
            ]}
          >
            Some items are useful during emergencies.
          </Text>
          <Text
            style={[
              styles.instruction,
              highContrast && accessibilityStyles.highContrastCard,
              largeText && accessibilityStyles.largeTextBody,
            ]}
          >
            Some items are not.
          </Text>
          <Text
            style={[
              styles.instruction,
              highContrast && accessibilityStyles.highContrastCard,
              largeText && accessibilityStyles.largeTextBody,
            ]}
          >
            You have 2 minutes.
          </Text>
          <Text
            style={[
              styles.instruction,
              highContrast && accessibilityStyles.highContrastCard,
              largeText && accessibilityStyles.largeTextBody,
            ]}
          >
            Backpack space is limited.
          </Text>
        </View>

        {progress ? (
          <View style={styles.progressStrip}>
            <Text
              style={[
                styles.progressText,
                highContrast && accessibilityStyles.highContrastCard,
                largeText && accessibilityStyles.largeTextSmall,
              ]}
            >
              Total AP: {progress.totalAp}
            </Text>
            <Text
              style={[
                styles.progressText,
                highContrast && accessibilityStyles.highContrastCard,
                largeText && accessibilityStyles.largeTextSmall,
              ]}
            >
              Best: {progress.bestScore}
            </Text>
            <Text
              style={[
                styles.progressText,
                highContrast && accessibilityStyles.highContrastCard,
                largeText && accessibilityStyles.largeTextSmall,
              ]}
            >
              Badges: Track them in Profile
            </Text>
          </View>
        ) : null}

        <Pressable
          style={[styles.primaryButton, highContrast && accessibilityStyles.highContrastPrimary]}
          onPress={onStart}
          accessibilityRole="button"
          accessibilityLabel="Start emergency kit challenge"
        >
          <Text style={[styles.primaryButtonText, largeText && accessibilityStyles.largeTextButton]}>
            Start Challenge
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f5f5f2',
  },
  introPanel: {
    flexGrow: 1,
    padding: 18,
    paddingTop: 22,
    backgroundColor: '#f5f5f2',
  },
  introEyebrow: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  title: {
    color: '#171717',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0,
  },
  description: {
    color: '#525252',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  instructions: {
    gap: 8,
    marginBottom: 16,
  },
  instruction: {
    color: '#2f2f2f',
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: '#fbfbf9',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
  },
  progressStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 8,
  },
  progressText: {
    color: '#171717',
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#171717',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fafaf9',
    fontSize: 15,
    fontWeight: '700',
  },
});

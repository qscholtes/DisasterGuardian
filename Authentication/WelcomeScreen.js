import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>DisasterGuardian</Text>
          <Text style={styles.title}>Preparedness, response, and progress in one place.</Text>
          <Text style={styles.subtitle}>
            Build local readiness habits, stay aware of active risk, and keep your progress available offline.
          </Text>
        </View>

        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>Alerts</Text>
            <Text style={styles.featureText}>Local risk status and emergency guidance</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>Preparedness</Text>
            <Text style={styles.featureText}>Checklist progress and recommended tasks</Text>
          </View>
          <View style={styles.featureRow}>
            <Text style={styles.featureLabel}>Gamification</Text>
            <Text style={styles.featureText}>AP, badges, and challenge history</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable style={styles.primaryButton} onPress={() => navigation.navigate('Permissions', { mode: 'guest' })}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f5f2',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
    justifyContent: 'space-between',
  },
  hero: {
    gap: 12,
    marginTop: 24,
  },
  eyebrow: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#171717',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
  },
  subtitle: {
    color: '#525252',
    fontSize: 15,
    lineHeight: 22,
  },
  featureList: {
    gap: 10,
  },
  featureRow: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 4,
  },
  featureLabel: {
    color: '#171717',
    fontSize: 14,
    fontWeight: '700',
  },
  featureText: {
    color: '#5f5f5f',
    fontSize: 14,
    lineHeight: 19,
  },
  actions: {
    gap: 12,
    marginBottom: 8,
  },
  primaryButton: {
    backgroundColor: '#171717',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fafaf9',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: '#fbfbf9',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d4d4d4',
  },
  secondaryButtonText: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '700',
  },
  tertiaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  tertiaryButtonText: {
    color: '#5f5f5f',
    fontSize: 14,
    fontWeight: '600',
  },
});

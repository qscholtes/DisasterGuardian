import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmergencyResponseCard({ navigation, largeText, highContrast, styles, warning }) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.emergencyCard,
        highContrast && styles.highContrastCard,
        pressed && styles.emergencyCardPressed,
      ]}
      onPress={() => navigation.navigate('EmergencyResponse', { warning })}
      accessibilityRole="button"
      accessibilityLabel="Open emergency response guidance"
    >
      <View style={styles.emergencyIcon}>
        <MaterialCommunityIcons name="alert-outline" size={22} color="#ffffff" accessible={false} />
      </View>
      <View style={styles.emergencyCopy}>
        <Text style={[styles.emergencyTitle, largeText && styles.largeTextHeading]}>Emergency response</Text>
        <Text style={[styles.emergencyDetail, largeText && styles.largeTextBody]}>
          Get immediate safety steps, call for help, or find nearby support.
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color="#9a3412" accessible={false} />
    </Pressable>
  );
}

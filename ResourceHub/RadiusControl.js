import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const MIN_RADIUS_METRES = 1000;
const MAX_RADIUS_METRES = 10000;
const RADIUS_STEP_METRES = 1000;

function formatRadius(radiusMetres) {
  return `${radiusMetres / 1000} km`;
}

export default function RadiusControl({ value, onChange, onChangeEnd }) {
  const changeValue = (delta) => {
    const nextValue = Math.max(MIN_RADIUS_METRES, Math.min(MAX_RADIUS_METRES, value + delta));
    onChange(nextValue);
    onChangeEnd(nextValue);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.button}
        onPress={() => changeValue(-RADIUS_STEP_METRES)}
        accessibilityRole="button"
        accessibilityLabel="Decrease search radius"
      >
        <Text style={styles.buttonText}>−</Text>
      </Pressable>
      <Text style={styles.value}>{formatRadius(value)}</Text>
      <Pressable
        style={styles.button}
        onPress={() => changeValue(RADIUS_STEP_METRES)}
        accessibilityRole="button"
        accessibilityLabel="Increase search radius"
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: {
    width: 44,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#171717',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 24, lineHeight: 26, fontWeight: '700' },
  value: { flex: 1, textAlign: 'center', color: '#171717', fontSize: 15, fontWeight: '800' },
});

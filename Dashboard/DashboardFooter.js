import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DashboardFooter({ navigationItems, onNavigate }) {
  return (
    <View style={styles.footerDock}>
      <View style={styles.footerRail}>
        {navigationItems.map((navigationItem, index) => (
          <Pressable
            key={navigationItem.key}
            style={({ pressed }) => [
              styles.footerButton,
              index !== navigationItems.length - 1 && styles.footerButtonDivider,
              pressed && styles.footerButtonPressed,
            ]}
            onPress={() => onNavigate(navigationItem.route)}
            accessibilityRole="button"
            accessibilityLabel={`Open ${navigationItem.label}`}
          >
            <MaterialCommunityIcons name={navigationItem.icon} size={18} color="#171717" accessible={false} />
            <Text style={styles.footerButtonLabel} numberOfLines={1}>
              {navigationItem.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  footerDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 0,
  },
  footerRail: {
    flexDirection: 'row',
    gap: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minHeight: 78,
    borderTopWidth: 1,
    borderTopColor: '#dedbd4',
    backgroundColor: '#ffffff',
  },
  footerButton: {
    flex: 1,
    minHeight: 78,
    height: 78,
    backgroundColor: '#fbfbf9',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  footerButtonDivider: {
    borderRightWidth: 1,
    borderRightColor: '#dedbd4',
  },
  footerButtonPressed: {
    backgroundColor: '#f1f1ec',
  },
  footerButtonLabel: {
    color: '#171717',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0,
  },
});

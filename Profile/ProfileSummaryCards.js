import React from 'react';
import { Text, View } from 'react-native';
// Displays the user's name and account mode in the profile summary.
export function ProfileIdentityCard({ displayName, guestMode, largeText, highContrast, styles, accessibilityStyles }) {
  return (
    <View style={[styles.heroCard, highContrast && accessibilityStyles.highContrastCard]}>
      <Text style={[styles.eyebrow, largeText && accessibilityStyles.largeTextSmall]}>Profile</Text>
      <Text style={[styles.name, largeText && accessibilityStyles.largeTextTitle]}>{displayName}</Text>
      <Text style={[styles.modeText, largeText && accessibilityStyles.largeTextBody]}>
        {guestMode ? 'Offline local profile' : 'Signed-in profile'}
      </Text>
    </View>
  );
}
// Displays the user's current rank and progress towards the next one.
export function ProfileRankCard({ rank, nextRankProgress, largeText, highContrast, styles, accessibilityStyles }) {
  return (
    <View style={[styles.rankCard, highContrast && accessibilityStyles.highContrastCard]}>
      <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>Rank</Text>
      <Text style={[styles.rankValue, largeText && accessibilityStyles.largeTextValue]}>{rank}</Text>
      <Text style={[styles.rankHelper, largeText && accessibilityStyles.largeTextBody]}>
        {nextRankProgress.remaining > 0
          ? `${nextRankProgress.remaining} level${nextRankProgress.remaining === 1 ? '' : 's'} to ${nextRankProgress.nextRank}`
          : nextRankProgress.nextRank}
      </Text>
    </View>
  );
}

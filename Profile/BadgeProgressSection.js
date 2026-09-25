import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { accessibilityStyles } from '../styles/accessibilityStyles';
// Displays earned badges and progress towards the remaining ones, grouped into
// expandable categories. Badge data and expanded states come from the parent screen.
export default function BadgeProgressSection({
  badgeProgress,
  badgeGroups,
  badgesOpen,
  onToggleBadges,
  openBadgeCategories,
  onToggleCategory,
  largeText,
  highContrast,
  onLayout,
}) {
  const earnedBadgeCount = badgeProgress.filter((badge) => badge.earned).length;

  return (
    <View style={[styles.card, highContrast && accessibilityStyles.highContrastCard]} onLayout={onLayout}>
      <Pressable
        style={styles.header}
        onPress={onToggleBadges}
        accessibilityRole="button"
        accessibilityLabel="Badge progression"
        accessibilityHint={badgesOpen ? 'Collapse badge progression' : 'Expand badge progression'}
        accessibilityState={{ expanded: badgesOpen }}
      >
        <View style={styles.badgeCopy}>
          <Text style={[styles.sectionTitle, largeText && accessibilityStyles.largeTextHeading]}>
            Badge progression
          </Text>
          <Text style={[styles.helperText, largeText && accessibilityStyles.largeTextBody]}>
            {earnedBadgeCount} of {badgeProgress.length} badges earned
          </Text>
        </View>
        <Text style={styles.toggle}>{badgesOpen ? '-' : '+'}</Text>
      </Pressable>

      {badgesOpen ? (
        <View style={styles.badgeGrid}>
          {badgeGroups.map((group) => {
            const groupEarned = group.badges.filter((badge) => badge.earned).length;
            const groupOpen = Boolean(openBadgeCategories[group.category]);
            return (
              <View key={group.category} style={styles.badgeCategory}>
                <Pressable
                  style={styles.categoryHeader}
                  onPress={() => onToggleCategory(group.category)}
                  accessibilityRole="button"
                  accessibilityLabel={`${group.category} badges`}
                  accessibilityHint={
                    groupOpen ? `Collapse ${group.category} badges` : `Expand ${group.category} badges`
                  }
                  accessibilityState={{ expanded: groupOpen }}
                >
                  <View style={styles.badgeCopy}>
                    <Text style={[styles.categoryTitle, largeText && accessibilityStyles.largeTextHeading]}>
                      {group.category}
                    </Text>
                    <Text style={[styles.categoryDetail, largeText && accessibilityStyles.largeTextBody]}>
                      {groupEarned} of {group.badges.length} earned
                    </Text>
                  </View>
                  <Text style={styles.toggle}>{groupOpen ? '-' : '+'}</Text>
                </Pressable>

                {groupOpen
                  ? group.badges.map((badge) => (
                      <View
                        key={badge.id}
                        style={[styles.badgeTile, badge.earned && styles.badgeTileEarned]}
                        accessible
                        accessibilityLabel={`${badge.name}, ${badge.earned ? 'earned' : 'in progress'}, ${badge.progressLabel}`}
                      >
                        <View style={styles.badgeTileHeader}>
                          <View style={styles.badgeStatusGroup}>
                            <MaterialCommunityIcons
                              name={badge.earned ? 'check-circle-outline' : 'lock-outline'}
                              size={15}
                              color={badge.earned ? '#4d7c5a' : '#737373'}
                              accessible={false}
                            />
                            <Text
                              style={[
                                styles.badgeStatus,
                                largeText && accessibilityStyles.largeTextSmall,
                                badge.earned && styles.badgeStatusEarned,
                              ]}
                            >
                              {badge.earned ? 'Earned' : 'In progress'}
                            </Text>
                          </View>
                          <Text style={styles.badgeProgressLabel}>{badge.progressPercent}%</Text>
                        </View>
                        <Text
                          style={[
                            styles.badgeName,
                            largeText && accessibilityStyles.largeTextHeading,
                            badge.earned && styles.badgeNameEarned,
                          ]}
                        >
                          {badge.name}
                        </Text>
                        <Text style={[styles.badgeDescription, largeText && accessibilityStyles.largeTextBody]}>
                          {badge.description}
                        </Text>
                        <View
                          style={styles.badgeProgressTrack}
                          accessibilityRole="progressbar"
                          accessibilityValue={{ min: 0, max: 100, now: badge.progressPercent }}
                        >
                          <View style={[styles.badgeProgressFill, { width: `${badge.progressPercent}%` }]} />
                        </View>
                        <Text style={[styles.badgeProgressText, largeText && accessibilityStyles.largeTextBody]}>
                          {badge.progressLabel}
                        </Text>
                      </View>
                    ))
                  : null}
              </View>
            );
          })}
        </View>
      ) : null}

      {badgesOpen ? (
        <Text style={styles.helperText}>
          Complete the listed actions to unlock each badge. Progress is calculated from your saved checklist, quizzes,
          challenge results, and streak.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fbfbf9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dfdfd8',
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeCopy: {
    flex: 1,
    gap: 3,
  },
  sectionTitle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '700',
  },
  helperText: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
  },
  toggle: {
    color: '#171717',
    fontSize: 17,
    fontWeight: '800',
  },
  badgeGrid: {
    gap: 10,
  },
  badgeCategory: {
    backgroundColor: '#f5f5f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e1',
    padding: 10,
    gap: 10,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  categoryTitle: {
    color: '#171717',
    fontSize: 15,
    fontWeight: '800',
  },
  categoryDetail: {
    color: '#6b7280',
    fontSize: 12,
    lineHeight: 17,
  },
  badgeTile: {
    backgroundColor: '#f5f5f2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 14,
    gap: 4,
  },
  badgeTileEarned: {
    backgroundColor: '#f0f2ed',
    borderColor: '#cfd5cd',
  },
  badgeStatus: {
    color: '#737373',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeStatusEarned: {
    color: '#5f6b63',
  },
  badgeName: {
    color: '#737373',
    fontSize: 16,
    fontWeight: '600',
  },
  badgeNameEarned: {
    color: '#171717',
    fontWeight: '700',
  },
  badgeTileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeStatusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeProgressLabel: {
    color: '#5f6b63',
    fontSize: 12,
    fontWeight: '800',
  },
  badgeDescription: {
    color: '#525252',
    fontSize: 13,
    lineHeight: 18,
  },
  badgeProgressTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: '#e7e5e4',
    overflow: 'hidden',
    marginTop: 3,
  },
  badgeProgressFill: {
    height: '100%',
    backgroundColor: '#4d7c5a',
  },
  badgeProgressText: {
    color: '#6b7280',
    fontSize: 11,
    fontWeight: '600',
  },
});

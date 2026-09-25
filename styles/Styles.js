import { StyleSheet } from 'react-native';

export const colors = {
  appBackground: '#f5f5f2',
  cardBackground: '#fbfbf9',
  white: '#ffffff',
  primaryText: '#171717',
  bodyText: '#525252',
  mutedText: '#6b7280',
  border: '#dfdfd8',
  lightBorder: '#e5e5e1',
  green: '#4d7c5a',
  emergency: '#9a3412',
};

export const commonStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  heroCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 6,
  },
  sectionCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    color: colors.primaryText,
    fontSize: 17,
    fontWeight: '700',
  },
  sectionDetail: {
    color: colors.mutedText,
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    backgroundColor: colors.primaryText,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fafaf9',
    fontSize: 14,
    fontWeight: '700',
  },
});

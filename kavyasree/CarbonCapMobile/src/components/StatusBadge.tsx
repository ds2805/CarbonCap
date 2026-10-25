import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const norm = status?.toLowerCase() || '';

  let bg = '#f1f5f9';
  let text = '#64748b';
  let label = status;
  let icon = '●';

  if (norm === 'signed' || norm === 'valid' || norm === 'success' || norm === 'completed') {
    bg = '#dcfce7';
    text = '#15803d';
    label = norm === 'signed' ? 'Signed' : 'Valid';
    icon = '✓';
  } else if (norm === 'unsigned' || norm === 'pending') {
    bg = '#fef3c7';
    text = '#b45309';
    label = norm === 'unsigned' ? 'Unsigned' : 'Pending';
    icon = '⏳';
  } else if (norm === 'flagged' || norm === 'blocked' || norm === 'error' || norm === 'fraud') {
    bg = '#fee2e2';
    text = '#dc2626';
    label = 'Blocked';
    icon = '⚠';
  }

  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: bg }, isSmall && styles.badgeSm]}>
      <Text style={[styles.icon, { color: text }, isSmall && styles.iconSm]}>{icon}</Text>
      <Text style={[styles.text, { color: text }, isSmall && styles.textSm]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    alignSelf: 'flex-start',
    gap: 4,
  },
  badgeSm: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  icon: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  iconSm: {
    fontSize: 8,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 10,
  },
});

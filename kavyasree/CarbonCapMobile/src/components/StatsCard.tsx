import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface StatsCardProps {
  label: string;
  value: number | string;
  icon: string;
  color?: 'green' | 'blue' | 'amber' | 'red' | 'purple';
}

export function StatsCard({ label, value, icon, color = 'green' }: StatsCardProps) {
  let iconBg = '#dcfce7';
  let iconColor = '#15803d';

  if (color === 'blue') {
    iconBg = '#e0f2fe';
    iconColor = '#0284c7';
  } else if (color === 'amber') {
    iconBg = '#fef3c7';
    iconColor = '#d97706';
  } else if (color === 'red') {
    iconBg = '#fee2e2';
    iconColor = '#dc2626';
  } else if (color === 'purple') {
    iconBg = '#f3e8ff';
    iconColor = '#7e22ce';
  }

  return (
    <View style={styles.card}>
      <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
        <Text style={[styles.iconText, { color: iconColor }]}>{icon}</Text>
      </View>
      <View style={styles.textWrap}>
        <Text style={styles.value}>{value}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 140,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 18,
  },
  textWrap: {
    flex: 1,
  },
  value: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
});

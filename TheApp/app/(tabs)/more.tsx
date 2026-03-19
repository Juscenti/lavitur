import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface NavItem {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  route: string;
  color?: string;
}

const sections: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Commerce',
    items: [
      { label: 'Users', icon: 'people-outline', route: '/(tabs)/users' },
      { label: 'Discounts & Promotions', icon: 'pricetag-outline', route: '/(tabs)/discounts' },
      { label: 'Loyalty', icon: 'star-outline', route: '/(tabs)/loyalty', color: Colors.gold },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Content Blocks', icon: 'albums-outline', route: '/(tabs)/content' },
      { label: 'Analytics', icon: 'bar-chart-outline', route: '/(tabs)/analytics', color: Colors.info },
    ],
  },
  {
    heading: 'Admin',
    items: [
      { label: 'Roles & Permissions', icon: 'shield-checkmark-outline', route: '/(tabs)/roles' },
      { label: 'Security', icon: 'lock-closed-outline', route: '/(tabs)/security', color: Colors.warning },
      { label: 'Settings', icon: 'settings-outline', route: '/(tabs)/settings' },
      { label: 'Database Tools', icon: 'server-outline', route: '/(tabs)/database', color: Colors.danger },
    ],
  },
];

export default function MoreScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>More</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {sections.map(section => (
          <View key={section.heading} style={styles.section}>
            <Text style={styles.sectionHeading}>{section.heading}</Text>
            <View style={styles.group}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.row,
                    idx === section.items.length - 1 && styles.rowLast,
                  ]}
                  onPress={() => router.push(item.route as any)}
                >
                  <View style={[styles.iconBox, { backgroundColor: (item.color || Colors.gold) + '18' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color || Colors.gold} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { padding: Spacing.lg, paddingBottom: Spacing.sm },
  pageTitle: { ...Typography.heading, color: Colors.text },
  scroll: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 40 },
  section: { marginBottom: Spacing.xl },
  sectionHeading: {
    ...Typography.caption,
    color: Colors.textMuted,
    marginBottom: Spacing.sm,
    paddingLeft: 4,
  },
  group: {
    backgroundColor: Colors.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  rowLast: { borderBottomWidth: 0 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: { ...Typography.body, color: Colors.text, flex: 1, fontWeight: '500' },
});

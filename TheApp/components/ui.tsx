import React from 'react';
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  StyleSheet, TextInput, ScrollView, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radii } from '../constants/theme';

// ─── Screen wrapper ───────────────────────────────────────────────
export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

// ─── Card ─────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

// ─── Section header ───────────────────────────────────────────────
export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
    </View>
  );
}

// ─── Primary button ───────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  disabled?: boolean;
}

export function Button({ label, onPress, loading, variant = 'primary', size = 'md', style, disabled }: ButtonProps) {
  const bg = variant === 'primary' ? Colors.gold
    : variant === 'danger' ? Colors.danger
    : variant === 'secondary' ? Colors.bgElevated
    : 'transparent';

  const borderColor = variant === 'ghost' ? Colors.border : 'transparent';
  const textColor = variant === 'primary' ? '#0A0A0F'
    : variant === 'ghost' ? Colors.textSecondary
    : Colors.text;

  const pad = size === 'sm' ? { paddingVertical: 6, paddingHorizontal: 12 }
    : size === 'lg' ? { paddingVertical: 14, paddingHorizontal: 24 }
    : { paddingVertical: 10, paddingHorizontal: 18 };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        { backgroundColor: bg, borderColor, ...pad, opacity: (disabled || loading) ? 0.5 : 1 },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator size="small" color={textColor} />
        : <Text style={[styles.buttonText, { color: textColor, fontSize: size === 'sm' ? 12 : size === 'lg' ? 16 : 14 }]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── Input ────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'decimal-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: ViewStyle;
  editable?: boolean;
}

export function Input({ label, value, onChangeText, placeholder, secureTextEntry, multiline, numberOfLines, keyboardType, autoCapitalize, style, editable = true }: InputProps) {
  return (
    <View style={[styles.inputWrapper, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        secureTextEntry={secureTextEntry}
        multiline={multiline}
        numberOfLines={numberOfLines}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={editable}
        style={[
          styles.input,
          multiline && { height: (numberOfLines || 3) * 22, textAlignVertical: 'top' },
          !editable && { opacity: 0.5 },
        ]}
      />
    </View>
  );
}

// ─── Badge / Status chip ──────────────────────────────────────────
export function StatusBadge({ status }: { status: string }) {
  const color = Colors.statusColors[status?.toLowerCase()] ?? Colors.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color + '44' }]}>
      <Text style={[styles.badgeText, { color }]}>{status?.replace(/_/g, ' ')}</Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────
export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyText, { color: Colors.danger }]}>{message}</Text>
      {onRetry && <Button label="Retry" onPress={onRetry} variant="ghost" size="sm" style={{ marginTop: Spacing.md }} />}
    </View>
  );
}

// ─── Loading ──────────────────────────────────────────────────────
export function LoadingState() {
  return (
    <View style={styles.empty}>
      <ActivityIndicator color={Colors.gold} size="large" />
    </View>
  );
}

// ─── Row item ─────────────────────────────────────────────────────
interface RowItemProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export function RowItem({ title, subtitle, right, onPress, style }: RowItemProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper onPress={onPress} style={[styles.rowItem, style]}>
      <View style={{ flex: 1, marginRight: Spacing.md }}>
        <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
        {subtitle && <Text style={styles.rowSubtitle} numberOfLines={1}>{subtitle}</Text>}
      </View>
      {right}
    </Wrapper>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
export function Divider({ style }: { style?: ViewStyle }) {
  return <View style={[styles.divider, style]} />;
}

// ─── Gold accent line ─────────────────────────────────────────────
export function GoldLine() {
  return <View style={styles.goldLine} />;
}

// ─── Stat card ────────────────────────────────────────────────────
export function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, color && { color }]}>{value}</Text>
      {sub && <Text style={styles.statSub}>{sub}</Text>}
    </Card>
  );
}

// ─── Modal sheet handle ───────────────────────────────────────────
export function SheetHandle() {
  return <View style={styles.sheetHandle} />;
}

// ─── Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.bg },
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
  },
  sectionHeader: { marginBottom: Spacing.lg },
  sectionTitle: { ...Typography.heading, color: Colors.text },
  sectionSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  button: {
    borderRadius: Radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: 1,
  },
  buttonText: { fontWeight: '600', letterSpacing: 0.2 },

  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bgElevated,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    color: Colors.text,
    fontSize: 14,
  },

  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyText: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center' },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowTitle: { ...Typography.body, color: Colors.text, fontWeight: '500' },
  rowSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  divider: { height: 1, backgroundColor: Colors.border },
  goldLine: { height: 2, backgroundColor: Colors.gold, width: 32, marginBottom: Spacing.sm },

  statCard: { flex: 1, minWidth: 120 },
  statLabel: { ...Typography.caption, color: Colors.textSecondary },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 4 },
  statSub: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },

  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderLight,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
});

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Alert, Switch, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { Card, LoadingState, ErrorState, Button, Divider } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

type SettingsData = Record<string, Record<string, any>>;

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SettingsData>({});
  const [draft, setDraft] = useState<SettingsData>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<SettingsData>('/settings');
      setSettings(res);
      setDraft(JSON.parse(JSON.stringify(res)));
      setDirty(false);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  function updateDraft(section: string, key: string, value: any) {
    setDraft(prev => ({
      ...prev,
      [section]: { ...(prev[section] || {}), [key]: value },
    }));
    setDirty(true);
  }

  async function save() {
    setSaving(true);
    try {
      await api.patch('/settings', draft);
      setSettings(JSON.parse(JSON.stringify(draft)));
      setDirty(false);
      Alert.alert('Saved', 'Settings updated successfully.');
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSaving(false);
  }

  function renderValue(section: string, key: string, value: any) {
    if (typeof value === 'boolean') {
      return (
        <Switch
          value={draft[section]?.[key] ?? value}
          onValueChange={v => updateDraft(section, key, v)}
          trackColor={{ false: Colors.border, true: Colors.gold + '88' }}
          thumbColor={(draft[section]?.[key] ?? value) ? Colors.gold : Colors.textMuted}
        />
      );
    }
    return (
      <TextInput
        value={String(draft[section]?.[key] ?? value ?? '')}
        onChangeText={v => updateDraft(section, key, v)}
        style={styles.inlineInput}
        placeholderTextColor={Colors.textMuted}
        placeholder="—"
      />
    );
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const sections = Object.keys(settings);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Settings</Text>
        {dirty && (
          <Button label={saving ? 'Saving…' : 'Save'} onPress={save} loading={saving} size="sm" />
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
      >
        {sections.length === 0 && (
          <Text style={styles.emptyText}>No settings found</Text>
        )}

        {sections.map(section => (
          <View key={section} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.toUpperCase()}</Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {Object.entries(settings[section] || {}).map(([key, value], idx, arr) => (
                <View key={key} style={[styles.settingRow, idx === arr.length - 1 && styles.rowLast]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={styles.settingKey}>{key.replace(/_/g, ' ')}</Text>
                    <Text style={styles.settingPath}>{section}.{key}</Text>
                  </View>
                  {renderValue(section, key, value)}
                </View>
              ))}
            </Card>
          </View>
        ))}

        {dirty && (
          <Button
            label={saving ? 'Saving…' : 'Save All Changes'}
            onPress={save}
            loading={saving}
            size="lg"
            style={{ marginTop: Spacing.lg }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm, gap: 8 },
  backBtn: { padding: 4 },
  pageTitle: { ...Typography.heading, color: Colors.text, flex: 1 },
  scroll: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 40 },
  section: { marginBottom: Spacing.xl },
  sectionLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm, paddingLeft: 4 },
  settingRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rowLast: { borderBottomWidth: 0 },
  settingKey: { ...Typography.body, color: Colors.text, fontWeight: '500', textTransform: 'capitalize' },
  settingPath: { ...Typography.caption, color: Colors.textMuted, fontFamily: 'monospace', marginTop: 2 },
  inlineInput: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 6, borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10, paddingVertical: 6,
    color: Colors.text, fontSize: 13,
    minWidth: 120, textAlign: 'right',
  },
  emptyText: { color: Colors.textSecondary, textAlign: 'center', paddingVertical: 40 },
});

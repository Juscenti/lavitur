import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { StatusBadge, LoadingState, ErrorState, Button, SheetHandle, Divider } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface User {
  id: string; fullName?: string; full_name?: string; username?: string;
  email?: string; role?: string; status?: string; createdAt?: string; created_at?: string;
}

const ROLES = ['admin', 'representative', 'customer'];
const STATUSES = ['active', 'suspended'];

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<User | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<User[]>('/users');
      setUsers(Array.isArray(res) ? res : (res as any).users ?? []);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function updateStatus(userId: string, status: string) {
    setUpdating(true);
    try {
      await api.patch(`/users/${userId}/status`, { status });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
      setSelected(prev => prev ? { ...prev, status } : null);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setUpdating(false);
  }

  async function updateRole(userId: string, role: string) {
    setUpdating(true);
    try {
      await api.patch(`/users/${userId}/role`, { role });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      setSelected(prev => prev ? { ...prev, role } : null);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setUpdating(false);
  }

  function displayName(u: User) { return u.fullName || u.full_name || u.username || u.email || u.id.slice(0, 8); }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Users</Text>
        <Text style={styles.count}>{users.length}</Text>
      </View>

      <FlatList
        data={users}
        keyExtractor={u => u.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userCard} onPress={() => setSelected(item)}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>{displayName(item).charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{displayName(item)}</Text>
              <Text style={styles.userEmail} numberOfLines={1}>{item.email || '—'}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <StatusBadge status={item.role || 'customer'} />
              <StatusBadge status={item.status || 'active'} />
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No users found</Text></View>}
      />

      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <SheetHandle />
            {selected && (
              <>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarLetter}>{displayName(selected).charAt(0).toUpperCase()}</Text>
                </View>
                <Text style={styles.detailName}>{displayName(selected)}</Text>
                <Text style={styles.detailEmail}>{selected.email || '—'}</Text>

                <Divider style={{ marginVertical: Spacing.lg }} />

                <Text style={styles.sheetLabel}>ACCOUNT STATUS</Text>
                <View style={styles.chipRow}>
                  {STATUSES.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateStatus(selected.id, s)}
                      disabled={updating}
                      style={[styles.chip, selected.status === s && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selected.status === s && { color: '#0A0A0F' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sheetLabel, { marginTop: Spacing.lg }]}>ROLE</Text>
                <View style={styles.chipRow}>
                  {ROLES.map(r => (
                    <TouchableOpacity
                      key={r}
                      onPress={() => updateRole(selected.id, r)}
                      disabled={updating}
                      style={[styles.chip, selected.role === r && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, selected.role === r && { color: '#0A0A0F' }]}>{r}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Divider style={{ marginVertical: Spacing.lg }} />
                <View style={styles.detailRows}>
                  {[
                    ['ID', selected.id],
                    ['Username', selected.username || '—'],
                    ['Joined', selected.createdAt || selected.created_at ? new Date(selected.createdAt || selected.created_at!).toLocaleDateString() : '—'],
                  ].map(([k, v]) => (
                    <View key={k} style={styles.detailRow}>
                      <Text style={styles.detailKey}>{k}</Text>
                      <Text style={styles.detailVal} numberOfLines={1}>{v}</Text>
                    </View>
                  ))}
                </View>

                <Button label="Close" onPress={() => setSelected(null)} variant="ghost" style={{ marginTop: Spacing.xl }} />
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm, gap: 8 },
  backBtn: { padding: 4 },
  pageTitle: { ...Typography.heading, color: Colors.text, flex: 1 },
  count: { ...Typography.caption, color: Colors.textSecondary },
  list: { padding: Spacing.lg, paddingTop: 0 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.goldDim,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarLetter: { fontSize: 18, fontWeight: '700', color: Colors.gold },
  userName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  userEmail: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textSecondary },
  sheet: { padding: Spacing.xl, paddingBottom: 48, alignItems: 'center' },
  detailAvatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.goldDim,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  detailAvatarLetter: { fontSize: 30, fontWeight: '800', color: Colors.gold },
  detailName: { ...Typography.heading, color: Colors.text },
  detailEmail: { ...Typography.body, color: Colors.textSecondary, marginTop: 4 },
  sheetLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 8, alignSelf: 'flex-start' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'flex-start' },
  chip: {
    backgroundColor: Colors.bgElevated, borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  chipText: { fontSize: 13, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  detailRows: { width: '100%' },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  detailKey: { ...Typography.bodySmall, color: Colors.textSecondary },
  detailVal: { ...Typography.bodySmall, color: Colors.text, fontWeight: '500', maxWidth: '60%' },
});

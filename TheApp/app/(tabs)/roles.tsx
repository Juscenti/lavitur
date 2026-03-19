import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { Card, LoadingState, ErrorState, StatusBadge } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface RoleUser { id: string; full_name?: string; fullName?: string; email?: string; role?: string; }
interface RolePermissionTriple { read: boolean; write: boolean; admin: boolean }
interface RoleMatrixResource { resource: string; permissions: Record<string, RolePermissionTriple> }
interface RoleMatrix { roles: string[]; resources: RoleMatrixResource[]; }

export default function RolesScreen() {
  const [users, setUsers] = useState<RoleUser[]>([]);
  const [matrix, setMatrix] = useState<RoleMatrix | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<'users' | 'matrix'>('users');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const [u, m] = await Promise.all([
        api.get<RoleUser[]>('/roles/users'),
        api.get<RoleMatrix>('/roles/matrix'),
      ]);
      setUsers(Array.isArray(u) ? u : (u as any).users ?? []);
      setMatrix(m);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const roleColors: Record<string, string> = {
    admin: Colors.gold,
    representative: Colors.info,
    customer: Colors.textSecondary,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Roles & Permissions</Text>
      </View>

      {/* Tab switcher */}
      <View style={styles.tabs}>
        {(['users', 'matrix'] as const).map(t => (
          <TouchableOpacity key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t === 'users' ? 'Staff Users' : 'Permission Matrix'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
      >
        {tab === 'users' && (
          <>
            <Text style={styles.sectionLabel}>{users.length} STAFF MEMBERS</Text>
            {users.map(u => (
              <View key={u.id} style={styles.userRow}>
                <View style={[styles.avatar, { backgroundColor: (roleColors[u.role || 'customer'] || Colors.textMuted) + '22' }]}>
                  <Text style={[styles.avatarLetter, { color: roleColors[u.role || 'customer'] || Colors.textMuted }]}>
                    {(u.full_name || u.fullName || u.email || '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.userName}>{u.full_name || u.fullName || '—'}</Text>
                  <Text style={styles.userEmail} numberOfLines={1}>{u.email || '—'}</Text>
                </View>
                <View style={[styles.roleTag, { backgroundColor: (roleColors[u.role || 'customer']) + '22' }]}>
                  <Text style={[styles.roleText, { color: roleColors[u.role || 'customer'] || Colors.textSecondary }]}>
                    {u.role || 'customer'}
                  </Text>
                </View>
              </View>
            ))}
          </>
        )}

        {tab === 'matrix' && matrix && (
          <>
            <Text style={styles.sectionLabel}>PERMISSION MATRIX</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View>
                {/* Header row */}
                <View style={styles.matrixRow}>
                  <View style={styles.matrixResourceCell}>
                    <Text style={styles.matrixHeader}>Resource</Text>
                  </View>
                  {matrix.roles.map(r => (
                    <View key={r} style={styles.matrixRoleCell}>
                      <Text style={[styles.matrixHeader, { color: roleColors[r] || Colors.text }]} numberOfLines={1}>{r}</Text>
                    </View>
                  ))}
                </View>

                {matrix.resources.map((res, i) => (
                  <View key={res.resource} style={[styles.matrixRow, i % 2 === 0 && styles.matrixRowAlt]}>
                    <View style={styles.matrixResourceCell}>
                      <Text style={styles.matrixResource}>{res.resource}</Text>
                    </View>
                    {matrix.roles.map(r => (
                      <View key={r} style={styles.matrixRoleCell}>
                        <Ionicons
                          name={
                            (res.permissions?.[r]?.read ||
                              res.permissions?.[r]?.write ||
                              res.permissions?.[r]?.admin)
                              ? 'checkmark-circle'
                              : 'close-circle'
                          }
                          size={18}
                          color={
                            (res.permissions?.[r]?.admin
                              ? Colors.success
                              : res.permissions?.[r]?.write
                                ? Colors.info
                                : res.permissions?.[r]?.read
                                  ? Colors.gold
                                  : Colors.textMuted)
                          }
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm, gap: 8 },
  backBtn: { padding: 4 },
  pageTitle: { ...Typography.heading, color: Colors.text, flex: 1 },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  tabActive: { backgroundColor: Colors.bgElevated },
  tabText: { ...Typography.bodySmall, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.text },
  scroll: { padding: Spacing.lg, paddingTop: 0, paddingBottom: 40 },
  sectionLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  userRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgCard, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm, gap: 10,
  },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 16, fontWeight: '700' },
  userName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  userEmail: { ...Typography.caption, color: Colors.textSecondary },
  roleTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  matrixRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border },
  matrixRowAlt: { backgroundColor: Colors.bgCard },
  matrixResourceCell: { width: 140, padding: 10, justifyContent: 'center' },
  matrixRoleCell: { width: 90, padding: 10, alignItems: 'center', justifyContent: 'center' },
  matrixHeader: { ...Typography.caption, color: Colors.textSecondary, textTransform: 'capitalize' },
  matrixResource: { ...Typography.bodySmall, color: Colors.text },
});

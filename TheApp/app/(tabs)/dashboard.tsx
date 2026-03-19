import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Screen, Card, StatCard, LoadingState, ErrorState, GoldLine, Button } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface DashboardData {
  // backend columns (see Dashboard-react): `gross_revenue`, `total_orders`, `new_users`, `open_tickets`
  gross_revenue?: number;
  total_orders?: number;
  new_users?: number;
  open_tickets?: number;

  // older/alternate names
  total_revenue?: number;
  revenue_today?: number;
  orders_today?: number;
  [key: string]: any;
}

export default function DashboardScreen() {
  const { profile, signOut } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<DashboardData>('/dashboard');
      setData(res);
      setError('');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function onRefresh() { setRefreshing(true); load(); }

  function fmt(n?: number) {
    if (n == null) return '—';
    return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.gold} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.name}>{profile?.full_name || profile?.username || 'Admin'}</Text>
          </View>
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{profile?.role?.toUpperCase()}</Text>
          </View>
        </View>

        <GoldLine />
        <Text style={styles.sectionLabel}>OVERVIEW</Text>

        {loading && <LoadingState />}
        {!!error && <ErrorState message={error} onRetry={load} />}

        {data && !loading && (
          <>
            {/* KPI row 1 */}
            <View style={styles.row}>
              <StatCard
                label="Total Revenue"
                value={fmt(data.total_revenue ?? data.gross_revenue)}
                color={Colors.gold}
              />
              <View style={{ width: Spacing.sm }} />
              <StatCard label="Total Orders" value={data.total_orders ?? '—'} />
            </View>

            <View style={[styles.row, { marginTop: Spacing.sm }]}>
              <StatCard label="New Users" value={data.new_users ?? '—'} color={Colors.info} />
              <View style={{ width: Spacing.sm }} />
              <StatCard label="Open Tickets" value={data.open_tickets ?? '—'} color={Colors.warning} />
            </View>

            {/* Today */}
            <Card style={styles.todayCard}>
              <Text style={styles.todayLabel}>TODAY</Text>
              <View style={styles.todayRow}>
                <View style={styles.todayStat}>
                  <Text style={styles.todayValue}>{fmt(data.revenue_today ?? data.gross_revenue)}</Text>
                  <Text style={styles.todayKey}>Revenue</Text>
                </View>
                <View style={styles.todayDivider} />
                <View style={styles.todayStat}>
                  <Text style={styles.todayValue}>{data.orders_today ?? data.total_orders ?? '—'}</Text>
                  <Text style={styles.todayKey}>Orders</Text>
                </View>
              </View>
            </Card>

            {/* All keys as debug fallback */}
            {Object.keys(data).length > 0 && (
              <Card style={{ marginTop: Spacing.md }}>
                <Text style={[Typography.caption, { color: Colors.textSecondary, marginBottom: 8 }]}>ALL METRICS</Text>
                {Object.entries(data).map(([k, v]) => (
                  <View key={k} style={styles.metricRow}>
                    <Text style={styles.metricKey}>{k.replace(/_/g, ' ')}</Text>
                    <Text style={styles.metricVal}>{String(v ?? '—')}</Text>
                  </View>
                ))}
              </Card>
            )}
          </>
        )}

        {/* Sign out */}
        <Button label="Sign Out" onPress={signOut} variant="ghost" size="sm" style={{ marginTop: Spacing.xl, alignSelf: 'center' }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: Spacing.lg, paddingBottom: 32 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  greeting: { ...Typography.bodySmall, color: Colors.textSecondary },
  name: { ...Typography.heading, color: Colors.text },
  rolePill: {
    backgroundColor: Colors.goldDim,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: { ...Typography.caption, color: Colors.gold },
  sectionLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.md },
  row: { flexDirection: 'row' },
  todayCard: { marginTop: Spacing.md },
  todayLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 12 },
  todayRow: { flexDirection: 'row', alignItems: 'center' },
  todayStat: { flex: 1, alignItems: 'center' },
  todayValue: { fontSize: 24, fontWeight: '700', color: Colors.gold },
  todayKey: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  todayDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border },
  metricKey: { ...Typography.bodySmall, color: Colors.textSecondary, textTransform: 'capitalize', flex: 1 },
  metricVal: { ...Typography.bodySmall, color: Colors.text, fontWeight: '500' },
});

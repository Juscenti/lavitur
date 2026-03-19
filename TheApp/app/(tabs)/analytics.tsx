import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { api } from '../../lib/api';
import { Card, StatCard, LoadingState, ErrorState } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface AnalyticsData {
  kpis?: Record<string, any>;
  daily?: { day?: string; date?: string; orders?: number; revenue?: number }[];
  topProducts?: Array<{
    name?: string;
    title?: string;
    total_sold?: number;
    revenue?: number;
    orders?: number;
    orders_count?: number;
    gross_revenue?: number;
  }>;
  topAmbassadors?: Array<{
    name?: string;
    full_name?: string;
    orders?: number;
    orders_count?: number;
    gross_revenue?: number;
    revenue?: number;
    total_sales?: number;
    commission?: number;
  }>;
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<AnalyticsData>('/analytics/overview');
      setData(res);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  function fmt(n?: number, prefix = '') {
    if (n == null) return '—';
    if (n >= 1000000) return `${prefix}${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${prefix}${(n / 1000).toFixed(1)}k`;
    return `${prefix}${n}`;
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  const kpis = data?.kpis || {};
  const daily = data?.daily || [];
  const topProducts = data?.topProducts || [];
  const topAmbassadors = data?.topAmbassadors || [];

  // Simple bar chart for daily revenue
  const maxRevenue = Math.max(...daily.map(d => Number(d.revenue ?? 0)), 1);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.gold} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>Analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
      >
        {/* KPIs */}
        {Object.keys(kpis).length > 0 && (
          <>
            <Text style={styles.sectionLabel}>KEY METRICS</Text>
            <View style={styles.kpiGrid}>
              {Object.entries(kpis).slice(0, 6).map(([k, v]) => (
                <StatCard
                  key={k}
                  label={k.replace(/_/g, ' ').toUpperCase()}
                  value={typeof v === 'number' ? fmt(v, k.includes('revenue') || k.includes('sales') ? '$' : '') : String(v ?? '—')}
                  style={{ flex: 1, minWidth: '45%', marginBottom: 8 }}
                />
              ))}
            </View>
          </>
        )}

        {/* Daily chart */}
        {daily.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>DAILY REVENUE (LAST {daily.length} DAYS)</Text>
            <Card style={styles.chartCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.barChart}>
                  {daily.slice(-14).map((d, i) => {
                    const revenue = Number(d.revenue ?? 0);
                    const h = Math.max(4, (revenue / maxRevenue) * 80);
                    const rawDay = d.day ?? d.date;
                    const date = rawDay ? new Date(rawDay) : null;
                    return (
                      <View key={i} style={styles.barCol}>
                        <Text style={styles.barValue}>${fmt(revenue)}</Text>
                        <View style={[styles.bar, { height: h }]} />
                        <Text style={styles.barLabel}>
                          {date && !Number.isNaN(date.getTime())
                            ? `${date.getMonth() + 1}/${date.getDate()}`
                            : '—'}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              </ScrollView>
            </Card>
          </>
        )}

        {/* Top products */}
        {topProducts.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>TOP PRODUCTS</Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {topProducts.slice(0, 5).map((p, i) => (
                <View key={i} style={styles.rankRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankNum}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankName} numberOfLines={1}>{p.name || p.title || '—'}</Text>
                    <Text style={styles.rankSub}>
                      {(p.total_sold ?? p.units_sold ?? p.orders ?? p.orders_count ?? 0)} sold
                    </Text>
                  </View>
                  <Text style={styles.rankValue}>
                    {fmt((p.revenue ?? p.gross_revenue ?? 0) as number, '$')}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {/* Top ambassadors */}
        {topAmbassadors.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>TOP AMBASSADORS</Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              {topAmbassadors.slice(0, 5).map((a, i) => (
                <View key={i} style={styles.rankRow}>
                  <View style={[styles.rankBadge, { backgroundColor: Colors.goldDim }]}>
                    <Text style={[styles.rankNum, { color: Colors.gold }]}>{i + 1}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rankName}>{a.name || a.full_name || '—'}</Text>
                    <Text style={styles.rankSub}>
                      {fmt(a.total_sales ?? a.orders ?? a.orders_count ?? 0)} sales
                    </Text>
                  </View>
                  <Text style={styles.rankValue}>
                    {fmt((a.gross_revenue ?? a.revenue ?? a.commission ?? 0) as number, '$')}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}

        {(!data || (Object.keys(kpis).length === 0 && daily.length === 0)) && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No analytics data available</Text>
          </View>
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
  sectionLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: Spacing.sm },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chartCard: { padding: Spacing.md },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', paddingBottom: 4, minHeight: 120 },
  barCol: { alignItems: 'center', marginHorizontal: 4, width: 32 },
  bar: { width: 20, backgroundColor: Colors.gold, borderRadius: 4, marginBottom: 4 },
  barValue: { fontSize: 8, color: Colors.textMuted, marginBottom: 2 },
  barLabel: { fontSize: 9, color: Colors.textMuted },
  rankRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    gap: 10,
  },
  rankBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.bgElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  rankNum: { fontSize: 12, fontWeight: '700', color: Colors.textSecondary },
  rankName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  rankSub: { ...Typography.caption, color: Colors.textMuted },
  rankValue: { fontSize: 14, fontWeight: '700', color: Colors.gold },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textSecondary },
});

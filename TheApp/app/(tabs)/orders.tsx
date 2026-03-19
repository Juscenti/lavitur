import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Screen, Card, StatusBadge, LoadingState, ErrorState, Button, Input, SheetHandle, Divider } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

const ORDER_STATUSES = ['pending_payment','paid','processing','shipped','delivered','cancelled','refunded'];

interface OrderItem {
  id: string;
  product_title?: string;
  product_name?: string;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
}
interface Order {
  id: string; status: string; total?: number; created_at?: string;
  customer_email?: string;
  customer_name?: string;
  order_items?: OrderItem[];
}

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<Order[]>('/orders');
      setOrders(Array.isArray(res) ? res : (res as any).orders ?? []);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function openDetail(order: Order) {
    setDetailLoading(true);
    setSelected(order);
    try {
      const res = await api.get<Order>(`/orders/${order.id}`);
      setSelected(res);
    } catch {}
    setDetailLoading(false);
  }

  async function updateStatus(orderId: string, status: string) {
    setUpdating(true);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      setSelected(prev => prev ? { ...prev, status } : null);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setUpdating(false);
  }

  async function deleteOrder(orderId: string) {
    Alert.alert('Delete Order', 'This cannot be undone. Type DELETE to confirm.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/orders/${orderId}`, { confirm: 'DELETE' });
            setOrders(prev => prev.filter(o => o.id !== orderId));
            setSelected(null);
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  }

  function fmt(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Orders</Text>
        <Text style={styles.count}>{orders.length} total</Text>
      </View>

      <FlatList
        data={orders}
        keyExtractor={o => o.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.orderCard} onPress={() => openDetail(item)}>
            <View style={styles.orderTop}>
              <Text style={styles.orderId}>#{item.id.slice(0, 8)}</Text>
              <StatusBadge status={item.status} />
            </View>
            <View style={styles.orderBottom}>
              <Text style={styles.orderMeta}>{item.customer_email || item.customer_name || '—'}</Text>
              <Text style={styles.orderAmount}>{item.total != null ? `$${Number(item.total).toFixed(2)}` : '—'}</Text>
            </View>
            <Text style={styles.orderDate}>{fmt(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No orders found</Text></View>}
      />

      {/* Detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView contentContainerStyle={styles.sheet}>
            <SheetHandle />
            {selected && (
              <>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailId}>Order #{selected.id.slice(0, 12)}</Text>
                  <StatusBadge status={selected.status} />
                </View>
                <Divider style={{ marginVertical: Spacing.md }} />

                <Text style={styles.sheetLabel}>UPDATE STATUS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                  {ORDER_STATUSES.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateStatus(selected.id, s)}
                      disabled={updating}
                      style={[styles.statusChip, selected.status === s && styles.statusChipActive]}
                    >
                      <Text style={[styles.statusChipText, selected.status === s && { color: '#0A0A0F' }]}>
                        {s.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.sheetLabel}>DETAILS</Text>
                {[
                  ['Customer', selected.customer_email || selected.customer_name || '—'],
                  ['Total', selected.total != null ? `$${Number(selected.total).toFixed(2)}` : '—'],
                  ['Date', fmt(selected.created_at)],
                ].map(([k, v]) => (
                  <View key={k} style={styles.detailRow}>
                    <Text style={styles.detailKey}>{k}</Text>
                    <Text style={styles.detailVal}>{v}</Text>
                  </View>
                ))}

                {selected.order_items && selected.order_items.length > 0 && (
                  <>
                    <Text style={[styles.sheetLabel, { marginTop: Spacing.lg }]}>ITEMS</Text>
                    {selected.order_items.map((item, i) => (
                      <View key={item.id || i} style={styles.detailRow}>
                        <Text style={styles.detailKey}>{item.product_title || item.product_name || `Item ${i + 1}`}</Text>
                        <Text style={styles.detailVal}>
                          x{item.quantity ?? 1} · $
                          {item.unit_price != null
                            ? Number(item.unit_price).toFixed(2)
                            : item.line_total != null
                              ? Number(item.line_total).toFixed(2)
                              : '—'}
                        </Text>
                      </View>
                    ))}
                  </>
                )}

                <View style={styles.actions}>
                  <Button label="Delete Order" onPress={() => deleteOrder(selected.id)} variant="danger" size="sm" style={{ flex: 1 }} />
                  <Button label="Close" onPress={() => setSelected(null)} variant="ghost" size="sm" style={{ flex: 1, marginLeft: 8 }} />
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm },
  pageTitle: { ...Typography.heading, color: Colors.text },
  count: { ...Typography.caption, color: Colors.textSecondary },
  list: { padding: Spacing.lg, paddingTop: 0 },
  orderCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  orderTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  orderId: { ...Typography.bodySmall, color: Colors.textSecondary, fontFamily: 'monospace' },
  orderBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderMeta: { ...Typography.body, color: Colors.text, flex: 1, marginRight: 8 },
  orderAmount: { fontSize: 16, fontWeight: '700', color: Colors.gold },
  orderDate: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textSecondary },
  sheet: { padding: Spacing.lg, paddingBottom: 48 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailId: { ...Typography.subheading, color: Colors.text, fontFamily: 'monospace' },
  sheetLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  detailKey: { ...Typography.bodySmall, color: Colors.textSecondary },
  detailVal: { ...Typography.bodySmall, color: Colors.text, fontWeight: '500' },
  statusChip: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  statusChipText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  actions: { flexDirection: 'row', marginTop: Spacing.xl },
});

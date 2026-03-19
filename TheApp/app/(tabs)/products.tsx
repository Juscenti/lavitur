import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Alert, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { Card, StatusBadge, LoadingState, ErrorState, Button, Input, SheetHandle, Divider } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

const PRODUCT_STATUSES = ['draft', 'pending', 'published', 'archived'];

interface Product {
  id: string; name?: string; title?: string; description?: string;
  price?: number; stock?: number; status?: string; published?: boolean;
  thumbUrl?: string; category?: string; categories?: string[];
}

interface ProductForm {
  title: string; description: string; price: string;
  stock: string; categoryName: string; sizes: string;
}

const emptyForm: ProductForm = { title: '', description: '', price: '', stock: '', categoryName: '', sizes: '' };

export default function ProductsScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<Product[]>('/products');
      setProducts(Array.isArray(res) ? res : (res as any).products ?? []);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  function openEdit(p: Product) {
    const cat =
      p.category && p.category !== 'Unassigned'
        ? p.category
        : (p.categories?.[0] ?? 'Unassigned');

    setEditing(p);
    setForm({
      title: p.title || p.name || '',
      description: p.description || '',
      price: String(p.price ?? ''),
      stock: String(p.stock ?? ''),
      // Backend returns categories as a string[] plus a single `category` label.
      categoryName: (cat === 'Unassigned' ? '' : cat) || '',
      sizes: '',
    });
    setShowForm(true);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  async function save() {
    setSaving(true);
    try {
      const body = {
        title: form.title,
        description: form.description,
        price: parseFloat(form.price) || 0,
        stock: parseInt(form.stock) || 0,
        categoryName: form.categoryName || undefined,
        sizes: form.sizes ? form.sizes.split(',').map(s => s.trim()) : undefined,
      };
      if (editing) {
        await api.patch(`/products/${editing.id}`, body);
        setProducts(prev => prev.map(p => p.id === editing.id ? { ...p, ...body, name: body.title } : p));
      } else {
        const res = await api.post<{ id: string }>('/products', body);
        await load();
      }
      setShowForm(false);
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSaving(false);
  }

  async function updateStatus(productId: string, status: string) {
    try {
      await api.patch(`/products/${productId}/status`, { status });
      setProducts(prev => prev.map(p => p.id === productId ? { ...p, status } : p));
    } catch (e: any) { Alert.alert('Error', e.message); }
  }

  async function deleteProduct(productId: string) {
    Alert.alert('Delete Product', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/products/${productId}`, { confirm: 'DELETE' });
            setProducts(prev => prev.filter(p => p.id !== productId));
            setShowForm(false);
          } catch (e: any) { Alert.alert('Error', e.message); }
        },
      },
    ]);
  }

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Products</Text>
        <Button label="+ New" onPress={openCreate} size="sm" />
      </View>

      <FlatList
        data={products}
        keyExtractor={p => p.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => openEdit(item)}>
            <View style={styles.cardLeft}>
              {item.thumbUrl
                ? <Image source={{ uri: item.thumbUrl }} style={styles.thumb} />
                : <View style={[styles.thumb, styles.thumbPlaceholder]}><Text style={{ color: Colors.textMuted, fontSize: 18 }}>📦</Text></View>
              }
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.productName} numberOfLines={1}>{item.title || item.name}</Text>
              <Text style={styles.productPrice}>{item.price != null ? `$${Number(item.price).toFixed(2)}` : '—'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <StatusBadge status={item.status || 'draft'} />
                <Text style={styles.stock}>Stock: {item.stock ?? '—'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No products</Text></View>}
      />

      {/* Form modal */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <ScrollView contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled">
            <SheetHandle />
            <Text style={styles.sheetTitle}>{editing ? 'Edit Product' : 'New Product'}</Text>
            <Divider style={{ marginVertical: Spacing.md }} />

            <Input label="Title" value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))} placeholder="Product name" />
            <Input label="Description" value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))} placeholder="Description" multiline numberOfLines={3} />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Input label="Price ($)" value={form.price} onChangeText={v => setForm(f => ({ ...f, price: v }))} keyboardType="decimal-pad" placeholder="0.00" />
              </View>
              <View style={{ flex: 1 }}>
                <Input label="Stock" value={form.stock} onChangeText={v => setForm(f => ({ ...f, stock: v }))} keyboardType="numeric" placeholder="0" />
              </View>
            </View>
            <Input label="Category" value={form.categoryName} onChangeText={v => setForm(f => ({ ...f, categoryName: v }))} placeholder="e.g. Jackets" />
            <Input label="Sizes (comma-separated)" value={form.sizes} onChangeText={v => setForm(f => ({ ...f, sizes: v }))} placeholder="S, M, L, XL" />

            {editing && (
              <>
                <Text style={styles.sheetLabel}>STATUS</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.lg }}>
                  {PRODUCT_STATUSES.map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => updateStatus(editing.id, s)}
                      style={[styles.statusChip, editing.status === s && styles.statusChipActive]}
                    >
                      <Text style={[styles.statusChipText, editing.status === s && { color: '#0A0A0F' }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </>
            )}

            <View style={styles.actions}>
              <Button label={saving ? 'Saving…' : 'Save'} onPress={save} loading={saving} style={{ flex: 1 }} />
              {editing && (
                <Button label="Delete" onPress={() => deleteProduct(editing.id)} variant="danger" style={{ flex: 1, marginLeft: 8 }} />
              )}
            </View>
            <Button label="Cancel" onPress={() => setShowForm(false)} variant="ghost" style={{ marginTop: 8 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm },
  pageTitle: { ...Typography.heading, color: Colors.text },
  list: { padding: Spacing.lg, paddingTop: 0 },
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    alignItems: 'center',
    gap: 12,
  },
  cardLeft: {},
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: Colors.bgElevated },
  thumbPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productName: { ...Typography.body, color: Colors.text, fontWeight: '600' },
  productPrice: { fontSize: 15, fontWeight: '700', color: Colors.gold, marginTop: 2 },
  stock: { ...Typography.caption, color: Colors.textMuted },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textSecondary },
  sheet: { padding: Spacing.lg, paddingBottom: 48 },
  sheetTitle: { ...Typography.heading, color: Colors.text },
  sheetLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 8, marginTop: Spacing.sm },
  actions: { flexDirection: 'row', marginTop: Spacing.lg },
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
});

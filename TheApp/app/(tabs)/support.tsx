import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  Modal, ScrollView, RefreshControl, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../lib/api';
import { StatusBadge, LoadingState, ErrorState, Button, Input, SheetHandle, Divider, Card } from '../../components/ui';
import { Colors, Spacing, Typography } from '../../constants/theme';

interface Message { id: string; body: string; sender_name?: string; created_at?: string; is_internal_note?: boolean; }
interface Ticket {
  id: string; subject?: string; status?: string; priority?: string;
  category?: string; created_at?: string; user_email?: string;
  user_name?: string;
}

export default function SupportScreen() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await api.get<{ tickets: Ticket[]; summary?: any }>(`/support/tickets${filterStatus ? `?status=${filterStatus}` : ''}`);
      setTickets(res.tickets ?? []);
      setError('');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); setRefreshing(false); }
  }

  async function openTicket(t: Ticket) {
    try {
      const res = await api.get<{ ticket: Ticket; messages: Message[] }>(`/support/tickets/${t.id}`);
      setSelected(res.ticket);
      setMessages(res.messages ?? []);
    } catch { setSelected(t); setMessages([]); }
  }

  async function sendReply() {
    if (!selected || !replyText.trim()) return;
    setSending(true);
    try {
      const res = await api.post<Message>(`/support/tickets/${selected.id}/messages`, { body: replyText.trim() });
      setMessages(prev => [...prev, res]);
      setReplyText('');
    } catch (e: any) { Alert.alert('Error', e.message); }
    setSending(false);
  }

  async function updateTicket(field: string, value: string) {
    if (!selected) return;
    try {
      const updated = await api.patch<Ticket>(`/support/tickets/${selected.id}`, { [field]: value });
      setSelected(updated);
      setTickets(prev => prev.map(t => t.id === selected.id ? { ...t, [field]: value } : t));
    } catch (e: any) { Alert.alert('Error', e.message); }
  }

  function fmt(d?: string) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const statuses = ['', 'open', 'resolved', 'closed'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const ticketStatuses = ['open', 'resolved', 'closed'];

  if (loading) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.topBar}>
        <Text style={styles.pageTitle}>Support</Text>
        <Text style={styles.count}>{tickets.length} tickets</Text>
      </View>

      {/* Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={{ paddingHorizontal: Spacing.lg }}>
        {statuses.map(s => (
          <TouchableOpacity
            key={s || 'all'}
            style={[styles.filterChip, filterStatus === s && styles.filterChipActive]}
            onPress={() => { setFilterStatus(s); setTimeout(load, 100); }}
          >
            <Text style={[styles.filterText, filterStatus === s && { color: '#0A0A0F' }]}>{s || 'All'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={tickets}
        keyExtractor={t => t.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.gold} />}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.ticketCard} onPress={() => openTicket(item)}>
            <View style={styles.ticketTop}>
              <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject || 'No subject'}</Text>
              <StatusBadge status={item.status || 'open'} />
            </View>
            <View style={styles.ticketBottom}>
              <Text style={styles.ticketMeta}>{item.user_name || item.user_email || '—'}</Text>
              {item.priority && <StatusBadge status={item.priority} />}
            </View>
            <Text style={styles.ticketDate}>{fmt(item.created_at)}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No tickets</Text></View>}
      />

      {/* Ticket detail modal */}
      <Modal visible={!!selected} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
          <View style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={styles.sheet}>
              <SheetHandle />
              {selected && (
                <>
                  <Text style={styles.sheetTitle} numberOfLines={2}>{selected.subject || 'Ticket'}</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                    <StatusBadge status={selected.status || 'open'} />
                    {selected.priority && <StatusBadge status={selected.priority} />}
                  </View>
                  <Divider style={{ marginVertical: Spacing.md }} />

                  {/* Status update */}
                  <Text style={styles.sheetLabel}>STATUS</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                    {ticketStatuses.map(s => (
                      <TouchableOpacity
                        key={s}
                        onPress={() => updateTicket('status', s)}
                        style={[styles.statusChip, selected.status === s && styles.statusChipActive]}
                      >
                        <Text style={[styles.statusChipText, selected.status === s && { color: '#0A0A0F' }]}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Priority */}
                  <Text style={styles.sheetLabel}>PRIORITY</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: Spacing.md }}>
                    {priorities.map(p => (
                      <TouchableOpacity
                        key={p}
                        onPress={() => updateTicket('priority', p)}
                        style={[styles.statusChip, selected.priority === p && styles.statusChipActive]}
                      >
                        <Text style={[styles.statusChipText, selected.priority === p && { color: '#0A0A0F' }]}>{p}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Messages */}
                  <Text style={styles.sheetLabel}>CONVERSATION</Text>
                  {messages.length === 0 && <Text style={styles.emptyText}>No messages yet</Text>}
                  {messages.map(m => (
                    <View key={m.id} style={[styles.message, m.is_internal_note && styles.noteMessage]}>
                      <View style={styles.msgHeader}>
                        <Text style={styles.msgSender}>{m.sender_name || 'User'}</Text>
                        {m.is_internal_note && <Text style={styles.noteLabel}>Internal</Text>}
                        <Text style={styles.msgDate}>{fmt(m.created_at)}</Text>
                      </View>
                      <Text style={styles.msgBody}>{m.body}</Text>
                    </View>
                  ))}
                </>
              )}
            </ScrollView>

            {/* Reply box */}
            <View style={styles.replyBox}>
              <TextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Write a reply…"
                placeholderTextColor={Colors.textMuted}
                style={styles.replyInput}
                multiline
              />
              <Button label="Send" onPress={sendReply} loading={sending} size="sm" style={{ alignSelf: 'flex-end', marginTop: 8 }} />
              <Button label="Close" onPress={() => setSelected(null)} variant="ghost" size="sm" style={{ alignSelf: 'flex-end', marginTop: 4 }} />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, paddingBottom: Spacing.sm },
  pageTitle: { ...Typography.heading, color: Colors.text },
  count: { ...Typography.caption, color: Colors.textSecondary },
  filters: { marginBottom: Spacing.sm },
  filterChip: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.text, textTransform: 'capitalize' },
  list: { padding: Spacing.lg, paddingTop: 4 },
  ticketCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ticketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  ticketSubject: { ...Typography.body, color: Colors.text, fontWeight: '600', flex: 1, marginRight: 8 },
  ticketBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ticketMeta: { ...Typography.bodySmall, color: Colors.textSecondary },
  ticketDate: { ...Typography.caption, color: Colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 48 },
  emptyText: { color: Colors.textSecondary, fontSize: 13 },
  sheet: { padding: Spacing.lg, paddingBottom: 16 },
  sheetTitle: { ...Typography.subheading, color: Colors.text },
  sheetLabel: { ...Typography.caption, color: Colors.textMuted, marginBottom: 8 },
  statusChip: {
    backgroundColor: Colors.bgElevated, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6, marginRight: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  statusChipActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  statusChipText: { fontSize: 12, fontWeight: '600', color: Colors.text },
  message: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noteMessage: { borderColor: Colors.goldDim, backgroundColor: Colors.goldDim + '20' },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  msgSender: { ...Typography.caption, color: Colors.gold, fontWeight: '700' },
  noteLabel: { ...Typography.caption, color: Colors.goldLight },
  msgDate: { ...Typography.caption, color: Colors.textMuted },
  msgBody: { ...Typography.bodySmall, color: Colors.text, lineHeight: 18 },
  replyBox: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  replyInput: {
    backgroundColor: Colors.bgElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    minHeight: 64,
    textAlignVertical: 'top',
  },
});

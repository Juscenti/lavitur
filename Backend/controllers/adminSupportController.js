// Backend/controllers/adminSupportController.js
import { supabaseAdmin } from '../config/supabase.js';

async function attachUserAndAssigneeNames(tickets) {
  const userIds = [...new Set((tickets || []).map((t) => t.user_id).filter(Boolean))];
  const assigneeIds = [...new Set((tickets || []).map((t) => t.assignee_profile_id).filter(Boolean))];
  const allIds = [...new Set([...userIds, ...assigneeIds])];
  if (allIds.length === 0) return tickets.map((t) => ({ ...t, user_name: null, assignee_name: null }));

  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', allIds);
  const byId = (profiles || []).reduce((acc, p) => {
    acc[p.id] = p.full_name || p.email || '—';
    return acc;
  }, {});

  return tickets.map((t) => ({
    ...t,
    user_name: t.user_id ? byId[t.user_id] : null,
    assignee_name: t.assignee_profile_id ? byId[t.assignee_profile_id] : null,
  }));
}

export async function listTickets(req, res) {
  try {
    const { status, q, priority, category } = req.query;

    let query = supabaseAdmin
      .from('support_tickets')
      .select('id, subject, status, priority, category, source, order_id, user_id, assignee_profile_id, created_at, updated_at, closed_at')
      .order('created_at', { ascending: false })
      .limit(200);

    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (category) query = query.eq('category', category);
    if (q) {
      const term = `%${q.trim()}%`;
      query = query.or(`subject.ilike.${term},id.ilike.${term}`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const tickets = await attachUserAndAssigneeNames(data || []);

    const summary = {
      open: (data || []).filter((t) => t.status === 'open').length,
      pending: (data || []).filter((t) => t.status === 'pending').length,
      resolved_7d: (data || []).filter((t) => t.status === 'resolved').length,
      closed: (data || []).filter((t) => t.status === 'closed').length,
    };

    res.json({ summary, tickets });
  } catch (err) {
    console.error('listTickets:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch support tickets' });
  }
}

export async function getTicket(req, res) {
  try {
    const { id } = req.params;

    const { data: ticket, error: ticketErr } = await supabaseAdmin
      .from('support_tickets')
      .select('*')
      .eq('id', id)
      .single();

    if (ticketErr || !ticket) return res.status(404).json({ error: 'Ticket not found' });

    const [enriched] = await attachUserAndAssigneeNames([ticket]);

    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('support_messages')
      .select('id, ticket_id, sender_type, sender_profile_id, body, is_internal_note, created_at')
      .eq('ticket_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    const profileIds = [...new Set((messages || []).map((m) => m.sender_profile_id).filter(Boolean))];
    let senderNames = {};
    if (profileIds.length > 0) {
      const { data: profs } = await supabaseAdmin.from('profiles').select('id, full_name, email').in('id', profileIds);
      (profs || []).forEach((p) => { senderNames[p.id] = p.full_name || p.email || 'Staff'; });
    }

    const messagesWithSender = (messages || []).map((m) => ({
      ...m,
      sender_name: m.sender_profile_id ? senderNames[m.sender_profile_id] : (m.sender_type === 'customer' ? 'Customer' : 'System'),
    }));

    res.json({ ticket: enriched, messages: messagesWithSender });
  } catch (err) {
    console.error('getTicket:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch ticket' });
  }
}

export async function updateTicket(req, res) {
  try {
    const { id } = req.params;
    const { status, priority, assignee_profile_id, category } = req.body || {};

    const payload = {};
    if (status !== undefined) payload.status = String(status);
    if (priority !== undefined) payload.priority = String(priority);
    if (assignee_profile_id !== undefined) payload.assignee_profile_id = assignee_profile_id || null;
    if (category !== undefined) payload.category = category || null;

    if (Object.keys(payload).length === 0) return res.status(400).json({ error: 'No fields to update' });

    const { data, error } = await supabaseAdmin
      .from('support_tickets')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Ticket not found' });
      throw error;
    }

    const [enriched] = await attachUserAndAssigneeNames([data]);
    res.json(enriched);
  } catch (err) {
    console.error('updateTicket:', err);
    res.status(500).json({ error: err.message || 'Failed to update ticket' });
  }
}

export async function addMessage(req, res) {
  try {
    const { id: ticketId } = req.params;
    const { body, is_internal_note } = req.body || {};
    const profileId = req.userId;

    if (!body || !String(body).trim()) return res.status(400).json({ error: 'Message body is required' });

    const { data: ticket, error: ticketErr } = await supabaseAdmin.from('support_tickets').select('id').eq('id', ticketId).single();
    if (ticketErr || !ticket) return res.status(404).json({ error: 'Ticket not found' });

    const { data: msg, error } = await supabaseAdmin
      .from('support_messages')
      .insert({
        ticket_id: ticketId,
        sender_type: 'staff',
        sender_profile_id: profileId,
        body: String(body).trim(),
        is_internal_note: !!is_internal_note,
      })
      .select()
      .single();

    if (error) throw error;

    await supabaseAdmin.from('support_tickets').update({ updated_at: new Date().toISOString() }).eq('id', ticketId);

    const { data: prof } = await supabaseAdmin.from('profiles').select('full_name, email').eq('id', profileId).single();
    const senderName = prof?.full_name || prof?.email || 'Staff';

    res.status(201).json({ ...msg, sender_name: senderName });
  } catch (err) {
    console.error('addMessage:', err);
    res.status(500).json({ error: err.message || 'Failed to add message' });
  }
}

export async function getSupportTeam(req, res) {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .in('role', ['admin', 'representative'])
      .order('full_name');

    if (error) throw error;
    const list = (data || []).map((p) => ({ id: p.id, name: p.full_name || p.email || p.id }));
    res.json(list);
  } catch (err) {
    console.error('getSupportTeam:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch team' });
  }
}


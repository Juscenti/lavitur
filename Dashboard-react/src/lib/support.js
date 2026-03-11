import { api } from './api.js';

export async function listTickets(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.status) searchParams.set('status', params.status);
  if (params.priority) searchParams.set('priority', params.priority);
  if (params.category) searchParams.set('category', params.category);
  if (params.q) searchParams.set('q', params.q);
  const res = await api.get(`/admin/support/tickets?${searchParams.toString()}`);
  return { summary: res.summary, tickets: res.tickets || [] };
}

export async function getSupportTeam() {
  return api.get('/admin/support/team');
}

export async function getTicket(id) {
  return api.get(`/admin/support/tickets/${id}`);
}

export async function updateTicket(id, payload) {
  return api.patch(`/admin/support/tickets/${id}`, payload);
}

export async function addMessage(ticketId, { body, is_internal_note = false }) {
  return api.post(`/admin/support/tickets/${ticketId}/messages`, { body, is_internal_note });
}

import { api } from './api.js';

export async function listContentBlocks(params = {}) {
  const searchParams = new URLSearchParams();
  if (params.type) searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search.trim());
  const qs = searchParams.toString();
  const data = await api.get(`/admin/content-blocks${qs ? `?${qs}` : ''}`);
  return data?.items ?? [];
}

export async function getContentBlock(id) {
  return api.get(`/admin/content-blocks/${id}`);
}

export async function createContentBlock(payload) {
  return api.post('/admin/content-blocks', payload);
}

export async function updateContentBlock(id, payload) {
  return api.patch(`/admin/content-blocks/${id}`, payload);
}

export async function deleteContentBlock(id) {
  return api.delete(`/admin/content-blocks/${id}`);
}

export async function reorderContentBlocks(order) {
  return api.patch('/admin/content-blocks/reorder', { order });
}

export async function uploadContentImage(file) {
  const form = new FormData();
  form.append('file', file);
  const data = await api.upload('/admin/content-blocks/upload-image', form);
  return data?.url ?? '';
}

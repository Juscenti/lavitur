import { api } from './api.js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';

export async function listProductMedia(productId) {
  const data = await api.get(`/admin/products/${productId}/media`);
  return Array.isArray(data) ? data : [];
}

export async function uploadProductMedia(productId, files, { makeFirstImagePrimary = false } = {}) {
  const form = new FormData();
  for (const file of files) form.append('files', file);
  if (makeFirstImagePrimary) form.append('makeFirstImagePrimary', 'true');
  const data = await api.upload(`/admin/products/${productId}/media`, form);
  return Array.isArray(data) ? data : [];
}

export async function deleteProductMedia(mediaRow) {
  await api.delete(`/admin/products/${mediaRow.product_id}/media/${mediaRow.id}`);
}

export async function setPrimaryMedia(productId, mediaId) {
  await api.patch(`/admin/products/${productId}/media/${mediaId}/primary`);
}

export function publicMediaUrl(filePath) {
  if (!filePath) return '';
  const base = (SUPABASE_URL || '').replace(/\/$/, '');
  return base ? `${base}/storage/v1/object/public/product-media/${filePath}` : '';
}

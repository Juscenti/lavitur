// admin-panel/js/productMedia.js — uses REST API for product media
import { api } from "./api.js";

/** Media list from API includes public_url */
export async function listProductMedia(productId) {
  const data = await api.get(`/admin/products/${productId}/media`);
  return Array.isArray(data) ? data : [];
}

/** Upload files via API (multipart). Option: makeFirstImagePrimary */
export async function uploadProductMedia(productId, files, { makeFirstImagePrimary = false } = {}) {
  const form = new FormData();
  for (const file of files) form.append("files", file);
  if (makeFirstImagePrimary) form.append("makeFirstImagePrimary", "true");
  const data = await api.upload(`/admin/products/${productId}/media`, form);
  return Array.isArray(data) ? data : [];
}

export async function deleteProductMedia(mediaRow) {
  await api.delete(`/admin/products/${mediaRow.product_id}/media/${mediaRow.id}`);
}

export async function setPrimaryMedia(productId, mediaId) {
  await api.patch(`/admin/products/${productId}/media/${mediaId}/primary`);
}

/** Fallback when only file_path is available (API responses include public_url) */
export function publicMediaUrl(filePath) {
  if (!filePath) return "";
  const base = typeof window !== "undefined" && window.API_BASE ? window.API_BASE : "";
  return `${base}/storage/v1/object/public/product-media/${filePath}`;
}

import { api } from './api.js';

/**
 * Fetch active content blocks for the storefront (public API).
 * @param {string} [page] - e.g. 'home' to get blocks for the home page
 * @returns {Promise<Array>}
 */
export async function fetchPublicContentBlocks(page = 'home') {
  const qs = page ? `?page=${encodeURIComponent(page)}` : '';
  const data = await api.get(`/content-blocks${qs}`);
  return Array.isArray(data) ? data : [];
}

/**
 * api.js — Fetch wrapper for the BFHL API.
 *
 * Provides a typed, timeout-aware, error-normalizing wrapper around fetch.
 * All callers receive either a resolved payload or a thrown Error with
 * a human-readable message — no raw fetch errors escape.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
const REQUEST_TIMEOUT_MS = 10_000;

/**
 * POST /bfhl with the given edge array.
 *
 * @param {string[]} edges - Array of edge strings to submit.
 * @returns {Promise<Object>} Parsed JSON response from the API.
 * @throws {Error} With user-friendly message on network error, timeout, or 4xx/5xx.
 */
export async function submitEdges(edges) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}/bfhl`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: edges }),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => null);

    if (!response.ok) {
      const message = json?.error ?? `API returned ${response.status}`;
      throw new Error(message);
    }

    return json;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out after 10 seconds. Is the API reachable?');
    }
    // Re-throw errors we've already constructed, normalise native fetch errors.
    if (err instanceof Error) throw err;
    throw new Error('Unknown network error. Check your connection.');
  } finally {
    clearTimeout(timeoutId);
  }
}

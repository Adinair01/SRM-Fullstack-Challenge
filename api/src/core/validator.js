/**
 * validator.js — Step 1 of the processEdges pipeline.
 *
 * Responsibilities:
 *  - Trim each raw entry.
 *  - Reject empty strings, non-matching patterns, and self-loops.
 *
 * Contract:
 *   validate(rawData: string[]) -> { valid: string[], invalid: string[] }
 *
 * "valid" contains trimmed, pattern-matched, non-self-loop edges.
 * "invalid" contains the TRIMMED form of each rejected entry (spec §Step 1 note).
 *
 * Order: invalid_entries preserves input order of first occurrence.
 */

/** Exact pattern required by spec: single uppercase letter, ->, single uppercase letter. */
const EDGE_PATTERN = /^[A-Z]->[A-Z]$/;

/**
 * Validates a single raw entry string.
 * Returns { trimmed, ok, reason } where ok=false means invalid.
 *
 * @param {string} raw - The raw string from the input array.
 * @returns {{ trimmed: string, ok: boolean, reason?: string }}
 */
function validateEntry(raw) {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { trimmed, ok: false, reason: 'empty' };
  }

  if (!EDGE_PATTERN.test(trimmed)) {
    return { trimmed, ok: false, reason: 'pattern_mismatch' };
  }

  const [src, dst] = [trimmed[0], trimmed[3]];
  if (src === dst) {
    return { trimmed, ok: false, reason: 'self_loop' };
  }

  return { trimmed, ok: true };
}

/**
 * Partition an array of raw strings into valid and invalid edge sets.
 * Validation order strictly follows the spec's 4-substep sequence.
 *
 * @param {string[]} rawData - Array of raw input strings.
 * @returns {{ valid: string[], invalid: string[] }}
 */
export function validate(rawData) {
  const valid = [];
  const invalid = [];

  for (const raw of rawData) {
    const { trimmed, ok } = validateEntry(raw);
    if (ok) {
      valid.push(trimmed);
    } else {
      invalid.push(trimmed);
    }
  }

  return { valid, invalid };
}

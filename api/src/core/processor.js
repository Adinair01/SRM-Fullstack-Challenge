/**
 * processor.js — Top-level orchestrator for the BFHL edge-processing pipeline.
 *
 * This is the single entry point for all business logic. It is intentionally
 * decoupled from Express so it can be unit-tested in isolation without
 * spinning up an HTTP server.
 *
 * Pipeline steps (per spec):
 *  Step 1  — Validation       (validator.js)
 *  Step 2  — Deduplication    (graph.js)
 *  Step 3  — Graph Build      (graph.js)
 *  Step 4  — Component Group  (graph.js)
 *  Step 5  — Cycle Detection  (emitter.js)
 *  Step 6  — Emit Hierarchy   (emitter.js)
 *  Step 7  — Summary          (emitter.js)
 *  Step 8  — Ordering         (emitter.js + preserved input order)
 *
 * @module processor
 */

import { validate } from './validator.js';
import { buildGraph } from './graph.js';
import { emitHierarchies } from './emitter.js';
import IDENTITY from '../config/identity.js';

/**
 * @typedef {Object} ProcessResult
 * @property {string}   user_id
 * @property {string}   email_id
 * @property {string}   college_roll_number
 * @property {Array}    hierarchies
 * @property {string[]} invalid_entries
 * @property {string[]} duplicate_edges
 * @property {Object}   summary
 */

/**
 * Pure orchestrator function: takes raw input data and returns the complete
 * BFHL API response payload.
 *
 * This function has no side effects and does not touch Express request/response
 * objects — making it trivially unit-testable.
 *
 * @param {string[]} rawData - The `data` array from the request body.
 * @returns {ProcessResult}
 */
export function processEdges(rawData) {
  // Step 1 — Validate & partition into valid / invalid.
  const { valid: validEdges, invalid: invalidEntries } = validate(rawData);

  // Steps 2–4 — Deduplicate, build graph, group components.
  const { duplicateEdges, adjacency, parentByChild, components } =
    buildGraph(validEdges);

  // Steps 5–8 — Classify, emit, summarise, sort.
  const { hierarchies, summary } = emitHierarchies(
    components,
    adjacency,
    parentByChild,
  );

  return {
    ...IDENTITY,
    hierarchies,
    invalid_entries: invalidEntries,
    duplicate_edges: duplicateEdges,
    summary,
  };
}

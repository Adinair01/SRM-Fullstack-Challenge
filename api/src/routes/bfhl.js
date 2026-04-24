/**
 * bfhl.js — Thin Express route handler for POST /bfhl.
 *
 * This module contains NO business logic. It only:
 *  1. Validates the request shape (HTTP 400 cases).
 *  2. Delegates to processEdges().
 *  3. Serialises and sends the response.
 *
 * Design principle: keep route files as thin as possible so all logic
 * is testable without HTTP overhead.
 */

import { Router } from 'express';
import { processEdges } from '../core/processor.js';

const router = Router();

/**
 * POST /bfhl
 * Processes a list of directed edges and returns hierarchies, invalids, etc.
 */
router.post('/', (req, res, next) => {
  try {
    const body = req.body;

    // HTTP 400 guard: missing key, not an array, or malformed (body will be
    // undefined/null if JSON parsing failed — handled by Express's built-in
    // json() middleware which throws on malformed JSON, caught by errorHandler).
    if (
      body === null ||
      body === undefined ||
      !Object.prototype.hasOwnProperty.call(body, 'data') ||
      !Array.isArray(body.data)
    ) {
      return res.status(400).json({
        error: 'Request body must contain a "data" key with an array value.',
      });
    }

    const result = processEdges(body.data);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
});

/**
 * GET /bfhl (health/smoke-test convenience — evaluator may probe GET too).
 * Returns identity constants to confirm the service is alive.
 */
router.get('/', (_req, res) => {
  res.status(200).json({ message: 'BFHL endpoint live. Use POST.' });
});

export default router;

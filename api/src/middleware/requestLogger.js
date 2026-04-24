/**
 * requestLogger.js — Pino-based structured request/response logger.
 *
 * Attaches a unique request_id to each request and logs:
 *  - method, url, statusCode, duration_ms
 *  - valid_count / invalid_count (extracted from response body for /bfhl)
 *
 * Completely suppressed in test environment to keep test output clean.
 */

import pino from 'pino';
import pinoHttp from 'pino-http';
import { randomUUID } from 'crypto';

const isTest = process.env.NODE_ENV === 'test';

/** Shared pino logger instance. */
export const logger = pino({
  enabled: !isTest,
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
});

/**
 * Express middleware: structured HTTP request logging via pino-http.
 * Assigns a UUID request_id to every request.
 */
export const requestLogger = pinoHttp({
  logger,
  enabled: !isTest,
  genReqId: () => randomUUID(),
  customSuccessMessage: (req, res) =>
    `${req.method} ${req.url} completed with ${res.statusCode}`,
  customErrorMessage: (req, res, err) =>
    `${req.method} ${req.url} errored: ${err.message}`,
});

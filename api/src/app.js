/**
 * app.js — Express application factory.
 *
 * Returns a configured Express app WITHOUT calling app.listen().
 * This separation makes the app importable by supertest in integration tests
 * without binding to a port.
 */

import express from 'express';
import cors from 'cors';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import bfhlRouter from './routes/bfhl.js';

/**
 * Create and configure the Express application.
 * @returns {import('express').Application}
 */
export function createApp() {
  const app = express();

  // CORS: evaluator hits from unknown origins; allow all.
  app.use(
    cors({
      origin: '*',
      methods: ['POST', 'GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  // Body parsing — strict JSON only.
  app.use(express.json());

  // Structured request logging (suppressed in test).
  app.use(requestLogger);

  // Health check — used by Render for cold-start warmup probes.
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  // Primary endpoint.
  app.use('/bfhl', bfhlRouter);

  // 404 catch-all.
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
  });

  // Central error handler — MUST be last.
  app.use(errorHandler);

  return app;
}

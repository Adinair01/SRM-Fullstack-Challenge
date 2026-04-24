/**
 * errorHandler.js — Centralised Express error-handling middleware.
 *
 * Must be registered LAST in the middleware chain (after all routes).
 * Never leaks stack traces to the client in production.
 *
 * Handles:
 *  - SyntaxError from express.json() (malformed JSON body) → 400
 *  - All other errors → 500
 */

/**
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
  // Malformed JSON body: express.json() throws SyntaxError.
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({ error: 'Malformed JSON in request body.' });
  }

  const isDev = process.env.NODE_ENV !== 'production';

  // Log to stderr in all envs (pino handles it in production).
  if (isDev) {
    console.error('[errorHandler]', err);
  }

  return res.status(500).json({
    error: 'Internal server error.',
    ...(isDev && { detail: err.message }),
  });
}

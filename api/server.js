/**
 * server.js — Production entry point.
 *
 * Imports the app factory and starts listening.
 * Render provides PORT via environment; default to 3001 locally.
 */

import { createApp } from './src/app.js';

const PORT = parseInt(process.env.PORT || '3001', 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] BFHL API listening on port ${PORT}`);
});

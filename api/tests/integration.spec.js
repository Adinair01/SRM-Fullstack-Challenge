/**
 * integration.spec.js — Supertest integration tests against the Express app.
 *
 * Tests the full HTTP stack: routing, body parsing, CORS, error handling.
 * Does NOT bind a real port (supertest handles that internally).
 */

import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('POST /bfhl — HTTP contract', () => {
  it('returns 200 with valid data', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['A->B', 'B->C'] })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.hierarchies).toHaveLength(1);
    expect(res.body.user_id).toBe('aditya_nair_101052005');
  });

  it('returns 200 with empty data array', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: [] })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.hierarchies).toEqual([]);
  });

  it('returns 400 when data key is missing', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ edges: ['A->B'] })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when data is not an array', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: 'A->B' })
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(400);
  });

  it('returns 400 on malformed JSON body', async () => {
    const res = await request(app)
      .post('/bfhl')
      .set('Content-Type', 'application/json')
      .send('{bad json}');

    expect(res.status).toBe(400);
  });

  it('returns 200 even when ALL entries are invalid', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: ['bad', '123', 'A->A'] });

    expect(res.status).toBe(200);
    expect(res.body.invalid_entries.length).toBeGreaterThan(0);
    expect(res.body.hierarchies).toEqual([]);
  });
});

describe('GET /health', () => {
  it('returns status ok and uptime', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('GET /bfhl', () => {
  it('returns a friendly message', async () => {
    const res = await request(app).get('/bfhl');
    expect(res.status).toBe(200);
  });
});

describe('POST /bfhl — CORS headers', () => {
  it('includes Access-Control-Allow-Origin: *', async () => {
    const res = await request(app)
      .post('/bfhl')
      .send({ data: [] })
      .set('Origin', 'https://unknown-evaluator.com');

    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});

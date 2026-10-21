import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../src/app.js';

let server;
let baseUrl;

// Start the API on a random free port before the tests.
before(async () => {
  server = createApp().listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

// Stop the API after the tests.
after(() => server.close());

test('GET /health returns status ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });
});

test('GET /api/flowers returns the catalog', async () => {
  const res = await fetch(`${baseUrl}/api/flowers`);
  const body = await res.json();
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(body));
  assert.ok(body.length > 0);
  assert.ok(body.every((f) => f.id && f.name && typeof f.price === 'number'));
});

test('GET /api/flowers/:id returns one flower', async () => {
  const res = await fetch(`${baseUrl}/api/flowers/1`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).name, 'Red Rose');
});

test('GET /api/flowers/:id returns 404 for unknown id', async () => {
  const res = await fetch(`${baseUrl}/api/flowers/999`);
  assert.equal(res.status, 404);
});

test('unknown route returns 404', async () => {
  const res = await fetch(`${baseUrl}/nope`);
  assert.equal(res.status, 404);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import checkRoute from '../src/routes/checkRoute.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/check-url', checkRoute);
  return app;
}

test('returns 400 when URL is missing', async () => {
  const app = createApp();
  const response = await request(app).post('/api/check-url').send({});
  assert.equal(response.status, 400);
  assert.match(response.body.message, /Thiếu URL/);
});

test('classifies a simple https URL as safe', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/check-url')
    .send({ url: 'https://example.com' });
  assert.equal(response.status, 200);
  assert.equal(response.body.url, 'https://example.com');
  assert.equal(response.body.verdict, 'safe');
  assert.ok(typeof response.body.score === 'number');
  assert.ok(Array.isArray(response.body.reasons));
});

test('combines ML score with heuristic verdicts for dangerous URLs', async () => {
  const app = createApp();
  const response = await request(app)
    .post('/api/check-url')
    .send({
      url: 'http://login.evil-banking-secure.com@attackers.ru/secure',
      heuristicVerdict: 'warning',
      heuristicScore: 0.72,
      heuristicFeatures: { punycode: true }
    });
  assert.equal(response.status, 200);
  assert.equal(response.body.verdict, 'danger');
  assert.ok(
    response.body.reasons.some((reason) =>
      reason.includes('Heuristic extension: warning (score 0.72)')
    )
  );
  assert.ok(
    response.body.reasons.some((reason) => reason.includes('Heuristic kích hoạt: punycode'))
  );
});

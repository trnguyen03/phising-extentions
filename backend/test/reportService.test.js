import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';

test('persistReport stores data in a custom REPORTS_PATH', async (t) => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'phishguard-test-'));
  const reportsFile = path.join(tempDir, 'reports.json');
  process.env.REPORTS_PATH = reportsFile;

  t.after(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
    delete process.env.REPORTS_PATH;
  });

  const serviceModule = await import('../src/services/reportService.js');

  const record = await serviceModule.persistReport({
    url: 'https://malicious.test',
    notes: 'người dùng báo cáo',
    verdict: 'danger',
    score: 0.87
  });

  assert.equal(record.url, 'https://malicious.test');
  assert.ok(record.reportedAt);

  const stored = await serviceModule.listReports();
  assert.equal(stored.length, 1);
  assert.equal(stored[0].url, 'https://malicious.test');
  assert.equal(stored[0].notes, 'người dùng báo cáo');
});

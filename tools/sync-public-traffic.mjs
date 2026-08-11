#!/usr/bin/env node
/**
 * Fetch the public site's traffic summary into the owner's private runtime.
 *
 * Egress lives in tools/, never in src/: verify-security-boundaries asserts the
 * workbench source makes no network calls, and the workbench CSP is
 * connect-src 'self'. So the dashboard cannot fetch the public site directly —
 * this writes a snapshot and the dashboard reads that.
 *
 *   ANALYTICS_READ_TOKEN=… node tools/sync-public-traffic.mjs
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const origin = (process.env.PUBLIC_SITE_ORIGIN ?? 'https://7x84grz8mb.coze.site').replace(/\/$/, '');
const token = process.env.ANALYTICS_READ_TOKEN;

if (!token) {
  console.error('需要 ANALYTICS_READ_TOKEN。它在 Coze 项目的环境变量里。');
  process.exit(1);
}

const response = await fetch(`${origin}/api/site/summary`, {
  headers: { Authorization: `Bearer ${token}` },
});

if (response.status === 404) {
  console.error('令牌不对，或线上没有配 ANALYTICS_READ_TOKEN。');
  process.exit(1);
}
if (!response.ok) {
  console.error(`读取失败：HTTP ${response.status}`);
  process.exit(1);
}

const data = await response.json();
const directory = resolve(process.env.LOCAL_DATA_DIR ?? resolve(process.cwd(), 'private-runtime'));
mkdirSync(directory, { recursive: true, mode: 0o700 });

const snapshot = {
  schema_version: 'handx-public-traffic-1.0',
  origin,
  synced_at: new Date().toISOString(),
  days: data.days ?? 30,
  rows: Array.isArray(data.rows) ? data.rows : [],
};
const target = join(directory, 'public-traffic.json');
writeFileSync(target, `${JSON.stringify(snapshot, null, 2)}\n`, { mode: 0o600 });

const views = snapshot.rows.reduce((sum, row) => sum + (Number(row.views) || 0), 0);
console.log(
  JSON.stringify({ status: 'ok', rows: snapshot.rows.length, views, synced_at: snapshot.synced_at }, null, 2),
);

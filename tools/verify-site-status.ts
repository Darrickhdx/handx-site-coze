import { timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildSiteStatus, serializeSiteStatus } from './build-site-status';

type JsonObject = Record<string, unknown>;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = resolve(repoRoot, 'src/data/site-status.json');
const browserPath = resolve(repoRoot, 'public/data/site-status.json');

function fail(message: string): never {
  throw new Error(`site-status verification failed: ${message}`);
}

function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function equalBytes(left: Buffer, right: Buffer): boolean {
  return left.length === right.length && timingSafeEqual(left, right);
}

const expected = Buffer.from(serializeSiteStatus(buildSiteStatus()), 'utf8');
const source = readFileSync(sourcePath);
const browser = readFileSync(browserPath);

if (!equalBytes(source, expected)) {
  fail('src/data/site-status.json is stale; run tools/build-site-status.ts');
}
if (!equalBytes(browser, expected)) {
  fail('public/data/site-status.json is stale or differs from the source contract');
}

const status = asObject(JSON.parse(source.toString('utf8')) as unknown, 'site status');
const machine = asObject(status.machine_contract, 'machine contract');
const expectedMachineContract: JsonObject = {
  service_mode: 'research_interview_only',
  uploads: false,
  model_processing: 'off',
  external_egress: 'deny',
  auto_fact_generation: false,
  payment: false,
  auto_publish: false,
  must_not_deploy: true,
  deployment_authorized: false,
};

if (JSON.stringify(machine) !== JSON.stringify(expectedMachineContract)) {
  fail('machine contract is not the fixed local-only contract');
}

const boundary = asObject(status.evidence_boundary, 'evidence boundary');
if (
  boundary.historical_completion_percentage !== null ||
  boundary.historical_counts_are_inventory_not_completion !== true ||
  boundary.mission_counts_are_execution_baseline_not_historical_facts !== true
) {
  fail('historical completion boundary was weakened');
}

const serialized = source.toString('utf8').toLowerCase();
for (const forbidden of [
  '/users/',
  '/home/',
  'file://',
  'private-runtime',
  'oauth_token',
  'appsecret',
  'bearer ',
  'localhost',
  '127.0.0.1',
]) {
  if (serialized.includes(forbidden)) fail(`forbidden fragment found: ${forbidden}`);
}

if (
  /"completion[_-]?rate"\s*:/u.test(serialized) ||
  /(?:历史|研究)[^。\n]{0,24}\d+(?:\.\d+)?\s*%/u.test(serialized)
) {
  fail('contract must not expose a numeric historical completion rate');
}

process.stdout.write('site-status: deterministic contract, fixed gates, and public twin verified\n');

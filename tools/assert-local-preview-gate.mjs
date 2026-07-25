#!/usr/bin/env node

import { closeSync, constants, fstatSync, openSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { fileURLToPath } from 'node:url';

const defaultProjectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const strictGenerationId = /^gen-[0-9a-f]{64}$/;
const strictSha256 = /^[0-9a-f]{64}$/;

function parseArgs(argv) {
  if (argv.length === 0) return { projectRoot: defaultProjectRoot };
  if (argv.length === 2 && argv[0] === '--project-root' && argv[1]) {
    return { projectRoot: resolve(argv[1]) };
  }
  throw new Error('usage: assert-local-preview-gate.mjs [--project-root PATH]');
}

function readRegularOnce(path) {
  const descriptor = openSync(path, constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0));
  try {
    const before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile()) throw new Error(`${path} is not an ordinary file`);
    const payload = readFileSync(descriptor);
    const after = fstatSync(descriptor, { bigint: true });
    const stableFields = ['dev', 'ino', 'mode', 'size', 'mtimeNs', 'ctimeNs'];
    if (stableFields.some(field => before[field] !== after[field])) {
      throw new Error(`${path} changed while being read`);
    }
    if (BigInt(payload.length) !== after.size) {
      throw new Error(`${path} byte count changed while being read`);
    }
    return payload;
  } finally {
    closeSync(descriptor);
  }
}

function readJson(path) {
  return JSON.parse(readRegularOnce(path).toString('utf8'));
}

function requireClosedGate(name, meta) {
  const failures = [];
  if (meta.publication_layer !== 'previewable') failures.push('publication_layer');
  if (meta.preview_approved !== true) failures.push('preview_approved');
  if (meta.deployment_authorized !== false) failures.push('deployment_authorized');
  if (meta.must_not_deploy !== true) failures.push('must_not_deploy');
  if (meta.schema_version !== 'sukaiyuan-site-preview-1.1') failures.push('schema_version');
  if (meta.exporter_version !== '1.3.6') failures.push('exporter_version');
  if (!String(meta.approval_scope ?? '').includes('v7r4_safe_subset')) failures.push('approval_scope');
  if (!strictGenerationId.test(String(meta.generation_id ?? ''))) failures.push('generation_id');
  if (!strictSha256.test(String(meta.generation_manifest_sha256 ?? ''))) {
    failures.push('generation_manifest_sha256');
  }
  if (failures.length) {
    throw new Error(`${name} has an invalid local-preview gate: ${failures.join(', ')}`);
  }
}

function requireObject(name, value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} is not a JSON object`);
  }
  return value;
}

function requireArray(name, value) {
  if (!Array.isArray(value)) throw new Error(`${name} is not a JSON array`);
  return value;
}

function requireExact(name, actual, expected) {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${name} differs from the research commit marker`);
  }
}

const { projectRoot } = parseArgs(process.argv.slice(2));
const paths = {
  research: resolve(projectRoot, 'src', 'data', 'research.json'),
  persons: resolve(projectRoot, 'public', 'data', 'persons.json'),
  events: resolve(projectRoot, 'public', 'data', 'events.json'),
  timeline: resolve(projectRoot, 'public', 'data', 'timeline.json'),
  sources: resolve(projectRoot, 'public', 'data', 'sources.json'),
};

// research.json is replaced last by the builder and is therefore the commit
// marker. Reading it on both sides of the four endpoints prevents accepting a
// generation switch during this snapshot.
const researchBeforeBytes = readRegularOnce(paths.research);
const persons = readJson(paths.persons);
const events = readJson(paths.events);
const timeline = readJson(paths.timeline);
const sources = readJson(paths.sources);
const researchAfterBytes = readRegularOnce(paths.research);
if (!researchBeforeBytes.equals(researchAfterBytes)) {
  throw new Error('research commit marker changed while reading the endpoint set');
}
const research = JSON.parse(researchAfterBytes.toString('utf8'));
const researchObject = requireObject('generated research data', research);
const researchMeta = requireObject('generated research metadata', researchObject._meta);
requireClosedGate('generated research data', researchMeta);

for (const [name, payload] of Object.entries({ persons, events, timeline, sources })) {
  const object = requireObject(`${name}.json`, payload);
  const meta = requireObject(`${name}.json metadata`, object._meta);
  requireClosedGate(`${name}.json`, meta);
  requireExact(`${name}.json metadata`, meta, researchMeta);
}

const nodes = requireArray('research nodes', researchObject.nodes);
const expectedPersons = nodes.filter(node => requireObject('research node', node).entity_type === 'Person');
requireExact('persons.json projection', requireArray('persons.json persons', persons.persons), expectedPersons);
requireExact('events.json projection', requireArray('events.json events', events.events), requireArray('research events', researchObject.events));
requireExact('timeline.json projection', requireArray('timeline.json timeline', timeline.timeline), researchObject.events);
requireExact('sources.json projection', requireArray('sources.json sources', sources.sources), requireArray('research sources', researchObject.sources));

if (process.env.COZE_PROJECT_ENV?.toUpperCase() === 'PROD') {
  throw new Error('COZE_PROJECT_ENV=PROD is forbidden while deployment_authorized=false');
}

console.log(
  `PASS: coherent V7R4 snapshot ${researchMeta.generation_id} permits local preview only; deployment is closed`,
);

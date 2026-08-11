#!/usr/bin/env node
/**
 * Derive the atlas dataset the public graph renders, from the legacy research
 * graph, keeping only the fields the atlas actually draws.
 *
 * The legacy graph carries a `migration` block on every node and edge: the
 * candidate claim ids, the risk flags, the migration decision. The atlas never
 * reads any of it — but `<KnowledgeGraphAtlas nodes={legacyGraph.nodes} />`
 * shipped the whole record anyway, which put 128 CL- identifiers and strings
 * like "danger:入党|共产党|地下|潜伏" into the public bundle. A component that
 * reads seven fields should be handed seven fields.
 *
 *   node tools/build-public-atlas.mjs [--check]
 *
 * --check verifies the committed output matches the input without writing,
 * so the build can fail instead of silently serving a stale atlas.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const SOURCE = resolve(root, 'research-data/graph/legacy-graph.json');
const TARGET = resolve(root, 'src/data/public-atlas.json');

// Exactly the fields AtlasNode and AtlasEdge declare in
// src/components/knowledge-graph-atlas.tsx. Adding a field here without adding
// it there ships data nothing renders — which is the bug this file exists for.
const NODE_FIELDS = [
  'id',
  'label',
  'group',
  'subgroup',
  'period',
  'title',
  'legacy_reliability',
];
const EDGE_FIELDS = ['id', 'from', 'to', 'label', 'period'];

function pick(record, fields) {
  const result = {};
  for (const field of fields) {
    if (record[field] !== undefined && record[field] !== null) {
      result[field] = record[field];
    }
  }
  return result;
}

const legacy = JSON.parse(readFileSync(SOURCE, 'utf8'));

const atlas = {
  schema_version: 'handx-public-atlas-1',
  derived_from: 'research-data/graph/legacy-graph.json',
  notice: legacy.warning,
  nodes: legacy.nodes.map((node) => pick(node, NODE_FIELDS)),
  edges: legacy.edges.map((edge) => pick(edge, EDGE_FIELDS)),
};

const serialised = `${JSON.stringify(atlas, null, 2)}\n`;

// Fail-closed: whatever the field lists say, refuse to emit a file carrying
// research-layer identifiers. If a display field ever starts containing them,
// this stops the build rather than the next reader noticing on the live site.
for (const [pattern, description] of [
  [/\bCL-\d{3}\b/, 'claim identifiers'],
  [/\bSRC-\d{3}\b/, 'source identifiers'],
  [/risk_flags|migration_status|candidate_claim_ids/, 'migration bookkeeping'],
  [/"locator"/, 'source locators'],
]) {
  if (pattern.test(serialised)) {
    throw new Error(`public atlas would contain ${description}; refusing to write`);
  }
}

if (process.argv.includes('--check')) {
  const current = readFileSync(TARGET, 'utf8');
  if (current !== serialised) {
    console.error(
      'src/data/public-atlas.json is stale — run `pnpm atlas:build` and commit the result',
    );
    process.exit(1);
  }
  console.log(
    `public atlas: ${atlas.nodes.length} nodes, ${atlas.edges.length} edges, up to date`,
  );
} else {
  writeFileSync(TARGET, serialised);
  const before = readFileSync(SOURCE).byteLength;
  console.log(
    `public atlas: ${atlas.nodes.length} nodes, ${atlas.edges.length} edges, ` +
      `${Math.round(before / 1024)} KB -> ${Math.round(serialised.length / 1024)} KB`,
  );
}

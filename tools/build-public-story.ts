#!/usr/bin/env node
/**
 * Derive the story-mode dataset the public graph renders, from research.json.
 *
 * research.json is 26 KB across eight arrays — sources, claims, nodes, edges,
 * events, identity candidates, boundary claims — and carries
 * `must_not_deploy: true`. The graph page reads four things from it and renders
 * six fields per node, but imported the module that imports the file, so the
 * whole thing went into the browser bundle: claim ids, source locators and the
 * boundary-claim text along with it.
 *
 * The projection keeps the computation where it already lives — graphNodes and
 * graphEdges are built in src/lib/research-data.ts, and this file runs that
 * code rather than reimplementing it, so the public dataset cannot drift from
 * the research one.
 *
 *   tsx tools/build-public-story.ts [--check]
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { graphEdges, graphNodes, nodeRecords } from '../src/lib/research-data';
import { archiveReadingMoments } from '../src/content/archive-reading';

const TARGET = resolve(process.cwd(), 'src/data/public-story.json');

/**
 * The archive anchors that have been cleared for publication — taken from the
 * curated reading moments rather than restated here, so there is one list.
 * The node panel links each id to /archives/<id>, and the public edition only
 * serves those three pages, so an uncleared id would render as a dead link
 * pointing at a source the reader is not meant to reach.
 */
const clearedAnchors = new Set(archiveReadingMoments.map((moment) => moment.sourceId));

// Exactly the fields the node panel in src/app/graph/page.tsx renders.
const story = {
  schema_version: 'handx-public-story-1',
  derived_from: 'src/data/research.json',
  node_count: nodeRecords.length,
  nodes: graphNodes,
  edges: graphEdges,
  details: nodeRecords.map((node) => ({
    entity_id: node.entity_id,
    entity_type: node.entity_type,
    canonical_label: node.canonical_label,
    variant_label: node.variant_label,
    source_ids: node.source_ids.filter((id: string) => clearedAnchors.has(id)),
  })),
};

const serialised = `${JSON.stringify(story, null, 2)}\n`;

// Claim identifiers are cleared for publication in no context at all. Source
// identifiers are a different matter: the node panel renders them as links to
// /archives/<id>, so they are a visible, intended part of the page — which is
// why they are checked against the cleared set rather than banned outright.
if (/\bCL-\d{3}\b/.test(serialised)) {
  throw new Error('public story dataset would contain claim identifiers; refusing to write');
}
for (const marker of ['"locator"', 'identity_boundary', 'must_not_deploy']) {
  if (serialised.includes(marker)) {
    throw new Error(`public story dataset would contain ${marker}; refusing to write`);
  }
}

const referenced = [...new Set(serialised.match(/\bSRC-\d{3}\b/g) ?? [])].sort();
console.log(`public story: sources referenced by the node panel — ${referenced.join(', ')}`);

if (process.argv.includes('--check')) {
  if (readFileSync(TARGET, 'utf8') !== serialised) {
    console.error(
      'src/data/public-story.json is stale — run `pnpm story:build` and commit the result',
    );
    process.exit(1);
  }
  console.log(`public story: ${story.nodes.length} nodes, ${story.edges.length} edges, up to date`);
} else {
  writeFileSync(TARGET, serialised);
  console.log(
    `public story: ${story.nodes.length} nodes, ${story.edges.length} edges, ` +
      `${Math.round(serialised.length / 1024)} KB`,
  );
}

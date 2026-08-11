#!/usr/bin/env node
/**
 * Scan what a reader's browser actually downloads on the public edition.
 *
 * Import-level checks cannot see this. The leak that prompted this file was a
 * component reading seven fields of a record it was handed whole, so nothing in
 * the source said "audit graph" — the identifiers only appeared once the
 * bundler had serialised the data into a chunk.
 *
 * Reachability matters as much as content. The public build still compiles
 * every workbench route, so chunks exist on disk for pages that now 404. Those
 * are reported, but the hard failure is reserved for chunks a published page
 * links to, because those are the ones that reach a reader.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import {
  publicApiPaths,
  publicArchivePaths,
  publicPagePaths,
  publicPagePrefixes,
} from '../src/data/public-routes';

const root = resolve(process.cwd());
const buildDir = join(root, '.next-public');
const appDir = join(buildDir, 'server/app');

if (!existsSync(appDir)) {
  console.error(`${appDir} does not exist; build the public edition first`);
  process.exit(1);
}

/** Only three source anchors are cleared for publication; no claim id is. */
const CLEARED_ANCHORS = new Set(
  publicArchivePaths.map((path) => path.replace('/archives/', '')),
);

function htmlFiles(directory: string): string[] {
  return readdirSync(directory, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
    .map((entry) => join(entry.parentPath, entry.name));
}

/** The route a prerendered HTML file answers, e.g. …/app/novel/read.html -> /novel/read */
function routeOf(htmlPath: string): string {
  const relative = htmlPath.slice(appDir.length).replace(/\.html$/, '');
  return relative === '/index' ? '/' : relative;
}

function isPublished(route: string): boolean {
  if ((publicPagePaths as readonly string[]).includes(route)) return true;
  if (publicArchivePaths.includes(route)) return true;
  if ((publicApiPaths as readonly string[]).includes(route)) return true;
  return publicPagePrefixes.some(
    (prefix) => route.startsWith(prefix) && route.length > prefix.length,
  );
}

const pages = htmlFiles(appDir);
const publishedPages = pages.filter((page) => isPublished(routeOf(page)));

const reachable = new Set<string>();
for (const page of publishedPages) {
  for (const match of readFileSync(page, 'utf8').matchAll(
    /\/_next\/static\/chunks\/([^"'\s]+?\.js)/g,
  )) {
    reachable.add(match[1]);
  }
}

interface Problem {
  file: string;
  detail: string;
}

/**
 * Structural markers of the research corpus. None of these is ever part of a
 * reader page: they are the fields the migration ledger and the audit graph
 * carry about themselves. Their presence means a research record was shipped
 * whole rather than a curated page citing a source, which is the difference
 * this verifier exists to draw.
 */
const CORPUS_MARKERS = [
  'risk_flags',
  'candidate_claim_ids',
  'migration_status',
  'identity_boundary_claims',
  'must_not_deploy',
];
// Deliberately not listed: legacy_reliability. It is a declared field of
// AtlasNode carrying a single letter, kept by tools/build-public-atlas.mjs
// because the atlas draws an uncertainty marker from it. Listing it would have
// been a marker chosen by association rather than by what it exposes.

function inspectStructure(text: string): string[] {
  return CORPUS_MARKERS.filter((marker) => text.includes(marker)).map(
    (marker) => `carries research record field ${marker}`,
  );
}

/**
 * Identifiers are counted but do not fail the build. A curated page citing the
 * source it was written about is the site working as intended — /archives/SRC-013
 * naming CL-013 is the point of that page. Only the owner can say which
 * citations are meant to be public, so this reports and leaves the decision.
 */
function countCitations(text: string): { claims: number; unclearedSources: string[] } {
  return {
    claims: new Set(text.match(/\bCL-\d{3}\b/g) ?? []).size,
    unclearedSources: [
      ...new Set(text.match(/\bSRC-\d{3}\b/g) ?? []),
    ].filter((id) => !CLEARED_ANCHORS.has(id)),
  };
}

const served: Problem[] = [];
const residue: Problem[] = [];
const citations: { file: string; claims: number; sources: string[] }[] = [];

function record(file: string, text: string, isReachable: boolean): void {
  const bucket = isReachable ? served : residue;
  for (const detail of inspectStructure(text)) bucket.push({ file, detail });
  if (!isReachable) return;
  const { claims, unclearedSources } = countCitations(text);
  if (claims > 0 || unclearedSources.length > 0) {
    citations.push({ file, claims, sources: unclearedSources });
  }
}

// The pages themselves: prerendered HTML carries the RSC payload inline.
for (const page of publishedPages) {
  record(routeOf(page), readFileSync(page, 'utf8'), true);
}

const chunkDir = join(buildDir, 'static/chunks');
if (existsSync(chunkDir)) {
  for (const entry of readdirSync(chunkDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    const full = join(entry.parentPath, entry.name);
    const name = full.slice(chunkDir.length + 1);
    record(`chunks/${name}`, readFileSync(full, 'utf8'), reachable.has(name));
  }
}

console.log(
  `public bundle: ${publishedPages.length} published pages of ${pages.length} built, ` +
    `${reachable.size} chunks reachable from them`,
);

if (citations.length > 0) {

  const sources = new Set<string>();
  for (const entry of citations) {
    for (const source of entry.sources) sources.add(source);
  }
  const totalClaims = citations.reduce((sum, entry) => sum + entry.claims, 0);
  console.log(
    `\nCitations on published pages: ${citations.length} page(s)/chunk(s) name ` +
      `${totalClaims} claim reference(s) and ${sources.size} source(s) outside the ` +
      `cleared anchors. These are editorial, not leaked records — the owner decides ` +
      `which citations are public. Sources named: ${[...sources].sort().join(', ')}`,
  );

}

if (residue.length > 0) {
  // Not a failure, but not nothing: these files sit in the deployment and are
  // fetchable by their hashed URL. They disappear when the public edition stops
  // compiling workbench routes, which is the staged-tree work still outstanding.
  console.warn(
    `\nWARN: ${residue.length} finding(s) in chunks no published page links to:`,
  );
  for (const problem of residue) console.warn(`  ${problem.file}: ${problem.detail}`);
}

if (served.length > 0) {
  console.error(`\nFAIL: research material reachable from published pages:\n`);
  for (const problem of served) console.error(`  ${problem.file}: ${problem.detail}`);
  process.exit(1);
}

console.log('public bundle: nothing a reader downloads carries research material');

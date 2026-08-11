#!/usr/bin/env node
/**
 * Derive which archive pages the public edition serves, from the citations its
 * published pages actually render.
 *
 * The owner's rule is that a citation shown to a reader should lead somewhere.
 * Hand-listing the ids would restate, in a second place, a fact the pages
 * already state — and the two would drift the first time an article cited a
 * new source. So the list is read back out of the built pages: cite a source
 * on a published page and its archive page opens; stop citing it and the page
 * closes again on the next build.
 *
 * Scanning is one level deep and does not cascade. The pages scanned are the
 * fixed reader routes, the chapter/article/person pages, and the three cleared
 * anchors — never the archive pages this file itself opens, which would let
 * the set grow through its own output until it covered the whole register.
 *
 *   tsx tools/build-cited-sources.ts [--check]
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { archiveReadingMoments } from '../src/content/archive-reading';
import {
  publicPagePaths,
  publicPagePrefixes,
} from '../src/data/public-routes';

const root = resolve(process.cwd());
const appDir = join(root, '.next-public/server/app');
const TARGET = join(root, 'src/data/public-cited-sources.json');

if (!existsSync(appDir)) {
  console.error(`${appDir} does not exist; build the public edition first`);
  process.exit(1);
}

/** The seed set: pages published independently of any citation. */
const seedPaths = new Set<string>([
  ...publicPagePaths,
  ...archiveReadingMoments.map((moment) => `/archives/${moment.sourceId}`),
]);

function routeOf(htmlPath: string): string {
  const relative = htmlPath.slice(appDir.length).replace(/\.html$/, '');
  return relative === '/index' ? '/' : relative;
}

function isSeedPage(route: string): boolean {
  if (seedPaths.has(route)) return true;
  return publicPagePrefixes.some(
    (prefix) => route.startsWith(prefix) && route.length > prefix.length,
  );
}

const cited = new Set<string>();
let scanned = 0;

for (const entry of readdirSync(appDir, { recursive: true, withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const full = join(entry.parentPath, entry.name);
  if (!isSeedPage(routeOf(full))) continue;
  scanned += 1;
  for (const id of readFileSync(full, 'utf8').match(/\bSRC-\d{3}\b/g) ?? []) {
    cited.add(id);
  }
}

const payload = {
  schema_version: 'handx-public-cited-sources-1',
  derived_from: 'citations rendered on published pages of the public build',
  scanned_pages: scanned,
  source_ids: [...cited].sort(),
};

const serialised = `${JSON.stringify(payload, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(TARGET) ? readFileSync(TARGET, 'utf8') : '';
  if (current !== serialised) {
    console.error(
      'src/data/public-cited-sources.json is stale — run `pnpm cited:build` and commit the result.\n' +
        `  scanned ${scanned} page(s), found ${payload.source_ids.length} cited source(s)`,
    );
    process.exit(1);
  }
  console.log(
    `cited sources: ${payload.source_ids.length} archive page(s) opened by ${scanned} published page(s)`,
  );
} else {
  writeFileSync(TARGET, serialised);
  console.log(
    `cited sources: ${scanned} published pages cite ${payload.source_ids.length} source(s) — ` +
      payload.source_ids.join(', '),
  );
}

/**
 * No client component may reach a JSON data file through its imports.
 *
 * JSON imports are not tree-shaken. A client component that imports one string
 * from a module that imports a JSON file ships the entire JSON to every
 * browser that loads the route. This actually happened: novel-reader.tsx
 * imported `@/lib/novel` for two scalars (the edition id and the page count)
 * and thereby shipped all 538 page records — sha256 hashes, byte sizes, rights
 * bookkeeping — as a 349 KB JavaScript chunk, on every novel page including
 * the chapter pages that short videos link to.
 *
 * The rule is transitive because the damage is transitive: the offending
 * import was two modules away from the JSON and looked entirely harmless.
 * Manifest-derived values belong in props.
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, extname, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const srcRoot = resolve(root, 'src');

function sourceFiles(): string[] {
  return readdirSync(srcRoot, { recursive: true, withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() && ['.ts', '.tsx'].includes(extname(entry.name)),
    )
    .map((entry) => resolve(entry.parentPath, entry.name));
}

/**
 * Runtime imports only. `import type` is erased by the compiler and cannot
 * pull anything into a bundle, which is exactly why the types live in
 * src/lib/novel-types.ts. A mixed import (`import { type A, b }`) is counted
 * as runtime — over-counting can only produce a false alarm, never a miss.
 */
function runtimeImports(source: string): string[] {
  const specifiers: string[] = [];
  const pattern = /(?:^|\n)\s*import\s+([^'"]*?)from\s*['"]([^'"]+)['"]/g;
  for (const match of source.matchAll(pattern)) {
    const clause = match[1];
    if (/^\s*type\s/.test(clause)) continue;
    specifiers.push(match[2]);
  }
  for (const match of source.matchAll(/(?:^|\n)\s*import\s*['"]([^'"]+)['"]/g)) {
    specifiers.push(match[1]);
  }
  return specifiers;
}

function resolveSpecifier(specifier: string, fromFile: string): string | null {
  let base: string;
  if (specifier.startsWith('@/')) base = resolve(srcRoot, specifier.slice(2));
  else if (specifier.startsWith('.')) base = resolve(dirname(fromFile), specifier);
  else return null;

  if (extname(base) && existsSync(base)) return base;
  for (const extension of ['.ts', '.tsx', '.json']) {
    if (existsSync(base + extension)) return base + extension;
  }
  for (const extension of ['.ts', '.tsx']) {
    const asIndex = resolve(base, `index${extension}`);
    if (existsSync(asIndex)) return asIndex;
  }
  return null;
}

/**
 * JSON a client component may legitimately reach, with the size it is allowed
 * to be. Some data is genuinely meant for the browser; the point of the list is
 * that shipping it was a decision someone wrote down, with a ceiling on it.
 *
 * The ceilings are budgets, not mirrors of the current file size — they are
 * here to fail when a file grows into a problem, so they sit above today's size
 * and are not updated to match it.
 */
const ALLOWED: ReadonlyMap<string, number> = new Map([
  // The edition flag and site origin. Small by construction.
  ['src/data/public-edition.json', 8],
  // The atlas's display data, derived by tools/build-public-atlas.mjs with the
  // research fields stripped. It is the whole point of that file that this one
  // is safe to ship.
  ['src/data/public-atlas.json', 96],
  // The mission board, on the workbench-only /missions route.
  ['src/data/archive-missions.json', 96],
  // The story graph's nodes, edges and node-panel fields, derived by
  // tools/build-public-story.ts from research.json with the claims, locators
  // and boundary claims removed.
  ['src/data/public-story.json', 16],
]);

/** Research projections, never shippable at any size. */
const NEVER = [/^research-data\//, /audit-graph|legacy-graph|legacy-crosswalk/];

const clientEntries = sourceFiles().filter((file) =>
  /^\s*(['"])use client\1/m.test(readFileSync(file, 'utf8')),
);

const failures: string[] = [];

for (const entry of clientEntries) {
  // Breadth-first so the reported chain is the shortest one, which is the
  // one worth reading in an error message.
  const queue: string[][] = [[entry]];
  const seen = new Set([entry]);
  while (queue.length > 0) {
    const chain = queue.shift()!;
    const file = chain[chain.length - 1];
    if (extname(file) === '.json') {
      const target = relative(root, file);
      const kilobytes = Math.round(readFileSync(file).byteLength / 1024);
      const trail = chain.map((step) => relative(root, step)).join(' -> ');
      const budget = ALLOWED.get(target);
      if (NEVER.some((pattern) => pattern.test(target))) {
        failures.push(
          `${relative(root, entry)} reaches research data ${target} (${kilobytes} KB) via ${trail}`,
        );
      } else if (budget === undefined) {
        failures.push(
          `${relative(root, entry)} reaches undeclared ${target} (${kilobytes} KB) via ${trail}`,
        );
      } else if (kilobytes > budget) {
        failures.push(
          `${target} is ${kilobytes} KB, over its ${budget} KB client budget ` +
            `(reached from ${relative(root, entry)})`,
        );
      }
      // Keep walking: one client component can reach several JSON files, and
      // stopping at the first would hide the rest until it was fixed.
      continue;
    }
    for (const specifier of runtimeImports(readFileSync(file, 'utf8'))) {
      const next = resolveSpecifier(specifier, file);
      if (!next || seen.has(next)) continue;
      seen.add(next);
      queue.push([...chain, next]);
    }
  }
}

if (failures.length > 0) {
  console.error('Client components reach JSON they are not cleared to ship:\n');
  for (const failure of new Set(failures)) console.error(`  ${failure}`);
  console.error(
    '\nEither pass the values as props and import types from a module that ' +
      'imports no JSON (see src/lib/novel-types.ts and src/lib/graph-wiki-types.ts), ' +
      'or declare the file in ALLOWED with a budget if shipping it is intended.',
  );
  process.exit(1);
}

console.log(
  `client payload: ${clientEntries.length} client components, ` +
    `${ALLOWED.size} declared payloads, no research data reachable`,
);

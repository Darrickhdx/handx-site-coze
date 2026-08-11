#!/usr/bin/env node
/**
 * Take the unpublished routes out of the tree before a public build, and put
 * them back afterwards.
 *
 * The allow-list stops unpublished routes answering, but Next still compiles
 * them: their prerendered HTML and their JS chunks sit in the deployment,
 * fetchable by anyone who knows a hashed filename. Four of those chunks carry
 * research record fields. A page that is not built cannot leak.
 *
 *   node tools/stage-public-routes.mjs --exclude
 *   node tools/stage-public-routes.mjs --restore
 *
 * Moved directories go to .public-build-excluded/ (gitignored). --restore is
 * idempotent and runs both from the build's exit trap and at the start of the
 * next --exclude, so an interrupted build cannot leave the tree short of its
 * workbench routes.
 *
 * Which routes move is derived from the allow-list, not listed again here: a
 * route directory stays only if the paths it can answer are published.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';

const root = resolve(process.cwd());
const appDir = join(root, 'src/app');
const holdingDir = join(root, '.public-build-excluded');

/**
 * next-env.d.ts is generated, tracked, and names the distDir of whichever
 * edition built last. Left alone, a public build rewrites it to point at
 * .next-public/types and the workbench's own type-check then reads the public
 * edition's route union — failing on a file nobody wrote, over a route that
 * exists. It is stashed and restored with the route directories.
 */
const nextEnv = join(root, 'next-env.d.ts');
const nextEnvStash = join(holdingDir, 'next-env.d.ts.stashed');

/**
 * Read the allow-list without a TypeScript loader — this runs under plain node
 * from a shell script, before any build step. Only the literal path strings are
 * needed, and they are literals by design.
 */
function publishedPathsFromAllowList() {
  const source = readFileSync(join(root, 'src/data/public-routes.ts'), 'utf8');
  const block = (name) => {
    const match = source.match(new RegExp(`export const ${name} = \\[([\\s\\S]*?)\\]`));
    return match ? [...match[1].matchAll(/'([^']+)'/g)].map((entry) => entry[1]) : [];
  };
  return {
    paths: new Set(block('publicPagePaths')),
    prefixes: block('publicPagePrefixes'),
  };
}

/** Every directory under src/app that owns a page.tsx, as a route path. */
function routeDirectories() {
  const found = [];
  for (const entry of readdirSync(appDir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile() || entry.name !== 'page.tsx') continue;
    const directory = entry.parentPath;
    const route = `/${relative(appDir, directory)}`.replace(/\\/g, '/');
    found.push({ directory, route: route === '/.' ? '/' : route });
  }
  return found;
}

/**
 * A route is kept if it is a published path, or if it is a dynamic route whose
 * prefix is published — /archives/[sourceId] serves the cleared anchors, so its
 * directory must stay even though most of the ids it could render do not.
 */
function isKept(route, allowList) {
  if (route === '/' || allowList.paths.has(route)) return true;
  const withoutSegment = route.replace(/\/\[[^\]]+\]$/, '/');
  if (route.endsWith(']') && allowList.prefixes.includes(withoutSegment)) return true;
  if (route.endsWith(']') && allowList.paths.has(withoutSegment.slice(0, -1))) return true;
  // A parent of a published path stays: removing /novel would remove
  // /novel/read with it.
  for (const published of [...allowList.paths, ...allowList.prefixes]) {
    if (published.startsWith(`${route}/`)) return true;
  }
  return false;
}

function restore() {
  if (!existsSync(holdingDir)) {
    console.log('stage-public-routes: nothing to restore');
    return;
  }
  if (existsSync(nextEnvStash)) {
    copyFileSync(nextEnvStash, nextEnv);
    rmSync(nextEnvStash, { force: true });
  }
  let moved = 0;
  for (const entry of readdirSync(holdingDir, { withFileTypes: true })) {
    if (!entry.isDirectory() && !entry.isFile()) continue;
    // The holding directory stores each route under its own path with slashes
    // replaced, so the original location is recoverable without a manifest.
    const target = join(appDir, entry.name.replaceAll('__', '/'));
    mkdirSync(dirname(target), { recursive: true });
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
    renameSync(join(holdingDir, entry.name), target);
    moved += 1;
  }
  rmSync(holdingDir, { recursive: true, force: true });
  console.log(`stage-public-routes: restored ${moved} route directory(ies)`);
}

function exclude() {
  restore();
  const allowList = publishedPathsFromAllowList();
  if (allowList.paths.size === 0) {
    throw new Error('could not read the allow-list; refusing to move anything');
  }
  mkdirSync(holdingDir, { recursive: true });
  if (existsSync(nextEnv)) copyFileSync(nextEnv, nextEnvStash);

  // Deepest first, so moving /studio does not strand /studio/media.
  const candidates = routeDirectories()
    .filter(({ route }) => !isKept(route, allowList))
    .sort((left, right) => right.route.length - left.route.length);

  // Only move a top-most excluded directory: once /wiki moves, /wiki/[entityId]
  // has gone with it.
  const movedRoutes = [];
  for (const { directory, route } of candidates.sort((l, r) => l.route.length - r.route.length)) {
    if (movedRoutes.some((done) => route.startsWith(`${done}/`))) continue;
    const name = route.slice(1).replaceAll('/', '__');
    renameSync(directory, join(holdingDir, name));
    movedRoutes.push(route);
  }
  console.log(
    `stage-public-routes: excluded ${movedRoutes.length} route(s) — ${movedRoutes.join(', ')}`,
  );
}

const mode = process.argv[2];
if (mode === '--exclude') exclude();
else if (mode === '--restore') restore();
else {
  console.error('usage: stage-public-routes.mjs --exclude | --restore');
  process.exit(1);
}

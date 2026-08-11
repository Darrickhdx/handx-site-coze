#!/usr/bin/env node
/**
 * Verify a public-edition build.
 *
 * The workbench has verify-handx-release.mjs, which asserts nothing leaves the
 * machine. This is its counterpart for the lane that does leave: it asserts the
 * owner's tooling and private runtime did not come along, and that the workbench
 * contract was not quietly opened to make the build succeed.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const projectRoot = resolve(process.cwd());
const failures = [];
const fail = (message) => failures.push(message);

// 1. The workbench contract must still be shut. The public edition gets its own
//    authorisation; it never earns one by loosening the research data's.
const closedGateFiles = [
  'src/data/research.json',
  'src/data/site-status.json',
  'src/data/novel-editions.json',
  'research-data/graph/manifest.json',
  'public/novel/hero-wuming/novel-manifest.json',
];
/** These flags are nested differently per file, so search rather than guess. */
function findFlags(value, found = {}) {
  if (value === null || typeof value !== 'object') return found;
  for (const [key, nested] of Object.entries(value)) {
    if (key === 'must_not_deploy' || key === 'deployment_authorized') {
      found[key] = nested;
    }
    findFlags(nested, found);
  }
  return found;
}

for (const relPath of closedGateFiles) {
  const full = join(projectRoot, relPath);
  if (!existsSync(full)) continue;
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(full, 'utf8'));
  } catch (error) {
    fail(`${relPath} is not readable JSON: ${error.message}`);
    continue;
  }
  const flags = findFlags(parsed);
  if (Object.keys(flags).length === 0) {
    fail(`${relPath}: no deployment gate flags found where they were expected`);
    continue;
  }
  if ('must_not_deploy' in flags && flags.must_not_deploy !== true) {
    fail(`${relPath}: must_not_deploy is no longer true`);
  }
  if ('deployment_authorized' in flags && flags.deployment_authorized !== false) {
    fail(`${relPath}: deployment_authorized is no longer false`);
  }
}

// 2. The public server entry must exist and must not be the workbench one.
if (!existsSync(join(projectRoot, 'dist/server-public.js'))) {
  fail('dist/server-public.js was not produced');
} else {
  const bundle = readFileSync(join(projectRoot, 'dist/server-public.js'), 'utf8');
  if (!bundle.includes('owner_authored_public_edition_v1')) {
    fail('public server bundle is missing the acknowledgement scope');
  }
  if (bundle.includes('createLocalPreviewRuntime')) {
    fail('public server bundle pulled in the loopback-only workbench runtime');
  }
  for (const marker of ['admin-token', 'visitor-salt', 'private-runtime']) {
    if (bundle.includes(marker)) {
      fail(`public server bundle references owner-private material: ${marker}`);
    }
  }
}

// 3. The owner's private runtime must not be part of the build output.
if (existsSync(join(projectRoot, '.next-public/standalone/private-runtime'))) {
  fail('private-runtime was copied into the build output');
}

// 4. The public edition must be built with the public flag inlined, otherwise
//    client components resolve to 'workbench' and would call loopback endpoints.
//    Whether those branches are actually dead is proved at runtime by
//    scripts/smoke-public.sh, which probes the endpoints on a live server.
if (process.env.NEXT_PUBLIC_SITE_EDITION !== 'public') {
  fail('NEXT_PUBLIC_SITE_EDITION must be "public" when building the public edition');
}

// 5. Novel page images must actually be present — a public book with missing
//    pages is the failure mode this whole edition exists to avoid.
const manifestPath = join(projectRoot, 'public/novel/hero-wuming/novel-manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const missing = manifest.pages.filter(
    (page) => !existsSync(join(projectRoot, 'public', page.path.replace(/^\//, ''))),
  );
  if (missing.length > 0) {
    fail(`${missing.length} novel page image(s) are missing, first: ${missing[0].path}`);
  }
  const total = manifest.pages.reduce((sum, page) => sum + (page.byte_size ?? 0), 0);
  console.log(
    `novel: ${manifest.pages.length} pages, ${(total / 1e6).toFixed(0)} MB, edition ${manifest.book.id}`,
  );
}

// 6. What the browser downloads is scanned by tools/verify-public-bundle.ts,
//    which needs the published-route list from TypeScript and so runs under
//    tsx from scripts/build-public.sh rather than here.

// 7. The research projections must not be under a statically served directory.
//    A file in public/ is served by filename with no route involved, so no
//    route guard, edition check or layout can reach it.
for (const stray of ['public/data/graph', 'public/data/research.json']) {
  if (existsSync(join(projectRoot, stray))) {
    fail(`${stray} is inside the statically served directory; move it to research-data/`);
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ status: 'FAIL', failures }, null, 2));
  process.exit(1);
}
console.log('PASS: public edition build verified; workbench gates remain closed.');

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  evidencePaths,
  sourcePreviewAssets,
  storyEvidenceContract,
} from '../src/content/evidence-paths';
import assetManifest from '../public/assets/asset-manifest.json';
import novelManifest from '../public/novel/hero-wuming/novel-manifest.json';
import research from '../src/data/research.json';

function fail(message: string): never {
  throw new Error(message);
}

function equalSet(actual: Iterable<string>, expected: Iterable<string>): boolean {
  const a = [...new Set(actual)].sort();
  const b = [...new Set(expected)].sort();
  return JSON.stringify(a) === JSON.stringify(b);
}

const claimById = new Map(research.claims.map((claim) => [claim.claim_id, claim]));
const sourceById = new Map(research.sources.map((source) => [source.source_id, source]));
const sectionBySlug = new Map(novelManifest.sections.map((section) => [section.slug, section]));
const pathIds = new Set<string>();

if (evidencePaths.length !== 5) fail(`expected 5 reader paths, found ${evidencePaths.length}`);
if (!equalSet(storyEvidenceContract.bridgeIds, ['pingdiquan-1936', 'appointment-1933', 'chart-1942'])) {
  fail('bridge allowlist changed without review');
}
if (
  storyEvidenceContract.novelEditionId !== novelManifest.book.id
  || storyEvidenceContract.novelPdfSha256 !== novelManifest.source.pdf_sha256
  || storyEvidenceContract.novelDocxSha256 !== novelManifest.source.docx_sha256
) {
  fail('story evidence contract is stale against the novel manifest');
}
if (
  storyEvidenceContract.researchGenerationId !== research._meta.generation_id
  || storyEvidenceContract.researchGenerationManifestSha256
    !== research._meta.generation_manifest_sha256
) {
  fail('story evidence contract is stale against the approved research generation');
}
if (
  storyEvidenceContract.mustNotDeploy !== true
  || storyEvidenceContract.deploymentAuthorized !== false
  || storyEvidenceContract.currentPersonFactScenes !== 0
) {
  fail('story evidence contract opened a deployment or person-fact gate');
}

for (const path of evidencePaths) {
  if (pathIds.has(path.id)) fail(`duplicate evidence path id: ${path.id}`);
  pathIds.add(path.id);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(path.id)) fail(`unsafe evidence path id: ${path.id}`);
  if (!path.storyHref.startsWith('/') || path.storyHref.includes('..')) fail(`unsafe story route: ${path.storyHref}`);
  if (!path.identityBoundary || !path.cannotSay || !path.nextQuestion) fail(`incomplete boundary: ${path.id}`);
  if (path.personFactAllowed !== false) fail(`${path.id} accidentally allows a person-fact scene`);

  const section = sectionBySlug.get(path.chapterSlug);
  if (!section) fail(`${path.id} references missing chapter ${path.chapterSlug}`);
  if (section.start_page !== path.storyPageStart || section.end_page !== path.storyPageEnd) {
    fail(`${path.id} chapter page range drifted`);
  }
  const chapterPages = novelManifest.pages.filter(
    (page) => page.number >= path.storyPageStart && page.number <= path.storyPageEnd,
  );
  const chapterHash = createHash('sha256')
    .update(chapterPages.map((page) => page.sha256).join('\n'))
    .digest('hex');
  if (chapterHash !== path.chapterAssetSha256) fail(`${path.id} chapter assets drifted`);

  const claims = path.claimIds.map((claimId) => {
    const claim = claimById.get(claimId);
    if (!claim) fail(`${path.id} references claim outside V7R4 safe projection: ${claimId}`);
    return claim;
  });
  const sources = path.sourceIds.map((sourceId) => {
    const source = sourceById.get(sourceId);
    if (!source) fail(`${path.id} references source outside V7R4 safe projection: ${sourceId}`);
    return source;
  });
  const selectedSources = path.selectedSourceIds.map((sourceId) => {
    const source = sourceById.get(sourceId);
    if (!source) fail(`${path.id} selects source outside V7R4 safe projection: ${sourceId}`);
    if (!path.sourceIds.includes(sourceId)) fail(`${path.id} selects unrelated source ${sourceId}`);
    return source;
  });

  if (path.mode === 'blocked') {
    if (claims.length || sources.length || selectedSources.length || path.sourceFamilyCount !== 0) {
      fail(`${path.id} blocked path must not fabricate a claim or source chain`);
    }
    continue;
  }
  if (!storyEvidenceContract.bridgeIds.includes(path.id as never)) {
    fail(`${path.id} is not in the reviewed bridge allowlist`);
  }
  if (!claims.length || !sources.length || !selectedSources.length) fail(`${path.id} bridge is empty`);
  if (claims.some((claim) => claim.status !== 'working_verified')) {
    fail(`${path.id} bridge contains a non-working-verified claim`);
  }
  if (selectedSources.some((source) => source.content_scope !== 'body-verified')) {
    fail(`${path.id} selected viewer source is not body-verified`);
  }
  for (const source of sources) {
    if (!claims.some((claim) => claim.source_ids.includes(source.source_id))) {
      fail(`${path.id} source ${source.source_id} is not reached by its claims`);
    }
  }
  const sourceFamilies = new Set(
    sources
      .filter((source) => source.content_scope === 'body-verified')
      .map((source) => source.work_id),
  );
  if (sourceFamilies.size !== path.sourceFamilyCount) {
    fail(`${path.id} source family count is wrong: ${sourceFamilies.size}`);
  }
}

const bridgePaths = evidencePaths.filter((path) => path.mode !== 'blocked');
if (!equalSet(bridgePaths.flatMap((path) => [...path.claimIds]), ['CL-013', 'CL-014', 'CL-092', 'CL-167', 'CL-168'])) {
  fail('bridge claim allowlist changed without review');
}
if (!equalSet(bridgePaths.flatMap((path) => [...path.sourceIds]), ['SRC-002', 'SRC-013', 'SRC-039', 'SRC-042', 'SRC-095'])) {
  fail('bridge source allowlist changed without review');
}
if (evidencePaths.find((path) => path.id === 'pingdiquan-1936')?.sourceFamilyCount !== 1) {
  fail('SRC-002 and SRC-013 were incorrectly counted as independent sources');
}
if (evidencePaths.find((path) => path.id === 'appointment-1933')?.sourceFamilyCount !== 1) {
  fail('SRC-042 incorrectly increased the SRC-039 appointment source count');
}

for (const [sourceId, preview] of Object.entries(sourcePreviewAssets)) {
  if (!sourceById.has(sourceId)) fail(`preview references missing source ${sourceId}`);
  if (
    preview.publishable !== false
    || preview.rightsScope !== 'local_internal_preview_only'
    || preview.displayScope !== 'local_source_viewer_only'
    || preview.notForMedia !== true
  ) {
    fail(`preview rights gate is open for ${sourceId}`);
  }
  const manifestPath = preview.path.replace(/^\//, '');
  const registered = assetManifest.assets.find((asset) => asset.path === manifestPath);
  if (!registered) fail(`preview asset is not registered: ${manifestPath}`);
  if (
    registered.source_id !== sourceId
    || registered.publishable !== false
    || registered.rights_scope !== preview.rightsScope
    || registered.sha256 !== preview.sha256
  ) {
    fail(`preview asset passport mismatch: ${sourceId}`);
  }
  const actualHash = createHash('sha256')
    .update(readFileSync(resolve(process.cwd(), 'public', manifestPath)))
    .digest('hex');
  if (actualHash !== preview.sha256) fail(`preview asset bytes changed: ${sourceId}`);
}

const encoded = JSON.stringify({ evidencePaths, sourcePreviewAssets, storyEvidenceContract });
const absoluteHomeMarker = '/' + 'Users' + '/';
if (encoded.includes(absoluteHomeMarker) || encoded.includes('file://') || encoded.includes('private-runtime')) {
  fail('story evidence browser contract exposes a private path');
}

console.log(
  `PASS story evidence bridges=${bridgePaths.length} stops=${evidencePaths.filter((path) => path.mode === 'blocked').length} claims=5 sources=5 person_fact_scenes=0 previews=${Object.keys(sourcePreviewAssets).length}`,
);

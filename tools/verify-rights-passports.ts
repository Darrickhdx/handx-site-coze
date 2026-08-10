import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { articleRightsPassports } from '../src/content/publication-rights';
import { topicArticles } from '../src/content/topics';
import { novelManifest } from '../src/lib/novel';

const ROOT = process.cwd();
const REGISTRY_PATH = 'src/data/rights-passports.json';
const MANIFEST_PATH = 'src/data/rights-passports-manifest.json';
const ASSET_MANIFEST_PATH = 'public/assets/asset-manifest.json';
const NOVEL_MANIFEST_PATH = 'public/novel/hero-wuming/novel-manifest.json';
const SOURCES_PATH = 'public/data/sources.json';
const ARTICLE_RIGHTS_PATH = 'src/content/publication-rights.ts';
const TOPICS_PATH = 'src/content/topics.ts';
// Local-only pages come from the served manifest: V0.3 had seven, V1.5 has none.
const EXPECTED_LOCAL_NOVEL_PAGES = new Set<number>(novelManifest.rights.local_only_image_pages);
const EXPECTED_LICENSED_IDS = new Set(['RP-ASSET-003', 'RP-ASSET-004']);

type JsonObject = Record<string, unknown>;

interface RecordView {
  passport_id: string;
  category: string;
  title: string;
  canonical_reference: string;
  content_sha256: string;
  hash_basis: string;
  control_state: string;
  control_evidence: string;
  license_state: string;
  reuse_scope: string;
  local_only: boolean;
  media_gate: string;
  public_ready: boolean;
  must_not_deploy: boolean;
  release_gate: string;
  block_reason: string;
  provenance: {
    dataset: string;
    source_key: string;
    source_ids: string[];
    note: string;
  };
}

function absolute(relativePath: string): string {
  return join(ROOT, relativePath);
}

function bytes(relativePath: string): Buffer {
  return readFileSync(absolute(relativePath));
}

function json<T>(relativePath: string): T {
  return JSON.parse(bytes(relativePath).toString('utf8')) as T;
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as JsonObject)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function hashRecord(value: unknown): string {
  return sha256(JSON.stringify(canonicalize(value)));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isObject(value: unknown): value is JsonObject {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function verifyTopLevel(registry: JsonObject, manifest: JsonObject): RecordView[] {
  const meta = registry._meta;
  assert(isObject(meta), 'Registry metadata is missing.');
  assert(meta.schema_version === 'handx-rights-passports-v1', 'Registry schema changed.');
  assert(meta.must_not_deploy === true, 'Registry must_not_deploy gate is open.');
  assert(meta.deployment_authorized === false, 'Registry deployment was authorized.');
  assert(meta.public_ready === false, 'Registry is unexpectedly public-ready.');
  assert(meta.default_policy === 'unknown_rights_are_permission_pending_and_blocked', 'Unknown-rights policy is not fail-closed.');
  assert(meta.license_policy === 'no-license-granted', 'Registry license policy changed.');

  assert(Array.isArray(registry.records), 'Registry records are missing.');
  const records = registry.records as RecordView[];
  // site_asset 5 + article 6 + topic_paragraph 13 + source_reference 5
  const NON_NOVEL_PASSPORTS = 29;
  // One passport per novel page plus the non-novel assets. Derived from the
  // manifest rather than fixed at 208, which was V0.3's 182 pages + 26 others
  // and became wrong the moment the served edition changed.
  const expectedRecords = novelManifest.totals.pages + NON_NOVEL_PASSPORTS;
  assert(
    records.length === expectedRecords,
    `Expected ${expectedRecords} rights passports, found ${records.length}.`,
  );
  assert(new Set(records.map((record) => record.passport_id)).size === records.length, 'Duplicate rights passport IDs.');

  assert(manifest.schema_version === 'handx-rights-passports-manifest-v1', 'Output manifest schema changed.');
  assert(manifest.must_not_deploy === true, 'Output manifest must_not_deploy gate is open.');
  assert(manifest.deployment_authorized === false, 'Output manifest deployment was authorized.');
  assert(manifest.registry_path === REGISTRY_PATH, 'Output manifest registry path changed.');
  assert(manifest.registry_sha256 === sha256(bytes(REGISTRY_PATH)), 'Registry output hash mismatch.');
  assert(manifest.registry_bytes === bytes(REGISTRY_PATH).length, 'Registry output byte count mismatch.');
  assert(manifest.records === records.length, 'Output manifest record count mismatch.');

  return records;
}

function verifyInputFreshness(registry: JsonObject, manifest: JsonObject) {
  const meta = registry._meta as JsonObject;
  const registryInputs = meta.input_sha256;
  const manifestInputs = manifest.input_sha256;
  assert(isObject(registryInputs) && isObject(manifestInputs), 'Input hashes are missing.');
  const paths = [
    ASSET_MANIFEST_PATH,
    NOVEL_MANIFEST_PATH,
    SOURCES_PATH,
    ARTICLE_RIGHTS_PATH,
    TOPICS_PATH,
  ];
  for (const path of paths) {
    const current = sha256(bytes(path));
    assert(registryInputs[path] === current, `Registry input is stale: ${path}`);
    assert(manifestInputs[path] === current, `Output manifest input is stale: ${path}`);
  }
}

function verifyCommonContract(records: RecordView[]) {
  const allowedCategories = new Set(['site_asset', 'novel_page', 'article', 'topic_paragraph', 'source_reference']);
  const allowedControls = new Set(['owned', 'licensed', 'permission_pending']);
  const allowedMediaGates = new Set(['review_only', 'not_for_media']);
  const hashPattern = /^[a-f0-9]{64}$/;

  for (const record of records) {
    assert(allowedCategories.has(record.category), `${record.passport_id}: unknown category.`);
    assert(allowedControls.has(record.control_state), `${record.passport_id}: unknown control state did not fail closed.`);
    assert(allowedMediaGates.has(record.media_gate), `${record.passport_id}: unknown media gate.`);
    assert(record.license_state === 'no-license-granted', `${record.passport_id}: unexpected license grant.`);
    assert(record.public_ready === false, `${record.passport_id}: public_ready must remain false.`);
    assert(record.must_not_deploy === true, `${record.passport_id}: must_not_deploy must remain true.`);
    assert(record.release_gate === 'blocked', `${record.passport_id}: release gate is open.`);
    assert(hashPattern.test(record.content_sha256), `${record.passport_id}: invalid content hash.`);
    assert(record.title.length > 0 && record.control_evidence.length > 0, `${record.passport_id}: rights explanation is missing.`);
    assert(record.reuse_scope.length > 0 && record.block_reason.length > 0, `${record.passport_id}: reuse boundary is missing.`);
    assert(record.provenance.dataset.length > 0 && record.provenance.source_key.length > 0, `${record.passport_id}: provenance is incomplete.`);
  }

  const serialized = JSON.stringify(records);
  assert(!/(?:file:\/\/|\/Users\/|\/home\/|private-runtime\/|\.\.\/)/i.test(serialized), 'Registry leaks a local or private path.');
  assert(!/(?:raw_docx|raw_pdf|document_body|family_private_text)/i.test(serialized), 'Registry contains a forbidden raw-material field.');

  const licensed = records.filter((record) => record.control_state === 'licensed');
  assert(licensed.length === EXPECTED_LICENSED_IDS.size, 'Licensed record count changed.');
  for (const record of licensed) {
    assert(EXPECTED_LICENSED_IDS.has(record.passport_id), `${record.passport_id}: unverified license was invented.`);
    assert(record.local_only && record.media_gate === 'not_for_media', `${record.passport_id}: limited local license was broadened.`);
    assert(record.reuse_scope === 'local_internal_preview_only', `${record.passport_id}: licensed scope changed.`);
  }
}

function indexById(records: RecordView[]): Map<string, RecordView> {
  return new Map(records.map((record) => [record.passport_id, record]));
}

function verifyAssets(records: Map<string, RecordView>) {
  const manifest = json<{ assets: Array<{ path: string; sha256: string; kind: string }> }>(ASSET_MANIFEST_PATH);
  assert(manifest.assets.length === 5, 'Asset manifest count changed.');
  manifest.assets.forEach((asset, index) => {
    const id = `RP-ASSET-${String(index + 1).padStart(3, '0')}`;
    const record = records.get(id);
    assert(record, `${id} is missing.`);
    assert(record.category === 'site_asset', `${id}: wrong category.`);
    assert(record.content_sha256 === asset.sha256, `${id}: manifest hash mismatch.`);
    assert(record.content_sha256 === sha256(bytes(`public/${asset.path}`)), `${id}: asset bytes changed.`);
    assert(record.hash_basis === 'asset_bytes', `${id}: hash basis changed.`);
    assert(record.local_only && record.media_gate === 'not_for_media', `${id}: asset escaped local/media gate.`);
  });
}

function verifyNovel(records: Map<string, RecordView>) {
  const manifest = json<{
    pages: Array<{
      number: number;
      path: string;
      sha256: string;
      local_only: boolean;
      not_for_media: boolean;
      rights_status: string;
    }>;
  }>(NOVEL_MANIFEST_PATH);
  assert(
    manifest.pages.length === novelManifest.totals.pages,
    'Novel page count does not match the manifest totals.',
  );
  for (const page of manifest.pages) {
    const id = `RP-NOVEL-${String(page.number).padStart(3, '0')}`;
    const record = records.get(id);
    assert(record, `${id} is missing.`);
    assert(record.content_sha256 === page.sha256, `${id}: page hash does not match the novel manifest.`);
    assert(record.content_sha256 === sha256(bytes(`public${page.path}`)), `${id}: watermarked page bytes changed.`);
    assert(record.hash_basis === 'watermarked_page_bytes', `${id}: hash basis changed.`);
    const expectedRestricted = EXPECTED_LOCAL_NOVEL_PAGES.has(page.number);
    assert(page.local_only === expectedRestricted, `${id}: upstream local-only set changed.`);
    assert(record.local_only === expectedRestricted, `${id}: local-only gate mismatch.`);
    assert(record.media_gate === (expectedRestricted ? 'not_for_media' : 'review_only'), `${id}: media gate mismatch.`);
    assert(record.control_state === (expectedRestricted ? 'permission_pending' : 'owned'), `${id}: control state mismatch.`);
  }
}

function verifyArticles(records: Map<string, RecordView>) {
  for (const passport of Object.values(articleRightsPassports)) {
    const record = records.get(passport.rightsId);
    assert(record, `${passport.rightsId} is missing.`);
    assert(record.category === 'article' && record.control_state === 'owned', `${passport.rightsId}: article control changed.`);
    assert(record.content_sha256 === hashRecord(passport), `${passport.rightsId}: article rights record hash mismatch.`);
    assert(record.hash_basis === 'canonical_article_rights_record', `${passport.rightsId}: hash basis changed.`);
    assert(record.local_only && record.media_gate === 'review_only', `${passport.rightsId}: local review gate changed.`);
  }
}

function verifyTopics(records: Map<string, RecordView>) {
  let count = 0;
  for (const topic of topicArticles) {
    for (const section of topic.sections) {
      for (const paragraph of section.paragraphs) {
        count += 1;
        const id = `RP-TOPIC-${topic.slug}-${paragraph.id}`;
        const record = records.get(id);
        assert(record, `${id} is missing.`);
        assert(record.content_sha256 === hashRecord({ topic: topic.slug, section: section.id, paragraph }), `${id}: topic hash mismatch.`);
        assert(record.hash_basis === 'canonical_topic_paragraph_record', `${id}: hash basis changed.`);
        assert(record.media_gate === (paragraph.publication_status === 'not_for_media' ? 'not_for_media' : 'review_only'), `${id}: topic media gate mismatch.`);
      }
    }
  }
  assert(count === 13, `Expected 13 topic paragraphs, found ${count}.`);
}

function verifySources(records: Map<string, RecordView>) {
  const dataset = json<{ sources: Array<JsonObject & { source_id: string }> }>(SOURCES_PATH);
  assert(dataset.sources.length === 5, 'Source reference count changed.');
  for (const source of dataset.sources) {
    const id = `RP-SOURCE-${source.source_id}`;
    const record = records.get(id);
    assert(record, `${id} is missing.`);
    assert(record.category === 'source_reference', `${id}: wrong category.`);
    assert(record.control_state === 'permission_pending', `${id}: source rights were inferred without evidence.`);
    assert(record.media_gate === 'not_for_media', `${id}: source reference entered media eligibility.`);
    assert(record.content_sha256 === hashRecord(source), `${id}: source metadata hash mismatch.`);
    assert(record.hash_basis === 'canonical_source_metadata_record', `${id}: hash basis changed.`);
    assert(record.provenance.note.includes('来源元数据') && record.provenance.note.includes('不代表'), `${id}: metadata-only hash boundary is missing.`);
  }
}

function verifyCounts(records: RecordView[], registry: JsonObject) {
  const meta = registry._meta as JsonObject;
  const counts = meta.counts;
  assert(isObject(counts), 'Registry counts are missing.');
  const expectedCategories = {
    site_asset: 5,
    novel_page: novelManifest.totals.pages,
    article: 6,
    topic_paragraph: 13,
    source_reference: 5,
  };
  const actualCategories = Object.fromEntries(
    Object.keys(expectedCategories).map((category) => [
      category,
      records.filter((record) => record.category === category).length,
    ]),
  );
  assert(JSON.stringify(actualCategories) === JSON.stringify(expectedCategories), 'Category counts changed.');
  // The curated, human-decided part of the ledger is pinned; the novel-page part
  // is derived, so re-rendering a longer edition is not reported as a rights change.
  // Novel pages are owned unless the manifest marks them local-only.
  const nonNovel = records.filter((record) => record.category !== 'novel_page');
  const byState = (rows: RecordView[], state: string) =>
    rows.filter((record) => record.control_state === state).length;
  assert(byState(nonNovel, 'owned') === 21, 'Non-novel owned count changed.');
  assert(byState(nonNovel, 'licensed') === 2, 'Non-novel licensed count changed.');
  assert(byState(nonNovel, 'permission_pending') === 6, 'Non-novel permission-pending count changed.');

  const novelPages = records.filter((record) => record.category === 'novel_page');
  const localOnly = novelManifest.rights.local_only_image_pages.length;
  assert(
    byState(novelPages, 'owned') === novelManifest.totals.pages - localOnly,
    'Novel-page owned count does not match the manifest.',
  );
  assert(
    byState(novelPages, 'permission_pending') === localOnly,
    'Novel-page permission-pending count does not match the manifest local-only set.',
  );
  assert(records.filter((record) => record.control_state === 'licensed').length === 2, 'Licensed count changed.');
  // Total pending = the six curated non-novel items plus whatever the manifest
  // still marks local-only; both halves are asserted individually above.
  assert(
    byState(records, 'permission_pending') === 6 + novelManifest.rights.local_only_image_pages.length,
    'Permission-pending count changed.',
  );
  // 15 curated items (5 site assets, 5 source references, 5 topic paragraphs)
  // plus any novel page the manifest still marks local-only.
  assert(
    records.filter((record) => record.media_gate === 'not_for_media').length
      === 15 + novelManifest.rights.local_only_image_pages.length,
    'Not-for-media count changed.',
  );
  // 25 curated local-only items plus any local-only novel page.
  assert(
    records.filter((record) => record.local_only).length
      === 25 + novelManifest.rights.local_only_image_pages.length,
    'Local-only count changed.',
  );
}

function verifyOwnerPage() {
  const page = bytes('src/app/studio/rights-ledger/page.tsx').toString('utf8');
  const component = bytes('src/components/rights-passport-ledger.tsx').toString('utf8');
  assert(page.includes('rightsPassportRegistry') && page.includes('RightsPassportLedger'), 'Owner ledger page is not wired to the registry.');
  assert(component.includes('public_ready=false') && component.includes('must_not_deploy=true'), 'Owner ledger omits release gates.');
  assert(component.includes('permission_pending') && component.includes('not_for_media'), 'Owner ledger omits rights states.');
  assert(!/(?:fetch\(|localStorage|sessionStorage|FormData|\/api\/)/.test(component), 'Owner ledger unexpectedly sends or stores rights data.');
}

function main() {
  assert(statSync(absolute(REGISTRY_PATH)).isFile(), 'Rights passport registry is missing.');
  assert(statSync(absolute(MANIFEST_PATH)).isFile(), 'Rights passport output manifest is missing.');
  const registry = json<JsonObject>(REGISTRY_PATH);
  const manifest = json<JsonObject>(MANIFEST_PATH);
  const records = verifyTopLevel(registry, manifest);
  verifyInputFreshness(registry, manifest);
  verifyCommonContract(records);
  verifyCounts(records, registry);
  const indexed = indexById(records);
  verifyAssets(indexed);
  verifyNovel(indexed);
  verifyArticles(indexed);
  verifyTopics(indexed);
  verifySources(indexed);
  verifyOwnerPage();
  console.log(
    `PASS rights passport contract: ${records.length} records; `
    + `owned=${records.filter((record) => record.control_state === 'owned').length}; `
    + `licensed=${records.filter((record) => record.control_state === 'licensed').length}; `
    + `permission_pending=${records.filter((record) => record.control_state === 'permission_pending').length}; `
    + 'public_ready=0.',
  );
}

main();

import { createHash } from 'node:crypto';
import { readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { articleRightsPassports } from '../src/content/publication-rights';
import { topicArticles } from '../src/content/topics';

const ROOT = process.cwd();
const GENERATED_AT = '2026-08-04T00:00:00+08:00';
const ASSET_MANIFEST_PATH = 'public/assets/asset-manifest.json';
const NOVEL_MANIFEST_PATH = 'public/novel/hero-wuming/novel-manifest.json';
const SOURCES_PATH = 'public/data/sources.json';
const ARTICLE_RIGHTS_PATH = 'src/content/publication-rights.ts';
const TOPICS_PATH = 'src/content/topics.ts';
const OUTPUT_PATH = 'src/data/rights-passports.json';
const OUTPUT_MANIFEST_PATH = 'src/data/rights-passports-manifest.json';

type ControlState = 'owned' | 'licensed' | 'permission_pending';
type MediaGate = 'review_only' | 'not_for_media';
type Category =
  | 'site_asset'
  | 'novel_page'
  | 'article'
  | 'topic_paragraph'
  | 'source_reference';

interface RightsPassportRecord {
  passport_id: string;
  category: Category;
  title: string;
  canonical_reference: string;
  content_sha256: string;
  hash_basis:
    | 'asset_bytes'
    | 'watermarked_page_bytes'
    | 'canonical_article_rights_record'
    | 'canonical_topic_paragraph_record'
    | 'canonical_source_metadata_record';
  control_state: ControlState;
  control_evidence: string;
  license_state: 'no-license-granted';
  reuse_scope: string;
  local_only: boolean;
  media_gate: MediaGate;
  public_ready: false;
  must_not_deploy: true;
  release_gate: 'blocked';
  block_reason: string;
  provenance: {
    dataset: string;
    source_key: string;
    source_ids: string[];
    note: string;
  };
}

interface AssetManifest {
  schema_version: string;
  deployment_authorized: boolean;
  must_not_deploy: boolean;
  assets: Array<{
    path: string;
    sha256: string;
    kind: string;
    source_id: string | null;
    derived_from: string;
    annotation: string;
    rights_scope: string;
    publishable: boolean;
  }>;
}

interface NovelManifest {
  schema_version: string;
  must_not_deploy: boolean;
  deployment_authorized: boolean;
  publication_status: string;
  book: { id: string; title: string; author: string; edition: string };
  rights: { text_owner: string; license: string };
  pages: Array<{
    number: number;
    section_id: string;
    path: string;
    sha256: string;
    rights_status: string;
    local_only: boolean;
    not_for_media: boolean;
  }>;
}

interface SourceDataset {
  _meta: {
    schema_version: string;
    must_not_deploy: boolean;
    deployment_authorized: boolean;
  };
  sources: Array<Record<string, unknown> & { source_id: string; title: string }>;
}

function absolute(relativePath: string): string {
  return join(ROOT, relativePath);
}

function readBytes(relativePath: string): Buffer {
  return readFileSync(absolute(relativePath));
}

function readJson<T>(relativePath: string): T {
  return JSON.parse(readBytes(relativePath).toString('utf8')) as T;
}

function sha256(value: Buffer | string): string {
  return createHash('sha256').update(value).digest('hex');
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonicalize(child)]),
    );
  }
  return value;
}

function canonicalJson(value: unknown): string {
  return JSON.stringify(canonicalize(value));
}

function hashRecord(value: unknown): string {
  return sha256(canonicalJson(value));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assetControl(kind: string): Pick<RightsPassportRecord, 'control_state' | 'control_evidence'> {
  if (kind === 'user_provided_identity_portrait' || kind === 'user_provided_contact_qr') {
    return {
      control_state: 'licensed',
      control_evidence: '原资产台账仅记录站主对本地个人页面审阅用途的明确授权；不外推为公开或商业许可。',
    };
  }
  if (kind === 'generated_decorative' || kind === 'generated_editorial_fiction') {
    return {
      control_state: 'owned',
      control_evidence: '原资产台账登记为本项目生成资产；本站仍未向第三方发放复用许可。',
    };
  }
  return {
    control_state: 'permission_pending',
    control_evidence: '原资产台账未登记足以支持公开复用的授权链，按权利待核处理。',
  };
}

function buildAssetRecords(manifest: AssetManifest): RightsPassportRecord[] {
  assert(manifest.must_not_deploy === true, 'Asset manifest must remain local-only.');
  assert(manifest.deployment_authorized === false, 'Asset manifest unexpectedly authorizes deployment.');

  return manifest.assets.map((asset, index) => {
    const bytes = readBytes(`public/${asset.path}`);
    assert(sha256(bytes) === asset.sha256, `Asset hash mismatch: ${asset.path}`);
    assert(asset.publishable === false, `Asset unexpectedly marked publishable: ${asset.path}`);
    const control = assetControl(asset.kind);
    return {
      passport_id: `RP-ASSET-${String(index + 1).padStart(3, '0')}`,
      category: 'site_asset',
      title: asset.path.split('/').at(-1) ?? asset.path,
      canonical_reference: `/${asset.path}`,
      content_sha256: asset.sha256,
      hash_basis: 'asset_bytes',
      ...control,
      license_state: 'no-license-granted',
      reuse_scope: asset.rights_scope,
      local_only: true,
      media_gate: 'not_for_media',
      public_ready: false,
      must_not_deploy: true,
      release_gate: 'blocked',
      block_reason:
        control.control_state === 'permission_pending'
          ? '权利链未闭环，且原资产台账明确禁止发布。'
          : '现有授权或项目控制范围仅覆盖本地审阅，不覆盖公开发布或媒体复用。',
      provenance: {
        dataset: ASSET_MANIFEST_PATH,
        source_key: asset.path,
        source_ids: asset.source_id ? [asset.source_id] : [],
        note: `${asset.derived_from}；${asset.annotation}`,
      },
    };
  });
}

function buildNovelRecords(manifest: NovelManifest): RightsPassportRecord[] {
  assert(manifest.must_not_deploy === true, 'Novel manifest must remain local-only.');
  assert(manifest.deployment_authorized === false, 'Novel manifest unexpectedly authorizes deployment.');
  assert(manifest.rights.license === 'no-license-granted', 'Novel manifest grants an unexpected license.');

  return manifest.pages.map((page) => {
    const permissionPending = page.local_only || page.rights_status !== 'author_watermarked_derivative';
    return {
      passport_id: `RP-NOVEL-${String(page.number).padStart(3, '0')}`,
      category: 'novel_page',
      title: `${manifest.book.title} · 第 ${page.number} 页`,
      canonical_reference: page.path,
      content_sha256: page.sha256,
      hash_basis: 'watermarked_page_bytes',
      control_state: permissionPending ? 'permission_pending' : 'owned',
      control_evidence: permissionPending
        ? '小说页图清单标记为含家属影像或权利未闭环的第三方图版。'
        : `小说页图清单登记为作者 ${manifest.rights.text_owner} 的带水印派生页。`,
      license_state: 'no-license-granted',
      reuse_scope: page.local_only ? 'local_only' : 'private_project_only',
      local_only: page.local_only,
      media_gate: page.not_for_media ? 'not_for_media' : 'review_only',
      public_ready: false,
      must_not_deploy: true,
      release_gate: 'blocked',
      block_reason: page.local_only
        ? '本页含权利或隐私未闭环图版，只能留在本机且不得进入媒体包。'
        : '作者保留全部权利；当前阅读版只供本地审阅，尚未完成公开发布授权。',
      provenance: {
        dataset: NOVEL_MANIFEST_PATH,
        source_key: `pages[number=${page.number}]`,
        source_ids: [],
        note: `${manifest.book.edition}；${page.section_id}；像素水印页图。`,
      },
    };
  });
}

function buildArticleRecords(): RightsPassportRecord[] {
  return Object.values(articleRightsPassports).map((passport) => ({
    passport_id: passport.rightsId,
    category: 'article',
    title: passport.citation.split('》，')[0]?.replace(/^.*?：《/, '') ?? passport.slug,
    canonical_reference: passport.canonicalPath,
    content_sha256: hashRecord(passport),
    hash_basis: 'canonical_article_rights_record',
    control_state: 'owned',
    control_evidence: passport.originalRights,
    license_state: 'no-license-granted',
    reuse_scope: 'link_sharing_only',
    local_only: true,
    media_gate: 'review_only',
    public_ready: false,
    must_not_deploy: true,
    release_gate: 'blocked',
    block_reason: '文章权利身份证明确标记为本地审阅稿，未发放 CC 或其他开放许可。',
    provenance: {
      dataset: ARTICLE_RIGHTS_PATH,
      source_key: passport.slug,
      source_ids: passport.sourceCredits.map((source) => source.sourceId),
      note: `${passport.statusLabel}；第三方材料不随原创文字授权。`,
    },
  }));
}

function buildTopicRecords(): RightsPassportRecord[] {
  return topicArticles.flatMap((topic) =>
    topic.sections.flatMap((section) =>
      section.paragraphs.map((paragraph) => ({
        passport_id: `RP-TOPIC-${topic.slug}-${paragraph.id}`,
        category: 'topic_paragraph' as const,
        title: `${topic.shortTitle} · ${section.title}`,
        canonical_reference: `/topics/${topic.slug}#${paragraph.id}`,
        content_sha256: hashRecord({
          topic: topic.slug,
          section: section.id,
          paragraph,
        }),
        hash_basis: 'canonical_topic_paragraph_record' as const,
        control_state: 'owned' as const,
        control_evidence: '本站专题的原创编辑文字与结构；所引历史事实和第三方来源不由本站独占。',
        license_state: 'no-license-granted' as const,
        reuse_scope: 'internal_review_only',
        local_only: true,
        media_gate: paragraph.publication_status === 'not_for_media' ? ('not_for_media' as const) : ('review_only' as const),
        public_ready: false as const,
        must_not_deploy: true as const,
        release_gate: 'blocked' as const,
        block_reason:
          paragraph.publication_status === 'not_for_media'
            ? '专题段落已被 not_for_media 门禁阻断，不得进入媒体导出。'
            : '专题仍为本地审阅稿，尚未完成公开发布审核与授权。',
        provenance: {
          dataset: TOPICS_PATH,
          source_key: `${topic.slug}/${section.id}/${paragraph.id}`,
          source_ids: [...paragraph.source_ids],
          note: `mode=${paragraph.mode}；publication_status=${paragraph.publication_status}；provenance_layer=${paragraph.provenance_layer}`,
        },
      })),
    ),
  );
}

function buildSourceRecords(dataset: SourceDataset): RightsPassportRecord[] {
  assert(dataset._meta.must_not_deploy === true, 'Source dataset must remain local-only.');
  assert(dataset._meta.deployment_authorized === false, 'Source dataset unexpectedly authorizes deployment.');
  return dataset.sources.map((source) => ({
    passport_id: `RP-SOURCE-${source.source_id}`,
    category: 'source_reference',
    title: source.title,
    canonical_reference:
      typeof source.public_url === 'string' && source.public_url
        ? source.public_url
        : `/archives#${source.source_id}`,
    content_sha256: hashRecord(source),
    hash_basis: 'canonical_source_metadata_record',
    control_state: 'permission_pending',
    control_evidence: '来源数据没有登记可供本站转授的著作权或馆藏复用许可，因此按权利待核处理。',
    license_state: 'no-license-granted',
    reuse_scope:
      typeof source.public_url === 'string' && source.public_url
        ? 'external_link_and_metadata_reference_only'
        : 'local_metadata_reference_only',
    local_only: !source.public_url,
    media_gate: 'not_for_media',
    public_ready: false,
    must_not_deploy: true,
    release_gate: 'blocked',
    block_reason: '只登记来源元数据与外链；不把原文、影印或馆藏使用权推定为已授权。',
    provenance: {
      dataset: SOURCES_PATH,
      source_key: source.source_id,
      source_ids: [source.source_id],
      note: '该哈希只覆盖本站登记的来源元数据，不代表已取得或哈希过来源原件正文。',
    },
  }));
}

function countBy(records: RightsPassportRecord[], key: 'category' | 'control_state' | 'media_gate'): Record<string, number> {
  return records.reduce<Record<string, number>>((counts, record) => {
    const value = record[key];
    counts[value] = (counts[value] ?? 0) + 1;
    return counts;
  }, {});
}

function main() {
  const assetManifest = readJson<AssetManifest>(ASSET_MANIFEST_PATH);
  const novelManifest = readJson<NovelManifest>(NOVEL_MANIFEST_PATH);
  const sourceDataset = readJson<SourceDataset>(SOURCES_PATH);

  const records = [
    ...buildAssetRecords(assetManifest),
    ...buildNovelRecords(novelManifest),
    ...buildArticleRecords(),
    ...buildTopicRecords(),
    ...buildSourceRecords(sourceDataset),
  ].sort((a, b) => a.passport_id.localeCompare(b.passport_id));

  assert(new Set(records.map((record) => record.passport_id)).size === records.length, 'Duplicate rights passport ID.');

  const inputSha256 = Object.fromEntries(
    [ASSET_MANIFEST_PATH, NOVEL_MANIFEST_PATH, SOURCES_PATH, ARTICLE_RIGHTS_PATH, TOPICS_PATH].map((path) => [
      path,
      sha256(readBytes(path)),
    ]),
  );
  const registry = {
    _meta: {
      schema_version: 'handx-rights-passports-v1',
      generated_at: GENERATED_AT,
      must_not_deploy: true,
      deployment_authorized: false,
      public_ready: false,
      default_policy: 'unknown_rights_are_permission_pending_and_blocked',
      license_policy: 'no-license-granted',
      input_sha256: inputSha256,
      counts: {
        records: records.length,
        by_category: countBy(records, 'category'),
        by_control_state: countBy(records, 'control_state'),
        by_media_gate: countBy(records, 'media_gate'),
        local_only: records.filter((record) => record.local_only).length,
        public_ready: 0,
      },
    },
    records,
  };
  const serialized = `${JSON.stringify(registry, null, 2)}\n`;
  const registrySha256 = sha256(serialized);
  const manifest = {
    schema_version: 'handx-rights-passports-manifest-v1',
    generated_at: GENERATED_AT,
    must_not_deploy: true,
    deployment_authorized: false,
    registry_path: OUTPUT_PATH,
    registry_sha256: registrySha256,
    registry_bytes: Buffer.byteLength(serialized),
    records: records.length,
    input_sha256: inputSha256,
  };
  const manifestSerialized = `${JSON.stringify(manifest, null, 2)}\n`;

  if (process.argv.includes('--check')) {
    assert(statSync(absolute(OUTPUT_PATH)).isFile(), `${OUTPUT_PATH} is missing.`);
    assert(statSync(absolute(OUTPUT_MANIFEST_PATH)).isFile(), `${OUTPUT_MANIFEST_PATH} is missing.`);
    assert(readBytes(OUTPUT_PATH).toString('utf8') === serialized, `${OUTPUT_PATH} is stale.`);
    assert(readBytes(OUTPUT_MANIFEST_PATH).toString('utf8') === manifestSerialized, `${OUTPUT_MANIFEST_PATH} is stale.`);
    console.log(`PASS rights passports are fresh: ${records.length} records, sha256=${registrySha256}`);
    return;
  }

  writeFileSync(absolute(OUTPUT_PATH), serialized);
  writeFileSync(absolute(OUTPUT_MANIFEST_PATH), manifestSerialized);
  console.log(`Built ${records.length} rights passports -> ${OUTPUT_PATH}`);
}

main();

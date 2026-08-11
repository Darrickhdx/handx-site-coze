import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  allMediaMotherContent,
  mediaMotherContent,
  mediaPlatforms,
} from '../src/content/media-studio';
import { articleRightsPassports } from '../src/content/publication-rights';
import {
  getTopicParagraphs,
  topicArticles,
  topicModes,
  topicPublicationStatuses,
} from '../src/content/topics';

type JsonObject = Record<string, unknown>;

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const inputPaths = [
  'src/data/research.json',
  'research-data/graph/manifest.json',
  'src/data/archive-missions-manifest.json',
  'src/data/archive-missions.json',
  'public/novel/hero-wuming/novel-manifest.json',
  'src/data/novel-editions.json',
  'public/assets/asset-manifest.json',
  'src/data/rights-passports.json',
  'src/data/rights-passports-manifest.json',
  'src/content/topics.ts',
  'src/content/publication-rights.ts',
  'src/content/media-studio.ts',
] as const;

const sourceOutputPath = resolve(repoRoot, 'src/data/site-status.json');
const browserOutputPath = resolve(repoRoot, 'public/data/site-status.json');

function fail(message: string): never {
  throw new Error(`site-status contract: ${message}`);
}

function asObject(value: unknown, label: string): JsonObject {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} must be an object`);
  }
  return value as JsonObject;
}

function asArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} must be an array`);
  return value;
}

function asString(value: unknown, label: string): string {
  if (typeof value !== 'string' || !value) fail(`${label} must be a non-empty string`);
  return value;
}

function asNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`${label} must be a finite number`);
  }
  return value;
}

function asBoolean(value: unknown, label: string): boolean {
  if (typeof value !== 'boolean') fail(`${label} must be boolean`);
  return value;
}

function expectEqual<T>(actual: T, expected: T, label: string): void {
  if (actual !== expected) fail(`${label} drifted: expected ${String(expected)}, got ${String(actual)}`);
}

function expectExactKeys(value: JsonObject, expected: readonly string[], label: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (JSON.stringify(actual) !== JSON.stringify(wanted)) {
    fail(`${label} keys drifted: ${actual.join(', ')}`);
  }
}

function parseJson(relativePath: string): JsonObject {
  return asObject(
    JSON.parse(readFileSync(resolve(repoRoot, relativePath), 'utf8')) as unknown,
    relativePath,
  );
}

function sha256(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

function fileSha(relativePath: string): string {
  return sha256(readFileSync(resolve(repoRoot, relativePath)));
}

function countBy<T extends string>(values: readonly T[]): Record<T, number> {
  return values.reduce(
    (counts, value) => ({ ...counts, [value]: (counts[value] ?? 0) + 1 }),
    {} as Record<T, number>,
  );
}

function maximumTimestamp(values: readonly string[]): string {
  const timestamps = values.map((value) => {
    const parsed = Date.parse(value);
    if (!Number.isFinite(parsed)) fail(`invalid source timestamp: ${value}`);
    return parsed;
  });
  return new Date(Math.max(...timestamps)).toISOString();
}

export function buildSiteStatus(): JsonObject {
  const research = parseJson('src/data/research.json');
  expectExactKeys(
    research,
    ['_meta', 'sources', 'claims', 'nodes', 'edges', 'events', 'identity_candidates', 'identity_boundary_claims'],
    'research data',
  );
  const researchMeta = asObject(research._meta, 'research._meta');
  expectExactKeys(
    researchMeta,
    [
      'schema_version',
      'generated_at_utc',
      'publication_layer',
      'preview_approved',
      'deployment_authorized',
      'must_not_deploy',
      'approval_scope',
      'exporter_version',
      'authority_schema_version',
      'authority_layout_version',
      'generation_id',
      'generation_manifest_sha256',
      'research_snapshot_id',
      'research_input_sha256',
      'source_counts',
      'preview_anchor_years',
      'source_scope_counts',
      'source_manifest_file_sha256',
      'disclaimer',
    ],
    'research._meta',
  );
  expectEqual(asString(researchMeta.schema_version, 'research schema'), 'sukaiyuan-site-preview-1.1', 'research schema');
  expectEqual(asBoolean(researchMeta.must_not_deploy, 'research must_not_deploy'), true, 'research must_not_deploy');
  expectEqual(asBoolean(researchMeta.deployment_authorized, 'research deployment_authorized'), false, 'research deployment_authorized');
  expectEqual(asString(researchMeta.publication_layer, 'research publication_layer'), 'previewable', 'research publication_layer');
  const researchCounts = asObject(researchMeta.source_counts, 'research source_counts');
  const researchActualCounts = {
    sources: asArray(research.sources, 'research.sources').length,
    claims: asArray(research.claims, 'research.claims').length,
    nodes: asArray(research.nodes, 'research.nodes').length,
    edges: asArray(research.edges, 'research.edges').length,
  };
  for (const [key, value] of Object.entries(researchActualCounts)) {
    expectEqual(asNumber(researchCounts[key], `research source_counts.${key}`), value, `research ${key} count`);
  }

  const graph = parseJson('research-data/graph/manifest.json');
  expectExactKeys(
    graph,
    ['schema_version', 'project', 'must_not_deploy', 'source_generated_at_utc', 'inputs', 'quarantine', 'counts', 'privacy', 'outputs'],
    'graph manifest',
  );
  expectEqual(asString(graph.schema_version, 'graph schema'), '1.1', 'graph schema');
  expectEqual(asBoolean(graph.must_not_deploy, 'graph must_not_deploy'), true, 'graph must_not_deploy');
  const graphCounts = asObject(graph.counts, 'graph counts');
  const quarantine = asObject(graph.quarantine, 'graph quarantine');
  const privacy = asObject(graph.privacy, 'graph privacy');
  expectExactKeys(
    graphCounts,
    ['audit_sources', 'audit_claims', 'audit_nodes', 'audit_edges', 'legacy_nodes', 'legacy_edges', 'crosswalk_records'],
    'graph counts',
  );
  expectExactKeys(
    privacy,
    ['allowed_public_tiers', 'legacy_detail_included', 'absolute_paths_included', 'crosswalk_creates_facts', 'quarantine_details_included'],
    'graph privacy',
  );
  expectEqual(asString(quarantine.status, 'graph quarantine status'), 'active', 'graph quarantine status');
  expectEqual(asBoolean(privacy.absolute_paths_included, 'graph absolute path flag'), false, 'graph absolute path flag');
  expectEqual(asBoolean(privacy.crosswalk_creates_facts, 'graph crosswalk fact flag'), false, 'graph crosswalk fact flag');
  expectEqual(asBoolean(privacy.quarantine_details_included, 'graph quarantine detail flag'), false, 'graph quarantine detail flag');

  const missionsManifest = parseJson('src/data/archive-missions-manifest.json');
  expectExactKeys(
    missionsManifest,
    ['schema_version', 'generator_version', 'generated_at', 'generation_id', 'must_not_deploy', 'deployment_authorized', 'inputs', 'outputs', 'contracts'],
    'missions manifest',
  );
  expectEqual(asString(missionsManifest.schema_version, 'missions schema'), 'archive-missions-manifest-v1', 'missions schema');
  expectEqual(asBoolean(missionsManifest.must_not_deploy, 'missions must_not_deploy'), true, 'missions must_not_deploy');
  expectEqual(asBoolean(missionsManifest.deployment_authorized, 'missions deployment_authorized'), false, 'missions deployment_authorized');
  const missionContracts = asObject(missionsManifest.contracts, 'missions contracts');
  expectExactKeys(missionContracts, ['public_schema', 'owner_schema', 'evidence_boundary', 'lead_intake_status'], 'missions contracts');
  expectEqual(asString(missionContracts.evidence_boundary, 'missions evidence boundary'), 'execution_progress_not_historical_completion', 'missions evidence boundary');
  expectEqual(asString(missionContracts.lead_intake_status, 'missions lead status'), 'browser_draft_only_no_submission_endpoint', 'missions lead status');
  const missions = parseJson('src/data/archive-missions.json');
  expectExactKeys(missions, ['_meta', 'missions', 'journal'], 'missions public data');
  const missionsMeta = asObject(missions._meta, 'missions._meta');
  expectExactKeys(
    missionsMeta,
    ['schema_version', 'generator_version', 'source_updated_at', 'generated_at', 'generation_id', 'must_not_deploy', 'deployment_authorized', 'evidence_boundary', 'lead_intake_status', 'counts'],
    'missions._meta',
  );
  expectEqual(asString(missionsMeta.schema_version, 'missions public schema'), 'archive-missions-public-v1', 'missions public schema');
  expectEqual(asString(missionsMeta.evidence_boundary, 'missions public boundary'), 'execution_progress_not_historical_completion', 'missions public boundary');
  expectEqual(asBoolean(missionsMeta.must_not_deploy, 'missions public must_not_deploy'), true, 'missions public must_not_deploy');
  expectEqual(asBoolean(missionsMeta.deployment_authorized, 'missions public deployment_authorized'), false, 'missions public deployment_authorized');
  const missionCounts = asObject(missionsMeta.counts, 'missions counts');
  expectExactKeys(missionCounts, ['missions', 'priorities', 'baselineStatuses', 'institutions', 'highlighted', 'completed'], 'missions counts');
  const missionRecords = asArray(missions.missions, 'missions records');
  expectEqual(asNumber(missionCounts.missions, 'mission count'), missionRecords.length, 'mission count');
  expectEqual(asNumber(missionCounts.completed, 'completed mission count'), 0, 'completed mission count');
  for (const [index, mission] of missionRecords.entries()) {
    const status = asObject(asObject(mission, `mission ${index}`).status, `mission ${index}.status`);
    expectEqual(asBoolean(status.completed, `mission ${index}.completed`), false, `mission ${index}.completed`);
  }

  const novel = parseJson('public/novel/hero-wuming/novel-manifest.json');
  expectExactKeys(
    novel,
    ['schema_version', 'project', 'book', 'source', 'generated_at', 'must_not_deploy', 'deployment_authorized', 'publication_status', 'rights', 'totals', 'sections', 'pages', 'output'],
    'novel manifest',
  );
  expectEqual(asString(novel.schema_version, 'novel schema'), 'handx-novel-manifest-1.0', 'novel schema');
  expectEqual(asBoolean(novel.must_not_deploy, 'novel must_not_deploy'), true, 'novel must_not_deploy');
  expectEqual(asBoolean(novel.deployment_authorized, 'novel deployment_authorized'), false, 'novel deployment_authorized');
  expectEqual(asString(novel.publication_status, 'novel publication status'), 'local_review', 'novel publication status');
  const novelBook = asObject(novel.book, 'novel book');
  const novelTotals = asObject(novel.totals, 'novel totals');
  const novelRights = asObject(novel.rights, 'novel rights');
  expectExactKeys(novelTotals, ['pages', 'sections', 'numbered_chapters', 'commentable_sections', 'local_only_pages'], 'novel totals');
  expectExactKeys(novelRights, ['text_owner', 'license', 'watermark', 'notice', 'local_only_image_pages', 'local_only_reason'], 'novel rights');
  expectEqual(asString(novelRights.license, 'novel license'), 'no-license-granted', 'novel license');

  const editions = parseJson('src/data/novel-editions.json');
  expectExactKeys(editions, ['schema_version', 'observed_at', 'must_not_deploy', 'deployment_authorized', 'current_reader', 'editions', 'migration_policy'], 'novel editions');
  expectEqual(asString(editions.schema_version, 'editions schema'), 'handx-novel-editions-1.0', 'editions schema');
  expectEqual(asBoolean(editions.must_not_deploy, 'editions must_not_deploy'), true, 'editions must_not_deploy');
  expectEqual(asBoolean(editions.deployment_authorized, 'editions deployment_authorized'), false, 'editions deployment_authorized');
  const editionRecords = asArray(editions.editions, 'edition records').map((value, index) => asObject(value, `edition ${index}`));
  const candidateEdition = editionRecords.find((edition) => edition.status === 'active_candidate_not_served');
  if (!candidateEdition) fail('active candidate edition missing');
  expectEqual(asBoolean(candidateEdition.served, 'candidate served'), false, 'candidate served');
  expectEqual(asBoolean(candidateEdition.public_ready, 'candidate public_ready'), false, 'candidate public_ready');
  const candidateGates = asObject(candidateEdition.gate_checks, 'candidate gate checks');
  expectExactKeys(
    candidateGates,
    [
      'three_source_artifacts_present',
      'expected_structure_observed',
      'frozen_manifest_present',
      'sha_manifest_present',
      'final_review_report_present',
      'all_figure_rights_passports_present',
      'author_and_legal_rightsholder_confirmed',
      'page_mapping_and_visual_qa_complete',
      'edition_scoped_comments_and_progress_ready',
    ],
    'candidate gate checks',
  );
  const gateValues = Object.values(candidateGates).map((value, index) => asBoolean(value, `candidate gate ${index}`));
  const blockedGates = asArray(candidateEdition.blocked_gates, 'candidate blocked gates').map((value, index) => asString(value, `blocked gate ${index}`));
  expectEqual(gateValues.filter((value) => !value).length, blockedGates.length, 'candidate blocked gate count');

  const assets = parseJson('public/assets/asset-manifest.json');
  expectExactKeys(assets, ['schema_version', 'deployment_authorized', 'must_not_deploy', 'assets'], 'asset manifest');
  expectEqual(asString(assets.schema_version, 'asset schema'), 'local-preview-assets-1.0', 'asset schema');
  expectEqual(asBoolean(assets.must_not_deploy, 'assets must_not_deploy'), true, 'assets must_not_deploy');
  expectEqual(asBoolean(assets.deployment_authorized, 'assets deployment_authorized'), false, 'assets deployment_authorized');
  const assetRecords = asArray(assets.assets, 'asset records').map((value, index) => asObject(value, `asset ${index}`));
  for (const [index, asset] of assetRecords.entries()) {
    expectExactKeys(asset, ['path', 'sha256', 'kind', 'source_id', 'derived_from', 'annotation', 'rights_scope', 'publishable'], `asset ${index}`);
    expectEqual(asString(asset.rights_scope, `asset ${index}.rights_scope`), 'local_internal_preview_only', `asset ${index}.rights_scope`);
    expectEqual(asBoolean(asset.publishable, `asset ${index}.publishable`), false, `asset ${index}.publishable`);
  }

  const rightsRegistry = parseJson('src/data/rights-passports.json');
  expectExactKeys(rightsRegistry, ['_meta', 'records'], 'rights passport registry');
  const rightsRegistryMeta = asObject(rightsRegistry._meta, 'rights registry meta');
  expectExactKeys(
    rightsRegistryMeta,
    ['schema_version', 'generated_at', 'must_not_deploy', 'deployment_authorized', 'public_ready', 'default_policy', 'license_policy', 'input_sha256', 'counts'],
    'rights registry meta',
  );
  expectEqual(asString(rightsRegistryMeta.schema_version, 'rights registry schema'), 'handx-rights-passports-v1', 'rights registry schema');
  expectEqual(asBoolean(rightsRegistryMeta.must_not_deploy, 'rights registry must_not_deploy'), true, 'rights registry must_not_deploy');
  expectEqual(asBoolean(rightsRegistryMeta.deployment_authorized, 'rights registry deployment_authorized'), false, 'rights registry deployment_authorized');
  expectEqual(asBoolean(rightsRegistryMeta.public_ready, 'rights registry public_ready'), false, 'rights registry public_ready');
  expectEqual(asString(rightsRegistryMeta.default_policy, 'rights registry default policy'), 'unknown_rights_are_permission_pending_and_blocked', 'rights registry default policy');
  expectEqual(asString(rightsRegistryMeta.license_policy, 'rights registry license policy'), 'no-license-granted', 'rights registry license policy');
  const rightsRegistryCounts = asObject(rightsRegistryMeta.counts, 'rights registry counts');
  expectExactKeys(rightsRegistryCounts, ['records', 'by_category', 'by_control_state', 'by_media_gate', 'local_only', 'public_ready'], 'rights registry counts');
  const rightsControlCounts = asObject(rightsRegistryCounts.by_control_state, 'rights control counts');
  const rightsMediaCounts = asObject(rightsRegistryCounts.by_media_gate, 'rights media counts');
  const rightsRecords = asArray(rightsRegistry.records, 'rights passport records').map((value, index) => asObject(value, `rights record ${index}`));
  expectEqual(asNumber(rightsRegistryCounts.records, 'rights record count'), rightsRecords.length, 'rights record count');
  expectEqual(asNumber(rightsRegistryCounts.public_ready, 'rights public-ready count'), 0, 'rights public-ready count');
  for (const [index, record] of rightsRecords.entries()) {
    expectEqual(asString(record.license_state, `rights ${index}.license_state`), 'no-license-granted', `rights ${index}.license_state`);
    expectEqual(asBoolean(record.public_ready, `rights ${index}.public_ready`), false, `rights ${index}.public_ready`);
    expectEqual(asBoolean(record.must_not_deploy, `rights ${index}.must_not_deploy`), true, `rights ${index}.must_not_deploy`);
    expectEqual(asString(record.release_gate, `rights ${index}.release_gate`), 'blocked', `rights ${index}.release_gate`);
  }
  const rightsManifest = parseJson('src/data/rights-passports-manifest.json');
  expectExactKeys(
    rightsManifest,
    ['schema_version', 'generated_at', 'must_not_deploy', 'deployment_authorized', 'registry_path', 'registry_sha256', 'registry_bytes', 'records', 'input_sha256'],
    'rights passport manifest',
  );
  expectEqual(asString(rightsManifest.schema_version, 'rights manifest schema'), 'handx-rights-passports-manifest-v1', 'rights manifest schema');
  expectEqual(asBoolean(rightsManifest.must_not_deploy, 'rights manifest must_not_deploy'), true, 'rights manifest must_not_deploy');
  expectEqual(asBoolean(rightsManifest.deployment_authorized, 'rights manifest deployment_authorized'), false, 'rights manifest deployment_authorized');
  expectEqual(asString(rightsManifest.registry_path, 'rights manifest registry path'), 'src/data/rights-passports.json', 'rights manifest registry path');
  expectEqual(asString(rightsManifest.registry_sha256, 'rights registry sha'), fileSha('src/data/rights-passports.json'), 'rights registry sha');
  expectEqual(asNumber(rightsManifest.records, 'rights manifest record count'), rightsRecords.length, 'rights manifest record count');

  const topicParagraphs = topicArticles.flatMap((topic) => {
    expectEqual(topic.reviewStatus, 'local_review', `topic ${topic.slug} review status`);
    return getTopicParagraphs(topic);
  });
  for (const paragraph of topicParagraphs) {
    if (!topicModes.includes(paragraph.mode)) fail(`unknown topic mode: ${paragraph.mode}`);
    if (!topicPublicationStatuses.includes(paragraph.publication_status)) {
      fail(`unknown topic publication status: ${paragraph.publication_status}`);
    }
  }
  const topicStatusCounts = countBy(topicParagraphs.map((paragraph) => paragraph.publication_status));
  const publicReadyTopics = topicParagraphs.filter((paragraph) => paragraph.publication_status === 'public_ready').length;
  expectEqual(publicReadyTopics, 0, 'public-ready topic paragraph count');

  const rightsPassports = Object.values(articleRightsPassports);
  for (const passport of rightsPassports) {
    expectEqual(passport.status, 'draft_all_rights_reserved', `rights passport ${passport.rightsId} status`);
    expectEqual(passport.licenseState, 'no-license-granted', `rights passport ${passport.rightsId} license`);
    expectEqual(passport.publicUrl, null, `rights passport ${passport.rightsId} public URL`);
  }

  for (const content of allMediaMotherContent) {
    expectEqual(content.rights_passport.public_release_authorized, false, `media ${content.id} release authorization`);
  }
  for (const platform of mediaPlatforms) {
    expectEqual(platform.direct_publish, false, `platform ${platform.id} direct publish`);
  }

  const assembledAt = maximumTimestamp([
    asString(researchMeta.generated_at_utc, 'research generated_at'),
    asString(graph.source_generated_at_utc, 'graph generated_at'),
    asString(missionsManifest.generated_at, 'missions generated_at'),
    asString(novel.generated_at, 'novel generated_at'),
    asString(editions.observed_at, 'editions observed_at'),
    asString(rightsRegistryMeta.generated_at, 'rights registry generated_at'),
  ]);

  const payload: JsonObject = {
    schema_version: 'handx-site-status-1.0',
    project: {
      name: 'Handx web0.1',
      version: '0.1.0',
      build_state: 'local_review',
    },
    assembled_at: assembledAt,
    evidence_boundary: {
      status_axis: 'inventory_and_gate_state_only',
      historical_completion_percentage: null,
      historical_counts_are_inventory_not_completion: true,
      mission_counts_are_execution_baseline_not_historical_facts: true,
      notice: '本页只汇总数据代次、工程产物、权利门槛和服务开关；不计算、暗示或展示历史研究完成率。',
    },
    machine_contract: {
      service_mode: 'research_interview_only',
      uploads: false,
      model_processing: 'off',
      external_egress: 'deny',
      auto_fact_generation: false,
      payment: false,
      auto_publish: false,
      must_not_deploy: true,
      deployment_authorized: false,
    },
    service_state: {
      availability: 'not_open',
      lead_intake: 'browser_draft_only_no_submission_endpoint',
      diagnostic_answer_storage: 'off',
      claim_creation_from_reader_input: false,
      owner_review_required: true,
    },
    historical_data_generations: [
      {
        id: 'research-public-preview',
        label: '研究公开预览子集',
        schema_version: researchMeta.schema_version,
        snapshot: researchMeta.research_snapshot_id,
        generated_at: researchMeta.generated_at_utc,
        state: 'local_preview_subset',
        inventory: researchActualCounts,
        source_scope: researchMeta.source_scope_counts,
        boundary: '仅为 V7R4 安全子集；同名记录不能自动拼成连续生平。',
      },
      {
        id: 'audited-knowledge-graph',
        label: '审计图谱与 Legacy 隔离层',
        schema_version: graph.schema_version,
        generated_at: graph.source_generated_at_utc,
        state: 'audited_with_active_quarantine',
        inventory: {
          audited_sources: asNumber(graphCounts.audit_sources, 'audit sources'),
          audited_claims: asNumber(graphCounts.audit_claims, 'audit claims'),
          audited_nodes: asNumber(graphCounts.audit_nodes, 'audit nodes'),
          audited_edges: asNumber(graphCounts.audit_edges, 'audit edges'),
          legacy_nodes: asNumber(graphCounts.legacy_nodes, 'legacy nodes'),
          legacy_edges: asNumber(graphCounts.legacy_edges, 'legacy edges'),
          crosswalk_records: asNumber(graphCounts.crosswalk_records, 'crosswalk records'),
        },
        boundary: 'Legacy 与迁移映射只提供线索；隔离层不会自动生成事实关系。',
      },
      {
        id: 'archive-mission-baseline',
        label: '查档行动基线',
        schema_version: missionsMeta.schema_version,
        generated_at: missionsMeta.generated_at,
        source_updated_at: missionsMeta.source_updated_at,
        state: 'pre_execution_baseline',
        inventory: {
          missions: asNumber(missionCounts.missions, 'missions count'),
          institutions: asNumber(missionCounts.institutions, 'mission institution count'),
          highlighted: asNumber(missionCounts.highlighted, 'highlighted mission count'),
          completed: asNumber(missionCounts.completed, 'completed mission count'),
        },
        boundary: '这是待办与下一动作，不是新增史实，也不是历史研究完成率。',
      },
    ],
    product_artifacts: [
      {
        id: 'novel-reader',
        label: '《英雄无名》本地阅读器',
        version: asString(novelBook.version, 'novel version'),
        state: 'local_reader',
        publication_status: novel.publication_status,
        inventory: {
          pages: asNumber(novelTotals.pages, 'novel pages'),
          numbered_chapters: asNumber(novelTotals.numbered_chapters, 'novel numbered chapters'),
          commentable_sections: asNumber(novelTotals.commentable_sections, 'novel commentable sections'),
        },
        public_ready: false,
      },
      {
        id: asString(candidateEdition.edition_id, 'candidate edition id'),
        label: '《英雄无名》下一版候选',
        version: asString(candidateEdition.version, 'candidate edition version'),
        state: asString(candidateEdition.status, 'candidate edition status'),
        gate_state: {
          total: gateValues.length,
          passed: gateValues.filter(Boolean).length,
          blocked: blockedGates.length,
          blocked_gate_ids: blockedGates,
        },
        served: false,
        public_ready: false,
      },
      {
        id: 'topic-editorial',
        label: '历史专题编辑层',
        state: 'local_review',
        inventory: {
          articles: topicArticles.length,
          paragraphs: topicParagraphs.length,
          review_only: topicStatusCounts.review_only ?? 0,
          not_for_media: topicStatusCounts.not_for_media ?? 0,
          public_ready: publicReadyTopics,
        },
      },
      {
        id: 'media-studio',
        label: '媒体矩阵素材工作台',
        state: 'review_only',
        inventory: {
          mother_content_total: allMediaMotherContent.length,
          eligible_for_review_package: mediaMotherContent.length,
          blocked_from_media: allMediaMotherContent.length - mediaMotherContent.length,
          platform_templates: mediaPlatforms.length,
        },
        direct_publish: false,
        public_ready: false,
      },
    ],
    rights_and_publication: {
      state: 'all_external_release_blocked',
      registry: {
        schema_version: rightsRegistryMeta.schema_version,
        records: rightsRegistryCounts.records,
        owned: asNumber(rightsControlCounts.owned, 'rights owned count'),
        licensed_for_local_review: asNumber(rightsControlCounts.licensed, 'rights licensed count'),
        permission_pending: asNumber(rightsControlCounts.permission_pending, 'rights permission pending count'),
        review_only: asNumber(rightsMediaCounts.review_only, 'rights review-only count'),
        not_for_media: asNumber(rightsMediaCounts.not_for_media, 'rights not-for-media count'),
        local_only: asNumber(rightsRegistryCounts.local_only, 'rights local-only count'),
        public_ready: asNumber(rightsRegistryCounts.public_ready, 'rights public-ready count'),
      },
      article_passports: {
        total: rightsPassports.length,
        draft_all_rights_reserved: rightsPassports.length,
        licensed_for_republication: 0,
      },
      static_assets: {
        total: assetRecords.length,
        local_internal_preview_only: assetRecords.length,
        publishable: 0,
      },
      novel: {
        license: novelRights.license,
        local_only_pages: asNumber(novelTotals.local_only_pages, 'novel local-only pages'),
        public_ready: false,
      },
      topics: {
        public_ready_paragraphs: publicReadyTopics,
        not_for_media_paragraphs: topicStatusCounts.not_for_media ?? 0,
      },
      media: {
        package_status: 'review_only',
        public_release_authorized: false,
        auto_publish: false,
      },
    },
    input_fingerprints: inputPaths.map((path) => ({
      path,
      sha256: fileSha(path),
    })),
  };

  return {
    ...payload,
    generation_id: `status-${sha256(JSON.stringify(payload))}`,
  };
}

export function serializeSiteStatus(value: JsonObject): string {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function main(): void {
  const serialized = serializeSiteStatus(buildSiteStatus());
  writeFileSync(sourceOutputPath, serialized, 'utf8');
  writeFileSync(browserOutputPath, serialized, 'utf8');
  process.stdout.write('site-status: generated deterministic source and browser contracts\n');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}

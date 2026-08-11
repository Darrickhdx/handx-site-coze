/**
 * Graph types, label maps and pure helpers, with no import of the graph data.
 *
 * Split out for the same reason as src/lib/novel-types: `@/lib/graph-wiki-data`
 * imports research-data/graph/audit-graph.json, 406 KB of sources, claims and
 * locators. Three client components imported it for a handful of Chinese label
 * strings and one pure function, and each of them therefore carried the whole
 * audit graph into the browser — including on /graph, which is published.
 */

export type PublicTier = 'P0' | 'P1';
export type EntityType = 'Person' | 'Event' | 'Organization' | 'Place' | 'Role' | 'Document';
export type ClaimStatus =
  | 'working_verified'
  | 'needs_archive'
  | 'provisional'
  | 'rejected_for_fact'
  | 'not_supported';
export type EdgeStatus = 'working_verified' | 'needs_archive' | 'provisional' | 'not_supported';
export type MigrationStatus =
  | 'mapped_index_only'
  | 'candidate_identity_split'
  | 'endpoint_only'
  | 'legacy_candidate'
  | 'blocked_for_fact';

export interface AuditSource {
  source_id: string;
  title: string;
  source_type: string;
  creator_or_publisher: string;
  date_or_range: string;
  evidence_tier: string;
  public_tier: PublicTier;
  locator: string;
  public_url: string;
  public_url_status:
    | 'official_or_institutional'
    | 'registered_public_locator'
    | 'not_available';
  local_copy_status:
    | 'registered_local_carrier'
    | 'not_recorded_in_public_projection';
}

export interface AuditClaim {
  claim_id: string;
  claim_type: string;
  status: ClaimStatus;
  subject_id: string;
  predicate: string;
  object_or_value: string;
  time_start: string;
  time_end: string;
  place_ids: string[];
  source_ids: string[];
  locator: string;
  evidence_tier: string;
  independence_count: string;
  confidence: string;
  public_tier: PublicTier;
  conflict_set_id: string;
  conflicts_with: string[];
  writing_use: string;
  quote_or_assertion: string;
}

export interface AuditNode {
  entity_id: string;
  entity_type: EntityType;
  canonical_label: string;
  variant_label: string;
  alias_group: string;
  identity_status: string;
  valid_time_start: string;
  valid_time_end: string;
  public_tier: PublicTier;
  source_ids: string[];
}

export interface AuditEdge {
  edge_id: string;
  from_entity_id: string;
  relation: string;
  to_entity_id: string;
  time_start: string;
  time_end: string;
  claim_ids: string[];
  edge_status: EdgeStatus;
  public_tier: PublicTier;
}

export interface AuditGraphBundle {
  schema_version: string;
  layer: 'audited_public_projection';
  scope: string;
  source_generated_at_utc: string;
  warning: string;
  model: string;
  sources: AuditSource[];
  claims: AuditClaim[];
  nodes: AuditNode[];
  edges: AuditEdge[];
}

export interface MigrationRecord {
  legacy_key: string;
  migration_status: MigrationStatus;
  new_entity_ids: string[];
  new_relation_ids: string[];
  candidate_claim_ids: string[];
  risk_flags: string[];
  decision: string;
}

export interface LegacyNode {
  id: string;
  label: string;
  group: string;
  subgroup: string;
  period: string;
  title: string;
  legacy_reliability: string;
  migration: MigrationRecord;
}

export interface LegacyEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  period: string;
  migration: MigrationRecord;
}

export interface LegacyGraphBundle {
  schema_version: string;
  layer: 'legacy_clue_only';
  warning: string;
  source_digest: string;
  source_built: string;
  periods: string[];
  nodes: LegacyNode[];
  edges: LegacyEdge[];
}

export interface CrosswalkRecord extends MigrationRecord {
  record_type: 'node' | 'edge';
  legacy_label: string;
  legacy_group: string;
  legacy_reliability: string;
  legacy_period: string;
}

export interface LegacyCrosswalkBundle {
  schema_version: string;
  warning: string;
  source_digest: string;
  records: CrosswalkRecord[];
}

export interface GraphManifest {
  schema_version: string;
  project: string;
  must_not_deploy: true;
  source_generated_at_utc: string;
  counts: {
    audit_sources: number;
    audit_claims: number;
    audit_nodes: number;
    audit_edges: number;
    legacy_nodes: number;
    legacy_edges: number;
    crosswalk_records: number;
  };
  privacy: {
    allowed_public_tiers: PublicTier[];
    legacy_detail_included: false;
    absolute_paths_included: false;
    crosswalk_creates_facts: false;
  };
}

export const entityTypeLabels: Record<EntityType, string> = {
  Person: '人物',
  Event: '事件',
  Organization: '机构',
  Place: '地点',
  Role: '职务记录',
  Document: '文献',
};

export const claimStatusLabels: Record<ClaimStatus, string> = {
  working_verified: '当前可确认',
  needs_archive: '仍需档案核验',
  provisional: '候选主张',
  rejected_for_fact: '不得作为事实',
  not_supported: '现有材料不支持',
};

export const edgeStatusLabels: Record<EdgeStatus, string> = {
  working_verified: '工作核验',
  needs_archive: '需档案核验',
  provisional: '候选关系',
  not_supported: '不支持',
};

export const migrationStatusLabels: Record<MigrationStatus, string> = {
  mapped_index_only: '仅映射索引',
  candidate_identity_split: '候选身份分拆',
  endpoint_only: '仅端点可定位',
  legacy_candidate: '旧研究候选',
  blocked_for_fact: '禁止迁移为事实',
};

export function claimBucket(claim: AuditClaim): 'verified' | 'pending' | 'blocked' {
  if (
    claim.status === 'rejected_for_fact' ||
    claim.status === 'not_supported'
  ) {
    return 'blocked';
  }
  if (claim.status === 'working_verified') return 'verified';
  return 'pending';
}

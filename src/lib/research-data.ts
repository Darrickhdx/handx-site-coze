import rawResearch from '@/data/research.json';
import type { ClaimCardProps, IdentityLinkStatus } from '@/components/claim-card';
import type { EvidenceLevel } from '@/components/evidence-legend';
import type { GraphEdge, GraphNode, RelationStatus } from '@/components/relation-graph';
import type { ContentScope, SourceCardProps, SourceType } from '@/components/source-card';
import type { TimelineItem, TimelineEventCategory } from '@/components/timeline-view';

export const research = rawResearch;
export const dataMeta = research._meta;
export const sourceRecords = research.sources;
export const claimRecords = research.claims;
export const nodeRecords = research.nodes;
export const edgeRecords = research.edges;
export const eventRecords = research.events;

export type ResearchClaim = (typeof claimRecords)[number];
export type ResearchSource = (typeof sourceRecords)[number];
export type ResearchNode = (typeof nodeRecords)[number];
export type ResearchEvent = (typeof eventRecords)[number];

export const identityCandidateClaims = research.identity_candidates as ResearchClaim[];
export const identityBoundaryClaims = research.identity_boundary_claims as ResearchClaim[];

export const sourceById = new Map(sourceRecords.map((source) => [source.source_id, source]));
export const claimById = new Map(claimRecords.map((claim) => [claim.claim_id, claim]));
export const nodeById = new Map(nodeRecords.map((node) => [node.entity_id, node]));

const claimTitles: Record<string, string> = {
  'CL-013': '1936年朱自清记下“留守司令苏开元团长”',
  'CL-014': '苏开元谈学生救国会的组织独立性',
  'CL-092': '1933年公报刊载第435团团长任命',
  'CL-167': '1942年编成表并列李大超与苏开元为高级参议',
  'CL-168': '1942年日方编成表列苏开元为高级参议',
};

const entityTypeLabels: Record<string, string> = {
  Person: '人物',
  Organization: '机构',
  Place: '地点',
  Role: '职务',
  Document: '文献',
};

export function evidenceLevelForTier(tier: string): EvidenceLevel {
  if (tier === 'A') return 'archive';
  if (tier === 'B') return 'official';
  return 'speculation';
}

export function claimTitle(claim: ResearchClaim): string {
  return claimTitles[claim.claim_id] ?? claim.quote_or_assertion;
}

function identityLinkStatus(value: string): IdentityLinkStatus {
  switch (value) {
    case 'not-applicable':
    case 'unresolved':
    case 'candidate':
    case 'verified':
    case 'rejected':
      return value;
    default:
      throw new Error(`Unexpected identity_link_status: ${value}`);
  }
}

export function claimCard(claim: ResearchClaim): ClaimCardProps {
  const identityBlocksScene =
    claim.identity_link_status === 'candidate' ||
    claim.identity_link_status === 'unresolved' ||
    claim.identity_link_status === 'rejected';
  const isProvisionalIdentityHypothesis =
    claim.status === 'provisional' && identityBlocksScene;
  return {
    title: claimTitle(claim),
    summary: claim.quote_or_assertion,
    evidenceLevel: evidenceLevelForTier(claim.evidence_tier),
    carrierCount: claim.source_ids.length,
    independenceCount: isProvisionalIdentityHypothesis
      ? undefined
      : Number(claim.independence_count),
    sourceInterpretation: isProvisionalIdentityHypothesis
      ? '候选身份主张只表达待核假设，不增加身份桥的独立证据数。'
      : undefined,
    certainty: isProvisionalIdentityHypothesis
      ? undefined
      : claim.confidence === 'high' ? 'high' : 'medium',
    date: claim.time_start,
    disputed: claim.status === 'provisional' || identityBlocksScene,
    identityLinkStatus: identityLinkStatus(claim.identity_link_status),
    sceneEligible: claim.scene_eligible,
    verifiedExtent: claim.verified_extent,
    identityAnchorIds: claim.identity_anchor_ids,
    identityAnchorsRedacted: claim.identity_anchors_redacted,
    tags: [
      claim.claim_id,
      identityBlocksScene ? '身份未闭环' : claim.status === 'provisional' ? '候选' : '工作核验',
    ],
  };
}

export const featuredClaimCards = eventRecords
  .map((event) => {
    const eventClaims = event.claim_ids
      .map((claimId) => claimById.get(claimId))
      .filter((claim): claim is ResearchClaim => claim !== undefined);
    return eventClaims.find((claim) => claim.subject_id === 'P-001') ?? eventClaims[0];
  })
  .filter((claim): claim is ResearchClaim => claim !== undefined)
  .map(claimCard);

function sourceType(source: ResearchSource): SourceType {
  const text = `${source.source_type} ${source.title}`;
  if (text.includes('档案') || text.includes('JACAR')) return 'archive';
  if (text.includes('校刊')) return 'newspaper';
  if (text.includes('公报') || text.includes('官职资料库')) return 'official_record';
  return 'other';
}

function sourceYear(source: ResearchSource): number | undefined {
  const match = source.date_or_range.match(/(?:18|19|20)\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function contentScope(value: string): ContentScope {
  switch (value) {
    case 'metadata-only':
    case 'cover-visible':
    case 'body-verified':
    case 'interpreted':
      return value;
    default:
      throw new Error(`Unexpected content_scope: ${value}`);
  }
}

export function sourceCard(source: ResearchSource): SourceCardProps {
  return {
    sourceId: source.source_id,
    title: source.title,
    type: sourceType(source),
    author: source.creator_or_publisher,
    year: sourceYear(source),
    dateLabel: source.date_or_range,
    accessStatus: source.public_url ? 'public' : 'restricted',
    evidenceLevel: evidenceLevelForTier(source.evidence_tier),
    publicUrl: source.public_url || undefined,
    carrierStatus: source.carrier_status,
    representationOf: source.representation_of || undefined,
    contentScope: contentScope(source.content_scope),
    verifiedExtent: source.verified_extent,
    totalExtentKnown: source.total_extent_known,
    unreadExtent: source.unread_extent,
  };
}

export const sourceCards = sourceRecords.map(sourceCard);

function eventCategory(category: string): TimelineEventCategory {
  if (
    category === 'official' ||
    category === 'military' ||
    category === 'education' ||
    category === 'social'
  ) return category;
  return 'other';
}

function eventPrecision(precision: string): TimelineItem['datePrecision'] {
  if (precision === 'exact') return 'exact';
  if (precision === 'month') return 'month';
  if (precision === 'year') return 'year';
  return 'uncertain';
}

export const timelineItems: TimelineItem[] = eventRecords.map((record) => ({
  id: record.event_id,
  year: record.year,
  month: record.month ?? undefined,
  day: record.day ?? undefined,
  datePrecision: eventPrecision(record.date_precision),
  title: record.title,
  description: record.description,
  category: eventCategory(record.category),
  evidenceLevel: evidenceLevelForTier(record.evidence_tier),
  disputed:
    record.status === 'provisional' ||
    record.identity_link_statuses.some((status) =>
      status === 'candidate' || status === 'unresolved' || status === 'rejected'
    ),
  sceneEligible: record.scene_eligible,
  identityLinkStatuses: record.identity_link_statuses,
  sourceCount: record.independence_count,
  location: record.location || undefined,
  context: record.context || undefined,
  persons: record.people,
}));

export const personNodes = nodeRecords.filter((node) => node.entity_type === 'Person');

export const personSummaries: Record<string, string> = {
  'P-001': '核心研究对象。当前公开预览只陈列1933、1936和1942三组同名史料记录；这些记录尚未通过身份桥证成同一人的连续生平。1929记录与苏开元—苏凯元身份桥因混合来源依赖暂缓显示。',
  'P-006': '《绥行纪略》作者。其1936年11月21日在平地泉的见闻，是苏开元研究目前最重要的同期叙述之一。',
};

export function personRelation(nodeId: string): string {
  if (nodeId === 'P-001') return '核心研究对象';
  if (nodeId === 'P-006') return '1936年记录者与见证人';
  return '关联人物';
}

export function nodeLabel(nodeId: string): string {
  return nodeById.get(nodeId)?.canonical_label ?? nodeId;
}

const graphLabels: Record<string, string> = {
  'P-001': '苏开元',
  'P-006': '朱自清',
  'O-012': '学生救国会',
  'L-002': '平地泉',
  'R-002': '第435团团长',
  'D-027': '1942编成表',
  'R-039': '高级参议',
};

const graphPositions: Record<string, { x: number; y: number }> = {
  'P-001': { x: 0, y: 0 },
  'P-006': { x: 245, y: -165 },
  'O-012': { x: 255, y: -25 },
  'L-002': { x: 245, y: 150 },
  'R-002': { x: -75, y: 185 },
  'D-027': { x: -245, y: 150 },
  'R-039': { x: -115, y: -160 },
};

function graphNodeStatus(node: ResearchNode): GraphNode['status'] {
  if (node.entity_id === 'P-001') return 'candidate';
  return 'confirmed';
}

export const graphNodes: GraphNode[] = nodeRecords.map((node) => {
  const relationCount = edgeRecords.filter(
    (edge) => edge.from_entity_id === node.entity_id || edge.to_entity_id === node.entity_id
  ).length;
  return {
    id: node.entity_id,
    name: graphLabels[node.entity_id] ?? node.canonical_label,
    x: graphPositions[node.entity_id]?.x ?? 0,
    y: graphPositions[node.entity_id]?.y ?? 0,
    status: graphNodeStatus(node),
    isCore: node.entity_id === 'P-001',
    entityType: entityTypeLabels[node.entity_type] ?? node.entity_type,
    sourceCount: node.source_ids.length,
    relationCount,
  };
});

const edgeLabels: Record<string, string> = {
  'REL-010': '朱自清文中记为遇见',
  'REL-011': '文中记录于',
  'REL-012': '朱自清文中记为向其表态',
  'REL-084': '公报中被列为获任命',
  'REL-122': '编成表中被列为',
};

function relationStatus(status: string): RelationStatus {
  return status === 'provisional' ? 'candidate' : 'confirmed';
}

export const graphEdges: GraphEdge[] = edgeRecords.map((edge) => ({
  id: edge.edge_id,
  source: edge.from_entity_id,
  target: edge.to_entity_id,
  label: edgeLabels[edge.edge_id] ?? edge.relation,
  status: edge.claim_ids.some((claimId) => {
    const status = claimById.get(claimId)?.identity_link_status;
    return status === 'candidate' || status === 'unresolved' || status === 'rejected';
  })
    ? 'candidate'
    : relationStatus(edge.edge_status),
}));

export const verifiedClaimCount = claimRecords.filter(
  (claim) => claim.status === 'working_verified'
).length;
export const provisionalClaimCount = claimRecords.filter(
  (claim) => claim.status === 'provisional'
).length;
export const identityBlockedClaimCount = identityBoundaryClaims.length;
export const sceneEligibleClaimCount = claimRecords.filter(
  (claim) => claim.scene_eligible
).length;

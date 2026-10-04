import auditGraphJson from '../../research-data/graph/audit-graph.json';
import graphManifestJson from '../../research-data/graph/manifest.json';
import legacyCrosswalkJson from '../../research-data/graph/legacy-crosswalk.json';
import legacyGraphJson from '../../research-data/graph/legacy-graph.json';
import { claimLocatorCorrections, sourceLocatorCorrections } from '@/content/research-updates';


// Types, label maps and claimBucket now live in ./graph-wiki-types, which
// imports no JSON. Re-exported here so server-side callers keep one import.
export * from './graph-wiki-types';

import type {
  AuditClaim,
  AuditEdge,
  AuditGraphBundle,
  AuditSource,
  CrosswalkRecord,
  GraphManifest,
  LegacyCrosswalkBundle,
  LegacyGraphBundle,
} from './graph-wiki-types';


// Keep the generated research snapshot reproducible. Dated reading corrections
// change the displayed locator/transcription, never an evidence or identity status.
const storedAuditGraph = auditGraphJson as unknown as AuditGraphBundle;
const correctedYearClaims = new Set(['CL-149', 'CL-176', 'CL-177', 'CL-179']);
export const auditGraph: AuditGraphBundle = {
  ...storedAuditGraph,
  sources: storedAuditGraph.sources.map((source) => ({
    ...source,
    locator: sourceLocatorCorrections[source.source_id] ?? source.locator,
  })),
  claims: storedAuditGraph.claims.map((claim) => {
    const correctYear = (value: string) => correctedYearClaims.has(claim.claim_id)
      ? value.replaceAll('三年生', '二年生')
      : value;
    return {
      ...claim,
      object_or_value: correctYear(claim.object_or_value),
      quote_or_assertion: correctYear(claim.quote_or_assertion),
      writing_use: correctYear(claim.writing_use),
      locator: claimLocatorCorrections[claim.claim_id] ?? correctYear(claim.locator),
    };
  }),
  nodes: storedAuditGraph.nodes.map((node) => node.entity_id === 'R-042'
    ? {
        ...node,
        canonical_label: node.canonical_label.replaceAll('三年生', '二年生'),
        variant_label: node.variant_label.replaceAll('三年生', '二年生'),
      }
    : node),
};
export const legacyGraph = legacyGraphJson as unknown as LegacyGraphBundle;
export const legacyCrosswalk = legacyCrosswalkJson as unknown as LegacyCrosswalkBundle;
export const graphManifest = graphManifestJson as unknown as GraphManifest;

export const auditNodeById = new Map(
  auditGraph.nodes.map((node) => [node.entity_id, node]),
);
export const auditClaimById = new Map(
  auditGraph.claims.map((claim) => [claim.claim_id, claim]),
);
export const auditSourceById = new Map(
  auditGraph.sources.map((source) => [source.source_id, source]),
);
export const auditEdgeById = new Map(
  auditGraph.edges.map((edge) => [edge.edge_id, edge]),
);
export const legacyNodeById = new Map(
  legacyGraph.nodes.map((node) => [node.id, node]),
);


export function entityClaims(entityId: string): AuditClaim[] {
  return auditGraph.claims.filter((claim) => claim.subject_id === entityId);
}

export function entityEdges(entityId: string): AuditEdge[] {
  return auditGraph.edges.filter(
    (edge) =>
      edge.from_entity_id === entityId || edge.to_entity_id === entityId,
  );
}

export function relatedEntityId(edge: AuditEdge, entityId: string): string {
  return edge.from_entity_id === entityId
    ? edge.to_entity_id
    : edge.from_entity_id;
}

export function relatedSourcesForEntity(entityId: string): AuditSource[] {
  const node = auditNodeById.get(entityId);
  if (!node) return [];

  const sourceIds = new Set(node.source_ids);
  for (const claim of entityClaims(entityId)) {
    for (const sourceId of claim.source_ids) sourceIds.add(sourceId);
  }
  return [...sourceIds]
    .map((sourceId) => auditSourceById.get(sourceId))
    .filter((source): source is AuditSource => source !== undefined);
}

export function legacyCrosswalkForEntity(entityId: string): CrosswalkRecord[] {
  return legacyCrosswalk.records.filter(
    (record) =>
      record.record_type === 'node' &&
      record.new_entity_ids.includes(entityId),
  );
}

import auditGraphJson from '../../research-data/graph/audit-graph.json';
import graphManifestJson from '../../research-data/graph/manifest.json';
import legacyCrosswalkJson from '../../research-data/graph/legacy-crosswalk.json';
import legacyGraphJson from '../../research-data/graph/legacy-graph.json';


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


export const auditGraph = auditGraphJson as unknown as AuditGraphBundle;
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

import {
  peopleDossiers,
  personSourceCarrierFamilyById,
  type PersonMilestoneMode,
} from '../src/content/people-dossiers';
import auditGraph from '../research-data/graph/audit-graph.json';

function fail(message: string): never {
  throw new Error(message);
}

const nodeById = new Map(auditGraph.nodes.map((node) => [node.entity_id, node]));
const claimById = new Map(auditGraph.claims.map((claim) => [claim.claim_id, claim]));
const sourceById = new Map(auditGraph.sources.map((source) => [source.source_id, source]));
const edgeById = new Map(auditGraph.edges.map((edge) => [edge.edge_id, edge]));
const expectedPeople = ['P-001', 'P-005', 'P-006', 'P-007', 'P-010', 'P-017'];
const expectedRelationContracts: Record<string, { status: string; claimIds: readonly string[] }> = {
  'REL-010': { status: 'working_verified', claimIds: ['CL-013'] },
  'REL-033': { status: 'needs_archive', claimIds: ['CL-040'] },
  'REL-034': { status: 'needs_archive', claimIds: ['CL-041'] },
  'REL-076': { status: 'needs_archive', claimIds: ['CL-079'] },
  'REL-077': { status: 'needs_archive', claimIds: ['CL-080'] },
  'REL-080': { status: 'needs_archive', claimIds: ['CL-083'] },
  'REL-108': { status: 'needs_archive', claimIds: ['CL-132'] },
  'REL-111': { status: 'needs_archive', claimIds: ['CL-137'] },
  'REL-124': { status: 'provisional', claimIds: ['CL-170'] },
};
const expectedDirectRelationIds = new Set(Object.keys(expectedRelationContracts));
const expectedRelationIdsByPerson: Record<string, readonly string[]> = {
  'P-001': [],
  'P-005': ['REL-033', 'REL-034'],
  'P-006': ['REL-010'],
  'P-007': [],
  'P-010': ['REL-076', 'REL-077', 'REL-080', 'REL-108', 'REL-111'],
  'P-017': ['REL-124'],
};
const allowedLifeStatuses = new Set(['deceased_public_record', 'unknown_not_asserted']);
const forbiddenBiographySourcePattern = /(旧\s*AI|AI\s*[\/ _-]*研究|小说|草稿|故事圣经|文学创作)/i;
const forbiddenEvidenceTiers = new Set(['D', 'E']);
const forbiddenNarrativeOverclaims = /(已经证实为同一人|完整生平已确认|长期私交已证|共同潜伏已证|单人促成北平)/;

function assertBiographySourceAllowed(
  entityId: string,
  milestoneId: string,
  sourceId: string,
) {
  const source = sourceById.get(sourceId);
  if (!source) fail(`${entityId}/${milestoneId} references missing source ${sourceId}`);
  if (
    forbiddenEvidenceTiers.has(source.evidence_tier)
    || forbiddenBiographySourcePattern.test(`${source.title} ${source.source_type}`)
  ) {
    fail(`${entityId}/${milestoneId} derives biography from fiction or AI source ${sourceId}`);
  }
}

function assertClaimAllowed(
  entityId: string,
  contextId: string,
  claim: (typeof auditGraph.claims)[number],
  allowBlocked: boolean,
) {
  if (forbiddenEvidenceTiers.has(claim.evidence_tier)) {
    fail(`${entityId}/${contextId} derives narrative from D/E-tier claim ${claim.claim_id}`);
  }
  if (
    !allowBlocked
    && (claim.status === 'not_supported' || claim.status === 'rejected_for_fact')
  ) {
    fail(`${entityId}/${contextId} exposes blocked claim ${claim.claim_id} outside an identity firewall`);
  }
}

if (peopleDossiers.length !== expectedPeople.length) {
  fail(`expected ${expectedPeople.length} curated dossiers, found ${peopleDossiers.length}`);
}
if (
  JSON.stringify([...peopleDossiers.map((person) => person.entityId)].sort())
  !== JSON.stringify([...expectedPeople].sort())
) {
  fail('curated people allowlist changed without review');
}

const dossierIds = new Set<string>();
const milestoneIds = new Set<string>();
const approvedRelationIds = new Set<string>();

function validateMode(
  entityId: string,
  milestoneId: string,
  mode: PersonMilestoneMode,
  claims: Array<(typeof auditGraph.claims)[number]>,
) {
  if (mode === 'documented' && claims.some((claim) => claim.status !== 'working_verified')) {
    fail(`${entityId}/${milestoneId} labels a non-verified claim as documented`);
  }
  if (
    mode === 'attributed'
    && claims.some((claim) => claim.status === 'not_supported' || claim.status === 'rejected_for_fact')
  ) {
    fail(`${entityId}/${milestoneId} hides a blocked claim inside attributed material`);
  }
  if (
    mode === 'conflict'
    && !claims.some(
      (claim) => claim.status !== 'working_verified' || Boolean(claim.conflict_set_id) || claim.conflicts_with.length > 0,
    )
  ) {
    fail(`${entityId}/${milestoneId} is labelled conflict without a recorded conflict`);
  }
  if (
    mode === 'identity_firewall'
    && !claims.some((claim) => {
      const text = `${claim.predicate} ${claim.writing_use}`.toLowerCase();
      return text.includes('same individual') || text.includes('separate') || text.includes('不得') || text.includes('分流');
    })
  ) {
    fail(`${entityId}/${milestoneId} identity firewall has no separation claim`);
  }
}

for (const dossier of peopleDossiers) {
  if (dossierIds.has(dossier.entityId)) fail(`duplicate person dossier: ${dossier.entityId}`);
  dossierIds.add(dossier.entityId);
  const node = nodeById.get(dossier.entityId);
  if (!node || node.entity_type !== 'Person') fail(`missing person node: ${dossier.entityId}`);
  if (
    dossier.portraitMode !== 'typographic_no_historical_image'
    || dossier.biographyComplete !== false
    || dossier.privacyStatus !== 'historical_public_material_only'
    || dossier.publicationStatus !== 'local_review_only'
    || !allowedLifeStatuses.has(dossier.lifeStatus)
    || !dossier.lifeStatusBasis
  ) {
    fail(`${dossier.entityId} opened a portrait, biography, privacy, or publication gate`);
  }
  if (!dossier.identityBoundary || !dossier.whyHere || !dossier.oneLine) {
    fail(`${dossier.entityId} lacks reader copy or an identity boundary`);
  }
  if (forbiddenNarrativeOverclaims.test(`${dossier.oneLine} ${dossier.whyHere} ${dossier.identityBoundary}`)) {
    fail(`${dossier.entityId} contains an unbounded biographical overclaim`);
  }
  if (!dossier.overviewClaimIds.length || !dossier.identityBoundaryClaimIds.length) {
    fail(`${dossier.entityId} has unbound overview or identity copy`);
  }
  for (const [copyRole, claimIds] of [
    ['overview', dossier.overviewClaimIds],
    ['identity_boundary', dossier.identityBoundaryClaimIds],
  ] as const) {
    for (const claimId of claimIds) {
      const claim = claimById.get(claimId);
      if (!claim) fail(`${dossier.entityId}/${copyRole} references missing claim ${claimId}`);
      if (claim.subject_id !== dossier.entityId) {
        fail(`${dossier.entityId}/${copyRole} transfers ${claimId} from ${claim.subject_id}`);
      }
      assertClaimAllowed(dossier.entityId, copyRole, claim, copyRole === 'identity_boundary');
      claim.source_ids.forEach((sourceId) => assertBiographySourceAllowed(dossier.entityId, copyRole, sourceId));
    }
  }
  const expectedPersonRelations = expectedRelationIdsByPerson[dossier.entityId] ?? [];
  if (
    JSON.stringify(dossier.relationCards.map((card) => card.edgeId).sort())
    !== JSON.stringify([...expectedPersonRelations].sort())
  ) {
    fail(`${dossier.entityId} relation-card allowlist changed without review`);
  }
  for (const card of dossier.relationCards) {
    if (approvedRelationIds.has(card.edgeId)) fail(`duplicate curated relation card ${card.edgeId}`);
    approvedRelationIds.add(card.edgeId);
    const edge = edgeById.get(card.edgeId);
    if (!edge) fail(`${dossier.entityId} relation card references missing edge ${card.edgeId}`);
    const expectedContract = expectedRelationContracts[card.edgeId];
    if (
      !expectedContract
      || edge.edge_status !== expectedContract.status
      || JSON.stringify([...edge.claim_ids].sort()) !== JSON.stringify([...expectedContract.claimIds].sort())
    ) {
      fail(`${dossier.entityId}/${card.edgeId} status or claim contract changed without review`);
    }
    const endpoints = new Set([edge.from_entity_id, edge.to_entity_id]);
    if (!endpoints.has('P-001') || !endpoints.has(dossier.entityId)) {
      fail(`${dossier.entityId}/${card.edgeId} is not a direct Su Kaiyuan relation`);
    }
    if (!card.readerSentence || card.readerSentence === edge.relation || !/[\u3400-\u9fff]/u.test(card.readerSentence)) {
      fail(`${dossier.entityId}/${card.edgeId} lacks reviewed Chinese reader copy`);
    }
    for (const claimId of edge.claim_ids) {
      const claim = claimById.get(claimId);
      if (!claim) fail(`${dossier.entityId}/${card.edgeId} references missing claim ${claimId}`);
      assertClaimAllowed(dossier.entityId, card.edgeId, claim, false);
      claim.source_ids.forEach((sourceId) => assertBiographySourceAllowed(dossier.entityId, card.edgeId, sourceId));
    }
  }
  if (dossier.relatedLinks.some((link) => !link.href.startsWith('/') || link.href.includes('..'))) {
    fail(`${dossier.entityId} contains an unsafe related link`);
  }

  const claimSourceIds = new Set<string>();
  for (const milestone of dossier.milestones) {
    if (milestoneIds.has(milestone.id)) fail(`duplicate milestone id: ${milestone.id}`);
    milestoneIds.add(milestone.id);
    if (!milestone.claimIds.length) fail(`${dossier.entityId}/${milestone.id} has no subject claims`);
    const claims = milestone.claimIds.map((claimId) => {
      const claim = claimById.get(claimId);
      if (!claim) fail(`${dossier.entityId}/${milestone.id} references missing claim ${claimId}`);
      if (claim.subject_id !== dossier.entityId) {
        fail(`${dossier.entityId}/${milestone.id} transfers ${claimId} from ${claim.subject_id}`);
      }
      assertClaimAllowed(
        dossier.entityId,
        milestone.id,
        claim,
        milestone.mode === 'identity_firewall',
      );
      claim.source_ids.forEach((sourceId) => {
        assertBiographySourceAllowed(dossier.entityId, milestone.id, sourceId);
        claimSourceIds.add(sourceId);
      });
      return claim;
    });
    if (claims.some((claim) => {
      const count = Number(claim.independence_count);
      return !Number.isInteger(count) || count < 1 || count > claim.source_ids.length;
    })) {
      fail(`${dossier.entityId}/${milestone.id} has an invalid independent-source count`);
    }
    validateMode(dossier.entityId, milestone.id, milestone.mode, claims);

    for (const claimId of milestone.contextClaimIds ?? []) {
      if (milestone.claimIds.includes(claimId as never)) {
        fail(`${dossier.entityId}/${milestone.id} duplicates ${claimId} as subject and context`);
      }
      const claim = claimById.get(claimId);
      if (!claim) fail(`${dossier.entityId}/${milestone.id} references missing context claim ${claimId}`);
      assertClaimAllowed(
        dossier.entityId,
        `${milestone.id}/context`,
        claim,
        milestone.mode === 'identity_firewall',
      );
      claim.source_ids.forEach((sourceId) => {
        assertBiographySourceAllowed(dossier.entityId, milestone.id, sourceId);
        claimSourceIds.add(sourceId);
      });
    }
  }

  for (const sourceId of dossier.featuredSourceIds) {
    const source = sourceById.get(sourceId);
    if (!source) fail(`${dossier.entityId} references missing source ${sourceId}`);
    if (!claimSourceIds.has(sourceId)) fail(`${dossier.entityId} features source ${sourceId} without a claim path`);
    if (
      forbiddenEvidenceTiers.has(source.evidence_tier)
      || forbiddenBiographySourcePattern.test(`${source.title} ${source.source_type}`)
    ) {
      fail(`${dossier.entityId} features fiction or AI source ${sourceId}`);
    }
    if (source.public_tier !== 'P0' && source.public_tier !== 'P1') {
      fail(`${dossier.entityId} exposes non-browser source ${sourceId}`);
    }
  }
  const featuredFamilies = dossier.featuredSourceIds.map(
    (sourceId) => personSourceCarrierFamilyById.get(sourceId)?.familyId ?? sourceId,
  );
  if (new Set(featuredFamilies).size !== featuredFamilies.length) {
    fail(`${dossier.entityId} features more than one carrier from the same source family`);
  }
}

const curatedPeople = new Set(expectedPeople);
const actualDirectRelationIds = new Set(
  auditGraph.edges
    .filter((edge) => {
      const endpoints = new Set([edge.from_entity_id, edge.to_entity_id]);
      return endpoints.has('P-001')
        && [...endpoints].some((entityId) => entityId !== 'P-001' && curatedPeople.has(entityId));
    })
    .map((edge) => edge.edge_id),
);
if (
  JSON.stringify([...actualDirectRelationIds].sort())
  !== JSON.stringify([...expectedDirectRelationIds].sort())
) {
  fail('direct Su Kaiyuan relation set changed; new edges are quarantined until reviewed');
}
if (
  JSON.stringify([...approvedRelationIds].sort())
  !== JSON.stringify([...expectedDirectRelationIds].sort())
) {
  fail('curated relation cards do not exactly cover the reviewed direct-relation set');
}

const liYingfu = peopleDossiers.find((person) => person.entityId === 'P-005');
if (!liYingfu?.milestones.some((milestone) => milestone.claimIds.includes('CL-034'))) {
  fail('Li Yingfu/Li Guangrong separation claim is missing');
}
const liDachao = peopleDossiers.find((person) => person.entityId === 'P-017');
if (
  !liDachao?.milestones.some(
    (milestone) => milestone.claimIds.includes('CL-051') && milestone.claimIds.includes('CL-072'),
  )
) {
  fail('Li Dachao homonym firewall is incomplete');
}
if (!liDachao.whyHere.includes('不等于已证为同一个真人的连续履历')) {
  fail('Li Dachao cross-year narrative lacks a continuity warning');
}
const suKaiyuan = peopleDossiers.find((person) => person.entityId === 'P-001');
if (
  !suKaiyuan?.milestones.some((milestone) => milestone.contextClaimIds?.includes('CL-181'))
  || !suKaiyuan.identityBoundary.includes('苏凯原（P-003）')
  || !suKaiyuan.identityBoundary.includes('康原（P-004）')
) {
  fail('Su Kaiyuan identity dossier is missing the P-002 context or P-003/P-004 firewall');
}

const encoded = JSON.stringify(peopleDossiers);
const absoluteHomeMarker = '/' + 'Users' + '/';
if (
  encoded.includes(absoluteHomeMarker)
  || encoded.includes('file://')
  || encoded.includes('private-runtime')
  || encoded.includes('family_text')
) {
  fail('people dossier browser content exposes a private path or field');
}

console.log(
  `PASS people dossiers=${peopleDossiers.length} milestones=${milestoneIds.size} portraits=0 biography_complete=0`,
);

import archiveMissionsJson from '@/data/archive-missions.json';

export type ArchiveMissionTaskKind = 'archive_request' | 'context_research';
export type ArchiveMissionPriority = 'P0' | 'P1' | 'P2';
export type ArchiveMissionWorkflowState = 'planned' | 'blocked';
export type ArchiveMissionNextAction = 'send' | 'book' | 'inquire' | 'delegate' | 'wait_precondition';

export interface ArchiveMissionTarget {
  targetId: string;
  relation: 'single_request' | 'locator_alias' | 'separate_request' | 'same_work_carrier';
  institution: string;
  catalogReference: string;
  locatorAliases: string[];
  workFamilyKey: string | null;
}

export interface ArchiveMission {
  missionId: string;
  canonicalId: string;
  taskKind: ArchiveMissionTaskKind;
  executionPriority: ArchiveMissionPriority;
  status: {
    workflowState: ArchiveMissionWorkflowState;
    nextActionType: ArchiveMissionNextAction;
    baselineLabel: string;
    publicLabel: string;
    verifiedAt: null;
    completed: false;
  };
  modeLabel: string;
  institution: string;
  institutionType: string;
  topic: string;
  people: string[];
  researchQuestion: string;
  catalogReference: string;
  completionStandard: string;
  publicNextStep: string;
  evidenceScope: string;
  boundary: string;
  highlighted: boolean;
  targets: ArchiveMissionTarget[];
}

export interface ArchiveMissionJournalEntry {
  action: string;
  decision: string;
  outcome: string;
  nextStep: string;
  cannotProve: string;
  missionIds: string[];
}

export interface ArchiveMissionDataset {
  _meta: {
    schema_version: 'archive-missions-public-v1';
    generator_version: string;
    source_updated_at: string;
    generated_at: string;
    generation_id: string;
    must_not_deploy: true;
    deployment_authorized: false;
    evidence_boundary: 'execution_progress_not_historical_completion';
    lead_intake_status: 'browser_draft_only_no_submission_endpoint';
    counts: {
      missions: number;
      priorities: Record<ArchiveMissionPriority, number>;
      baselineStatuses: Record<string, number>;
      institutions: number;
      highlighted: number;
      completed: number;
    };
  };
  missions: ArchiveMission[];
  journal: ArchiveMissionJournalEntry[];
}

export const archiveMissionDataset = archiveMissionsJson as unknown as ArchiveMissionDataset;

if (archiveMissionDataset._meta.schema_version !== 'archive-missions-public-v1') {
  throw new Error('Unsupported archive mission data schema');
}

export const archiveMissions = archiveMissionDataset.missions;
export const archiveMissionJournal = archiveMissionDataset.journal;
export const archiveMissionGenerationId = archiveMissionDataset._meta.generation_id;

export function findArchiveMission(missionId: string): ArchiveMission | undefined {
  return archiveMissions.find((mission) => mission.missionId === missionId);
}

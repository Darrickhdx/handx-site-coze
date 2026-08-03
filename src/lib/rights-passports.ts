import rawRegistry from '@/data/rights-passports.json';

export type RightsPassportCategory =
  | 'site_asset'
  | 'novel_page'
  | 'article'
  | 'topic_paragraph'
  | 'source_reference';

export type RightsControlState = 'owned' | 'licensed' | 'permission_pending';
export type RightsMediaGate = 'review_only' | 'not_for_media';

export interface RightsPassportRecord {
  passport_id: string;
  category: RightsPassportCategory;
  title: string;
  canonical_reference: string;
  content_sha256: string;
  hash_basis: string;
  control_state: RightsControlState;
  control_evidence: string;
  license_state: 'no-license-granted';
  reuse_scope: string;
  local_only: boolean;
  media_gate: RightsMediaGate;
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

export interface RightsPassportRegistry {
  _meta: {
    schema_version: 'handx-rights-passports-v1';
    generated_at: string;
    must_not_deploy: true;
    deployment_authorized: false;
    public_ready: false;
    default_policy: 'unknown_rights_are_permission_pending_and_blocked';
    license_policy: 'no-license-granted';
    input_sha256: Record<string, string>;
    counts: {
      records: number;
      by_category: Record<RightsPassportCategory, number>;
      by_control_state: Record<RightsControlState, number>;
      by_media_gate: Record<RightsMediaGate, number>;
      local_only: number;
      public_ready: 0;
    };
  };
  records: RightsPassportRecord[];
}

export const rightsPassportRegistry = rawRegistry as RightsPassportRegistry;

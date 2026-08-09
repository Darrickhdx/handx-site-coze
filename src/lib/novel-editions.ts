import registryJson from '@/data/novel-editions.json';

export type NovelEditionStatus =
  | 'legacy_local_reader'
  | 'frozen_baseline_not_served'
  | 'active_candidate_not_served';

export interface NovelSourceArtifact {
  artifact: string;
  sha256: string;
  byte_size: number;
  modified_at: string;
}

export interface NovelEditionRecord {
  edition_id: string;
  version: string;
  status: NovelEditionStatus;
  role: string;
  pages: number;
  numbered_chapters: number;
  unnumbered_openings: number;
  figure_plates: number;
  rights_ledger_records?: number;
  source_artifacts: Record<string, NovelSourceArtifact>;
  gate_checks?: Record<string, boolean>;
  blocked_gates?: string[];
  frozen: boolean;
  served: boolean;
  public_ready: boolean;
}

export interface NovelEditionRegistry {
  schema_version: 'handx-novel-editions-1.0';
  observed_at: string;
  must_not_deploy: true;
  deployment_authorized: false;
  current_reader: {
    edition_id: string;
    version: string;
    status: 'legacy_local_reader';
    pages: number;
    numbered_chapters: number;
    commentable_sections: number;
    pdf_sha256: string;
    docx_sha256: string;
    raw_sources_served: false;
  };
  editions: NovelEditionRecord[];
  migration_policy: {
    strategy: 'parallel_import_then_atomic_switch';
    raw_sources_in_browser: false;
    old_comments_auto_migrated: false;
    old_progress_auto_migrated: false;
    rights_policy: 'page_inherits_highest_risk_asset';
    candidate_static_pages_generated: false;
  };
}

export const novelEditionRegistry = registryJson as NovelEditionRegistry;
export const frozenNovelBaseline = novelEditionRegistry.editions.find(
  (edition) => edition.version === '1.2',
)!;
export const candidateNovelEdition = novelEditionRegistry.editions.find(
  (edition) => edition.version === '1.3',
)!;

const candidate = candidateNovelEdition;

/**
 * Labels are derived from the registry rather than typed by hand: the previous
 * hard-coded "519 页 … 47 幅图版" kept claiming a structure the book no longer had.
 */
export const novelEditionGateLabels: Record<string, string> = {
  three_source_artifacts_present: 'PDF、DOCX、Markdown 三份源文件齐全',
  expected_structure_observed: `${candidate.pages} 页、${candidate.numbered_chapters} 章、${candidate.unnumbered_openings} 个序章、${candidate.figure_plates} 幅图版与冻结钉子吻合`,
  frozen_manifest_present: `V${candidate.version} 冻结说明已建立`,
  sha_manifest_present: '正式 SHA-256 清单已建立',
  final_review_report_present: '终检与复评报告已归档',
  all_figure_rights_passports_present: `${candidate.figure_plates} 幅图版逐项权利／隐私护照齐全（当前 ${candidate.rights_ledger_records ?? 0}/${candidate.figure_plates}）`,
  author_and_legal_rightsholder_confirmed: '展示笔名与法定权利人已经作者确认',
  page_mapping_and_visual_qa_complete: `${candidate.pages} 页唯一归属与视觉抽检完成`,
  edition_scoped_comments_and_progress_ready: '评论与阅读进度已按版本隔离',
};

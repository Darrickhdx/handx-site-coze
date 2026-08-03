import manifestJson from '../../public/novel/hero-wuming/novel-manifest.json';

export type NovelSectionKind = 'frontmatter' | 'paratext' | 'part' | 'chapter';

export interface NovelSection {
  id: string;
  slug: string;
  title: string;
  kind: NovelSectionKind;
  order: number;
  part: number | null;
  chapter_number: number | null;
  start_page: number;
  end_page: number;
  page_count: number;
  commentable: boolean;
  summary: string;
}

export interface NovelPage {
  number: number;
  section_id: string;
  path: string;
  sha256: string;
  byte_size: number;
  width: number;
  height: number;
  responsive_path: string;
  responsive_sha256: string;
  responsive_byte_size: number;
  responsive_width: number;
  responsive_height: number;
  watermark: string;
  rights_status:
    | 'author_watermarked_derivative'
    | 'local_only_third_party_review';
  local_only: boolean;
  git_eligible: boolean;
  not_for_media: boolean;
}

export interface NovelManifest {
  schema_version: 'handx-novel-manifest-1.0';
  project: 'Handx web0.1';
  book: {
    id: string;
    title: string;
    subtitle: string;
    author: string;
    work_type: string;
    edition: string;
    version: string;
  };
  source: {
    pdf_sha256: string;
    docx_sha256: string;
    pdf_page_count: number;
    raw_sources_served: false;
    chapter_titles_verified_against_docx: true;
  };
  generated_at: string;
  must_not_deploy: true;
  deployment_authorized: false;
  publication_status: 'local_review';
  rights: {
    text_owner: string;
    license: 'no-license-granted';
    watermark: string;
    notice: string;
    local_only_image_pages: number[];
    local_only_reason: string;
  };
  totals: {
    pages: number;
    sections: number;
    numbered_chapters: number;
    commentable_sections: number;
    local_only_pages: number;
  };
  sections: NovelSection[];
  pages: NovelPage[];
  output: {
    root: string;
    format: 'webp';
    long_edge_pixels: number;
    responsive_width_pixels: number;
    watermark_is_pixel_layer: true;
    manifest_path: string;
  };
}

export const novelManifest = manifestJson as unknown as NovelManifest;
export const novelProgressKey = `handx-novel-progress:${novelManifest.book.id}`;
export const novelCommentNamespace = novelManifest.book.id;

export function novelCommentChapterId(sectionId: string): string {
  return `${novelCommentNamespace}--${sectionId}`;
}
export const novelSectionById = new Map(
  novelManifest.sections.map((section) => [section.id, section]),
);
export const novelSectionBySlug = new Map(
  novelManifest.sections.map((section) => [section.slug, section]),
);
export const commentableNovelSections = novelManifest.sections.filter(
  (section) => section.commentable,
);

export function pagesForNovelSection(section: NovelSection): NovelPage[] {
  return novelManifest.pages.filter(
    (page) =>
      page.number >= section.start_page && page.number <= section.end_page,
  );
}

export function adjacentCommentableSections(section: NovelSection): {
  previous: NovelSection | undefined;
  next: NovelSection | undefined;
} {
  const index = commentableNovelSections.findIndex(
    (candidate) => candidate.id === section.id,
  );
  return {
    previous: index > 0 ? commentableNovelSections[index - 1] : undefined,
    next:
      index >= 0 && index < commentableNovelSections.length - 1
        ? commentableNovelSections[index + 1]
        : undefined,
  };
}

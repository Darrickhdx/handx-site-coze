/**
 * Novel types and pure helpers, with no import of the manifest.
 *
 * This separation is the whole point of the file. `@/lib/novel` imports
 * novel-manifest.json, which is 424 KB — 538 page records carrying sha256
 * hashes, byte sizes and rights bookkeeping. A client component that imports
 * anything from `@/lib/novel`, even a single string, drags that entire JSON
 * into the browser bundle: JSON imports are not tree-shaken. Client components
 * import from here instead, and receive manifest-derived values as props.
 */

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

/**
 * What the reader actually renders. Everything a NovelPage carries beyond
 * these fields — both sha256s, both byte sizes, the watermark string, the
 * rights status, the git/media flags — is server-side bookkeeping that the
 * browser has no use for, and it is roughly 60% of the page record.
 */
export interface NovelReaderPage {
  number: number;
  section_id: string;
  path: string;
  responsive_path: string;
  width: number;
  height: number;
  responsive_width: number;
  local_only: boolean;
}

export function toReaderPage(page: NovelPage): NovelReaderPage {
  return {
    number: page.number,
    section_id: page.section_id,
    path: page.path,
    responsive_path: page.responsive_path,
    width: page.width,
    height: page.height,
    responsive_width: page.responsive_width,
    local_only: page.local_only,
  };
}

export function novelProgressKeyFor(editionId: string): string {
  return `handx-novel-progress:${editionId}`;
}

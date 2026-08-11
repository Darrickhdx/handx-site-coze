/**
 * Which edition of the site this process is building or serving.
 *
 * `workbench` is the local research station: loopback only, noindex, every
 * research projection available, and `must_not_deploy` asserted at startup.
 * `public` is the owner-authored public edition, staged into a separate tree
 * by tools/stage-public-edition.mjs so that research data is physically absent
 * rather than merely unrouted.
 *
 * This resolver is for tooling and the runtime. Pages should not branch on it:
 * a page that renders differently per edition still compiles its private
 * imports into the public bundle, which is exactly what the staged build
 * exists to prevent. Selection happens by staging, not by conditionals.
 */
export const siteEditions = ['workbench', 'public'] as const;

export type SiteEdition = (typeof siteEditions)[number];

function resolveEdition(): SiteEdition {
  // NEXT_PUBLIC_ is read first because client components only ever receive that
  // form; without it a browser bundle would always resolve to 'workbench' and
  // would keep calling the loopback-only endpoints on a public host.
  const raw = process.env.NEXT_PUBLIC_SITE_EDITION ?? process.env.SITE_EDITION;
  // Absent means workbench: the closed edition is the safe default, so a
  // missing variable can never silently produce a public build.
  if (raw === undefined || raw === '') return 'workbench';
  const match = siteEditions.find((edition) => edition === raw);
  if (!match) {
    throw new Error(
      `SITE_EDITION must be one of ${siteEditions.join(' | ')}; received ${JSON.stringify(raw)}`,
    );
  }
  return match;
}

export const siteEdition: SiteEdition = resolveEdition();
export const isPublicEdition = siteEdition === 'public';
export const isWorkbenchEdition = siteEdition === 'workbench';

/** Throw unless this process is the public edition. */
export function assertPublicEdition(context: string): void {
  if (!isPublicEdition) {
    throw new Error(`${context} is public-edition only; SITE_EDITION is ${siteEdition}`);
  }
}

/** Throw unless this process is the workbench edition. */
export function assertWorkbenchEdition(context: string): void {
  if (!isWorkbenchEdition) {
    throw new Error(`${context} is workbench-only; SITE_EDITION is ${siteEdition}`);
  }
}

/**
 * Whether search engines may index the public edition. Defaults closed: a page
 * that has been crawled and cached cannot be recalled, so opening indexing is
 * always a deliberate act, never a side effect of building the public edition.
 */
import publicEdition from '@/data/public-edition.json';

export const searchIndexingAllowed =
  (process.env.NEXT_PUBLIC_SEARCH_INDEXING
    ?? process.env.PUBLIC_SEARCH_INDEXING
    ?? publicEdition.search_indexing) === 'allowed';

export const publicSiteOrigin =
  process.env.PUBLIC_SITE_ORIGIN ?? publicEdition.site_origin;

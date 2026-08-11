/**
 * The public edition's published surface — the single list, used twice.
 *
 * The sitemap reads it to decide what to tell search engines; the public HTTP
 * shell reads it to decide what to answer at all. Those two answers must be the
 * same answer, and they were not: the shell carried a deny-list of three owner
 * prefixes, so every route nobody had thought to deny — /wiki, /missions,
 * /timeline, /topics, /evidence, /person, /controversies — answered 200 on the
 * open internet with the research layer inside it, while the sitemap correctly
 * advertised only the fourteen pages below.
 *
 * A deny-list has to be right about every route that will ever exist. An
 * allow-list only has to be right about the ones being published, and a route
 * added tomorrow is closed until someone writes it down here.
 */

import { archiveReadingMoments } from '@/content/archive-reading';

/** Reader pages, matched exactly. */
export const publicPagePaths = [
  '/',
  '/about',
  '/ai',
  '/novel',
  '/novel/read',
  '/novel/companion',
  '/sukaiyuan',
  '/graph',
  '/persons',
  '/archives',
  '/discover',
  '/methodology',
  '/rights',
  '/privacy',
] as const;

/**
 * Reader pages with a dynamic segment, matched by prefix: chapter pages,
 * articles and person cards. These are curated sets — every chapter, article
 * and person page that exists was written to be read.
 */
export const publicPagePrefixes = [
  '/novel/chapter/',
  '/discover/',
  '/persons/',
] as const;

/**
 * Archive pages are the exception, and are listed one by one.
 *
 * /archives/[sourceId] builds its params from auditGraph.sources, so it
 * prerenders a page for every registered source — 131 of them, each with the
 * source's metadata, locator and related claims. Three of those are cleared
 * for publication. A prefix rule here would publish the other 128, which is
 * exactly what was happening.
 */
export const publicArchivePaths = archiveReadingMoments.map(
  (moment) => `/archives/${moment.sourceId}`,
);

/**
 * Everything a published page needs to render, and nothing else. Note what is
 * absent: /data/, which is where the research projections are written. They
 * used to be served from public/data/ as ordinary static files — no route was
 * involved, so no route guard could have stopped them.
 */
export const publicAssetPrefixes = [
  '/_next/',
  '/assets/',
  '/novel/hero-wuming/',
] as const;

/** Files served from the site root. */
export const publicRootFiles = [
  '/robots.txt',
  '/sitemap.xml',
  '/favicon.ico',
  '/manifest.webmanifest',
] as const;

/** API endpoints the public edition answers itself, outside Next.js routing. */
export const publicApiPaths = [
  '/api/site/view',
  '/api/site/summary',
  '/api/site/comments',
] as const;

/** Whether the public edition may answer this path at all. */
export function isPublishedPath(path: string): boolean {
  if ((publicPagePaths as readonly string[]).includes(path)) return true;
  if (publicArchivePaths.includes(path)) return true;
  if ((publicRootFiles as readonly string[]).includes(path)) return true;
  if ((publicApiPaths as readonly string[]).includes(path)) return true;
  // A trailing slash on a published page is the same page.
  if (path.endsWith('/') && (publicPagePaths as readonly string[]).includes(path.slice(0, -1))) {
    return true;
  }
  for (const prefix of publicPagePrefixes) {
    // The prefix itself is a listed page where one exists; here we want the
    // children, and a child needs at least one character after the slash.
    if (path.startsWith(prefix) && path.length > prefix.length) return true;
  }
  for (const prefix of publicAssetPrefixes) {
    if (path.startsWith(prefix) && path.length > prefix.length) return true;
  }
  return false;
}

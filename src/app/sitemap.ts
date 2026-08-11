import { MetadataRoute } from 'next';
import { isPublicEdition, publicSiteOrigin, searchIndexingAllowed } from '@/lib/edition';
import { articleBodies } from '@/content/editorial';
import { commentableNovelSections } from '@/lib/novel';
import { publicPagePaths } from '@/data/public-routes';

const origin = publicSiteOrigin;

/**
 * Reader routes only. Owner tooling is excluded from the public edition
 * entirely, and an empty sitemap is served when indexing is closed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isPublicEdition || !searchIndexingAllowed) return [];

  // Priorities are editorial; the list of paths is not. It comes from
  // src/data/public-routes, which the public server also reads to decide what
  // it will answer — so a page can never be advertised but unserved, or served
  // but unadvertised.
  const priorities: Record<string, number> = {
    '/': 1,
    '/novel': 0.9,
    '/sukaiyuan': 0.9,
    '/about': 0.8,
    '/ai': 0.8,
    '/discover': 0.8,
    '/methodology': 0.8,
    '/novel/read': 0.7,
    '/graph': 0.7,
    '/persons': 0.7,
    '/archives': 0.7,
    '/novel/companion': 0.6,
    '/rights': 0.3,
    '/privacy': 0.3,
  };

  return [
    ...publicPagePaths.map((path) => ({
      url: `${origin}${path}`,
      changeFrequency: 'weekly' as const,
      priority: priorities[path] ?? 0.5,
    })),
    ...Object.keys(articleBodies).map((slug) => ({
      url: `${origin}/discover/${slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
    ...commentableNovelSections.map((section) => ({
      url: `${origin}/novel/chapter/${section.slug}`,
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ];
}

import { MetadataRoute } from 'next';
import { isPublicEdition, publicSiteOrigin, searchIndexingAllowed } from '@/lib/edition';
import { articleBodies } from '@/content/editorial';
import { commentableNovelSections } from '@/lib/novel';

const origin = publicSiteOrigin;

/**
 * Reader routes only. Owner tooling is excluded from the public edition
 * entirely, and an empty sitemap is served when indexing is closed.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  if (!isPublicEdition || !searchIndexingAllowed) return [];

  const fixed = [
    { path: '/', priority: 1 },
    { path: '/about', priority: 0.8 },
    { path: '/ai', priority: 0.8 },
    { path: '/novel', priority: 0.9 },
    { path: '/novel/read', priority: 0.7 },
    { path: '/novel/companion', priority: 0.6 },
    { path: '/sukaiyuan', priority: 0.9 },
    { path: '/graph', priority: 0.7 },
    { path: '/persons', priority: 0.7 },
    { path: '/archives', priority: 0.7 },
    { path: '/discover', priority: 0.8 },
    { path: '/methodology', priority: 0.8 },
    { path: '/rights', priority: 0.3 },
    { path: '/privacy', priority: 0.3 },
  ];

  return [
    ...fixed.map((entry) => ({
      url: `${origin}${entry.path}`,
      changeFrequency: 'weekly' as const,
      priority: entry.priority,
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

import { MetadataRoute } from 'next';
import { isPublicEdition, publicSiteOrigin, searchIndexingAllowed } from '@/lib/edition';

/**
 * The workbench is never indexable. The public edition is indexable only when
 * the owner opens it, because a crawled and cached page cannot be recalled.
 * Owner tooling stays disallowed either way.
 */
export default function robots(): MetadataRoute.Robots {
  if (!isPublicEdition || !searchIndexingAllowed) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/studio/', '/insights', '/api/'],
    },
    sitemap: `${publicSiteOrigin}/sitemap.xml`,
  };
}

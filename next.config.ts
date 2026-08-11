import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';

// Resolved here rather than imported from src/lib/edition: next.config runs
// before path aliases exist.
const publicEdition = JSON.parse(
  readFileSync(new URL('./src/data/public-edition.json', import.meta.url), 'utf8'),
) as { search_indexing: string };
const indexable =
  process.env.SITE_EDITION === 'public'
  && (process.env.PUBLIC_SEARCH_INDEXING ?? publicEdition.search_indexing) === 'allowed';

// The two editions must not share a build directory. They differ in robots,
// headers and which routes exist, so whichever built last would otherwise be
// served by whichever server started — a workbench process happily serving a
// public build, with /insights 404ing because the public edition excludes it.
const distDir = process.env.SITE_EDITION === 'public' ? '.next-public' : '.next';

const isPublic = process.env.SITE_EDITION === 'public';

const nextConfig: NextConfig = {
  distDir,
  poweredByHeader: false,
  // The research explorer is excluded from the public bundle at resolve time,
  // not by a runtime branch. A runtime branch stops it rendering; only this
  // stops its code — and the research field names inside it — from being
  // downloaded. The edition check in src/app/graph/page.tsx stays as well:
  // this makes the exclusion physical, that makes it visible in the source.
  ...(isPublic
    ? {
        turbopack: {
          resolveAlias: {
            '@/components/research-graph-explorer':
              './src/components/research-graph-explorer.public-stub.tsx',
          },
        },
      }
    : {}),
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: indexable
              ? 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400'
              : 'private, no-store, max-age=0, must-revalidate',
          },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          // Indexing is closed unless the public edition explicitly opens it.
          // Every other header here is unconditional; this is the only one that
          // depends on the edition, because it is the only one the owner ever
          // means to relax.
          ...(indexable
            ? []
            : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' }]),
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'no-referrer' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
          },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'Cross-Origin-Resource-Policy', value: 'same-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "frame-src 'none'",
              "img-src 'self' data: blob:",
              "media-src 'self'",
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline'",
              "connect-src 'self'",
              "worker-src 'self' blob:",
              "manifest-src 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default nextConfig;

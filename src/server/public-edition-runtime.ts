import type { IncomingMessage, RequestListener, ServerResponse } from 'node:http';
import { handleAnalytics, handleAnalyticsSummary } from './public-analytics';
import { handleCommentRead, handleCommentWrite } from './feishu-comments';
import { isPublishedPath } from '../data/public-routes';

/**
 * The public edition's HTTP shell.
 *
 * Deliberately a separate module from local-preview-runtime rather than a flag
 * on it. That runtime refuses to serve anywhere but loopback and refuses a PROD
 * deployment environment, and it must keep refusing: the workbench is where the
 * unreleased research material lives. This one is the mirror image — it refuses
 * to start unless a human has explicitly said "publish", and it refuses to carry
 * the owner's private runtime with it.
 *
 * Workbench refuses to run anywhere but loopback.
 * Public edition refuses to run without an explicit acknowledgement.
 * Both fail closed, from opposite directions.
 */
export interface PublicEditionRuntimeOptions {
  readonly bind: Readonly<{ hostname: string; port: number }>;
  /** Must equal PUBLIC_EDITION_SCOPE; absent means "not authorised", not "default". */
  readonly acknowledgement: string | undefined;
  /** Whether search engines may index. Owner keeps this closed until they say otherwise. */
  readonly searchIndexing: 'blocked' | 'allowed';
  readonly fallback: RequestListener;
  /** Absolute origin, used for the same-origin check on the analytics beacon. */
  readonly siteOrigin: string;
}

export const PUBLIC_EDITION_SCOPE = 'owner_authored_public_edition_v1';

/**
 * Same headers as the workbench minus the loopback assumptions. The robots tag
 * stays until the owner opens indexing: a page that has been crawled and cached
 * cannot be recalled, so this is the one setting that defaults closed even in
 * the public edition.
 */
function publicHeaders(searchIndexing: 'blocked' | 'allowed') {
  return {
    'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=86400',
    ...(searchIndexing === 'blocked'
      ? { 'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet' }
      : {}),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy':
      'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
    'Content-Security-Policy': [
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
  };
}

/**
 * Path traversal and encoding tricks are decided before the allow-list sees the
 * path, so that `/discover/../wiki` cannot be spelled past it.
 */
function normalisePath(rawPath: string): string | null {
  let decoded: string;
  try {
    decoded = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (decoded.includes('\0') || decoded.includes('\\')) return null;
  if (!decoded.startsWith('/')) return null;
  if (decoded.split('/').some((segment) => segment === '..')) return null;
  return decoded;
}

export function requirePublicEditionStartup(
  options: Readonly<PublicEditionRuntimeOptions>,
): void {
  if (options.acknowledgement !== PUBLIC_EDITION_SCOPE) {
    throw new Error(
      `Public edition refuses to start without PUBLIC_EDITION_ACK=${PUBLIC_EDITION_SCOPE}; ` +
        'this is the deliberate human step that authorises serving to the public.',
    );
  }
  if (!Number.isInteger(options.bind.port) || options.bind.port <= 0) {
    throw new Error(`Public edition refuses an invalid port: ${options.bind.port}`);
  }
}

export function createPublicEditionRuntime(
  options: Readonly<PublicEditionRuntimeOptions>,
): RequestListener {
  requirePublicEditionStartup(options);
  const headers = publicHeaders(options.searchIndexing);

  return function handleRequest(
    request: IncomingMessage,
    response: ServerResponse,
  ): void {
    for (const [name, value] of Object.entries(headers)) {
      response.setHeader(name, value);
    }

    const path = normalisePath((request.url ?? '/').split('?')[0]);

    // Closed by default. Anything not on the published list — owner tooling,
    // research projections, static data files, a route added later and not yet
    // written down — is indistinguishable from a path that was never built.
    if (path === null || !isPublishedPath(path)) {
      response.statusCode = 404;
      response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      response.end('Not found');
      return;
    }

    // First-party analytics. Handled here rather than as a Next.js route so the
    // workbench can keep asserting that src/app/api does not exist.
    if (path === '/api/site/view') {
      void handleAnalytics(request, response, options.siteOrigin);
      return;
    }
    if (path === '/api/site/summary') {
      void handleAnalyticsSummary(request, response);
      return;
    }

    // Reader comments. Stored in a Feishu Bitable so the owner moderates in an
    // app they already use; nothing submitted here is visible until they do.
    if (path === '/api/site/comments') {
      if (request.method === 'POST') void handleCommentWrite(request, response, options.siteOrigin);
      else void handleCommentRead(request, response);
      return;
    }

    try {
      options.fallback(request, response);
    } catch {
      if (!response.headersSent) {
        response.statusCode = 500;
        response.setHeader('Content-Type', 'text/plain; charset=utf-8');
      }
      response.end('Internal server error');
    }
  };
}

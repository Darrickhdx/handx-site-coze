import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Pool } from 'pg';

/**
 * First-party page-view recording for the public edition.
 *
 * Deliberately lives in the runtime rather than under src/app/api: the workbench
 * asserts that no Next.js route handlers exist, and both editions share src/app.
 * Keeping the endpoint here also matches ADR 0001 — one request handler owns the
 * interaction surface, so it cannot be reached without the security headers.
 *
 * Privacy posture is inherited from the loopback runtime and not relaxed:
 * no IP address, no user agent, no raw referrer. The session identifier is a
 * random per-browser value hashed with a server-side salt, so the stored value
 * cannot be reversed and does not follow anyone between sites.
 */

const MAX_BODY_BYTES = 2_048;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_EVENTS = 40;

const referrerClasses = new Set([
  'direct',
  'internal',
  'search',
  'wechat',
  'xiaohongshu',
  'douyin',
  'weibo',
  'zhihu',
  'other_referral',
  'newsletter',
  'qr',
  'unknown',
]);

// 255, not 300: Postgres caps regex repetition at 255, so the table
// constraint cannot express more and a longer path would be rejected
// at insert time instead of here.
const pathPattern = /^\/[A-Za-z0-9_./%-]{0,255}$/;
const sessionPattern = /^[A-Za-z0-9_-]{8,64}$/;

let pool: Pool | null = null;
let salt: Buffer | null = null;
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function analyticsIsConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 3,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
      ssl: { rejectUnauthorized: false },
    });
    // A failed pooled connection must not take the web server down with it.
    pool.on('error', () => {});
  }
  return pool;
}

/**
 * Salt for pseudonymising sessions. Taken from the environment when provided so
 * that figures survive a restart; otherwise generated per process, which loses
 * visitor-uniqueness across restarts but never stores a reversible identifier.
 */
function getSalt(): Buffer {
  if (!salt) {
    const configured = process.env.ANALYTICS_SALT;
    salt = configured ? Buffer.from(configured, 'utf8') : randomBytes(32);
  }
  return salt;
}

function hashSession(sessionId: string): string {
  return createHmac('sha256', getSalt()).update(sessionId).digest('hex').slice(0, 24);
}

/** Rate limit per hashed session, so one browser cannot flood the table. */
function withinRate(sessionHash: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(sessionHash);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(sessionHash, { count: 1, resetAt: now + RATE_WINDOW_MS });
    if (rateBuckets.size > 5_000) {
      for (const [key, value] of rateBuckets) {
        if (value.resetAt <= now) rateBuckets.delete(key);
      }
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_MAX_EVENTS;
}

function readBody(request: IncomingMessage): Promise<string | null> {
  return new Promise((resolve) => {
    let size = 0;
    const chunks: Buffer[] = [];
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        resolve(null);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', () => resolve(null));
  });
}

function reply(response: ServerResponse, status: number, body: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(body);
}

/** Same-origin check: an analytics beacon has no reason to arrive cross-site. */
function sameOrigin(request: IncomingMessage, siteOrigin: string): boolean {
  const origin = request.headers.origin;
  if (!origin) return true;
  return origin === siteOrigin;
}

export async function handleAnalytics(
  request: IncomingMessage,
  response: ServerResponse,
  siteOrigin: string,
): Promise<void> {
  if (request.method !== 'POST') {
    reply(response, 405, '{"error":"method_not_allowed"}');
    return;
  }
  if (!sameOrigin(request, siteOrigin)) {
    reply(response, 403, '{"error":"cross_origin"}');
    return;
  }

  const raw = await readBody(request);
  if (raw === null) {
    reply(response, 413, '{"error":"request_too_large"}');
    return;
  }

  let payload: { path?: unknown; session_id?: unknown; referrer_class?: unknown };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    reply(response, 400, '{"error":"invalid_json"}');
    return;
  }

  const path = typeof payload.path === 'string' ? payload.path : '';
  const sessionId = typeof payload.session_id === 'string' ? payload.session_id : '';
  const referrerClass =
    typeof payload.referrer_class === 'string' ? payload.referrer_class : 'unknown';

  if (!pathPattern.test(path) || !sessionPattern.test(sessionId)) {
    reply(response, 400, '{"error":"invalid_event"}');
    return;
  }
  if (!referrerClasses.has(referrerClass)) {
    reply(response, 400, '{"error":"invalid_referrer_class"}');
    return;
  }

  const sessionHash = hashSession(sessionId);
  if (!withinRate(sessionHash)) {
    reply(response, 429, '{"error":"rate_limited"}');
    return;
  }

  // Configuration is checked only after validation, so the endpoint's contract
  // does not depend on deployment state: a malformed event is rejected whether
  // or not there is a database to write it to. Accepted rather than errored,
  // because the browser must not retry and the page must not be affected.
  if (!analyticsIsConfigured()) {
    reply(response, 202, '{"status":"not_configured"}');
    return;
  }

  try {
    await getPool().query(
      'insert into public.handx_page_views (path, session_hash, referrer_class) values ($1, $2, $3)',
      [path, sessionHash, referrerClass],
    );
    reply(response, 204, '');
  } catch {
    // Analytics must never degrade the site. Swallow and accept.
    reply(response, 202, '{"status":"deferred"}');
  }
}

/** Constant-time bearer check for the owner's read endpoint. */
export function hasValidOwnerToken(request: IncomingMessage): boolean {
  const expected = process.env.ANALYTICS_READ_TOKEN;
  if (!expected) return false;
  const header = request.headers.authorization ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function handleAnalyticsSummary(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  if (!hasValidOwnerToken(request)) {
    reply(response, 404, '{"error":"not_found"}');
    return;
  }
  if (!analyticsIsConfigured()) {
    reply(response, 503, '{"error":"not_configured"}');
    return;
  }
  try {
    const { rows } = await getPool().query(
      `select day, path, views, visitors
         from public.handx_page_views_daily
        where day >= (current_date - interval '30 days')
        order by day desc, views desc
        limit 500`,
    );
    reply(response, 200, JSON.stringify({ days: 30, rows }));
  } catch {
    reply(response, 503, '{"error":"unavailable"}');
  }
}

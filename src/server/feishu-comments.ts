import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Reader comments, stored in a Feishu Bitable.
 *
 * The point of choosing Bitable over a database table is the moderation flow,
 * not the storage: a comment arrives as a row, and the owner approves it by
 * changing a field in an app they already use every day. There is no admin UI
 * to build and no second interface to learn.
 *
 * Everything runs server-side. The app secret never reaches the browser, and
 * approved comments are cached so that reading a chapter does not call the
 * Feishu API on every request — Bitable is a spreadsheet with an API, not a
 * database, and it will rate-limit under real traffic.
 */

const FEISHU_BASE = 'https://open.feishu.cn/open-apis';
const TOKEN_SAFETY_MARGIN_MS = 5 * 60_000;
const APPROVED_CACHE_MS = 60_000;
const MAX_BODY_BYTES = 8_192;
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX_SUBMISSIONS = 3;

/** Field names in the Bitable. Chinese, because the owner reads this table. */
export const FIELDS = {
  chapter: '章节',
  chapterTitle: '章节标题',
  displayName: '昵称',
  body: '内容',
  status: '状态',
  submittedAt: '提交时间',
  sessionHash: '会话哈希',
} as const;

export const STATUS = {
  pending: '待审核',
  approved: '已发布',
  rejected: '不发布',
} as const;

export interface FeishuConfig {
  appId: string;
  appSecret: string;
  appToken: string;
  tableId: string;
}

export function readFeishuConfig(): FeishuConfig | null {
  const appId = process.env.FEISHU_APP_ID;
  const appSecret = process.env.FEISHU_APP_SECRET;
  const appToken = process.env.FEISHU_BITABLE_APP_TOKEN;
  const tableId = process.env.FEISHU_BITABLE_TABLE_ID;
  if (!appId || !appSecret || !appToken || !tableId) return null;
  return { appId, appSecret, appToken, tableId };
}

let cachedToken: { value: string; expiresAt: number } | null = null;

/**
 * tenant_access_token lives about two hours. Cached with a safety margin so a
 * request never races the expiry, and refetched on demand rather than on a timer.
 */
export async function getTenantToken(config: FeishuConfig): Promise<string> {
  const now = Date.now();
  if (cachedToken && cachedToken.expiresAt - TOKEN_SAFETY_MARGIN_MS > now) {
    return cachedToken.value;
  }
  const response = await fetch(`${FEISHU_BASE}/auth/v3/tenant_access_token/internal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ app_id: config.appId, app_secret: config.appSecret }),
  });
  const data = (await response.json()) as {
    code?: number;
    msg?: string;
    tenant_access_token?: string;
    expire?: number;
  };
  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`feishu token failed: ${data.code} ${data.msg ?? ''}`);
  }
  cachedToken = {
    value: data.tenant_access_token,
    expiresAt: now + (data.expire ?? 7_200) * 1_000,
  };
  return cachedToken.value;
}

async function bitable(
  config: FeishuConfig,
  path: string,
  init: { method: string; body?: unknown } = { method: 'GET' },
): Promise<Record<string, unknown>> {
  const token = await getTenantToken(config);
  const response = await fetch(
    `${FEISHU_BASE}/bitable/v1/apps/${config.appToken}/tables/${config.tableId}${path}`,
    {
      method: init.method,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    },
  );
  const data = (await response.json()) as { code?: number; msg?: string; data?: unknown };
  if (data.code !== 0) {
    throw new Error(`feishu bitable failed: ${data.code} ${data.msg ?? ''}`);
  }
  return (data.data ?? {}) as Record<string, unknown>;
}

let salt: Buffer | null = null;
function hashSession(sessionId: string): string {
  if (!salt) {
    const configured = process.env.ANALYTICS_SALT;
    salt = configured ? Buffer.from(configured, 'utf8') : randomBytes(32);
  }
  return createHmac('sha256', salt).update(sessionId).digest('hex').slice(0, 24);
}

const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function withinRate(sessionHash: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(sessionHash);
  if (!bucket || bucket.resetAt <= now) {
    rateBuckets.set(sessionHash, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= RATE_MAX_SUBMISSIONS;
}

export interface ApprovedComment {
  id: string;
  displayName: string;
  body: string;
  submittedAt: string;
}

const approvedCache = new Map<string, { rows: ApprovedComment[]; expiresAt: number }>();

function textOf(value: unknown): string {
  if (typeof value === 'string') return value;
  // Bitable returns rich text as an array of segments.
  if (Array.isArray(value)) {
    return value
      .map((segment) =>
        segment && typeof segment === 'object' && 'text' in segment
          ? String((segment as { text: unknown }).text ?? '')
          : '',
      )
      .join('');
  }
  return '';
}

export async function fetchApproved(
  config: FeishuConfig,
  chapterId: string,
): Promise<ApprovedComment[]> {
  const cached = approvedCache.get(chapterId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.rows;

  const data = await bitable(config, '/records/search?page_size=200', {
    method: 'POST',
    body: {
      filter: {
        conjunction: 'and',
        conditions: [
          { field_name: FIELDS.chapter, operator: 'is', value: [chapterId] },
          { field_name: FIELDS.status, operator: 'is', value: [STATUS.approved] },
        ],
      },
      automatic_fields: false,
    },
  });

  const items = Array.isArray(data.items) ? data.items : [];
  const rows: ApprovedComment[] = items.map((item) => {
    const record = item as { record_id?: string; fields?: Record<string, unknown> };
    const fields = record.fields ?? {};
    return {
      id: String(record.record_id ?? ''),
      displayName: textOf(fields[FIELDS.displayName]) || '匿名读者',
      body: textOf(fields[FIELDS.body]),
      submittedAt: textOf(fields[FIELDS.submittedAt]),
    };
  });
  // Only comments with a body are worth returning; an empty row is a mistake in
  // the table, not something a reader should see.
  const usable = rows.filter((row) => row.body.trim().length > 0);
  approvedCache.set(chapterId, { rows: usable, expiresAt: now + APPROVED_CACHE_MS });
  return usable;
}

export async function submitComment(
  config: FeishuConfig,
  input: {
    chapterId: string;
    chapterTitle: string;
    displayName: string;
    body: string;
    sessionHash: string;
  },
): Promise<void> {
  await bitable(config, '/records', {
    method: 'POST',
    body: {
      fields: {
        [FIELDS.chapter]: input.chapterId,
        [FIELDS.chapterTitle]: input.chapterTitle,
        [FIELDS.displayName]: input.displayName,
        [FIELDS.body]: input.body,
        // Always pending. Nothing a reader submits is ever visible until the
        // owner changes this field in the Bitable.
        [FIELDS.status]: STATUS.pending,
        [FIELDS.submittedAt]: new Date().toISOString(),
        [FIELDS.sessionHash]: input.sessionHash,
      },
    },
  });
}

function reply(response: ServerResponse, status: number, body: string): void {
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(body);
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

const chapterPattern = /^[A-Za-z0-9_-]{1,80}$/;

export async function handleCommentRead(
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  const url = new URL(request.url ?? '/', 'http://localhost');
  const chapterId = url.searchParams.get('chapter') ?? '';
  if (!chapterPattern.test(chapterId)) {
    reply(response, 400, '{"error":"invalid_chapter"}');
    return;
  }
  const config = readFeishuConfig();
  if (!config) {
    reply(response, 200, '{"comments":[],"status":"not_configured"}');
    return;
  }
  try {
    const comments = await fetchApproved(config, chapterId);
    reply(response, 200, JSON.stringify({ comments }));
  } catch {
    // A comment backend being unreachable must not break the chapter.
    reply(response, 200, '{"comments":[],"status":"unavailable"}');
  }
}

export async function handleCommentWrite(
  request: IncomingMessage,
  response: ServerResponse,
  siteOrigin: string,
): Promise<void> {
  if (request.method !== 'POST') {
    reply(response, 405, '{"error":"method_not_allowed"}');
    return;
  }
  const origin = request.headers.origin;
  if (origin && origin !== siteOrigin) {
    reply(response, 403, '{"error":"cross_origin"}');
    return;
  }

  const raw = await readBody(request);
  if (raw === null) {
    reply(response, 413, '{"error":"request_too_large"}');
    return;
  }
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    reply(response, 400, '{"error":"invalid_json"}');
    return;
  }

  const chapterId = typeof payload.chapter_id === 'string' ? payload.chapter_id : '';
  const chapterTitle =
    typeof payload.chapter_title === 'string' ? payload.chapter_title.slice(0, 120) : '';
  const displayNameRaw =
    typeof payload.display_name === 'string' ? payload.display_name.trim() : '';
  const bodyRaw = typeof payload.body === 'string' ? payload.body.trim() : '';
  const sessionId = typeof payload.session_id === 'string' ? payload.session_id : '';

  if (!chapterPattern.test(chapterId)) {
    reply(response, 400, '{"error":"invalid_chapter"}');
    return;
  }
  if (bodyRaw.length < 2 || bodyRaw.length > 2_000) {
    reply(response, 400, '{"error":"invalid_body"}');
    return;
  }
  if (displayNameRaw.length > 40) {
    reply(response, 400, '{"error":"invalid_display_name"}');
    return;
  }
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(sessionId)) {
    reply(response, 400, '{"error":"invalid_session"}');
    return;
  }
  // Links are the entire spam payload for a site like this, and an approved
  // comment is never worth a link the owner did not vet.
  if (/https?:\/\/|www\.|\.com|\.cn\b/i.test(bodyRaw)) {
    reply(response, 400, '{"error":"links_not_allowed"}');
    return;
  }

  const sessionHash = hashSession(sessionId);
  if (!withinRate(sessionHash)) {
    reply(response, 429, '{"error":"rate_limited"}');
    return;
  }

  const config = readFeishuConfig();
  if (!config) {
    reply(response, 503, '{"error":"not_configured"}');
    return;
  }
  try {
    await submitComment(config, {
      chapterId,
      chapterTitle,
      displayName: displayNameRaw || '匿名读者',
      body: bodyRaw,
      sessionHash,
    });
    reply(response, 201, '{"status":"pending"}');
  } catch {
    reply(response, 503, '{"error":"unavailable"}');
  }
}

/** Constant-time bearer check, shared shape with the analytics summary. */
export function hasOwnerToken(request: IncomingMessage, expected: string | undefined): boolean {
  if (!expected) return false;
  const header = request.headers.authorization ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

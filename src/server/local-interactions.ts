import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import {
  appendFileSync,
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve } from "node:path";
import { novelManifest } from "../lib/novel";
import {
  JsonLineCommentRepository,
  type ModerationAction,
  type NovelCommentEvent,
  type NovelCommentSubmission,
} from "./comment-repository";

type JsonObject = Record<string, unknown>;

export interface LocalInteractionOptions {
  readonly privateDataDirectory: string;
  readonly bind: Readonly<{ hostname: string; port: number }>;
}

export type LocalInteractionRouter = (
  request: IncomingMessage,
  response: ServerResponse,
  requestUrl: URL,
) => Promise<boolean>;

export function createLocalInteractionRouter(
  options: Readonly<LocalInteractionOptions>,
): LocalInteractionRouter {
  const port = options.bind.port;
  interface AnalyticsRecord {
    type: 'analytics_event';
    schema_version?: 'analytics-v2';
    occurred_at: string;
    event_name: string;
    path: string;
    session_hash: string;
    properties: Record<string, string>;
  }
  
  interface ParsedJsonLines<T> {
    records: T[];
    totalLines: number;
    invalidLines: number;
    truncated: boolean;
  }
  
  interface MessageRecord {
    type: 'guestbook_submission';
    id: string;
    occurred_at: string;
    status: 'pending';
    display_name: string;
    contact: string;
    body: string;
    related_path: string;
    session_hash: string;
    consent_version: 'local-preview-1';
  }
  
  const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1']);
  const allowedAnalyticsProperties = new Set([
    'acquisition_channel',
    'campaign_id',
    'content_id',
    'content_type',
    'destination',
    'destination_group',
    'node',
    'path',
    'section',
    'source_id',
    'step',
    'story',
    'viewport_class',
  ]);
  const allowedAnalyticsEvents = new Set([
    'article_attribution_copied',
    'article_author_opened',
    'article_source_credit_opened',
    'contact_started',
    'featured_story_opened',
    'first_visit_step_opened',
    'footer_navigation_opened',
    'fragment_timeline_opened',
    'header_research_archive_opened',
    'hero_document_opened',
    'hero_evidence_opened',
    'historical_context_opened',
    'home_featured_story_opened',
    'home_profile_opened',
    'home_section_opened',
    'home_sukaiyuan_opened',
    'knowledge_node_opened',
    'master_navigation_opened',
    'methodology_opened',
    'mobile_master_navigation_opened',
    'mobile_research_archive_opened',
    'page_view',
    'private_message_submitted',
    'reading_completed',
    'reading_engaged',
    'research_participation_opened',
    'story_started',
  ]);
  const allowedAcquisitionChannels = new Set([
    'direct',
    'internal',
    'wechat',
    'xiaohongshu',
    'douyin',
    'zhihu',
    'weibo',
    'search',
    'newsletter',
    'qr',
    'other_referral',
  ]);
  const allowedCampaignIds = new Set([
    'pingdiquan-01',
    'same-name-01',
    'ai-family-history-01',
    'personal-home-01',
    'studio-beta-01',
  ]);
  const allowedContentTypes = new Set([
    'article',
    'story',
    'evidence',
    'profile',
    'service',
    'site',
  ]);
  const allowedDestinationGroups = new Set([
    'external_source',
    'next_content',
    'evidence',
    'profile',
    'service',
    'navigation',
  ]);
  const allowedViewportClasses = new Set(['mobile', 'tablet', 'desktop']);
  const allowedContentId = /^[a-z0-9][a-z0-9-]{0,63}$/;
  const allowedRecordId = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
  const allowedShortSlug = /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/;
  const allowedSessionId = /^(?:[0-9a-f]{32}|[0-9a-f]{64}|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
  const allowedPagePath = /^\/[a-zA-Z0-9_./%?=&-]{0,299}$/;
  const maximumPrivateLogBytes = 25 * 1024 * 1024;
  const commentableChapterIds = new Set(
    novelManifest.sections
      .filter((section) => section.commentable)
      .map((section) => section.id),
  );
  const moderationActions = new Set<ModerationAction>([
    'approved',
    'rejected',
    'spam',
    'withdrawn',
  ]);
  
  const strictSha256 = /^[0-9a-f]{64}$/;
  
  function cleanText(value: unknown): string {
    if (typeof value !== 'string') return '';
    return value
      .replace(/\r\n?/g, '\n')
      .replace(/\u0000/g, '')
      .trim();
  }
  
  function normalizeText(value: unknown, maximumLength: number): string {
    return cleanText(value).slice(0, maximumLength);
  }
  
  function normalizeUnicodeText(value: unknown, maximumLength: number): string {
    return Array.from(cleanText(value)).slice(0, maximumLength).join('');
  }
  
  function textLength(value: unknown): number {
    return Array.from(cleanText(value)).length;
  }
  
  function normalizePagePath(value: unknown, fallback = '/'): string {
    const candidate = normalizeText(value, 300);
    if (!allowedPagePath.test(candidate)) return fallback;
    try {
      const parsed = new URL(candidate, 'http://127.0.0.1');
      return parsed.pathname;
    } catch {
      return fallback;
    }
  }
  
  function parseJsonLines<T>(path: string): ParsedJsonLines<T> {
    if (!existsSync(path)) {
      return {
        records: [],
        totalLines: 0,
        invalidLines: 0,
        truncated: false,
      };
    }
    const text = readFileSync(path, 'utf8').trim();
    if (!text) {
      return {
        records: [],
        totalLines: 0,
        invalidLines: 0,
        truncated: false,
      };
    }
    const allLines = text.split('\n');
    const selectedLines = allLines.slice(-5000);
    let invalidLines = 0;
    const records = selectedLines
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as T];
        } catch {
          invalidLines += 1;
          return [];
        }
      });
    if (invalidLines > 0) {
      console.warn(`${path} contains ${invalidLines} unreadable NDJSON line(s)`);
    }
    return {
      records,
      totalLines: allLines.length,
      invalidLines,
      truncated: allLines.length > selectedLines.length,
    };
  }
  
  function appendPrivateRecord(path: string, record: AnalyticsRecord | MessageRecord): boolean {
    const line = `${JSON.stringify(record)}\n`;
    const currentBytes = existsSync(path) ? statSync(path).size : 0;
    if (currentBytes + Buffer.byteLength(line, 'utf8') > maximumPrivateLogBytes) {
      return false;
    }
    appendFileSync(path, line, {
      encoding: 'utf8',
      flag: 'a',
      mode: 0o600,
    });
    chmodSync(path, 0o600);
    return true;
  }
  
  function sendJson(
    res: ServerResponse,
    statusCode: number,
    body: JsonObject,
  ): void {
    const payload = Buffer.from(JSON.stringify(body), 'utf8');
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', String(payload.length));
    res.end(payload);
  }
  
  function requestComesFromLocalSite(
    req: IncomingMessage,
    requireOrigin: boolean,
  ): boolean {
    const hostHeader = normalizeText(req.headers.host, 200);
    if (!hostHeader) return false;
  
    try {
      const requestUrl = new URL(`http://${hostHeader}`);
      if (
        !loopbackHosts.has(requestUrl.hostname)
        || requestUrl.port !== String(port)
      ) {
        return false;
      }
    } catch {
      return false;
    }
  
    const origin = req.headers.origin;
    if (origin === undefined) return !requireOrigin;
    try {
      const originUrl = new URL(origin);
      return (
        originUrl.protocol === 'http:'
        && loopbackHosts.has(originUrl.hostname)
        && originUrl.port === String(port)
      );
    } catch {
      return false;
    }
  }
  
  function readJsonRequest(req: IncomingMessage, maximumBytes: number): Promise<JsonObject> {
    return new Promise((resolveRequest, rejectRequest) => {
      const chunks: Buffer[] = [];
      let receivedBytes = 0;
      let tooLarge = false;
  
      req.on('data', (chunk: Buffer | string) => {
        if (tooLarge) return;
        const payload = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        receivedBytes += payload.length;
        if (receivedBytes > maximumBytes) {
          tooLarge = true;
          chunks.length = 0;
          return;
        }
        chunks.push(payload);
      });
      req.on('end', () => {
        if (tooLarge) {
          rejectRequest(new Error('request_too_large'));
          return;
        }
        try {
          const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
          resolveRequest(requireObject('request body', parsed));
        } catch {
          rejectRequest(new Error('invalid_json'));
        }
      });
      req.on('error', rejectRequest);
    });
  }
  
  function validateAnalyticsProperties(value: unknown): Record<string, string> | null {
    if (value === undefined) return {};
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return null;
  
    const entries = Object.entries(value);
    if (entries.some(([key]) => !allowedAnalyticsProperties.has(key))) return null;
  
    const cleaned: Record<string, string> = {};
    for (const [key, rawValue] of entries) {
      const property = normalizeText(rawValue, 160);
      if (!property) continue;
  
      if (key === 'acquisition_channel' && !allowedAcquisitionChannels.has(property)) return null;
      if (key === 'campaign_id' && !allowedCampaignIds.has(property)) return null;
      if (key === 'content_id' && !allowedContentId.test(property)) return null;
      if (key === 'content_type' && !allowedContentTypes.has(property)) return null;
      if (key === 'destination_group' && !allowedDestinationGroups.has(property)) return null;
      if (key === 'viewport_class' && !allowedViewportClasses.has(property)) return null;
      if ((key === 'source_id' || key === 'node') && !allowedRecordId.test(property)) return null;
      if (
        (key === 'section' || key === 'step' || key === 'story')
        && !allowedShortSlug.test(property)
      ) {
        return null;
      }
      if (key === 'destination' || key === 'path') {
        const normalizedPath = normalizePagePath(property, '');
        if (!normalizedPath) return null;
        cleaned[key] = normalizedPath;
        continue;
      }
      cleaned[key] = property;
    }
  
    if (!cleaned.acquisition_channel) cleaned.acquisition_channel = 'direct';
    return cleaned;
  }
  
  const runtimeDataDirectory = resolve(options.privateDataDirectory);
  const analyticsLogPath = resolve(runtimeDataDirectory, 'analytics-events.ndjson');
  const messagesLogPath = resolve(runtimeDataDirectory, 'guestbook-messages.ndjson');
  const visitorSaltPath = resolve(runtimeDataDirectory, 'visitor-salt');
  const adminTokenPath = resolve(runtimeDataDirectory, 'admin-token');
  const chapterCommentsPath = resolve(runtimeDataDirectory, 'chapter-comments.ndjson');
  const chapterCommentEventsPath = resolve(
    runtimeDataDirectory,
    'chapter-comment-events.ndjson',
  );
  const corpusIndexPath = resolve(runtimeDataDirectory, 'local-corpus-index.json');
  mkdirSync(runtimeDataDirectory, { recursive: true, mode: 0o700 });
  chmodSync(runtimeDataDirectory, 0o700);
  
  if (!existsSync(visitorSaltPath)) {
    writeFileSync(visitorSaltPath, randomBytes(32).toString('hex'), {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
  }
  chmodSync(visitorSaltPath, 0o600);
  const visitorSalt = readFileSync(visitorSaltPath, 'utf8').trim();
  if (!strictSha256.test(visitorSalt)) {
    throw new Error('Local visitor salt is malformed');
  }
  
  if (!existsSync(adminTokenPath)) {
    writeFileSync(adminTokenPath, randomBytes(32).toString('hex'), {
      encoding: 'utf8',
      flag: 'wx',
      mode: 0o600,
    });
  }
  chmodSync(adminTokenPath, 0o600);
  const adminToken = readFileSync(adminTokenPath, 'utf8').trim();
  if (!strictSha256.test(adminToken)) {
    throw new Error('Local admin token is malformed');
  }
  
  const rateBuckets = new Map<string, number[]>();
  const commentRepository = new JsonLineCommentRepository(
    chapterCommentsPath,
    chapterCommentEventsPath,
    maximumPrivateLogBytes,
  );
  
  function hasValidAdminToken(req: IncomingMessage): boolean {
    const authorization = String(req.headers.authorization ?? '');
    const prefix = 'Bearer ';
    if (!authorization.startsWith(prefix)) return false;
  
    const suppliedBuffer = Buffer.from(authorization.slice(prefix.length), 'utf8');
    const expectedBuffer = Buffer.from(adminToken, 'utf8');
    return (
      suppliedBuffer.length === expectedBuffer.length
      && timingSafeEqual(suppliedBuffer, expectedBuffer)
    );
  }
  
  function hashSession(value: unknown): string {
    const session = normalizeText(value, 120);
    if (!session) return 'anonymous';
    return createHmac('sha256', visitorSalt).update(session).digest('hex').slice(0, 24);
  }
  
  function escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
        })[character] ?? character,
    );
  }
  
  function exceedsRateLimit(key: string, maximum: number, windowMilliseconds: number): boolean {
    const now = Date.now();
    const threshold = now - windowMilliseconds;
    const existing = (rateBuckets.get(key) ?? []).filter((timestamp) => timestamp >= threshold);
    if (existing.length >= maximum) {
      rateBuckets.set(key, existing);
      return true;
    }
    existing.push(now);
    rateBuckets.set(key, existing);
    return false;
  }
  
  function tryConsumeRateLimits(
    limits: Array<{
      key: string;
      maximum: number;
      windowMilliseconds: number;
    }>,
  ): boolean {
    const now = Date.now();
    const pruned = limits.map((limit) => {
      const threshold = now - limit.windowMilliseconds;
      return {
        ...limit,
        timestamps: (rateBuckets.get(limit.key) ?? []).filter(
          (timestamp) => timestamp >= threshold,
        ),
      };
    });
    for (const bucket of pruned) {
      rateBuckets.set(bucket.key, bucket.timestamps);
      if (bucket.timestamps.length >= bucket.maximum) return false;
    }
    for (const bucket of pruned) {
      bucket.timestamps.push(now);
      rateBuckets.set(bucket.key, bucket.timestamps);
    }
    return true;
  }
  
  async function handleLocalAnalytics(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, true)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
      sendJson(res, 415, { ok: false, error: 'application_json_required' });
      return;
    }
  
    let body: JsonObject;
    try {
      body = await readJsonRequest(req, 8 * 1024);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : 'invalid_request';
      sendJson(res, code === 'request_too_large' ? 413 : 400, { ok: false, error: code });
      return;
    }
  
    const eventName = normalizeText(body.event_name, 64);
    const pagePath = normalizePagePath(body.path, '');
    const sessionId = normalizeText(body.session_id, 120);
    const properties = validateAnalyticsProperties(body.properties);
    if (
      !allowedAnalyticsEvents.has(eventName)
      || !pagePath
      || !allowedSessionId.test(sessionId)
      || properties === null
    ) {
      sendJson(res, 400, { ok: false, error: 'invalid_event_contract' });
      return;
    }
  
    const sessionHash = hashSession(sessionId);
    if (
      exceedsRateLimit('event:global', 1200, 60_000)
      || exceedsRateLimit(`event:${sessionHash}`, 180, 60_000)
    ) {
      sendJson(res, 429, { ok: false, error: 'rate_limited' });
      return;
    }
  
    const saved = appendPrivateRecord(analyticsLogPath, {
      type: 'analytics_event',
      schema_version: 'analytics-v2',
      occurred_at: new Date().toISOString(),
      event_name: eventName,
      path: pagePath,
      session_hash: sessionHash,
      properties,
    });
    if (!saved) {
      sendJson(res, 507, { ok: false, error: 'local_log_capacity_reached' });
      return;
    }
    sendJson(res, 202, { ok: true });
  }
  
  async function handleLocalMessage(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, true)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (!String(req.headers['content-type'] ?? '').toLowerCase().startsWith('application/json')) {
      sendJson(res, 415, { ok: false, error: 'application_json_required' });
      return;
    }
  
    let body: JsonObject;
    try {
      body = await readJsonRequest(req, 8 * 1024);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : 'invalid_request';
      sendJson(res, code === 'request_too_large' ? 413 : 400, { ok: false, error: code });
      return;
    }
  
    const honeypot = normalizeText(body.website, 200);
    if (honeypot) {
      sendJson(res, 202, { ok: true });
      return;
    }
  
    const displayName = normalizeText(body.display_name, 40);
    const contact = normalizeText(body.contact, 120);
    const messageBody = normalizeText(body.body, 2000);
    const relatedPath = normalizePagePath(body.related_path);
    if (
      messageBody.length < 10
      || body.consent !== true
      || displayName.length > 40
      || contact.length > 120
    ) {
      sendJson(res, 400, { ok: false, error: 'invalid_message_contract' });
      return;
    }
  
    const sessionId = normalizeText(body.session_id, 120);
    if (!allowedSessionId.test(sessionId)) {
      sendJson(res, 400, { ok: false, error: 'invalid_session_id' });
      return;
    }
    const sessionHash = hashSession(sessionId);
    if (
      exceedsRateLimit('message:global', 12, 30 * 60_000)
      || exceedsRateLimit(`message:${sessionHash}`, 3, 30 * 60_000)
    ) {
      sendJson(res, 429, { ok: false, error: 'rate_limited' });
      return;
    }
  
    const id = `msg-${Date.now()}-${randomBytes(5).toString('hex')}`;
    const saved = appendPrivateRecord(messagesLogPath, {
      type: 'guestbook_submission',
      id,
      occurred_at: new Date().toISOString(),
      status: 'pending',
      display_name: displayName || '匿名访客',
      contact,
      body: messageBody,
      related_path: relatedPath,
      session_hash: sessionHash,
      consent_version: 'local-preview-1',
    });
    if (!saved) {
      sendJson(res, 507, { ok: false, error: 'local_log_capacity_reached' });
      return;
    }
    sendJson(res, 201, {
      ok: true,
      id,
      status: 'pending',
      notice: '留言仅保存在本机并等待站主查看，不会自动公开。',
    });
  }
  
  function handleLocalInsights(req: IncomingMessage, res: ServerResponse): void {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, false)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
  
    const analyticsSnapshot = parseJsonLines<AnalyticsRecord>(analyticsLogPath);
    const messagesSnapshot = parseJsonLines<MessageRecord>(messagesLogPath);
    const windowDays = 30;
    const dateKeys = Array.from({ length: windowDays }, (_, index) => {
      const date = new Date(Date.now() - (windowDays - index - 1) * 86_400_000);
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    });
    const dateKeySet = new Set(dateKeys);
    const dateKeyForRecord = (occurredAt: string): string => {
      const date = new Date(occurredAt);
      if (Number.isNaN(date.getTime())) return '';
      const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date);
      const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
      return `${values.year}-${values.month}-${values.day}`;
    };
    const analytics = analyticsSnapshot.records
      .filter((record) => dateKeySet.has(dateKeyForRecord(record.occurred_at)))
      .sort((left, right) => left.occurred_at.localeCompare(right.occurred_at));
    const pageViews = analytics.filter((record) => record.event_name === 'page_view');
    const keyActions = analytics.filter((record) => record.event_name !== 'page_view');
    const sessions = new Set(pageViews.map((record) => record.session_hash));
    const engagedSessions = new Set(
      analytics
        .filter((record) => record.event_name === 'reading_engaged')
        .map((record) => record.session_hash),
    );
    const actionSessions = new Set(keyActions.map((record) => record.session_hash));
    const pageCounts = new Map<string, number>();
    const dailyCounts = new Map(dateKeys.map((date) => [date, 0]));
    const eventCounts = new Map<string, number>();
  
    for (const record of analytics) {
      if (record.event_name !== 'page_view') {
        eventCounts.set(record.event_name, (eventCounts.get(record.event_name) ?? 0) + 1);
        continue;
      }
      pageCounts.set(record.path, (pageCounts.get(record.path) ?? 0) + 1);
      const day = dateKeyForRecord(record.occurred_at);
      dailyCounts.set(day, (dailyCounts.get(day) ?? 0) + 1);
    }
  
    const firstPageViewBySession = new Map<string, AnalyticsRecord>();
    for (const record of pageViews) {
      if (!firstPageViewBySession.has(record.session_hash)) {
        firstPageViewBySession.set(record.session_hash, record);
      }
    }
    const sourceCounts = new Map<string, {
      channel: string;
      campaign: string;
      sessions: number;
      engaged: number;
    }>();
    for (const [sessionHash, record] of firstPageViewBySession) {
      const channel = record.properties?.acquisition_channel || 'unknown';
      const campaign = record.properties?.campaign_id || '—';
      const key = `${channel}\u0000${campaign}`;
      const row = sourceCounts.get(key) ?? {
        channel,
        campaign,
        sessions: 0,
        engaged: 0,
      };
      row.sessions += 1;
      if (engagedSessions.has(sessionHash)) row.engaged += 1;
      sourceCounts.set(key, row);
    }
  
    interface ReadingStages {
      enteredAt?: string;
      engagedAt?: string;
      completedAt?: string;
      continuedAt?: string;
    }
    const readingBySessionAndContent = new Map<string, ReadingStages>();
    for (const record of analytics) {
      const inferredContent = record.path.match(/^\/discover\/([a-z0-9-]+)$/)?.[1];
      const contentId = record.properties?.content_id || inferredContent;
      if (!contentId || !['1936-pingdiquan', 'same-name', 'ai-family-history'].includes(contentId)) {
        continue;
      }
      const key = `${record.session_hash}\u0000${contentId}`;
      const stages = readingBySessionAndContent.get(key) ?? {};
      if (record.event_name === 'page_view' && !stages.enteredAt) {
        stages.enteredAt = record.occurred_at;
      } else if (
        record.event_name === 'reading_engaged'
        && stages.enteredAt
        && record.occurred_at >= stages.enteredAt
        && !stages.engagedAt
      ) {
        stages.engagedAt = record.occurred_at;
      } else if (
        record.event_name === 'reading_completed'
        && stages.engagedAt
        && record.occurred_at >= stages.engagedAt
        && !stages.completedAt
      ) {
        stages.completedAt = record.occurred_at;
      } else if (
        stages.engagedAt
        && record.occurred_at >= stages.engagedAt
        && allowedDestinationGroups.has(record.properties?.destination_group ?? '')
        && record.properties?.destination_group !== 'navigation'
        && !stages.continuedAt
      ) {
        stages.continuedAt = record.occurred_at;
      }
      readingBySessionAndContent.set(key, stages);
    }
  
    const readingRows = [...readingBySessionAndContent.entries()];
    const readingFunnel = [
      {
        stage: 'article_entered',
        label: '进入文章',
        sessions: readingRows.filter(([, stages]) => Boolean(stages.enteredAt)).length,
      },
      {
        stage: 'reading_engaged',
        label: '有效阅读',
        sessions: readingRows.filter(([, stages]) => Boolean(stages.engagedAt)).length,
      },
      {
        stage: 'reading_completed',
        label: '读到文末',
        sessions: readingRows.filter(([, stages]) => Boolean(stages.completedAt)).length,
      },
      {
        stage: 'continued',
        label: '有效阅读后继续探索',
        sessions: readingRows.filter(([, stages]) => Boolean(stages.continuedAt)).length,
      },
    ];
  
    const contentPerformance = ['1936-pingdiquan', 'same-name', 'ai-family-history'].map((contentId) => {
      const rows = readingRows.filter(([key]) => key.endsWith(`\u0000${contentId}`));
      const entered = rows.filter(([, stages]) => Boolean(stages.enteredAt)).length;
      const engaged = rows.filter(([, stages]) => Boolean(stages.engagedAt)).length;
      const completed = rows.filter(([, stages]) => Boolean(stages.completedAt)).length;
      const continued = rows.filter(([, stages]) => Boolean(stages.continuedAt)).length;
      return {
        content_id: contentId,
        entered,
        engaged,
        completed,
        continued,
        activation_rate: entered === 0 ? 0 : Math.round((engaged / entered) * 1000) / 10,
        completion_rate: entered === 0 ? 0 : Math.round((completed / entered) * 1000) / 10,
      };
    });
  
    const payload = Buffer.from(JSON.stringify({
      ok: true,
      generated_at: new Date().toISOString(),
      storage_scope: 'local_private_runtime',
      window: {
        days: windowDays,
        timezone: 'Asia/Shanghai',
        start_date: dateKeys[0],
        end_date: dateKeys.at(-1),
        loaded_records: analytics.length,
        source_total_lines: analyticsSnapshot.totalLines,
        truncated: analyticsSnapshot.truncated,
        invalid_lines: analyticsSnapshot.invalidLines,
        notice: '当前数据主要来自本机开发与验收，不代表真实受众。',
      },
      totals: {
        page_views: pageViews.length,
        sessions: sessions.size,
        engaged_sessions: engagedSessions.size,
        action_sessions: actionSessions.size,
        tracked_events: keyActions.length,
        saved_messages: messagesSnapshot.records.length,
        pages_per_session: sessions.size === 0
          ? 0
          : Math.round((pageViews.length / sessions.size) * 100) / 100,
        action_rate: sessions.size === 0
          ? 0
          : Math.round((actionSessions.size / sessions.size) * 1000) / 10,
      },
      top_pages: [...pageCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 12)
        .map(([path, views]) => ({ path, views })),
      daily_page_views: [...dailyCounts.entries()]
        .map(([date, views]) => ({ date, views })),
      event_counts: [...eventCounts.entries()]
        .sort((left, right) => right[1] - left[1])
        .slice(0, 20)
        .map(([event_name, count]) => ({ event_name, count })),
      source_quality: [...sourceCounts.values()]
        .sort((left, right) => right.sessions - left.sessions)
        .map((row) => ({
          ...row,
          activation_rate: row.sessions === 0
            ? 0
            : Math.round((row.engaged / row.sessions) * 1000) / 10,
        })),
      reading_funnel: readingFunnel,
      content_performance: contentPerformance,
    }), 'utf8');
  
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Length', String(payload.length));
    res.end(req.method === 'HEAD' ? undefined : payload);
  }
  
  function handleLocalInbox(req: IncomingMessage, res: ServerResponse): void {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, false)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (!hasValidAdminToken(req)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="local-inbox"');
      sendJson(res, 401, { ok: false, error: 'admin_token_required' });
      return;
    }
  
    const messages = parseJsonLines<MessageRecord>(messagesLogPath).records
      .slice(-30)
      .reverse()
      .map((message) => ({
        type: message.type,
        id: message.id,
        occurred_at: message.occurred_at,
        status: message.status,
        display_name: message.display_name,
        contact: message.contact,
        body: message.body,
        related_path: message.related_path,
        consent_version: message.consent_version,
      }));
  
    const recentAnalytics = parseJsonLines<AnalyticsRecord>(analyticsLogPath).records
      .slice(-40)
      .reverse();
    const sessionLabels = new Map<string, string>();
    const recentActivity = recentAnalytics.map((record) => {
      if (!sessionLabels.has(record.session_hash)) {
        sessionLabels.set(
          record.session_hash,
          `S${String(sessionLabels.size + 1).padStart(2, '0')}`,
        );
      }
      return {
        occurred_at: record.occurred_at,
        event_name: record.event_name,
        path: record.path,
        acquisition_channel: record.properties?.acquisition_channel || 'unknown',
        content_id: record.properties?.content_id || '',
        session_label: sessionLabels.get(record.session_hash),
      };
    });
  
    sendJson(res, 200, {
      ok: true,
      storage_scope: 'local_private_runtime',
      messages,
      recent_activity: recentActivity,
    });
  }
  
  async function handleNovelComments(
    req: IncomingMessage,
    res: ServerResponse,
    requestUrl: URL,
  ): Promise<void> {
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (!requestComesFromLocalSite(req, false)) {
        sendJson(res, 403, { ok: false, error: 'local_origin_required' });
        return;
      }
      const chapterId = normalizeText(requestUrl.searchParams.get('chapter'), 80);
      if (!commentableChapterIds.has(chapterId)) {
        sendJson(res, 400, { ok: false, error: 'invalid_chapter' });
        return;
      }
      const health = commentRepository.health();
      if (!health.healthy) {
        sendJson(res, 503, {
          ok: false,
          error: 'comment_log_unhealthy',
          comments: [],
        });
        return;
      }
      const approvedPage = commentRepository.listApproved(chapterId);
      const comments = approvedPage.comments.map((comment) => ({
        id: comment.id,
        occurred_at: comment.occurred_at,
        chapter_id: comment.chapter_id,
        display_name: comment.display_name,
        body: comment.body,
        status: 'approved',
      }));
      if (req.method === 'HEAD') {
        const payload = Buffer.from(
          JSON.stringify({
            ok: true,
            chapter_id: chapterId,
            comments,
            total: approvedPage.total,
            truncated: approvedPage.truncated,
          }),
          'utf8',
        );
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Length', String(payload.length));
        res.end();
        return;
      }
      sendJson(res, 200, {
        ok: true,
        chapter_id: chapterId,
        comments,
        total: approvedPage.total,
        truncated: approvedPage.truncated,
      });
      return;
    }
  
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, HEAD, POST');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, true)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (
      !String(req.headers['content-type'] ?? '')
        .toLowerCase()
        .startsWith('application/json')
    ) {
      sendJson(res, 415, { ok: false, error: 'application_json_required' });
      return;
    }
  
    let body: JsonObject;
    try {
      body = await readJsonRequest(req, 8 * 1024);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : 'invalid_request';
      sendJson(res, code === 'request_too_large' ? 413 : 400, {
        ok: false,
        error: code,
      });
      return;
    }
  
    if (normalizeText(body.website, 200)) {
      sendJson(res, 202, { ok: true, status: 'pending' });
      return;
    }
  
    const chapterId = normalizeText(body.chapter_id, 80);
    const rawDisplayNameLength = textLength(body.display_name);
    const rawCommentLength = textLength(body.body);
    const displayName =
      normalizeUnicodeText(body.display_name, 40) || '匿名读者';
    const commentBody = normalizeUnicodeText(body.body, 1000);
    const sessionId = normalizeText(body.session_id, 120);
    const linkMatches =
      commentBody.match(
        /(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|cn|net|org)\b)/gi,
      ) ?? [];
    if (
      !commentableChapterIds.has(chapterId) ||
      rawCommentLength < 2 ||
      rawCommentLength > 1000 ||
      rawDisplayNameLength > 40 ||
      body.consent !== true ||
      !allowedSessionId.test(sessionId) ||
      linkMatches.length > 1 ||
      /javascript\s*:/i.test(commentBody)
    ) {
      sendJson(res, 400, { ok: false, error: 'invalid_comment_contract' });
      return;
    }
  
    const sessionHash = hashSession(sessionId);
    const normalizedForDuplicate = commentBody
      .toLocaleLowerCase('zh-CN')
      .replace(/\s+/g, ' ');
    const fingerprint = createHash('sha256')
      .update(`${chapterId}\u0000${normalizedForDuplicate}\u0000${sessionHash}`)
      .digest('hex');
    if (commentRepository.hasDuplicate(chapterId, fingerprint)) {
      sendJson(res, 409, { ok: false, error: 'duplicate_comment' });
      return;
    }
    if (
      !tryConsumeRateLimits([
        {
          key: `novel-comment:${sessionHash}`,
          maximum: 3,
          windowMilliseconds: 30 * 60_000,
        },
        {
          key: 'novel-comment:global',
          maximum: 30,
          windowMilliseconds: 30 * 60_000,
        },
      ])
    ) {
      sendJson(res, 429, { ok: false, error: 'rate_limited' });
      return;
    }
  
    const submission: NovelCommentSubmission = {
      type: 'novel_comment_submission',
      id: `cmt-${Date.now()}-${randomBytes(5).toString('hex')}`,
      occurred_at: new Date().toISOString(),
      chapter_id: chapterId,
      display_name: escapeHtml(displayName),
      body: escapeHtml(commentBody),
      session_hash: sessionHash,
      fingerprint,
      status: 'pending',
      consent_version: 'novel-comments-local-1',
    };
    if (!commentRepository.appendSubmission(submission)) {
      sendJson(res, 507, { ok: false, error: 'local_log_capacity_reached' });
      return;
    }
    sendJson(res, 201, {
      ok: true,
      id: submission.id,
      status: 'pending',
      notice: '评论已保存在本机审核队列；批准前不会出现在章节页面。',
    });
  }
  
  function handleNovelCommentInbox(
    req: IncomingMessage,
    res: ServerResponse,
    requestUrl: URL,
  ): void {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, false)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (!hasValidAdminToken(req)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="local-novel-comments"');
      sendJson(res, 401, { ok: false, error: 'admin_token_required' });
      return;
    }
    const requestedStatus = requestUrl.searchParams.get('status') ?? 'pending';
    const status = requestedStatus === 'all' ? 'all' : 'pending';
    const cursor = Number(requestUrl.searchParams.get('cursor') ?? '0');
    const limit = Number(requestUrl.searchParams.get('limit') ?? '50');
    if (
      !Number.isInteger(cursor) ||
      cursor < 0 ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      sendJson(res, 400, { ok: false, error: 'invalid_pagination' });
      return;
    }
    const inboxPage = commentRepository.listInboxPage({
      status,
      cursor,
      limit,
    });
    if (req.method === 'HEAD') {
      const payload = Buffer.from(
        JSON.stringify({ ok: true, ...inboxPage }),
        'utf8',
      );
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', String(payload.length));
      res.end();
      return;
    }
    sendJson(res, 200, {
      ok: true,
      storage_scope: 'local_private_runtime',
      ...inboxPage,
    });
  }
  
  async function handleNovelCommentModeration(
    req: IncomingMessage,
    res: ServerResponse,
  ): Promise<void> {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, true)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (!hasValidAdminToken(req)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="local-novel-comments"');
      sendJson(res, 401, { ok: false, error: 'admin_token_required' });
      return;
    }
    if (
      !String(req.headers['content-type'] ?? '')
        .toLowerCase()
        .startsWith('application/json')
    ) {
      sendJson(res, 415, { ok: false, error: 'application_json_required' });
      return;
    }
    let body: JsonObject;
    try {
      body = await readJsonRequest(req, 4 * 1024);
    } catch (error: unknown) {
      const code = error instanceof Error ? error.message : 'invalid_request';
      sendJson(res, code === 'request_too_large' ? 413 : 400, {
        ok: false,
        error: code,
      });
      return;
    }
    const commentId = normalizeText(body.comment_id, 80);
    const action = normalizeText(body.action, 24) as ModerationAction;
    if (
      !/^cmt-\d{10,}-[0-9a-f]{10}$/.test(commentId) ||
      !moderationActions.has(action) ||
      !commentRepository.hasComment(commentId)
    ) {
      sendJson(res, 400, { ok: false, error: 'invalid_moderation_contract' });
      return;
    }
    const event: NovelCommentEvent = {
      type: 'novel_comment_event',
      id: `mod-${Date.now()}-${randomBytes(5).toString('hex')}`,
      comment_id: commentId,
      occurred_at: new Date().toISOString(),
      action,
      moderator: 'local-admin',
    };
    if (!commentRepository.appendModeration(event)) {
      sendJson(res, 507, { ok: false, error: 'local_log_capacity_reached' });
      return;
    }
    sendJson(res, 200, {
      ok: true,
      comment_id: commentId,
      status: action,
    });
  }
  
  function handleLocalCorpusHits(
    req: IncomingMessage,
    res: ServerResponse,
    requestUrl: URL,
  ): void {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.setHeader('Allow', 'GET, HEAD');
      sendJson(res, 405, { ok: false, error: 'method_not_allowed' });
      return;
    }
    if (!requestComesFromLocalSite(req, false)) {
      sendJson(res, 403, { ok: false, error: 'local_origin_required' });
      return;
    }
    if (!hasValidAdminToken(req)) {
      res.setHeader('WWW-Authenticate', 'Bearer realm="local-corpus-index"');
      sendJson(res, 401, { ok: false, error: 'admin_token_required' });
      return;
    }
    const entityId = normalizeText(requestUrl.searchParams.get('entity'), 40);
    if (!allowedRecordId.test(entityId)) {
      sendJson(res, 400, { ok: false, error: 'invalid_entity_id' });
      return;
    }
    if (!existsSync(corpusIndexPath) || statSync(corpusIndexPath).size > 20 * 1024 * 1024) {
      sendJson(res, 404, { ok: false, error: 'index_not_available' });
      return;
    }
    let index: JsonObject;
    try {
      index = requireObject(
        'local corpus index',
        JSON.parse(readFileSync(corpusIndexPath, 'utf8')) as unknown,
      );
    } catch {
      sendJson(res, 500, { ok: false, error: 'index_unreadable' });
      return;
    }
    if (
      index.schema_version !== 'handx-local-corpus-index-1.0' ||
      index.must_not_deploy !== true
    ) {
      sendJson(res, 500, { ok: false, error: 'index_gate_invalid' });
      return;
    }
    const documents = Array.isArray(index.documents) ? index.documents : [];
    const hits: JsonObject[] = [];
    let omittedRestricted = 0;
    for (const rawDocument of documents) {
      if (
        rawDocument === null ||
        typeof rawDocument !== 'object' ||
        Array.isArray(rawDocument)
      ) {
        continue;
      }
      const document = rawDocument as JsonObject;
      const matches = Array.isArray(document.matches) ? document.matches : [];
      const match = matches.find((rawMatch) => {
        if (
          rawMatch === null ||
          typeof rawMatch !== 'object' ||
          Array.isArray(rawMatch)
        ) {
          return false;
        }
        return (rawMatch as JsonObject).entity_id === entityId;
      }) as JsonObject | undefined;
      if (!match) continue;
      if (document.access_tier !== 'P1-owner-only') {
        omittedRestricted += 1;
        continue;
      }
      const locators = Array.isArray(match.locators)
        ? match.locators
            .map((locator) => normalizeText(locator, 80))
            .filter(Boolean)
            .slice(0, 20)
        : [];
      hits.push({
        document_id: normalizeText(document.document_id, 40),
        title: normalizeText(document.title, 180),
        suffix: normalizeText(document.suffix, 16),
        material_class: normalizeText(document.material_class, 80),
        access_tier: 'P1-owner-only',
        locators,
        creates_claim: false,
      });
      if (hits.length >= 200) break;
    }
    const payload = {
      ok: true,
      entity_id: entityId,
      generated_at: normalizeText(index.generated_at, 64),
      hits,
      omitted_restricted: omittedRestricted,
      creates_claims_or_edges: false,
    };
    if (req.method === 'HEAD') {
      const bytes = Buffer.from(JSON.stringify(payload), 'utf8');
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Length', String(bytes.length));
      res.end();
      return;
    }
    sendJson(res, 200, payload);
  }
  
  function requireObject(name: string, value: unknown): JsonObject {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error(`${name} is not a JSON object`);
    }
    return value as JsonObject;
  }
  
  
  return async (request, response, requestUrl) => {
    const pathname = requestUrl.pathname;
    if (pathname === "/api/local/analytics") {
      await handleLocalAnalytics(request, response);
      return true;
    }
    if (pathname === "/api/local/messages") {
      await handleLocalMessage(request, response);
      return true;
    }
    if (pathname === "/api/local/insights") {
      handleLocalInsights(request, response);
      return true;
    }
    if (pathname === "/api/local/inbox") {
      handleLocalInbox(request, response);
      return true;
    }
    if (pathname === "/api/local/novel-comments") {
      await handleNovelComments(request, response, requestUrl);
      return true;
    }
    if (pathname === "/api/local/novel-comments/inbox") {
      handleNovelCommentInbox(request, response, requestUrl);
      return true;
    }
    if (pathname === "/api/local/novel-comments/moderate") {
      await handleNovelCommentModeration(request, response);
      return true;
    }
    if (pathname === "/api/local/corpus-hits") {
      handleLocalCorpusHits(request, response, requestUrl);
      return true;
    }
    return false;
  };
}

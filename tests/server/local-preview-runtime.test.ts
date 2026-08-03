import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { once } from 'node:events';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { createLocalPreviewRuntime } from '../../src/server/local-preview-runtime';

const projectRoot = process.cwd();
const projectionPaths = [
  '/data/persons.json',
  '/data/events.json',
  '/data/timeline.json',
  '/data/sources.json',
] as const;

async function reserveLoopbackPort(): Promise<number> {
  const probe = createServer();
  probe.listen(0, '127.0.0.1');
  await once(probe, 'listening');
  const address = probe.address();
  assert(address && typeof address === 'object');
  const port = address.port;
  probe.close();
  await once(probe, 'close');
  return port;
}

async function closeServer(server: Server): Promise<void> {
  server.close();
  await once(server, 'close');
}

function copyPreviewProjectionFixture(): string {
  const fixtureRoot = mkdtempSync(resolve(tmpdir(), 'handx-preview-fixture-'));
  mkdirSync(resolve(fixtureRoot, 'src', 'data'), { recursive: true });
  mkdirSync(resolve(fixtureRoot, 'public', 'data'), { recursive: true });
  cpSync(
    resolve(projectRoot, 'src', 'data', 'research.json'),
    resolve(fixtureRoot, 'src', 'data', 'research.json'),
  );
  for (const pathname of projectionPaths) {
    cpSync(
      resolve(projectRoot, 'public', pathname.slice(1)),
      resolve(fixtureRoot, 'public', pathname.slice(1)),
    );
  }
  return fixtureRoot;
}

function mutateJson(
  path: string,
  mutate: (value: Record<string, unknown>) => void,
): void {
  const value = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  mutate(value);
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function buildArchiveMissionOwnerFixture(): Record<string, unknown> {
  const publicDataset = JSON.parse(
    readFileSync(resolve(projectRoot, 'src/data/archive-missions.json'), 'utf8'),
  ) as {
    _meta: Record<string, unknown> & { generation_id: string };
    missions: Array<Record<string, unknown> & { missionId: string }>;
    journal: unknown[];
  };
  const ownerRaw = (missionId: string) => ({
    task_id: missionId,
    priority: 'P0',
    city_or_mode: '线上',
    institution: '测试机构',
    institution_type: '档案馆',
    target_person_event: '测试对象',
    archive_id_or_title: 'TEST-001',
    exact_request: '仅用于本机接口合同测试的精确请求',
    expected_output: '可读原页与上下文',
    precondition: '人工复核规则',
    status: '待发送',
    next_action: '准备人工提交',
    target_window: '条件满足后',
    evidence_scope: '正文原页',
    notes: '测试夹具，不构成历史事实',
  });
  return {
    _meta: {
      ...publicDataset._meta,
      schema_version: 'archive-missions-owner-v1',
      access_scope: 'owner_only_local_runtime',
      source_sha256: '0'.repeat(64),
      public_generation_id: publicDataset._meta.generation_id,
    },
    missions: publicDataset.missions.map((mission) => ({
      ...mission,
      ownerRaw: ownerRaw(mission.missionId),
    })),
    journal: publicDataset.journal,
  };
}

test('本地预览运行层只调用一次 fallback，并为响应设置本地安全头', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-shell-'),
  );
  let fallbackCalls = 0;

  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: async (
      _request: IncomingMessage,
      response: ServerResponse,
    ) => {
      fallbackCalls += 1;
      response.statusCode = 204;
      response.end();
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${port}/ordinary-page`);

    assert.equal(response.status, 204);
    assert.equal(fallbackCalls, 1);
    assert.equal(
      response.headers.get('cache-control'),
      'private, no-store, max-age=0, must-revalidate',
    );
    assert.equal(
      response.headers.get('x-robots-tag'),
      'noindex, nofollow, noarchive, nosnippet',
    );
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('cross-origin-opener-policy'), 'same-origin');
    assert.equal(response.headers.get('cross-origin-resource-policy'), 'same-origin');
    assert.match(response.headers.get('permissions-policy') ?? '', /payment=\(\)/);
    assert.match(response.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/);
    assert.match(response.headers.get('content-security-policy') ?? '', /connect-src 'self'/);
    assert.equal(response.headers.get('x-powered-by'), null);
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('访客统计与私密留言保持同源、清洗、哈希和 pending 合同', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-visitor-'),
  );
  const origin = `http://127.0.0.1:${port}`;
  const sessionId = '00000000-0000-4000-8000-000000000001';
  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: (_request, response) => {
      response.statusCode = 404;
      response.end('fallback');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const analyticsResponse = await fetch(`${origin}/api/local/analytics`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        event_name: 'page_view',
        path: '/privacy?secret=query',
        session_id: sessionId,
        properties: {
          section: 'contract',
          acquisition_channel: 'direct',
        },
      }),
    });
    assert.equal(analyticsResponse.status, 202);
    const analyticsLog = readFileSync(
      resolve(privateDataDirectory, 'analytics-events.ndjson'),
      'utf8',
    );
    assert(!analyticsLog.includes(sessionId));
    assert(!analyticsLog.includes('secret=query'));
    assert.match(analyticsLog, /"session_hash":"[0-9a-f]{24}"/);

    const invalidAnalyticsResponse = await fetch(
      `${origin}/api/local/analytics`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({
          event_name: 'page_view',
          path: '/',
          session_id: sessionId,
          properties: { forbidden: 'must-fail' },
        }),
      },
    );
    assert.equal(invalidAnalyticsResponse.status, 400);

    const foreignMessageResponse = await fetch(`${origin}/api/local/messages`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://example.com',
      },
      body: JSON.stringify({
        display_name: 'Reader',
        body: '这是一条用于测试的本机私密留言。',
        consent: true,
        session_id: sessionId,
      }),
    });
    assert.equal(foreignMessageResponse.status, 403);

    const honeypotResponse = await fetch(`${origin}/api/local/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        website: 'bot-filled-this',
        display_name: 'Reader',
        body: '这是一条不会写入的机器人留言。',
        consent: true,
        session_id: sessionId,
      }),
    });
    assert.equal(honeypotResponse.status, 202);
    assert.equal(
      existsSync(resolve(privateDataDirectory, 'guestbook-messages.ndjson')),
      false,
    );

    const messageResponse = await fetch(`${origin}/api/local/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        display_name: 'Reader',
        contact: 'private@example.invalid',
        body: '这是一条用于测试的本机私密留言。',
        website: '',
        consent: true,
        related_path: '/about?private=query',
        session_id: sessionId,
      }),
    });
    const messageResult = (await messageResponse.json()) as {
      status?: string;
    };
    assert.equal(messageResponse.status, 201);
    assert.equal(messageResult.status, 'pending');
    const messageLog = readFileSync(
      resolve(privateDataDirectory, 'guestbook-messages.ndjson'),
      'utf8',
    );
    assert(!messageLog.includes(sessionId));
    assert(!messageLog.includes('private=query'));
    assert.match(messageLog, /"status":"pending"/);
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('公开评论保持章节隔离、去重、链接限制、XSS 转义和先审后显', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-comments-'),
  );
  const origin = `http://127.0.0.1:${port}`;
  const payload = {
    chapter_id: 'hero-wuming-v0-3--chapter-01',
    display_name: '<img src=x onerror=alert(1)>',
    body: '<script>alert(1)</script>请勿执行',
    website: '',
    consent: true,
    session_id: '00000000-0000-4000-8000-000000000011',
  };
  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: (_request, response) => {
      response.statusCode = 404;
      response.end('fallback');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const submit = await fetch(`${origin}/api/local/novel-comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify(payload),
    });
    const submission = (await submit.json()) as { id: string; status: string };
    assert.equal(submit.status, 201);
    assert.equal(submission.status, 'pending');

    const pendingRead = await fetch(
      `${origin}/api/local/novel-comments?chapter=hero-wuming-v0-3--chapter-01`,
    );
    const pendingBody = (await pendingRead.json()) as { comments: unknown[] };
    assert.deepEqual(pendingBody.comments, []);

    const duplicate = await fetch(`${origin}/api/local/novel-comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify(payload),
    });
    assert.equal(duplicate.status, 409);

    const linkLimit = await fetch(`${origin}/api/local/novel-comments`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        ...payload,
        body: '两个链接：https://example.com 和 https://example.org',
        session_id: '00000000-0000-4000-8000-000000000012',
      }),
    });
    assert.equal(linkLimit.status, 400);

    appendFileSync(
      resolve(privateDataDirectory, 'chapter-comment-events.ndjson'),
      `${JSON.stringify({
        type: 'novel_comment_event',
        id: 'mod-1700000000000-0123456789',
        comment_id: submission.id,
        occurred_at: new Date().toISOString(),
        action: 'approved',
        moderator: 'local-admin',
      })}\n`,
      { mode: 0o600 },
    );
    const approvedRead = await fetch(
      `${origin}/api/local/novel-comments?chapter=hero-wuming-v0-3--chapter-01`,
    );
    const approvedBody = (await approvedRead.json()) as {
      comments: Array<{ display_name: string; body: string }>;
    };
    assert.equal(approvedBody.comments.length, 1);
    assert(!approvedBody.comments[0].body.includes('<script>'));
    assert(approvedBody.comments[0].body.includes('&lt;script&gt;'));
    assert(!approvedBody.comments[0].display_name.includes('<img'));

    const otherChapter = await fetch(
      `${origin}/api/local/novel-comments?chapter=hero-wuming-v0-3--chapter-02`,
    );
    const otherChapterBody = (await otherChapter.json()) as {
      comments: unknown[];
    };
    assert.deepEqual(otherChapterBody.comments, []);

    appendFileSync(
      resolve(privateDataDirectory, 'chapter-comment-events.ndjson'),
      'damaged moderation line\n',
    );
    const damagedRead = await fetch(
      `${origin}/api/local/novel-comments?chapter=hero-wuming-v0-3--chapter-01`,
    );
    assert.equal(damagedRead.status, 503);
    assert.deepEqual(await damagedRead.json(), {
      ok: false,
      error: 'comment_log_unhealthy',
      comments: [],
    });
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('站主接口保持令牌隔离、聚合隐私和语料命中裁剪', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-owner-'),
  );
  const origin = `http://127.0.0.1:${port}`;
  const absolutePrivatePath = ['', 'Users', 'private', 'secret.md'].join('/');
  writeFileSync(
    resolve(privateDataDirectory, 'local-corpus-index.json'),
    `${JSON.stringify({
      schema_version: 'handx-local-corpus-index-1.0',
      must_not_deploy: true,
      generated_at: '2026-07-29T00:00:00.000Z',
      documents: [
        {
          document_id: 'DOC-001',
          title: '允许返回的标题',
          suffix: '.md',
          material_class: 'research_note',
          access_tier: 'P1-owner-only',
          absolute_path: absolutePrivatePath,
          private_body: '绝不返回',
          matches: [{ entity_id: 'P-001', locators: ['L1'] }],
        },
        {
          document_id: 'DOC-002',
          title: '限制级材料',
          access_tier: 'P2-restricted',
          matches: [{ entity_id: 'P-001', locators: ['secret'] }],
        },
      ],
    })}\n`,
    { mode: 0o600 },
  );
  writeFileSync(
    resolve(privateDataDirectory, 'archive-missions-owner.json'),
    `${JSON.stringify(buildArchiveMissionOwnerFixture())}\n`,
    { mode: 0o600 },
  );
  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: (_request, response) => {
      response.statusCode = 404;
      response.end('fallback');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const messageResponse = await fetch(`${origin}/api/local/messages`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify({
        display_name: 'Reader',
        contact: 'private@example.invalid',
        body: '这是一条只应进入站主留言箱的私密内容。',
        website: '',
        consent: true,
        related_path: '/about',
        session_id: '00000000-0000-4000-8000-000000000021',
      }),
    });
    assert.equal(messageResponse.status, 201);

    const insights = await fetch(`${origin}/api/local/insights`);
    const insightsText = await insights.text();
    assert.equal(insights.status, 200);
    assert(!insightsText.includes('private@example.invalid'));
    assert(!insightsText.includes('只应进入站主留言箱'));
    assert(!insightsText.includes('recent_activity'));

    const unauthorizedInbox = await fetch(`${origin}/api/local/inbox`);
    assert.equal(unauthorizedInbox.status, 401);
    assert.equal(
      unauthorizedInbox.headers.get('www-authenticate'),
      'Bearer realm="local-inbox"',
    );

    const unauthorizedCorpus = await fetch(
      `${origin}/api/local/corpus-hits?entity=P-001`,
    );
    assert.equal(unauthorizedCorpus.status, 401);
    assert(!((await unauthorizedCorpus.text()).includes(absolutePrivatePath)));

    const unauthorizedMissions = await fetch(
      `${origin}/api/local/research-missions`,
    );
    assert.equal(unauthorizedMissions.status, 401);
    assert.equal(
      unauthorizedMissions.headers.get('www-authenticate'),
      'Bearer realm="local-research-missions"',
    );

    const adminToken = readFileSync(
      resolve(privateDataDirectory, 'admin-token'),
      'utf8',
    ).trim();
    const inbox = await fetch(`${origin}/api/local/inbox`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });
    const inboxText = await inbox.text();
    assert.equal(inbox.status, 200);
    assert(inboxText.includes('private@example.invalid'));
    assert(!inboxText.includes('session_hash'));

    const corpus = await fetch(
      `${origin}/api/local/corpus-hits?entity=P-001`,
      { headers: { authorization: `Bearer ${adminToken}` } },
    );
    const corpusText = await corpus.text();
    const corpusBody = JSON.parse(corpusText) as {
      hits: unknown[];
      omitted_restricted: number;
      creates_claims_or_edges: boolean;
    };
    assert.equal(corpus.status, 200);
    assert.equal(corpusBody.hits.length, 1);
    assert.equal(corpusBody.omitted_restricted, 1);
    assert.equal(corpusBody.creates_claims_or_edges, false);
    assert(!corpusText.includes(absolutePrivatePath));
    assert(!corpusText.includes('绝不返回'));

    const missionBaseline = await fetch(
      `${origin}/api/local/research-missions`,
      { headers: { authorization: `Bearer ${adminToken}` } },
    );
    const missionBaselineBody = await missionBaseline.json() as {
      baseline: { missions: unknown[] };
      event_writes_enabled: boolean;
      historical_claims_created: boolean;
    };
    assert.equal(missionBaseline.status, 200);
    assert.equal(missionBaselineBody.baseline.missions.length, 33);
    assert.equal(missionBaselineBody.event_writes_enabled, false);
    assert.equal(missionBaselineBody.historical_claims_created, false);

    const missionHead = await fetch(`${origin}/api/local/research-missions`, {
      method: 'HEAD',
      headers: { authorization: `Bearer ${adminToken}` },
    });
    assert.equal(missionHead.status, 200);
    assert.equal(await missionHead.text(), '');
    assert.equal(
      missionHead.headers.get('content-length'),
      missionBaseline.headers.get('content-length'),
    );

    const missionWriteAttempt = await fetch(`${origin}/api/local/research-missions`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${adminToken}`,
        'content-type': 'application/json',
        origin,
      },
      body: JSON.stringify({ missionId: 'T001', status: 'completed' }),
    });
    assert.equal(missionWriteAttempt.status, 405);
    assert.equal(missionWriteAttempt.headers.get('allow'), 'GET, HEAD');
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('史料行动基线对截断、未知字段、内嵌数据、超限与非普通文件失败关闭', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-mission-adversarial-'),
  );
  const origin = `http://127.0.0.1:${port}`;
  const ownerPath = resolve(privateDataDirectory, 'archive-missions-owner.json');
  const validFixture = buildArchiveMissionOwnerFixture();
  writeFileSync(ownerPath, `${JSON.stringify(validFixture)}\n`, { mode: 0o600 });
  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: (_request, response) => {
      response.statusCode = 404;
      response.end('fallback');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const adminToken = readFileSync(
      resolve(privateDataDirectory, 'admin-token'),
      'utf8',
    ).trim();
    const requestBaseline = () => fetch(`${origin}/api/local/research-missions`, {
      headers: { authorization: `Bearer ${adminToken}` },
    });

    assert.equal((await requestBaseline()).status, 200);

    writeFileSync(ownerPath, '{"_meta":', { mode: 0o600 });
    assert.equal((await requestBaseline()).status, 503);

    writeFileSync(
      ownerPath,
      `${JSON.stringify({ ...validFixture, unexpected: true })}\n`,
      { mode: 0o600 },
    );
    assert.equal((await requestBaseline()).status, 503);

    const dataUrlFixture = structuredClone(validFixture) as {
      missions: Array<{ ownerRaw: { notes: string } }>;
    };
    dataUrlFixture.missions[0].ownerRaw.notes = 'data:image/png;base64,AAAA';
    writeFileSync(ownerPath, `${JSON.stringify(dataUrlFixture)}\n`, { mode: 0o600 });
    assert.equal((await requestBaseline()).status, 503);

    writeFileSync(ownerPath, 'x'.repeat(2 * 1024 * 1024 + 1), { mode: 0o600 });
    assert.equal((await requestBaseline()).status, 503);

    rmSync(ownerPath);
    mkdirSync(ownerPath);
    assert.equal((await requestBaseline()).status, 503);

    rmSync(ownerPath, { recursive: true });
    const symlinkTarget = resolve(privateDataDirectory, 'owner-target.json');
    writeFileSync(symlinkTarget, `${JSON.stringify(validFixture)}\n`, { mode: 0o600 });
    symlinkSync(symlinkTarget, ownerPath);
    assert.equal((await requestBaseline()).status, 503);

    rmSync(ownerPath);
    writeFileSync(ownerPath, `${JSON.stringify(validFixture)}\n`, { mode: 0o600 });
    assert.equal((await requestBaseline()).status, 200);
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('本地预览运行层把意外错误转换成不泄漏细节的安全响应', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-error-'),
  );

  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: async () => {
      throw new Error('synthetic fallback failure');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${port}/broken-page`);
    const body = await response.text();

    assert.equal(response.status, 500);
    assert.equal(body, 'Internal server error');
    assert(!body.includes('synthetic fallback failure'));
    assert.equal(
      response.headers.get('cache-control'),
      'private, no-store, max-age=0, must-revalidate',
    );
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('四个研究投影以固定字节、代次与摘要头响应 GET 和 HEAD', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-projections-'),
  );
  const researchBytes = readFileSync(resolve(projectRoot, 'src/data/research.json'));
  const research = JSON.parse(researchBytes.toString('utf8')) as {
    _meta: { generation_id: string };
  };
  let fallbackCalls = 0;
  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: (_request, response) => {
      fallbackCalls += 1;
      response.statusCode = 418;
      response.end('fallback');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    for (const pathname of projectionPaths) {
      const expected = readFileSync(resolve(projectRoot, 'public', pathname.slice(1)));
      const getResponse = await fetch(`http://127.0.0.1:${port}${pathname}`);
      const getBody = Buffer.from(await getResponse.arrayBuffer());
      const headResponse = await fetch(`http://127.0.0.1:${port}${pathname}`, {
        method: 'HEAD',
      });

      assert.equal(getResponse.status, 200);
      assert.deepEqual(getBody, expected);
      assert.equal(headResponse.status, getResponse.status);
      assert.equal(await headResponse.text(), '');
      assert.equal(getResponse.headers.get('content-length'), String(expected.length));
      assert.equal(headResponse.headers.get('content-length'), String(expected.length));
      assert.equal(
        getResponse.headers.get('x-su-kaiyuan-generation'),
        research._meta.generation_id,
      );
      assert.equal(
        getResponse.headers.get('x-su-kaiyuan-research-sha256'),
        createHash('sha256').update(researchBytes).digest('hex'),
      );
    }
    assert.equal(fallbackCalls, 0);
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('研究投影的非 GET/HEAD 方法继续准确交给 fallback', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-projection-fallback-'),
  );
  let fallbackCalls = 0;
  const listener = createLocalPreviewRuntime({
    projectRoot,
    privateDataDirectory,
    bind: { hostname: '127.0.0.1', port },
    deploymentEnvironment: undefined,
    fallback: (_request, response) => {
      fallbackCalls += 1;
      response.statusCode = 405;
      response.end('fallback');
    },
  });
  const server = createServer(listener);

  try {
    server.listen(port, '127.0.0.1');
    await once(server, 'listening');
    const response = await fetch(`http://127.0.0.1:${port}/data/persons.json`, {
      method: 'POST',
    });
    assert.equal(response.status, 405);
    assert.equal(await response.text(), 'fallback');
    assert.equal(fallbackCalls, 1);
  } finally {
    await closeServer(server);
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('运行层拒绝非回环绑定与生产部署环境', async () => {
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-startup-gates-'),
  );
  try {
    assert.throws(
      () =>
        createLocalPreviewRuntime({
          projectRoot,
          privateDataDirectory,
          bind: { hostname: '0.0.0.0', port: 5000 },
          deploymentEnvironment: undefined,
          fallback: () => undefined,
        }),
      /non-loopback host/,
    );
    assert.throws(
      () =>
        createLocalPreviewRuntime({
          projectRoot,
          privateDataDirectory,
          bind: { hostname: '127.0.0.1', port: 5000 },
          deploymentEnvironment: 'PROD',
          fallback: () => undefined,
        }),
      /deploymentEnvironment=PROD/,
    );
  } finally {
    rmSync(privateDataDirectory, { recursive: true, force: true });
  }
});

test('运行层拒绝开放发布门禁、混合代次与编译/运行不一致', async () => {
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-snapshot-gates-'),
  );
  const createFromFixture = (fixtureRoot: string) =>
    createLocalPreviewRuntime({
      projectRoot: fixtureRoot,
      privateDataDirectory,
      bind: { hostname: '127.0.0.1', port: 5000 },
      deploymentEnvironment: undefined,
      fallback: () => undefined,
    });

  const openGateRoot = copyPreviewProjectionFixture();
  const mixedGenerationRoot = copyPreviewProjectionFixture();
  const compiledMismatchRoot = copyPreviewProjectionFixture();
  try {
    mutateJson(resolve(openGateRoot, 'src/data/research.json'), value => {
      (value._meta as Record<string, unknown>).must_not_deploy = false;
    });
    assert.throws(() => createFromFixture(openGateRoot), /invalid local-preview gate/);

    mutateJson(resolve(mixedGenerationRoot, 'public/data/persons.json'), value => {
      (value._meta as Record<string, unknown>).generation_id =
        `gen-${'0'.repeat(64)}`;
    });
    assert.throws(() => createFromFixture(mixedGenerationRoot), /metadata differs/);

    mutateJson(resolve(compiledMismatchRoot, 'src/data/research.json'), value => {
      value._test_only_compiled_mismatch = true;
    });
    assert.throws(
      () => createFromFixture(compiledMismatchRoot),
      /differs from the research commit marker/,
    );
  } finally {
    rmSync(privateDataDirectory, { recursive: true, force: true });
    rmSync(openGateRoot, { recursive: true, force: true });
    rmSync(mixedGenerationRoot, { recursive: true, force: true });
    rmSync(compiledMismatchRoot, { recursive: true, force: true });
  }
});

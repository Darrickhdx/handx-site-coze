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
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
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

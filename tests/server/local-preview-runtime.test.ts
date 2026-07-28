import assert from 'node:assert/strict';
import { once } from 'node:events';
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { createLocalPreviewRuntime } from '../../src/server/local-preview-runtime';

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

test('本地预览运行层只调用一次 fallback，并为响应设置本地安全头', async () => {
  const port = await reserveLoopbackPort();
  const privateDataDirectory = mkdtempSync(
    resolve(tmpdir(), 'handx-local-runtime-shell-'),
  );
  let fallbackCalls = 0;

  const listener = createLocalPreviewRuntime({
    projectRoot: process.cwd(),
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
    projectRoot: process.cwd(),
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

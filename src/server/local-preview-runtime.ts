import { createHash } from 'node:crypto';
import {
  closeSync,
  constants,
  fstatSync,
  openSync,
  readFileSync,
} from 'node:fs';
import type {
  IncomingMessage,
  RequestListener,
  ServerResponse,
} from 'node:http';
import { resolve } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import research from '../data/research.json';

type JsonObject = Record<string, unknown>;

export type FallbackRequestHandler = (
  request: IncomingMessage,
  response: ServerResponse,
) => void | Promise<void>;

export interface LocalPreviewRuntimeOptions {
  readonly projectRoot: string;
  readonly privateDataDirectory: string;
  readonly bind: Readonly<{
    hostname: string;
    port: number;
  }>;
  readonly deploymentEnvironment?: string;
  readonly fallback: FallbackRequestHandler;
}

interface RuntimePreviewSnapshot {
  readonly endpoints: ReadonlyMap<string, Buffer>;
  readonly generationId: string;
  readonly researchSha256: string;
}

const loopbackHosts = new Set(['127.0.0.1', 'localhost', '::1']);
const strictGenerationId = /^gen-[0-9a-f]{64}$/;
const strictSha256 = /^[0-9a-f]{64}$/;
const localOnlyHeaders = {
  'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
};

export function createLocalPreviewRuntime(
  options: Readonly<LocalPreviewRuntimeOptions>,
): RequestListener {
  requireLocalPreviewStartup(options);
  const snapshot = loadRuntimePreviewSnapshot(options.projectRoot);
  return (request, response) => {
    void handleRequest(options, snapshot, request, response);
  };
}

async function handleRequest(
  options: Readonly<LocalPreviewRuntimeOptions>,
  snapshot: Readonly<RuntimePreviewSnapshot>,
  request: IncomingMessage,
  response: ServerResponse,
): Promise<void> {
  for (const [name, value] of Object.entries(localOnlyHeaders)) {
    response.setHeader(name, value);
  }

  try {
    const hostname =
      options.bind.hostname === '::1'
        ? `[${options.bind.hostname}]`
        : options.bind.hostname;
    const pathname = new URL(
      request.url ?? '/',
      `http://${hostname}:${options.bind.port}`,
    ).pathname;
    const endpoint = snapshot.endpoints.get(pathname);
    if (
      endpoint !== undefined &&
      (request.method === 'GET' || request.method === 'HEAD')
    ) {
      response.statusCode = 200;
      response.setHeader('Content-Type', 'application/json; charset=utf-8');
      response.setHeader('Content-Length', String(endpoint.length));
      response.setHeader('X-Su-Kaiyuan-Generation', snapshot.generationId);
      response.setHeader(
        'X-Su-Kaiyuan-Research-SHA256',
        snapshot.researchSha256,
      );
      response.end(request.method === 'HEAD' ? undefined : endpoint);
      return;
    }
    await options.fallback(request, response);
  } catch (error) {
    console.error('Error occurred handling', request.url, error);
    if (response.headersSent) {
      response.destroy();
      return;
    }
    response.statusCode = 500;
    response.end('Internal server error');
  }
}

function requireLocalPreviewStartup(
  options: Readonly<LocalPreviewRuntimeOptions>,
): void {
  if (!loopbackHosts.has(options.bind.hostname)) {
    throw new Error(
      `Local preview refuses non-loopback host: ${options.bind.hostname}`,
    );
  }
  if (options.deploymentEnvironment?.toUpperCase() === 'PROD') {
    throw new Error('Local preview refuses deploymentEnvironment=PROD');
  }
}

function requireObject(name: string, value: unknown): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} is not a JSON object`);
  }
  return value as JsonObject;
}

function requireArray(name: string, value: unknown): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${name} is not a JSON array`);
  return value;
}

function requireClosedGate(name: string, meta: JsonObject): void {
  const failures: string[] = [];
  if (meta.publication_layer !== 'previewable') {
    failures.push('publication_layer');
  }
  if (meta.preview_approved !== true) failures.push('preview_approved');
  if (meta.deployment_authorized !== false) {
    failures.push('deployment_authorized');
  }
  if (meta.must_not_deploy !== true) failures.push('must_not_deploy');
  if (meta.schema_version !== 'sukaiyuan-site-preview-1.1') {
    failures.push('schema_version');
  }
  if (meta.exporter_version !== '1.3.6') failures.push('exporter_version');
  if (!String(meta.approval_scope ?? '').includes('v7r4_safe_subset')) {
    failures.push('approval_scope');
  }
  if (!strictGenerationId.test(String(meta.generation_id ?? ''))) {
    failures.push('generation_id');
  }
  if (!strictSha256.test(String(meta.generation_manifest_sha256 ?? ''))) {
    failures.push('generation_manifest_sha256');
  }
  if (failures.length > 0) {
    throw new Error(
      `${name} has an invalid local-preview gate: ${failures.join(', ')}`,
    );
  }
}

function readRegularOnce(path: string): Buffer {
  const descriptor = openSync(
    path,
    constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0),
  );
  try {
    const before = fstatSync(descriptor, { bigint: true });
    if (!before.isFile()) throw new Error(`${path} is not an ordinary file`);
    const payload = readFileSync(descriptor);
    const after = fstatSync(descriptor, { bigint: true });
    const stableFields = [
      'dev',
      'ino',
      'mode',
      'size',
      'mtimeNs',
      'ctimeNs',
    ] as const;
    if (stableFields.some(field => before[field] !== after[field])) {
      throw new Error(`${path} changed while being read`);
    }
    if (BigInt(payload.length) !== after.size) {
      throw new Error(`${path} byte count changed while being read`);
    }
    return payload;
  } finally {
    closeSync(descriptor);
  }
}

function parseJsonObject(name: string, payload: Buffer): JsonObject {
  let parsed: unknown;
  try {
    parsed = JSON.parse(payload.toString('utf8')) as unknown;
  } catch (error: unknown) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`${name} is not valid JSON: ${reason}`);
  }
  return requireObject(name, parsed);
}

function requireExact(name: string, actual: unknown, expected: unknown): void {
  if (!isDeepStrictEqual(actual, expected)) {
    throw new Error(`${name} differs from the research commit marker`);
  }
}

function loadRuntimePreviewSnapshot(
  projectRoot: string,
): RuntimePreviewSnapshot {
  const paths = {
    research: resolve(projectRoot, 'src', 'data', 'research.json'),
    persons: resolve(projectRoot, 'public', 'data', 'persons.json'),
    events: resolve(projectRoot, 'public', 'data', 'events.json'),
    timeline: resolve(projectRoot, 'public', 'data', 'timeline.json'),
    sources: resolve(projectRoot, 'public', 'data', 'sources.json'),
  };

  const researchBefore = readRegularOnce(paths.research);
  const endpointFiles = {
    '/data/persons.json': readRegularOnce(paths.persons),
    '/data/events.json': readRegularOnce(paths.events),
    '/data/timeline.json': readRegularOnce(paths.timeline),
    '/data/sources.json': readRegularOnce(paths.sources),
  };
  const researchAfter = readRegularOnce(paths.research);
  if (!researchBefore.equals(researchAfter)) {
    throw new Error(
      'research commit marker changed while reading the endpoint set',
    );
  }

  const runtimeResearch = parseJsonObject(
    'runtime research.json',
    researchAfter,
  );
  const embeddedResearch = requireObject(
    'compiled research.json',
    research as unknown,
  );
  const runtimeMeta = requireObject(
    'runtime research metadata',
    runtimeResearch._meta,
  );
  requireClosedGate('runtime research.json', runtimeMeta);
  requireExact('compiled preview data', embeddedResearch, runtimeResearch);

  const parsedEndpoints = {
    persons: parseJsonObject(
      'runtime persons.json',
      endpointFiles['/data/persons.json'],
    ),
    events: parseJsonObject(
      'runtime events.json',
      endpointFiles['/data/events.json'],
    ),
    timeline: parseJsonObject(
      'runtime timeline.json',
      endpointFiles['/data/timeline.json'],
    ),
    sources: parseJsonObject(
      'runtime sources.json',
      endpointFiles['/data/sources.json'],
    ),
  };
  for (const [name, payload] of Object.entries(parsedEndpoints)) {
    const meta = requireObject(`${name}.json metadata`, payload._meta);
    requireClosedGate(`${name}.json`, meta);
    requireExact(`${name}.json metadata`, meta, runtimeMeta);
  }

  const nodes = requireArray('runtime research nodes', runtimeResearch.nodes);
  const persons = nodes.filter(
    node => requireObject('runtime research node', node).entity_type === 'Person',
  );
  const events = requireArray(
    'runtime research events',
    runtimeResearch.events,
  );
  const sources = requireArray(
    'runtime research sources',
    runtimeResearch.sources,
  );
  requireExact(
    'persons.json projection',
    requireArray('persons.json persons', parsedEndpoints.persons.persons),
    persons,
  );
  requireExact(
    'events.json projection',
    requireArray('events.json events', parsedEndpoints.events.events),
    events,
  );
  requireExact(
    'timeline.json projection',
    requireArray('timeline.json timeline', parsedEndpoints.timeline.timeline),
    events,
  );
  requireExact(
    'sources.json projection',
    requireArray('sources.json sources', parsedEndpoints.sources.sources),
    sources,
  );

  return {
    endpoints: new Map(Object.entries(endpointFiles)),
    generationId: String(runtimeMeta.generation_id),
    researchSha256: createHash('sha256').update(researchAfter).digest('hex'),
  };
}

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';

const root = resolve(process.cwd());

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function read(relativePath: string): string {
  return readFileSync(resolve(root, relativePath), 'utf8');
}

function sourceFiles(directory: string): string[] {
  return readdirSync(resolve(root, directory), {
    recursive: true,
    withFileTypes: true,
  })
    .filter((entry) => entry.isFile() && ['.ts', '.tsx', '.js', '.mjs'].includes(extname(entry.name)))
    .map((entry) => resolve(entry.parentPath, entry.name));
}

const nextConfig = read('next.config.ts');
const runtime = read('src/server/local-preview-runtime.ts');
const interactions = read('src/server/local-interactions.ts');
const startScript = read('scripts/start.sh');
const devScript = read('scripts/dev.sh');

invariant(nextConfig.includes('poweredByHeader: false'), 'Next.js must remove X-Powered-By');
invariant(!nextConfig.includes('remotePatterns'), 'remote image patterns must remain disabled');
invariant(!nextConfig.includes('allowedDevOrigins'), 'external development origins must remain disabled');

const requiredHeaderMarkers = [
  "default-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "connect-src 'self'",
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Cross-Origin-Opener-Policy',
  'Cross-Origin-Resource-Policy',
];
for (const marker of requiredHeaderMarkers) {
  invariant(nextConfig.includes(marker), `Next.js security header contract is missing ${marker}`);
  invariant(runtime.includes(marker), `runtime security header contract is missing ${marker}`);
}

for (const marker of [
  'constants.O_NOFOLLOW',
  'isSymbolicLink()',
  'private_json_too_large',
  'private_json_changed_while_reading',
  'hasExactKeys',
  'data:[a-z0-9.+-]+\\/[a-z0-9.+-]+;base64,',
]) {
  invariant(interactions.includes(marker), `private JSON fail-closed contract is missing ${marker}`);
}

invariant(
  startScript.includes('HOSTNAME=127.0.0.1') && startScript.includes('COZE_PROJECT_ENV'),
  'start script must force loopback and reject production deployment',
);
for (const startupVerifier of [
  'build-rights-passports.ts --check',
  'verify-rights-passports.ts',
  'verify-topics-media.ts',
  'verify-site-status.ts',
  'verify-security-boundaries.ts',
]) {
  invariant(
    startScript.includes(startupVerifier),
    `start script must fail closed on ${startupVerifier}`,
  );
}
invariant(
  devScript.includes('HOSTNAME=127.0.0.1') && devScript.includes('COZE_PROJECT_ENV'),
  'development script must force loopback and reject production deployment',
);
invariant(
  !/kill\s+(?:-[0-9]+\s+)?|xargs[^\n]*kill/iu.test(devScript),
  'development script must not terminate an unrelated process that owns the port',
);

const sources = sourceFiles('src');
const externalFetches: string[] = [];
const remoteImageSources: string[] = [];
const fileInputs: string[] = [];
const iframes: string[] = [];
for (const path of sources) {
  const text = readFileSync(path, 'utf8');
  if (/\b(?:fetch|sendBeacon|XMLHttpRequest|WebSocket|EventSource)\s*\(\s*["'`]https?:\/\//iu.test(text)) {
    externalFetches.push(path);
  }
  if (/\bsrc\s*=\s*\{?\s*["'`]https?:\/\//iu.test(text)) remoteImageSources.push(path);
  if (/type\s*=\s*["']file["']/iu.test(text)) fileInputs.push(path);
  if (/<iframe\b/iu.test(text)) iframes.push(path);
}
// ADR 0001 routes every local interaction through one Node request handler that
// composes the Next.js fallback internally, so a caller cannot skip the security
// headers or the route ordering. A Next.js route handler under src/app/api would
// bypass that handler entirely. The property was previously only a convention;
// this makes it fail the build. Public-edition API routes live in src/app-public
// and are staged into a separate tree, so they never appear here.
invariant(
  !existsSync(resolve(root, 'src/app/api')),
  'workbench edition must contain zero Next.js API routes; local interactions belong in src/server/local-interactions.ts (docs/adr/0001)',
);

invariant(externalFetches.length === 0, `source contains external network calls: ${externalFetches.join(', ')}`);
invariant(remoteImageSources.length === 0, `source contains remote image URLs: ${remoteImageSources.join(', ')}`);
invariant(fileInputs.length === 0, `source contains file upload controls: ${fileInputs.join(', ')}`);
invariant(iframes.length === 0, `source contains iframe surfaces: ${iframes.join(', ')}`);

console.log(JSON.stringify({
  status: 'PASS',
  remote_image_allowlist: 'none',
  external_programmatic_egress: 'none',
  file_upload_controls: 0,
  iframe_surfaces: 0,
  security_headers: requiredHeaderMarkers.length,
  loopback_entrypoints: 2,
  destructive_port_cleanup: false,
  private_json_fail_closed: true,
  workbench_next_api_routes: 0,
}, null, 2));

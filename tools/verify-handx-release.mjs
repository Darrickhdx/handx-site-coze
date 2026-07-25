#!/usr/bin/env node

import { createHash } from 'node:crypto';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const projectRoot = resolve(import.meta.dirname, '..');
const forbiddenPrefixes = [
  'private-runtime/',
  'media-exports/',
  'public/media-exports/',
  '.openai/hosting.json',
  '.env',
];
const forbiddenExtensions = new Set([
  '.doc',
  '.docx',
  '.pdf',
  '.p12',
  '.pfx',
  '.pem',
  '.key',
]);
const forbiddenExactPaths = new Set(
  [6, 14, 22, 28, 47, 116, 177].flatMap((page) => {
    const suffix = String(page).padStart(3, '0');
    return [
      `public/novel/hero-wuming/pages/page-${suffix}.webp`,
      `public/novel/hero-wuming/pages-responsive/page-${suffix}.webp`,
    ];
  }),
);
const textExtensions = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.jsx',
  '.md',
  '.mjs',
  '.py',
  '.sh',
  '.ts',
  '.tsx',
  '.txt',
  '.yml',
  '.yaml',
]);
const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /sk-[A-Za-z0-9_-]{20,}/,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/,
  /(?:appsecret|api[_-]?key|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*["'][^"'${}\s]{8,}["']/i,
];
const absoluteHomeMarker = ['/', 'Users', '/'].join('');
const novelManifestPath = join(
  projectRoot,
  'public',
  'novel',
  'hero-wuming',
  'novel-manifest.json',
);

function fail(message) {
  throw new Error(message);
}

function walk(path) {
  const results = [];
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const fullPath = join(path, entry.name);
    const relPath = relative(projectRoot, fullPath).replaceAll('\\', '/');
    if (
      relPath === '.git'
      || relPath.startsWith('.git/')
      || relPath === 'node_modules'
      || relPath.startsWith('node_modules/')
      || relPath === '.next'
      || relPath.startsWith('.next/')
      || relPath === 'dist'
      || relPath.startsWith('dist/')
      || relPath === 'private-runtime'
      || relPath.startsWith('private-runtime/')
    ) {
      continue;
    }
    if (entry.isDirectory()) results.push(...walk(fullPath));
    else if (entry.isFile()) results.push(relPath);
  }
  return results;
}

const packageJson = JSON.parse(readFileSync(join(projectRoot, 'package.json'), 'utf8'));
if (packageJson.name !== 'handx-web') fail('package name must be handx-web');
if (packageJson.version !== '0.1.0') fail('package version must be 0.1.0');
if (packageJson.private !== true) fail('package must remain private');
if (existsSync(join(projectRoot, '.openai', 'hosting.json'))) {
  fail('.openai/hosting.json is forbidden in the local-review release');
}

const novelManifest = JSON.parse(readFileSync(novelManifestPath, 'utf8'));
const restrictedNovelRows = novelManifest.pages.filter(
  (page) => page.local_only === true,
);
if (
  restrictedNovelRows.length !== 7
  || restrictedNovelRows.some(
    (page) =>
      page.git_eligible !== false
      || page.not_for_media !== true
      || page.rights_status !== 'local_only_third_party_review',
  )
) {
  fail('local-only novel release flags are malformed');
}
const restrictedNovelHashes = new Set(
  restrictedNovelRows.flatMap((page) => [page.sha256, page.responsive_sha256]),
);
if (
  restrictedNovelHashes.size !== 14
  || [...restrictedNovelHashes].some(
    (value) => !/^[0-9a-f]{64}$/u.test(value),
  )
) {
  fail('local-only novel fingerprints are malformed');
}

const gitProbe = spawnSync('git', ['-C', projectRoot, 'rev-parse', '--show-toplevel'], {
  encoding: 'utf8',
});
const isGitRepository =
  gitProbe.status === 0 && resolve(gitProbe.stdout.trim()) === projectRoot;
const gitFileProbe = isGitRepository
  ? spawnSync(
      'git',
      [
        '-C',
        projectRoot,
        'ls-files',
        '-z',
        '--cached',
        '--others',
        '--exclude-standard',
      ],
      { encoding: 'utf8' },
    )
  : null;
if (gitFileProbe && gitFileProbe.status !== 0) {
  fail(`unable to enumerate Git release candidates: ${gitFileProbe.stderr.trim()}`);
}
const candidateFiles = gitFileProbe
  ? [...new Set(gitFileProbe.stdout.split('\0').filter(Boolean))]
  : walk(projectRoot);

for (const file of candidateFiles) {
  const normalized = file.replaceAll('\\', '/');
  if (forbiddenPrefixes.some((prefix) => normalized === prefix || normalized.startsWith(prefix))) {
    fail(`forbidden release path: ${normalized}`);
  }
  if (isGitRepository && forbiddenExactPaths.has(normalized)) {
    fail(`local-only novel page in release: ${normalized}`);
  }
  if (forbiddenExtensions.has(extname(normalized).toLowerCase())) {
    fail(`forbidden source document in release: ${normalized}`);
  }
  const absolutePath = join(projectRoot, normalized);
  if (!existsSync(absolutePath)) continue;
  const bytes = statSync(absolutePath).size;
  if (bytes >= 100 * 1024 * 1024) fail(`file exceeds GitHub hard limit: ${normalized}`);
  if (isGitRepository) {
    const fingerprint = createHash('sha256')
      .update(readFileSync(absolutePath))
      .digest('hex');
    if (restrictedNovelHashes.has(fingerprint)) {
      fail(`local-only novel fingerprint in release: ${normalized}`);
    }
  }
  if (!textExtensions.has(extname(normalized).toLowerCase()) || bytes > 2 * 1024 * 1024) continue;
  const content = readFileSync(absolutePath, 'utf8');
  if (content.includes(absoluteHomeMarker) && normalized !== 'README.md') {
    fail(`absolute local path found in release text: ${normalized}`);
  }
  if (secretPatterns.some((pattern) => pattern.test(content))) {
    fail(`possible credential material found in release text: ${normalized}`);
  }
}

console.log(
  `PASS: Handx web0.1 release boundary checked across ${candidateFiles.length} file(s); `
  + 'local-only and private-repository gates remain closed',
);

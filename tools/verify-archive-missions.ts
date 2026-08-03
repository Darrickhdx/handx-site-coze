import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const PROJECT_ROOT = resolve(process.cwd());
const SOURCE_FILENAME = '39-博物馆档案馆实地调研行动清单-2026-07-28.csv';
const SOURCE_PATH = process.env.ARCHIVE_MISSIONS_SOURCE
  ? resolve(process.env.ARCHIVE_MISSIONS_SOURCE)
  : resolve(PROJECT_ROOT, '..', '..', '..', 'AI小说', '苏开元重启', SOURCE_FILENAME);
const AUDIT_GRAPH_PATH = process.env.ARCHIVE_MISSIONS_AUDIT_GRAPH
  ? resolve(process.env.ARCHIVE_MISSIONS_AUDIT_GRAPH)
  : resolve(PROJECT_ROOT, 'public', 'data', 'graph', 'audit-graph.json');
const SOURCE_SHA256 = '17003ece343e5768c9f09e5f7d0d94bfd5c8e06860af1410f2ef638608502b6c';
const AUDIT_GRAPH_SHA256 = 'ca0325a38ea803e42985026c4552e061584f760457dfd56f84c9ac2b729c870c';

type JsonObject = Record<string, unknown>;

const PUBLIC_TOP_LEVEL_FIELDS = new Set(['_meta', 'missions', 'journal']);
const PUBLIC_META_FIELDS = new Set([
  'schema_version',
  'generator_version',
  'source_updated_at',
  'generated_at',
  'generation_id',
  'must_not_deploy',
  'deployment_authorized',
  'evidence_boundary',
  'lead_intake_status',
  'counts',
]);
const COUNT_FIELDS = new Set([
  'missions',
  'priorities',
  'baselineStatuses',
  'institutions',
  'highlighted',
  'completed',
]);
const PRIORITY_COUNT_FIELDS = new Set(['P0', 'P1', 'P2']);
const STATUS_COUNT_FIELDS = new Set(['待发送', '待预约', '待函询', '待委托', '条件启动']);
const PUBLIC_MISSION_FIELDS = new Set([
  'missionId',
  'canonicalId',
  'taskKind',
  'executionPriority',
  'status',
  'modeLabel',
  'institution',
  'institutionType',
  'topic',
  'people',
  'researchQuestion',
  'catalogReference',
  'completionStandard',
  'publicNextStep',
  'evidenceScope',
  'boundary',
  'highlighted',
  'targets',
]);
const STATUS_FIELDS = new Set([
  'workflowState',
  'nextActionType',
  'baselineLabel',
  'publicLabel',
  'verifiedAt',
  'completed',
]);
const TARGET_FIELDS = new Set([
  'targetId',
  'relation',
  'institution',
  'catalogReference',
  'locatorAliases',
  'workFamilyKey',
]);
const FORBIDDEN_PUBLIC_FIELDS = [
  'exact_request',
  'precondition',
  'next_action',
  'notes',
  'target_window',
  'ownerRaw',
  'claimIds',
  'sourceIds',
  'entityIds',
  'claim_id',
  'source_id',
  'entity_id',
  'claim',
  'source',
  'entity',
];
const RAW_HEADERS = [
  'task_id',
  'priority',
  'city_or_mode',
  'institution',
  'institution_type',
  'target_person_event',
  'archive_id_or_title',
  'exact_request',
  'expected_output',
  'precondition',
  'status',
  'next_action',
  'target_window',
  'evidence_scope',
  'notes',
];

function fail(message: string): never {
  throw new Error(message);
}

function sha256(payload: Buffer | string): string {
  return createHash('sha256').update(payload).digest('hex');
}

function object(value: unknown, label: string): JsonObject {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    fail(`${label} is not an object`);
  }
  return value as JsonObject;
}

function array(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) fail(`${label} is not an array`);
  return value;
}

function exactKeys(value: JsonObject, allowed: Set<string>, label: string): void {
  const keys = Object.keys(value);
  const extras = keys.filter((key) => !allowed.has(key));
  const missing = [...allowed].filter((key) => !keys.includes(key));
  if (extras.length || missing.length) {
    fail(`${label} field contract drifted; extra=${extras.join(',')} missing=${missing.join(',')}`);
  }
}

function parseCsv(payload: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let index = 0; index < payload.length; index += 1) {
    const character = payload[index];
    if (quoted) {
      if (character === '"') {
        if (payload[index + 1] === '"') {
          field += '"';
          index += 1;
        } else quoted = false;
      } else field += character;
      continue;
    }
    if (character === '"') quoted = true;
    else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = '';
    } else field += character;
  }
  if (quoted) fail('source CSV has an unterminated quote');
  if (field || row.length > 0) {
    row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some(Boolean));
}

function json(path: string): { bytes: Buffer; value: JsonObject } {
  const bytes = readFileSync(path);
  return { bytes, value: object(JSON.parse(bytes.toString('utf8')) as unknown, path) };
}

function noPaths(payload: Buffer, label: string): void {
  const text = payload.toString('utf8');
  if (/\/Users\/|file:\/\/|(?:^|["'])\.\.\//m.test(text)) fail(`${label} leaks a local path`);
}

function main(): void {
  const sourceBytes = readFileSync(SOURCE_PATH);
  const graphBytes = readFileSync(AUDIT_GRAPH_PATH);
  if (sha256(sourceBytes) !== SOURCE_SHA256) fail('source CSV freshness check failed');
  if (sha256(graphBytes) !== AUDIT_GRAPH_SHA256) fail('audit graph changed');

  const srcPublic = json(resolve(PROJECT_ROOT, 'src', 'data', 'archive-missions.json'));
  const browserPublic = json(resolve(PROJECT_ROOT, 'public', 'data', 'archive-missions.json'));
  const ownerPath = resolve(PROJECT_ROOT, 'private-runtime', 'archive-missions-owner.json');
  const owner = json(ownerPath);
  const manifest = json(resolve(PROJECT_ROOT, 'src', 'data', 'archive-missions-manifest.json'));
  if (!srcPublic.bytes.equals(browserPublic.bytes)) fail('public archive mission files differ byte-for-byte');
  [srcPublic, browserPublic, owner, manifest].forEach((payload, index) =>
    noPaths(payload.bytes, ['src public', 'browser public', 'owner', 'manifest'][index]));

  exactKeys(srcPublic.value, PUBLIC_TOP_LEVEL_FIELDS, 'public top level');
  const meta = object(srcPublic.value._meta, 'public metadata');
  exactKeys(meta, PUBLIC_META_FIELDS, 'public metadata');
  if (
    meta.schema_version !== 'archive-missions-public-v1'
    || meta.generator_version !== '1.0.0'
    || meta.source_updated_at !== '2026-07-28'
    || meta.generated_at !== '2026-08-04T00:00:00+08:00'
    || meta.must_not_deploy !== true
    || meta.deployment_authorized !== false
    || meta.evidence_boundary !== 'execution_progress_not_historical_completion'
    || meta.lead_intake_status !== 'browser_draft_only_no_submission_endpoint'
  ) fail('public archive mission metadata contract drifted');

  const counts = object(meta.counts, 'public counts');
  exactKeys(counts, COUNT_FIELDS, 'public counts');
  const priorities = object(counts.priorities, 'priority counts');
  const statuses = object(counts.baselineStatuses, 'status counts');
  exactKeys(priorities, PRIORITY_COUNT_FIELDS, 'priority counts');
  exactKeys(statuses, STATUS_COUNT_FIELDS, 'status counts');
  if (
    counts.missions !== 33
    || priorities.P0 !== 15
    || priorities.P1 !== 9
    || priorities.P2 !== 9
    || statuses['待发送'] !== 16
    || statuses['待预约'] !== 5
    || statuses['待函询'] !== 3
    || statuses['待委托'] !== 1
    || statuses['条件启动'] !== 8
    || counts.institutions !== 19
    || counts.highlighted !== 7
    || counts.completed !== 0
  ) fail('archive mission counts drifted');

  const missions = array(srcPublic.value.missions, 'public missions').map((value, index) => {
    const mission = object(value, `mission ${index}`);
    exactKeys(mission, PUBLIC_MISSION_FIELDS, `mission ${mission.missionId ?? index}`);
    const status = object(mission.status, `${mission.missionId} status`);
    exactKeys(status, STATUS_FIELDS, `${mission.missionId} status`);
    if (
      !['planned', 'blocked'].includes(String(status.workflowState))
      || status.verifiedAt !== null
      || status.completed !== false
    ) fail(`${mission.missionId}: mission is not pre-execution`);
    if (!String(mission.boundary).includes('不得') && !String(mission.boundary).includes('不生成')) {
      fail(`${mission.missionId}: evidence boundary is not explicit`);
    }
    array(mission.targets, `${mission.missionId} targets`).forEach((value, targetIndex) => {
      exactKeys(object(value, `${mission.missionId} target ${targetIndex}`), TARGET_FIELDS, `${mission.missionId} target ${targetIndex}`);
    });
    return mission;
  });
  if (missions.length !== 33 || new Set(missions.map((mission) => mission.missionId)).size !== 33) {
    fail('public missions are missing or duplicated');
  }
  const publicText = srcPublic.bytes.toString('utf8');
  for (const field of FORBIDDEN_PUBLIC_FIELDS) {
    if (new RegExp(`"${field}"\\s*:`).test(publicText)) fail(`public projection leaks ${field}`);
  }

  const csv = parseCsv(sourceBytes.toString('utf8'));
  const headers = csv.shift();
  if (JSON.stringify(headers) !== JSON.stringify(RAW_HEADERS)) fail('source headers drifted');
  const rawRows = csv.map((values) => Object.fromEntries(RAW_HEADERS.map((header, index) => [header, values[index].trim()])));
  for (const raw of rawRows) {
    for (const field of ['exact_request', 'precondition', 'next_action', 'notes', 'target_window']) {
      const value = raw[field];
      if (value && publicText.includes(value)) fail(`public projection leaks raw ${field} value from ${raw.task_id}`);
    }
  }

  const missionById = new Map(missions.map((mission) => [String(mission.missionId), mission]));
  const targets = (missionId: string) => array(missionById.get(missionId)?.targets, `${missionId} targets`).map((value) => object(value, `${missionId} target`));
  const a004 = targets('A004');
  if (a004.length !== 1 || array(a004[0].locatorAliases, 'A004 aliases').length !== 1 || a004[0].relation !== 'locator_alias') {
    fail('A004 locator aliases are not one structured target');
  }
  const a013 = targets('A013');
  if (a013.length !== 3 || a013.some((target) => target.relation !== 'separate_request')) {
    fail('A013 must contain three separate requests');
  }
  const a015 = targets('A015');
  if (
    a015.length !== 2
    || a015.some((target) => target.relation !== 'same_work_carrier')
    || new Set(a015.map((target) => target.workFamilyKey)).size !== 1
  ) fail('A015 same-work carrier contract drifted');
  const a020 = targets('A020');
  if (a020.length !== 4 || a020.some((target) => target.relation !== 'separate_request')) {
    fail('A020 must contain four separate requests');
  }
  for (const mission of missions) {
    if (!['A004', 'A013', 'A015', 'A020'].includes(String(mission.missionId)) && array(mission.targets, 'targets').length !== 1) {
      fail(`${mission.missionId}: ordinary mission must contain one target`);
    }
  }

  const journal = array(srcPublic.value.journal, 'method journal');
  if (journal.length < 2 || journal.length > 3) fail('method journal must contain two or three entries');
  const journalFields = new Set(['action', 'decision', 'outcome', 'nextStep', 'cannotProve', 'missionIds']);
  for (const [index, value] of journal.entries()) {
    const entry = object(value, `journal ${index}`);
    exactKeys(entry, journalFields, `journal ${index}`);
    for (const missionId of array(entry.missionIds, `journal ${index} mission IDs`)) {
      if (!missionById.has(String(missionId))) fail(`journal ${index} references unknown mission ${missionId}`);
    }
  }

  const ownerMeta = object(owner.value._meta, 'owner metadata');
  if ((statSync(ownerPath).mode & 0o777) !== 0o600) fail('owner artifact permissions must be 0600');
  if ((statSync(dirname(ownerPath)).mode & 0o777) !== 0o700) fail('owner directory permissions must be 0700');
  if (
    ownerMeta.schema_version !== 'archive-missions-owner-v1'
    || ownerMeta.access_scope !== 'owner_only_local_runtime'
    || ownerMeta.public_generation_id !== meta.generation_id
  ) fail('owner metadata contract drifted');
  const ownerMissions = array(owner.value.missions, 'owner missions');
  if (ownerMissions.length !== missions.length) fail('owner mission count differs from public');
  ownerMissions.forEach((value, index) => {
    const ownerMission = object(value, `owner mission ${index}`);
    const ownerRaw = object(ownerMission.ownerRaw, `owner mission ${index} raw`);
    if (JSON.stringify(Object.keys(ownerRaw)) !== JSON.stringify(RAW_HEADERS)) {
      fail(`owner mission ${index} raw row fields drifted`);
    }
    const projected = { ...ownerMission };
    delete projected.ownerRaw;
    if (JSON.stringify(projected) !== JSON.stringify(missions[index])) {
      fail(`owner mission ${index} does not contain the exact public mission`);
    }
    if (JSON.stringify(ownerRaw) !== JSON.stringify(rawRows[index])) {
      fail(`owner mission ${index} raw row differs from source CSV`);
    }
  });

  const manifestInputs = object(manifest.value.inputs, 'manifest inputs');
  const sourceInput = object(manifestInputs.source_csv, 'manifest source input');
  const graphInput = object(manifestInputs.audit_graph, 'manifest graph input');
  if (sourceInput.sha256 !== SOURCE_SHA256 || graphInput.sha256 !== AUDIT_GRAPH_SHA256) {
    fail('manifest input digests drifted');
  }
  const outputs = object(manifest.value.outputs, 'manifest outputs');
  const expectedOutputs: Record<string, Buffer> = {
    src_public: srcPublic.bytes,
    browser_public: browserPublic.bytes,
    owner: owner.bytes,
  };
  for (const [key, bytes] of Object.entries(expectedOutputs)) {
    const output = object(outputs[key], `manifest output ${key}`);
    if (output.sha256 !== sha256(bytes)) fail(`manifest output digest drifted: ${key}`);
  }

  const generationMaterial = {
    schema_version: 'archive-missions-public-v1',
    generator_version: '1.0.0',
    source_sha256: SOURCE_SHA256,
    audit_graph_sha256: AUDIT_GRAPH_SHA256,
    source_updated_at: '2026-07-28',
    generated_at: '2026-08-04T00:00:00+08:00',
    counts,
    missions,
    journal,
  };
  const expectedGenerationId = `gen-${sha256(JSON.stringify(generationMaterial))}`;
  if (meta.generation_id !== expectedGenerationId || manifest.value.generation_id !== expectedGenerationId) {
    fail('generation ID is not reproducible from content');
  }

  const forbiddenEndpointKeys = ['endpoint', 'submissionEndpoint', 'submitUrl', 'apiPath'];
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) value.forEach(walk);
    else if (value !== null && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) {
        if (forbiddenEndpointKeys.includes(key)) fail(`lead contract exposes endpoint field ${key}`);
        walk(item);
      }
    }
  };
  walk(srcPublic.value);

  const publicBuilderSource = readFileSync(
    resolve(PROJECT_ROOT, 'src', 'components', 'public-locator-builder.tsx'),
    'utf8',
  );
  for (const marker of [
    'locator_intake_not_open',
    'creates_claim=false',
    "consent_version: 'archive-lead-draft-v1'",
    'navigator.clipboard.writeText',
  ]) {
    if (!publicBuilderSource.includes(marker)) fail(`public locator draft is missing ${marker}`);
  }
  for (const forbidden of [
    /\bfetch\s*\(/,
    /XMLHttpRequest/,
    /sendBeacon/,
    /\bFormData\b/,
    /\blocalStorage\b/,
    /\bsessionStorage\b/,
    /mailto:/i,
    /type\s*=\s*["']file["']/i,
  ]) {
    if (forbidden.test(publicBuilderSource)) {
      fail(`public locator draft contains a submission or persistence surface: ${forbidden}`);
    }
  }

  const missionDetailSource = readFileSync(
    resolve(PROJECT_ROOT, 'src', 'app', 'missions', '[taskId]', 'page.tsx'),
    'utf8',
  );
  for (const marker of [
    '研究议程 · 非调查结论 · 已取得并核读 = 0',
    '多项申请不等于多条独立证据',
    '同一作品的不同载体，不重复计算证据',
  ]) {
    if (!missionDetailSource.includes(marker)) fail(`mission detail reader guard is missing ${marker}`);
  }

  const ownerConsoleSource = readFileSync(
    resolve(PROJECT_ROOT, 'src', 'components', 'research-mission-admin.tsx'),
    'utf8',
  );
  if (
    !ownerConsoleSource.includes("fetch('/api/local/research-missions'")
    || !ownerConsoleSource.includes("cache: 'no-store'")
    || !ownerConsoleSource.includes('setToken(\'\')')
  ) fail('owner mission console is not bound to the read-only local endpoint and transient token lifecycle');
  for (const forbidden of [
    /\blocalStorage\b(?![^\n]*页面日志)/,
    /\bsessionStorage\b(?![^\n]*页面日志)/,
    /\bFormData\b/,
    /type\s*=\s*["']file["']/i,
    /method\s*:\s*["'](?:POST|PUT|PATCH|DELETE)["']/i,
    /fetch\s*\(\s*["'](?!\/api\/local\/research-missions)/,
  ]) {
    if (forbidden.test(ownerConsoleSource)) {
      fail(`owner mission console contains a forbidden write or persistence surface: ${forbidden}`);
    }
  }

  console.log(JSON.stringify({
    status: 'PASS',
    generation_id: expectedGenerationId,
    missions: missions.length,
    targets: missions.reduce((total, mission) => total + array(mission.targets, 'targets').length, 0),
    public_bytes_equal: true,
    completed: 0,
    owner_raw_rows: ownerMissions.length,
  }, null, 2));
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ status: 'FAIL', error: message }));
  process.exitCode = 1;
}

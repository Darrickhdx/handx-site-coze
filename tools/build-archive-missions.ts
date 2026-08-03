import { createHash } from 'node:crypto';
import {
  chmodSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
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
const GENERATOR_VERSION = '1.0.0';
const GENERATED_AT = '2026-08-04T00:00:00+08:00';
const SOURCE_UPDATED_AT = '2026-07-28';

const CSV_HEADERS = [
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
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];
type RawMissionRow = Record<CsvHeader, string>;
type WorkflowState = 'planned' | 'blocked';
type NextActionType = 'send' | 'book' | 'inquire' | 'delegate' | 'wait_precondition';
type TaskKind = 'archive_request' | 'context_research';
type TargetRelation =
  | 'single_request'
  | 'locator_alias'
  | 'separate_request'
  | 'same_work_carrier';

interface MissionTarget {
  targetId: string;
  relation: TargetRelation;
  institution: string;
  catalogReference: string;
  locatorAliases: string[];
  workFamilyKey: string | null;
}

interface PublicMission {
  missionId: string;
  canonicalId: string;
  taskKind: TaskKind;
  executionPriority: 'P0' | 'P1' | 'P2';
  status: {
    workflowState: WorkflowState;
    nextActionType: NextActionType;
    baselineLabel: string;
    publicLabel: string;
    verifiedAt: null;
    completed: false;
  };
  modeLabel: string;
  institution: string;
  institutionType: string;
  topic: string;
  people: string[];
  researchQuestion: string;
  catalogReference: string;
  completionStandard: string;
  publicNextStep: string;
  evidenceScope: string;
  boundary: string;
  highlighted: boolean;
  targets: MissionTarget[];
}

interface MethodJournalEntry {
  action: string;
  decision: string;
  outcome: string;
  nextStep: string;
  cannotProve: string;
  missionIds: string[];
}

function sha256(payload: Buffer | string): string {
  return createHash('sha256').update(payload).digest('hex');
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
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }
    if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  if (quoted) throw new Error('source CSV has an unterminated quoted field');
  if (field || row.length > 0) {
    row.push(field.endsWith('\r') ? field.slice(0, -1) : field);
    rows.push(row);
  }
  return rows.filter((candidate) => candidate.some((value) => value !== ''));
}

function loadRows(sourceBytes: Buffer): RawMissionRow[] {
  const matrix = parseCsv(sourceBytes.toString('utf8'));
  const headers = matrix.shift();
  if (!headers || JSON.stringify(headers) !== JSON.stringify(CSV_HEADERS)) {
    throw new Error('archive mission CSV headers drifted');
  }
  const rows = matrix.map((values, rowIndex) => {
    if (values.length !== CSV_HEADERS.length) {
      throw new Error(`source row ${rowIndex + 2} has ${values.length} fields`);
    }
    const row = Object.fromEntries(
      CSV_HEADERS.map((header, index) => [header, values[index].trim()]),
    ) as RawMissionRow;
    for (const header of CSV_HEADERS) {
      if (!row[header]) throw new Error(`${row.task_id || `row-${rowIndex + 2}`}: blank ${header}`);
    }
    return row;
  });
  if (rows.length !== 33) throw new Error(`expected 33 mission rows, found ${rows.length}`);
  const missionIds = new Set(rows.map((row) => row.task_id));
  if (missionIds.size !== rows.length) throw new Error('source CSV contains duplicate task IDs');
  if (rows.some((row) => !/^[AM]\d{3}$/.test(row.task_id))) {
    throw new Error('source CSV contains an invalid task ID');
  }
  return rows;
}

function statusFor(label: string): PublicMission['status'] {
  const mapping: Record<string, [WorkflowState, NextActionType, string]> = {
    待发送: ['planned', 'send', '准备人工提交'],
    待预约: ['planned', 'book', '准备确认预约'],
    待函询: ['planned', 'inquire', '准备定点函询'],
    待委托: ['planned', 'delegate', '准备确认执行人'],
    条件启动: ['blocked', 'wait_precondition', '等待前置条件'],
  };
  const mapped = mapping[label];
  if (!mapped) throw new Error(`unknown baseline status: ${label}`);
  return {
    workflowState: mapped[0],
    nextActionType: mapped[1],
    baselineLabel: label,
    publicLabel: mapped[2],
    verifiedAt: null,
    completed: false,
  };
}

function publicNextStep(action: NextActionType): string {
  const steps: Record<NextActionType, string> = {
    send: '准备最小范围申请，人工复核机构规则后再提交。',
    book: '先人工确认开放、载体和预约条件，再决定是否安排现场。',
    inquire: '把问题拆成可回答字段，先做定点函询并保存馆方原文。',
    delegate: '先确认材料可阅状态与执行人，再安排现场核对。',
    wait_precondition: '保持停止门，只有前置证据条件满足后才启动。',
  };
  return steps[action];
}

function peopleFor(row: RawMissionRow): string[] {
  const searchable = `${row.target_person_event} ${row.exact_request}`;
  const candidates = ['苏开元', '李大超', '李英夫', '乔培新', '何成璞', '李挺超'];
  const people = candidates.filter((name) => searchable.includes(name));
  if (row.task_id === 'A012') {
    return ['苏开元', '李英夫', '李大超', '何成璞', '乔培新'];
  }
  return people;
}

const FEATURED_QUESTIONS: Record<string, string> = {
  A001: '《日華學報》原页如何列示姓名、学校、期别与备注，能否为身份比较增加第二字段？',
  A002: '《綏東問題の展開（二）》原文如何表述平地泉、职务与姓名，完整上下文是否支持现有定位？',
  A003: '该档案正文中的李大超记录属于何种职务与单位，是否出现足以排除同名的第二身份字段？',
  A004: '同一项目的两个档号前缀指向怎样的完整文书，原职、新职与形成机关能否同时核读？',
  A005: '李英夫卷可公开字段能否区分军人记录与后来的政协身份，同时保留隐私遮蔽边界？',
  A006: '1945 年索引命中在正文中究竟对应何种关系句，还是应撤销由目录产生的联想？',
  A007: '原刊载体能否闭合文章题名、作者、页码、版本与上下文，而不再依赖本地转录？',
};

function neutralQuestion(row: RawMissionRow): string {
  return `${row.target_person_event}相关材料能否取得可定位、可核读的原页或形成链，并明确仍不能推出什么？`;
}

function targetsFor(row: RawMissionRow): MissionTarget[] {
  const target = (
    suffix: string,
    relation: TargetRelation,
    institution: string,
    catalogReference: string,
    locatorAliases: string[] = [],
    workFamilyKey: string | null = null,
  ): MissionTarget => ({
    targetId: `SKY-TGT-${row.task_id}-${suffix}`,
    relation,
    institution,
    catalogReference,
    locatorAliases,
    workFamilyKey,
  });

  if (row.task_id === 'A004') {
    return [
      target('01', 'locator_alias', row.institution, 'C401-01-0245-030', ['401-01-0245-030']),
    ];
  }
  if (row.task_id === 'A013') {
    return ['中央-軍隊教育士官校-60', '中央-軍隊教育士官校-12', '中央-軍隊教育士官校-95']
      .map((reference, index) => target(String(index + 1).padStart(2, '0'), 'separate_request', row.institution, reference));
  }
  if (row.task_id === 'A015') {
    const workFamilyKey = 'WORK-ARMY-OFFICER-APPOINTMENT-ROSTER';
    return [
      target('01', 'same_work_carrier', '东洋文库', 'NCID BB06218097', [], workFamilyKey),
      target('02', 'same_work_carrier', '中国国家图书馆', 'docId 1961241826466553092', [], workFamilyKey),
    ];
  }
  if (row.task_id === 'A020') {
    return row.archive_id_or_title.split(';').map((reference, index) =>
      target(String(index + 1).padStart(2, '0'), 'separate_request', row.institution, reference));
  }
  return [target('01', 'single_request', row.institution, row.archive_id_or_title)];
}

function missionFor(row: RawMissionRow): PublicMission {
  if (!['P0', 'P1', 'P2'].includes(row.priority)) {
    throw new Error(`${row.task_id}: invalid execution priority ${row.priority}`);
  }
  const status = statusFor(row.status);
  const taskKind: TaskKind = row.task_id.startsWith('A') ? 'archive_request' : 'context_research';
  const boundary = taskKind === 'archive_request'
    ? '申请、目录、索引或检索命中只证明研究路线；取得并核读原文前，不生成历史事实、身份合并或人物行动。'
    : '博物馆展陈、地方材料与场景采集只提供背景和检索线索；不得据此证明人物在场、任职、行动或功劳。';
  return {
    missionId: row.task_id,
    canonicalId: `SKY-RT-${row.task_id}`,
    taskKind,
    executionPriority: row.priority as PublicMission['executionPriority'],
    status,
    modeLabel: row.city_or_mode,
    institution: row.institution,
    institutionType: row.institution_type,
    topic: row.target_person_event,
    people: peopleFor(row),
    researchQuestion: FEATURED_QUESTIONS[row.task_id] ?? neutralQuestion(row),
    catalogReference: row.archive_id_or_title,
    completionStandard: row.expected_output,
    publicNextStep: publicNextStep(status.nextActionType),
    evidenceScope: row.evidence_scope,
    boundary,
    highlighted: /^A00[1-7]$/.test(row.task_id),
    targets: targetsFor(row),
  };
}

const METHOD_JOURNAL: MethodJournalEntry[] = [
  {
    action: 'remote_first_batch_defined',
    decision: '先处理七项已精确到档号、题名或物理帧的远程任务。',
    outcome: '形成可人工提交的首批最小申请范围；当前仍无发送、受理或交付记录。',
    nextStep: '逐件复核机构现行规则，提交后记录时间、受理号和馆方原文。',
    cannotProve: '任务准备完成不能证明材料已取得，更不能证明人物身份、职务或行动。',
    missionIds: ['A001', 'A002', 'A003', 'A004', 'A005', 'A006', 'A007'],
  },
  {
    action: 'travel_stop_gate_defined',
    decision: '没有开放确认、可调卷号或明确目标材料清单时，不安排跨城或跨国行程。',
    outcome: '南京、台北、东京与部分地方路线保持在回复或前置证据触发之后。',
    nextStep: '先完成定点函询、复制可行性确认和现场执行人确认。',
    cannotProve: '路线被列入计划不表示机构已接受申请，也不表示目标材料确实存在或开放。',
    missionIds: ['A011', 'A012', 'A013', 'A014', 'A015'],
  },
  {
    action: 'museum_context_boundary_fixed',
    decision: '博物馆和地方现场用于空间、器物、制度与视觉来源，不替代人物原档。',
    outcome: '九项背景任务均保留条件启动和非人物事实边界。',
    nextStep: '核心档案出现有效线索后，再核对展品藏品号、底本、图录页码与权利渠道。',
    cannotProve: '展签、讲解、场景照片或地方背景不能证明苏开元等人物在场、任职、行动或功劳。',
    missionIds: ['M001', 'M002', 'M003', 'M004', 'M005', 'M006', 'M007', 'M008', 'M009'],
  },
];

function countBy(values: string[]): Record<string, number> {
  return Object.fromEntries(
    [...new Set(values)].sort().map((value) => [value, values.filter((candidate) => candidate === value).length]),
  );
}

function jsonBytes(value: unknown): Buffer {
  return Buffer.from(`${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function ensureNoAbsolutePath(payload: Buffer, label: string): void {
  const text = payload.toString('utf8');
  if (/\/Users\/|file:\/\/|(?:^|["'])\.\.\//m.test(text)) {
    throw new Error(`${label} contains a local or parent-relative path`);
  }
}

function atomicWrite(path: string, payload: Buffer, mode: number): void {
  const outputDirectory = dirname(path);
  const privateOutput = path.includes('private-runtime');
  mkdirSync(outputDirectory, { recursive: true, mode: privateOutput ? 0o700 : 0o755 });
  if (privateOutput) chmodSync(outputDirectory, 0o700);
  const temporary = `${path}.tmp-${process.pid}`;
  writeFileSync(temporary, payload, { mode });
  chmodSync(temporary, mode);
  renameSync(temporary, path);
  chmodSync(path, mode);
}

function main(): void {
  const sourceBytes = readFileSync(SOURCE_PATH);
  const auditGraphBytes = readFileSync(AUDIT_GRAPH_PATH);
  if (sha256(sourceBytes) !== SOURCE_SHA256) throw new Error('archive mission source SHA-256 drifted');
  if (sha256(auditGraphBytes) !== AUDIT_GRAPH_SHA256) throw new Error('audit graph SHA-256 drifted');

  const rows = loadRows(sourceBytes);
  const missions = rows.map(missionFor);
  const counts = {
    missions: missions.length,
    priorities: countBy(rows.map((row) => row.priority)),
    baselineStatuses: countBy(rows.map((row) => row.status)),
    institutions: new Set(rows.map((row) => row.institution)).size,
    highlighted: missions.filter((mission) => mission.highlighted).length,
    completed: missions.filter((mission) => mission.status.completed).length,
  };
  const generationMaterial = {
    schema_version: 'archive-missions-public-v1',
    generator_version: GENERATOR_VERSION,
    source_sha256: SOURCE_SHA256,
    audit_graph_sha256: AUDIT_GRAPH_SHA256,
    source_updated_at: SOURCE_UPDATED_AT,
    generated_at: GENERATED_AT,
    counts,
    missions,
    journal: METHOD_JOURNAL,
  };
  const generationId = `gen-${sha256(JSON.stringify(generationMaterial))}`;
  const publicPayload = {
    _meta: {
      schema_version: 'archive-missions-public-v1',
      generator_version: GENERATOR_VERSION,
      source_updated_at: SOURCE_UPDATED_AT,
      generated_at: GENERATED_AT,
      generation_id: generationId,
      must_not_deploy: true,
      deployment_authorized: false,
      evidence_boundary: 'execution_progress_not_historical_completion',
      lead_intake_status: 'browser_draft_only_no_submission_endpoint',
      counts,
    },
    missions,
    journal: METHOD_JOURNAL,
  };
  const ownerPayload = {
    _meta: {
      ...publicPayload._meta,
      schema_version: 'archive-missions-owner-v1',
      access_scope: 'owner_only_local_runtime',
      source_sha256: SOURCE_SHA256,
      public_generation_id: generationId,
    },
    missions: missions.map((mission, index) => ({
      ...mission,
      ownerRaw: rows[index],
    })),
    journal: METHOD_JOURNAL,
  };

  const srcPublicPath = resolve(PROJECT_ROOT, 'src', 'data', 'archive-missions.json');
  const browserPublicPath = resolve(PROJECT_ROOT, 'public', 'data', 'archive-missions.json');
  const ownerPath = resolve(PROJECT_ROOT, 'private-runtime', 'archive-missions-owner.json');
  const manifestPath = resolve(PROJECT_ROOT, 'src', 'data', 'archive-missions-manifest.json');
  const publicBytes = jsonBytes(publicPayload);
  const ownerBytes = jsonBytes(ownerPayload);
  ensureNoAbsolutePath(publicBytes, 'public archive missions');
  ensureNoAbsolutePath(ownerBytes, 'owner archive missions');

  const manifestPayload = {
    schema_version: 'archive-missions-manifest-v1',
    generator_version: GENERATOR_VERSION,
    generated_at: GENERATED_AT,
    generation_id: generationId,
    must_not_deploy: true,
    deployment_authorized: false,
    inputs: {
      source_csv: { filename: SOURCE_FILENAME, sha256: SOURCE_SHA256 },
      audit_graph: { filename: 'public/data/graph/audit-graph.json', sha256: AUDIT_GRAPH_SHA256 },
    },
    outputs: {
      src_public: { filename: 'src/data/archive-missions.json', sha256: sha256(publicBytes) },
      browser_public: { filename: 'public/data/archive-missions.json', sha256: sha256(publicBytes) },
      owner: { filename: 'private-runtime/archive-missions-owner.json', sha256: sha256(ownerBytes) },
    },
    contracts: {
      public_schema: 'archive-missions-public-v1',
      owner_schema: 'archive-missions-owner-v1',
      evidence_boundary: 'execution_progress_not_historical_completion',
      lead_intake_status: 'browser_draft_only_no_submission_endpoint',
    },
  };
  const manifestBytes = jsonBytes(manifestPayload);
  ensureNoAbsolutePath(manifestBytes, 'archive mission manifest');

  atomicWrite(srcPublicPath, publicBytes, 0o644);
  atomicWrite(browserPublicPath, publicBytes, 0o644);
  atomicWrite(ownerPath, ownerBytes, 0o600);
  atomicWrite(manifestPath, manifestBytes, 0o644);

  console.log(JSON.stringify({
    status: 'PASS',
    generation_id: generationId,
    missions: counts.missions,
    targets: missions.reduce((total, mission) => total + mission.targets.length, 0),
    highlighted: counts.highlighted,
    completed: counts.completed,
  }, null, 2));
}

try {
  main();
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(JSON.stringify({ status: 'FAIL', error: message }));
  process.exitCode = 1;
}

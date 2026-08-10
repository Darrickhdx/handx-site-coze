'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Archive,
  CalendarClock,
  CircleDot,
  KeyRound,
  ListFilter,
  LoaderCircle,
  LockKeyhole,
  Search,
  ShieldAlert,
} from 'lucide-react';

type LoadState = 'idle' | 'loading' | 'ready' | 'error';
type PlanningState = 'planned' | 'blocked';

type JsonRecord = Record<string, unknown>;

interface ResearchMissionResponse {
  ok?: boolean;
  error?: string;
  storage_scope?: string;
  event_writes_enabled?: boolean;
  historical_claims_created?: boolean;
  baseline?: {
    _meta?: JsonRecord;
    missions?: unknown[];
  };
}

interface MissionView {
  taskId: string;
  priority: string;
  institution: string;
  institutionType: string;
  cityOrMode: string;
  researchTarget: string;
  archiveIdOrTitle: string;
  exactRequest: string;
  expectedOutput: string;
  precondition: string;
  status: string;
  nextAction: string;
  nextActionType: string;
  targetWindow: string;
  evidenceScope: string;
  boundaryLabel: string;
  notes: string;
  planningState: PlanningState;
}

const BASELINE_DATE = '2026-07-28';

const nextActionLabels: Record<string, string> = {
  send: '发送／提交申请',
  inquire: '馆询',
  delegate: '委托执行',
  book: '预约现场',
  wait_precondition: '解除前置条件',
  submit_request: '发送／提交申请',
  institution_inquiry: '馆询',
  schedule_visit: '预约现场',
  clear_precondition: '解除前置条件',
  other: '其他下一动作',
};

const roadmap = [
  ['planned', '计划已登记', '基线只描述准备做什么，不代表已经发出。'],
  ['submitted', '申请已发送', '未来需由独立事件记录发送时间与可核回执。'],
  ['acknowledged', '机构已受理', '只有机构回函或受理号才能进入这一阶段。'],
  ['material_received', '材料已取得', '取得材料仍不等于已经阅读或核验。'],
  ['verified_bounded', '限定范围已核', '须记录原页定位、已读范围、权利与证据边界。'],
] as const;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function firstText(record: JsonRecord, ...keys: string[]): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function inferPlanningState(record: JsonRecord, status: string): PlanningState {
  const explicitState = firstText(
    record,
    'planning_state',
    'mission_state',
    'workflow_state',
    'plan_state',
  ).toLowerCase();
  if (explicitState === 'blocked') return 'blocked';
  if (explicitState === 'planned') return 'planned';
  return /条件|阻断|blocked/i.test(status) ? 'blocked' : 'planned';
}

function inferNextActionType(record: JsonRecord, status: string): string {
  const explicitType = firstText(
    record,
    'next_action_type',
    'nextActionType',
    'public_next_action_type',
  );
  if (explicitType) return explicitType;
  if (status === '待发送') return 'submit_request';
  if (status === '待函询') return 'institution_inquiry';
  if (status === '待委托') return 'delegate';
  if (status === '待预约') return 'schedule_visit';
  if (status === '条件启动') return 'clear_precondition';
  return 'other';
}

function normalizeMission(value: unknown, index: number): MissionView | null {
  if (!isRecord(value)) return null;
  const ownerRaw = isRecord(value.ownerRaw) ? value.ownerRaw : value;
  const statusRecord = isRecord(value.status) ? value.status : null;
  const status =
    firstText(ownerRaw, 'status') ||
    (statusRecord ? firstText(statusRecord, 'baselineLabel', 'publicLabel') : '') ||
    firstText(value, 'workflow_status_public') ||
    '未标注';
  const explicitPlanningState = statusRecord
    ? firstText(statusRecord, 'workflowState')
    : '';
  const explicitNextActionType = statusRecord
    ? firstText(statusRecord, 'nextActionType')
    : '';
  const nextActionType = explicitNextActionType || inferNextActionType(value, status);
  return {
    taskId: firstText(value, 'missionId', 'task_id') || firstText(ownerRaw, 'task_id') || `UNKNOWN-${index + 1}`,
    priority: firstText(value, 'executionPriority', 'priority') || firstText(ownerRaw, 'priority') || '未标注',
    institution: firstText(value, 'institution', 'institution_name') || '未标注机构',
    institutionType:
      firstText(value, 'institutionType', 'institution_type', 'task_type') ||
      firstText(ownerRaw, 'institution_type'),
    cityOrMode: firstText(value, 'modeLabel', 'city_or_mode', 'broad_city_or_mode') || firstText(ownerRaw, 'city_or_mode'),
    researchTarget:
      firstText(value, 'topic', 'researchQuestion', 'target_person_event', 'public_research_question') ||
      firstText(ownerRaw, 'target_person_event') ||
      '未标注研究对象',
    archiveIdOrTitle:
      firstText(value, 'catalogReference', 'archive_id_or_title', 'public_catalog_locator') ||
      firstText(ownerRaw, 'archive_id_or_title') ||
      '尚待馆方定位',
    exactRequest: firstText(ownerRaw, 'exact_request') || firstText(value, 'exact_request') || '未登记',
    expectedOutput:
      firstText(value, 'completionStandard', 'expected_output') ||
      firstText(ownerRaw, 'expected_output') ||
      '未登记',
    precondition:
      firstText(ownerRaw, 'precondition') || firstText(value, 'precondition') || '无已登记前置条件',
    status,
    nextAction:
      firstText(ownerRaw, 'next_action') ||
      firstText(value, 'publicNextStep', 'next_action', 'public_next_step') ||
      '未登记下一动作',
    nextActionType,
    targetWindow: firstText(ownerRaw, 'target_window') || firstText(value, 'target_window') || '未登记',
    evidenceScope:
      firstText(value, 'evidenceScope', 'evidence_scope') ||
      firstText(ownerRaw, 'evidence_scope') ||
      '未登记',
    boundaryLabel: firstText(value, 'boundary', 'boundary_label'),
    notes: firstText(ownerRaw, 'notes') || firstText(value, 'notes'),
    planningState:
      explicitPlanningState === 'blocked' || explicitPlanningState === 'planned'
        ? explicitPlanningState
        : inferPlanningState(value, status),
  };
}

function actionTypeLabel(value: string): string {
  return nextActionLabels[value] ?? value;
}

function errorMessage(status: number, error?: string): string {
  if (status === 400) return '请求格式不正确。请锁定执行台后重新读取。';
  if (status === 401 || error === 'admin_token_required') {
    return '管理员令牌无效。令牌已从本页内存中清除。';
  }
  if (status === 403 || error === 'local_origin_required') {
    return '此执行台只允许从本机网站打开。';
  }
  if (status === 503 || error === 'research_mission_baseline_unhealthy') {
    return '本机私密基线尚未生成，或完整性门禁未通过；为避免展示残缺台账，本页已失败关闭。';
  }
  return '行动基线读取失败，请稍后重试。';
}

export function ResearchMissionAdmin() {
  const [token, setToken] = useState('');
  const [missions, setMissions] = useState<MissionView[]>([]);
  const [meta, setMeta] = useState<JsonRecord | null>(null);
  const [loadState, setLoadState] = useState<LoadState>('idle');
  const [message, setMessage] = useState(
    '管理员令牌只停留在当前页面内存；读取请求结束后立即清除。',
  );
  const [query, setQuery] = useState('');
  const [priority, setPriority] = useState('all');
  const [nextActionType, setNextActionType] = useState('all');

  const lockConsole = useCallback(() => {
    setToken('');
    setMissions([]);
    setMeta(null);
    setLoadState('idle');
    setQuery('');
    setPriority('all');
    setNextActionType('all');
    setMessage('执行台已锁定；令牌、任务基线和筛选条件均已从页面内存清除。');
  }, []);

  const loadMissions = useCallback(async () => {
    const transientToken = token.trim();
    if (!transientToken) {
      setLoadState('error');
      setMessage('请输入本机管理员令牌。');
      return;
    }

    setLoadState('loading');
    setMessage('正在读取本机私密行动基线…');
    try {
      const response = await fetch('/api/local/research-missions', {
        method: 'GET',
        cache: 'no-store',
        credentials: 'same-origin',
        headers: { Authorization: `Bearer ${transientToken}` },
      });
      const payload = (await response.json().catch(() => null)) as ResearchMissionResponse | null;
      if (!response.ok || payload?.ok !== true) {
        throw new Error(errorMessage(response.status, payload?.error));
      }
      if (
        payload.storage_scope !== 'local_private_runtime' ||
        !payload.baseline ||
        !isRecord(payload.baseline._meta) ||
        !Array.isArray(payload.baseline.missions)
      ) {
        throw new Error('返回内容未通过本机私密基线合同校验。');
      }

      const normalized = payload.baseline.missions
        .map(normalizeMission)
        .filter((mission): mission is MissionView => mission !== null);
      if (normalized.length !== 33) {
        throw new Error(`基线任务应为 33 项，本次只通过校验 ${normalized.length} 项；已拒绝展示。`);
      }

      setMissions(normalized);
      setMeta(payload.baseline._meta);
      setLoadState('ready');
      setMessage('已读取 33 项行动基线；本页没有写入或覆盖任何任务状态。');
    } catch (error: unknown) {
      setMissions([]);
      setMeta(null);
      setLoadState('error');
      setMessage(error instanceof Error ? error.message : '行动基线读取失败。');
    } finally {
      setToken('');
    }
  }, [token]);

  const actionTypeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const mission of missions) {
      counts.set(mission.nextActionType, (counts.get(mission.nextActionType) ?? 0) + 1);
    }
    return [...counts.entries()].sort((left, right) => {
      const byCount = right[1] - left[1];
      return byCount || actionTypeLabel(left[0]).localeCompare(actionTypeLabel(right[0]), 'zh-CN');
    });
  }, [missions]);

  const filteredMissions = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('zh-CN');
    return missions.filter((mission) => {
      if (priority !== 'all' && mission.priority !== priority) return false;
      if (nextActionType !== 'all' && mission.nextActionType !== nextActionType) return false;
      if (!needle) return true;
      return [
        mission.taskId,
        mission.institution,
        mission.cityOrMode,
        mission.researchTarget,
        mission.archiveIdOrTitle,
        mission.exactRequest,
        mission.nextAction,
      ].some((value) => value.toLocaleLowerCase('zh-CN').includes(needle));
    });
  }, [missions, nextActionType, priority, query]);

  const plannedCount = missions.filter((mission) => mission.planningState === 'planned').length;
  const blockedCount = missions.length - plannedCount;
  const schemaVersion = meta ? firstText(meta, 'schema_version') : '';

  return (
    <div className="personal-shell min-w-0 py-8 sm:py-8">
      <section className="grid min-w-0 gap-8 border-b border-foreground/15 pb-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
        <div className="min-w-0">
          <p className="story-kicker">Owner only · local runtime</p>
          <h1 className="mt-4 break-words font-serif text-2xl font-semibold tracking-[-0.05em] sm:text-2xl">
            史料行动执行台
          </h1>
        </div>
        <div className="min-w-0">
          <p className="text-sm leading-[1.7] text-muted-foreground">
            这里读取的是 2026-07-28 形成的 33 项查档与实地调研基线，用来回答“下一步做什么”。
            它不是历史研究完成率，也不是发送、受理或取得材料的实时记录。
          </p>
          <div className="mt-5 flex min-w-0 items-start gap-3 border border-candidate/25 bg-candidate/5 p-4 text-xs leading-6 text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-candidate" aria-hidden="true" />
            <p className="min-w-0 break-words">
              目录、OCR、馆询与负检索结果只能作为定位或限定范围的结果；任何任务完成都不会自动创建人物事实、
              知识图谱关系或小说真人场景。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 min-w-0 border border-foreground/15 bg-card p-5 sm:p-7" aria-labelledby="mission-unlock-title">
        <div className="flex items-center gap-3">
          <KeyRound className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <h2 id="mission-unlock-title" className="font-serif text-xl font-semibold">
            读取本机私密基线
          </h2>
        </div>
        <p className="mt-3 max-w-3xl text-xs leading-6 text-muted-foreground">
          令牌不写入 localStorage、sessionStorage、URL 或页面日志；每次读取结束后都会从输入框和组件状态中清除。
        </p>
        <label className="mt-5 grid min-w-0 gap-2 text-xs font-semibold text-muted-foreground" htmlFor="research-mission-token">
          本机管理员令牌
          <input
            id="research-mission-token"
            name="research-mission-token-transient"
            type="password"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              if (loadState === 'error') {
                setLoadState('idle');
                setMessage('令牌已变化，可以重新读取。');
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && loadState !== 'loading') void loadMissions();
            }}
            autoComplete="new-password"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
            className="min-h-11 min-w-0 w-full border border-foreground/20 bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
            aria-describedby="research-mission-token-note"
          />
        </label>
        <p id="research-mission-token-note" className="sr-only">
          令牌仅在本页内存中短暂使用，不会保存到浏览器存储。
        </p>
        <div className="mt-5 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void loadMissions()}
              disabled={loadState === 'loading'}
              className="story-button story-button-primary disabled:cursor-wait disabled:opacity-60"
            >
              {loadState === 'loading' ? (
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Archive className="size-4" aria-hidden="true" />
              )}
              读取 33 项基线
            </button>
            <button type="button" onClick={lockConsole} className="story-button story-button-secondary">
              <LockKeyhole className="size-4" aria-hidden="true" />
              锁定并清空
            </button>
          </div>
          <p
            className={`min-w-0 break-words text-xs leading-6 ${
              loadState === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }`}
            role={loadState === 'error' ? 'alert' : 'status'}
            aria-live="polite"
          >
            {message}
          </p>
        </div>
      </section>

      {loadState === 'ready' && (
        <>
          <section className="mt-8 min-w-0" aria-labelledby="mission-summary-title">
            <div className="flex min-w-0 flex-col gap-3 border-b border-foreground/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="story-kicker">Baseline snapshot</p>
                <h2 id="mission-summary-title" className="mt-3 break-words font-serif text-2xl font-semibold">
                  行动基线概览
                </h2>
              </div>
              <p className="break-words text-xs text-muted-foreground">
                {BASELINE_DATE}{schemaVersion ? ` · ${schemaVersion}` : ''} · 只读
              </p>
            </div>

            <dl className="mt-5 grid min-w-0 gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
              {[
                ['任务总数', missions.length, '33 项基线任务'],
                ['planned', plannedCount, '已列明下一动作'],
                ['blocked', blockedCount, '须先满足前置条件'],
              ].map(([label, value, note]) => (
                <div key={label} className="min-w-0 bg-card p-5">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</dt>
                  <dd className="mt-3 font-serif text-xl font-semibold text-foreground">{value}</dd>
                  <dd className="mt-2 break-words text-xs text-muted-foreground">{note}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 min-w-0 border border-foreground/15 bg-card p-5">
              <div className="flex items-center gap-2">
                <CircleDot className="size-4 shrink-0 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-semibold">下一动作类型</h3>
              </div>
              <div className="mt-4 flex min-w-0 flex-wrap gap-2">
                {actionTypeCounts.map(([type, count]) => (
                  <span key={type} className="max-w-full break-words border border-foreground/15 bg-background px-3 py-2 text-xs text-muted-foreground">
                    {actionTypeLabel(type)} <strong className="ml-1 text-foreground">{count}</strong>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-10 min-w-0" aria-labelledby="mission-filter-title">
            <div className="flex items-center gap-3">
              <ListFilter className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <h2 id="mission-filter-title" className="font-serif text-xl font-semibold">筛选任务</h2>
            </div>
            <div className="mt-5 grid min-w-0 gap-4 border border-foreground/15 bg-card p-5 md:grid-cols-3">
              <label className="grid min-w-0 gap-2 text-xs font-semibold text-muted-foreground" htmlFor="mission-query">
                任务、机构或关键词
                <span className="relative min-w-0">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="mission-query"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    className="min-h-11 min-w-0 w-full border border-foreground/20 bg-background py-2 pl-10 pr-3 text-sm text-foreground outline-none focus:border-primary"
                    placeholder="例如 A001、NDL、平地泉"
                  />
                </span>
              </label>
              <label className="grid min-w-0 gap-2 text-xs font-semibold text-muted-foreground" htmlFor="mission-priority">
                优先级
                <select
                  id="mission-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value)}
                  className="min-h-11 min-w-0 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="all">全部优先级</option>
                  <option value="P0">P0</option>
                  <option value="P1">P1</option>
                  <option value="P2">P2</option>
                </select>
              </label>
              <label className="grid min-w-0 gap-2 text-xs font-semibold text-muted-foreground" htmlFor="mission-next-action">
                下一动作
                <select
                  id="mission-next-action"
                  value={nextActionType}
                  onChange={(event) => setNextActionType(event.target.value)}
                  className="min-h-11 min-w-0 w-full border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                >
                  <option value="all">全部动作类型</option>
                  {actionTypeCounts.map(([type, count]) => (
                    <option key={type} value={type}>
                      {actionTypeLabel(type)}（{count}）
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="mt-4 text-xs text-muted-foreground" role="status" aria-live="polite">
              当前显示 {filteredMissions.length}／{missions.length} 项。
            </p>

            {filteredMissions.length > 0 ? (
              <ol className="mt-5 grid min-w-0 gap-5 xl:grid-cols-2">
                {filteredMissions.map((mission) => (
                  <li key={mission.taskId} className="min-w-0 border border-foreground/15 bg-card p-5 sm:p-6">
                    <article className="min-w-0">
                      <div className="flex min-w-0 flex-wrap items-start justify-between gap-3 border-b border-foreground/10 pb-4">
                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-primary">{mission.taskId}</span>
                            <span className="border border-foreground/15 px-2 py-1 text-[10px] font-semibold">{mission.priority}</span>
                            <span
                              className={`border px-2 py-1 text-[10px] font-semibold ${
                                mission.planningState === 'blocked'
                                  ? 'border-candidate/30 bg-candidate/5 text-candidate'
                                  : 'border-confirmed/30 bg-confirmed/5 text-confirmed'
                              }`}
                            >
                              {mission.planningState}
                            </span>
                          </div>
                          <h3 className="mt-3 break-words font-serif text-lg font-semibold leading-snug">
                            {mission.researchTarget}
                          </h3>
                          <p className="mt-2 break-words text-xs leading-6 text-muted-foreground">
                            {mission.institution}
                            {mission.institutionType ? ` · ${mission.institutionType}` : ''}
                            {mission.cityOrMode ? ` · ${mission.cityOrMode}` : ''}
                          </p>
                        </div>
                        <span className="max-w-full break-words border border-foreground/15 bg-background px-3 py-2 text-[10px] text-muted-foreground">
                          {mission.status}
                        </span>
                      </div>

                      <dl className="mt-5 grid min-w-0 gap-5 text-sm sm:grid-cols-2">
                        <div className="min-w-0 sm:col-span-2">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">档号或目标文献</dt>
                          <dd className="mt-2 break-words leading-7">{mission.archiveIdOrTitle}</dd>
                        </div>
                        <div className="min-w-0 sm:col-span-2">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">原始精确请求</dt>
                          <dd className="mt-2 break-words leading-7">{mission.exactRequest}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">前置条件</dt>
                          <dd className="mt-2 break-words leading-7">{mission.precondition}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">下一动作</dt>
                          <dd className="mt-2 break-words leading-7">{mission.nextAction}</dd>
                          <dd className="mt-1 break-words text-[10px] text-muted-foreground">{actionTypeLabel(mission.nextActionType)}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">完成标准</dt>
                          <dd className="mt-2 break-words leading-7">{mission.expectedOutput}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">证据边界</dt>
                          <dd className="mt-2 break-words leading-7">{mission.evidenceScope}</dd>
                          {mission.boundaryLabel && (
                            <dd className="mt-1 break-words text-[10px] text-muted-foreground">{mission.boundaryLabel}</dd>
                          )}
                        </div>
                      </dl>

                      <div className="mt-5 flex min-w-0 items-start gap-3 border border-foreground/10 bg-background p-4">
                        <CalendarClock className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0 text-xs leading-6 text-muted-foreground">
                          <p className="break-words">目标窗口：{mission.targetWindow}</p>
                          {mission.notes && <p className="mt-1 break-words">备注：{mission.notes}</p>}
                        </div>
                      </div>
                      <p className="mt-4 flex min-w-0 items-start gap-2 break-words text-[11px] leading-5 text-candidate">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                        这只是 {BASELINE_DATE} 行动基线；尚无发送、受理或取得事件。
                      </p>
                    </article>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-5 border border-dashed border-foreground/20 p-8 text-center text-sm text-muted-foreground">
                当前筛选没有匹配任务。
              </p>
            )}
          </section>

          <section className="mt-12 min-w-0 border border-foreground/15 bg-card p-5 sm:p-7" aria-labelledby="mission-roadmap-title">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="story-kicker">Append-only roadmap</p>
                <h2 id="mission-roadmap-title" className="mt-3 break-words font-serif text-2xl font-semibold">
                  事件日志路线图
                </h2>
              </div>
              <span className="max-w-full break-words border border-candidate/30 bg-candidate/5 px-3 py-2 text-xs font-semibold text-candidate">
                事件写入尚未开放
              </span>
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
              下列阶段只是未来追加式日志的设计，不是实时状态。正式开放后，每次发送、受理、取得和核读都应新增事件，
              不覆盖 2026-07-28 原始基线。
            </p>
            <ol className="mt-6 grid min-w-0 gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-5">
              {roadmap.map(([state, title, description], index) => (
                <li key={state} className="min-w-0 bg-background p-4">
                  <span className="font-mono text-[10px] text-primary">{String(index + 1).padStart(2, '0')}</span>
                  <h3 className="mt-3 break-words text-sm font-semibold">{title}</h3>
                  <p className="mt-2 break-words text-xs leading-6 text-muted-foreground">{description}</p>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}

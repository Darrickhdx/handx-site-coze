'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BarChart3,
  BookOpenCheck,
  Eye,
  Inbox,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  MousePointerClick,
  RefreshCw,
  Users,
} from 'lucide-react';

interface CountRow {
  count?: number;
  event_name?: string;
  path?: string;
  views?: number;
}

interface DailyRow {
  date: string;
  views: number;
}

interface MessageRow {
  id: string;
  occurred_at: string;
  status: 'pending';
  display_name: string;
  contact: string;
  body: string;
  related_path: string;
}

interface SourceQualityRow {
  channel: string;
  campaign: string;
  sessions: number;
  engaged: number;
  activation_rate: number;
}

interface FunnelRow {
  stage: string;
  label: string;
  sessions: number;
}

interface ContentPerformanceRow {
  content_id: string;
  entered: number;
  engaged: number;
  completed: number;
  continued: number;
  activation_rate: number;
  completion_rate: number;
}

interface RecentActivityRow {
  occurred_at: string;
  event_name: string;
  path: string;
  acquisition_channel: string;
  content_id: string;
  session_label: string;
}

interface InsightsResponse {
  ok: boolean;
  generated_at: string;
  storage_scope: string;
  window: {
    days: number;
    timezone: string;
    start_date: string;
    end_date: string;
    loaded_records: number;
    source_total_lines: number;
    truncated: boolean;
    invalid_lines: number;
    notice: string;
  };
  totals: {
    page_views: number;
    sessions: number;
    engaged_sessions: number;
    action_sessions: number;
    tracked_events: number;
    saved_messages: number;
    pages_per_session: number;
    action_rate: number;
  };
  top_pages: CountRow[];
  daily_page_views: DailyRow[];
  event_counts: CountRow[];
  source_quality: SourceQualityRow[];
  reading_funnel: FunnelRow[];
  content_performance: ContentPerformanceRow[];
}

interface InboxResponse {
  ok: boolean;
  storage_scope: string;
  messages: MessageRow[];
  recent_activity: RecentActivityRow[];
}

const emptyInsights: InsightsResponse = {
  ok: true,
  generated_at: '',
  storage_scope: 'local_private_runtime',
  window: {
    days: 30,
    timezone: 'Asia/Shanghai',
    start_date: '',
    end_date: '',
    loaded_records: 0,
    source_total_lines: 0,
    truncated: false,
    invalid_lines: 0,
    notice: '当前数据主要来自本机开发与验收，不代表真实受众。',
  },
  totals: {
    page_views: 0,
    sessions: 0,
    engaged_sessions: 0,
    action_sessions: 0,
    tracked_events: 0,
    saved_messages: 0,
    pages_per_session: 0,
    action_rate: 0,
  },
  top_pages: [],
  daily_page_views: [],
  event_counts: [],
  source_quality: [],
  reading_funnel: [],
  content_performance: [],
};

const channelLabels: Record<string, string> = {
  direct: '直接访问',
  internal: '站内进入',
  wechat: '微信',
  xiaohongshu: '小红书',
  douyin: '抖音',
  zhihu: '知乎',
  weibo: '微博',
  search: '搜索',
  newsletter: '邮件／订阅',
  qr: '二维码',
  other_referral: '其他外部来源',
  unknown: '旧版未分类',
};

const eventLabels: Record<string, string> = {
  page_view: '打开页面',
  reading_engaged: '达到有效阅读',
  reading_completed: '读到文章末尾',
  contact_started: '开始填写留言',
  private_message_submitted: '留言提交成功',
  article_attribution_copied: '复制规范署名',
  article_source_credit_opened: '打开文章来源',
};

function formatLocalTime(value: string): string {
  if (!value) return '刚刚';
  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export function LocalInsightsDashboard() {
  const [insights, setInsights] = useState<InsightsResponse>(emptyInsights);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [inboxToken, setInboxToken] = useState('');
  const [inboxLoading, setInboxLoading] = useState(false);
  const [inboxUnlocked, setInboxUnlocked] = useState(false);
  const [inboxError, setInboxError] = useState('');
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityRow[]>([]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/local/insights', { cache: 'no-store' });
      if (!response.ok) throw new Error('本机数据接口暂时不可用。');
      setInsights(await response.json() as InsightsResponse);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : '无法读取本机数据。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function unlockInbox(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setInboxLoading(true);
    setInboxError('');
    try {
      const response = await fetch('/api/local/inbox', {
        cache: 'no-store',
        headers: { Authorization: `Bearer ${inboxToken.trim()}` },
      });
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? '本机看板密钥不正确。'
            : '私密留言接口暂时不可用。',
        );
      }
      const inbox = await response.json() as InboxResponse;
      setMessages(inbox.messages);
      setRecentActivity(inbox.recent_activity);
      setInboxUnlocked(true);
      setInboxToken('');
    } catch (reason: unknown) {
      setInboxError(reason instanceof Error ? reason.message : '无法打开私密留言箱。');
    } finally {
      setInboxLoading(false);
    }
  }

  const maximumPageViews = useMemo(
    () => Math.max(1, ...insights.top_pages.map((row) => row.views ?? 0)),
    [insights.top_pages],
  );
  const maximumDailyViews = useMemo(
    () => Math.max(1, ...insights.daily_page_views.map((row) => row.views)),
    [insights.daily_page_views],
  );
  const funnelBase = Math.max(1, insights.reading_funnel[0]?.sessions ?? 0);

  const metricCards = [
    { label: '30 日页面浏览', value: insights.totals.page_views, icon: Eye },
    { label: '标签会话', value: insights.totals.sessions, icon: Users },
    { label: '有效阅读会话', value: insights.totals.engaged_sessions, icon: BookOpenCheck },
    { label: '已保存私密留言', value: insights.totals.saved_messages, icon: Inbox },
  ] as const;

  return (
    <div className="bg-[#f4f0e8]">
      <section className="border-b border-foreground/15 bg-[#202827] py-14 text-[#f3efe7] sm:py-10">
        <div className="personal-shell">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#8ea299]/40 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#b7c7bf] uppercase">
                <LockKeyhole className="size-3.5" aria-hidden="true" />
                只读 · 仅本机
              </div>
              <h1 className="mt-7 font-serif text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">
                访问与留言看板
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-[1.7] text-[#bdb9b0]">
                不保存 IP、原始浏览器标识或跨站 Cookie。普通访问行为与私密留言分开记录；
                留言不会自动公开。
              </p>
              <p className="mt-4 max-w-2xl text-xs leading-6 text-[#8f9d96]">
                口径：最近 {insights.window.days} 天 · {insights.window.timezone} · 浏览器标签会话。
                {insights.window.notice}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refresh()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 border border-white/25 px-5 text-sm font-semibold transition hover:bg-white hover:text-[#202827] disabled:cursor-wait disabled:opacity-60"
            >
              {loading
                ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                : <RefreshCw className="size-4" aria-hidden="true" />}
              刷新数据
            </button>
          </div>
          {error && (
            <p className="mt-6 border border-[#d5a09a]/40 bg-[#d5a09a]/10 p-4 text-sm text-[#f1aaa2]" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-px bg-foreground/15 sm:grid-cols-2 lg:grid-cols-4">
          {metricCards.map((metric) => {
            const Icon = metric.icon;
            return (
              <article key={metric.label} className="bg-[#f4f0e8] px-6 py-9 sm:px-8">
                <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <strong className="mt-8 block font-serif text-2xl font-semibold tracking-[-0.04em]">
                  {metric.value}
                </strong>
                <span className="mt-2 block text-xs tracking-[0.12em] text-muted-foreground uppercase">
                  {metric.label}
                </span>
              </article>
            );
          })}
        </div>
        <div className="personal-shell grid gap-4 border-t border-foreground/15 py-5 text-xs text-muted-foreground sm:grid-cols-3">
          <p>
            <strong className="mr-2 text-foreground">{insights.totals.pages_per_session}</strong>
            每标签会话浏览页数
          </p>
          <p>
            <strong className="mr-2 text-foreground">{insights.totals.action_rate}%</strong>
            发生关键操作的会话占比
          </p>
          <p>
            <strong className="mr-2 text-foreground">{insights.window.loaded_records}</strong>
            当前窗口内已载入事件
          </p>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-7 sm:py-10">
        <div className="personal-shell">
          <div className="flex flex-col gap-3 border-b border-foreground/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-3">
              <Activity className="size-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-xl font-semibold">30 日访问趋势</h2>
                <p className="mt-1 text-xs text-muted-foreground">按 Asia/Shanghai 自然日补齐零值</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {insights.window.start_date || '—'} → {insights.window.end_date || '—'}
            </p>
          </div>
          <div className="mt-8 flex h-48 items-end gap-1 border-b border-foreground/20 sm:gap-2">
            {insights.daily_page_views.map((row, index) => (
              <div
                key={row.date}
                className="group relative flex min-w-0 flex-1 items-end"
                title={`${row.date}：${row.views} 次浏览`}
              >
                <span
                  className="block w-full bg-primary/75 transition-colors group-hover:bg-primary"
                  style={{
                    height: `${row.views === 0 ? 2 : Math.max(6, (row.views / maximumDailyViews) * 100)}%`,
                  }}
                />
                {(index === 0 || index === insights.daily_page_views.length - 1) && (
                  <span className="absolute top-full mt-2 text-[9px] text-muted-foreground">
                    {row.date.slice(5)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {(insights.window.truncated || insights.window.invalid_lines > 0) && (
            <p className="mt-8 border border-[#8c6d2b]/25 bg-[#8c6d2b]/5 p-4 text-xs leading-6 text-[#6f551d]">
              数据质量提示：源日志共 {insights.window.source_total_lines} 行；
              {insights.window.truncated ? '当前只读取最近 5000 行。' : '未发生 5000 行截断。'}
              {insights.window.invalid_lines > 0
                ? ` 其中 ${insights.window.invalid_lines} 行无法解析，已跳过。`
                : ''}
            </p>
          )}
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-white/25 py-7 sm:py-10">
        <div className="personal-shell grid gap-14 lg:grid-cols-2 lg:gap-14">
          <article>
            <div className="border-b border-foreground/15 pb-5">
              <h2 className="font-serif text-xl font-semibold">来源质量</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                只保存预设渠道类别与非个人化活动编号，不保存完整 referrer
              </p>
            </div>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[28rem] border-collapse text-left text-xs">
                <thead className="text-muted-foreground">
                  <tr className="border-b border-foreground/15">
                    <th className="py-3 font-medium">来源</th>
                    <th className="py-3 font-medium">活动</th>
                    <th className="py-3 text-right font-medium">会话</th>
                    <th className="py-3 text-right font-medium">有效阅读</th>
                    <th className="py-3 text-right font-medium">激活率</th>
                  </tr>
                </thead>
                <tbody>
                  {insights.source_quality.map((row) => (
                    <tr key={`${row.channel}-${row.campaign}`} className="border-b border-foreground/10">
                      <td className="py-3 font-medium">{channelLabels[row.channel] ?? row.channel}</td>
                      <td className="py-3 font-mono text-[10px] text-muted-foreground">{row.campaign}</td>
                      <td className="py-3 text-right">{row.sessions}</td>
                      <td className="py-3 text-right">{row.engaged}</td>
                      <td className="py-3 text-right">{row.activation_rate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {insights.source_quality.length === 0 && (
                <p className="border border-dashed border-foreground/20 p-6 text-sm text-muted-foreground">
                  尚无可分类的来源会话。
                </p>
              )}
            </div>
          </article>

          <article>
            <div className="border-b border-foreground/15 pb-5">
                <h2 className="font-serif text-xl font-semibold">文章阅读路径</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  进入 → 有效阅读；“读到文末”和“继续探索”是有效阅读后的两个并行结果
              </p>
            </div>
            <div className="mt-6 space-y-5">
              {insights.reading_funnel.map((row) => (
                <div key={row.stage}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-medium">{row.label}</span>
                    <span className="text-muted-foreground">
                      {row.sessions} · {Math.round((row.sessions / funnelBase) * 100)}%
                    </span>
                  </div>
                  <div className="mt-2 h-2 bg-foreground/10">
                    <div
                      className="h-full bg-[#667d72]"
                      style={{ width: `${Math.max(row.sessions === 0 ? 0 : 4, (row.sessions / funnelBase) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-7 text-xs leading-6 text-muted-foreground">
              “有效阅读”要求页面在前台累计至少 20 秒且读到正文约 40%；
              “读到文末”还要求至少 45 秒并到达文章末端。“继续探索”不以完读为前提，
              因而它可能高于完读数。本站只记录里程碑，不保存精确滚动轨迹。
            </p>
          </article>
        </div>
      </section>

      <section className="py-7 sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-2 lg:gap-16">
          <article>
            <div className="flex items-center gap-3 border-b border-foreground/15 pb-5">
              <BarChart3 className="size-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-xl font-semibold">页面浏览排行</h2>
                <p className="mt-1 text-xs text-muted-foreground">只统计页面路径，不保留查询参数</p>
              </div>
            </div>
            <div className="mt-6 space-y-5">
              {insights.top_pages.length === 0 && (
                <p className="border border-dashed border-foreground/20 p-6 text-sm text-muted-foreground">
                  尚无浏览记录。打开几个页面后刷新即可看到。
                </p>
              )}
              {insights.top_pages.map((row) => (
                <div key={row.path}>
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="truncate font-medium">{row.path}</span>
                    <span className="text-muted-foreground">{row.views ?? 0}</span>
                  </div>
                  <div className="mt-2 h-1.5 bg-foreground/10">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.max(3, ((row.views ?? 0) / maximumPageViews) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article>
            <div className="flex items-center gap-3 border-b border-foreground/15 pb-5">
              <MousePointerClick className="size-5 text-primary" aria-hidden="true" />
              <div>
                <h2 className="font-serif text-xl font-semibold">关键操作</h2>
                <p className="mt-1 text-xs text-muted-foreground">来自页面上已标注的阅读与导航入口</p>
              </div>
            </div>
            <div className="mt-6 border-t border-foreground/15">
              {insights.event_counts.length === 0 && (
                <p className="border-x border-b border-dashed border-foreground/20 p-6 text-sm text-muted-foreground">
                  尚无操作记录。
                </p>
              )}
              {insights.event_counts.map((row) => (
                <div key={row.event_name} className="flex items-center justify-between gap-4 border-b border-foreground/15 py-3 text-sm">
                  <span className="truncate font-mono text-xs text-muted-foreground">{row.event_name}</span>
                  <strong>{row.count ?? 0}</strong>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-[#202827] py-14 text-[#f3efe7] sm:py-10">
        <div className="personal-shell">
          <div className="flex items-center gap-3 border-b border-white/15 pb-5">
            <BookOpenCheck className="size-5 text-[#d5a09a]" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-xl font-semibold">三篇内容的阅读质量</h2>
              <p className="mt-1 text-xs text-[#a9a59e]">“0”可能只是尚未达到里程碑，不代表内容没有价值</p>
            </div>
          </div>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[42rem] border-collapse text-left text-xs">
              <thead className="text-[#a9a59e]">
                <tr className="border-b border-white/15">
                  <th className="py-3 font-medium">内容</th>
                  <th className="py-3 text-right font-medium">进入</th>
                  <th className="py-3 text-right font-medium">有效阅读</th>
                  <th className="py-3 text-right font-medium">读到文末</th>
                  <th className="py-3 text-right font-medium">继续探索</th>
                  <th className="py-3 text-right font-medium">激活率</th>
                  <th className="py-3 text-right font-medium">完读率</th>
                </tr>
              </thead>
              <tbody>
                {insights.content_performance.map((row) => (
                  <tr key={row.content_id} className="border-b border-white/10">
                    <td className="py-3 font-medium">{row.content_id}</td>
                    <td className="py-3 text-right">{row.entered}</td>
                    <td className="py-3 text-right">{row.engaged}</td>
                    <td className="py-3 text-right">{row.completed}</td>
                    <td className="py-3 text-right">{row.continued}</td>
                    <td className="py-3 text-right">{row.activation_rate}%</td>
                    <td className="py-3 text-right">{row.completion_rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#ece4d8] py-7 sm:py-10">
        <div className="personal-shell">
          <div className="flex flex-col gap-4 border-b border-foreground/15 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Private inbox
              </p>
              <h2 className="mt-5 font-serif text-2xl font-semibold">待查看留言</h2>
            </div>
            <p className="max-w-xl text-xs leading-6 text-muted-foreground">
              当前为本机原型：只读展示，不提供公开发布、审批或自动回复。联系方式始终仅在本机显示。
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {!inboxUnlocked && (
              <form
                onSubmit={unlockInbox}
                className="border border-foreground/15 bg-[#f4f0e8] p-7 lg:col-span-2"
              >
                <div className="flex items-start gap-4">
                  <KeyRound className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="max-w-3xl">
                    <h3 className="font-serif text-lg font-semibold">私密内容需要本机看板密钥</h3>
                    <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                      访问统计可以直接查看；留言正文与回复方式另行保护。密钥保存在网站目录下的
                      <code className="mx-1 border border-foreground/15 bg-white/45 px-1.5 py-0.5 text-xs">
                        private-runtime/admin-token
                      </code>
                      文件中，只需本次粘贴，不会保存在浏览器。
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor="local-inbox-token">本机看板密钥</label>
                  <input
                    id="local-inbox-token"
                    type="password"
                    value={inboxToken}
                    onChange={(event) => setInboxToken(event.target.value)}
                    autoComplete="off"
                    required
                    minLength={32}
                    placeholder="粘贴本机看板密钥"
                    className="min-h-11 flex-1 border border-foreground/20 bg-white/55 px-3 text-sm outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
                  />
                  <button
                    type="submit"
                    disabled={inboxLoading}
                    className="inline-flex min-h-11 items-center justify-center gap-2 bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"
                  >
                    {inboxLoading
                      ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                      : <KeyRound className="size-4" aria-hidden="true" />}
                    打开留言箱
                  </button>
                </div>
                {inboxError && <p className="mt-3 text-xs text-destructive" role="alert">{inboxError}</p>}
              </form>
            )}

            {inboxUnlocked && messages.length === 0 && (
              <p className="border border-dashed border-foreground/20 bg-[#f4f0e8] p-8 text-sm text-muted-foreground lg:col-span-2">
                留言箱还是空的。可以在“关于我”页面提交一条测试留言。
              </p>
            )}
            {inboxUnlocked && messages.map((message) => (
              <article key={message.id} className="border border-foreground/15 bg-[#f4f0e8] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold">{message.display_name}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{formatLocalTime(message.occurred_at)}</p>
                  </div>
                  <span className="border border-[#8c6d2b]/30 px-2 py-1 text-[10px] text-[#8c6d2b] uppercase">
                    pending
                  </span>
                </div>
                <p className="mt-5 whitespace-pre-wrap text-sm leading-[1.7]">{message.body}</p>
                <div className="mt-5 border-t border-foreground/15 pt-4 text-xs leading-6 text-muted-foreground">
                  <p>关联页面：{message.related_path}</p>
                  <p>回复方式：{message.contact || '未留下'}</p>
                </div>
              </article>
            ))}
          </div>

          {inboxUnlocked && (
            <div className="mt-12">
              <div className="flex flex-col gap-3 border-b border-foreground/15 pb-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h3 className="font-serif text-xl font-semibold">最近访问记录</h3>
                  <p className="mt-2 text-xs text-muted-foreground">
                    只在密钥解锁后显示；S01 等临时编号每次刷新重新生成，不返回会话哈希。
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">最近 {recentActivity.length} 条</span>
              </div>
              <div className="mt-5 overflow-x-auto">
                <table className="w-full min-w-[44rem] border-collapse text-left text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-foreground/15">
                      <th className="py-3 font-medium">时间</th>
                      <th className="py-3 font-medium">标签会话</th>
                      <th className="py-3 font-medium">动作</th>
                      <th className="py-3 font-medium">页面</th>
                      <th className="py-3 font-medium">来源</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentActivity.map((row, index) => (
                      <tr key={`${row.occurred_at}-${row.event_name}-${index}`} className="border-b border-foreground/10">
                        <td className="py-3 text-muted-foreground">{formatLocalTime(row.occurred_at)}</td>
                        <td className="py-3 font-mono text-[10px]">{row.session_label}</td>
                        <td className="py-3">{eventLabels[row.event_name] ?? row.event_name}</td>
                        <td className="py-3 font-mono text-[10px] text-muted-foreground">{row.path}</td>
                        <td className="py-3">{channelLabels[row.acquisition_channel] ?? row.acquisition_channel}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {recentActivity.length === 0 && (
                  <p className="border border-dashed border-foreground/20 p-6 text-sm text-muted-foreground">
                    尚无访问记录。
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <footer className="py-8">
        <div className="personal-shell flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>数据区：{insights.storage_scope}</p>
          <p>最近刷新：{formatLocalTime(insights.generated_at)}</p>
        </div>
      </footer>
    </div>
  );
}

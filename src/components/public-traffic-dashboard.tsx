'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, LoaderCircle, RefreshCw } from 'lucide-react';

/**
 * Read-only view of the public site's traffic, for the owner.
 *
 * Lives in the workbench, which is loopback-only. It reads a snapshot written
 * by tools/sync-public-traffic.mjs rather than calling the public site: the
 * workbench CSP is connect-src 'self' and its source is asserted to make no
 * network calls, so the egress belongs in tools/.
 */

interface Row {
  day: string;
  path: string;
  views: string | number;
  visitors: string | number;
}

interface Snapshot {
  rows?: Row[];
  synced_at?: string;
  origin?: string;
  status?: string;
}

export function PublicTrafficDashboard() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  // Reads the snapshot written by tools/sync-public-traffic.mjs. The workbench
  // cannot fetch the public site itself: its CSP is connect-src 'self' and its
  // source is asserted to make no network calls.
  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/local/public-traffic', { cache: 'no-store' });
      const data = (await response.json()) as Snapshot;
      setRows(Array.isArray(data.rows) ? data.rows : []);
      setSyncedAt(data.synced_at ?? null);
      setNote(
        data.status === 'never_synced'
          ? '还没有同步过。运行下面那条命令，然后点重新读取。'
          : data.status === 'unreadable'
            ? '快照文件读不出来，重新同步一次。'
            : '',
      );
      setStatus('idle');
    } catch {
      setStatus('error');
      setNote('读取本机快照失败。');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    if (!rows) return null;
    const byPath = new Map<string, { views: number; visitors: number }>();
    const byDay = new Map<string, number>();
    let views = 0;
    for (const row of rows) {
      const v = Number(row.views) || 0;
      const u = Number(row.visitors) || 0;
      views += v;
      const path = byPath.get(row.path) ?? { views: 0, visitors: 0 };
      byPath.set(row.path, { views: path.views + v, visitors: path.visitors + u });
      const day = row.day.slice(0, 10);
      byDay.set(day, (byDay.get(day) ?? 0) + v);
    }
    return {
      views,
      paths: [...byPath.entries()].sort((a, b) => b[1].views - a[1].views).slice(0, 20),
      days: [...byDay.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [rows]);

  const peak = summary?.days.reduce((max, [, v]) => Math.max(max, v), 0) ?? 0;

  return (
    <div className="personal-shell py-8">
      <p className="story-kicker">Owner only</p>
      <h1 className="personal-heading mt-3">公开站访问情况</h1>
      <p className="mt-4 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
        数据来自公开站的第一方记录：没有 IP、没有 UA、没有原始来源地址。
        访客数是按会话哈希去重的，同一个人换浏览器会算两次。
      </p>

      <div className="mt-6 border border-foreground/15 bg-card p-4">
        <p className="text-sm font-semibold">先同步一次快照</p>
        <pre className="mt-2 overflow-x-auto border border-foreground/10 bg-background p-3 text-xs">
{`ANALYTICS_READ_TOKEN=<你的令牌> node tools/sync-public-traffic.mjs`}
        </pre>
        <p className="mt-2 text-xs leading-6 text-muted-foreground">
          令牌在 Coze 项目的环境变量里（ANALYTICS_READ_TOKEN）。同步会把线上数据写到
          private-runtime/public-traffic.json，这个目录不进 Git。
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void load()}
            disabled={status === 'loading'}
            className="story-button story-button-secondary disabled:opacity-60"
          >
            {status === 'loading' ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <RefreshCw className="size-4" aria-hidden="true" />
            )}
            重新读取
          </button>
          {syncedAt && (
            <span className="text-xs text-muted-foreground">
              快照时间：{new Date(syncedAt).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
        {note && <p className="mt-3 text-sm text-amber-900">{note}</p>}
      </div>

      {summary && (
        <>
          <div className="mt-8 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
            <div className="bg-background p-5">
              <p className="font-serif text-3xl font-semibold text-primary">{summary.views}</p>
              <p className="mt-2 text-sm text-muted-foreground">30 天内页面浏览</p>
            </div>
            <div className="bg-background p-5">
              <p className="font-serif text-3xl font-semibold text-primary">
                {summary.paths.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">被访问过的页面</p>
            </div>
            <div className="bg-background p-5">
              <p className="font-serif text-3xl font-semibold text-primary">
                {summary.days.length}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">有访问的天数</p>
            </div>
          </div>

          {summary.days.length > 0 && (
            <section className="mt-8">
              <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
                <BarChart3 className="size-4 text-primary" aria-hidden="true" />
                每天浏览量
              </h2>
              <ul className="mt-4 grid gap-1.5">
                {summary.days.map(([day, views]) => (
                  <li key={day} className="flex items-center gap-3 text-sm">
                    <span className="w-24 shrink-0 font-mono text-xs text-muted-foreground">
                      {day}
                    </span>
                    <span
                      className="h-4 bg-primary/70"
                      style={{ width: `${peak ? Math.max(2, (views / peak) * 100) : 0}%` }}
                      aria-hidden="true"
                    />
                    <span className="shrink-0 tabular-nums">{views}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-8">
            <h2 className="font-serif text-lg font-semibold">最常被打开的页面</h2>
            <dl className="mt-4 grid gap-px border border-foreground/15 bg-foreground/15">
              {summary.paths.map(([path, stat]) => (
                <div key={path} className="flex items-baseline gap-4 bg-background p-3">
                  <dt className="flex-1 truncate font-mono text-xs">{path}</dt>
                  <dd className="shrink-0 text-sm tabular-nums">
                    {stat.views} 次
                    <span className="ml-3 text-muted-foreground">{stat.visitors} 人</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        </>
      )}

      {rows?.length === 0 && (
        <p className="mt-8 text-[15px] leading-[1.7] text-muted-foreground">
          还没有记录。公开站有人访问之后，这里就会有数据。
        </p>
      )}
    </div>
  );
}

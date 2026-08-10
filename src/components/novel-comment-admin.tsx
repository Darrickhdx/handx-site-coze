'use client';

import { useCallback, useState } from 'react';
import {
  Check,
  LoaderCircle,
  RefreshCcw,
  ShieldAlert,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { decodeEscapedCommentText } from '@/lib/comment-text';

type CommentStatus = 'pending' | 'approved' | 'rejected' | 'spam' | 'withdrawn';
type ModerationAction = Exclude<CommentStatus, 'pending'>;

interface InboxComment {
  id: string;
  occurred_at: string;
  chapter_id: string;
  display_name: string;
  body: string;
  status: CommentStatus;
  moderated_at?: string;
}

interface RepositoryHealth {
  healthy: boolean;
  fail_closed: boolean;
  invalid_submission_lines: number;
  invalid_event_lines: number;
  submission_bytes: number;
  event_bytes: number;
  notice: string;
}

const labels: Record<CommentStatus, string> = {
  pending: '待审核',
  approved: '已批准',
  rejected: '已拒绝',
  spam: '垃圾',
  withdrawn: '已撤回',
};

export function NovelCommentAdmin() {
  const [token, setToken] = useState('');
  const [comments, setComments] = useState<InboxComment[]>([]);
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle');
  const [message, setMessage] = useState(
    '管理员令牌只保存在本页内存中，刷新或离开页面后即清除。',
  );
  const [busyId, setBusyId] = useState('');
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [totalPending, setTotalPending] = useState(0);
  const [health, setHealth] = useState<RepositoryHealth | null>(null);

  const lockConsole = useCallback(() => {
    setToken('');
    setComments([]);
    setNextCursor(null);
    setTotalPending(0);
    setHealth(null);
    setStatus('idle');
    setMessage('审核台已锁定，内存中的令牌和队列都已清除。');
  }, []);

  const loadInbox = useCallback(async (cursor = '0', append = false) => {
    if (!token.trim()) {
      setComments([]);
      setStatus('error');
      setMessage('请输入本机管理员令牌。');
      return;
    }
    setStatus('loading');
    setMessage('正在读取本机审核队列…');
    try {
      const response = await fetch(
        `/api/local/novel-comments/inbox?status=${filter}&cursor=${encodeURIComponent(cursor)}&limit=50`,
        {
          headers: { Authorization: `Bearer ${token.trim()}` },
          cache: 'no-store',
        },
      );
      const payload = (await response.json()) as {
        comments?: InboxComment[];
        total?: number;
        total_pending?: number;
        next_cursor?: string | null;
        truncated?: boolean;
        health?: RepositoryHealth;
        error?: string;
      };
      if (!response.ok || !Array.isArray(payload.comments)) {
        throw new Error(
          payload.error === 'admin_token_required'
            ? '管理员令牌不正确。'
            : '审核队列读取失败。',
        );
      }
      setComments((current) =>
        append ? [...current, ...payload.comments!] : payload.comments!,
      );
      setNextCursor(payload.next_cursor ?? null);
      setTotalPending(payload.total_pending ?? 0);
      setHealth(payload.health ?? null);
      setStatus('ready');
      setMessage(
        `已读取 ${append ? comments.length + payload.comments.length : payload.comments.length}／${payload.total ?? payload.comments.length} 条；待审核 ${payload.total_pending ?? 0} 条。`,
      );
    } catch (error: unknown) {
      setComments([]);
      setNextCursor(null);
      setHealth(null);
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : '审核队列读取失败。',
      );
    }
  }, [comments.length, filter, token]);

  async function moderate(commentId: string, action: ModerationAction) {
    setBusyId(commentId);
    setMessage(`正在写入“${labels[action]}”事件…`);
    try {
      const response = await fetch('/api/local/novel-comments/moderate', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ comment_id: commentId, action }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(
          payload.error === 'admin_token_required'
            ? '管理员令牌不正确。'
            : '审核事件没有保存成功。',
        );
      }
      setComments((current) =>
        filter === 'pending'
          ? current.filter((comment) => comment.id !== commentId)
          : current.map((comment) =>
              comment.id === commentId
                ? { ...comment, status: action }
                : comment,
            ),
      );
      if (filter === 'pending') {
        setTotalPending((current) => Math.max(0, current - 1));
      }
      setStatus('ready');
      setMessage(`事件已追加：${labels[action]}。原投稿不会被覆盖或删除。`);
    } catch (error: unknown) {
      setStatus('error');
      setMessage(
        error instanceof Error ? error.message : '审核事件没有保存成功。',
      );
    } finally {
      setBusyId('');
    }
  }

  return (
    <div className="personal-shell py-8 sm:py-8">
      <section className="grid gap-8 border-b border-foreground/15 pb-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <div>
          <p className="story-kicker">Owner only · local runtime</p>
          <h1 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.05em] sm:text-2xl">
            小说评论审核
          </h1>
        </div>
        <div>
          <p className="text-sm leading-[1.7] text-muted-foreground">
            投稿正文和审核事件分别追加保存。批准、拒绝、垃圾与撤回不会覆盖原投稿；
            对外章节接口始终只返回当前状态为“已批准”的内容。
          </p>
          <div className="mt-5 flex items-start gap-3 border border-candidate/25 bg-candidate/5 p-4 text-xs leading-6 text-muted-foreground">
            <ShieldAlert
              className="mt-0.5 size-4 shrink-0 text-candidate"
              aria-hidden="true"
            />
            <p>
              评论只是读者意见。审核通过仅代表适合显示，不代表史实核验，也不得导入知识图谱、
              专题证据或媒体事实卡。
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8 border border-foreground/15 bg-card p-5 sm:p-7">
        <label className="grid gap-2 text-xs text-muted-foreground">
          本机管理员令牌
          <input
            type="password"
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              setComments([]);
              setNextCursor(null);
              setTotalPending(0);
              setHealth(null);
              setStatus('idle');
              setMessage('令牌已变化，请重新读取审核队列。');
            }}
            autoComplete="off"
            spellCheck={false}
            className="min-h-11 border border-foreground/20 bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-primary"
          />
        </label>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <select
              value={filter}
              onChange={(event) => {
                setFilter(event.target.value as 'pending' | 'all');
                setComments([]);
                setNextCursor(null);
                setStatus('idle');
                setMessage('筛选已改变，请重新读取审核队列。');
              }}
              className="min-h-11 border border-foreground/20 bg-background px-3 text-xs font-semibold"
              aria-label="审核队列筛选"
            >
              <option value="pending">只看待审核</option>
              <option value="all">全部状态</option>
            </select>
            <button
              type="button"
              onClick={() => void loadInbox('0', false)}
              disabled={status === 'loading'}
              className="story-button story-button-primary disabled:cursor-wait disabled:opacity-60"
            >
              {status === 'loading' ? (
                <LoaderCircle
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <RefreshCcw className="size-4" aria-hidden="true" />
              )}
              读取审核队列
            </button>
            <button
              type="button"
              onClick={lockConsole}
              className="story-button story-button-secondary"
            >
              锁定并清除
            </button>
          </div>
          <p
            role="status"
            className={`text-xs leading-6 ${
              status === 'error' ? 'text-destructive' : 'text-muted-foreground'
            }`}
          >
            {message}
          </p>
        </div>
      </section>

      {health && (
        <section
          className={`mt-6 border p-4 text-xs leading-6 ${
            health.healthy
              ? 'border-confirmed/25 bg-confirmed/5 text-muted-foreground'
              : 'border-destructive/35 bg-destructive/5 text-destructive'
          }`}
          role="status"
        >
          <strong className="block">
            日志健康：{health.healthy ? '正常' : '失败关闭'}
          </strong>
          <span>{health.notice}</span>
          <span className="mt-1 block font-mono text-[10px]">
            submission={health.submission_bytes}B · event={health.event_bytes}B
            · invalid={health.invalid_submission_lines}/
            {health.invalid_event_lines}
          </span>
        </section>
      )}

      {status === 'ready' && comments.length === 0 && (
        <p className="mt-8 border border-dashed border-foreground/20 p-8 text-center text-sm text-muted-foreground">
          审核队列目前为空。
        </p>
      )}

      {comments.length > 0 && (
        <ol className="mt-8 grid gap-4">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="border border-foreground/15 bg-card p-5 sm:p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <strong>
                    {decodeEscapedCommentText(comment.display_name)}
                  </strong>
                  <span className="font-mono text-primary">
                    {comment.chapter_id}
                  </span>
                  <span className="border border-foreground/15 px-2 py-1 text-[10px] text-muted-foreground">
                    {labels[comment.status]}
                  </span>
                </div>
                <time
                  dateTime={comment.occurred_at}
                  className="text-[10px] text-muted-foreground"
                >
                  {new Date(comment.occurred_at).toLocaleString('zh-CN')}
                </time>
              </div>
              <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-[1.7]">
                {decodeEscapedCommentText(comment.body)}
              </p>
              <div className="mt-6 flex flex-wrap gap-2 border-t border-foreground/10 pt-4">
                {(
                  [
                    ['approved', '批准', Check],
                    ['rejected', '拒绝', X],
                    ['spam', '垃圾', Trash2],
                    ['withdrawn', '撤回', Undo2],
                  ] as const
                ).map(([action, label, Icon]) => (
                  <button
                    key={action}
                    type="button"
                    disabled={busyId === comment.id}
                    onClick={() => void moderate(comment.id, action)}
                    className="inline-flex min-h-10 items-center gap-2 border border-foreground/20 bg-background px-3 text-xs font-semibold transition hover:border-primary disabled:cursor-wait disabled:opacity-50"
                  >
                    {busyId === comment.id ? (
                      <LoaderCircle
                        className="size-3.5 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Icon className="size-3.5" aria-hidden="true" />
                    )}
                    {label}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}

      {nextCursor && (
        <div className="mt-6 flex items-center justify-between gap-4 border-t border-foreground/15 pt-6">
          <p className="text-xs text-muted-foreground">
            仍有更多记录；待审核共 {totalPending} 条，旧 pending 不会被已处理记录挤出。
          </p>
          <button
            type="button"
            onClick={() => void loadInbox(nextCursor, true)}
            disabled={status === 'loading'}
            className="story-button story-button-secondary disabled:cursor-wait disabled:opacity-60"
          >
            {status === 'loading' ? (
              <LoaderCircle
                className="size-4 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <RefreshCcw className="size-4" aria-hidden="true" />
            )}
            加载更多
          </button>
        </div>
      )}
    </div>
  );
}

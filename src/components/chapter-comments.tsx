'use client';

import { isPublicEdition } from '@/lib/edition';
import { PublicChapterComments } from '@/components/public-chapter-comments';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  CheckCircle2,
  LoaderCircle,
  MessageSquareText,
  RefreshCcw,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { decodeEscapedCommentText } from '@/lib/comment-text';
import { getLocalSessionId } from '@/lib/local-engagement';

interface ApprovedComment {
  id: string;
  occurred_at: string;
  chapter_id: string;
  display_name: string;
  body: string;
  status: 'approved';
}

type LoadState = 'loading' | 'ready' | 'error';
type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function readableDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function ChapterComments({
  chapterId,
  chapterTitle,
}: {
  chapterId: string;
  chapterTitle: string;
}) {
  const [comments, setComments] = useState<ApprovedComment[]>([]);
  const [commentsTruncated, setCommentsTruncated] = useState(false);
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [notice, setNotice] = useState('');

  const loadComments = useCallback(async (signal?: AbortSignal) => {
    setLoadState('loading');
    setComments([]);
    setCommentsTruncated(false);
    try {
      const response = await fetch(
        `/api/local/novel-comments?chapter=${encodeURIComponent(chapterId)}`,
        { cache: 'no-store', signal },
      );
      const payload = (await response.json()) as {
        chapter_id?: string;
        comments?: ApprovedComment[];
        truncated?: boolean;
      };
      if (
        !response.ok ||
        payload.chapter_id !== chapterId ||
        !Array.isArray(payload.comments) ||
        payload.comments.some(
          (comment) => comment.chapter_id !== chapterId,
        )
      ) {
        throw new Error('comments_unavailable');
      }
      setComments(payload.comments);
      setCommentsTruncated(payload.truncated === true);
      setLoadState('ready');
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      setLoadState('error');
    }
  }, [chapterId]);

  useEffect(() => {
    const controller = new AbortController();
    void loadComments(controller.signal);
    return () => controller.abort();
  }, [loadComments]);

  async function submitComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSubmitState('submitting');
    setNotice('正在保存到本机审核队列…');

    try {
      const response = await fetch('/api/local/novel-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          display_name: fields.get('display_name'),
          body: fields.get('body'),
          website: fields.get('website'),
          consent: fields.get('consent') === 'on',
          session_id: getLocalSessionId(),
        }),
      });
      const payload = (await response.json()) as {
        notice?: string;
        error?: string;
      };
      if (!response.ok) {
        const messages: Record<string, string> = {
          rate_limited: '提交次数较多，请稍后再试。',
          duplicate_comment: '这条意见已经进入审核队列，请不要重复提交。',
          invalid_comment_contract: '请检查正文长度、链接数量与同意选项。',
        };
        throw new Error(
          messages[payload.error ?? ''] ?? '评论没有保存成功，请稍后再试。',
        );
      }
      form.reset();
      setSubmitState('success');
      setNotice(
        payload.notice ?? '评论已进入审核队列；批准前不会出现在章节页面。',
      );
    } catch (error: unknown) {
      setSubmitState('error');
      setNotice(
        error instanceof Error
          ? error.message
          : '评论没有保存成功，请稍后再试。',
      );
    }
  }

  // Comments are backed by the loopback-only runtime. The public edition has no
  // comment store yet, so it says so rather than presenting a form that fails.
  // The public edition stores comments in a Feishu Bitable, where the owner
  // moderates them; the workbench keeps its loopback NDJSON store below.
  if (isPublicEdition) {
    return <PublicChapterComments chapterId={chapterId} chapterTitle={chapterTitle} />;
  }

  return (
    <section
      aria-labelledby="chapter-comments-title"
      className="border-t border-foreground/15 bg-[#f4f0e8]"
    >
      <div className="personal-shell py-8 sm:py-8">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(28rem,1.22fr)] lg:gap-16">
          <div>
            <p className="story-kicker">Reader discussion</p>
            <h2
              id="chapter-comments-title"
              className="mt-4 font-serif text-2xl font-semibold tracking-[-0.04em]"
            >
              谈谈“{chapterTitle}”
            </h2>
            <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">
              所有评论先保存在本机审核队列，只有管理员批准后才会显示。评论属于读者意见，
              不会自动变成知识图谱主张、历史来源或专题证据。
            </p>
            <div className="mt-6 flex items-start gap-3 border border-primary/20 bg-primary/5 p-4 text-xs leading-6 text-muted-foreground">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />
              <p>
                不采集 IP 和 User-Agent；正文限制 2—1000 字。请不要提交私人联系方式、
                未获授权的家属材料或针对真人的未经核验指控。详见
                <Link
                  href="/privacy"
                  className="ml-1 text-foreground underline decoration-foreground/25 underline-offset-4"
                >
                  隐私说明
                </Link>
                。
              </p>
            </div>
          </div>

          <form
            onSubmit={submitComment}
            className="border border-foreground/15 bg-card p-5 sm:p-7"
            aria-label={`提交对${chapterTitle}的读者意见`}
          >
            <label className="grid gap-2 text-xs text-muted-foreground">
              你的称呼（可选）
              <input
                name="display_name"
                maxLength={40}
                autoComplete="name"
                placeholder="匿名读者"
                className="min-h-11 border border-foreground/20 bg-background px-3 text-sm text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </label>
            <label className="mt-5 grid gap-2 text-xs text-muted-foreground">
              评论正文
              <textarea
                name="body"
                required
                minLength={2}
                maxLength={1000}
                rows={6}
                placeholder="你被哪个细节打动？哪里仍让你困惑？"
                className="resize-y border border-foreground/20 bg-background px-3 py-3 text-sm leading-[1.7] text-foreground outline-none transition placeholder:text-muted-foreground/60 focus:border-primary"
              />
            </label>
            <label className="sr-only" aria-hidden="true">
              网站
              <input name="website" tabIndex={-1} autoComplete="off" />
            </label>
            <label className="mt-5 flex items-start gap-3 text-xs leading-6 text-muted-foreground">
              <input
                type="checkbox"
                name="consent"
                required
                className="mt-1 size-4 shrink-0 accent-primary"
              />
              <span>
                我同意本站在本机私有存储中保存本次评论及审核状态，并理解它不会自动公开。
              </span>
            </label>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={submitState === 'submitting'}
                className="story-button story-button-primary disabled:cursor-wait disabled:opacity-60"
              >
                {submitState === 'submitting' ? (
                  <LoaderCircle
                    className="size-4 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                提交审核
              </button>
              {notice && (
                <p
                  role="status"
                  className={`flex max-w-sm items-start gap-2 text-xs leading-6 ${
                    submitState === 'error'
                      ? 'text-destructive'
                      : 'text-muted-foreground'
                  }`}
                >
                  {submitState === 'success' && (
                    <CheckCircle2
                      className="mt-1 size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  )}
                  {notice}
                </p>
              )}
            </div>
          </form>
        </div>

        <div className="mt-12 border-t border-foreground/15 pt-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <MessageSquareText
                className="size-5 text-primary"
                aria-hidden="true"
              />
              <h3 className="font-serif text-lg font-semibold">
                已通过审核的评论
              </h3>
            </div>
            <button
              type="button"
              onClick={() => void loadComments()}
              className="inline-flex min-h-10 items-center gap-2 border border-foreground/20 px-3 text-xs font-semibold"
            >
              <RefreshCcw className="size-3.5" aria-hidden="true" />
              刷新
            </button>
          </div>

          {loadState === 'loading' && (
            <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
              正在读取本机评论…
            </p>
          )}
          {loadState === 'error' && (
            <p className="mt-6 text-sm text-destructive">
              暂时无法读取评论，请确认本地服务仍在运行。
            </p>
          )}
          {loadState === 'ready' && comments.length === 0 && (
            <p className="mt-6 border border-dashed border-foreground/20 p-6 text-sm text-muted-foreground">
              这一章还没有通过审核的评论。你可以成为第一个提交意见的人。
            </p>
          )}
          {loadState === 'ready' && comments.length > 0 && (
            <ol className="mt-6 grid gap-4">
              {comments.map((comment) => (
                <li
                  key={comment.id}
                  className="border border-foreground/15 bg-card p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <strong>
                    {decodeEscapedCommentText(comment.display_name)}
                  </strong>
                    <time
                      dateTime={comment.occurred_at}
                      className="text-muted-foreground"
                    >
                      {readableDate(comment.occurred_at)}
                    </time>
                  </div>
                  <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-[1.7] text-foreground/85">
                    {decodeEscapedCommentText(comment.body)}
                  </p>
                </li>
              ))}
            </ol>
          )}
          {loadState === 'ready' && commentsTruncated && (
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              当前只显示最近 100 条已批准评论；完整记录仍保存在本机审核日志中。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

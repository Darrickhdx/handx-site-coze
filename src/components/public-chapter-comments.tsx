'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, MessageSquareText, Send } from 'lucide-react';
import { getLocalSessionId } from '@/lib/local-engagement';

/**
 * Reader comments on the public edition.
 *
 * Submissions go to a Feishu Bitable and are invisible until the owner changes
 * the row's status there. This component never learns whether a comment was
 * approved — it only ever renders what the server says is already published.
 */

interface ApprovedComment {
  id: string;
  displayName: string;
  body: string;
  submittedAt: string;
}

type Submission =
  | { state: 'idle' }
  | { state: 'sending' }
  | { state: 'done'; message: string }
  | { state: 'error'; message: string };

const ERROR_MESSAGES: Record<string, string> = {
  invalid_body: '留言太短或太长了（2–2000 字）。',
  links_not_allowed: '留言里不要放链接——放出来的每条我都要先看过。',
  rate_limited: '你刚提交过几条，先歇一会儿再来。',
  not_configured: '留言功能还没接通，先写信给我吧。',
  unavailable: '留言没能送出去，晚点再试一次。',
};

export function PublicChapterComments({
  chapterId,
  chapterTitle,
}: {
  chapterId: string;
  chapterTitle: string;
}) {
  const [comments, setComments] = useState<ApprovedComment[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [submission, setSubmission] = useState<Submission>({ state: 'idle' });

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/site/comments?chapter=${encodeURIComponent(chapterId)}`,
        { cache: 'no-store' },
      );
      if (!response.ok) return;
      const data = (await response.json()) as { comments?: ApprovedComment[] };
      setComments(Array.isArray(data.comments) ? data.comments : []);
    } catch {
      // A comment backend being down must not affect reading the chapter.
    } finally {
      setLoaded(true);
    }
  }, [chapterId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    const sessionId = getLocalSessionId();
    if (!sessionId) {
      setSubmission({ state: 'error', message: '浏览器会话不可用，无法提交。' });
      return;
    }
    setSubmission({ state: 'sending' });
    try {
      const response = await fetch('/api/site/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chapter_id: chapterId,
          chapter_title: chapterTitle,
          display_name: String(fields.get('display_name') ?? ''),
          body: String(fields.get('body') ?? ''),
          session_id: sessionId,
        }),
      });
      if (response.status === 201) {
        form.reset();
        setSubmission({
          state: 'done',
          message: '收到了。我看过之后会放出来，可能要等一会儿。',
        });
        return;
      }
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      setSubmission({
        state: 'error',
        message: ERROR_MESSAGES[data.error ?? ''] ?? '提交失败，晚点再试。',
      });
    } catch {
      setSubmission({ state: 'error', message: '网络不通，留言没能送出去。' });
    }
  }

  return (
    <section
      aria-labelledby="chapter-comments-title"
      className="border-t border-foreground/15 bg-[#f4f0e8]"
    >
      <div className="personal-shell grid gap-8 py-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-12">
        <div>
          <p className="story-kicker">Reader discussion</p>
          <h2
            id="chapter-comments-title"
            className="mt-3 font-serif text-2xl font-semibold tracking-[-0.04em]"
          >
            读完这一章，你想说什么？
          </h2>
          <p className="mt-4 text-[15px] leading-[1.7] text-muted-foreground">
            留言我会先看过再放出来。它们不会被当成史料，也不会写进人物关系——
            这里是读者的地方，不是研究库。
          </p>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">称呼（可留空）</span>
              <input
                name="display_name"
                maxLength={40}
                autoComplete="off"
                placeholder="匿名读者"
                className="border border-foreground/20 bg-background px-3 py-2 text-[15px] outline-none focus:border-primary"
              />
            </label>
            <label className="grid gap-1.5 text-sm">
              <span className="font-semibold">想说的话</span>
              <textarea
                name="body"
                required
                minLength={2}
                maxLength={2000}
                rows={5}
                className="border border-foreground/20 bg-background px-3 py-2 text-[15px] leading-[1.7] outline-none focus:border-primary"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={submission.state === 'sending'}
                className="story-button story-button-primary disabled:opacity-60"
              >
                {submission.state === 'sending' ? (
                  <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                提交留言
              </button>
              {submission.state === 'done' && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-800">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  {submission.message}
                </span>
              )}
              {submission.state === 'error' && (
                <span className="text-sm text-amber-900">{submission.message}</span>
              )}
            </div>
          </form>
        </div>

        <div>
          <p className="flex items-center gap-2 text-sm font-semibold">
            <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
            已发布的留言
            {loaded && comments.length > 0 && (
              <span className="text-muted-foreground">（{comments.length}）</span>
            )}
          </p>
          {!loaded && <p className="mt-4 text-sm text-muted-foreground">正在加载…</p>}
          {loaded && comments.length === 0 && (
            <p className="mt-4 text-[15px] leading-[1.7] text-muted-foreground">
              这一章还没有已发布的留言。第一条可以是你的。
            </p>
          )}
          <ul className="mt-4 grid gap-px bg-foreground/15">
            {comments.map((comment) => (
              <li key={comment.id} className="bg-background p-4">
                <p className="text-sm font-semibold">{comment.displayName}</p>
                <p className="mt-2 text-[15px] leading-[1.7] whitespace-pre-wrap">
                  {comment.body}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

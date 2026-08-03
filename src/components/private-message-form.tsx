'use client';

import Link from 'next/link';
import { FormEvent, useRef, useState } from 'react';
import { CheckCircle2, LoaderCircle, Send } from 'lucide-react';
import { getLocalSessionId, sendLocalAnalytics } from '@/lib/local-engagement';

type SubmissionState =
  | { status: 'idle'; message: string }
  | { status: 'submitting'; message: string }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export function PrivateMessageForm() {
  const contactStarted = useRef(false);
  const [submission, setSubmission] = useState<SubmissionState>({
    status: 'idle',
    message: '',
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fields = new FormData(form);
    setSubmission({ status: 'submitting', message: '正在保存到本机留言箱…' });

    try {
      const response = await fetch('/api/local/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: fields.get('display_name'),
          contact: fields.get('contact'),
          body: fields.get('body'),
          website: fields.get('website'),
          consent: fields.get('consent') === 'on',
          related_path: window.location.pathname,
          session_id: getLocalSessionId(),
        }),
      });
      const result = await response.json() as { notice?: string; error?: string };
      if (!response.ok) {
        throw new Error(
          result.error === 'rate_limited'
            ? '提交次数较多，请稍后再试。'
            : '留言没有保存成功，请检查内容后重试。',
        );
      }

      form.reset();
      setSubmission({
        status: 'success',
        message: result.notice ?? '留言已保存，不会自动公开。',
      });
      sendLocalAnalytics('private_message_submitted', window.location.pathname, {
        content_id: 'about',
        content_type: 'profile',
      });
    } catch (error: unknown) {
      setSubmission({
        status: 'error',
        message: error instanceof Error ? error.message : '留言没有保存成功，请稍后再试。',
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={() => {
        if (contactStarted.current) return;
        contactStarted.current = true;
        sendLocalAnalytics('contact_started', window.location.pathname, {
          content_id: 'about',
          content_type: 'profile',
        });
      }}
      className="border border-white/15 bg-white/[0.04] p-5 sm:p-7"
      aria-label="给鉴真小秃驴留言"
    >
      <div className="flex items-start justify-between gap-5 border-b border-white/15 pb-5">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#d5a09a] uppercase">
            Private message
          </p>
          <h3 className="mt-2 font-serif text-2xl font-semibold">给我留一句话</h3>
        </div>
        <span className="border border-[#8ea299]/35 px-2 py-1 text-[10px] tracking-[0.12em] text-[#b7c7bf] uppercase">
          仅本机可见
        </span>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-xs text-[#c8c4bc]">
          你的称呼（可选）
          <input
            name="display_name"
            maxLength={40}
            autoComplete="name"
            className="min-h-11 border border-white/20 bg-[#17201f] px-3 text-sm text-white outline-none transition focus:border-[#d5a09a]"
          />
        </label>
        <label className="grid gap-2 text-xs text-[#c8c4bc]">
          回复方式（可选）
          <input
            name="contact"
            maxLength={120}
            autoComplete="email"
            placeholder="邮箱或微信号"
            className="min-h-11 border border-white/20 bg-[#17201f] px-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-[#d5a09a]"
          />
        </label>
      </div>

      <div className="mt-5 border-l-2 border-[#d5a09a] bg-white/[0.035] p-4 text-xs leading-6 text-[#c8c4bc]">
        想整理家族史？请先完成
        <Link href="/studio/diagnosis" className="mx-1 text-white underline decoration-white/30 underline-offset-4">
          3 分钟起步诊断
        </Link>
        。这里不接收原件、身份证件、精确住址、私人通信正文、在世亲属敏感信息或未成年人材料。
      </div>

      <label className="mt-5 grid gap-2 text-xs text-[#c8c4bc]">
        留言内容
        <textarea
          name="body"
          required
          minLength={10}
          maxLength={2000}
          rows={6}
          placeholder="可以聊 AI、产品或一般合作；历史线索请只写公开出处，不要粘贴原件和私人信息。"
          className="resize-y border border-white/20 bg-[#17201f] px-3 py-3 text-sm leading-7 text-white outline-none transition placeholder:text-white/30 focus:border-[#d5a09a]"
        />
      </label>

      <label className="sr-only" aria-hidden="true">
        网站
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="mt-5 flex items-start gap-3 text-xs leading-6 text-[#aaa69f]">
        <input
          type="checkbox"
          name="consent"
          required
          className="mt-1 size-4 shrink-0 accent-[#d5a09a]"
        />
        <span>
          我同意本站为回复本次留言，在本机私有存储中保存以上信息。留言不会自动公开，详情见
          <Link href="/privacy" className="ml-1 text-white underline decoration-white/30 underline-offset-4">
            隐私说明
          </Link>
          。
        </span>
      </label>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="submit"
          disabled={submission.status === 'submitting'}
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-[#f3efe7] px-5 text-sm font-semibold text-[#202827] transition hover:bg-white disabled:cursor-wait disabled:opacity-60"
        >
          {submission.status === 'submitting'
            ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
            : <Send className="size-4" aria-hidden="true" />}
          保存留言
        </button>
        {submission.message && (
          <p
            className={`flex items-start gap-2 text-xs leading-6 ${
              submission.status === 'error' ? 'text-[#f1aaa2]' : 'text-[#b7c7bf]'
            }`}
            role="status"
          >
            {submission.status === 'success' && (
              <CheckCircle2 className="mt-1 size-3.5 shrink-0" aria-hidden="true" />
            )}
            {submission.message}
          </p>
        )}
      </div>
    </form>
  );
}

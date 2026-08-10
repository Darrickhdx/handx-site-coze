'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ClipboardCopy,
  Mail,
  RotateCcw,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  buildLowSensitivitySummary,
  diagnosticQuestions,
  familyHistoryDiagnosticContract,
  resolveDiagnosticTrack,
  type DiagnosticQuestionId,
} from '@/content/family-history-diagnostic';
import { profile } from '@/content/profile';

type Answers = Partial<Record<DiagnosticQuestionId, string>>;

export function FamilyHistoryDiagnostic() {
  const [started, setStarted] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [completed, setCompleted] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const questionHeadingRef = useRef<HTMLHeadingElement>(null);
  const resultHeadingRef = useRef<HTMLHeadingElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const currentQuestion = diagnosticQuestions[questionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;
  const result = useMemo(
    () => (completed ? resolveDiagnosticTrack(answers) : null),
    [answers, completed],
  );

  useEffect(() => {
    if (started && !completed) questionHeadingRef.current?.focus();
  }, [started, completed, questionIndex]);

  useEffect(() => {
    if (completed) resultHeadingRef.current?.focus();
  }, [completed]);

  function reset() {
    setStarted(false);
    setQuestionIndex(0);
    setAnswers({});
    setCompleted(false);
    setCopyState('idle');
  }

  function choose(questionId: DiagnosticQuestionId, optionId: string) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setCopyState('idle');
  }

  function moveNext() {
    if (!currentQuestion || !currentAnswer) return;
    if (questionIndex === diagnosticQuestions.length - 1) {
      setCompleted(true);
      return;
    }
    setQuestionIndex((current) => current + 1);
  }

  function moveBack() {
    if (questionIndex === 0) {
      reset();
      return;
    }
    setQuestionIndex((current) => current - 1);
  }

  function moveOptionFocus(optionIndex: number, key: string) {
    if (!currentQuestion) return;
    const optionCount = currentQuestion.options.length;
    let nextIndex = optionIndex;
    if (key === 'ArrowRight' || key === 'ArrowDown') nextIndex = (optionIndex + 1) % optionCount;
    else if (key === 'ArrowLeft' || key === 'ArrowUp') nextIndex = (optionIndex - 1 + optionCount) % optionCount;
    else if (key === 'Home') nextIndex = 0;
    else if (key === 'End') nextIndex = optionCount - 1;
    else return;

    const option = currentQuestion.options[nextIndex];
    choose(currentQuestion.id, option.id);
    optionRefs.current[nextIndex]?.focus();
  }

  async function copySummary() {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(buildLowSensitivitySummary(answers, result));
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  }

  const mailHref = result?.interviewEligible
    ? `mailto:${profile.email}?subject=${encodeURIComponent('家族史小范围需求访谈')}&body=${encodeURIComponent(buildLowSensitivitySummary(answers, result))}`
    : null;

  return (
    <section
      className="border border-foreground/15 bg-white/55 shadow-[0_28px_90px_rgba(32,40,39,0.08)]"
      data-family-history-diagnostic={familyHistoryDiagnosticContract.schemaVersion}
      data-storage-scope={familyHistoryDiagnosticContract.storageScope}
    >
      {!started && !completed && (
        <div className="grid gap-10 p-7 sm:p-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)] lg:items-end">
          <div>
            <p className="story-kicker">3 分钟 · 5 个选择题</p>
            <h2 className="mt-5 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              先判断，你家的第一步应该是什么。
            </h2>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              只选择材料形态、当前问题与风险边界；不填写姓名，也不提交任何原文。
              结果只用于安排研究起点，不判断人物真假或历史功劳。
            </p>
            <button
              type="button"
              onClick={() => setStarted(true)}
              className="story-button story-button-primary mt-8"
            >
              开始 3 分钟自评
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="border-t border-foreground/15 pt-6 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
            <ShieldCheck className="size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="mt-5 font-serif text-xl font-semibold">不上传材料 · 不保存答案 · 不调用外部模型</p>
            <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
              答案只存在当前页面内存，刷新或退出即清空；不会写入网址、统计、留言箱或浏览器存储。
            </p>
          </div>
        </div>
      )}

      {started && !completed && currentQuestion && (
        <div className="p-6 sm:p-10">
          <div className="flex items-center justify-between gap-6 border-b border-foreground/15 pb-5">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
              第 {questionIndex + 1}/{diagnosticQuestions.length} 步 · 答案尚未保存
            </p>
            <button
              type="button"
              onClick={reset}
              className="inline-flex min-h-11 items-center gap-2 px-2 text-sm text-muted-foreground hover:text-foreground"
              aria-label="退出并清空诊断"
            >
              <X className="size-4" aria-hidden="true" />
              退出
            </button>
          </div>

          <div className="mt-8 max-w-3xl">
            <h2
              ref={questionHeadingRef}
              tabIndex={-1}
              className="font-serif text-3xl font-semibold leading-tight tracking-[-0.035em] outline-none sm:text-4xl"
            >
              {currentQuestion.prompt}
            </h2>
            <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{currentQuestion.helper}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={currentQuestion.prompt}>
            {currentQuestion.options.map((option, optionIndex) => {
              const selected = currentAnswer === option.id;
              return (
                <button
                  key={option.id}
                  ref={(element) => { optionRefs.current[optionIndex] = element; }}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!currentAnswer && optionIndex === 0) ? 0 : -1}
                  onClick={() => choose(currentQuestion.id, option.id)}
                  onKeyDown={(event) => {
                    if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
                      event.preventDefault();
                      moveOptionFocus(optionIndex, event.key);
                    }
                  }}
                  className={`min-h-28 border p-5 text-left transition ${
                    selected
                      ? 'border-primary bg-primary text-white'
                      : 'border-foreground/15 bg-background hover:border-primary/60'
                  }`}
                >
                  <span className="flex items-start justify-between gap-4">
                    <strong className="text-base leading-7">{option.label}</strong>
                    {selected && <Check className="mt-1 size-4 shrink-0" aria-hidden="true" />}
                  </span>
                  <span className={`mt-2 block text-sm leading-6 ${selected ? 'text-white/75' : 'text-muted-foreground'}`}>
                    {option.description}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" onClick={moveBack} className="story-text-link min-h-11">
              <ArrowLeft className="size-4" aria-hidden="true" />
              {questionIndex === 0 ? '返回说明' : '上一题'}
            </button>
            <button
              type="button"
              onClick={moveNext}
              disabled={!currentAnswer}
              className="story-button story-button-primary disabled:cursor-not-allowed disabled:opacity-40"
            >
              {questionIndex === diagnosticQuestions.length - 1 ? '查看我的起点' : '下一题'}
              <ArrowRight className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {completed && result && (
        <div className="p-6 sm:p-10" data-diagnostic-result={result.id}>
          <p className="story-kicker">{result.eyebrow}</p>
          <h2
            ref={resultHeadingRef}
            tabIndex={-1}
            className="mt-5 max-w-4xl font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] outline-none sm:text-5xl"
          >
            {result.title}
          </h2>
          <p className="mt-6 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">{result.explanation}</p>

          <div className="mt-9 grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 md:grid-cols-3">
            {result.actions.map((action, index) => (
              <article key={action} className="bg-background p-6">
                <span className="font-serif text-3xl text-primary/40">0{index + 1}</span>
                <p className="mt-5 text-sm leading-[1.7]">{action}</p>
              </article>
            ))}
          </div>

          <div className="mt-7 border-l-4 border-accent bg-[#eee8dc] p-5 sm:p-6">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">停止门</p>
            <p className="mt-3 text-sm leading-[1.7]">{result.stopGate}</p>
          </div>

          <p className="mt-6 text-xs leading-6 text-muted-foreground">
            {familyHistoryDiagnosticContract.resultDisclaimer}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link href={result.exampleHref} className="story-button story-button-primary">
              {result.exampleLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <button type="button" onClick={copySummary} className="story-button story-button-secondary">
              <ClipboardCopy className="size-4" aria-hidden="true" />
              {copyState === 'copied' ? '摘要已复制' : '复制低敏摘要'}
            </button>
            {mailHref && (
              <a href={mailHref} className="story-button story-button-secondary">
                <Mail className="size-4" aria-hidden="true" />
                申请小范围需求访谈
              </a>
            )}
            <button type="button" onClick={reset} className="story-text-link min-h-11">
              <RotateCcw className="size-4" aria-hidden="true" />
              重新诊断
            </button>
          </div>
          {mailHref && (
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              点击后只会打开你的邮件客户端并填入这份低敏摘要，不会自动发送，也不会把答案交给本站。
            </p>
          )}
          {copyState === 'failed' && (
            <p className="mt-4 text-xs leading-6 text-primary" role="status">
              浏览器未允许复制；你仍可直接查看上面的三项建议。
            </p>
          )}
        </div>
      )}
    </section>
  );
}

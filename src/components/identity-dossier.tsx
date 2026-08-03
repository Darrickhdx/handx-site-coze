'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ExternalLink,
  FileSearch,
  Fingerprint,
  GitCompareArrows,
  ScanText,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  identityDossierItems,
  identityTrackComparison,
  identityDossierVerdict,
} from '@/content/identity-dossier';
import { cn } from '@/lib/utils';

const statusStyles = {
  document_verified: 'border-emerald-800/25 bg-emerald-900/8 text-emerald-900',
  candidate_bridge: 'border-sky-800/25 bg-sky-900/8 text-sky-900',
  conflict: 'border-amber-800/30 bg-amber-900/8 text-amber-900',
  bounded_record: 'border-primary/25 bg-primary/8 text-primary',
} as const;

type ReaderJudgment = 'same' | 'different' | 'uncertain';
type TrackMode = 'separate' | 'assumed';

const judgmentOptions: readonly {
  value: ReaderJudgment;
  label: string;
  shortLabel: string;
}[] = [
  { value: 'same', label: '更像同一人的记录', shortLabel: '倾向候选同人' },
  { value: 'different', label: '更像两个人的记录', shortLabel: '倾向保留两轨' },
  { value: 'uncertain', label: '这条仍不足以判断', shortLabel: '继续保留问题' },
] as const;

function summarizeJudgments(judgments: Record<string, ReaderJudgment>) {
  const values = Object.values(judgments);
  const same = values.filter((value) => value === 'same').length;
  const different = values.filter((value) => value === 'different').length;

  if (values.length === 0) return '你还没有记录阅读倾向。';
  if (same > different) return '你目前更倾向把两条姓名轨视为候选同人。';
  if (different > same) return '你目前更倾向继续把两条姓名轨分开保存。';
  return '你目前选择继续保留问题，不急于合并身份。';
}

export function IdentityDossier() {
  const [activeId, setActiveId] = useState<string>(identityDossierItems[0].id);
  const [judgments, setJudgments] = useState<Record<string, ReaderJudgment>>({});
  const [trackMode, setTrackMode] = useState<TrackMode>('separate');
  const active =
    identityDossierItems.find((item) => item.id === activeId) ?? identityDossierItems[0];
  const activeIndex = identityDossierItems.findIndex((item) => item.id === active.id);
  const selectedJudgment = judgments[active.id];
  const completedCount = Object.keys(judgments).length;

  function moveToItem(direction: -1 | 1) {
    const nextIndex = Math.min(
      identityDossierItems.length - 1,
      Math.max(0, activeIndex + direction),
    );
    setActiveId(identityDossierItems[nextIndex].id);
  }

  return (
    <div id="dossier-start" className="scroll-mt-28">
      <div
        className="overflow-x-auto border-y border-foreground/15 bg-card"
        role="tablist"
        aria-label="身份案卷材料时间线"
      >
        <div className="personal-shell flex min-w-max px-0">
          {identityDossierItems.map((item, index) => (
            <button
              key={item.id}
              id={`dossier-tab-${item.id}`}
              type="button"
              role="tab"
              aria-selected={active.id === item.id}
              aria-controls="identity-dossier-panel"
              onClick={() => setActiveId(item.id)}
              className={cn(
                'group min-w-36 border-x border-foreground/10 px-5 py-5 text-left transition-colors first:border-l-0 hover:bg-background focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary sm:min-w-44 sm:px-6',
                active.id === item.id && 'bg-background',
              )}
            >
              <span className="block font-mono text-[10px] tracking-[0.14em] text-primary">
                0{index + 1}
              </span>
              <strong className="mt-2 block font-serif text-2xl">{item.year}</strong>
              <span className="mt-1 block max-w-32 text-xs leading-5 text-muted-foreground">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <section
        id="identity-dossier-panel"
        role="tabpanel"
        aria-labelledby={`dossier-tab-${active.id}`}
        className="py-12 sm:py-20"
      >
        <div className="personal-shell grid gap-8 xl:grid-cols-[minmax(0,1.05fr)_minmax(25rem,0.95fr)] xl:gap-14">
          <div className="relative min-h-[32rem] overflow-hidden border border-foreground/15 bg-[#e9e3d8] p-5 shadow-[0_24px_70px_rgba(31,35,33,0.12)] sm:p-8">
            <div className="absolute inset-x-0 top-0 h-1 bg-primary" aria-hidden="true" />
            <div className="flex items-start justify-between gap-6 border-b border-foreground/15 pb-5">
              <div>
                <p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
                  Evidence sheet · {active.dateLabel}
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">{active.sourceKind}</p>
              </div>
              <span className="font-serif text-4xl italic text-primary/25">{active.year}</span>
            </div>

            {active.image ? (
              <div className="mt-7 overflow-hidden border border-foreground/15 bg-white p-2">
                <Image
                  src={active.image.src}
                  alt={active.image.alt}
                  width={active.image.width}
                  height={active.image.height}
                  className="aspect-[16/9] h-auto w-full object-cover grayscale"
                  sizes="(min-width: 1280px) 48vw, 100vw"
                />
              </div>
            ) : (
              <div className="mt-7 flex min-h-64 items-center justify-center border border-foreground/15 bg-[linear-gradient(rgba(255,255,255,.55),rgba(255,255,255,.55)),repeating-linear-gradient(0deg,transparent,transparent_31px,rgba(74,69,58,.11)_32px)] px-6 py-10 text-center sm:px-12">
                <div>
                  <ScanText className="mx-auto size-6 text-primary" strokeWidth={1.3} aria-hidden="true" />
                  <p className="mt-6 text-xs tracking-[0.13em] text-muted-foreground">{active.recordHeading}</p>
                  <blockquote className="mt-7 font-serif text-2xl leading-relaxed tracking-[0.03em] text-foreground sm:text-3xl">
                    {active.recordText}
                  </blockquote>
                </div>
              </div>
            )}

            <div className="mt-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">定位</p>
                <p className="mt-2 font-mono text-xs text-foreground">
                  {active.sourceId} · {active.claimIds.join(' / ')}
                </p>
              </div>
              <Link
                href={`/archives/${active.sourceId}`}
                className="story-text-link"
                data-amplitude-event="identity_dossier_source_opened"
                data-amplitude-source={active.sourceId}
              >
                打开来源卡
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <p className="mt-5 border-t border-foreground/15 pt-4 text-[11px] leading-5 text-muted-foreground">
              第三方史料或书目数据，仅供本地研究审阅，不随本站内容授权。
            </p>
          </div>

          <div aria-live="polite" aria-atomic="true">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn('border px-3 py-1.5 text-xs font-semibold', statusStyles[active.status])}>
                {active.statusLabel}
              </span>
              <span className="text-xs text-muted-foreground">
                第 {activeIndex + 1} / {identityDossierItems.length} 份材料
              </span>
            </div>
            <h2 className="mt-6 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              {active.title}
            </h2>

            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              <div className="border-t-2 border-emerald-800/45 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                  <Check className="size-4" aria-hidden="true" />
                  这张纸能确认
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {active.canConfirm.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
              <div className="border-t-2 border-rose-800/35 pt-5">
                <div className="flex items-center gap-2 text-sm font-semibold text-rose-900">
                  <X className="size-4" aria-hidden="true" />
                  它仍不能证明
                </div>
                <ul className="mt-4 space-y-3 text-sm leading-7 text-muted-foreground">
                  {active.cannotConfirm.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </div>
            </div>

            <div className="mt-8 border border-foreground/15 bg-card p-5 sm:p-6">
              <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                <Fingerprint className="size-4" aria-hidden="true" />
                这一站出现的身份字段
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {active.anchors.map((anchor) => (
                  <span key={anchor} className="border border-foreground/15 bg-background px-3 py-2 text-xs text-foreground">
                    {anchor}
                  </span>
                ))}
              </div>
              <p className="mt-5 flex gap-3 border-t border-foreground/15 pt-5 text-sm leading-7 text-muted-foreground">
                <CircleHelp className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                {active.question}
              </p>
            </div>

            <div className="mt-6 border border-foreground/15 bg-[#eee9df] p-5 sm:p-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                记录你的阅读倾向
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                这不是投票，也不会改变任何史料或研究结论。它只是帮助你在阅读六份材料时保留自己的判断过程。
              </p>
              <div className="mt-5 grid gap-2">
                {judgmentOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selectedJudgment === option.value}
                    onClick={() =>
                      setJudgments((current) => ({ ...current, [active.id]: option.value }))
                    }
                    className={cn(
                      'min-h-11 border border-foreground/15 bg-background px-4 py-3 text-left text-sm transition-colors hover:border-primary/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                      selectedJudgment === option.value && 'border-primary bg-primary text-primary-foreground',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-foreground/15 pt-6">
              <button
                type="button"
                onClick={() => moveToItem(-1)}
                disabled={activeIndex === 0}
                className="story-text-link min-h-11 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="size-4" aria-hidden="true" />
                上一份
              </button>
              <p className="text-xs text-muted-foreground" aria-live="polite">
                已记录 {completedCount} / {identityDossierItems.length} 份
              </p>
              <button
                type="button"
                onClick={() => moveToItem(1)}
                disabled={activeIndex === identityDossierItems.length - 1}
                className="story-text-link min-h-11 disabled:cursor-not-allowed disabled:opacity-35"
              >
                下一份
                <ChevronRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#eee9df] py-14 sm:py-20">
        <div className="personal-shell">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-20">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Compare the two tracks
              </p>
              <GitCompareArrows className="mt-7 size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="mt-5 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                如果把两个名字合并，会发生什么？
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-8 text-muted-foreground">
              先看研究库如何把两条姓名轨分开保存，再切换到“假设桥成立”。后者是一种检查矛盾的研究演示，不是传记结论。
            </p>
          </div>

          <div className="mt-9 inline-grid w-full grid-cols-2 border border-foreground/15 bg-background p-1 sm:w-auto">
            <button
              type="button"
              aria-pressed={trackMode === 'separate'}
              onClick={() => setTrackMode('separate')}
              className={cn(
                'min-h-11 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                trackMode === 'separate' && 'bg-foreground text-background',
              )}
            >
              保持两条记录
            </button>
            <button
              type="button"
              aria-pressed={trackMode === 'assumed'}
              onClick={() => setTrackMode('assumed')}
              className={cn(
                'min-h-11 px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-primary',
                trackMode === 'assumed' && 'bg-foreground text-background',
              )}
            >
              假设身份桥成立
            </button>
          </div>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            无论切换到哪种视图，“假设身份桥成立”都不是已经确认的完整生平。
          </p>

          {trackMode === 'separate' ? (
            <div className="mt-7 grid gap-5 lg:grid-cols-2">
              {identityTrackComparison.openTrack.map((track) => (
                <article key={track.label} className="border border-foreground/15 bg-background p-6 sm:p-8">
                  <h3 className="font-serif text-3xl font-semibold">{track.label}</h3>
                  <ol className="mt-6 space-y-0">
                    {track.records.map((record) => (
                      <li key={record} className="relative border-l border-primary/35 pb-6 pl-6 text-sm leading-7 text-muted-foreground last:pb-0">
                        <span className="absolute -left-1.5 top-2 size-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                        {record}
                      </li>
                    ))}
                  </ol>
                  <p className="mt-7 border-t border-foreground/15 pt-4 font-mono text-[11px] leading-5 text-muted-foreground">
                    来源索引：{track.sources}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-7 border border-dashed border-primary/45 bg-background p-6 sm:p-8">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">Hypothesis view</p>
                <ol className="mt-7 space-y-0">
                  {identityTrackComparison.assumedBridge.map((record) => (
                    <li key={record} className="relative border-l border-primary/35 pb-7 pl-7 text-sm leading-7 text-foreground last:pb-0">
                      <span className="absolute -left-1.5 top-2 size-3 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                      {record}
                    </li>
                  ))}
                </ol>
              </div>
              <p className="mt-8 border-l-2 border-amber-700 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-950">
                {identityTrackComparison.warning}
              </p>
            </div>
          )}
        </div>
      </section>

      <section id="dossier-verdict" className="scroll-mt-28 border-y border-white/15 bg-[#202827] py-14 text-[#f3efe7] sm:py-20">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Current verdict
            </p>
            <ShieldAlert className="mt-8 size-7 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              {identityDossierVerdict.label}
            </h2>
            <p className="mt-6 text-sm leading-7 text-[#bdb9b0]">{identityDossierVerdict.summary}</p>
            <div className="mt-7 border border-white/15 p-5">
              <p className="text-xs font-semibold tracking-[0.14em] text-[#c38a82] uppercase">你的暂时判断</p>
              <p className="mt-3 text-sm leading-7 text-[#d7cfc2]">{summarizeJudgments(judgments)}</p>
              <p className="mt-3 text-xs leading-6 text-[#aaa69f]">
                项目判断固定在上方，不会因你的选择或其他读者意见而改变。
              </p>
            </div>
          </div>
          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-[#c38a82] uppercase">已经建立</p>
              <ul className="mt-5 space-y-4">
                {identityDossierVerdict.established.map((item) => (
                  <li key={item} className="flex gap-3 border-t border-white/15 pt-4 text-sm leading-7 text-[#d7cfc2]">
                    <Check className="mt-1 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.15em] text-[#c38a82] uppercase">仍然缺少</p>
              <ul className="mt-5 space-y-4">
                {identityDossierVerdict.missing.map((item) => (
                  <li key={item} className="flex gap-3 border-t border-white/15 pt-4 text-sm leading-7 text-[#d7cfc2]">
                    <FileSearch className="mt-1 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="personal-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div>
            <p className="story-kicker">继续探索</p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              案卷负责提出问题，图谱负责继续追踪关系。
            </h2>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/archives/SRC-103" className="story-button story-button-primary">
              查看关键原件来源卡
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/discover/1936-pingdiquan" className="story-button story-button-secondary">
              继续读 1936 平地泉
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/graph?focus=P-001&compare=P-002" className="story-text-link">
              在完整图谱中查看姓名轨
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

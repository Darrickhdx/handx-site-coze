import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CirclePause,
  FileClock,
  Fingerprint,
  ShieldAlert,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  candidateNovelEdition,
  frozenNovelBaseline,
  novelEditionGateLabels,
  novelEditionRegistry,
} from '@/lib/novel-editions';

export const metadata: Metadata = {
  title: '《英雄无名》版本大厅｜当前阅读版、冻结基线与下一版门禁',
  description: '区分网站当前V0.3阅读器、V1.2冻结对照基线和仍未上线的V1.3候选版，并公开换版停止门槛。',
};

function shortHash(value: string) {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

export default function NovelEditionsPage() {
  const candidateChecks = Object.entries(candidateNovelEdition.gate_checks ?? {});
  const passed = candidateChecks.filter(([, value]) => value).length;

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <ProjectSectionNav />
      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-12 sm:py-20">
          <Link href="/novel" className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] hover:text-white">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回小说首页
          </Link>
          <div className="mt-12 grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-end lg:gap-20">
            <div>
              <p className="personal-kicker personal-kicker-light"><span aria-hidden="true" />Edition control</p>
              <h1 className="mt-7 font-serif text-[clamp(3.6rem,7vw,7rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                换一本书，
                <br />
                不是换一个文件。
              </h1>
            </div>
            <div>
              <p className="font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-3xl">
                章节、页码、评论、阅读进度与图版权利，都必须跟着版本一起迁移。
              </p>
              {/* Counts come from the registry: V1.3 was re-rendered and frozen,
                  and this sentence previously still claimed the older plate count
                  and that freezing was outstanding. */}
              <p className="mt-6 max-w-2xl text-base leading-8 text-[#bdb9b0]">
                因此网站仍保留可验证的 V0.3 本地阅读器；V{frozenNovelBaseline.version} 只作冻结基线，V
                {candidateNovelEdition.version} 已冻结，但在 {candidateNovelEdition.figure_plates} 幅图版审权完成前（当前{' '}
                {candidateNovelEdition.rights_ledger_records ?? 0}/{candidateNovelEdition.figure_plates}）不生成网页页图，也不覆盖旧评论。
              </p>
            </div>
          </div>
        </div>
      </header>

      <main>
        <section className="personal-shell py-14 sm:py-20">
          <div className="grid gap-px border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            <article className="bg-background p-6 sm:p-8">
              <p className="font-mono text-[10px] tracking-[0.15em] text-primary uppercase">Now reading</p>
              <h2 className="mt-5 font-serif text-4xl font-semibold">V{novelEditionRegistry.current_reader.version}</h2>
              <p className="mt-3 text-sm font-semibold">旧版本地阅读器</p>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {novelEditionRegistry.current_reader.pages} 页、{novelEditionRegistry.current_reader.numbered_chapters} 章；保持现状，用于验证阅读、评论与水印管线。
              </p>
              <Link href="/novel/read" className="story-text-link mt-7">
                打开当前阅读器 <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>

            <article className="bg-background p-6 sm:p-8">
              <p className="font-mono text-[10px] tracking-[0.15em] text-primary uppercase">Frozen baseline</p>
              <h2 className="mt-5 font-serif text-4xl font-semibold">V{frozenNovelBaseline.version}</h2>
              <p className="mt-3 text-sm font-semibold">冻结对照，不提供阅读</p>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {frozenNovelBaseline.pages} 页、{frozenNovelBaseline.numbered_chapters} 章、{frozenNovelBaseline.figure_plates} 幅图版；只用于差异核对和回滚。
              </p>
              <p className="mt-7 flex items-center gap-2 text-xs text-muted-foreground">
                <Fingerprint className="size-4 text-primary" aria-hidden="true" />
                PDF {shortHash(frozenNovelBaseline.source_artifacts.pdf.sha256)}
              </p>
            </article>

            <article className="bg-[#eee9df] p-6 sm:p-8">
              <p className="font-mono text-[10px] tracking-[0.15em] text-primary uppercase">Next candidate</p>
              <h2 className="mt-5 font-serif text-4xl font-semibold">V{candidateNovelEdition.version}</h2>
              <p className="mt-3 text-sm font-semibold">正在编辑，尚未接入</p>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                {candidateNovelEdition.pages} 页、{candidateNovelEdition.numbered_chapters} 章＋{candidateNovelEdition.unnumbered_openings} 个序章、{candidateNovelEdition.figure_plates} 幅图版。
              </p>
              <p className="mt-7 inline-flex items-center gap-2 border border-amber-800/25 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-950">
                <CirclePause className="size-4" aria-hidden="true" />
                {passed}/{candidateChecks.length} 道门禁通过
              </p>
            </article>
          </div>
        </section>

        <section className="border-y border-foreground/15 bg-card py-14 sm:py-20">
          <div className="personal-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />Switch gates</p>
              <ShieldAlert className="mt-8 size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">V1.3 何时才能切换？</h2>
              <p className="mt-6 text-sm leading-7 text-muted-foreground">
                门禁由本地源文件实时生成。读者点击、评论或人工选择都不能绕过它。
              </p>
            </div>
            <ol className="grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-2">
              {candidateChecks.map(([key, value], index) => (
                <li key={key} className="bg-background p-5">
                  <div className="flex items-start gap-3">
                    {value ? (
                      <Check className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
                    ) : (
                      <CirclePause className="mt-0.5 size-5 shrink-0 text-amber-800" aria-hidden="true" />
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">门禁 {String(index + 1).padStart(2, '0')}</p>
                      <p className="mt-2 text-sm font-semibold leading-6">{novelEditionGateLabels[key] ?? key}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{value ? '已通过' : '仍阻断切换'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="personal-shell py-14 sm:py-20">
          <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-end">
            <div>
              <p className="story-kicker">迁移原则</p>
              <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">并行导入，完整核对，最后一次性切换。</h2>
              <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
                V1.3 不覆盖 V0.3 文件；旧评论和阅读进度不自动迁移。每一页继承该页最高风险素材的权利状态，禁止页不会进入浏览器、Git 或媒体导出包。
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Link href="/studio/novel-migration" className="story-button story-button-primary">
                <FileClock className="size-4" aria-hidden="true" />
                打开站主迁移台
              </Link>
              <Link href="/novel/companion" className="story-button story-button-secondary">
                阅读史实来源伴读
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

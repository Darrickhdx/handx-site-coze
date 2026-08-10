import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BookMarked, FileSearch, ShieldAlert } from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { novelCompanionEntries } from '@/content/novel-companion';
import { novelManifest } from '@/lib/novel';

export const metadata: Metadata = {
  title: '《英雄无名》真实与虚构伴读｜故事从哪里来，又停在哪里',
  description: '把小说中的关键历史节点带回来源卡，同时明确家族记忆、合理外推和文学重构不能证明什么。',
};

const modeStyles = {
  source_anchor: 'border-emerald-800/25 bg-emerald-50 text-emerald-900',
  conflict: 'border-sky-800/25 bg-sky-50 text-sky-900',
  literary_boundary: 'border-amber-800/25 bg-amber-50 text-amber-950',
} as const;

export default function NovelCompanionPage() {
  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <ProjectSectionNav />
      <header className="border-b border-foreground/15">
        <div className="personal-shell py-9 sm:py-10">
          <Link href="/novel" className="story-text-link">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回小说首页
          </Link>
          <div className="mt-9 grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />Reading companion</p>
              <h1 className="mt-7 font-serif text-[clamp(1.50rem,2.84vw,2.84rem)] font-semibold leading-[0.9] tracking-[-0.065em]">
                故事从哪里来，
                <br />
                又必须停在哪里。
              </h1>
            </div>
            <div>
              <BookMarked className="size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-6 font-serif text-lg leading-relaxed sm:text-base">
                先让小说把人带进历史，再让来源卡把判断带回纸面。
              </p>
              <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
                这不是给每一场戏盖章。它只挑出最容易被误读为“真实还原”的节点，说明史料能承载什么、文学又增加了什么。
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="personal-shell py-7 sm:py-10">
        <div className="mb-9 flex items-start gap-3 border border-amber-800/20 bg-amber-50 p-5 text-sm leading-[1.7] text-amber-950">
          <ShieldAlert className="mt-1 size-5 shrink-0" aria-hidden="true" />
          <p>
            这里把小说里的场景，对回它依据的材料，并写明哪一部分是材料没说的。
          </p>
        </div>

        <div className="grid gap-px border border-foreground/15 bg-foreground/15">
          {novelCompanionEntries.map((entry, index) => (
            <article key={entry.id} className="grid gap-7 bg-background p-6 sm:p-8 lg:grid-cols-[12rem_minmax(0,1fr)_18rem] lg:items-start">
              <div>
                <p className="font-mono text-[10px] tracking-[0.14em] text-primary">{String(index + 1).padStart(2, '0')}</p>
                <Link href={entry.chapterHref} className="mt-4 block text-sm font-semibold leading-6 hover:text-primary">
                  {entry.chapterLabel}
                </Link>
                <span className={`mt-4 inline-block border px-3 py-1.5 text-xs font-semibold ${modeStyles[entry.mode]}`}>
                  {entry.modeLabel}
                </span>
              </div>
              <div>
                <h2 className="font-serif text-2xl font-semibold tracking-[-0.03em]">{entry.title}</h2>
                <p className="mt-5 text-[15px] leading-[1.7] text-muted-foreground">{entry.lead}</p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="border-t border-emerald-800/30 pt-4">
                    <p className="text-xs font-semibold text-emerald-900">可以承载</p>
                    <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{entry.canCarry}</p>
                  </div>
                  <div className="border-t border-rose-800/25 pt-4">
                    <p className="text-xs font-semibold text-rose-900">不能替小说证明</p>
                    <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">{entry.cannotCarry}</p>
                  </div>
                </div>
                {entry.evidencePathId && (
                  <Link href={`/evidence/${entry.evidencePathId}`} className="story-text-link mt-6">
                    展开故事证据链 <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
              <div className="border-t border-foreground/15 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <FileSearch className="size-4 text-primary" aria-hidden="true" />
                  来源入口
                </p>
                {entry.sourceIds.length ? (
                  <div className="mt-4 flex flex-col gap-2">
                    {entry.sourceIds.map((sourceId) => (
                      <Link key={sourceId} href={`/archives/${sourceId}`} className="story-text-link">
                        {sourceId}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-4 text-xs leading-6 text-muted-foreground">暂无可把苏开元接入该场景的来源卡；仅保留文学边界。</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 border border-foreground/15 bg-card p-7 sm:p-9">
          <p className="story-kicker">下一步</p>
          <h2 className="mt-4 font-serif text-2xl font-semibold">下一版将把伴读做进每章侧栏。</h2>
          <p className="mt-5 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
            先覆盖“举旗”“四十六个弹孔”“放乔”“延安”“一角城门”“破案不能认领”“无名”“没有人查过她”等高风险章节。
          </p>
        </section>
      </div>
    </div>
  );
}

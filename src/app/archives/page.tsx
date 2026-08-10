import { ArrowRight, BookOpenText, Compass, FileSearch } from 'lucide-react';
import Link from 'next/link';
import { ArchiveStoryCard } from '@/components/archive-story-card';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { archiveReadingMoments } from '@/content/archive-reading';
import { sourceCards } from '@/lib/research-data';
import { SourceCard } from '@/components/source-card';

export default function ArchivesPage() {
  return (
    <div>
      <ProjectSectionNav />

      <header className="border-b border-foreground/15 bg-[#eee9df]">
        <div className="story-shell grid gap-10 py-16 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.65fr)] lg:items-end">
          <div>
            <p className="personal-kicker"><span aria-hidden="true" />Archive, read like a story</p>
            <h1 className="mt-7 max-w-4xl font-serif text-[clamp(1.72rem,3.64vw,3.33rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              先别查编号。<br />先回到那一页纸、那座城、那一天。
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-[1.8] text-muted-foreground sm:text-lg">
              这里不是证据墙，而是一条回到历史现场的阅读路线。每份材料先告诉你一个人、一件事或一个悬念；想继续深挖时，再把你带回原文与出处。
            </p>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/archives/SRC-013"
                data-amplitude-event="archive_reading_started"
                data-amplitude-source-id="SRC-013"
                data-amplitude-section="archive_hero"
                className="story-button story-button-primary"
              >
                从1936年的一行字开始 <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/discover/1936-pingdiquan" className="story-button story-button-secondary">
                先读完整故事
              </Link>
            </div>
          </div>

          <aside className="border-l-2 border-primary pl-6 pb-1 sm:pl-8">
            <p className="font-serif text-3xl leading-relaxed text-foreground sm:text-4xl">
              “档案的价值，不是替读者下结论；而是把人带到一个能自己感受历史的瞬间。”
            </p>
            <p className="mt-6 text-xs leading-6 text-muted-foreground">
              本项目把已看见的、仍在寻找的分开说，但不让术语抢走故事的第一句话。
            </p>
          </aside>
        </div>
      </header>

      <main className="story-shell py-16 sm:py-14">
        <section aria-labelledby="reader-route-heading">
          <div className="grid gap-7 border-b border-foreground/15 pb-9 lg:grid-cols-[0.75fr_1.25fr] lg:items-end lg:gap-14">
            <div>
              <p className="story-kicker">三份材料，三次走近</p>
              <h2 id="reader-route-heading" className="story-heading mt-4">如果你只花十分钟，就从这里走进苏开元。</h2>
            </div>
            <p className="max-w-2xl text-base leading-[1.8] text-muted-foreground">
              不需要懂档案学。你只需要带着一个问题读下去：这一页纸，让我们真正看见了什么？而它又把什么留给了下一次寻找？
            </p>
          </div>

          <div className="mt-8 grid gap-px border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {archiveReadingMoments.map((moment, index) => (
              <ArchiveStoryCard key={moment.sourceId} moment={moment} index={index} />
            ))}
          </div>
        </section>

        <section className="mt-16 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-3 sm:mt-24">
          <div className="bg-background p-7 sm:p-9">
            <BookOpenText className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="mt-8 text-[10px] font-semibold tracking-[0.13em] text-primary uppercase">01 · 先读人</p>
            <h2 className="mt-4 font-serif text-2xl font-semibold">从一个场景进入，不从表格进入。</h2>
            <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">先知道这里发生了什么，再决定自己想不想继续往下找。</p>
          </div>
          <div className="bg-background p-7 sm:p-9">
            <FileSearch className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="mt-8 text-[10px] font-semibold tracking-[0.13em] text-primary uppercase">02 · 再看原文</p>
            <h2 className="mt-4 font-serif text-2xl font-semibold">放大一页，而不是丢给你一堵材料墙。</h2>
            <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">每一页会告诉你从哪里读起，也会把你送回原来的保存机构。</p>
          </div>
          <div className="bg-background p-7 sm:p-9">
            <Compass className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="mt-8 text-[10px] font-semibold tracking-[0.13em] text-primary uppercase">03 · 留下问题</p>
            <h2 className="mt-4 font-serif text-2xl font-semibold">真正有力量的故事，允许一部分还没有答案。</h2>
            <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">下一页要去哪找、还缺哪一块，才是读者能一起参与的旅程。</p>
          </div>
        </section>

        <section className="mt-16 border border-foreground/15 bg-[#1d2524] p-7 text-[#f3efe7] sm:mt-24 sm:p-10">
          <p className="story-kicker text-[#c38a82]">继续寻找</p>
          <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div>
              <h2 className="font-serif text-3xl font-semibold sm:text-4xl">故事走到档案的边缘，才知道下一步该去哪里。</h2>
              <p className="mt-5 max-w-3xl text-sm leading-[1.8] text-[#bdb9b0]">
                还有一批材料尚未取得。它们不是“已知事实”的补充，而是这场寻找接下来真正要抵达的地方。
              </p>
            </div>
            <Link href="/missions" className="story-button border border-[#c38a82] text-[#f3efe7] hover:bg-[#c38a82] hover:text-[#1d2524]">
              走进查档现场 <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <details className="mt-16 border-t border-foreground/15 pt-7 sm:mt-24">
          <summary className="cursor-pointer list-none text-left">
            <span className="inline-flex items-center gap-3 text-sm font-semibold">
              <span className="grid size-8 place-items-center border border-primary/30 text-primary">+</span>
              我想从完整来源目录开始
            </span>
            <span className="mt-3 block max-w-2xl text-sm leading-[1.8] text-muted-foreground">
              给需要逐项追溯的研究者：编号、载体关系与核对范围都在这里；它们不再占据每位读者的第一屏。
            </span>
          </summary>

          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sourceCards.map((source) => (
              <SourceCard key={source.sourceId} {...source} />
            ))}
          </div>
        </details>
      </main>
    </div>
  );
}

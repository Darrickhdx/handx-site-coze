import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenText,
  Clock3,
  FileSearch,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { featuredStories, upcomingTopics } from '@/content/editorial';

export default function DiscoverPage() {
  return (
    <div className="editorial-page overflow-hidden">
      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-12 py-16 sm:py-7 lg:grid-cols-[minmax(0,0.82fr)_minmax(30rem,1.18fr)] lg:items-end lg:gap-14 lg:py-8">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Stories &amp; notes
            </p>
            <h1 className="personal-display mt-7 text-[clamp(1.46rem,2.84vw,2.84rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              文章与手记
            </h1>
          </div>
          <div className="max-w-2xl">
            <p className="font-serif text-2xl leading-relaxed text-foreground sm:text-xl">
              让档案先变成问题，
              <br />
              再变成读者愿意带走的故事。
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
              历史故事、AI 方法与长期项目手记。每篇文章都从一个具体问题出发，
              让研究过程变成普通读者也愿意读完的内容。
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell">
          <div className="flex flex-col justify-between gap-5 border-b border-foreground/15 pb-8 md:flex-row md:items-end">
            <div>
              <p className="story-kicker">从这里开始读</p>
              <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">首批三篇完整专题</h2>
            </div>
            <p className="text-sm text-muted-foreground">全部可读 · 全部标明内容层</p>
          </div>

          <div className="divide-y divide-foreground/15 border-b border-foreground/15">
            {featuredStories.map((story) => (
              <Link
                key={story.slug}
                href={story.href}
                className="editorial-story-row group"
                data-amplitude-event="featured_story_opened"
                data-amplitude-story={story.slug}
              >
                <span className="editorial-story-number">{story.number}</span>
                <span className="editorial-story-meta">
                  <span>{story.layer}</span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="size-3.5" aria-hidden="true" />
                    {story.readTime}
                  </span>
                </span>
                <span>
                  <strong className="editorial-story-title">{story.title}</strong>
                  <span className="mt-3 block max-w-2xl text-sm leading-[1.7] text-muted-foreground sm:text-base">
                    {story.dek}
                  </span>
                  <span className="mt-5 block text-xs text-muted-foreground">{story.sourceLabel}</span>
                </span>
                <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)] lg:items-center lg:gap-14">
          <Link href="/discover/1936-pingdiquan" className="editorial-document-feature group">
            <Image
              src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
              alt="1936 年《绥行纪略》同期校刊影印局部"
              width={1835}
              height={1035}
              className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.015]"
              sizes="(min-width: 1024px) 54vw, 100vw"
            />
            <span>第三方史料 · 本地审阅 · 不随文授权</span>
          </Link>

          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Cover story
            </p>
            <h2 className="mt-7 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
              一张纸可以把一个名字带回现场，
              <span className="mt-2 block text-[#c38a82]">却不能替他写完一生。</span>
            </h2>
            <p className="mt-7 text-[15px] leading-[1.7] text-[#bdb9b0]">
              这是整个项目最重要的编辑原则，也是第一篇长文的叙事核心。
            </p>
            <Link href="/discover/1936-pingdiquan" className="personal-dark-link mt-8">
              阅读封面专题
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <p className="story-kicker">编辑部选题板</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">接下来，沿这些问题继续。</h2>
            <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-muted-foreground">
              “筹备中”不是空页面，而是公开问题、研究边界与下一份要找的材料。
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 sm:grid-cols-2">
            {upcomingTopics.map((topic, index) => (
              <article key={topic.title} className="bg-background p-7 sm:min-h-64 sm:p-8">
                <div className="flex items-center justify-between gap-4 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                  <span>{topic.label}</span>
                  <span className="text-muted-foreground">0{index + 4}</span>
                </div>
                <h3 className="mt-8 font-serif text-2xl font-semibold leading-snug tracking-[-0.025em]">{topic.title}</h3>
                <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{topic.note}</p>
                <span className="mt-7 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <FileSearch className="size-4" aria-hidden="true" />
                  研究筹备中
                </span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 py-16 sm:py-10">
        <div className="personal-shell grid gap-6 md:grid-cols-3">
          <Link href="/novel" className="editorial-next-card group">
            <BookOpenText className="size-6 text-primary" aria-hidden="true" />
            <strong>去读小说试读</strong>
            <span>同一份材料，怎样在 F／I／X 合同下变成场景。</span>
            <ArrowRight className="mt-auto size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/graph" className="editorial-next-card group">
            <Sparkles className="size-6 text-primary" aria-hidden="true" />
            <strong>去探索人物图谱</strong>
            <span>沿策展路线，而不是先面对数据后台。</span>
            <ArrowRight className="mt-auto size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="/studio" className="editorial-next-card group">
            <FlaskConical className="size-6 text-primary" aria-hidden="true" />
            <strong>了解家族史工作室</strong>
            <span>把这套研究流程变成可复用的方法与服务。</span>
            <ArrowRight className="mt-auto size-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  FileCheck2,
  Lightbulb,
  LockKeyhole,
  ShieldAlert,
} from 'lucide-react';
import {
  getTopicBySlug,
  topicArticles,
  type TopicMode,
  type TopicPublicationStatus,
} from '@/content/topics';

type TopicPageProps = {
  params: Promise<{ slug: string }>;
};

const modeDisplay: Record<
  TopicMode,
  { label: string; icon: typeof FileCheck2; className: string }
> = {
  source_backed: {
    label: '来源支持',
    icon: FileCheck2,
    className: 'border-[#48725f]/30 bg-[#48725f]/8 text-[#315b49]',
  },
  question: {
    label: '待核问题',
    icon: CircleHelp,
    className: 'border-[#8c6d2b]/30 bg-[#8c6d2b]/8 text-[#755818]',
  },
  interpretation: {
    label: '编辑解释',
    icon: Lightbulb,
    className: 'border-primary/30 bg-primary/8 text-primary',
  },
};

const publicationDisplay: Record<TopicPublicationStatus, string> = {
  review_only: '本地审阅',
  public_ready: '可公开',
  not_for_media: '禁止进入媒体包',
};

export function generateStaticParams() {
  return topicArticles.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) return {};
  return {
    title: topic.shortTitle,
    description: topic.dek,
  };
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { slug } = await params;
  const topic = getTopicBySlug(slug);
  if (!topic) notFound();

  return (
    <article className="min-h-screen bg-[#f4f0e8]">
      <header className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="article-shell py-9 sm:py-10">
          <Link href="/topics" className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] transition hover:text-white">
            <ArrowLeft className="size-4" />
            返回历史话题
          </Link>
          <p className="mt-14 text-[10px] font-semibold tracking-[0.18em] text-[#c38a82] uppercase">
            {topic.eyebrow}
          </p>
          <h1 className="mt-6 max-w-5xl font-serif text-[clamp(1.26rem,2.85vw,2.62rem)] font-semibold leading-[1.02] tracking-[-0.055em]">
            {topic.title}
          </h1>
          <p className="mt-8 max-w-3xl font-serif text-lg leading-relaxed text-[#d7cfc2] sm:text-base">
            {topic.dek}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 border-t border-white/15 pt-6 text-[11px] text-[#aeb7b2]">
            <span className="inline-flex items-center gap-1.5">
              <LockKeyhole className="size-3.5" />
              本地审阅版
            </span>
            <span aria-hidden="true">·</span>
            <span>最后整理：{topic.updatedAt}</span>
            <span aria-hidden="true">·</span>
            <span>原始草稿不作为史料来源</span>
          </div>
        </div>
      </header>

      <section className="border-b border-foreground/15">
        <div className="article-shell grid gap-px bg-foreground/15 sm:grid-cols-3">
          {Object.entries(modeDisplay).map(([mode, display]) => {
            const Icon = display.icon;
            return (
              <div key={mode} className="bg-[#f4f0e8] p-5 sm:p-6">
                <Icon className="size-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <strong className="mt-4 block text-sm">{display.label}</strong>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  {mode === 'source_backed' && '只陈述主张与定位支持的最小范围。'}
                  {mode === 'question' && '作为检索任务保留，不升级为人物事实。'}
                  {mode === 'interpretation' && '作者的阅读与判断，不伪装成原文。'}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <div className="article-shell grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_15rem] lg:gap-12 lg:py-10">
        <div>
          <div className="border-l-2 border-primary pl-6">
            <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
              本文核心判断
            </p>
            <p className="mt-3 font-serif text-lg leading-relaxed text-foreground">
              {topic.thesis}
            </p>
          </div>

          <div className="mt-16 space-y-20">
            {topic.sections.map((section, sectionIndex) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <p className="font-serif text-xl italic text-primary/25">
                  {String(sectionIndex + 1).padStart(2, '0')}
                </p>
                <h2 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.035em] sm:text-xl">
                  {section.title}
                </h2>
                <div className="mt-8 space-y-8">
                  {section.paragraphs.map((paragraph) => {
                    const display = modeDisplay[paragraph.mode];
                    const Icon = display.icon;
                    return (
                      <div
                        key={paragraph.id}
                        className="border-t border-foreground/15 pt-6"
                        data-topic-mode={paragraph.mode}
                        data-publication-status={paragraph.publication_status}
                        data-provenance-layer={paragraph.provenance_layer}
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] ${display.className}`}>
                            <Icon className="size-3.5" aria-hidden="true" />
                            {display.label}
                          </span>
                          <span className="border border-foreground/15 px-2.5 py-1 text-[10px] text-muted-foreground">
                            {publicationDisplay[paragraph.publication_status]}
                          </span>
                        </div>
                        <p className="mt-5 text-[15px] leading-[1.7] text-foreground/90">
                          {paragraph.text}
                        </p>

                        {(paragraph.claim_ids.length > 0 ||
                          paragraph.source_ids.length > 0) && (
                          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px]">
                            {paragraph.claim_ids.map((claimId) => (
                              <span key={claimId} className="font-mono text-muted-foreground">
                                {claimId}
                              </span>
                            ))}
                            {paragraph.source_ids.map((sourceId) => (
                              <Link
                                key={sourceId}
                                href={`/archives/${encodeURIComponent(sourceId)}`}
                                className="font-mono text-primary underline-offset-4 hover:underline"
                              >
                                {sourceId}
                              </Link>
                            ))}
                          </div>
                        )}

                        {paragraph.risk_flags.length > 0 && (
                          <p className="mt-4 text-[10px] leading-5 text-muted-foreground">
                            边界：
                            {paragraph.risk_flags.join(' · ')}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-20 grid gap-4 border border-foreground/15 bg-white/35 p-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
            <ShieldAlert className="size-6 text-primary" aria-hidden="true" />
            <div>
              <h2 className="font-serif text-xl font-semibold">这篇文章拒绝给出功劳排名</h2>
              <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                现阶段能负责任地公开的，是材料差异、确证范围和下一步查档问题。
                未核真人因果不会因为适合传播而被写成结论。
              </p>
            </div>
          </div>
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="本文目录" className="border-y border-foreground/15 py-5">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-primary uppercase">
              本文目录
            </p>
            <ol className="mt-4 space-y-3">
              {topic.sections.map((section, index) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="grid grid-cols-[1.5rem_1fr] gap-2 text-xs leading-5 text-muted-foreground transition hover:text-foreground"
                  >
                    <span className="font-mono text-primary/70">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <Link
            href="/studio/media"
            className="mt-6 flex items-center justify-between gap-3 border border-foreground/15 p-4 text-xs font-semibold transition hover:border-primary hover:text-primary"
          >
            生成传播审稿包
            <ArrowRight className="size-4" />
          </Link>
        </aside>
      </div>
    </article>
  );
}

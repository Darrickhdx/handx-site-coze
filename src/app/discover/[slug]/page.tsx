import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { ArticleRightsPassportCard } from '@/components/article-rights-passport';
import { articleBodies } from '@/content/editorial';
import { profile } from '@/content/profile';
import { articleRightsPassports } from '@/content/publication-rights';

type ArticleSlug = keyof typeof articleBodies;

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(articleBodies).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!(slug in articleBodies)) return {};
  const article = articleBodies[slug as ArticleSlug];
  return {
    title: article.title,
    description: article.dek,
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  if (!(slug in articleBodies)) notFound();

  const article = articleBodies[slug as ArticleSlug];
  const rightsPassport = articleRightsPassports[slug as ArticleSlug];
  const isPrimarySourceStory = slug === '1936-pingdiquan';

  return (
    <article
      className="article-page"
      data-reading-root
      data-content-id={slug}
    >
      <header className="border-b border-foreground/15">
        <div className="article-shell py-12 sm:py-20">
          <Link href="/discover" className="story-text-link">
            <ArrowLeft className="size-4" />
            返回发现
          </Link>
          <p className="story-kicker mt-14">{article.kicker}</p>
          <h1 className="article-title mt-6">{article.title}</h1>
          <p className="article-dek mt-8">{article.dek}</p>
          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-foreground/15 pt-6 text-xs text-muted-foreground">
            <span>{article.dateLine}</span>
            <span>本地审阅版</span>
            <span>最后整理：2026-07-24</span>
          </div>
          <Link
            href="/about"
            className="article-author group"
            data-amplitude-event="article_author_opened"
          >
            <Image
              src={profile.portrait}
              alt=""
              width={839}
              height={1024}
              className="article-author-avatar"
              sizes="48px"
            />
            <span className="article-author-copy">
              <strong className="article-author-name">{profile.displayName}</strong>
              <span className="article-author-role">AI 产品实践者 · 苏开元计划发起人</span>
            </span>
            <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </header>

      {isPrimarySourceStory && (
        <div className="article-shell py-10 sm:py-14">
          <Link href="/archives#SRC-013" className="article-source-image group">
            <Image
              src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
              alt="1936 年朱自清《绥行纪略》同期校刊影印局部"
              width={1835}
              height={1035}
              className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.01]"
              sizes="(min-width: 1024px) 960px, 100vw"
              priority
            />
            <span>
              SRC-013 · 官方数字影印局部
              <ArrowRight className="size-4" />
            </span>
          </Link>
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            第三方史料｜朱自清《绥行纪略》｜《国立清华大学校刊》第 792 号第 2 版｜SRC-013。
            本局部仅供本地研究审阅，不随本文授权；公开使用请核对原馆藏规则。
          </p>
        </div>
      )}

      <div className="article-shell grid gap-12 py-14 lg:grid-cols-[minmax(0,1fr)_14rem] lg:gap-20 lg:py-20">
        <div>
          <p className="article-intro">{article.intro}</p>

          <div className="mt-16 space-y-16">
            {article.sections.map((section, index) => (
              <section key={section.heading} className="article-section">
                <p className="article-section-number">0{index + 1}</p>
                <h2>{section.heading}</h2>
                {'paragraphs' in section && (
                  <div className="mt-7 space-y-6">
                    {section.paragraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                )}
                {'bullets' in section && (
                  <ul className="mt-7 space-y-4">
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>
                        <CheckCircle2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div className="article-cta mt-16">
            <FileText className="size-6 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">继续核对</p>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                阅读完整的来源登记、范围说明和目前不能外推的部分。
              </p>
            </div>
            <Link href={article.ctaHref} className="story-button story-button-primary">
              {article.ctaLabel}
              <ArrowRight className="size-4" />
            </Link>
          </div>

          <ArticleRightsPassportCard
            passport={rightsPassport}
            title={article.title}
          />
          <span data-reading-end className="sr-only" aria-hidden="true" />
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="border-y border-foreground/15 py-6">
            <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-foreground uppercase">阅读约定</p>
            <p className="mt-3 text-xs leading-6 text-muted-foreground">
              本文只在已登记范围内转述史料。推断不会伪装成原文，文学段落不会反向写入人物史。
            </p>
          </div>
        </aside>
      </div>
    </article>
  );
}

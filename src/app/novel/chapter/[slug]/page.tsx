import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, List } from 'lucide-react';
import { ChapterComments } from '@/components/chapter-comments';
import { NovelReader } from '@/components/novel-reader';
import {
  adjacentCommentableSections,
  commentableNovelSections,
  novelSectionBySlug,
  pagesForNovelSection,
} from '@/lib/novel';

interface ChapterPageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return commentableNovelSections.map((section) => ({ slug: section.slug }));
}

export async function generateMetadata({
  params,
}: ChapterPageProps): Promise<Metadata> {
  const { slug } = await params;
  const section = novelSectionBySlug.get(slug);
  if (!section?.commentable) return {};
  return {
    title: `${section.title}｜《英雄无名》`,
    description: `阅读《英雄无名》${section.title}，PDF 第 ${section.start_page}—${section.end_page} 页，并提交先审后显的读者意见。`,
  };
}

export default async function NovelChapterPage({ params }: ChapterPageProps) {
  const { slug } = await params;
  const section = novelSectionBySlug.get(slug);
  if (!section?.commentable) notFound();

  const pages = pagesForNovelSection(section);
  const adjacent = adjacentCommentableSections(section);

  return (
    <div className="min-h-screen bg-[#e9e3d8]">
      <header className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-9 sm:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/novel"
              className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] hover:text-white"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              返回小说首页
            </Link>
            <Link
              href="/novel/read"
              className="inline-flex items-center gap-2 text-xs text-[#bdb9b0] hover:text-white"
            >
              <List className="size-4" aria-hidden="true" />
              打开全文阅读
            </Link>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#c38a82] uppercase">
                {section.chapter_number
                  ? `Chapter ${String(section.chapter_number).padStart(2, '0')}`
                  : section.id === 'prologue'
                    ? 'Prologue'
                    : 'Epilogue'}
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-6xl">
                {section.title}
              </h1>
            </div>
            <p className="text-sm text-[#bdb9b0]">
              PDF {section.start_page}—{section.end_page} · {section.page_count}{' '}
              页
            </p>
          </div>
        </div>
      </header>

      <section className="personal-shell py-8 sm:py-12">
        <NovelReader
          pages={pages}
          sections={[section]}
          initialSectionId={section.id}
          mode="chapter"
        />

        <nav
          aria-label="章节切换"
          className="mt-10 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-2"
        >
          {adjacent.previous ? (
            <Link
              href={`/novel/chapter/${adjacent.previous.slug}`}
              className="group flex min-h-28 items-center gap-4 bg-card p-5"
            >
              <ArrowLeft
                className="size-5 text-primary transition-transform group-hover:-translate-x-1"
                aria-hidden="true"
              />
              <span>
                <span className="block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  上一章
                </span>
                <strong className="mt-2 block font-serif text-xl">
                  {adjacent.previous.title}
                </strong>
              </span>
            </Link>
          ) : (
            <div className="min-h-28 bg-card p-5 text-sm text-muted-foreground">
              已是第一个讨论章节
            </div>
          )}
          {adjacent.next ? (
            <Link
              href={`/novel/chapter/${adjacent.next.slug}`}
              className="group flex min-h-28 items-center justify-end gap-4 bg-card p-5 text-right"
            >
              <span>
                <span className="block text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                  下一章
                </span>
                <strong className="mt-2 block font-serif text-xl">
                  {adjacent.next.title}
                </strong>
              </span>
              <ArrowRight
                className="size-5 text-primary transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <div className="min-h-28 bg-card p-5 text-right text-sm text-muted-foreground">
              已是最后一个讨论章节
            </div>
          )}
        </nav>
      </section>

      <ChapterComments chapterId={section.id} chapterTitle={section.title} />
    </div>
  );
}

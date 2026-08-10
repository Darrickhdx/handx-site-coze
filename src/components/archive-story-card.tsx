import Link from 'next/link';
import { ArrowRight, FileText, Quote } from 'lucide-react';
import type { ArchiveReadingMoment } from '@/content/archive-reading';

type ArchiveStoryCardProps = {
  moment: ArchiveReadingMoment;
  index: number;
};

export function ArchiveStoryCard({ moment, index }: ArchiveStoryCardProps) {
  return (
    <article className="group flex min-h-[24rem] flex-col border border-foreground/15 bg-card p-6 transition-colors hover:bg-[#f3eee5] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <p className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
          {moment.era}
        </p>
        <span className="font-serif text-xl italic text-primary/20">0{index + 1}</span>
      </div>

      <h2 className="mt-9 max-w-md font-serif text-2xl font-semibold leading-tight sm:text-xl">
        {moment.title}
      </h2>

      <blockquote className="mt-8 border-l-2 border-primary/60 pl-4 font-serif text-lg leading-[1.7] text-foreground/90">
        <Quote className="mb-3 size-4 text-primary" aria-hidden="true" />
        {moment.opening}
      </blockquote>

      <div className="mt-8 space-y-5 text-sm leading-[1.7] text-muted-foreground">
        <p>
          <strong className="font-semibold text-foreground">我们从这里看见：</strong>
          {moment.whatWeCanSee}
        </p>
        <p>
          <strong className="font-semibold text-foreground">还想继续追问：</strong>
          {moment.unanswered}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap gap-x-5 gap-y-3 pt-9 text-sm">
        <Link
          href={moment.readingHref}
          data-amplitude-event="archive_moment_opened"
          data-amplitude-source-id={moment.sourceId}
          data-amplitude-section="reader_archive"
          className="story-text-link"
        >
          走近这一页原件 <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link
          href={moment.storyHref}
          data-amplitude-event="archive_story_opened"
          data-amplitude-source-id={moment.sourceId}
          data-amplitude-section="reader_archive"
          className="inline-flex items-center gap-1 text-muted-foreground underline decoration-foreground/20 underline-offset-4 hover:text-primary"
        >
          先读故事
        </Link>
      </div>

      <p className="mt-5 flex items-center gap-2 text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        <FileText className="size-3.5 text-primary" aria-hidden="true" />
        研究编号 {moment.sourceId}
      </p>
    </article>
  );
}

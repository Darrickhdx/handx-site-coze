'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpenText,
  ImageOff,
  List,
  LoaderCircle,
  RotateCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  novelProgressKeyFor,
  type NovelReaderPage,
  type NovelSection,
} from '@/lib/novel-types';

function tocHref(section: NovelSection, mode: 'continuous' | 'chapter') {
  if (mode === 'continuous') return `#page-${section.start_page}`;
  return section.commentable
    ? `/novel/chapter/${section.slug}`
    : `/novel/read#page-${section.start_page}`;
}

function NovelToc({
  sections,
  activeSectionId,
  mode,
}: {
  sections: NovelSection[];
  activeSectionId: string;
  mode: 'continuous' | 'chapter';
}) {
  return (
    <nav aria-label="《英雄无名》目录">
      <ol className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <Link
              href={tocHref(section, mode)}
              className={`grid grid-cols-[2.2rem_1fr] gap-2 border-l-2 px-3 py-2 text-xs leading-5 transition ${
                section.id === activeSectionId
                  ? 'border-primary bg-primary/5 text-foreground'
                  : 'border-transparent text-muted-foreground hover:border-foreground/25 hover:text-foreground'
              }`}
            >
              <span className="font-mono text-[9px] text-primary/70">
                {section.kind === 'chapter' && section.chapter_number
                  ? String(section.chapter_number).padStart(2, '0')
                  : section.kind === 'part'
                    ? `P${section.part}`
                    : '·'}
              </span>
              <span>{section.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function NovelReader({
  pages,
  sections,
  initialSectionId,
  mode,
  editionId,
  totalPages,
}: {
  pages: NovelReaderPage[];
  sections: NovelSection[];
  initialSectionId: string;
  mode: 'continuous' | 'chapter';
  editionId: string;
  totalPages: number;
}) {
  const progressKey = novelProgressKeyFor(editionId);
  const [loaded, setLoaded] = useState<Set<number>>(
    () => new Set(pages.slice(0, 2).map((page) => page.number)),
  );
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const [retryCount, setRetryCount] = useState<Record<number, number>>({});
  const [activePage, setActivePage] = useState(pages[0]?.number ?? 1);
  const figureRefs = useRef(new Map<number, HTMLElement>());
  const pageIndex = useMemo(
    () => new Map(pages.map((page, index) => [page.number, index])),
    [pages],
  );
  const activeSectionId =
    pages.find((page) => page.number === activePage)?.section_id ??
    initialSectionId;

  const loadAround = useCallback(
    (number: number) => {
      const index = pageIndex.get(number);
      if (index === undefined) return;
      setLoaded((current) => {
        const next = new Set(current);
        for (const offset of [-1, 0, 1]) {
          const page = pages[index + offset];
          if (page) next.add(page.number);
        }
        return next;
      });
    },
    [pageIndex, pages],
  );

  useEffect(() => {
    const hashPage = Number(window.location.hash.match(/^#page-(\d+)$/)?.[1]);
    if (Number.isInteger(hashPage) && pageIndex.has(hashPage)) {
      loadAround(hashPage);
      setActivePage(hashPage);
    }
  }, [loadAround, pageIndex]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);
        for (const entry of visible) {
          const number = Number((entry.target as HTMLElement).dataset.pageNumber);
          if (!Number.isInteger(number)) continue;
          loadAround(number);
          if (entry.intersectionRatio >= 0.2) {
            setActivePage(number);
            const page = pages[pageIndex.get(number) ?? 0];
            window.localStorage.setItem(
              progressKey,
              JSON.stringify({
                edition_id: editionId,
                page: number,
                section_id: page?.section_id ?? initialSectionId,
                saved_at: new Date().toISOString(),
              }),
            );
          }
        }
      },
      { rootMargin: '200px 0px', threshold: [0.01, 0.2, 0.6] },
    );
    for (const element of figureRefs.current.values()) observer.observe(element);
    return () => observer.disconnect();
  }, [editionId, initialSectionId, loadAround, pageIndex, pages, progressKey]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }
      const currentIndex = pageIndex.get(activePage) ?? 0;
      let nextIndex = currentIndex;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'PageDown') {
        nextIndex = Math.min(pages.length - 1, currentIndex + 1);
      } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft' || event.key === 'PageUp') {
        nextIndex = Math.max(0, currentIndex - 1);
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = pages.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      const target = pages[nextIndex];
      loadAround(target.number);
      figureRefs.current
        .get(target.number)
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activePage, loadAround, pageIndex, pages]);

  const retry = (number: number) => {
    setFailed((current) => {
      const next = new Set(current);
      next.delete(number);
      return next;
    });
    setRetryCount((current) => ({
      ...current,
      [number]: (current[number] ?? 0) + 1,
    }));
    loadAround(number);
  };

  return (
    <div>
      <details className="mb-5 border border-foreground/15 bg-card p-4 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold">
          <List className="size-4 text-primary" aria-hidden="true" />
          打开移动端目录
        </summary>
        <div className="mt-4 max-h-[55vh] overflow-y-auto border-t border-foreground/15 pt-4">
          <NovelToc
            sections={sections}
            activeSectionId={activeSectionId}
            mode={mode}
          />
        </div>
      </details>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div
          className="space-y-7"
          aria-label={`《英雄无名》${mode === 'continuous' ? '连续' : '分章'}页图阅读器`}
        >
          {pages.map((page, index) => {
            const shouldLoad = loaded.has(page.number);
            const hasFailed = failed.has(page.number);
            return (
              <figure
                key={page.number}
                id={`page-${page.number}`}
                data-page-number={page.number}
                ref={(element) => {
                  if (element) figureRefs.current.set(page.number, element);
                  else figureRefs.current.delete(page.number);
                }}
                className="scroll-mt-28"
              >
                <div
                  className="relative overflow-hidden border border-foreground/15 bg-[#ded8cd] shadow-[0_24px_60px_rgba(46,39,31,0.12)]"
                  style={{ aspectRatio: `${page.width} / ${page.height}` }}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  {shouldLoad && !hasFailed ? (
                    <img
                      key={`${page.number}-${retryCount[page.number] ?? 0}`}
                      src={page.path}
                      srcSet={`${page.responsive_path} ${page.responsive_width}w, ${page.path} ${page.width}w`}
                      sizes="(min-width: 1024px) 860px, calc(100vw - 2rem)"
                      width={page.width}
                      height={page.height}
                      loading={index === 0 ? 'eager' : 'lazy'}
                      fetchPriority={index === 0 ? 'high' : 'auto'}
                      alt={`《英雄无名》第 ${page.number} 页水印页图`}
                      draggable={false}
                      className="h-auto w-full select-none"
                      onLoad={() => {
                        setFailed((current) => {
                          const next = new Set(current);
                          next.delete(page.number);
                          return next;
                        });
                      }}
                      onError={() => {
                        setFailed((current) => new Set(current).add(page.number));
                      }}
                    />
                  ) : hasFailed ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                      <ImageOff className="size-8 text-primary" aria-hidden="true" />
                      <p className="mt-4 text-sm font-semibold">第 {page.number} 页加载失败</p>
                      <button
                        type="button"
                        onClick={() => retry(page.number)}
                        className="mt-4 inline-flex min-h-10 items-center gap-2 border border-foreground/20 bg-background px-4 text-xs font-semibold"
                      >
                        <RotateCcw className="size-4" aria-hidden="true" />
                        重新加载
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                      <LoaderCircle className="size-7 animate-spin text-primary/60" aria-hidden="true" />
                      <p className="mt-4 text-xs">第 {page.number} 页进入阅读范围后加载</p>
                    </div>
                  )}
                  {page.local_only && (
                    <span className="absolute top-3 left-3 border border-white/25 bg-[#202827]/90 px-2.5 py-1 text-[9px] tracking-[0.12em] text-white uppercase">
                      local only
                    </span>
                  )}
                </div>
                <figcaption className="mt-2 flex items-center justify-between gap-4 text-[10px] text-muted-foreground">
                  <span>PDF 第 {page.number}／{totalPages} 页</span>
                  <span>{page.local_only ? '含受限图版 · 仅本机' : '作者水印派生页'}</span>
                </figcaption>
              </figure>
            );
          })}
          <div className="flex items-start gap-3 border border-candidate/25 bg-candidate/5 p-4 text-xs leading-6 text-muted-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-candidate" aria-hidden="true" />
            <p>
              页图水印用于提高直接复制成本，不能阻止截图、抓包或 OCR。原始 PDF、DOCX
              与无水印全文从未进入静态路由。
            </p>
          </div>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto border-y border-foreground/15 py-4">
            <div className="mb-4 flex items-center gap-2 px-3">
              <BookOpenText className="size-4 text-primary" aria-hidden="true" />
              <p className="text-xs font-semibold">目录 · 当前第 {activePage} 页</p>
            </div>
            <NovelToc
              sections={sections}
              activeSectionId={activeSectionId}
              mode={mode}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}

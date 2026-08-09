'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

const storyItems = [
  { href: '/sukaiyuan', label: '项目首页', paths: ['/sukaiyuan'] },
  { href: '/discover/1936-pingdiquan', label: '从故事开始', paths: ['/discover/1936-pingdiquan'] },
  { href: '/persons', label: '人物群像', paths: ['/persons'] },
  { href: '/graph', label: '关系图', paths: ['/graph'] },
  { href: '/archives', label: '原件阅读', paths: ['/archives'] },
  { href: '/novel', label: '小说', paths: ['/novel'] },
] as const;

const researchItems = [
  { href: '/evidence', label: '故事与原文对照', paths: ['/evidence'] },
  { href: '/wiki', label: '人物与事件 Wiki', paths: ['/wiki', '/legacy'] },
  { href: '/missions', label: '查档现场', paths: ['/missions'] },
  { href: '/topics', label: '研究专题', paths: ['/topics'] },
] as const;

export function ProjectSectionNav() {
  const pathname = usePathname();
  const activeItemRef = useRef<HTMLAnchorElement>(null);
  const isActive = (paths: readonly string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const researchActive = researchItems.some((item) => isActive(item.paths));

  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [pathname]);

  return (
    <nav
      aria-label="苏开元计划内导航"
      className="border-b border-foreground/15 bg-card/75"
    >
      {/* The strip auto-scrolls to the active item, so on narrow screens it opens
          already clipped at both edges. The scrollbar is hidden, so without a fade
          the cut-off label reads as a rendering fault rather than as more content.
          Only below md, where the strip is actually wider than the viewport. */}
      <div className="personal-shell flex items-center gap-5 overflow-x-auto py-3 [scrollbar-width:none] max-md:[mask-image:linear-gradient(to_right,transparent_0,black_1.5rem,black_calc(100%-1.5rem),transparent_100%)] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[10px] font-bold tracking-[0.17em] text-primary uppercase">
          苏开元计划
        </span>
        <span className="h-4 w-px shrink-0 bg-foreground/15" aria-hidden="true" />
        {storyItems.map((item) => {
          const active = isActive(item.paths);
          return (
            <Link
              key={item.href}
              href={item.href}
              ref={active ? activeItemRef : undefined}
              className={cn(
                'inline-flex min-h-11 shrink-0 items-center py-1 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
        <details className="relative shrink-0">
          <summary
            className={cn(
              'flex min-h-11 cursor-pointer list-none items-center py-1 text-xs font-medium transition-colors [&::-webkit-details-marker]:hidden',
              researchActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            继续研究
            <span className="ml-1 text-[10px]" aria-hidden="true">+</span>
          </summary>
          <div className="absolute right-0 top-full z-50 mt-2 grid w-52 border border-foreground/15 bg-background p-2 shadow-lg">
            {researchItems.map((item) => {
              const active = isActive(item.paths);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  ref={active ? activeItemRef : undefined}
                  className={cn(
                    'rounded-sm px-3 py-2.5 text-xs leading-5 transition-colors hover:bg-card',
                    active ? 'bg-primary/5 font-semibold text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </details>
      </div>
    </nav>
  );
}

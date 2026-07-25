'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, ChevronDown, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/discover', label: '发现', activePath: '/discover' },
  { href: '/topics', label: '话题专题', activePath: '/topics' },
  { href: '/sukaiyuan', label: '苏开元', activePath: '/sukaiyuan' },
  { href: '/graph', label: '知识图谱', activePath: '/graph' },
  { href: '/novel', label: '小说全文', activePath: '/novel' },
  { href: '/studio', label: '家族史工作室', activePath: '/studio' },
  { href: '/about', label: '关于我', activePath: '/about' },
];

const researchItems = [
  { href: '/person', label: '苏开元人物页' },
  { href: '/timeline', label: '断片时间线' },
  { href: '/persons', label: '人物索引' },
  { href: '/events', label: '事件索引' },
  { href: '/wiki', label: '人物与事件 Wiki' },
  { href: '/archives', label: '原件阅览室' },
  { href: '/controversies', label: '未解问题' },
  { href: '/methodology', label: '研究方法' },
  { href: '/about#contact', label: '提供线索与联系' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileResearchOpen, setMobileResearchOpen] = useState(false);
  const [researchOpen, setResearchOpen] = useState(false);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLElement>(null);

  const closeMobileMenu = (restoreFocus = false) => {
    setMobileOpen(false);
    setMobileResearchOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileButtonRef.current?.focus());
    }
  };

  useEffect(() => {
    setMobileOpen(false);
    setMobileResearchOpen(false);
    setResearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMobileMenu(true);
      }
    };
    document.addEventListener('keydown', handleEscape);
    window.requestAnimationFrame(() => {
      mobileNavigationRef.current?.querySelector<HTMLAnchorElement>('a')?.focus();
    });
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileOpen]);

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === '/') return pathname === '/';
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex h-[4.25rem] max-w-[84rem] items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex shrink-0 items-center gap-3" aria-label="鉴真小秃驴个人网站首页">
          <span className="flex size-8 items-center justify-center border border-accent/40 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
            <BookOpen className="size-4" strokeWidth={1.5} />
          </span>
          <span>
            <span className="block font-serif text-base font-semibold tracking-[0.08em] text-foreground transition-colors group-hover:text-accent sm:text-lg">
              鉴真小秃驴
            </span>
            <span className="hidden text-[9px] font-semibold tracking-[0.22em] text-muted-foreground uppercase sm:block">
              AI · Product · Family Archive
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-4 lg:flex" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              data-amplitude-event="master_navigation_opened"
              data-amplitude-destination={item.href}
              className={cn(
                'relative py-2 text-[13px] font-medium transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:bg-primary after:transition-transform',
                isActive(item.activePath)
                  ? 'text-primary after:scale-x-100'
                  : 'text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100'
              )}
              aria-current={isActive(item.activePath) ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}

          <div
            className="relative"
            onMouseEnter={() => setResearchOpen(true)}
            onMouseLeave={() => setResearchOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                setResearchOpen(false);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                setResearchOpen(false);
                event.currentTarget.querySelector<HTMLButtonElement>('button')?.focus();
              }
            }}
          >
            <button
              className={cn(
                'flex items-center gap-1 py-2 text-[13px] font-medium transition-colors',
                researchItems.some((item) => isActive(item.href))
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => setResearchOpen(!researchOpen)}
              aria-expanded={researchOpen}
              aria-haspopup="true"
            >
              研究档案
              <ChevronDown className={cn('size-3.5 transition-transform', researchOpen && 'rotate-180')} />
            </button>
            {researchOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-48 border border-foreground/15 bg-card py-2 shadow-float">
                {researchItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-amplitude-event="header_research_archive_opened"
                    data-amplitude-destination={item.href}
                    onClick={() => setResearchOpen(false)}
                    className={cn(
                      'block px-4 py-2.5 text-sm transition-colors',
                      isActive(item.href)
                        ? 'bg-primary/5 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <button
          ref={mobileButtonRef}
          className="flex size-11 items-center justify-center text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
          onClick={() => {
            if (mobileOpen) closeMobileMenu(true);
            else setMobileOpen(true);
          }}
          aria-label={mobileOpen ? '关闭菜单' : '打开菜单'}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {mobileOpen && (
        <nav
          ref={mobileNavigationRef}
          id="mobile-navigation"
          className="max-h-[calc(100svh-4.25rem)] overflow-y-auto border-t border-foreground/10 bg-card lg:hidden"
          aria-label="移动端主导航"
        >
          <div className="px-4 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  data-amplitude-event="mobile_master_navigation_opened"
                  data-amplitude-destination={item.href}
                  className={cn(
                    'block px-3 py-3 text-sm font-medium transition-colors',
                    isActive(item.activePath)
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => closeMobileMenu()}
                  aria-current={isActive(item.activePath) ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 border-t border-foreground/10 pt-4">
              <button
                type="button"
                className="flex min-h-11 w-full items-center justify-between gap-3 px-3 text-left text-[11px] font-semibold tracking-[0.16em] text-muted-foreground uppercase"
                onClick={() => setMobileResearchOpen((open) => !open)}
                aria-expanded={mobileResearchOpen}
                aria-controls="mobile-research-navigation"
              >
                苏开元研究档案
                <ChevronDown className={cn('size-4 transition-transform', mobileResearchOpen && 'rotate-180')} />
              </button>
              {mobileResearchOpen && (
                <div id="mobile-research-navigation" className="space-y-1">
                  {researchItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-amplitude-event="mobile_research_archive_opened"
                      data-amplitude-destination={item.href}
                      className={cn(
                        'block px-3 py-3 text-sm font-medium transition-colors',
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )}
                      onClick={() => closeMobileMenu()}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

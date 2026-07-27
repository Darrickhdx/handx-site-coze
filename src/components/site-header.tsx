'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, BookOpen, Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { primaryNavigation } from '@/content/site';
import { cn } from '@/lib/utils';

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLElement>(null);

  const closeMobileMenu = (restoreFocus = false) => {
    setMobileOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => mobileButtonRef.current?.focus());
    }
  };

  useEffect(() => {
    setMobileOpen(false);
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

  const pathMatches = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(`${path}/`));

  const isActive = (paths: readonly string[]) => paths.some(pathMatches);

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

        <div className="hidden items-center gap-7 lg:flex">
          <nav className="flex items-center gap-6" aria-label="主导航">
            {primaryNavigation.map((item) => {
              const active = isActive(item.activePaths);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-amplitude-event="master_navigation_opened"
                  data-amplitude-destination={item.href}
                  className={cn(
                    'relative py-2 text-[13px] font-medium transition-colors after:absolute after:right-0 after:bottom-0 after:left-0 after:h-px after:origin-left after:bg-primary after:transition-transform',
                    active
                      ? 'text-primary after:scale-x-100'
                      : 'text-muted-foreground after:scale-x-0 hover:text-foreground hover:after:scale-x-100'
                  )}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <Link
            href="/about#contact"
            className="inline-flex min-h-10 items-center gap-2 border border-foreground/20 px-4 text-xs font-semibold tracking-[0.08em] text-foreground transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
            data-amplitude-event="header_contact_opened"
          >
            联系合作
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>

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
          <div className="space-y-1 px-4 py-4">
            {primaryNavigation.map((item) => {
              const active = isActive(item.activePaths);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-amplitude-event="mobile_master_navigation_opened"
                  data-amplitude-destination={item.href}
                  className={cn(
                    'block min-h-11 px-3 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                  onClick={() => closeMobileMenu()}
                  aria-current={active ? 'page' : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/about#contact"
              className="mt-3 flex min-h-11 items-center justify-between border border-foreground/15 px-3 py-3 text-sm font-semibold text-foreground"
              onClick={() => closeMobileMenu()}
            >
              联系合作
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

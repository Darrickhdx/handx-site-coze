'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { getLocalSessionId, sendLocalAnalytics } from '@/lib/local-engagement';
import { localAnalyticsIsSuppressed } from '@/lib/analytics-policy';

const propertyAttributes = {
  amplitudeDestination: 'destination',
  amplitudeNode: 'node',
  amplitudePath: 'path',
  amplitudeSection: 'section',
  amplitudeSourceId: 'source_id',
  amplitudeStep: 'step',
  amplitudeStory: 'story',
} as const;

function contentContext(pathname: string): Record<string, string> {
  const articleMatch = pathname.match(/^\/discover\/([a-z0-9-]+)$/);
  if (articleMatch) {
    return {
      content_id: articleMatch[1],
      content_type: 'article',
    };
  }
  const topicMatch = pathname.match(/^\/topics\/([a-z0-9-]+)$/);
  if (topicMatch) {
    return {
      content_id: topicMatch[1],
      content_type: 'article',
    };
  }
  const chapterMatch = pathname.match(/^\/novel\/chapter\/([a-z0-9-]+)$/);
  if (chapterMatch) {
    return {
      content_id: chapterMatch[1],
      content_type: 'story',
    };
  }
  if (pathname === '/novel' || pathname === '/novel/read') {
    return { content_id: 'hero-wuming', content_type: 'story' };
  }
  if (pathname === '/sukaiyuan') return { content_id: 'sukaiyuan', content_type: 'story' };
  if (pathname === '/about') return { content_id: 'about', content_type: 'profile' };
  if (pathname === '/studio' || pathname.startsWith('/studio/')) {
    return {
      content_id: pathname === '/studio'
        ? 'studio'
        : pathname.slice(1).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 64),
      content_type: 'service',
    };
  }
  if (
    pathname === '/archives'
    || pathname === '/graph'
    || pathname === '/methodology'
    || pathname === '/persons'
    || pathname === '/person'
    || pathname === '/events'
    || pathname === '/timeline'
    || pathname === '/controversies'
    || pathname === '/wiki'
    || pathname.startsWith('/wiki/')
    || pathname.startsWith('/legacy/')
    || pathname.startsWith('/archives/')
  ) {
    return {
      content_id: pathname.slice(1).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 64),
      content_type: 'evidence',
    };
  }
  return {
    content_id:
      pathname === '/'
        ? 'home'
        : pathname.slice(1).replace(/[^a-z0-9]+/gi, '-').toLowerCase().slice(0, 64) ||
          'home',
    content_type: 'site',
  };
}

function viewportClass(): 'mobile' | 'tablet' | 'desktop' {
  if (window.innerWidth < 640) return 'mobile';
  if (window.innerWidth < 1024) return 'tablet';
  return 'desktop';
}

function destinationGroup(element: HTMLElement): string | undefined {
  const anchor = element.closest<HTMLAnchorElement>('a[href]');
  if (!anchor) return undefined;
  const url = new URL(anchor.href, window.location.origin);
  if (url.origin !== window.location.origin) return 'external_source';
  if (url.pathname.startsWith('/discover/')) return 'next_content';
  if (
    ['/archives', '/graph', '/methodology', '/persons', '/person', '/events', '/timeline', '/controversies', '/wiki', '/legacy']
      .some((path) => url.pathname.startsWith(path))
  ) {
    return 'evidence';
  }
  if (url.pathname === '/about') return 'profile';
  if (url.pathname === '/studio') return 'service';
  return 'navigation';
}

function sendPageViewOnce(pathname: string): void {
  const key = 'jian-zhen-last-page-view-v2';
  const now = Date.now();
  const previous = window.sessionStorage.getItem(key);
  if (previous) {
    try {
      const parsed = JSON.parse(previous) as { path?: string; at?: number };
      if (parsed.path === pathname && typeof parsed.at === 'number' && now - parsed.at < 1500) {
        return;
      }
    } catch {
      window.sessionStorage.removeItem(key);
    }
  }
  window.sessionStorage.setItem(key, JSON.stringify({ path: pathname, at: now }));
  sendLocalAnalytics('page_view', pathname, {
    ...contentContext(pathname),
    viewport_class: viewportClass(),
  });
}

export function LocalAnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (localAnalyticsIsSuppressed(pathname)) return;
    sendPageViewOnce(pathname);
  }, [pathname]);

  useEffect(() => {
    if (localAnalyticsIsSuppressed(pathname)) return;

    const handleClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;
      const trackedElement = event.target.closest<HTMLElement>('[data-amplitude-event]');
      if (!trackedElement) return;

      const eventName = trackedElement.dataset.amplitudeEvent;
      if (!eventName) return;

      const properties = Object.fromEntries(
        Object.entries(propertyAttributes)
          .map(([datasetKey, propertyKey]) => {
            const value = trackedElement.dataset[datasetKey];
            return value ? [propertyKey, value] : null;
          })
          .filter((entry): entry is [string, string] => entry !== null),
      );
      const group = destinationGroup(trackedElement);
      sendLocalAnalytics(eventName, window.location.pathname, {
        ...contentContext(window.location.pathname),
        ...properties,
        ...(group ? { destination_group: group } : {}),
      });
    };

    document.addEventListener('click', handleClick, { capture: true });
    return () => document.removeEventListener('click', handleClick, { capture: true });
  }, [pathname]);

  useEffect(() => {
    if (localAnalyticsIsSuppressed(pathname)) return;

    const root = document.querySelector<HTMLElement>('[data-reading-root]');
    const endMarker = document.querySelector<HTMLElement>('[data-reading-end]');
    if (!root || !endMarker) return;

    const contentId = root.dataset.contentId;
    if (!contentId) return;

    const sessionId = getLocalSessionId();
    const milestoneKey = (milestone: string) =>
      `jian-zhen-reading-v2:${sessionId}:${contentId}:${milestone}`;
    let visibleSeconds = 0;
    let furthestProgress = 0;
    let endSeen = false;

    const updateProgress = () => {
      const rect = root.getBoundingClientRect();
      const consumed = Math.max(0, window.innerHeight - rect.top);
      furthestProgress = Math.max(
        furthestProgress,
        Math.min(1, consumed / Math.max(1, root.scrollHeight)),
      );
    };
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) endSeen = true;
      },
      { threshold: 0.2 },
    );
    observer.observe(endMarker);
    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      visibleSeconds += 1;

      if (
        visibleSeconds >= 20
        && furthestProgress >= 0.4
        && !window.sessionStorage.getItem(milestoneKey('reading_engaged'))
      ) {
        window.sessionStorage.setItem(milestoneKey('reading_engaged'), '1');
        sendLocalAnalytics('reading_engaged', pathname, {
          content_id: contentId,
          content_type: 'article',
        });
      }

      if (
        visibleSeconds >= 45
        && endSeen
        && window.sessionStorage.getItem(milestoneKey('reading_engaged')) === '1'
        && !window.sessionStorage.getItem(milestoneKey('reading_completed'))
      ) {
        window.sessionStorage.setItem(milestoneKey('reading_completed'), '1');
        sendLocalAnalytics('reading_completed', pathname, {
          content_id: contentId,
          content_type: 'article',
        });
      }
    }, 1000);

    return () => {
      window.clearInterval(timer);
      observer.disconnect();
      window.removeEventListener('scroll', updateProgress);
    };
  }, [pathname]);

  return null;
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenText } from 'lucide-react';

const progressKey = 'handx-novel-progress-v0.1';

export function ContinueNovelButton() {
  const [page, setPage] = useState<number | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(progressKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { page?: number };
      if (
        typeof parsed.page === 'number' &&
        Number.isInteger(parsed.page) &&
        parsed.page >= 1 &&
        parsed.page <= 182
      ) {
        setPage(parsed.page);
      }
    } catch {
      window.localStorage.removeItem(progressKey);
    }
  }, []);

  return (
    <Link
      href={page ? `/novel/read#page-${page}` : '/novel/chapter/prologue'}
      className="story-button story-button-primary"
    >
      <BookOpenText className="size-4" aria-hidden="true" />
      {page ? `继续第 ${page} 页` : '从楔子开始'}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, BookOpenText } from 'lucide-react';
import { novelProgressKeyFor } from '@/lib/novel-types';

export function ContinueNovelButton({
  editionId,
  totalPages,
}: {
  editionId: string;
  totalPages: number;
}) {
  const [page, setPage] = useState<number | null>(null);

  useEffect(() => {
    const progressKey = novelProgressKeyFor(editionId);
    const stored = window.localStorage.getItem(progressKey);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as { edition_id?: string; page?: number };
      if (
        parsed.edition_id === editionId &&
        typeof parsed.page === 'number' &&
        Number.isInteger(parsed.page) &&
        parsed.page >= 1 &&
        parsed.page <= totalPages
      ) {
        setPage(parsed.page);
      }
    } catch {
      window.localStorage.removeItem(progressKey);
    }
  }, [editionId, totalPages]);

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

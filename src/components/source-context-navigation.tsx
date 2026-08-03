'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { evidencePathById } from '@/content/evidence-paths';

interface SourceContextNavigationProps {
  sourceId: string;
}

export function SourceContextNavigation({ sourceId }: SourceContextNavigationProps) {
  const searchParams = useSearchParams();
  const context = searchParams.get('context') ?? '';
  const claim = searchParams.get('claim') ?? '';

  if (context.startsWith('evidence-')) {
    const evidenceId = context.slice('evidence-'.length);
    const path = evidencePathById.get(evidenceId);
    if (
      path
      && path.selectedSourceIds.includes(sourceId as never)
      && (!claim || path.claimIds.includes(claim as never))
    ) {
      return (
        <Link href={`/evidence/${path.id}#step-3`} className="story-text-link">
          <ArrowLeft className="size-4" aria-hidden="true" />
          返回“{path.title}”证据链
        </Link>
      );
    }
  }

  return (
    <Link href="/archives" className="story-text-link">
      <ArrowLeft className="size-4" aria-hidden="true" />
      返回史料阅览室
    </Link>
  );
}

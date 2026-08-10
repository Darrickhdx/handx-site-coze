import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPublicEdition } from '@/lib/edition';

export const metadata: Metadata = {
  title: '家族史工作室',
  description: '把寻找苏开元的经验整理成可复用、重隐私、可审计的家族史研究服务。',
};

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Owner tooling. The public runtime also 404s these prefixes at the edge; this
  // is the second layer, so a misconfigured runtime cannot expose them.
  if (isPublicEdition) notFound();
  return children;
}

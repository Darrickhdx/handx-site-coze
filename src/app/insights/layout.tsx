import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isPublicEdition } from '@/lib/edition';

export const metadata: Metadata = {
  title: '本机访问与留言看板',
  description: '仅在本地审阅站可见的脱敏访问统计与私密留言。',
};

export default function InsightsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Owner tooling. The public runtime also 404s these prefixes at the edge; this
  // is the second layer, so a misconfigured runtime cannot expose them.
  if (isPublicEdition) notFound();
  return children;
}

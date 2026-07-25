import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '研究方法' };

export default function MethodologyLayout({ children }: { children: ReactNode }) {
  return children;
}

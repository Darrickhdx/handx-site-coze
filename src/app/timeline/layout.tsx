import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '时间线' };

export default function TimelineLayout({ children }: { children: ReactNode }) {
  return children;
}

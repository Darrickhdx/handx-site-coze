import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '事件索引' };

export default function EventsLayout({ children }: { children: ReactNode }) {
  return children;
}

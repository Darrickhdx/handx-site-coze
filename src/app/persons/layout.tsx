import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '人物索引' };

export default function PersonsLayout({ children }: { children: ReactNode }) {
  return children;
}

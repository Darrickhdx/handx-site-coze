import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '苏开元人物页' };

export default function PersonLayout({ children }: { children: ReactNode }) {
  return children;
}

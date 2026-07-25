import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '史料阅览室' };

export default function ArchivesLayout({ children }: { children: ReactNode }) {
  return children;
}

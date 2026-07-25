import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: '争议与未决' };

export default function ControversiesLayout({ children }: { children: ReactNode }) {
  return children;
}

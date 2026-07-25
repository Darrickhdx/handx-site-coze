import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '关于我',
  description: '认识鉴真小秃驴：二十多年软硬一体产品经验，以及 AI、传统行业和苏开元家族史项目的长期实践。',
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}

import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '关于我',
  description: '认识鉴真小秃驴：AI 产品与软硬件实践者，18 年多产品与工程经历，关注日本业务与传统行业数字化。',
};

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}

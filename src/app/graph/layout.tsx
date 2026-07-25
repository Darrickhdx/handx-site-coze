import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '故事图谱',
  description: '沿三条策展路线探索苏开元研究中的人物、地点、职务与文献，并回到支持每条关系的来源。',
};

export default function GraphLayout({ children }: { children: ReactNode }) {
  return children;
}

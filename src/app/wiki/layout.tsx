import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: '人物与历史 Wiki',
  description: '按人物、事件、机构、地点、职务和文献浏览苏开元研究的公开审计实体。',
};

export default function WikiLayout({ children }: { children: ReactNode }) {
  return children;
}

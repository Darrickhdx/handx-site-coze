import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '文章与手记',
  description: '围绕苏开元、家族史、AI 研究与历史小说的长文、档案谜题和方法笔记。',
};

export default function DiscoverLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

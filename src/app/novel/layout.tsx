import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '《英雄无名》全文',
  description: '韩大昕历史小说《英雄无名》V0.3 本地审阅版：182页全文、32章分章阅读与审核制评论。',
};

export default function NovelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

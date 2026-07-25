import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '本机访问与留言看板',
  description: '仅在本地审阅站可见的脱敏访问统计与私密留言。',
};

export default function InsightsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

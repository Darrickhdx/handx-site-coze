import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI 与产品',
  description: '鉴真小秃驴的 AI 软硬一体、行业系统与个人知识工程实践。',
};

export default function AiLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

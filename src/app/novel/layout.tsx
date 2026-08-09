import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '《英雄无名》全文',
  description: '《英雄无名》V1.5 全书阅读器，以及V1.2冻结基线、V1.3候选版的版本台账与史实来源伴读。',
};

export default function NovelLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

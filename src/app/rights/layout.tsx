import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '版权与转载策略草案',
  description: '鉴真小秃驴个人网站待确认的分层版权、转载、引用与商业授权方案。',
};

export default function RightsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

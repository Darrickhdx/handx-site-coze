import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '隐私与数据说明',
  description: '本地审阅版网站的访问统计、留言保存、数据最小化与公开上线边界。',
};

export default function PrivacyLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}

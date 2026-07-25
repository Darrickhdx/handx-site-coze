import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '媒体矩阵审稿台',
  description:
    '仅在本机使用的多平台内容审稿与素材包导出工具，不连接账号、不自动发布。',
};

export default function MediaStudioLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}

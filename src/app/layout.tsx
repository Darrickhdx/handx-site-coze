import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LocalAnalyticsProvider } from '@/components/local-analytics-provider';
import { isPublicEdition, searchIndexingAllowed } from '@/lib/edition';

const indexable = isPublicEdition && searchIndexingAllowed;

export const metadata: Metadata = {
  title: {
    default: '鉴真小秃驴｜AI 产品与软硬件实践者',
    template: '%s · 鉴真小秃驴',
  },
  description:
    '鉴真小秃驴的个人网站：AI 产品与软硬件实践者，关注日本业务与传统行业数字化。记录产品经历、AI 信息研究、苏开元研究与《英雄无名》创作。',
  keywords: [
    '鉴真小秃驴',
    'AI 产品',
    '软硬件产品',
    '日本业务',
    '传统行业数字化',
    'AI 工作流',
    '内容流水线',
    '知识图谱',
    '英雄无名',
    '家族史研究',
    '苏开元',
  ],
  authors: [{ name: '鉴真小秃驴' }],
  openGraph: {
    title: '鉴真小秃驴｜AI 产品与软硬件实践者',
    description: '从真实业务现场出发，连接硬件、软件、数据与 AI，关注日本业务与传统行业数字化。',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: indexable,
    follow: indexable,
    nocache: !indexable,
    googleBot: {
      index: indexable,
      follow: indexable,
      noimageindex: !indexable,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen flex flex-col">
        <LocalAnalyticsProvider />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:rounded-md focus:bg-foreground focus:px-4 focus:py-3 focus:text-background focus:shadow-lg"
        >
          跳到主要内容
        </a>
        <SiteHeader />
        <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-16">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

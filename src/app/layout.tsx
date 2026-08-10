import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { LocalAnalyticsProvider } from '@/components/local-analytics-provider';

export const metadata: Metadata = {
  title: {
    default: '鉴真小秃驴｜独立开发者',
    template: '%s · 鉴真小秃驴',
  },
  description:
    '独立开发者鉴真小秃驴的个人网站：用 AI 把复杂的东西做完整——538 页的《英雄无名》全书免费读、一条可重跑的考据流水线，以及这座网站本身。',
  keywords: [
    '鉴真小秃驴',
    '独立开发者',
    'AI 工作流',
    '内容流水线',
    '知识图谱',
    '英雄无名',
    '家族史研究',
    '苏开元',
  ],
  authors: [{ name: '鉴真小秃驴' }],
  openGraph: {
    title: '鉴真小秃驴｜独立开发者',
    description: '一个人，用 AI 把复杂的东西做完整。',
    type: 'website',
    locale: 'zh_CN',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
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

import type { Metadata } from 'next';
import './globals.css';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PreviewBanner } from '@/components/preview-banner';
import { LocalAnalyticsProvider } from '@/components/local-analytics-provider';

export const metadata: Metadata = {
  title: {
    default: '鉴真小秃驴｜AI 产品与家族史实践',
    template: '%s · 鉴真小秃驴',
  },
  description:
    '鉴真小秃驴的个人网站：用二十多年软硬一体产品经验，探索 AI 如何进入传统行业硬件、系统平台与真实问题；“寻找苏开元”是首个家族史实践。',
  keywords: [
    '鉴真小秃驴',
    'AI 产品',
    'AI 硬件',
    '软硬一体',
    '智能终端',
    '家族史研究',
    '苏开元',
  ],
  authors: [{ name: '鉴真小秃驴' }],
  openGraph: {
    title: '鉴真小秃驴｜AI 产品与家族史实践',
    description: '让 AI 真正进入传统行业的设备、系统平台与业务现场。',
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
        <PreviewBanner />
        <main id="main-content" tabIndex={-1} className="flex-1 scroll-mt-16">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

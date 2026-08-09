import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, List } from 'lucide-react';
import { NovelReader } from '@/components/novel-reader';
import { novelManifest } from '@/lib/novel';

export const metadata: Metadata = {
  title: '《英雄无名》连续阅读',
  description: '按页连续阅读《英雄无名》V1.5 水印全书版。',
};

export default function FullNovelReaderPage() {
  return (
    <main className="min-h-screen bg-[#e9e3d8]">
      <header className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-9 sm:py-12">
          <Link
            href="/novel"
            className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回小说首页
          </Link>
          <div className="mt-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.16em] text-[#c38a82] uppercase">
                Continuous reader
              </p>
              <h1 className="mt-3 font-serif text-4xl font-semibold sm:text-6xl">
                《英雄无名》全文
              </h1>
            </div>
            <div className="max-w-xl text-sm leading-7 text-[#bdb9b0]">
              <p>{novelManifest.totals.pages} 页按视野分批加载；键盘方向键、Page Up／Down、Home／End 均可翻页。</p>
              <p className="mt-1">稳定锚点格式：#page-N。</p>
              <Link href="/novel/editions" className="mt-2 inline-block text-[#d7cfc2] underline decoration-white/20 underline-offset-4">
                这一版和其他版本有什么不同？
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="personal-shell py-8 sm:py-12">
        <div className="mb-6 flex items-start gap-3 border border-foreground/15 bg-[#f4f0e8] p-4 text-xs leading-6 text-muted-foreground">
          <List className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
          <p>
            目录包含不开放评论的封面、前言、分部与附录。评论请从对应的单章页面进入。
          </p>
        </div>
        <NovelReader
          pages={novelManifest.pages}
          sections={novelManifest.sections}
          initialSectionId={novelManifest.sections[0].id}
          mode="continuous"
        />
      </section>
    </main>
  );
}

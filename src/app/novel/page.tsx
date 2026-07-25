import Link from 'next/link';
import {
  ArrowRight,
  BookOpenText,
  FileCheck2,
  MessageSquareText,
  ShieldAlert,
} from 'lucide-react';
import { ContinueNovelButton } from '@/components/continue-novel-button';
import {
  commentableNovelSections,
  novelManifest,
} from '@/lib/novel';

const parts = [
  { number: 1, title: '有名', chapters: '第一章—第八章' },
  { number: 2, title: '潜行', chapters: '第九章—第十七章' },
  { number: 3, title: '虎穴', chapters: '第十八章—第二十六章' },
  { number: 4, title: '无名', chapters: '第二十七章—第三十二章' },
];

export default function NovelPage() {
  return (
    <main className="overflow-hidden bg-[#f4f0e8]">
      <section className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell grid gap-12 py-14 lg:grid-cols-[minmax(0,0.72fr)_minmax(28rem,0.58fr)] lg:items-center lg:gap-20 lg:py-20">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Full novel · local review
            </p>
            <h1 className="mt-8 font-serif text-[clamp(4.6rem,10vw,9rem)] font-semibold leading-[0.82] tracking-[-0.075em]">
              英雄
              <br />
              无名
            </h1>
            <p className="mt-8 font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-3xl">
              我的曾外祖父苏开元
            </p>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#bdb9b0]">
              韩大昕著。V0.3 出版式内部审阅版，182 页、32 章。现在可以从头连续阅读，
              也可以按章节进入；楔子、32 个编号章节与尾声开放先审后显的读者讨论。
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <ContinueNovelButton />
              <Link href="/novel/read" className="story-button personal-button-light">
                从头连续阅读
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-[#aaa69f]">
              <span>{novelManifest.totals.pages} 页</span>
              <span>{novelManifest.totals.numbered_chapters} 章</span>
              <span>{novelManifest.totals.commentable_sections} 个讨论区</span>
              <span>原始 PDF／DOCX 不在网页中</span>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-md">
            <div className="rotate-[1.2deg] overflow-hidden border border-white/15 bg-[#171c1b] shadow-[0_35px_90px_rgba(0,0,0,0.35)]">
              <img
                src={novelManifest.pages[0].path}
                alt="《英雄无名》V0.3 水印封面"
                width={novelManifest.pages[0].width}
                height={novelManifest.pages[0].height}
                draggable={false}
                className="h-auto w-full select-none"
              />
            </div>
            <figcaption className="mt-4 text-center text-[10px] text-[#918d86]">
              水印派生封面 · 本地审阅
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-px bg-foreground/15 sm:grid-cols-4">
          {parts.map((part) => (
            <div key={part.number} className="bg-[#f4f0e8] p-6">
              <p className="font-serif text-4xl italic text-primary/30">
                {String(part.number).padStart(2, '0')}
              </p>
              <h2 className="mt-3 font-serif text-2xl font-semibold">{part.title}</h2>
              <p className="mt-2 text-xs text-muted-foreground">{part.chapters}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="personal-shell py-14 sm:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.66fr_1.34fr] lg:gap-20">
          <div>
            <p className="story-kicker">阅读说明</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em]">
              这是小说，
              <br />
              不是史实数据库。
            </h2>
            <div className="mt-7 space-y-4 text-sm leading-7 text-muted-foreground">
              <p>
                全文同时包含公开史料、家族口述、合理外推与文学构造。故事中的感染力不能反向把
                未核经历升级为历史事实。
              </p>
              <p>
                每张页面都已经写入像素水印。它只能提高直接复制成本，不能阻止截图、抓包或 OCR；
                本站也不会声称它能做到绝对防复制。
              </p>
            </div>
          </div>
          <div className="grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
            {[
              ['F', '可核史实', '能回到来源定位的最小事实。'],
              ['I', '合理外推', '从史实出发，但必须标明止步位置。'],
              ['X', '文学构造', '人物内心、对白、行动与合成情节。'],
            ].map(([key, title, note]) => (
              <article key={key} className="bg-card p-6">
                <span className="font-serif text-5xl text-primary/35">{key}</span>
                <h3 className="mt-5 font-serif text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">{note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-card">
        <div className="personal-shell py-14 sm:py-20">
          <div className="flex flex-col justify-between gap-5 border-b border-foreground/15 pb-6 md:flex-row md:items-end">
            <div>
              <p className="story-kicker">章节目录</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em]">
                从楔子，到尾声
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-7 text-muted-foreground">
              单章阅读只请求本章当前页及相邻页，不会在初次进入时下载其他章节。
            </p>
          </div>

          <div className="mt-7 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
            {commentableNovelSections.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/novel/chapter/${chapter.slug}`}
                className="group min-h-44 bg-background p-5 transition hover:bg-[#f7f2e8]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[10px] text-primary">
                    {chapter.chapter_number
                      ? `CH ${String(chapter.chapter_number).padStart(2, '0')}`
                      : chapter.id === 'prologue'
                        ? 'PROLOGUE'
                        : 'EPILOGUE'}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {chapter.page_count} 页
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-2xl font-semibold leading-tight">
                  {chapter.title}
                </h3>
                <div className="mt-5 flex items-center justify-between text-xs text-muted-foreground">
                  <span>PDF {chapter.start_page}—{chapter.end_page}</span>
                  <ArrowRight
                    className="size-4 text-primary transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="personal-shell py-14 sm:py-20">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="border border-foreground/15 bg-card p-6">
            <BookOpenText className="size-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-serif text-2xl font-semibold">全文与分章</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              182 页唯一归属到封面、前言、目录、四个分部、32 章、尾声、后记和附录。
            </p>
          </div>
          <div className="border border-foreground/15 bg-card p-6">
            <MessageSquareText className="size-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-serif text-2xl font-semibold">先审后显</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              评论永远先进入 pending。本地管理员批准后才出现在相应章节，且不会成为史料或图谱主张。
            </p>
          </div>
          <div className="border border-foreground/15 bg-card p-6">
            <ShieldAlert className="size-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-serif text-2xl font-semibold">打赏在二期</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              V0.1 不接支付、不保存支付信息。待公开授权、账号体系和法务边界完成后再评估。
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/novel/read" className="story-button story-button-primary">
            <BookOpenText className="size-4" aria-hidden="true" />
            打开全文阅读器
          </Link>
          <Link href="/novel/chapter/prologue" className="story-button story-button-secondary">
            <FileCheck2 className="size-4" aria-hidden="true" />
            从楔子开始
          </Link>
        </div>
      </section>
    </main>
  );
}

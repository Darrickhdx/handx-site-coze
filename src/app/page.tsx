import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  FileSearch,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { personaBridge, profile } from '@/content/profile';
import { aiProofs, selectedContents } from '@/content/site';

// Delivered work, not a résumé. The twenty-year hardware record still matters
// and stays on /about; leading with it here pulled the persona back toward
// "product director at a large company", which is what this rewrite moves away from.
const trustProofs = [
  {
    value: '538 页',
    label: '《英雄无名》从 Markdown 到印刷版与网页页图，全书免费读',
  },
  {
    value: '123 份',
    label: '来源登记与逐条主张核验，一条可重跑的考据流水线',
  },
  {
    value: '1 人',
    label: '这座网站：Next.js 16，构建前跑完整条数据校验链',
  },
] as const;

export default function HomePage() {
  return (
    <div className="personal-home overflow-hidden">
      <section className="personal-hero border-b border-foreground/15">
        <div className="personal-shell grid min-h-[24rem] items-center gap-10 py-7 lg:grid-cols-[minmax(0,1.02fr)_minmax(24rem,0.72fr)] lg:gap-12 lg:py-8">
          <div className="relative z-10 max-w-[45rem]">
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Indie developer · AI workflows
            </p>
            <p className="mt-6 text-sm font-semibold tracking-[0.15em] text-primary uppercase">
              {profile.displayName}
            </p>
            <h1 className="personal-display mt-4 text-[clamp(1.95rem,3.05vw,2.9rem)] font-semibold leading-[1.01] tracking-[-0.058em]">
              一个人，
              <span className="block text-accent">把复杂的东西做完整。</span>
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-foreground sm:text-base">
              {personaBridge}
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              我用 AI 做完整的东西：一本 538 页的书、一座自己写的网站、一条能重复跑的考据流水线——
              起点是一个被历史漏掉的人。
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/novel"
                className="story-button personal-button-primary"
                data-amplitude-event="home_sukaiyuan_opened"
              >
                免费读整本书
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/ai"
                className="story-text-link"
                data-amplitude-event="home_profile_opened"
              >
                看我是怎么做出来的
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <Link
            href="/about"
            className="group relative mx-auto w-full max-w-[19rem] border border-foreground/15 bg-card p-3 shadow-float"
            aria-label={`认识${profile.displayName}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <Image
                src={profile.portrait}
                alt={`${profile.displayName}的黑白头像`}
                fill
                priority
                sizes="(min-width: 1024px) 34vw, 86vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              />
            </div>
            <div className="flex items-center justify-between gap-5 px-2 pb-1 pt-4">
              <span>
                <strong className="block font-serif text-base">{profile.displayName}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{profile.title}</span>
              </span>
              <ArrowRight className="size-5 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-7 sm:py-10">
        <div className="personal-shell">
          <p className="text-xs font-semibold tracking-[0.15em] text-primary uppercase">你为什么来到这里？</p>
          <div className="mt-6 grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 md:grid-cols-3">
            {[
              {
                number: '01',
                title: '我想读那本书',
                description: '《英雄无名》538 页全书免费读，不注册、不收费。',
                href: '/novel',
              },
              {
                number: '02',
                title: '我想看是怎么做的',
                description: '一个人的 AI 内容流水线、知识工程与这座网站本身。',
                href: '/ai',
              },
              {
                number: '03',
                title: '我想了解苏开元',
                description: '从故事、人物群像、关系图与原件入口进入完整项目。',
                href: '/sukaiyuan',
              },
            ].map((route) => (
              <Link key={route.href} href={route.href} className="group bg-background p-6 transition-colors hover:bg-[#eee8dc] sm:p-7">
                <span className="font-serif text-lg text-primary/40">{route.number}</span>
                <strong className="mt-5 flex items-center justify-between gap-4 font-serif text-lg">
                  {route.title}
                  <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </strong>
                <span className="mt-3 block text-sm leading-[1.7] text-muted-foreground">{route.description}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-8 sm:py-10">
        <div className="personal-shell grid gap-10 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)] lg:items-start lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              What I bring
            </p>
            <h2 className="personal-heading mt-6">先做完，再说做得多新。</h2>
            <p className="mt-6 max-w-lg text-[15px] leading-[1.7] text-muted-foreground">
              一个能力有没有用，看它能不能一路走到成品：能重跑、能核对、能交给别人读。
              下面这些数字是交付物，不是简历。
            </p>
          </div>
          <div>
            <div className="grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
              {trustProofs.map((item) => (
                <div key={item.value} className="bg-background p-6 sm:min-h-32 sm:p-7">
                  <strong className="font-serif text-xl text-primary sm:text-xl">{item.value}</strong>
                  <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">{item.label}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              年限、职务与负责范围来自本人履历；公开项目资料只用于核对产品与时代背景，不替代个人任职证明。
            </p>
          </div>
        </div>
      </section>

      <section className="personal-feature border-y border-white/15 py-8 text-[#f3efe7] sm:py-8">
        <div className="personal-shell grid gap-14 lg:grid-cols-[minmax(0,0.86fr)_minmax(28rem,1.14fr)] lg:items-center lg:gap-14">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Flagship project · 01
            </p>
            <h2 className="personal-feature-title mt-7">寻找苏开元</h2>
            <p className="mt-4 font-serif text-lg leading-relaxed text-[#d7cfc2] sm:text-base">
              一张 1936 年的校刊，带回一个被历史遗漏的名字。
            </p>
            <p className="mt-8 max-w-2xl text-[15px] leading-[1.7] text-[#bdb9b0]">
              苏开元是我的曾祖父。家族记忆里有他，朱自清的《绥行纪略》中也出现了“苏开元团长”。
              这项计划从一份可以核对的原件开始，慢慢寻找人物、事件和时代之间真正站得住的连接。
            </p>
            <div className="mt-9 flex items-start gap-3 border-t border-white/15 pt-6 text-xs leading-6 text-[#aaa69f]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
              <p>目前可以确认名字与称谓出现在这份同期文献中；是否就是家族人物，仍待更多材料闭环。</p>
            </div>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link
                href="/discover/1936-pingdiquan"
                className="story-button personal-button-light"
                data-amplitude-event="home_flagship_story_opened"
              >
                先读这个故事
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/sukaiyuan" className="personal-dark-link">
                浏览完整项目
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <Link
            href="/discover/1936-pingdiquan"
            className="personal-feature-document group"
            aria-label="阅读朱自清在平地泉遇见了谁"
          >
            <Image
              src="/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png"
              alt="1936 年朱自清《绥行纪略》同期校刊影印局部，包含苏开元团长的文字记录"
              width={1835}
              height={1035}
              className="h-full w-full object-cover grayscale transition-transform duration-500 group-hover:scale-[1.015]"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <span className="personal-feature-stamp">朱自清<br />绥行纪略</span>
            <span className="personal-feature-caption">
              1936 · 第三方校刊影印局部 · 本地审阅 · 不随文授权
              <ArrowRight className="size-4" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-8 sm:py-8">
        <div className="personal-shell">
          <div className="grid gap-7 border-b border-foreground/15 pb-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                AI that ships
              </p>
              <h2 className="personal-heading mt-6">我能把 AI 带到哪里。</h2>
            </div>
            <p className="max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              不是把“AI”贴在旧产品上，而是重新理解现场、能力边界与交付链路。
            </p>
          </div>

          <div className="grid gap-px overflow-hidden border-x border-b border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {aiProofs.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number} className="flex min-h-[16rem] flex-col bg-background p-7 sm:p-9">
                  <div className="flex items-center justify-between text-primary">
                    <span className="font-serif text-xl italic text-primary/35">{item.number}</span>
                    <Icon className="size-6" strokeWidth={1.4} aria-hidden="true" />
                  </div>
                  <p className="mt-10 text-[11px] font-bold tracking-[0.18em] text-primary uppercase">{item.eyebrow}</p>
                  <h3 className="mt-4 font-serif text-lg font-semibold leading-snug tracking-[-0.025em]">{item.title}</h3>
                  <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">{item.description}</p>
                  <p className="mt-auto border-t border-foreground/15 pt-5 text-xs leading-6 text-muted-foreground">{item.note}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 flex justify-end">
            <Link href="/ai" className="story-text-link">
              查看能力与代表案例
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-8">
        <div className="personal-shell">
          <div className="grid gap-8 border-b border-foreground/15 pb-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Selected work
              </p>
              <h2 className="personal-heading mt-6">从这里继续认识我。</h2>
            </div>
            <p className="max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              三条路线分别给想了解苏开元、想看 AI 工作方法和想进入小说世界的读者。
            </p>
          </div>

          <div className="divide-y divide-foreground/15 border-b border-foreground/15">
            {selectedContents.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group grid gap-5 py-7 transition-colors hover:text-primary sm:grid-cols-[2.5rem_1.1fr_1fr_auto] sm:items-center"
                  data-amplitude-event="home_selected_content_opened"
                  data-amplitude-destination={item.href}
                >
                  <span className="text-sm tabular-nums text-muted-foreground">0{index + 1}</span>
                  <span>
                    <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                      <Icon className="size-4" strokeWidth={1.5} aria-hidden="true" />
                      {item.kind}
                    </span>
                    <strong className="mt-2 block font-serif text-lg leading-snug text-foreground group-hover:text-primary">
                      {item.title}
                    </strong>
                  </span>
                  <span className="text-sm leading-[1.7] text-muted-foreground">{item.description}</span>
                  <span className="flex items-center justify-between gap-4 text-xs text-muted-foreground sm:block">
                    {item.meta}
                    <ArrowRight className="size-4 text-primary transition-transform group-hover:translate-x-1 sm:mt-3" aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 grid overflow-hidden border border-foreground/15 bg-card lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="p-7 sm:p-10">
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Let&apos;s talk
              </p>
              <h2 className="mt-6 max-w-3xl font-serif text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-xl">
                如果你正在做 AI 产品，或也想把一段家族历史重新整理出来。
              </h2>
              <p className="mt-5 max-w-2xl text-sm leading-[1.7] text-muted-foreground">
                欢迎交流 AI 与传统行业、软硬一体产品、内容合作与家族史研究，也欢迎提供与苏开元有关的可核线索。
              </p>
            </div>
            <div className="flex flex-col gap-3 border-t border-foreground/15 p-7 lg:min-w-72 lg:border-l lg:border-t-0 lg:p-9">
              <Link href="/studio/diagnosis" className="story-button story-button-primary">
                家族史起步诊断
                <FileSearch className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/about#contact" className="story-text-link">
                联系我
                <Mail className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Mail, ShieldCheck } from 'lucide-react';
import { profile } from '@/content/profile';
import {
  collaborationBrief,
  deliveryStages,
  pps7700Case,
  productPositioning,
  researchAndCreation,
} from '@/content/product-positioning';
import { selectedContents } from '@/content/site';
import profileMediaAuthorization from '@/data/profile-media-authorization.json';

const productImage = profileMediaAuthorization.assets.find(
  (asset) => asset.visual_kind === 'official_product_display',
);

export default function HomePage() {
  return (
    <div className="personal-home overflow-hidden">
      <section className="personal-hero border-b border-foreground/15">
        <div className="personal-shell grid items-center gap-10 py-10 sm:py-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)] lg:gap-16 lg:py-16">
          <div className="min-w-0 max-w-3xl">
            <p className="personal-kicker">
              <span aria-hidden="true" />
              {productPositioning.focus}
            </p>
            <p className="mt-7 text-sm font-semibold tracking-[0.15em] text-primary">
              {profile.displayName}
            </p>
            <h1 className="personal-display mt-4 max-w-4xl text-[clamp(2.15rem,4.3vw,4rem)] font-semibold leading-[1.13] tracking-[-0.055em]">
              <span className="block">{productPositioning.headlineLead}</span>
              <span className="block text-accent">{productPositioning.headlineOutcome}</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-foreground">
              {productPositioning.introduction}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground">
              {productPositioning.evidence}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <Link href="/about#pps7700" className="story-button personal-button-primary">
                看 PPS7700 产品案例
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/about#contact" className="story-text-link min-h-12">
                聊聊你的业务问题
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 border-t border-foreground/15 pt-5 text-sm text-muted-foreground">
              <span>来读历史或小说？</span>
              <Link href="/sukaiyuan" className="underline underline-offset-4 hover:text-primary">寻找苏开元</Link>
              <Link href="/novel" className="underline underline-offset-4 hover:text-primary" data-amplitude-event="home_sukaiyuan_opened">免费读《英雄无名》</Link>
            </div>
          </div>

          <Link
            href="/about"
            className="group mx-auto w-full max-w-[16rem] border border-foreground/15 bg-card p-3 shadow-float sm:max-w-[19rem]"
            aria-label={`认识${profile.displayName}`}
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              <Image
                src={profile.portrait}
                alt={`${profile.displayName}的黑白头像`}
                fill
                priority
                sizes="(min-width: 640px) 304px, 256px"
                className="object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-4 px-2 pb-1 pt-4">
              <span>
                <strong className="block font-serif text-base">{profile.displayName}</strong>
                <span className="mt-1 block text-xs text-muted-foreground">{profile.title}</span>
              </span>
              <ArrowRight className="size-5 shrink-0 text-primary" aria-hidden="true" />
            </div>
          </Link>
        </div>
      </section>

      <section aria-labelledby="product-work-heading" className="border-b border-foreground/15 py-12 sm:py-16">
        <div className="personal-shell">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />产品与现场</p>
              <h2 id="product-work-heading" className="personal-heading mt-5">从需求到交付，看具体做了什么。</h2>
            </div>
            <Link href="/ai" className="story-text-link min-h-12" data-amplitude-event="home_profile_opened">
              更多 AI 与产品实践
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <article className="grid overflow-hidden border border-foreground/15 bg-card lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
            <div className="min-w-0 p-6 sm:p-9 lg:p-11">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-3 text-xs">
                <span className="border border-accent/25 bg-accent/10 px-3 py-1.5 font-semibold text-accent">{pps7700Case.status}</span>
                <span className="text-muted-foreground">{pps7700Case.period} · 日本自动售货机</span>
              </div>
              <h3 className="mt-6 max-w-2xl font-serif text-2xl font-semibold leading-snug tracking-[-0.035em] sm:text-3xl">
                {pps7700Case.title}
              </h3>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">{pps7700Case.problem}</p>
              <dl className="mt-6 border-y border-foreground/15 py-5 text-sm">
                <dt className="font-semibold text-primary">我负责的部分</dt>
                <dd className="mt-2 leading-7">{pps7700Case.responsibility}</dd>
              </dl>
              <p className="mt-5 text-xs leading-6 text-muted-foreground">
                {pps7700Case.award}。奖项属于产品及受赏企业 INSPIRY JAPAN 株式会社；个人负责范围由本人提供。
              </p>
              <Link href="/about#pps7700" className="story-text-link mt-6 min-h-12">
                看业务问题、职责与交付证据
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            {productImage && (
              <figure className="flex min-w-0 flex-col justify-center border-t border-foreground/15 bg-white p-5 sm:p-8 lg:border-l lg:border-t-0">
                <Image
                  src={`/${productImage.path}`}
                  alt={productImage.alt}
                  width={productImage.width}
                  height={productImage.height}
                  unoptimized
                  className="h-auto w-full object-contain"
                  sizes="(min-width: 1024px) 40vw, 100vw"
                />
                <figcaption className="mt-5 border-t border-foreground/15 pt-4 text-xs leading-6 text-muted-foreground">
                  <p>{productImage.caption}</p>
                  <p>
                    <a href={productImage.source_page} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-primary">
                      INSPIRY PPS7700 · ©JDP / GOOD DESIGN AWARD
                    </a>
                    {' · '}
                    <a href={productImage.license_url} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:text-primary">
                      {productImage.license}
                    </a>
                  </p>
                </figcaption>
              </figure>
            )}
          </article>

          <article className="mt-6 grid gap-5 border border-foreground/15 p-6 sm:p-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-center lg:gap-10">
            <div>
              <p className="text-xs font-semibold tracking-[0.12em] text-primary">当前探索 · 研发验证及试点准备</p>
              <h3 className="mt-3 font-serif text-xl font-semibold">日本自动售货机智能运营</h3>
            </div>
            <div>
              <p className="text-sm leading-7 text-muted-foreground">
                把销售依据、库存补货、现金核对和路线作业连起来。现场效果与生产部署仍待验证。
              </p>
              <Link href="/ai" className="story-text-link mt-4 min-h-12">
                看实践与验证边界
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section aria-labelledby="working-method-heading" className="border-b border-foreground/15 py-12 sm:py-16">
        <div className="personal-shell">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />怎样参与</p>
              <h2 id="working-method-heading" className="personal-heading mt-5">先把问题与边界说明白。</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">{productPositioning.currentFocus}</p>
          </div>
          <ol className="mt-9 grid gap-6 md:grid-cols-3">
            {deliveryStages.map((stage) => (
              <li key={stage.number} className="border-t border-foreground/20 pt-5">
                <span className="font-serif text-2xl text-primary/50">{stage.number}</span>
                <h3 className="mt-4 font-serif text-xl font-semibold">{stage.title}</h3>
                <p className="mt-3 max-w-md text-sm leading-7 text-muted-foreground">{stage.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section aria-labelledby="research-heading" className="personal-feature py-12 text-[#f3efe7] sm:py-16">
        <div className="personal-shell">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
            <div>
              <p className="personal-kicker personal-kicker-light"><span aria-hidden="true" />给历史与小说读者</p>
              <h2 id="research-heading" className="mt-5 font-serif text-[clamp(1.5rem,2.3vw,2.15rem)] font-semibold leading-snug tracking-[-0.035em]">产品之外，我也研究和写作。</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#d7cfc2]">
              家族线索让我开始寻找苏开元，也尝试用 AI 整理材料。这些作品呈现信息研究、知识管理与内容交付的过程，欢迎从故事和原件读起。
            </p>
          </div>
          <div className="mt-9 grid gap-6 md:grid-cols-2">
            {researchAndCreation.map((work) => (
              <article key={work.href} className="flex min-w-0 flex-col border border-white/20 p-6 sm:p-8">
                <p className="text-xs font-semibold tracking-[0.12em] text-[#c38a82]">{work.label}</p>
                <h3 className="mt-4 font-serif text-2xl font-semibold">{work.title}</h3>
                <p className="mt-4 text-sm leading-7 text-[#d7cfc2]">{work.description}</p>
                <p className="mt-5 flex items-start gap-2 text-xs leading-6 text-[#d7cfc2]">
                  <ShieldCheck className="mt-1 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
                  {work.note}
                </p>
                <div className="mt-auto pt-6">
                  <Link href={work.href} className="personal-dark-link" data-amplitude-event={work.href === '/sukaiyuan' ? 'home_flagship_story_opened' : undefined}>
                    {work.linkLabel}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="selected-reading-heading" className="border-b border-foreground/15 py-12 sm:py-16">
        <div className="personal-shell">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <h2 id="selected-reading-heading" className="personal-heading">从一篇文章开始。</h2>
            <Link href="/discover" className="story-text-link min-h-12">
              浏览文章
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="mt-7 divide-y divide-foreground/15 border-y border-foreground/15">
            {selectedContents.map((item) => (
              <Link key={item.href} href={item.href} className="group grid gap-3 py-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-center sm:gap-7" data-amplitude-event="home_selected_content_opened" data-amplitude-destination={item.href}>
                <span>
                  <span className="text-xs font-semibold text-primary">{item.kind}</span>
                  <strong className="mt-2 block font-serif text-lg font-semibold leading-snug group-hover:text-primary">{item.title}</strong>
                </span>
                <span className="text-sm leading-7 text-muted-foreground">{item.description}</span>
                <span className="flex items-center gap-4 text-xs text-muted-foreground">
                  {item.meta}
                  <ArrowRight className="size-4 shrink-0 text-primary" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="collaboration-heading" className="py-12 sm:py-16">
        <div className="personal-shell grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-14">
          <div>
            <p className="personal-kicker"><span aria-hidden="true" />商业合作</p>
            <h2 id="collaboration-heading" className="personal-heading mt-5">有现场问题，欢迎带着它来聊。</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              AI 产品、软硬件协同、日本业务或传统行业数字化，都可以先从一封简短的来信开始。
            </p>
            <Link href="/about#contact" className="story-button personal-button-primary mt-7">
              查看联系方式
              <Mail className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="border border-foreground/15 bg-card p-6 sm:p-8">
            <h3 className="font-serif text-lg font-semibold">来信里，写清这三件事就好。</h3>
            <ol className="mt-6 space-y-5">
              {collaborationBrief.map((item, index) => (
                <li key={item.title} className="flex gap-4">
                  <span className="pt-0.5 font-serif text-lg text-primary/60" aria-hidden="true">0{index + 1}</span>
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold">{item.title}</h4>
                    <p className="mt-1 text-sm leading-7 text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </div>
  );
}

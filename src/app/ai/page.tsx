import Link from 'next/link';
import { ArrowRight, Cpu, Mail, Network, ScanSearch } from 'lucide-react';
import { aiPracticeAreas, profile, projectExperience } from '@/content/profile';
import {
  collaborationBrief,
  deliveryStages,
  pps7700Case,
  productPositioning,
  researchAndCreation,
} from '@/content/product-positioning';

const capabilityIcons = [Cpu, Network, ScanSearch] as const;

const participationFocus = [
  '产品定义、软硬件协同、原型验证与客户导入。',
  '梳理现场流程、数据与系统接口，明确能够验证的试点范围。',
  '建立资料结构、来源规则、检索与内容生产流程，保留人的核对与验收。',
] as const;

export default function AiProductPage() {
  return (
    <div className="profile-page">
      <section className="profile-hero border-b border-foreground/15">
        <div className="personal-shell grid gap-10 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center lg:gap-16">
          <div className="min-w-0">
            <p className="personal-kicker"><span aria-hidden="true" />AI &amp; Product</p>
            <p className="mt-6 text-sm font-semibold tracking-[0.12em] text-primary">
              {productPositioning.focus}
            </p>
            <h1 className="personal-display mt-4 max-w-3xl text-[clamp(2rem,3.4vw,3.5rem)] font-semibold leading-[1.15] tracking-[-0.055em]">
              从现场需求，
              <span className="block text-accent">一起走到产品交付。</span>
            </h1>
            <p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {productPositioning.introduction}
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted-foreground">
              {productPositioning.currentFocus}
            </p>
            <p className="mt-5 text-xs leading-6 text-muted-foreground">{productPositioning.evidence}</p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#projects" className="story-button personal-button-primary">
                看项目与参与范围
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <Link href="/about#contact" className="story-text-link">
                讨论业务问题
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <a href="#research" className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground underline underline-offset-4 hover:text-primary">
              来读研究或小说？从这里开始
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>

          <aside className="min-w-0 border border-foreground/15 bg-white/55 p-6 sm:p-8">
            <p className="personal-kicker"><span aria-hidden="true" />My part in the process</p>
            <h2 className="mt-5 font-serif text-2xl font-semibold leading-snug tracking-[-0.035em]">
              问题、方案与验证，
              <span className="block">需要放在同一条线上。</span>
            </h2>
            <ol className="mt-6 divide-y divide-foreground/15">
              {deliveryStages.map((stage) => (
                <li key={stage.number} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 py-5 first:pt-0 last:pb-0">
                  <span className="font-serif text-xl text-primary/60">{stage.number}</span>
                  <div>
                    <h3 className="text-sm font-semibold">{stage.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">{stage.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section id="projects" className="scroll-mt-28 border-b border-foreground/15 py-12 sm:py-16">
        <div className="personal-shell">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />Project evidence</p>
              <h2 className="personal-heading mt-6">项目处在什么阶段，我参与了什么。</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              个人任职、项目时间与负责范围由本人提供。公开资料用于核对产品背景与奖项；
              每项经历都保留当前阶段与资料说明。
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {projectExperience.map((item, index) => {
              const isPps7700 = item.projectId === 'pps7700';

              return (
                <article
                  key={item.projectTitle}
                  className={`min-w-0 border border-foreground/15 p-6 sm:p-8 ${isPps7700 ? 'bg-[#202827] text-[#f3efe7] lg:col-span-2' : 'bg-white/40'}`}
                >
                  <div className={isPps7700 ? 'grid gap-7 lg:grid-cols-[1fr_0.7fr] lg:gap-14' : ''}>
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <p className={`text-xs leading-6 ${isPps7700 ? 'text-[#c38a82]' : 'text-primary'}`}>
                          0{index + 1} · {item.industry}
                        </p>
                        <span className={`shrink-0 border px-3 py-1.5 text-xs leading-5 ${isPps7700 ? 'border-white/20 text-[#f3efe7]' : 'border-foreground/20 text-foreground'}`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="mt-4 font-serif text-xl font-semibold leading-snug tracking-[-0.025em] sm:text-2xl">
                        {item.projectTitle}
                      </h3>
                      <p className={`mt-3 text-xs leading-6 ${isPps7700 ? 'text-[#c6c1b8]' : 'text-muted-foreground'}`}>
                        {item.period ? `${item.period} · ` : ''}{item.role} · {item.organization}
                      </p>
                      <p className={`mt-5 text-sm leading-7 ${isPps7700 ? 'text-[#d9d4ca]' : 'text-muted-foreground'}`}>
                        {item.description}
                      </p>
                    </div>

                    {isPps7700 && (
                      <div className="border-t border-white/15 pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
                        <p className="text-xs font-semibold tracking-[0.12em] text-[#c38a82]">完整案例</p>
                        <p className="mt-3 font-serif text-lg leading-8">
                          业务问题 → 本人职责 → 项目约束 → 商业化交付
                        </p>
                        <p className="mt-4 text-sm leading-7 text-[#c6c1b8]">
                          {pps7700Case.award}。奖项属于产品与受赏企业，个人职责按本人提供的经历呈现。
                        </p>
                        <Link href="/about#pps7700" className="story-button personal-button-light mt-6">
                          查看 PPS7700 案例与官方图片
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {item.projectFact && (
                    <div className={`mt-6 border-t pt-5 ${isPps7700 ? 'border-white/15' : 'border-foreground/15'}`}>
                      <p className={`text-xs font-semibold ${isPps7700 ? 'text-[#c38a82]' : 'text-primary'}`}>产品背景 · 公开资料</p>
                      <p className={`mt-2 text-sm leading-7 ${isPps7700 ? 'text-[#c6c1b8]' : 'text-muted-foreground'}`}>
                        {item.projectFact}
                      </p>
                    </div>
                  )}

                  {(item.evidenceBoundary || item.sources) && (
                    <details className={`mt-5 border-t pt-5 text-sm ${isPps7700 ? 'border-white/15' : 'border-foreground/15'}`}>
                      <summary className={`cursor-pointer font-semibold ${isPps7700 ? 'text-[#c38a82]' : 'text-primary'}`}>
                        资料说明{item.sources ? '与来源' : ''}
                      </summary>
                      {item.evidenceBoundary && (
                        <p className={`mt-3 leading-7 ${isPps7700 ? 'text-[#c6c1b8]' : 'text-muted-foreground'}`}>
                          {item.evidenceBoundary}
                        </p>
                      )}
                      {item.sources && (
                        <ul className="mt-4 space-y-3">
                          {item.sources.map((source) => (
                            <li key={source.url}>
                              <a href={source.url} target="_blank" rel="noopener noreferrer" className={`underline underline-offset-4 ${isPps7700 ? 'text-[#f3efe7] hover:text-[#c38a82]' : 'text-primary hover:text-accent'}`}>
                                {source.label}
                              </a>
                              <p className={`mt-1 text-xs leading-6 ${isPps7700 ? 'text-[#c6c1b8]' : 'text-muted-foreground'}`}>
                                {source.note}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </details>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-28 py-12 sm:py-16">
        <div className="personal-shell">
          <p className="personal-kicker"><span aria-hidden="true" />Where I can contribute</p>
          <h2 className="personal-heading mt-6">从这些经历，找到适合参与的部分。</h2>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
            可以从已有业务、设备或资料开始，先明确目标和现有条件，再讨论产品定义、验证或交付协作的范围。
          </p>
          <div className="mt-8 grid gap-px border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {aiPracticeAreas.map((area, index) => {
              const Icon = capabilityIcons[index];

              return (
                <article key={area.number} className="min-w-0 bg-background p-6 sm:p-8">
                  <div className="flex items-start justify-between gap-6">
                    <Icon className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
                    <span className="font-serif text-2xl text-primary/40">{area.number}</span>
                  </div>
                  <h3 className="mt-6 font-serif text-xl font-semibold leading-snug tracking-[-0.025em]">{area.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-muted-foreground">{area.description}</p>
                  <div className="mt-6 border-t border-foreground/15 pt-5">
                    <p className="text-xs font-semibold text-primary">可以参与</p>
                    <p className="mt-2 text-sm leading-7">{participationFocus[index]}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section id="research" className="scroll-mt-28 border-y border-foreground/15 bg-[#eee8dc] py-12 sm:py-16">
        <div className="personal-shell">
          <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />Research &amp; creation</p>
              <h2 className="personal-heading mt-6">另一种产品实践：把材料做成能核验、能阅读的作品。</h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
              研究需要回到来源，创作需要完成作品。本站把两者分别呈现，也留下整理信息、组织证据与内容交付的实际成果。
            </p>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {researchAndCreation.map((item) => (
              <article key={item.title} className="min-w-0 border border-foreground/15 bg-background/70 p-6 sm:p-8">
                <p className="text-xs font-semibold text-primary">{item.label}</p>
                <h3 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.035em]">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">{item.description}</p>
                <p className="mt-4 border-l-2 border-primary/35 pl-3 text-xs leading-6 text-muted-foreground">{item.note}</p>
                <Link href={item.href} className="story-text-link mt-6">
                  {item.linkLabel}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
          <div className="mt-7 grid gap-5 border-t border-foreground/15 pt-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              想开始自己的家族史研究？现有起步诊断以五个选择题帮助判断研究起点，不上传材料、不保存答案、不调用外部模型。
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              <Link href="/studio/diagnosis" className="story-text-link">
                起步诊断<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/discover/ai-family-history" className="story-text-link">
                阅读研究方法<ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-16">
        <div className="personal-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="personal-kicker"><span aria-hidden="true" />Work together</p>
            <h2 className="personal-heading mt-6">先说说你正在解决的问题。</h2>
            <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
              有设备、系统或业务现场的团队，可以从一个具体问题开始交流。无需准备完整方案，来信说明以下三件事即可。
            </p>
            <div className="mt-7 flex flex-col items-start gap-4">
              <Link href="/about#contact" className="story-button personal-button-primary" data-amplitude-event="ai_contact_opened">
                联系合作
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <a href={`mailto:${profile.email}`} className="inline-flex max-w-full items-center gap-2 text-sm text-muted-foreground hover:text-primary">
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                <span className="break-all">{profile.email}</span>
              </a>
            </div>
          </div>
          <ol className="divide-y divide-foreground/15 border-y border-foreground/15">
            {collaborationBrief.map((item, index) => (
              <li key={item.title} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4 py-6 sm:gap-6">
                <span className="font-serif text-2xl text-primary/50">0{index + 1}</span>
                <div>
                  <h3 className="font-serif text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}

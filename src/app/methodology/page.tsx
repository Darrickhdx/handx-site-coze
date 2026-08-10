import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, Layers, ShieldAlert } from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  aiBoundary,
  claimStates,
  evidenceTiers,
  fixLayers,
  forbiddenList,
  fourLayers,
  identityPrinciples,
  identityRules,
  independenceRule,
  methodologyIntro,
  reuseChecklist,
} from '@/content/methodology';

export const metadata: Metadata = {
  title: '研究方法',
  description:
    '一套给个人研究者的工作方法：材料怎么登记、事实怎么分级、身份怎么分流、AI 用在哪一步，以及哪些话在证据到位前不许写。',
};

export default function MethodologyPage() {
  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <ProjectSectionNav />

      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-10 sm:py-14">
          <p className="personal-kicker personal-kicker-light">
            <span aria-hidden="true" />
            {methodologyIntro.kicker}
          </p>
          <h1 className="mt-6 max-w-4xl font-serif text-[clamp(1.95rem,3.05vw,2.9rem)] font-semibold leading-[1.06] tracking-[-0.05em]">
            {methodologyIntro.title}
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-[#d7cfc2] sm:text-xl">
            {methodologyIntro.dek}
          </p>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-[#aaa69f]">
            {methodologyIntro.lede}
          </p>
        </div>
      </header>

      <main>
        <section className="personal-shell py-10 sm:py-14">
          <p className="story-kicker">01 · 四层模型</p>
          <h2 className="personal-heading mt-3">材料、来源、主张、图谱，是四件不同的东西。</h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
            个人研究出错，多半不是因为读得不细，而是因为把这四层混在一起：把一个文件当成一份材料，
            把一份材料当成一条事实，把一条事实当成一个人的一段人生。
          </p>
          <div className="mt-7 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2 xl:grid-cols-4">
            {fourLayers.map((row, index) => (
              <article key={row.key} className="bg-background p-5 sm:p-6">
                <p className="font-serif text-xl italic text-primary/35">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-3 font-serif text-lg font-semibold">{row.layer}</h3>
                <p className="mt-1 font-mono text-[10px] tracking-wide text-primary">{row.key}</p>
                <p className="mt-3 text-[13px] leading-[1.7] text-muted-foreground">{row.what}</p>
                <p className="mt-3 border-t border-foreground/10 pt-3 text-[13px] leading-[1.7] text-foreground/80">
                  {row.rule}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-foreground/15 bg-card py-10 sm:py-14">
          <div className="personal-shell grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div>
              <p className="story-kicker">02 · 独立性</p>
              <h2 className="personal-heading mt-3">{independenceRule.title}</h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-muted-foreground">
                {independenceRule.body}
              </p>
            </div>
            <div className="space-y-4">
              <p className="border-l-2 border-primary bg-background px-5 py-4 text-[15px] leading-[1.7]">
                {independenceRule.mechanism}
              </p>
              <p className="text-[15px] leading-[1.7] text-muted-foreground">
                {independenceRule.consequence}
              </p>
            </div>
          </div>
        </section>

        <section className="personal-shell py-10 sm:py-14">
          <p className="story-kicker">03 · 身份</p>
          <h2 className="personal-heading mt-3">同名的人，先分开，再等证据合并。</h2>
          <div className="mt-7 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2">
            {identityRules.map((rule) => (
              <article key={rule.code} className="bg-background p-6">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-2xl font-semibold text-primary">{rule.code}</span>
                  <h3 className="font-serif text-lg font-semibold">{rule.name}</h3>
                </div>
                <p className="mt-4 text-[15px] leading-[1.7] text-muted-foreground">{rule.meaning}</p>
                <p className="mt-3 border-t border-foreground/10 pt-3 text-[13px] leading-[1.7] text-foreground/80">
                  {rule.guard}
                </p>
              </article>
            ))}
          </div>
          <ul className="mt-6 grid gap-2.5">
            {identityPrinciples.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-[1.7] text-muted-foreground">
                <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-foreground/15 bg-card py-10 sm:py-14">
          <div className="personal-shell">
            <p className="story-kicker">04 · 分级与状态</p>
            <h2 className="personal-heading mt-3">证据有等级，主张有状态。</h2>
            <div className="mt-7 grid gap-8 lg:grid-cols-2 lg:gap-14">
              <div>
                <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                  <Layers className="size-4 text-primary" aria-hidden="true" />
                  证据等级
                </h3>
                <dl className="mt-4 grid gap-px border border-foreground/15 bg-foreground/15">
                  {evidenceTiers.map((row) => (
                    <div key={row.tier} className="flex gap-4 bg-background p-4">
                      <dt className="w-6 shrink-0 font-mono text-lg font-semibold text-primary">
                        {row.tier}
                      </dt>
                      <dd>
                        <span className="font-semibold">{row.name}</span>
                        <span className="mt-1 block text-[13px] leading-[1.7] text-muted-foreground">
                          {row.note}
                        </span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <h3 className="font-serif text-lg font-semibold">主张状态</h3>
                <dl className="mt-4 grid gap-px border border-foreground/15 bg-foreground/15">
                  {claimStates.map((row) => (
                    <div key={row.state} className="bg-background p-4">
                      <dt className="font-mono text-[11px] tracking-wide text-primary">{row.state}</dt>
                      <dd className="mt-1.5 text-[13px] leading-[1.7] text-muted-foreground">
                        {row.note}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </div>
        </section>

        <section className="personal-shell py-10 sm:py-14">
          <p className="story-kicker">05 · 史实与虚构</p>
          <h2 className="personal-heading mt-3">同一段文字里，标清楚哪一句是哪一层。</h2>
          <div className="mt-7 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-3">
            {fixLayers.map((row) => (
              <article key={row.code} className="bg-background p-6">
                <span className="font-serif text-3xl text-primary/35">{row.code}</span>
                <h3 className="mt-4 font-serif text-lg font-semibold">{row.name}</h3>
                <p className="mt-3 text-[13px] leading-[1.7] text-muted-foreground">{row.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="border-y border-foreground/15 bg-[#eee9df] py-10 sm:py-14">
          <div className="personal-shell grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            <div>
              <ShieldAlert className="size-6 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <p className="story-kicker mt-4">06 · 禁令清单</p>
              <h2 className="personal-heading mt-3">{forbiddenList.title}</h2>
              <p className="mt-4 text-[15px] leading-[1.7] text-muted-foreground">
                {forbiddenList.body}
              </p>
            </div>
            <div>
              <ul className="grid gap-2.5">
                {forbiddenList.examples.map((line) => (
                  <li key={line} className="flex gap-3 text-[15px] leading-[1.7]">
                    <span className="mt-2.5 size-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                    {line}
                  </li>
                ))}
              </ul>
              <p className="mt-6 border-l-2 border-primary bg-background px-5 py-4 font-serif text-lg leading-relaxed">
                {forbiddenList.why}
              </p>
            </div>
          </div>
        </section>

        <section className="personal-shell py-10 sm:py-14">
          <p className="story-kicker">07 · AI 的位置</p>
          <h2 className="personal-heading mt-3">{aiBoundary.title}</h2>
          <div className="mt-7 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2">
            <div className="bg-background p-6">
              <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                <Bot className="size-4 text-primary" aria-hidden="true" />
                可以交给它
              </h3>
              <ul className="mt-4 grid gap-2">
                {aiBoundary.canDo.map((line) => (
                  <li key={line} className="text-[14px] leading-[1.7] text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-background p-6">
              <h3 className="font-serif text-lg font-semibold">不可以交给它</h3>
              <ul className="mt-4 grid gap-2">
                {aiBoundary.cannotDo.map((line) => (
                  <li key={line} className="text-[14px] leading-[1.7] text-muted-foreground">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-6 max-w-3xl border-l-2 border-primary bg-card px-5 py-4 font-serif text-lg leading-relaxed sm:text-xl">
            {aiBoundary.sharpest}
          </p>
        </section>

        <section className="border-t border-foreground/15 bg-card py-10 sm:py-14">
          <div className="personal-shell">
            <p className="story-kicker">08 · 拿去用</p>
            <h2 className="personal-heading mt-3">如果你也想找一个人。</h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
              这套方法不需要任何软件。一张来源表、一张主张表、一份禁令清单，用什么工具都行。
              下面六条是我认为最省事、也最容易被跳过的部分。
            </p>
            <ol className="mt-7 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2 xl:grid-cols-3">
              {reuseChecklist.map((line, index) => (
                <li key={line} className="bg-background p-5">
                  <span className="font-serif text-xl italic text-primary/35">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="mt-3 text-[14px] leading-[1.7]">{line}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/graph" className="story-button story-button-primary">
                看这套方法产出的图谱
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/archives" className="story-button story-button-secondary">
                看三份已清权的原件
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

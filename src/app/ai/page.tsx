import Link from 'next/link';
import {
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  Mail,
  Network,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { aiPracticeAreas, careerExperience, profile } from '@/content/profile';

const capabilityIcons = [Cpu, Network, ScanSearch] as const;

const capabilityOutcomes = [
  '从使用场景、设备约束到量产与运维，形成可执行的 AI 硬件产品方案。',
  '梳理现有流程与系统边界，找到 AI 值得接入、能够验证的最小闭环。',
  '把分散资料整理成可追溯、可检索、可持续生产内容的个人知识系统。',
] as const;

const representativeCases = [
  careerExperience[0],
  careerExperience[1],
  careerExperience[2],
] as const;

const collaborationModes = [
  {
    title: '产品诊断与路线梳理',
    description:
      '适合已有业务或产品方向，但还不确定 AI 应该放在哪里。一起识别真正的问题、约束与验证顺序。',
    result: '交付：问题地图、机会排序与下一步验证建议',
  },
  {
    title: 'AI 软硬一体方案共创',
    description:
      '面向智能终端、线下场景和行业系统，把模型、设备、数据、流程与运营要求放在一张图里设计。',
    result: '交付：场景方案、系统边界与原型／试点范围',
  },
  {
    title: '个人知识工程陪跑',
    description:
      '适合希望整理家族史、专业经验或长期主题的人，从资料分层开始，逐步形成知识库与内容资产。',
    result: '交付：资料结构、证据规则与内容生产工作流',
  },
] as const;

export default function AiProductPage() {
  return (
    <div className="profile-page overflow-hidden">
      <section className="profile-hero border-b border-foreground/15">
        <div className="personal-shell grid gap-10 py-12 sm:py-16 lg:min-h-[calc(100svh-7.5rem)] lg:grid-cols-[minmax(0,1.18fr)_minmax(21rem,0.64fr)] lg:items-center lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              AI &amp; Product
            </p>
            <h1 className="personal-display mt-6 max-w-4xl text-[clamp(3.2rem,5.35vw,5.7rem)] font-semibold leading-[0.97] tracking-[-0.06em]">
              不从模型出发，
              <span className="mt-2 block text-accent">从真实结果倒推 AI 产品。</span>
            </h1>
            <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
              {profile.statement}
            </p>
            <p className="mt-4 max-w-3xl text-base leading-8 text-muted-foreground">
              我把二十多年软硬一体、智能终端与行业系统经验，转化为一套面向 AI
              时代的产品方法：先找到业务中的真实问题，再连接设备、数据、系统与人的工作流程，
              最后用可以验证的结果决定是否继续投入。
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#capabilities" className="story-button personal-button-primary">
                看我能交付什么
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <Link href="/about#contact" className="story-text-link">
                讨论一个具体问题
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs leading-6 text-muted-foreground">
              <span><strong className="font-semibold text-foreground">适合：</strong>有具体设备、系统或业务场景的团队</span>
              <span><strong className="font-semibold text-foreground">输出：</strong>问题地图、系统边界与验证路径</span>
              <span><strong className="font-semibold text-foreground">起步：</strong>先说明场景与最想验证的问题</span>
            </div>
          </div>

          <aside className="border border-foreground/15 bg-white/55 p-7 shadow-[0_24px_70px_rgba(32,40,39,0.08)] sm:p-8">
            <Sparkles className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="mt-7 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
              Working principle
            </p>
            <h2 className="mt-3 font-serif text-2xl font-semibold leading-tight tracking-[-0.035em] sm:text-3xl">
              判断一个 AI 项目是否值得做，我先问四个问题。
            </h2>
            <ol className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
              {[
                '它解决的是谁在现场反复遇到的问题？',
                '它需要哪些设备、数据和系统共同工作？',
                '最小可验证结果是什么，谁来判断它有效？',
                '验证之后，能否稳定部署、维护并持续改进？',
              ].map((question, index) => (
                <li key={question} className="grid grid-cols-[2rem_1fr] gap-3">
                  <span className="font-serif text-xl text-primary">0{index + 1}</span>
                  <span>{question}</span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <section id="capabilities" className="scroll-mt-28 py-16 sm:py-24">
        <div className="personal-shell">
          <div className="max-w-4xl">
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Deliverables
            </p>
            <h2 className="personal-heading mt-7">三类能力，都指向可继续执行的下一步。</h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
              不把“会使用某个工具”当作最终成果。每次合作都应留下清楚的产品判断、系统边界和验证路径。
            </p>
          </div>

          <div className="mt-12 grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {aiPracticeAreas.map((area, index) => {
              const Icon = capabilityIcons[index];

              return (
                <article key={area.number} className="bg-background p-7 sm:p-9">
                  <div className="flex items-start justify-between gap-6">
                    <Icon className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
                    <span className="font-serif text-4xl text-primary/30">{area.number}</span>
                  </div>
                  <h3 className="mt-8 font-serif text-3xl font-semibold tracking-[-0.035em]">
                    {area.title}
                  </h3>
                  <p className="mt-5 text-sm leading-7 text-muted-foreground">{area.description}</p>
                  <div className="mt-7 border-t border-foreground/15 pt-6">
                    <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                      可以带走的结果
                    </p>
                    <p className="mt-3 text-sm leading-7">{capabilityOutcomes[index]}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-24">
        <div className="personal-shell">
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
            <div>
              <p className="personal-kicker personal-kicker-light">
                <span aria-hidden="true" />
                Product evidence
              </p>
              <Boxes className="mt-8 size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="mt-7 max-w-xl font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
                三个产品样本，
                <span className="block text-[#c38a82]">证明的是方法，不是英雄叙事。</span>
              </h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-[#bdb9b0]">
                这些公开资料可以核验产品和时代背景；站主的任职、负责范围与具体贡献目前以本人履历为主，
                因此两类信息始终分开呈现。
              </p>
            </div>

            <div className="space-y-5">
              {representativeCases.map((item, index) => (
                <article
                  key={item.organization}
                  className="border border-white/15 bg-white/[0.035] p-6 sm:p-8"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold tracking-[0.16em] text-[#c38a82] uppercase">
                        Case 0{index + 1} · {item.industry}
                      </p>
                      <h3 className="mt-3 font-serif text-2xl font-semibold tracking-[-0.025em] sm:text-3xl">
                        {item.projectTitle}
                      </h3>
                    </div>
                    <span className="shrink-0 border border-white/15 px-3 py-2 text-xs text-[#bdb9b0]">
                      {item.organization}
                    </span>
                  </div>

                  {item.projectFact && (
                    <div className="mt-6 grid gap-3 sm:grid-cols-[8rem_1fr]">
                      <strong className="text-xs tracking-[0.12em] text-[#d9d4ca] uppercase">
                        公开可核验
                      </strong>
                      <p className="text-sm leading-7 text-[#c6c1b8]">{item.projectFact}</p>
                    </div>
                  )}

                  <div className="mt-5 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-[8rem_1fr]">
                    <strong className="text-xs tracking-[0.12em] text-[#d9d4ca] uppercase">
                      本人履历
                    </strong>
                    <p className="text-sm leading-7 text-[#aaa69f]">{item.description}</p>
                  </div>

                  {item.evidenceBoundary && (
                    <details className="mt-5 border-t border-white/10 pt-5 text-sm text-[#99958e]">
                      <summary className="cursor-pointer font-semibold text-[#c38a82]">
                        查看证据边界
                      </summary>
                      <p className="mt-3 leading-7">{item.evidenceBoundary}</p>
                    </details>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#eee8dc] py-16 sm:py-20">
        <div className="personal-shell grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end lg:gap-20">
          <div>
            <p className="personal-kicker"><span aria-hidden="true" />Method in public</p>
            <h2 className="personal-heading mt-6">想看 AI 怎样参与一项真实、长期又不能乱猜的工程？</h2>
            <p className="mt-6 max-w-3xl text-base leading-8 text-muted-foreground">
              AI 家族史实验室把资料去重、身份分流、调档路线与叙事边界做成可操作工具。
              第一个入口只用五个选择题判断研究起点，不上传材料、不保存答案、不调用外部模型。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/studio/diagnosis" className="story-button personal-button-primary">
              做一次 3 分钟起步诊断
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/discover/ai-family-history" className="story-text-link">
              阅读背后的研究方法
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="personal-shell">
          <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:gap-20">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Collaboration
              </p>
              <ShieldCheck className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="personal-heading mt-6">先把问题说清楚，再决定做多大。</h2>
              <p className="mt-6 max-w-xl text-sm leading-7 text-muted-foreground">
                合作可以从一次短诊断开始。没有必要为了使用 AI 而扩大项目；
                如果当前问题不适合 AI，也应该尽早得到这个结论。
              </p>
            </div>

            <div className="divide-y divide-foreground/15 border-y border-foreground/15">
              {collaborationModes.map((mode, index) => (
                <article key={mode.title} className="grid gap-5 py-7 sm:grid-cols-[3.5rem_1fr] sm:py-9">
                  <span className="font-serif text-3xl text-primary/45">0{index + 1}</span>
                  <div>
                    <h3 className="font-serif text-2xl font-semibold tracking-[-0.025em]">
                      {mode.title}
                    </h3>
                    <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
                      {mode.description}
                    </p>
                    <p className="mt-4 flex items-start gap-2 text-sm font-semibold text-foreground">
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {mode.result}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-[#eee8dc] py-16 sm:py-24">
        <div className="personal-shell grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Start with a real problem
            </p>
            <h2 className="personal-heading mt-7 max-w-4xl">
              如果你手里正有一个“技术看起来可行，但产品还没想清楚”的问题，我们可以从它开始。
            </h2>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-muted-foreground">
              来信时只需说明场景、目前最困扰你的问题，以及你希望先验证什么。无需准备完整方案。
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <Link
              href="/about#contact"
              className="story-button personal-button-primary"
              data-amplitude-event="ai_contact_opened"
            >
              联系合作
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href={`mailto:${profile.email}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"
            >
              <Mail className="size-4" aria-hidden="true" />
              {profile.email}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

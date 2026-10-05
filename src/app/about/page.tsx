import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  GraduationCap,
  Mail,
  MessageCircle,
  Network,
  ShieldCheck,
} from 'lucide-react';
import { PrivateMessageForm } from '@/components/private-message-form';
import profileMediaAuthorization from '@/data/profile-media-authorization.json';
import { collaborationBrief, pps7700Case, productPositioning } from '@/content/product-positioning';
import {
  careerExperience,
  education,
  profile,
  projectExperience,
} from '@/content/profile';

const cooperationEmail = `mailto:${profile.email}?subject=${encodeURIComponent('业务合作｜现场问题与产品阶段')}&body=${encodeURIComponent('业务问题：\n\n当前阶段：\n\n希望参与的部分：\n')}`;

const backgroundExperience = [
  careerExperience[1],
  careerExperience[2],
  careerExperience[4],
] as const;

export default function AboutPage() {
  return (
    <div className="profile-page overflow-hidden">
      <section className="profile-hero border-b border-foreground/15">
        <div className="personal-shell grid gap-12 py-12 sm:py-16 lg:min-h-[24rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(25rem,0.78fr)] lg:items-start lg:gap-16">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              About the builder
            </p>
            <p className="mt-6 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
              {profile.title}
            </p>
            <h1 className="personal-display mt-4 text-[clamp(1.63rem,2.71vw,2.85rem)] font-semibold leading-[1.14] tracking-[-0.045em]">
              {profile.displayName}
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-foreground sm:text-base">
              工程师的底子，产品人的方法，
              <br />
              从真实现场连接软硬件与 AI。
            </p>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              {productPositioning.introduction}
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              {profile.aboutBio}
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#pps7700" className="story-button personal-button-primary">
                看 PPS7700 案例
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              <Link href="/ai" className="story-text-link">
                看 AI 与产品实践
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <figure className="profile-portrait-frame">
            <Image
              src={profile.portrait}
              alt={`${profile.displayName}的黑白头像`}
              width={839}
              height={1024}
              priority
              sizes="(min-width: 1024px) 40vw, 100vw"
              className="h-full w-full object-cover"
            />
            <figcaption>
              <span className="personal-about-role">AI × Hardware × Product</span>
              <strong className="personal-about-name">把复杂技术做成能落地的产品</strong>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-16 sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Why this site
            </p>
            <Network className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">为什么我要做这个网站。</h2>
          </div>
          <div className="max-w-3xl space-y-7 text-lg leading-9 text-muted-foreground">
            <p>
              过去 18 年多，我从嵌入式硬件研发走向产品定义、软件平台、客户交付与日本业务经营。
              我喜欢的不是把一项技术讲得多玄，而是把它放进真实现场：设备能不能生产，系统能不能接通，
              用户愿不愿意使用，团队能不能长期维护。
            </p>
            <p>
              AI 出现以后，我看到的是一次重新做产品的机会。它不仅能生成内容，
              也能帮助传统行业重新理解数据、流程和人与设备的关系。
              我希望在这里公开这些判断、尝试和踩过的坑。
            </p>
            <p>
              “苏开元计划”则让这件事有了私人而具体的起点。
              我想从家族线索出发，核验与苏开元有关的候选记录，也想验证：一个普通人能否借助 AI，把分散的材料变成一套可核验、
              可连接、可讲述的个人知识系统。
            </p>

            <div className="profile-education">
              <GraduationCap className="size-6 text-primary" aria-hidden="true" />
              <div>
                <p className="profile-education-label">教育背景</p>
                <strong className="profile-education-value">
                  {education.school} · {education.program} · {education.degree}
                </strong>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  本人提供 · 专业名称以学位证书为准
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="projects" className="scroll-mt-28 py-16 sm:py-10">
        <div className="personal-shell">
          <div className="grid gap-8 border-b border-foreground/15 pb-9 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Product journey
              </p>
              <h2 className="personal-heading mt-6">从工程到产品，再到真实业务。</h2>
            </div>
            <p className="max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              六项项目经历，连接日本业务、软硬件产品与传统行业数字化。
              时间、职务与负责范围由本人提供，项目阶段按当前进展呈现。
            </p>
          </div>

          <ol className="mt-8 grid gap-6 lg:grid-cols-2">
            {projectExperience.map((item, index) => (
              <li
                key={item.projectTitle}
                id={item.projectId === 'pps7700' ? 'pps7700' : undefined}
                className={`min-w-0 scroll-mt-28 border border-foreground/15 bg-white/40 p-5 sm:p-8 ${item.projectId === 'pps7700' || index === projectExperience.length - 1 ? 'lg:col-span-2' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-xs font-semibold tracking-[0.1em] text-primary">{item.industry}</p>
                  <span className="shrink-0 font-serif text-2xl text-primary/40">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-serif text-xl font-semibold leading-snug tracking-[-0.025em]">{item.projectTitle}</h3>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
                  <p className="text-xs font-semibold text-primary">
                    {item.period ? `${item.period} · ` : ''}{item.role}
                  </p>
                  <span className="border border-primary/25 bg-primary/5 px-3 py-1 text-xs text-primary">{item.status}</span>
                </div>
                <div className="mt-6 text-sm leading-7 text-muted-foreground">
                  {item.projectId === 'pps7700' ? (
                    <div className="space-y-8">
                      <div className="grid gap-7 border-t border-foreground/15 pt-7 lg:grid-cols-2 lg:gap-10">
                        <section>
                          <h4 className="text-xs font-semibold tracking-widest text-primary">01 · 业务问题</h4>
                          <p className="mt-3">{pps7700Case.problem}</p>
                        </section>
                        <section>
                          <h4 className="text-xs font-semibold tracking-widest text-primary">02 · 本人职责</h4>
                          <p className="mt-3">{pps7700Case.responsibility}</p>
                          <p className="mt-3 text-xs leading-6">{pps7700Case.responsibilityNote}</p>
                        </section>
                      </div>
                      <section>
                        <h4 className="text-xs font-semibold tracking-widest text-primary">03 · 需要协调的约束与取舍</h4>
                        <div className="mt-4 grid gap-4 md:grid-cols-3">
                          {pps7700Case.constraints.map((constraint) => (
                            <div key={constraint.title} className="border-l-2 border-accent/40 bg-muted/50 p-4">
                              <strong className="text-sm font-semibold text-foreground">{constraint.title}</strong>
                              <p className="mt-2 text-sm leading-7">{constraint.description}</p>
                            </div>
                          ))}
                        </div>
                        <p className="mt-3 text-xs leading-6">{pps7700Case.constraintsNote}</p>
                      </section>
                      <div className="grid gap-7 border-t border-foreground/15 pt-7 lg:grid-cols-2 lg:gap-10">
                        <section>
                          <h4 className="text-xs font-semibold tracking-widest text-primary">04 · 产品交付</h4>
                          <p className="mt-3">{pps7700Case.delivery}</p>
                        </section>
                        <section>
                          <h4 className="text-xs font-semibold tracking-widest text-primary">05 · 官方产品奖项</h4>
                          <a href={pps7700Case.awardUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block font-semibold text-foreground underline decoration-primary/40 underline-offset-4 hover:text-primary">
                            {pps7700Case.award}
                          </a>
                          <p className="mt-2 text-xs leading-6">{pps7700Case.awardNote}</p>
                        </section>
                      </div>
                    </div>
                  ) : <p>{item.description}</p>}
                  {item.projectFact && (
                    <div className="mt-5 border-l-2 border-primary/40 bg-[#eee8dc]/60 px-4 py-3">
                      <p className="text-xs font-semibold text-primary">产品背景</p>
                      <p className="mt-2">{item.projectFact}</p>
                    </div>
                  )}
                  {item.evidenceBoundary && (
                    <details className="mt-5 border-t border-foreground/10 pt-4 text-xs leading-6">
                      <summary className="cursor-pointer font-semibold text-primary">资料说明</summary>
                      <p className="mt-2">{item.evidenceBoundary}</p>
                    </details>
                  )}
                  {item.sources && (
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                      {item.sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                          {source.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                {item.projectId === 'pps7700' && (
                  <div className="mt-7 grid gap-6 border-t border-foreground/15 pt-7 md:grid-cols-[0.72fr_1.28fr]">
                    {profileMediaAuthorization.assets.map((asset) => (
                      <figure key={asset.path} className="min-w-0">
                        <div className="border border-foreground/15 bg-white p-3">
                          <Image
                            src={`/${asset.path}`}
                            alt={asset.alt}
                            width={asset.width}
                            height={asset.height}
                            unoptimized
                            className="h-auto w-full object-contain"
                          />
                        </div>
                        <figcaption className="mt-3 space-y-2 text-xs leading-6 text-muted-foreground">
                          <p>{asset.caption}</p>
                          <p>
                            INSPIRY PPS7700 · ©JDP /{' '}
                            <a href={asset.source_page} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                              GOOD DESIGN AWARD
                            </a>
                            {' · '}
                            <a href={asset.license_url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                              {asset.license}
                            </a>
                          </p>
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ol>

          <h3 className="mt-9 font-serif text-lg font-semibold">既有产品与早期工程背景</h3>
          <ol className="mt-4 divide-y divide-foreground/15 border-y border-foreground/15">
            {backgroundExperience.map((item, index) => (
              <li key={item.organization} className="grid gap-5 py-7 sm:grid-cols-[3rem_minmax(13rem,0.72fr)_minmax(0,1.28fr)] sm:items-start">
                <span className="font-serif text-lg text-primary/40">0{index + 1}</span>
                <span>
                  <strong className="block font-serif text-base">{item.organization}</strong>
                  <span className="mt-2 block text-xs font-semibold tracking-[0.08em] text-primary uppercase">{item.role}</span>
                </span>
                <span className="text-sm leading-[1.7] text-muted-foreground">{item.description}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-col gap-5 text-xs leading-6 text-muted-foreground sm:flex-row sm:items-start sm:justify-between">
            <p className="max-w-3xl">
              职业经历属于“本人履历｜本人提供”。外部公开资料只用于核验产品和时代背景，
              不替代个人任职证明。项目图片来自公开官方页面，按图旁许可完整展示。
            </p>
            <Link href="/ai" className="story-text-link shrink-0">
              查看代表案例
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="mt-9 border-t border-foreground/15 pt-7">
            <h3 className="font-serif text-lg font-semibold">我的工作方法</h3>
            <p className="mt-4 max-w-3xl text-sm leading-[1.7] text-muted-foreground">{profile.workingMethod}</p>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-y border-white/15 bg-[#202827] py-14 text-[#f3efe7] sm:py-20">
        <div className="personal-shell grid gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(17rem,0.7fr)] lg:gap-16">
          <div>
            <p className="personal-kicker personal-kicker-light"><span aria-hidden="true" />业务合作</p>
            <MessageCircle className="mt-7 size-7 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-5 max-w-3xl font-serif text-2xl font-semibold leading-snug tracking-[-0.03em] sm:text-3xl">先说说，你的现场正在发生什么。</h2>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-[#bdb9b0]">如果正在做 AI、软硬件产品或日本业务，可以从一封邮件开始。请带上这三件事，方便判断怎样参与。</p>
            <ol className="mt-7 space-y-4">
              {collaborationBrief.map((item, index) => (
                <li key={item.title} className="grid grid-cols-[2rem_1fr] gap-3 border-t border-white/15 pt-4">
                  <span className="font-serif text-lg text-[#c38a82]">0{index + 1}</span>
                  <div>
                    <strong className="text-sm text-[#f3efe7]">{item.title}</strong>
                    <p className="mt-1 text-sm leading-7 text-[#bdb9b0]">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a href={cooperationEmail} className="story-button personal-button-light mt-8">
              <Mail className="size-4" aria-hidden="true" />写信讨论业务合作
            </a>
            <p className="mt-3 break-all text-xs leading-6 text-[#bdb9b0]">{profile.email}</p>
          </div>
          <aside className="min-w-0 border border-white/15 bg-white/[0.035] p-6 sm:p-8">
            <p className="text-xs font-semibold tracking-[0.12em] text-[#c38a82]">历史与小说读者</p>
            <h3 className="mt-4 font-serif text-xl font-semibold leading-snug">为了一个名字，或一个故事而来。</h3>
            <p className="mt-4 text-sm leading-7 text-[#bdb9b0]">欢迎阅读、讨论，也欢迎提供能回到来源的苏开元线索。</p>
            <div className="mt-5 flex flex-col items-start gap-3">
              <Link href="/sukaiyuan" className="personal-dark-link">进入研究项目<ArrowRight className="size-4" aria-hidden="true" /></Link>
              <Link href="/novel" className="personal-dark-link">免费阅读《英雄无名》<ArrowRight className="size-4" aria-hidden="true" /></Link>
              <a href={`mailto:${profile.email}?subject=${encodeURIComponent('研究线索或阅读反馈')}`} className="personal-dark-link">提供线索或阅读反馈<Mail className="size-4" aria-hidden="true" /></a>
            </div>
            <div className="mt-6 flex items-start gap-3 border-t border-white/15 pt-5 text-xs leading-6 text-[#bdb9b0]">
              <ShieldCheck className="mt-1 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
              <p>线索请附题名、年代、馆藏、档号与页码。家属原件和私人资料默认不公开；小说不作为史料。</p>
            </div>
          </aside>
          <div className="grid gap-7 border-t border-white/15 pt-8 sm:grid-cols-[9rem_1fr] lg:col-span-2">
            <figure className="max-w-36">
              <Image src={profile.wechatQr} alt={`${profile.displayName}的微信二维码，扫码添加微信`} width={968} height={1433} sizes="144px" className="h-auto w-full object-contain" />
              <figcaption className="mt-3 text-xs leading-6 text-[#bdb9b0]">微信添加 · 请说明来意</figcaption>
            </figure>
            <div className="min-w-0 self-center"><PrivateMessageForm /></div>
          </div>
        </div>
      </section>
    </div>
  );
}

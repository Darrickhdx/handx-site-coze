import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  BriefcaseBusiness,
  Cpu,
  ExternalLink,
  GraduationCap,
  Mail,
  MessageCircle,
  Network,
  ShieldCheck,
} from 'lucide-react';
import {
  aiPracticeAreas,
  careerExperience,
  education,
  profile,
  profileHighlights,
} from '@/content/profile';
import { CareerProjectVisual } from '@/components/career-project-visual';
import { PrivateMessageForm } from '@/components/private-message-form';

export default function AboutPage() {
  return (
    <div className="profile-page overflow-hidden">
      <section className="profile-hero border-b border-foreground/15">
        <div className="personal-shell grid gap-14 py-14 sm:py-20 lg:min-h-[calc(100svh-7.5rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(28rem,1.08fr)] lg:items-center lg:gap-20">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              About · AI product builder
            </p>
            <p className="mt-9 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
              {profile.title}
            </p>
            <h1 className="personal-display mt-4 text-[clamp(3.8rem,7vw,7.3rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
              {profile.displayName}
            </h1>
            <p className="mt-8 max-w-2xl font-serif text-2xl leading-relaxed text-foreground sm:text-3xl">
              {profile.statement}
            </p>
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted-foreground">
              {profile.shortBio}
            </p>
            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#contact" className="story-button personal-button-primary">
                联系我
                <ArrowRight className="size-4" />
              </a>
              <Link href="/sukaiyuan" className="story-text-link">
                看正在发生的苏开元计划
                <ArrowRight className="size-4" />
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
              sizes="(min-width: 1024px) 46vw, 100vw"
              className="h-full w-full object-cover"
            />
            <figcaption>
              <span className="personal-about-role">AI × Hardware × Product</span>
              <strong className="personal-about-name">把复杂技术做成能落地的产品</strong>
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-14 sm:py-20">
        <div className="personal-shell">
          <div className="profile-proof-strip">
            {profileHighlights.map((item) => (
              <div key={item.value} className="profile-stat">
                <strong className="profile-stat-value">{item.value}</strong>
                <span className="profile-stat-label">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-5 text-xs leading-6 text-muted-foreground">
            职业年限、职务与负责范围由站主本人提供；“百万级”为小白盒公开报道中的累计出货口径，
            不自动等同于个人贡献。当前页面仅供本地审阅，公开发布前仍需逐项确认。
          </p>
        </div>
      </section>

      <section id="ai-practice" className="scroll-mt-28 py-16 sm:py-24">
        <div className="personal-shell">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Current practice
              </p>
              <Cpu className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="personal-heading mt-6">我关心的不是 AI 会什么，而是它能改变什么。</h2>
            </div>
            <div className="profile-focus-grid">
              {aiPracticeAreas.map((area) => (
                <article key={area.number}>
                  <span>{area.number}</span>
                  <h3>{area.title}</h3>
                  <p>{area.description}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="profile-career border-y border-white/15 py-16 text-[#f3efe7] sm:py-24">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:gap-24">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Product journey
            </p>
            <BriefcaseBusiness className="mt-8 size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-7 font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
              二十多年，
              <span className="block text-[#c38a82]">从工程到产品，从中国到日本。</span>
            </h2>
            <p className="mt-7 max-w-xl text-sm leading-7 text-[#bdb9b0]">
              路径始终围绕同一件事：理解真实业务，把硬件、软件、系统与市场连接成一套能够运行的产品。
            </p>
            <p className="mt-4 max-w-xl text-xs leading-6 text-[#8f8b84]">
              页面把“个人履历”和“项目公开资料”分开标注：外部链接用于核验产品与时代背景，不替代个人任职证明。
            </p>
          </div>

          <div className="profile-career-list">
            {careerExperience.map((item, index) => (
              <article key={item.organization} className="career-project-card">
                <div className="career-project-card-heading">
                  <span className="career-project-number">0{index + 1}</span>
                  <div>
                    {item.industry && <p className="career-project-industry">{item.industry}</p>}
                    <p className="profile-career-role">
                      本人履历｜{item.role}
                    </p>
                    <h3>{item.organization}</h3>
                  </div>
                </div>

                {item.visualKind && item.projectTitle && (
                  <CareerProjectVisual kind={item.visualKind} title={item.projectTitle} />
                )}

                <div className="career-project-card-body">
                  {item.projectTitle && (
                    <>
                      <p className="career-project-label">代表项目 · 公开背景</p>
                      <h4>{item.projectTitle}</h4>
                    </>
                  )}

                  {item.publicTimeline && (
                    <div className="career-project-timeline">
                      <strong>项目公开时间，不代表任职起止</strong>
                      <p>{item.publicTimeline}</p>
                    </div>
                  )}

                  {item.projectFact && (
                    <div className="career-project-fact">
                      <span className="career-project-state-label">项目背景｜公开可核验</span>
                      <p>{item.projectFact}</p>
                    </div>
                  )}

                  <div className="career-project-self-report">
                    <span className="career-project-state-label">本人履历｜本人提供</span>
                    <p>{item.description}</p>
                  </div>

                  {item.evidenceBoundary && (
                    <div className="career-project-boundary">
                      <span className="career-project-state-label career-project-boundary-label">
                        个人关联｜待私有材料闭环
                      </span>
                      <p>{item.evidenceBoundary}</p>
                    </div>
                  )}

                  {item.sources && (
                    <div className="career-project-sources">
                      <p>项目公开资料</p>
                      <div className="career-project-sources-list">
                        {item.sources.map((source) => (
                          <a
                            key={source.url}
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            title={source.note}
                            className="career-project-source-link"
                          >
                            {source.label}
                            <ExternalLink className="size-3" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Why this site
            </p>
            <Network className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">为什么从产业现场，走进一批家族旧纸？</h2>
          </div>
          <div className="max-w-3xl space-y-7 text-lg leading-9 text-muted-foreground">
            <p>{profile.homeBio}</p>
            <p>
              我逐渐意识到，AI 的价值不只在生成一段文字或一张图片。它可以帮助一个人整理数百份材料、
              发现同名冲突、建立来源台账、连接人物与事件，再把研究转化成别人愿意阅读的内容。
            </p>
            <p>
              但 AI 越强，越需要人为它设置边界。“苏开元计划”因此同时保留原件、主张、未知与文学创作：
              技术负责提高效率，历史判断仍然回到材料，人负责最后的选择。
            </p>

            <div className="profile-education">
              <GraduationCap className="size-6 text-primary" aria-hidden="true" />
              <div>
                <p className="profile-education-label">教育背景</p>
                <strong className="profile-education-value">
                  {education.school} · {education.program} · {education.degree}
                </strong>
                <span className="mt-1 block text-xs font-normal text-muted-foreground">
                  本人提供 · 正式公开前按学位证书核对专业名称
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-24 border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-24">
        <div className="personal-shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.58fr)] lg:items-center lg:gap-24">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Contact
            </p>
            <MessageCircle className="mt-8 size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-7 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
              如果你也在思考 AI、产品或一段家族历史，欢迎联系我。
            </h2>
            <p className="mt-7 max-w-2xl text-base leading-8 text-[#bdb9b0]">
              可交流 AI 与传统行业、软硬一体产品、智能终端、家族史研究、内容合作，也欢迎提供与苏开元有关的可核线索。
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href={`mailto:${profile.email}`} className="story-button personal-button-light">
                <Mail className="size-4" />
                {profile.email}
              </a>
              <Link href="/studio" className="personal-dark-link">
                了解家族史工作室
                <ArrowRight className="size-4" />
              </Link>
            </div>

            <div className="mt-10 flex items-start gap-3 border-t border-white/15 pt-6 text-xs leading-6 text-[#aaa69f]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
              <p>
                家属原件和私人资料默认不公开。提供历史线索时，来源标题、年代、馆藏、档号与页码比没有出处的转述更有价值。
              </p>
            </div>
          </div>

          <figure className="profile-wechat-card">
            <Image
              src={profile.wechatQr}
              alt={`${profile.displayName}的微信二维码，扫码添加微信`}
              width={968}
              height={1433}
              sizes="(min-width: 1024px) 360px, 82vw"
              className="h-auto w-full object-contain"
            />
            <figcaption>微信扫码添加 · 请简单说明来意</figcaption>
          </figure>

          <div className="lg:col-span-2">
            <PrivateMessageForm />
          </div>
        </div>
      </section>
    </div>
  );
}

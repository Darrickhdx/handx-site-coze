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
import {
  careerExperience,
  education,
  profile,
  projectExperience,
} from '@/content/profile';

const backgroundExperience = [
  careerExperience[1],
  careerExperience[2],
  careerExperience[4],
] as const;

export default function AboutPage() {
  return (
    <div className="profile-page overflow-hidden">
      <section className="profile-hero border-b border-foreground/15">
        <div className="personal-shell grid gap-12 py-8 sm:py-7 lg:min-h-[24rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(25rem,0.78fr)] lg:items-start lg:gap-16">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              About the builder
            </p>
            <p className="mt-6 text-sm font-semibold tracking-[0.16em] text-primary uppercase">
              {profile.title}
            </p>
            <h1 className="personal-display mt-4 text-[clamp(1.63rem,2.71vw,2.85rem)] font-semibold leading-[0.92] tracking-[-0.065em]">
              {profile.displayName}
            </h1>
            <p className="mt-6 max-w-2xl font-serif text-lg leading-relaxed text-foreground sm:text-base">
              工程师的底子，产品人的方法，
              <br />
              从真实现场连接软硬件与 AI。
            </p>
            <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              {profile.homeBio}
            </p>
            <p className="mt-4 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              {profile.aboutBio}
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#contact" className="story-button personal-button-primary">
                联系我
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
              我想寻找家族先人的真实经历，也想验证：一个普通人能否借助 AI，把分散的材料变成一套可核验、
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
                  本人提供 · 正式公开前按学位证书核对专业名称
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10">
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

          <ol className="divide-y divide-foreground/15 border-b border-foreground/15">
            {projectExperience.map((item, index) => (
              <li
                key={item.projectTitle}
                className="grid gap-5 py-7 sm:grid-cols-[3rem_minmax(13rem,0.72fr)_minmax(0,1.28fr)] sm:items-start"
              >
                <span className="font-serif text-lg text-primary/40">0{index + 1}</span>
                <span>
                  <strong className="block font-serif text-base">{item.projectTitle}</strong>
                  <span className="mt-2 block text-xs font-semibold tracking-[0.08em] text-primary uppercase">
                    {item.period ? `${item.period} · ` : ''}{item.role}
                  </span>
                  <span className="mt-2 block text-xs text-muted-foreground">{item.status}</span>
                </span>
                <div className="text-sm leading-[1.7] text-muted-foreground">
                  <p>{item.description}</p>
                  {item.projectFact && <p className="mt-3">{item.projectFact}</p>}
                  {item.evidenceBoundary && (
                    <p className="mt-3 text-xs leading-6">{item.evidenceBoundary}</p>
                  )}
                  {item.sources && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
                      {item.sources.map((source) => (
                        <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 hover:text-primary">
                          {source.label}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
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
              不替代个人任职证明；相关视觉若出现，均为原创系统示意图，非产品实物复刻。
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

      <section id="contact" className="scroll-mt-24 border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.58fr)] lg:items-center lg:gap-24">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Contact
            </p>
            <MessageCircle className="mt-8 size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-7 max-w-3xl font-serif text-2xl font-semibold leading-tight tracking-[-0.04em] sm:text-2xl">
              如果你也在思考 AI、产品或一段家族历史，欢迎联系我。
            </h2>
            <p className="mt-7 max-w-2xl text-[15px] leading-[1.7] text-[#bdb9b0]">
              可交流 AI 与传统行业、软硬一体产品、智能终端、家族史研究和内容合作，
              也欢迎提供与苏开元有关、能够追溯来源的线索。
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href={`mailto:${profile.email}`} className="story-button personal-button-light">
                <Mail className="size-4" aria-hidden="true" />
                {profile.email}
              </a>
              <Link href="/studio" className="personal-dark-link">
                了解家族史工作室
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="mt-10 flex items-start gap-3 border-t border-white/15 pt-6 text-xs leading-6 text-[#aaa69f]">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#c38a82]" aria-hidden="true" />
              <p>
                家属原件和私人资料默认不公开。提供历史线索时，来源标题、年代、馆藏、档号与页码，
                比没有出处的转述更有价值。
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

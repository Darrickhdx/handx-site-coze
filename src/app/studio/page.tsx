import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  Archive,
  FileKey2,
  Mail,
  Network,
  ScanSearch,
  ShieldCheck,
} from 'lucide-react';
import { profile, profileHighlights } from '@/content/profile';

const workflow = [
  {
    number: '01',
    icon: Archive,
    title: '资料体检',
    description: '识别原件、复印件、OCR、口述、网页二传和旧小说，先停止互相污染。',
  },
  {
    number: '02',
    icon: ScanSearch,
    title: '线索核验',
    description: '为姓名异写、地点、单位与事件建立检索卡；每条结论都回到可定位来源。',
  },
  {
    number: '03',
    icon: Network,
    title: '人物图谱',
    description: '把人物、文献、机构与时间连接起来，同时保留冲突、候选和未知。',
  },
  {
    number: '04',
    icon: FileKey2,
    title: '家庭交付',
    description: '交付档案目录、人物时间线、未解问题和可阅读叙事；家属原件默认不公开。',
  },
] as const;

export default function StudioPage() {
  return (
    <div className="studio-page">
      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-12 py-16 sm:py-14 lg:grid-cols-[minmax(0,0.9fr)_minmax(28rem,1.1fr)] lg:items-end lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Family history studio
            </p>
            <h1 className="personal-display mt-7 text-[clamp(1.97rem,3.94vw,3.83rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              家族史工作室
            </h1>
          </div>
          <div>
            <p className="font-serif text-2xl leading-relaxed text-foreground sm:text-3xl">
              帮一个家庭把“听说过”，
              <br />
              变成“知道从哪里继续找”。
            </p>
            <p className="mt-6 max-w-xl text-base leading-[1.8] text-muted-foreground">
              苏开元计划是第一个完整案例。这项服务不承诺替你找到传奇，
              只承诺把材料分清、问题说清、隐私守住，并让下一步查档真正可执行。
            </p>
            <div className="mt-7 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/studio/diagnosis" className="story-button story-button-primary">
                开始 3 分钟资料诊断
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link href="/sukaiyuan" className="story-text-link">
                先看完整案例
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-14">
        <div className="personal-shell">
          <div className="border-b border-foreground/15 pb-8">
            <p className="story-kicker">一次项目会怎样进行</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">四步，把家庭记忆变成可继续的研究。</h2>
          </div>
          <div className="grid gap-px border-x border-b border-foreground/15 bg-foreground/15 md:grid-cols-2 xl:grid-cols-4">
            {workflow.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.number} className="bg-background p-7 sm:min-h-80">
                  <div className="flex items-center justify-between">
                    <span className="font-serif text-4xl italic text-primary/35">{item.number}</span>
                    <Icon className="size-6 text-primary" strokeWidth={1.4} />
                  </div>
                  <h3 className="mt-12 font-serif text-2xl font-semibold">{item.title}</h3>
                  <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">{item.description}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 py-16 sm:py-14">
        <div className="personal-shell grid gap-12 lg:grid-cols-[minmax(19rem,0.66fr)_minmax(0,1.34fr)] lg:items-center lg:gap-24">
          <figure className="personal-about-portrait">
            <Image
              src={profile.portrait}
              alt={`${profile.displayName}的黑白头像`}
              width={839}
              height={1024}
              sizes="(min-width: 1024px) 32vw, 100vw"
              className="h-full w-full object-cover"
            />
            <figcaption>
              <strong className="personal-about-name">{profile.displayName}</strong>
              <span className="personal-about-role">家族史工作室发起人</span>
            </figcaption>
          </figure>

          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Who is doing it
            </p>
            <h2 className="personal-heading mt-6">不只交付一份报告，也把一套方法真正做出来。</h2>
            <p className="mt-7 max-w-3xl text-base leading-[1.8] text-muted-foreground">
              {profile.displayName}拥有二十多年软硬一体产品、智能终端和系统平台经验。
              现在把从 0 到 1 做产品的方法带进 AI 与家族史：从资料体检、知识图谱到可阅读叙事，
              每一步都留下来源、边界和可继续执行的下一步。
            </p>
            <div className="personal-proof-grid mt-9">
              {profileHighlights.map((item) => (
                <div key={item.value} className="profile-stat">
                  <strong className="profile-stat-value">{item.value}</strong>
                  <span className="profile-stat-label">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
              <Link href="/about" className="story-button story-button-primary">
                认识发起人
                <ArrowRight className="size-4" />
              </Link>
              <a href={`mailto:${profile.email}`} className="story-text-link">
                <Mail className="size-4" />
                邮件联系
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-14">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div>
            <ShieldCheck className="size-8 text-[#c38a82]" />
            <h2 className="mt-7 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">先说清楚“不做什么”</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              '不把同名记录直接合并成一个人。',
              '不把口述和家属记忆伪装成官方档案。',
              '未经逐项、用途限定授权，绝不把家属原件交给外部模型、第三方或公共仓库。',
              '不承诺一定找到名人关系、秘密身份或完整结局。',
            ].map((item) => (
              <p key={item} className="border-t border-white/20 pt-5 text-base leading-[1.8] text-[#d7cfc2]">
                {item}
              </p>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-14">
        <div className="personal-shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div>
            <p className="story-kicker">当前阶段</p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
              先把苏开元项目做成一份经得起追问的完整案例。
            </h2>
            <p className="mt-6 max-w-2xl text-base leading-[1.8] text-muted-foreground">
              正式收费服务尚未开放。你可以先查看案例、研究方法和隐私边界；
              如果你正面对一批无从下手的家族材料，请先完成不留存答案的起步诊断；
              结果合适时，再由你主动申请小范围需求访谈。
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <Link href="/studio/diagnosis" className="story-button story-button-primary">
              开始 3 分钟资料诊断
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/sukaiyuan" className="story-button story-button-secondary">
              查看苏开元案例
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/discover/ai-family-history" className="story-text-link">
              阅读 AI 家族史方法
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/missions" className="story-text-link">
              看一个真实项目怎样查档
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/studio/data-versions" className="story-text-link">
              查看数据版本与服务状态
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import { ArrowUpRight, BookOpen, Cpu, ShieldCheck } from 'lucide-react';
import { profile } from '@/content/profile';
import { projectRelease } from '@/content/project';

const personalLinks = [
  { href: '/about', label: '关于我' },
  { href: '/ai', label: '独立开发' },
  { href: '/discover', label: '文章与手记' },
  { href: '/studio', label: '家族史工作室' },
] as const;

const projectLinks = [
  { href: '/sukaiyuan', label: '苏开元计划' },
  { href: '/discover/1936-pingdiquan', label: '从 1936 年读起' },
  { href: '/graph', label: '知识图谱' },
  { href: '/wiki', label: '人物与事件 Wiki' },
  { href: '/archives', label: '原件与来源' },
  { href: '/novel', label: '《英雄无名》全文' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#1d2524] text-[#f3efe7]">
      <div className="mx-auto max-w-[84rem] px-4 py-8 sm:px-6 sm:py-8">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
          <div>
            <div className="flex items-center gap-3 text-[#d5a09a]">
              <BookOpen className="size-5" strokeWidth={1.6} />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase">{profile.displayName}</span>
            </div>
            <p className="mt-7 max-w-2xl font-serif text-lg leading-relaxed sm:text-base">
              一个人，
              <br />
              把复杂的东西做完整。
            </p>
            <p className="mt-6 max-w-xl text-sm leading-[1.7] text-[#aaa69f]">
              这里是一条 AI 内容流水线的现场：一本书、一座网站、一套考据方法。
              每个说法都尽量回到来源，每项合作都从真实问题开始。
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="mt-5 inline-flex items-center gap-2 text-sm text-[#f3efe7] underline decoration-white/30 underline-offset-4 hover:decoration-white"
            >
              {profile.email}
              <ArrowUpRight className="size-3.5" aria-hidden="true" />
            </a>
          </div>

          <div className="grid gap-9 sm:grid-cols-2">
            <nav aria-label="个人网站导航">
              <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#d5a09a] uppercase">认识与合作</p>
              <div className="space-y-1">
                {personalLinks.map((item) => (
                  <FooterLink key={item.href} {...item} />
                ))}
              </div>
            </nav>
            <nav aria-label="苏开元计划导航">
              <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#8ea299] uppercase">苏开元计划</p>
              <div className="space-y-1">
                {projectLinks.map((item) => (
                  <FooterLink key={item.href} {...item} />
                ))}
              </div>
            </nav>
          </div>
        </div>

        <div className="grid gap-5 py-8 text-xs leading-6 text-[#aaa69f] sm:grid-cols-2">
          <div className="flex gap-2.5">
            <Cpu className="mt-1 size-4 shrink-0 text-[#8ea299]" />
            <p>AI 帮助整理、连接和表达，不能替代原件、公开资料与人的最终判断。</p>
          </div>
          <div className="flex gap-2.5">
            <ShieldCheck className="mt-1 size-4 shrink-0 text-[#d5a09a]" />
            <p>家属原件与私人材料默认不公开；分享链接不等于获得转载、改编或训练授权。</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/15 pt-6 text-[11px] leading-5 text-[#aaa69f] lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {profile.displayName} · {projectRelease.displayName} · no-license-granted · 当前仅供本地审阅
          </p>
          <p>
            <Link href="/rights" className="text-[#f3efe7] underline decoration-white/25 underline-offset-4 hover:decoration-white">
              版权与转载
            </Link>
            <span className="mx-2 text-white/20">/</span>
            <Link href="/privacy" className="text-[#f3efe7] underline decoration-white/25 underline-offset-4 hover:decoration-white">
              隐私说明
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      data-amplitude-event="footer_navigation_opened"
      data-amplitude-destination={href}
      className="group flex items-center justify-between gap-3 border-b border-white/10 py-2 text-sm text-[#bbb8b0] transition-colors hover:text-white"
    >
      {label}
      <ArrowUpRight className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}

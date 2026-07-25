import Link from 'next/link';
import { ArrowUpRight, BookOpen, CircleHelp, Cpu, ShieldCheck } from 'lucide-react';
import { profile } from '@/content/profile';
import { projectRelease } from '@/content/project';
import { dataMeta, eventRecords } from '@/lib/research-data';

const masterLinks = [
  { href: '/', label: '个人首页' },
  { href: '/about', label: '关于鉴真小秃驴' },
  { href: '/discover', label: '专题与发现' },
  { href: '/topics', label: '话题专题' },
  { href: '/novel', label: '小说全文' },
  { href: '/sukaiyuan', label: '苏开元计划' },
  { href: '/studio', label: '家族史工作室' },
  { href: '/studio/media', label: '媒体矩阵工作台' },
  { href: '/studio/comments', label: '小说评论审核' },
] as const;

const researchLinks = [
  { href: '/person', label: '人物档案' },
  { href: '/timeline', label: '断片时间线' },
  { href: '/archives', label: '原件阅览室' },
  { href: '/graph', label: '关系图谱' },
  { href: '/wiki', label: '人物与事件 Wiki' },
  { href: '/methodology', label: '研究方法' },
  { href: '/controversies', label: '未解问题' },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[#1d2524] text-[#f3efe7]">
      <div className="mx-auto max-w-[84rem] px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-12 border-b border-white/15 pb-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-24">
          <div>
            <div className="flex items-center gap-3 text-[#d5a09a]">
              <BookOpen className="size-5" strokeWidth={1.6} />
              <span className="text-xs font-semibold tracking-[0.2em] uppercase">{profile.displayName}</span>
            </div>
            <p className="mt-7 max-w-2xl font-serif text-2xl leading-relaxed sm:text-3xl">
              让 AI 进入设备、系统与真实问题，
              <br />也进入一段不该被遗忘的家族记忆。
            </p>
            <p className="mt-6 max-w-xl text-sm leading-7 text-[#aaa69f]">
              二十多年软硬一体产品经验，持续实践 AI × 行业系统 × 个人知识。
              苏开元计划是第一项完整案例原型，也正在长成文章、图谱与小说；当前仍只供本机审阅。
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
              <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#d5a09a] uppercase">个人空间</p>
              <div className="space-y-1">
                {masterLinks.map((item) => (
                  <FooterLink key={item.href} {...item} />
                ))}
              </div>
            </nav>
            <nav aria-label="苏开元研究导航">
              <p className="mb-3 text-[10px] font-semibold tracking-[0.2em] text-[#8ea299] uppercase">研究档案</p>
              <div className="space-y-1">
                {researchLinks.map((item) => (
                  <FooterLink key={item.href} {...item} />
                ))}
              </div>
            </nav>
          </div>
        </div>

        <div className="grid gap-5 py-9 text-xs leading-6 text-[#aaa69f] sm:grid-cols-3">
          <div className="flex gap-2.5">
            <ShieldCheck className="mt-1 size-4 shrink-0 text-[#d5a09a]" />
            <p>苏开元计划源于家族寻找，但历史判断仍以可定位的材料为准；民间研究不冒充官方结论。</p>
          </div>
          <div className="flex gap-2.5">
            <Cpu className="mt-1 size-4 shrink-0 text-[#8ea299]" />
            <p>本站使用 AI 辅助整理与表达；AI 帮助寻找线索，<strong className="font-medium text-[#f3efe7]">不替代史料与人的判断</strong>。</p>
          </div>
          <div className="flex gap-2.5">
            <CircleHelp className="mt-1 size-4 shrink-0 text-[#c8a266]" />
            <p>
              发现史料或错误，可先查看
              <Link href="/about" className="mx-1 text-[#f3efe7] underline decoration-white/30 underline-offset-4 hover:decoration-white">
              提供线索
              </Link>
              说明。
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-white/15 pt-6 text-[11px] leading-5 text-[#aaa69f] lg:flex-row lg:items-center lg:justify-between">
          <p>
            © {profile.displayName} · {projectRelease.displayName} · no-license-granted · 当前仅供本地审阅，禁止外部上线
            <span className="mx-2 text-white/20">/</span>
            <Link href="/rights" className="text-[#f3efe7] underline decoration-white/25 underline-offset-4 hover:decoration-white">
              版权与转载
            </Link>
            <span className="mx-2 text-white/20">/</span>
            <Link href="/privacy" className="text-[#f3efe7] underline decoration-white/25 underline-offset-4 hover:decoration-white">
              隐私说明
            </Link>
            <span className="mx-2 text-white/20">/</span>
            <Link href="/insights" className="text-[#f3efe7] underline decoration-white/25 underline-offset-4 hover:decoration-white">
              本机看板
            </Link>
          </p>
          <p>
            苏开元计划：{eventRecords.length} 个年份 · {dataMeta.source_counts.sources} 份来源 · {dataMeta.source_counts.claims} 条可核对记录 ·
            {' '}{dataMeta.source_counts.nodes} 个人物与材料入口 · 资料版 {dataMeta.research_snapshot_id}
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

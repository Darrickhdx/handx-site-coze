import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  FileClock,
  FileSearch,
  MapPinned,
  ShieldCheck,
} from 'lucide-react';
import { MissionExplorer } from '@/components/mission-explorer';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { archiveMissionDataset, archiveMissions } from '@/lib/archive-missions';

export const metadata: Metadata = {
  title: '寻找苏开元 · 查档现场｜鉴真小秃驴',
  description: '公开 33 项查档任务的真实行动状态、首批申请、研究决策日志与公开线索草稿工具。',
};

const evidenceBoundaries = [
  {
    title: '原页与正文',
    body: '只有取得并读到目标页、表头和上下文，才可能支持一条新的历史判断。',
  },
  {
    title: '目录与索引',
    body: '目录、OCR 和相关人名命中只告诉我们去哪里找，不能替代正文。',
  },
  {
    title: '身份字段',
    body: '同名人物需要单位、籍贯、年龄、学籍号等第二字段，不能只凭姓名合并。',
  },
  {
    title: '回忆与地方材料',
    body: '它们能保存参与者视角和检索方向，但不能自动升级为同期行动记录。',
  },
  {
    title: '博物馆与场景',
    body: '地图、器物和建筑帮助复原时代环境，不证明某个人曾经在场或做过某件事。',
  },
] as const;

function priorityLabel(value: string): string {
  if (value === 'P0') return '最先查';
  if (value === 'P1') return '等回复再查';
  if (value === 'P2') return '条件成熟后再去';
  return '后续任务';
}

export default function MissionsPage() {
  const counts = archiveMissionDataset._meta.counts;
  const highlighted = archiveMissions.filter((mission) => mission.highlighted);
  const completed = archiveMissions.filter((mission) => mission.status.completed).length;
  const firstMission = highlighted[0];

  return (
    <div className="min-w-0 overflow-hidden bg-background">
      <ProjectSectionNav />

      <section className="border-b border-foreground/15">
        <div className="personal-shell grid min-w-0 gap-12 py-16 sm:py-7 lg:grid-cols-[minmax(0,1.2fr)_minmax(19rem,0.55fr)] lg:items-end lg:gap-14">
          <div className="min-w-0">
            <p className="personal-kicker"><span aria-hidden="true" />寻找苏开元 · 查档现场</p>
            <h1 className="personal-display mt-7 max-w-5xl text-[clamp(1.45rem,2.71vw,2.85rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
              一份原件，
              <span className="block text-accent">可能回答一个悬了九十年的问题。</span>
            </h1>
            <p className="mt-7 max-w-3xl font-serif text-lg leading-relaxed sm:text-base">
              我们把 {counts.missions} 个调查方向拆成可以行动、可以核对、也允许失败的查档任务。
            </p>
            <p className="mt-5 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
              这里公开的不是预设结论，而是下一步去哪里、要找哪一页，以及拿到什么才算数。
              首批 {counts.highlighted} 项已经定位到馆藏号、题名或物理帧，但尚未形成发送、受理或原件交付记录。
            </p>
            <p className="mt-6 inline-flex max-w-full border border-primary/25 bg-primary/5 px-4 py-2 text-xs font-semibold leading-6 text-primary">
              研究议程 · 非调查结论 · 已取得并核读 = {completed}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
              <a href="#first-batch" className="story-button story-button-primary">
                看首批七项任务
                <ArrowRight className="size-4" aria-hidden="true" />
              </a>
              {firstMission && (
                <Link href={`/missions/${firstMission.missionId}#public-locator-builder`} className="story-text-link">
                  我有一条公开线索
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </div>
          </div>

          <aside className="min-w-0 border border-foreground/15 bg-card p-6 shadow-[0_24px_70px_rgba(32,40,39,0.08)] sm:p-8">
            <FileClock className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="mt-7 text-xs font-semibold tracking-[0.15em] text-primary uppercase">真实进度</p>
            <dl className="mt-5 grid gap-5">
              <div className="border-t border-foreground/15 pt-4">
                <dt className="text-sm text-muted-foreground">公开任务</dt>
                <dd className="mt-1 font-serif text-xl font-semibold">{counts.missions} 项</dd>
              </div>
              <div className="border-t border-foreground/15 pt-4">
                <dt className="text-sm text-muted-foreground">首批精确任务</dt>
                <dd className="mt-1 font-serif text-xl font-semibold">{counts.highlighted} 项</dd>
              </div>
              <div className="border-t border-foreground/15 pt-4">
                <dt className="text-sm text-muted-foreground">已经取得并核读</dt>
                <dd className="mt-1 font-serif text-xl font-semibold text-primary">{completed} 项</dd>
              </div>
            </dl>
            <p className="mt-6 border-l-2 border-primary pl-4 text-xs leading-6 text-muted-foreground">
              当前全部任务仍在行动前准备或条件等待阶段。准备好申请，不等于已经完成查档。
            </p>
          </aside>
        </div>
      </section>

      <section id="first-batch" className="scroll-mt-28 border-b border-foreground/15 py-16 sm:py-10">
        <div className="personal-shell min-w-0">
          <div className="grid gap-7 border-b border-foreground/15 pb-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <p className="personal-kicker"><span aria-hidden="true" />First batch</p>
              <h2 className="personal-heading mt-6">先追最可能改变判断的七项。</h2>
            </div>
            <p className="max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
              它们都已缩小到明确馆藏号、题名或页帧范围。现阶段的动作是人工复核规则并正式提交，不为尚未发生的进展提前庆祝。
            </p>
          </div>

          <div className="grid min-w-0 gap-px overflow-hidden border-x border-b border-foreground/15 bg-foreground/15 lg:grid-cols-2">
            {highlighted.map((mission, index) => (
              <article key={mission.missionId} className="flex min-w-0 flex-col bg-background p-6 sm:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="font-serif text-xl italic text-primary/35">0{index + 1}</span>
                  <span className="border border-primary/20 px-2.5 py-1 text-xs font-semibold text-primary">
                    {priorityLabel(mission.executionPriority)} · {mission.status.publicLabel}
                  </span>
                </div>
                <h3 className="mt-7 break-words font-serif text-lg font-semibold leading-snug tracking-[-0.025em] sm:text-lg">
                  {mission.researchQuestion}
                </h3>
                <p className="mt-5 flex min-w-0 items-start gap-2 text-sm leading-[1.7] text-muted-foreground">
                  <Building2 className="mt-1.5 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 break-words">{mission.institution} · {mission.modeLabel}</span>
                </p>
                <div className="mt-6 border-t border-foreground/15 pt-5">
                  <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">拿到什么才算完成</p>
                  <p className="mt-3 text-sm leading-[1.7]">{mission.completionStandard}</p>
                </div>
                <Link href={`/missions/${mission.missionId}`} className="story-text-link mt-auto min-h-11 pt-7">
                  查看任务详情
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="all-missions" className="scroll-mt-28 py-16 sm:py-10">
        <div className="personal-shell min-w-0">
          <div className="max-w-4xl">
            <p className="personal-kicker"><span aria-hidden="true" />Mission map</p>
            <h2 className="personal-heading mt-6">查档任务地图，默认是一张可以筛选的清单。</h2>
            <p className="mt-6 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
              地图不是旅行计划。线上、北京、呼和浩特、南京、台北与东京任务都受前置条件约束；只有馆方确认开放、命中范围或现场必要性，才进入下一步。
            </p>
          </div>
          <div className="mt-10 min-w-0">
            <MissionExplorer />
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell min-w-0">
          <div className="grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
            <div>
              <BookOpenCheck className="size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
              <p className="personal-kicker personal-kicker-light mt-7"><span aria-hidden="true" />Research journal</p>
              <h2 className="mt-6 font-serif text-2xl font-semibold tracking-[-0.04em] sm:text-2xl">站主研究日志</h2>
              <p className="mt-6 text-sm leading-[1.7] text-[#bdb9b0]">
                日志记录的是行动、取舍和停止条件。它不会把“计划完成”写成“历史已经查清”。
              </p>
            </div>

            <div className="space-y-5">
              {archiveMissionDataset.journal.map((entry, index) => (
                <article key={`${entry.action}-${index}`} className="border border-white/15 bg-white/[0.035] p-6 sm:p-8">
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#c38a82] uppercase">公开决策日志 0{index + 1}</p>
                  <h3 className="mt-4 font-serif text-lg font-semibold leading-snug">{entry.decision}</h3>
                  <dl className="mt-6 grid gap-5 text-sm leading-[1.7] sm:grid-cols-2">
                    <div>
                      <dt className="font-semibold text-[#d9d4ca]">实际结果</dt>
                      <dd className="mt-2 text-[#bdb9b0]">{entry.outcome}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-[#d9d4ca]">下一步</dt>
                      <dd className="mt-2 text-[#bdb9b0]">{entry.nextStep}</dd>
                    </div>
                  </dl>
                  <p className="mt-6 border-l-2 border-[#c38a82] pl-4 text-sm leading-[1.7] text-[#d7cfc2]">
                    这一步不能证明：{entry.cannotProve}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {entry.missionIds.map((missionId) => (
                      <Link
                        key={missionId}
                        href={`/missions/${missionId}`}
                        className="inline-flex min-h-11 items-center border border-white/15 px-3 text-xs text-[#d7cfc2] hover:border-[#c38a82] hover:text-white"
                      >
                        {missionId}
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-16 sm:py-10">
        <div className="personal-shell min-w-0">
          <div className="max-w-4xl">
            <ShieldCheck className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-7">五类材料，能回答的问题不同。</h2>
            <p className="mt-6 text-[15px] leading-[1.7] text-muted-foreground">
              读者可以帮助定位材料，但任何线索都必须先经过人工核读，才能决定是否影响人物档案。
            </p>
          </div>
          <div className="mt-10 grid min-w-0 gap-px overflow-hidden border border-foreground/15 bg-foreground/15 sm:grid-cols-2 lg:grid-cols-5">
            {evidenceBoundaries.map((item, index) => (
              <article key={item.title} className="min-w-0 bg-background p-6">
                <span className="font-serif text-xl text-primary/35">0{index + 1}</span>
                <h3 className="mt-6 font-serif text-lg font-semibold">{item.title}</h3>
                <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell grid min-w-0 gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.65fr)] lg:items-end lg:gap-14">
          <div className="min-w-0">
            <MapPinned className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <p className="personal-kicker mt-7"><span aria-hidden="true" />Public collaboration</p>
            <h2 className="personal-heading mt-6">你不需要成为历史专家，也可以帮助定位一页。</h2>
            <p className="mt-6 max-w-3xl text-[15px] leading-[1.7] text-muted-foreground">
              如果你知道官方目录、公开馆藏号、准确页码或物理帧，可以在具体任务页生成一份本地 JSON 草稿。
              当前线索接收尚未开放：工具不会提交、保存、抓取网址或创建事实。
            </p>
            <div className="mt-7 flex items-start gap-3 border-l-2 border-primary bg-[#eee8dc] p-5 text-sm leading-[1.7]">
              <FileSearch className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
              <p>不要提供家属原件、身份证件、私人通信、联系方式、需要登录才能访问的地址或任何在世亲属敏感信息。</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-3">
            {firstMission && (
              <Link href={`/missions/${firstMission.missionId}#public-locator-builder`} className="story-button story-button-primary">
                体验公开线索草稿工具
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            )}
            <Link href="/archives" className="story-button story-button-secondary">
              查看已经登记的原件
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/controversies" className="story-text-link">
              查看还没查清的问题
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  Building2,
  FileCheck2,
  FileQuestion,
  LibraryBig,
  MapPin,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { PublicLocatorBuilder } from '@/components/public-locator-builder';
import {
  archiveMissionDataset,
  archiveMissions,
  findArchiveMission,
} from '@/lib/archive-missions';

type MissionPageProps = {
  params: Promise<{ taskId: string }>;
};

const knownPersonRoutes: Record<string, string> = {
  苏开元: '/persons/P-001',
  李英夫: '/persons/P-005',
  朱自清: '/persons/P-006',
  傅作义: '/persons/P-007',
  乔培新: '/persons/P-010',
  李大超: '/persons/P-017',
};

const targetRelationLabels = {
  single_request: '一项独立申请',
  locator_alias: '同一目录目标的异写或编号别名',
  separate_request: '需要分别提交的申请',
  same_work_carrier: '同一作品的不同载体，不重复计算证据',
} as const;

export function generateStaticParams() {
  return archiveMissions.map((mission) => ({ taskId: mission.missionId }));
}

export async function generateMetadata({ params }: MissionPageProps): Promise<Metadata> {
  const { taskId } = await params;
  const mission = findArchiveMission(taskId);
  if (!mission) return {};
  return {
    title: `${mission.researchQuestion}｜查档任务 ${mission.missionId}`,
    description: `${mission.institution}的公开查档任务：${mission.completionStandard}`,
  };
}

export default async function MissionDetailPage({ params }: MissionPageProps) {
  const { taskId } = await params;
  const mission = findArchiveMission(taskId);
  if (!mission) notFound();

  const journal = archiveMissionDataset.journal.filter((entry) => entry.missionIds.includes(mission.missionId));

  return (
    <div className="min-w-0 overflow-hidden bg-background">
      <ProjectSectionNav />

      <header className="border-b border-foreground/15">
        <div className="personal-shell min-w-0 py-9 sm:py-14">
          <Link href="/missions" className="story-text-link min-h-11">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回查档现场
          </Link>

          <div className="mt-10 grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.54fr)] lg:items-end lg:gap-14">
            <div className="min-w-0">
              <p className="personal-kicker"><span aria-hidden="true" />查档任务 · {mission.missionId}</p>
              <h1 className="personal-display mt-6 max-w-5xl break-words text-[clamp(1.96rem,3.57vw,3.71rem)] font-semibold leading-[1.01] tracking-[-0.055em]">
                {mission.researchQuestion}
              </h1>
              <p className="mt-7 max-w-3xl font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
                这项任务围绕“{mission.topic}”寻找可定位原文，不预设答案，也不把申请准备当成历史结论。
              </p>
            </div>

            <aside className="min-w-0 border border-foreground/15 bg-card p-6 sm:p-7">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">当前真实状态</p>
              <p className="mt-3 font-serif text-3xl font-semibold">{mission.status.publicLabel}</p>
              <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">{mission.publicNextStep}</p>
              <p className="mt-5 border border-primary/25 bg-primary/5 px-3 py-2 text-xs font-semibold leading-6 text-primary">
                研究议程 · 非调查结论 · 已取得并核读 = 0
              </p>
              <p className="mt-5 border-l-2 border-primary pl-4 text-xs leading-6 text-muted-foreground">
                尚未取得并核读目标原件；本页不显示完成率，也不把计划动作写成已经发生。
              </p>
            </aside>
          </div>
        </div>
      </header>

      <main>
        <section className="border-b border-foreground/15 py-10 sm:py-14">
          <div className="personal-shell grid min-w-0 gap-px overflow-hidden border border-foreground/15 bg-foreground/15 md:grid-cols-2 lg:grid-cols-4">
            <article className="min-w-0 bg-background p-6 sm:p-7">
              <MapPin className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-primary uppercase">去哪里找</p>
              <p className="mt-3 break-words text-sm font-semibold leading-7">{mission.modeLabel}</p>
            </article>
            <article className="min-w-0 bg-background p-6 sm:p-7">
              <Building2 className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-primary uppercase">馆藏机构</p>
              <p className="mt-3 break-words text-sm font-semibold leading-7">{mission.institution}</p>
              <p className="mt-1 text-xs leading-6 text-muted-foreground">{mission.institutionType}</p>
            </article>
            <article className="min-w-0 bg-background p-6 sm:p-7 md:col-span-2">
              <LibraryBig className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-5 text-xs font-semibold tracking-[0.12em] text-primary uppercase">公开目录号或题名</p>
              <p className="mt-3 break-all text-sm font-semibold leading-7">{mission.catalogReference}</p>
            </article>
          </div>
        </section>

        <section className="py-16 sm:py-14">
          <div className="personal-shell grid min-w-0 gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.62fr)] lg:gap-14">
            <div className="min-w-0">
              <div className="border-b border-foreground/15 pb-8">
                <FileQuestion className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
                <h2 className="personal-heading mt-7">为什么这项任务重要</h2>
                <p className="mt-6 max-w-3xl text-base leading-[1.8] text-muted-foreground">
                  当前问题不是“怎样把故事补完整”，而是这份材料能否提供可以比较的原文、上下文或第二身份字段。
                  它可能支持一个更小、更准确的判断，也可能让现有猜测停止。
                </p>
              </div>

              <div className="mt-10">
                <FileCheck2 className="size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
                <h2 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.04em]">拿到什么才算完成</h2>
                <p className="mt-6 max-w-3xl text-base leading-[1.8]">{mission.completionStandard}</p>
                <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">目标材料类型：{mission.evidenceScope}</p>
              </div>

              <div className="mt-12 border-l-4 border-accent bg-[#eee8dc] p-6 sm:p-8">
                <ShieldAlert className="size-6 text-accent" strokeWidth={1.4} aria-hidden="true" />
                <h2 className="mt-5 font-serif text-2xl font-semibold">即使取得，也不能自动证明什么</h2>
                <p className="mt-4 text-sm leading-[1.8] text-muted-foreground">{mission.boundary}</p>
              </div>
            </div>

            <aside className="min-w-0 border-t border-foreground/15 pt-7 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">下一步</p>
              <p className="mt-4 text-base font-semibold leading-7">{mission.publicNextStep}</p>

              <div className="mt-9 border-t border-foreground/15 pt-7">
                <Users className="size-5 text-primary" aria-hidden="true" />
                <h2 className="mt-4 font-serif text-xl font-semibold">相关人物</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {mission.people.map((person) => (
                    <Link
                      key={person}
                      href={knownPersonRoutes[person] ?? '/persons'}
                      className="inline-flex min-h-11 items-center border border-foreground/15 px-3 text-sm hover:border-primary hover:text-primary"
                    >
                      {person}
                    </Link>
                  ))}
                </div>
                <p className="mt-3 text-xs leading-6 text-muted-foreground">人物入口只用于继续阅读，不表示本任务已经确认人物关系。</p>
              </div>

              <div className="mt-9 border-t border-foreground/15 pt-7">
                <Link href="/archives" className="story-text-link min-h-11">
                  返回原件与来源库
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link href="/controversies" className="story-text-link mt-2 min-h-11">
                  查看还没查清的问题
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </aside>
          </div>
        </section>

        <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-14">
          <div className="personal-shell min-w-0">
            <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:gap-14">
              <div>
                <BookOpenCheck className="size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
                <p className="personal-kicker personal-kicker-light mt-7"><span aria-hidden="true" />Target detail</p>
                <h2 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">这次到底申请哪一项</h2>
                <p className="mt-5 text-sm leading-[1.8] text-[#bdb9b0]">同一目录号的别名、分别申请的材料和同一作品的不同载体，在这里明确分开。</p>
              </div>
              <div className="space-y-4">
                {mission.targets.length > 1 && (
                  <p className="border border-[#c38a82]/35 bg-[#c38a82]/10 p-4 text-sm leading-[1.8] text-[#d7cfc2]">
                    多项申请不等于多条独立证据。取得材料后，仍要按作品家族、形成过程与内容独立性重新判断。
                  </p>
                )}
                {mission.targets.map((target, index) => (
                  <article key={target.targetId} className="min-w-0 border border-white/15 bg-white/[0.035] p-6 sm:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs font-semibold tracking-[0.14em] text-[#c38a82] uppercase">目标 0{index + 1}</p>
                      <span className="text-xs text-[#aaa69f]">{targetRelationLabels[target.relation]}</span>
                    </div>
                    <h3 className="mt-4 break-words font-serif text-2xl font-semibold">{target.institution}</h3>
                    <p className="mt-4 break-all text-sm leading-[1.8] text-[#d7cfc2]">{target.catalogReference}</p>
                    {target.locatorAliases.length > 0 && (
                      <div className="mt-5 border-t border-white/10 pt-4">
                        <p className="text-xs text-[#aaa69f]">同一目标还可能以这些编号出现：</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {target.locatorAliases.map((alias) => (
                            <span key={alias} className="break-all border border-white/15 px-2.5 py-1 text-xs text-[#d7cfc2]">{alias}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {target.relation === 'same_work_carrier' && (
                      <p className="mt-5 border-l-2 border-[#c38a82] pl-4 text-xs leading-6 text-[#bdb9b0]">
                        这些入口仍属于同一作品，不会因为载体更多就增加独立来源数。
                      </p>
                    )}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-foreground/15 py-16 sm:py-14">
          <div className="personal-shell min-w-0">
            <div className="grid gap-10 lg:grid-cols-[0.62fr_1.38fr] lg:gap-14">
              <div>
                <p className="personal-kicker"><span aria-hidden="true" />Public journal</p>
                <h2 className="personal-heading mt-6">这项任务的公开研究日志</h2>
                <p className="mt-5 text-sm leading-[1.8] text-muted-foreground">
                  只记录已经做出的行动判断，不展示申请人信息、受理号、馆员联系方式或未公开回复正文。
                </p>
              </div>
              <div className="space-y-4">
                {journal.length > 0 ? journal.map((entry, index) => (
                  <article key={`${entry.action}-${index}`} className="border border-foreground/15 bg-card p-6 sm:p-7">
                    <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">决策记录 0{index + 1}</p>
                    <h3 className="mt-4 font-serif text-2xl font-semibold leading-snug">{entry.decision}</h3>
                    <dl className="mt-6 grid gap-5 text-sm leading-[1.8] sm:grid-cols-2">
                      <div>
                        <dt className="font-semibold">实际结果</dt>
                        <dd className="mt-2 text-muted-foreground">{entry.outcome}</dd>
                      </div>
                      <div>
                        <dt className="font-semibold">下一步</dt>
                        <dd className="mt-2 text-muted-foreground">{entry.nextStep}</dd>
                      </div>
                    </dl>
                    <p className="mt-6 border-l-2 border-primary pl-4 text-sm leading-[1.8] text-muted-foreground">
                      不能证明：{entry.cannotProve}
                    </p>
                  </article>
                )) : (
                  <div className="border border-foreground/15 bg-card p-7">
                    <p className="font-serif text-2xl font-semibold">还没有公开行动记录</p>
                    <p className="mt-3 text-sm leading-[1.8] text-muted-foreground">下一次真实推进后再添加，不用空白模板制造“正在忙”的印象。</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section id="public-locator-builder" className="scroll-mt-28 py-16 sm:py-14">
          <div className="personal-shell min-w-0">
            <PublicLocatorBuilder missionId={mission.missionId} />
          </div>
        </section>
      </main>
    </div>
  );
}

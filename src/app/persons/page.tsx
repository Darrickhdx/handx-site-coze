import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Network, ShieldCheck, UsersRound } from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  peopleDossiers,
  personDossierStatusLabels,
} from '@/content/people-dossiers';

export const metadata: Metadata = {
  title: '人物群像｜苏开元计划中的见证者、同行者与权力背景',
  description: '从苏开元、李英夫、李大超、朱自清、乔培新与傅作义进入一组有来源、有冲突、不过度补白的人物档案。',
};

export default function PersonsPage() {
  const milestoneCount = peopleDossiers.reduce(
    (total, dossier) => total + dossier.milestones.length,
    0,
  );

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <ProjectSectionNav />
      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-14 sm:py-10">
          <p className="personal-kicker personal-kicker-light"><span aria-hidden="true" />People constellation</p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-end lg:gap-14">
            <h1 className="font-serif text-[clamp(1.54rem,2.96vw,3.04rem)] font-semibold leading-[0.88] tracking-[-0.065em]">
              他们不是配角，
              <br />是证据链的不同位置。
            </h1>
            <div>
              <p className="font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-xl">
                有人留下证词，有人被写进表格，有人代表无法被主角取代的公共历史。
              </p>
              <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-[#bdb9b0]">
                这里不是名人百科。每张人物卡只选择与苏开元研究直接相关的切面；同名、异写、回忆与冲突不会被剪成一条顺滑生平。
              </p>
            </div>
          </div>
          <div className="mt-9 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-3">
            {[
              ['策展人物', peopleDossiers.length],
              ['叙事节点', milestoneCount],
              ['历史肖像冒用', 0],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#202827] p-5">
                <p className="font-serif text-4xl">{value}</p>
                <p className="mt-2 text-xs text-[#bdb9b0]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="personal-shell py-7 sm:py-10">
        <div className="grid gap-px border border-foreground/15 bg-foreground/15 lg:grid-cols-2">
          {peopleDossiers.map((person, index) => (
            <article key={person.entityId} className="group grid min-h-[34rem] gap-8 bg-background p-6 sm:grid-cols-[8rem_minmax(0,1fr)] sm:p-8">
              <div>
                <div className="grid size-28 place-items-center border border-primary/30 bg-primary/5 font-serif text-5xl text-primary" aria-hidden="true">
                  {person.initials}
                </div>
                <p className="mt-4 font-mono text-[10px] text-muted-foreground">{person.entityId}</p>
                <p className="mt-2 font-mono text-[10px] text-primary">{String(index + 1).padStart(2, '0')}</p>
              </div>
              <div className="flex min-w-0 flex-col">
                <p className="text-xs font-semibold tracking-[0.12em] text-primary uppercase">{person.eyebrow}</p>
                <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em]">{person.displayName}</h2>
                <p className="mt-3 text-xs font-semibold text-muted-foreground">{personDossierStatusLabels[person.status]}</p>
                <p className="mt-7 font-serif text-lg leading-relaxed">{person.oneLine}</p>
                <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">{person.roleInStory}</p>
                <div className="mt-auto pt-8">
                  <div className="mb-5 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span className="border border-foreground/15 px-2.5 py-1">{person.milestones.length} 个叙事节点</span>
                    <span className="border border-foreground/15 px-2.5 py-1">无伪造历史肖像</span>
                    <span className="border border-foreground/15 px-2.5 py-1">非完整传记</span>
                  </div>
                  <Link href={`/persons/${person.entityId}`} className="story-text-link">
                    打开人物档案 <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-9 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
          {[
            [UsersRound, '群像，不是英雄名单', '人物按研究角色组织，不按功劳排名。'],
            [Network, '关系必须回到主张', '同框、并列和同一机构不会自动变成私交。'],
            [ShieldCheck, '空白也保留形状', '没有照片、年份或任命时，不用 AI 猜出一张完整人生。'],
          ].map(([Icon, title, description]) => {
            const CardIcon = Icon as typeof UsersRound;
            return (
              <div key={String(title)} className="bg-card p-6">
                <CardIcon className="size-5 text-primary" aria-hidden="true" />
                <h2 className="mt-4 font-serif text-xl font-semibold">{String(title)}</h2>
                <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">{String(description)}</p>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

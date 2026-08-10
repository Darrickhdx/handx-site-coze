import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, FileSearch, Link2, ShieldX } from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  evidencePathModeLabels,
  evidencePaths,
  type EvidencePathMode,
} from '@/content/evidence-paths';

export const metadata: Metadata = {
  title: '故事证据链｜从小说场景回到主张、来源与原件',
  description: '用可追溯的四步路径连接故事、原子主张、来源登记和原馆定位，并明确没有证据时在哪里停下。',
};

const modeStyles: Record<EvidencePathMode, string> = {
  scene_companion: 'border-emerald-800/25 bg-emerald-50 text-emerald-900',
  research_note: 'border-sky-800/25 bg-sky-50 text-sky-900',
  blocked: 'border-rose-800/25 bg-rose-50 text-rose-950',
};

export default function EvidenceIndexPage() {
  const companion = evidencePaths.filter((path) => path.mode === 'scene_companion').length;
  const notes = evidencePaths.filter((path) => path.mode === 'research_note').length;
  const blocked = evidencePaths.filter((path) => path.mode === 'blocked').length;

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <ProjectSectionNav />
      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-14 sm:py-14">
          <p className="personal-kicker personal-kicker-light"><span aria-hidden="true" />Story evidence trails</p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-end lg:gap-14">
            <h1 className="font-serif text-[clamp(1.98rem,3.74vw,3.85rem)] font-semibold leading-[0.88] tracking-[-0.065em]">
              读完故事，
              <br />沿线回到原件。
            </h1>
            <div>
              <p className="font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-3xl">
                每条路径只回答一件事：这句话到底走过了哪几张纸？
              </p>
              <p className="mt-6 max-w-2xl text-base leading-[1.8] text-[#bdb9b0]">
                小说负责让人进入历史，主张卡负责把句子拆小，来源卡负责给出定位。没有来源链的戏剧高潮，会在这里明确停下。
              </p>
            </div>
          </div>
          <dl className="mt-9 grid gap-px border border-white/15 bg-white/15 sm:grid-cols-3">
            {[
              ['来源伴读', companion],
              ['研究旁注', notes],
              ['主动停止链', blocked],
            ].map(([label, count]) => (
              <div key={label} className="bg-[#202827] p-5">
                <dt className="text-xs text-[#bdb9b0]">{label}</dt>
                <dd className="mt-2 font-serif text-4xl">{count}</dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      <div className="personal-shell py-10 sm:py-14">
        <div className="grid gap-px border border-foreground/15 bg-foreground/15 lg:grid-cols-2">
          {evidencePaths.map((path, index) => {
            const Icon = path.mode === 'blocked' ? ShieldX : path.mode === 'research_note' ? Link2 : FileSearch;
            return (
              <article key={path.id} className="flex flex-col bg-background p-6 sm:min-h-[21rem] sm:p-8">
                <div className="flex items-start justify-between gap-5">
                  <span className={`border px-3 py-1.5 text-xs font-semibold ${modeStyles[path.mode]}`}>
                    {evidencePathModeLabels[path.mode]}
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <Icon className="mt-12 size-7 text-primary" strokeWidth={1.35} aria-hidden="true" />
                <p className="mt-6 text-xs font-semibold tracking-[0.12em] text-primary uppercase">{path.eyebrow} · {path.period}</p>
                <h2 className="mt-4 font-serif text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{path.title}</h2>
                <p className="mt-5 text-sm leading-[1.8] text-muted-foreground">{path.deck}</p>
                <div className="mt-auto pt-8">
                  <Link href={`/evidence/${path.id}`} className="story-text-link">
                    展开四步证据链 <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}

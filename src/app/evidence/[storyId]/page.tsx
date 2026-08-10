import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  CircleStop,
  FileSearch,
  Quote,
  ShieldAlert,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  evidencePathById,
  evidencePathModeLabels,
  evidencePaths,
} from '@/content/evidence-paths';
import {
  claimById,
  nodeById,
  sourceById,
} from '@/lib/research-data';

type EvidencePathPageProps = {
  params: Promise<{ storyId: string }>;
};

export function generateStaticParams() {
  return evidencePaths.map((path) => ({ storyId: path.id }));
}

export async function generateMetadata({ params }: EvidencePathPageProps): Promise<Metadata> {
  const { storyId } = await params;
  const path = evidencePathById.get(storyId);
  if (!path) return {};
  return {
    title: `${path.title}｜故事证据链`,
    description: path.deck,
  };
}

export default async function EvidencePathPage({ params }: EvidencePathPageProps) {
  const { storyId } = await params;
  const path = evidencePathById.get(storyId);
  if (!path) notFound();

  const claims = path.claimIds.map((id) => claimById.get(id)).filter(Boolean);
  const sources = path.selectedSourceIds.map((id) => sourceById.get(id)).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#f4f0e8]" data-evidence-path={path.id} data-evidence-mode={path.mode}>
      <ProjectSectionNav />
      <header className="border-b border-foreground/15">
        <div className="article-shell py-9 sm:py-10">
          <Link href="/evidence" className="story-text-link">
            <ArrowLeft className="size-4" aria-hidden="true" /> 返回故事证据链
          </Link>
          <div className="mt-14 flex flex-wrap items-center gap-3">
            <span className="border border-primary/25 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
              {evidencePathModeLabels[path.mode]}
            </span>
            <span className="font-mono text-xs text-muted-foreground">{path.period}</span>
          </div>
          <h1 className="mt-6 font-serif text-[clamp(1.45rem,3.07vw,2.94rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
            {path.title}
          </h1>
          <p className="mt-8 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {path.deck}
          </p>
        </div>
      </header>

      <div className="article-shell py-9 sm:py-10">
        <nav aria-label="证据链步骤" className="grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-4">
          {['01 故事入口', '02 原子主张', '03 来源与定位', '04 边界裁决'].map((label, index) => (
            <a key={label} href={`#step-${index + 1}`} className="bg-card p-4 text-xs font-semibold hover:text-primary">
              {label}
            </a>
          ))}
        </nav>

        <section id="step-1" className="scroll-mt-28 border-x border-b border-foreground/15 bg-background p-6 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div>
              <BookOpenText className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-4 font-mono text-xs text-primary">STEP 01</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.13em] text-primary uppercase">故事入口</p>
              <h2 className="mt-4 font-serif text-3xl font-semibold">{path.storyLabel}</h2>
              <p className="mt-5 text-[15px] leading-[1.7] text-muted-foreground">{path.storyQuestion}</p>
              <Link href={path.storyHref} className="story-button story-button-secondary mt-7">
                打开故事现场 <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <section id="step-2" className="scroll-mt-28 border-x border-b border-foreground/15 bg-card p-6 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div>
              <Quote className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-4 font-mono text-xs text-primary">STEP 02</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.13em] text-primary uppercase">原子主张</p>
              {claims.length > 0 ? (
                <div className="mt-5 grid gap-4">
                  {claims.map((claim) => {
                    if (!claim) return null;
                    const subject = nodeById.get(claim.subject_id);
                    return (
                      <article key={claim.claim_id} id={claim.claim_id} className="border border-foreground/15 bg-background p-5">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="font-mono text-xs text-primary">{claim.claim_id}</span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {claim.status === 'working_verified' ? '原文记录已核' : '候选连接'}
                          </span>
                        </div>
                        <p className="mt-4 text-sm leading-[1.7]">{claim.quote_or_assertion}</p>
                        <p className="mt-4 text-xs leading-6 text-muted-foreground">
                          主体：{subject?.canonical_label ?? claim.subject_id} · 证据层 {claim.evidence_tier} · 独立来源家族 {claim.independence_count}
                        </p>
                        <p className="mt-4 border-l-2 border-primary/40 pl-4 text-xs leading-6 text-muted-foreground">
                          场景资格：{claim.scene_eligible ? '仅限已登记的文献内容场景' : '未获真人场景资格'} · 身份链：{claim.identity_link_status}
                        </p>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-5 border border-rose-800/25 bg-rose-50 p-6 text-rose-950">
                  <CircleStop className="size-6" aria-hidden="true" />
                  <p className="mt-4 font-serif text-2xl font-semibold">没有可用主张</p>
                  <p className="mt-3 text-sm leading-[1.7]">这不是“暂时省略脚注”，而是明确禁止把小说场景写回人物史。</p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section id="step-3" className="scroll-mt-28 border-x border-b border-foreground/15 bg-background p-6 sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div>
              <FileSearch className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-4 font-mono text-xs text-primary">STEP 03</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.13em] text-primary uppercase">来源与定位</p>
              {sources.length > 0 ? (
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {sources.map((source) => {
                    if (!source) return null;
                    return (
                      <article key={source.source_id} className="flex flex-col border border-foreground/15 bg-card p-5">
                        <span className="font-mono text-xs text-primary">{source.source_id}</span>
                        <h3 className="mt-3 font-serif text-2xl font-semibold">{source.title}</h3>
                        <p className="mt-4 text-xs leading-6 text-muted-foreground">{source.verified_extent}</p>
                        <p className="mt-4 text-[10px] text-muted-foreground">{source.source_type} · {source.evidence_tier} · {source.content_scope}</p>
                        <Link
                          href={`/archives/${source.source_id}?context=evidence-${path.id}&claim=${path.claimIds[0] ?? ''}#viewer`}
                          className="story-text-link mt-auto pt-6"
                        >
                          打开原件查看台 <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-5 border border-dashed border-foreground/25 p-6 text-sm leading-[1.7] text-muted-foreground">
                  当前没有能够把人物接入这段情节的来源。背景研究可以继续，但这里不显示假原件、不生成空白来源卡。
                </p>
              )}
            </div>
          </div>
        </section>

        <section id="step-4" className="scroll-mt-28 border border-t-0 border-foreground/15 bg-[#202827] p-6 text-[#f3efe7] sm:p-9">
          <div className="grid gap-8 lg:grid-cols-[12rem_minmax(0,1fr)]">
            <div>
              <ShieldAlert className="size-6 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
              <p className="mt-4 font-mono text-xs text-[#c38a82]">STEP 04</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.13em] text-[#c38a82] uppercase">边界裁决</p>
              <h2 className="mt-4 font-serif text-3xl font-semibold">{path.readerVerdict}</h2>
              <div className="mt-7 grid gap-px bg-white/15 sm:grid-cols-2">
                <div className="bg-[#202827] p-5">
                  <p className="text-xs font-semibold text-emerald-300">可以说</p>
                  <p className="mt-3 text-sm leading-[1.7] text-[#d7cfc2]">{path.canSay}</p>
                </div>
                <div className="bg-[#202827] p-5">
                  <p className="text-xs font-semibold text-rose-300">不能说</p>
                  <p className="mt-3 text-sm leading-[1.7] text-[#d7cfc2]">{path.cannotSay}</p>
                </div>
              </div>
              <p className="mt-7 border-l-2 border-[#c38a82] pl-4 text-sm leading-[1.7] text-[#bdb9b0]">身份门禁：{path.identityBoundary}</p>
              <p className="mt-5 text-sm leading-[1.7] text-[#bdb9b0]">下一问：{path.nextQuestion}</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

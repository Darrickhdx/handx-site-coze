import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  FileSearch,
  Link2,
  ShieldAlert,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import {
  peopleDossierById,
  peopleDossiers,
  personDossierStatusLabels,
  personMilestoneModeLabels,
  personSourceCarrierFamilyById,
} from '@/content/people-dossiers';
import {
  auditClaimById,
  auditEdgeById,
  auditNodeById,
  auditSourceById,
  claimStatusLabels,
  edgeStatusLabels,
  type EdgeStatus,
} from '@/lib/graph-wiki-data';

type PersonDossierPageProps = {
  params: Promise<{ entityId: string }>;
};

const relationReaderLabels: Record<EdgeStatus, string> = {
  working_verified: '同期文献中的一次共同出现，不等于长期私交',
  needs_archive: '回忆／待档案关系线索，不计作已证真人交集',
  provisional: '同一份编成表中的并列记录，不计作私人关系',
  not_supported: '现有材料不支持，禁止写成关系事实',
};

export function generateStaticParams() {
  return peopleDossiers.map((person) => ({ entityId: person.entityId }));
}

export async function generateMetadata({ params }: PersonDossierPageProps): Promise<Metadata> {
  const { entityId } = await params;
  const dossier = peopleDossierById.get(entityId);
  if (!dossier) return {};
  return {
    title: `${dossier.displayName}｜苏开元计划人物档案`,
    description: dossier.oneLine,
  };
}

export default async function PersonDossierPage({ params }: PersonDossierPageProps) {
  const { entityId } = await params;
  const dossier = peopleDossierById.get(entityId);
  const node = auditNodeById.get(entityId);
  if (!dossier || !node) notFound();

  const sourceCards = dossier.featuredSourceIds
    .map((sourceId) => auditSourceById.get(sourceId))
    .filter(Boolean);
  const approvedRelations = dossier.relationCards.map((card) => ({
    card,
    edge: auditEdgeById.get(card.edgeId),
  }));

  return (
    <div className="min-h-screen bg-[#f4f0e8]" data-person-dossier={entityId}>
      <ProjectSectionNav />
      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-9 sm:py-10">
          <Link href="/persons" className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] hover:text-white">
            <ArrowLeft className="size-4" aria-hidden="true" /> 返回人物群像
          </Link>
          <div className="mt-9 grid gap-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:items-end lg:gap-16">
            <div>
              <div className="grid size-40 place-items-center border border-[#c38a82]/50 bg-[#c38a82]/10 font-serif text-7xl text-[#c38a82]" aria-hidden="true">
                {dossier.initials}
              </div>
              <p className="mt-4 font-mono text-xs text-[#bdb9b0]">{dossier.entityId}</p>
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.14em] text-[#c38a82] uppercase">{dossier.eyebrow}</p>
              <h1 className="mt-4 font-serif text-[clamp(1.58rem,3.16vw,3.16rem)] font-semibold leading-[0.86] tracking-[-0.07em]">{dossier.displayName}</h1>
              <div className="mt-6 flex flex-wrap gap-2 text-xs font-semibold">
                <span className="border border-white/20 px-3 py-1.5 text-[#d7cfc2]">{personDossierStatusLabels[dossier.status]}</span>
                <span
                  className="border border-[#c38a82]/40 bg-[#c38a82]/10 px-3 py-1.5 text-[#e2b8b1]"
                  data-publication-status={dossier.publicationStatus}
                >
                  本地审阅 · 非完整传记
                </span>
              </div>
              <p className="mt-7 max-w-4xl font-serif text-2xl leading-relaxed text-[#d7cfc2] sm:text-xl">{dossier.oneLine}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="personal-shell py-9 sm:py-10">
        <section className="grid gap-10 border-b border-foreground/15 pb-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-14">
          <div>
            <p className="story-kicker">为什么他在这里</p>
            <h2 className="mt-4 font-serif text-3xl font-semibold">{dossier.roleInStory}</h2>
          </div>
          <div>
            <p className="text-[15px] leading-[1.7] text-muted-foreground">{dossier.whyHere}</p>
            <div className="mt-7 flex items-start gap-3 border border-amber-800/20 bg-amber-50 p-5 text-sm leading-[1.7] text-amber-950">
              <ShieldAlert className="mt-1 size-5 shrink-0" aria-hidden="true" />
              <p>{dossier.identityBoundary}</p>
            </div>
          </div>
        </section>

        <section className="py-8 sm:py-8">
          <div className="border-b border-foreground/15 pb-7">
            <p className="story-kicker">可追溯人生切面</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">不是年谱，是几组能回到纸面的节点。</h2>
          </div>
          <div className="mt-8 border-l border-foreground/20 pl-6 sm:pl-10">
            {dossier.milestones.map((milestone, index) => {
              const claims = milestone.claimIds.map((id) => auditClaimById.get(id)).filter(Boolean);
              const contextClaims = (milestone.contextClaimIds ?? []).map((id) => auditClaimById.get(id)).filter(Boolean);
              return (
                <article key={milestone.id} id={milestone.id} className="relative border-b border-foreground/15 py-9 first:pt-0">
                  <span className="absolute -left-[1.9rem] top-10 size-3 rounded-full border-2 border-primary bg-[#f4f0e8] sm:-left-[2.85rem] first:top-1" aria-hidden="true" />
                  <div className="grid min-w-0 gap-6 lg:grid-cols-[10rem_minmax(0,1fr)]">
                    <div className="min-w-0">
                      <p className="font-serif text-3xl text-primary">{milestone.period}</p>
                      <p className="mt-2 text-[10px] font-semibold text-muted-foreground">{personMilestoneModeLabels[milestone.mode]}</p>
                      <p className="mt-2 font-mono text-[10px] text-muted-foreground">节点 {String(index + 1).padStart(2, '0')}</p>
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-serif text-3xl font-semibold tracking-[-0.03em]">{milestone.title}</h3>
                      <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{milestone.summary}</p>
                      <div className="mt-6 grid min-w-0 gap-3">
                        {claims.map((claim) => claim && (
                          <div key={claim.claim_id} className="min-w-0 overflow-hidden border border-foreground/15 bg-card p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono text-[10px] text-primary">{claim.claim_id}</span>
                              <span className="text-[10px] text-muted-foreground">{claimStatusLabels[claim.status]}</span>
                            </div>
                            <p className="mt-3 text-sm leading-[1.7]">{claim.quote_or_assertion}</p>
                            <p className="mt-3 text-[10px] font-semibold text-muted-foreground">
                              当前登记 {claim.source_ids.length} 个载体／索引 · 独立来源按 {claim.independence_count} 计
                            </p>
                            {claim.source_ids.length > Number(claim.independence_count) && (
                              <p className="mt-2 text-[10px] leading-5 text-amber-800">
                                链接数多于独立来源数：其中包含同一作品的转录、扫描或索引，不构成多源互证。
                              </p>
                            )}
                            <div className="mt-3 flex min-w-0 flex-wrap gap-2">
                              {claim.source_ids.map((sourceId) => {
                                const source = auditSourceById.get(sourceId);
                                const carrierFamily = personSourceCarrierFamilyById.get(sourceId);
                                return (
                                  <Link
                                    key={sourceId}
                                    href={`/archives/${sourceId}`}
                                    className="inline-flex min-h-11 min-w-0 w-full max-w-full items-center gap-2 border border-foreground/15 px-3 py-2 text-xs text-primary hover:border-primary/40 hover:bg-primary/5 sm:w-auto"
                                    data-source-tier={source?.evidence_tier}
                                    title={carrierFamily ? `${carrierFamily.familyLabel} · ${carrierFamily.carrierLabel}` : undefined}
                                  >
                                    <span className="min-w-0">
                                      <span className="block truncate">{source?.title ?? '打开来源'}</span>
                                      {carrierFamily && (
                                        <span className="mt-0.5 block truncate text-[9px] text-muted-foreground">
                                          {carrierFamily.familyLabel} · {carrierFamily.carrierLabel}
                                        </span>
                                      )}
                                    </span>
                                    <span className="shrink-0 font-mono text-[9px] text-muted-foreground">{sourceId}</span>
                                  </Link>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {contextClaims.length > 0 && (
                        <details className="mt-4 min-w-0 overflow-hidden border border-foreground/15 bg-background p-4">
                          <summary className="cursor-pointer text-xs font-semibold">查看 {contextClaims.length} 条上下文主张（不转移为本人生平）</summary>
                          <div className="mt-4 space-y-3">
                            {contextClaims.map((claim) => claim && (
                              <p key={claim.claim_id} className="text-xs leading-6 text-muted-foreground">
                                <span className="mr-2 font-mono text-primary">{claim.claim_id}</span>{claim.quote_or_assertion}
                              </p>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-8 border-y border-foreground/15 py-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <Link2 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-serif text-3xl font-semibold">材料如何把他们放在一起</h2>
            </div>
            {entityId === 'P-001' ? (
              <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">这是研究中心人物；请从其他人物档案查看关系如何回到主张。</p>
            ) : approvedRelations.length > 0 ? (
              <div className="mt-6 space-y-3">
                <p className="border-l-2 border-primary pl-4 text-xs leading-6 text-muted-foreground">
                  这里逐条显示材料中的连接方式。只有文献明确支持的范围可以确认；回忆、候选制度锚与待档关系都不会升级成真人私交。
                </p>
                {approvedRelations.map(({ card, edge }) => edge && (
                  <article
                    key={edge.edge_id}
                    className="border border-foreground/15 bg-card p-4"
                    data-edge-id={edge.edge_id}
                    data-edge-status={edge.edge_status}
                    data-edge-contract={`${edge.edge_id}|${edge.edge_status}|${edge.claim_ids.join(',')}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10px]">
                      <span className="font-mono text-primary">{edge.edge_id}</span>
                      <span className="text-muted-foreground">{edgeStatusLabels[edge.edge_status]}</span>
                    </div>
                    <p className="mt-3 border border-amber-800/20 bg-amber-50 px-3 py-2 text-xs font-semibold leading-6 text-amber-950">
                      {relationReaderLabels[edge.edge_status]}
                    </p>
                    <p className="mt-3 text-sm leading-[1.7]">{card.readerSentence}</p>
                    <p className="mt-3 font-mono text-[10px] text-muted-foreground">支持主张：{edge.claim_ids.join(' · ')}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-5 border border-foreground/15 bg-card p-5 text-sm leading-[1.7] text-muted-foreground">
                当前公开图没有与 P-001 的直接关系边。此人物提供时代或组织背景，不因此被写成苏开元的私交。
              </p>
            )}
          </div>
          <aside className="border border-foreground/15 bg-card p-5 sm:p-6">
            <FileSearch className="size-5 text-primary" aria-hidden="true" />
            <h2 className="mt-4 font-serif text-2xl font-semibold">优先来源</h2>
            <div className="mt-5 space-y-4">
              {sourceCards.map((source) => source && (
                <Link
                  key={source.source_id}
                  href={`/archives/${source.source_id}`}
                  className="block border-t border-foreground/15 pt-4 hover:text-primary"
                  data-source-tier={source.evidence_tier}
                >
                  <span className="font-mono text-[10px] text-primary">{source.source_id}</span>
                  <span className="mt-1 block text-sm font-semibold leading-6">{source.title}</span>
                </Link>
              ))}
            </div>
          </aside>
        </section>

        <p className="mt-10 border border-foreground/15 bg-card p-4 text-xs leading-6 text-muted-foreground">
          下方 Wiki 属于研究层，会保留候选身份、待档关系与目录线索；它们不会因为出现在研究页就升级为人物事实。
        </p>
        <section className="mt-4 grid gap-3 sm:grid-cols-3">
          {dossier.relatedLinks.map((link) => (
            <Link key={link.href} href={link.href} className="story-button story-button-secondary justify-center">
              {link.label} <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          ))}
        </section>
      </div>
    </div>
  );
}

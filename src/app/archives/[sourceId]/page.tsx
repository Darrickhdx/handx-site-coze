import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  FileText,
  HardDrive,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { ArchiveEvidenceViewer } from '@/components/archive-evidence-viewer';
import { SourceContextNavigation } from '@/components/source-context-navigation';
import { evidencePaths, sourcePreviewAssets } from '@/content/evidence-paths';
import {
  auditGraph,
  auditNodeById,
  auditSourceById,
  claimStatusLabels,
} from '@/lib/graph-wiki-data';

type ArchiveSourcePageProps = {
  params: Promise<{ sourceId: string }>;
};

export function generateStaticParams() {
  return auditGraph.sources.map((source) => ({ sourceId: source.source_id }));
}

export async function generateMetadata({
  params,
}: ArchiveSourcePageProps): Promise<Metadata> {
  const { sourceId } = await params;
  const source = auditSourceById.get(sourceId);
  if (!source) return {};
  return {
    title: `${source.source_id}｜${source.title}`,
    description: `${source.source_type}的公开元数据、定位及关联主张。`,
  };
}

export default async function ArchiveSourcePage({
  params,
}: ArchiveSourcePageProps) {
  const { sourceId } = await params;
  const source = auditSourceById.get(sourceId);
  if (!source) notFound();

  const claims = auditGraph.claims.filter((claim) =>
    claim.source_ids.includes(sourceId),
  );
  const nodes = auditGraph.nodes.filter((node) =>
    node.source_ids.includes(sourceId),
  );
  const relatedPaths = evidencePaths.filter((path) =>
    path.sourceIds.includes(sourceId),
  );
  const readerClaimIds = new Set(relatedPaths.flatMap((path) => path.claimIds));
  const readerClaims = claims.filter((claim) => readerClaimIds.has(claim.claim_id));

  return (
    <div>
      <header className="border-b border-foreground/15">
        <div className="article-shell py-9 sm:py-10">
          <Suspense
            fallback={(
              <Link href="/archives" className="story-text-link">
                <ArrowLeft className="size-4" aria-hidden="true" />
                返回史料阅览室
              </Link>
            )}
          >
            <SourceContextNavigation sourceId={sourceId} />
          </Suspense>
          <p className="mt-12 font-mono text-xs font-semibold tracking-[0.12em] text-primary">
            一份历史材料 · {source.source_id}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(1.26rem,2.71vw,2.44rem)] font-semibold leading-[1.02] tracking-[-0.05em]">
            {source.title}
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-muted-foreground">
            {source.creator_or_publisher} · {source.date_or_range}
          </p>
        </div>
      </header>

      <div className="article-shell py-9 sm:py-10">
        {relatedPaths.length > 0 && (
          <section className="border border-foreground/15 bg-card p-5 sm:p-7">
            <div className="flex items-start gap-3">
              <BookOpenText className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.13em] text-primary uppercase">从故事来到这里</p>
                <p className="mt-3 font-serif text-lg leading-relaxed sm:text-xl">{relatedPaths[0].readerVerdict}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  {relatedPaths.map((path) => (
                    <Link key={path.id} href={`/evidence/${path.id}`} className="story-text-link">
                      {path.title} <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="mt-8">
          <ArchiveEvidenceViewer
            sourceId={source.source_id}
            title={source.title}
            locator={source.locator}
            publicUrl={source.public_url}
            publicUrlStatus={source.public_url_status}
            claims={readerClaims.map((claim) => ({
              id: claim.claim_id,
              status: claimStatusLabels[claim.status],
              assertion: claim.quote_or_assertion,
              locator: claim.locator,
            }))}
            preview={sourcePreviewAssets[sourceId]}
          />
        </div>

        <details className="mt-8 border border-foreground/15 bg-card p-5 sm:p-6">
          <summary className="cursor-pointer text-sm font-semibold">查看研究细节与载体状态</summary>
          <section className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-foreground/15 bg-background p-5">
              <FileText className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-xs text-muted-foreground">载体类型</p>
              <p className="mt-2 text-sm font-semibold">{source.source_type}</p>
            </div>
            <div className="border border-foreground/15 bg-background p-5">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-xs text-muted-foreground">证据层／公开层</p>
              <p className="mt-2 text-sm font-semibold">{source.evidence_tier}／{source.public_tier}</p>
            </div>
            <div className="border border-foreground/15 bg-background p-5">
              <TriangleAlert className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-xs text-muted-foreground">关联主张</p>
              <p className="mt-1 font-serif text-3xl">{claims.length}</p>
            </div>
            <div className="border border-foreground/15 bg-background p-5">
              <HardDrive className="size-5 text-primary" aria-hidden="true" />
              <p className="mt-3 text-xs text-muted-foreground">本地载体状态</p>
              <p className="mt-2 text-sm font-semibold">
                {source.local_copy_status === 'registered_local_carrier' ? '已登记，仅供站主核对' : '公开投影未登记'}
              </p>
            </div>
          </section>
        </details>

        <details className="mt-8 border border-foreground/15 bg-background p-5 sm:p-6">
          <summary className="cursor-pointer text-sm font-semibold">
            继续查看全部 {claims.length} 条研究记录与关联实体
          </summary>
          <section className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.65fr]">
            <div>
              <h2 className="font-serif text-3xl font-semibold">完整主张清单</h2>
            <div className="mt-6 space-y-4">
              {claims.length > 0 ? (
                claims.map((claim) => (
                  <article key={claim.claim_id} className="border border-foreground/15 bg-card p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-[10px] text-primary">
                        {claim.claim_id}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {claimStatusLabels[claim.status]}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-[1.7]">{claim.quote_or_assertion}</p>
                    <p className="mt-3 border-l-2 border-primary/40 pl-3 text-xs leading-6 text-muted-foreground">
                      {claim.writing_use}
                    </p>
                    <Link
                      href={`/wiki/${encodeURIComponent(claim.subject_id)}#${claim.claim_id}`}
                      className="mt-4 inline-flex items-center gap-1 text-xs text-primary"
                    >
                      在实体 Wiki 中核对
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  </article>
                ))
              ) : (
                <p className="border border-foreground/15 bg-card p-5 text-sm text-muted-foreground">
                  当前公开投影没有把主张直接绑定到这份来源。
                </p>
              )}
            </div>
            </div>

            <aside className="border border-foreground/15 bg-card p-5">
              <h2 className="font-serif text-2xl font-semibold">关联实体</h2>
              <div className="mt-4 space-y-2">
              {nodes.map((node) => (
                <Link
                  key={node.entity_id}
                  href={`/wiki/${encodeURIComponent(node.entity_id)}`}
                  className="flex items-center justify-between gap-3 border border-foreground/15 px-3 py-3 text-sm hover:border-primary"
                >
                  <span>{node.canonical_label}</span>
                  <span className="font-mono text-[10px] text-primary">
                    {node.entity_id}
                  </span>
                </Link>
              ))}
              {nodes.length === 0 && (
                <p className="text-sm text-muted-foreground">没有实体直接登记此来源。</p>
              )}
              </div>
            </aside>
          </section>
        </details>
      </div>
    </div>
  );
}

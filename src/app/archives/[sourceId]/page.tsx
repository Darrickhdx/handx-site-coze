import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  FileText,
  HardDrive,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
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

  return (
    <main>
      <header className="border-b border-foreground/15">
        <div className="article-shell py-12 sm:py-20">
          <Link href="/archives" className="story-text-link">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回史料阅览室
          </Link>
          <p className="mt-12 font-mono text-xs font-semibold tracking-[0.12em] text-primary">
            {source.source_id}
          </p>
          <h1 className="mt-5 font-serif text-[clamp(2.8rem,6vw,5.4rem)] font-semibold leading-[1.02] tracking-[-0.05em]">
            {source.title}
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-xl leading-relaxed text-muted-foreground">
            {source.creator_or_publisher} · {source.date_or_range}
          </p>
        </div>
      </header>

      <div className="article-shell py-12 sm:py-20">
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="border border-foreground/15 bg-card p-5">
            <FileText className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">载体类型</p>
            <p className="mt-2 text-sm font-semibold">{source.source_type}</p>
          </div>
          <div className="border border-foreground/15 bg-card p-5">
            <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">证据层／公开层</p>
            <p className="mt-2 text-sm font-semibold">
              {source.evidence_tier}／{source.public_tier}
            </p>
          </div>
          <div className="border border-foreground/15 bg-card p-5">
            <TriangleAlert className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">关联主张</p>
            <p className="mt-1 font-serif text-3xl">{claims.length}</p>
          </div>
          <div className="border border-foreground/15 bg-card p-5">
            <HardDrive className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">本地载体状态</p>
            <p className="mt-2 text-sm font-semibold">
              {source.local_copy_status === 'registered_local_carrier'
                ? '已登记本地载体'
                : '公开投影未登记'}
            </p>
          </div>
        </section>

        <section className="mt-8 border-l-2 border-primary bg-card p-6">
          <p className="text-xs font-bold tracking-[0.14em] text-primary uppercase">
            Locator
          </p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">原文定位</h2>
          <p className="mt-4 text-sm leading-7 text-foreground">{source.locator}</p>
          <p className="mt-4 text-xs leading-6 text-muted-foreground">
            公开页只给出定位与载体元数据，不暴露本地绝对路径。扫描全文、家属正文和受限原件不从浏览器返回。
          </p>
          {source.public_url ? (
            <a
              href={source.public_url}
              target="_blank"
              rel="noreferrer"
              className="story-button story-button-secondary mt-5"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {source.public_url_status === 'official_or_institutional'
                ? '打开机构原件／资料页'
                : '打开登记的公开资料页'}
            </a>
          ) : (
            <p className="mt-5 border border-foreground/15 bg-background p-4 text-xs leading-6 text-muted-foreground">
              当前没有可安全公开的外部原件地址。若已登记本地载体，它仍只由站主在本机资料库中核对，
              不通过网页下载。
            </p>
          )}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[1fr_0.65fr]">
          <div>
            <h2 className="font-serif text-3xl font-semibold">这份来源支持了什么</h2>
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
                    <p className="mt-3 text-sm leading-7">{claim.quote_or_assertion}</p>
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
      </div>
    </main>
  );
}

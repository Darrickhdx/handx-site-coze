import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  FileText,
  Link2,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';
import { OwnerCorpusHits } from '@/components/owner-corpus-hits';
import { peopleDossierById } from '@/content/people-dossiers';
import {
  type AuditClaim,
  auditGraph,
  auditNodeById,
  auditSourceById,
  claimBucket,
  claimStatusLabels,
  edgeStatusLabels,
  entityClaims,
  entityEdges,
  entityTypeLabels,
  legacyCrosswalkForEntity,
  migrationStatusLabels,
  relatedEntityId,
  relatedSourcesForEntity,
} from '@/lib/graph-wiki-data';

type WikiEntityPageProps = {
  params: Promise<{ entityId: string }>;
};

const bucketDisplay = {
  verified: {
    title: '目前可确认',
    note: '在登记来源与定位范围内形成的工作核验；仍不等于完整生平。',
    icon: ShieldCheck,
    className: 'border-confirmed/30 bg-confirmed/5',
  },
  pending: {
    title: '仍待核',
    note: '需要补档案、核身份或解决同源与冲突问题，暂不写成确定事实。',
    icon: CircleHelp,
    className: 'border-candidate/30 bg-candidate/5',
  },
  blocked: {
    title: '不得写成事实',
    note: '现有材料不支持或已被事实门禁阻断，只保留审计记录。',
    icon: ShieldAlert,
    className: 'border-disputed/30 bg-disputed/5',
  },
} as const;

export function generateStaticParams() {
  return auditGraph.nodes.map((node) => ({ entityId: node.entity_id }));
}

export async function generateMetadata({
  params,
}: WikiEntityPageProps): Promise<Metadata> {
  const { entityId } = await params;
  const node = auditNodeById.get(entityId);
  if (!node) return {};
  return {
    title: `${node.canonical_label}｜人物与历史 Wiki`,
    description: `${entityTypeLabels[node.entity_type]}实体 ${node.entity_id} 的主张、关系、来源与核验边界。`,
  };
}

function ClaimRow({ claim }: { claim: AuditClaim }) {
  return (
    <article
      id={claim.claim_id}
      className="scroll-mt-28 border-t border-foreground/15 pt-5 first:border-t-0 first:pt-0"
    >
      <div className="flex flex-wrap items-center gap-2 text-[10px]">
        <span className="font-mono font-semibold text-primary">{claim.claim_id}</span>
        <span className="border border-foreground/15 px-2 py-1 text-muted-foreground">
          {claimStatusLabels[claim.status]}
        </span>
        <span className="border border-foreground/15 px-2 py-1 text-muted-foreground">
          证据层 {claim.evidence_tier}
        </span>
        <span className="border border-foreground/15 px-2 py-1 text-muted-foreground">
          独立来源 {claim.independence_count}
        </span>
      </div>
      <p className="mt-3 text-sm leading-[1.8] text-foreground">
        {claim.quote_or_assertion}
      </p>
      {(claim.time_start || claim.time_end) && (
        <p className="mt-2 text-xs text-muted-foreground">
          时间：{claim.time_start || '未定'}
          {claim.time_end && claim.time_end !== claim.time_start
            ? `—${claim.time_end}`
            : ''}
        </p>
      )}
      <p className="mt-3 border-l-2 border-primary/40 pl-3 text-xs leading-6 text-muted-foreground">
        写作边界：{claim.writing_use}
      </p>
      {(claim.conflict_set_id || claim.conflicts_with.length > 0) && (
        <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-disputed">
          {claim.conflict_set_id && <span>冲突集 {claim.conflict_set_id}</span>}
          {claim.conflicts_with.map((claimId) => (
            <Link key={claimId} href={`#${claimId}`} className="underline">
              冲突主张 {claimId}
            </Link>
          ))}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {claim.source_ids.map((sourceId) => (
          <Link
            key={sourceId}
            href={`/archives/${encodeURIComponent(sourceId)}`}
            className="inline-flex min-h-9 items-center gap-1.5 border border-foreground/15 px-3 text-[11px] text-primary hover:border-primary"
          >
            <FileText className="size-3.5" aria-hidden="true" />
            {sourceId}
          </Link>
        ))}
      </div>
      <details className="mt-3 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-semibold">查看主张定位</summary>
        <p className="mt-2 leading-6">{claim.locator}</p>
      </details>
    </article>
  );
}

export default async function WikiEntityPage({
  params,
}: WikiEntityPageProps) {
  const { entityId } = await params;
  const node = auditNodeById.get(entityId);
  if (!node) notFound();
  const curatedDossier = peopleDossierById.get(entityId);

  const claims = entityClaims(entityId);
  const edges = entityEdges(entityId);
  const sources = relatedSourcesForEntity(entityId);
  const legacyRecords = legacyCrosswalkForEntity(entityId);
  const buckets = {
    verified: claims.filter((claim) => claimBucket(claim) === 'verified'),
    pending: claims.filter((claim) => claimBucket(claim) === 'pending'),
    blocked: claims.filter((claim) => claimBucket(claim) === 'blocked'),
  };
  const directSuEdges =
    entityId === 'P-001'
      ? edges
      : edges.filter((edge) => relatedEntityId(edge, entityId) === 'P-001');

  return (
    <div>
      <header className="border-b border-foreground/15">
        <div className="article-shell py-9 sm:py-14">
          <Link href="/wiki" className="story-text-link">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回 Wiki
          </Link>
          <div className="mt-12 flex flex-wrap items-center gap-2 text-[10px] font-semibold tracking-[0.1em]">
            <span className="border border-primary/30 bg-primary/5 px-2.5 py-1 text-primary">
              {entityTypeLabels[node.entity_type]}
            </span>
            <span className="font-mono text-muted-foreground">{node.entity_id}</span>
            <span className="text-muted-foreground">公开层 {node.public_tier}</span>
          </div>
          <h1 className="mt-5 font-serif text-[clamp(1.66rem,3.64vw,3.33rem)] font-semibold leading-[0.96] tracking-[-0.055em]">
            {node.canonical_label}
          </h1>
          {node.variant_label && node.variant_label !== node.canonical_label && (
            <p className="mt-3 text-sm text-muted-foreground">
              文献异写：{node.variant_label}
            </p>
          )}
          <p className="mt-8 max-w-3xl border-l-2 border-primary pl-5 font-serif text-xl leading-relaxed text-foreground sm:text-2xl">
            {node.identity_status}
          </p>
          <p className="mt-5 max-w-3xl text-sm leading-[1.8] text-muted-foreground">
            这是一张审计实体页，不是自动生成的完整传记。页面只组合公开投影中的原子主张、
            关系和来源定位，不用空白年份补成连续履历。
          </p>
          {curatedDossier && (
            <Link href={`/persons/${entityId}`} className="story-button story-button-primary mt-7">
              先读人物故事版 <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </header>

      <section className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="article-shell grid gap-px bg-white/15 sm:grid-cols-4">
          {[
            ['主张', claims.length],
            ['关系', edges.length],
            ['来源', sources.length],
            ['Legacy 对应', legacyRecords.length],
          ].map(([label, value]) => (
            <div key={String(label)} className="bg-[#202827] p-5">
              <p className="font-serif text-3xl">{value}</p>
              <p className="mt-1 text-xs text-[#bdb9b0]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="article-shell py-9 sm:py-14">
        <section aria-labelledby="claim-boundaries-title">
          <div className="flex flex-col justify-between gap-4 border-b border-foreground/15 pb-6 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                Claim boundaries
              </p>
              <h2 id="claim-boundaries-title" className="mt-2 font-serif text-3xl font-semibold">
                先分清三类主张
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-[1.8] text-muted-foreground">
              “工作核验”表示当前来源链可支持的最小范围，不等于对人物身份、生平或因果的最终裁决。
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-3">
            {(Object.keys(bucketDisplay) as Array<keyof typeof bucketDisplay>).map(
              (bucket) => {
                const display = bucketDisplay[bucket];
                const Icon = display.icon;
                return (
                  <section key={bucket} className={`border p-5 ${display.className}`}>
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                    <div className="mt-3 flex items-baseline justify-between gap-3">
                      <h3 className="font-serif text-xl font-semibold">{display.title}</h3>
                      <span className="font-serif text-2xl">{buckets[bucket].length}</span>
                    </div>
                    <p className="mt-2 min-h-12 text-xs leading-6 text-muted-foreground">
                      {display.note}
                    </p>
                    <div className="mt-5 space-y-5">
                      {buckets[bucket].length > 0 ? (
                        buckets[bucket].map((claim) => (
                          <ClaimRow key={claim.claim_id} claim={claim} />
                        ))
                      ) : (
                        <p className="border-t border-foreground/15 pt-4 text-xs text-muted-foreground">
                          当前公开投影没有这一类主张。
                        </p>
                      )}
                    </div>
                  </section>
                );
              },
            )}
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <div className="flex items-center gap-3">
              <Link2 className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-serif text-3xl font-semibold">关系与苏开元交集</h2>
            </div>
            {directSuEdges.length > 0 ? (
              <div className="mt-6 space-y-3">
                {directSuEdges.map((edge) => {
                  const relatedId = relatedEntityId(edge, entityId);
                  const relatedNode = auditNodeById.get(relatedId);
                  return (
                    <article
                      key={edge.edge_id}
                      className="border border-foreground/15 bg-card p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-primary">
                          {edge.edge_id}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {edgeStatusLabels[edge.edge_status]}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-[1.8]">
                        {edge.from_entity_id === entityId
                          ? node.canonical_label
                          : relatedNode?.canonical_label ?? edge.from_entity_id}
                        <span className="mx-2 text-primary">— {edge.relation} →</span>
                        {edge.to_entity_id === entityId
                          ? node.canonical_label
                          : relatedNode?.canonical_label ?? edge.to_entity_id}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {edge.claim_ids.map((claimId) => (
                          <Link
                            key={claimId}
                            href={`#${claimId}`}
                            className="font-mono text-[10px] text-primary underline-offset-4 hover:underline"
                          >
                            {claimId}
                          </Link>
                        ))}
                        {relatedNode && relatedId !== entityId && (
                          <Link
                            href={`/wiki/${encodeURIComponent(relatedId)}`}
                            className="ml-auto inline-flex items-center gap-1 text-xs text-primary"
                          >
                            打开{relatedNode.canonical_label}
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="mt-6 border border-foreground/15 bg-card p-5 text-sm leading-[1.8] text-muted-foreground">
                新版公开审计图谱目前没有这项实体与 P-001 的直接关系边。没有边不等于历史上从未交集，
                只表示当前公开证据链尚未闭合。
              </div>
            )}

            {edges.length > directSuEdges.length && (
              <details className="mt-4 border border-foreground/15 bg-card p-5">
                <summary className="cursor-pointer text-sm font-semibold">
                  查看全部 {edges.length} 条相邻关系
                </summary>
                <ul className="mt-4 space-y-3 text-sm">
                  {edges.map((edge) => {
                    const relatedId = relatedEntityId(edge, entityId);
                    const relatedNode = auditNodeById.get(relatedId);
                    return (
                      <li key={edge.edge_id} className="border-t border-foreground/10 pt-3">
                        <Link
                          href={`/wiki/${encodeURIComponent(relatedId)}`}
                          className="font-semibold text-primary hover:underline"
                        >
                          {relatedNode?.canonical_label ?? relatedId}
                        </Link>
                        <span className="mx-2 text-muted-foreground">{edge.relation}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {edgeStatusLabels[edge.edge_status]}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </details>
            )}
          </div>

          <aside>
            <div className="border border-foreground/15 bg-card p-5">
              <FileText className="size-5 text-primary" aria-hidden="true" />
              <h2 className="mt-3 font-serif text-2xl font-semibold">来源与定位</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                本页只显示公开层元数据和定位。家属正文、本地绝对路径与受限原件不会发送到浏览器。
              </p>
              <div className="mt-5 space-y-4">
                {sources.map((source) => (
                  <article key={source.source_id} className="border-t border-foreground/15 pt-4">
                    <Link
                      href={`/archives/${encodeURIComponent(source.source_id)}`}
                      className="font-mono text-[10px] text-primary hover:underline"
                    >
                      {source.source_id}
                    </Link>
                    <h3 className="mt-1 text-sm font-semibold leading-6">{source.title}</h3>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      {source.locator}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </section>

        <OwnerCorpusHits entityId={entityId} />

        <section className="mt-16 border-y border-foreground/15 py-8">
          <div className="flex items-center gap-3">
            <TriangleAlert className="size-5 text-candidate" aria-hidden="true" />
            <h2 className="font-serif text-3xl font-semibold">Legacy 如何迁移</h2>
          </div>
          {legacyRecords.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {legacyRecords.map((record) => (
                <article key={record.legacy_key} className="border border-candidate/30 bg-candidate/5 p-5">
                  <p className="font-mono text-[10px] text-candidate">{record.legacy_key}</p>
                  <h3 className="mt-2 text-sm font-semibold">
                    {migrationStatusLabels[record.migration_status]}
                  </h3>
                  <p className="mt-3 text-xs leading-6 text-muted-foreground">
                    {record.decision}
                  </p>
                  <Link
                    href={`/legacy/${encodeURIComponent(record.legacy_key)}`}
                    className="mt-4 inline-flex items-center gap-1 text-xs text-primary"
                  >
                    打开旧线索裁决
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm leading-[1.8] text-muted-foreground">
              旧图没有映射到这一新版实体。这不是缺失证明，也不会自动创建新的对应关系。
            </p>
          )}
        </section>

        <section className="mt-9 grid gap-3 sm:grid-cols-3">
          <Link href="/graph" className="story-button story-button-secondary justify-center">
            打开研究图谱
          </Link>
          <Link href="/topics" className="story-button story-button-secondary justify-center">
            阅读历史专题
          </Link>
          <Link href="/novel" className="story-button story-button-primary justify-center">
            进入小说
          </Link>
        </section>
      </div>
    </div>
  );
}

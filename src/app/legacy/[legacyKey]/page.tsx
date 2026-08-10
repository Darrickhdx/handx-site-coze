import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  CircleHelp,
  Link2Off,
  ShieldAlert,
  TriangleAlert,
} from 'lucide-react';
import {
  auditClaimById,
  auditNodeById,
  legacyGraph,
  legacyNodeById,
  migrationStatusLabels,
} from '@/lib/graph-wiki-data';

type LegacyPageProps = {
  params: Promise<{ legacyKey: string }>;
};

export function generateStaticParams() {
  return legacyGraph.nodes.map((node) => ({ legacyKey: node.id }));
}

export async function generateMetadata({
  params,
}: LegacyPageProps): Promise<Metadata> {
  const { legacyKey } = await params;
  const node = legacyNodeById.get(legacyKey);
  if (!node) return {};
  return {
    title: `${node.label}｜Legacy 线索`,
    description: '旧知识图谱线索及其迁移裁决；不构成新版事实。',
  };
}

export default async function LegacyPage({ params }: LegacyPageProps) {
  const { legacyKey } = await params;
  const node = legacyNodeById.get(legacyKey);
  if (!node) notFound();

  const edges = legacyGraph.edges.filter(
    (edge) => edge.from === node.id || edge.to === node.id,
  );

  return (
    <main className="min-h-screen bg-[#f4f0e8]">
      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="article-shell py-9 sm:py-10">
          <Link
            href="/graph"
            className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] transition hover:text-white"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回图谱
          </Link>
          <div className="mt-12 flex flex-wrap items-center gap-2">
            <span className="border border-[#d8a45e]/50 bg-[#d8a45e]/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.14em] text-[#e0b676] uppercase">
              Legacy clue only
            </span>
            <span className="font-mono text-[10px] text-[#aeb7b2]">{node.id}</span>
          </div>
          <h1 className="mt-5 font-serif text-[clamp(1.22rem,2.84vw,2.51rem)] font-semibold leading-[0.96] tracking-[-0.055em]">
            {node.label}
          </h1>
          <p className="mt-6 max-w-3xl font-serif text-lg leading-relaxed text-[#d7cfc2] sm:text-base">
            {node.title || '旧图只登记了这一线索名称。'}
          </p>
          <div className="mt-8 max-w-3xl border-l-2 border-[#d8a45e] pl-5 text-sm leading-[1.7] text-[#c9c5bd]">
            以上是旧图的标题层文字，不代表新版项目接受其人物身份、履历或因果。
            旧详情已在客户端导出中整体移除。
          </div>
        </div>
      </header>

      <div className="article-shell py-9 sm:py-10">
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="border border-candidate/30 bg-candidate/5 p-5">
            <TriangleAlert className="size-5 text-candidate" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">旧评级，仅作历史字段</p>
            <p className="mt-1 font-serif text-xl">
              {node.legacy_reliability || '未标注'}
            </p>
          </div>
          <div className="border border-candidate/30 bg-candidate/5 p-5">
            <CircleHelp className="size-5 text-candidate" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">迁移状态</p>
            <p className="mt-2 text-sm font-semibold">
              {migrationStatusLabels[node.migration.migration_status]}
            </p>
          </div>
          <div className="border border-candidate/30 bg-candidate/5 p-5">
            <Link2Off className="size-5 text-candidate" aria-hidden="true" />
            <p className="mt-3 text-xs text-muted-foreground">旧关系</p>
            <p className="mt-1 font-serif text-xl">{edges.length}</p>
          </div>
        </section>

        <section className="mt-10 border-2 border-candidate/40 bg-candidate/5 p-6">
          <div className="flex items-center gap-3">
            <ShieldAlert className="size-5 text-candidate" aria-hidden="true" />
            <h2 className="font-serif text-xl font-semibold">迁移裁决</h2>
          </div>
          <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
            {node.migration.decision}
          </p>
          {node.migration.risk_flags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {node.migration.risk_flags.map((flag) => (
                <span
                  key={flag}
                  className="border border-disputed/25 px-2 py-1 text-[10px] text-disputed"
                >
                  {flag}
                </span>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <h2 className="font-serif text-2xl font-semibold">旧关系原话</h2>
            <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
              下列文字来自旧图关系标签，只用于寻找待核问题。它们不进入新版事实图。
            </p>
            <div className="mt-6 space-y-3">
              {edges.length > 0 ? (
                edges.map((edge) => {
                  const otherId = edge.from === node.id ? edge.to : edge.from;
                  const otherNode = legacyNodeById.get(otherId);
                  return (
                    <article key={edge.id} className="border border-foreground/15 bg-card p-4">
                      <p className="font-mono text-[10px] text-candidate">{edge.id}</p>
                      <p className="mt-2 text-sm leading-[1.7]">
                        {edge.from === node.id ? node.label : otherNode?.label ?? edge.from}
                        <span className="mx-2 text-candidate">— {edge.label} →</span>
                        {edge.to === node.id ? node.label : otherNode?.label ?? edge.to}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {migrationStatusLabels[edge.migration.migration_status]}：{edge.migration.decision}
                      </p>
                      {otherNode && (
                        <Link
                          href={`/legacy/${encodeURIComponent(otherNode.id)}`}
                          className="mt-3 inline-flex items-center gap-1 text-xs text-primary"
                        >
                          查看{otherNode.label}的旧线索
                          <ArrowRight className="size-3.5" aria-hidden="true" />
                        </Link>
                      )}
                    </article>
                  );
                })
              ) : (
                <p className="border border-foreground/15 bg-card p-5 text-sm text-muted-foreground">
                  旧图没有与此节点相连的关系。
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="border border-foreground/15 bg-card p-5">
              <h2 className="font-serif text-xl font-semibold">新版实体索引</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                下列链接只表示迁移表把旧名称指向了新版索引，不等于两个身份已经合并。
              </p>
              <div className="mt-4 space-y-2">
                {node.migration.new_entity_ids.length > 0 ? (
                  node.migration.new_entity_ids.map((entityId) => {
                    const auditNode = auditNodeById.get(entityId);
                    return (
                      <Link
                        key={entityId}
                        href={`/wiki/${encodeURIComponent(entityId)}`}
                        className="flex items-center justify-between gap-3 border border-foreground/15 px-3 py-3 text-sm hover:border-primary"
                      >
                        <span>{auditNode?.canonical_label ?? entityId}</span>
                        <span className="font-mono text-[10px] text-primary">{entityId}</span>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">当前没有新版实体承接。</p>
                )}
              </div>
            </section>

            <section className="border border-foreground/15 bg-card p-5">
              <h2 className="font-serif text-xl font-semibold">候选主张定位</h2>
              <p className="mt-2 text-xs leading-6 text-muted-foreground">
                候选主张只是核验入口，不是对旧标题的背书。
              </p>
              <div className="mt-4 space-y-3">
                {node.migration.candidate_claim_ids.length > 0 ? (
                  node.migration.candidate_claim_ids.map((claimId) => {
                    const claim = auditClaimById.get(claimId);
                    return (
                      <div key={claimId} className="border-t border-foreground/15 pt-3 first:border-t-0 first:pt-0">
                        <p className="font-mono text-[10px] text-primary">{claimId}</p>
                        <p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">
                          {claim?.quote_or_assertion ?? '新版公开投影未包含该主张。'}
                        </p>
                        {claim && (
                          <Link
                            href={`/wiki/${encodeURIComponent(claim.subject_id)}#${claimId}`}
                            className="mt-2 inline-flex items-center gap-1 text-xs text-primary"
                          >
                            在 Wiki 中核对
                            <ArrowRight className="size-3.5" aria-hidden="true" />
                          </Link>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">没有候选主张映射。</p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}

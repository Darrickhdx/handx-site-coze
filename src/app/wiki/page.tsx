import Link from 'next/link';
import { ArrowRight, Network, ShieldCheck, TriangleAlert } from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { WikiIndex } from '@/components/wiki-index';
import {
  auditGraph,
  entityTypeLabels,
  graphManifest,
} from '@/lib/graph-wiki-data';

export default function WikiPage() {
  const typeCounts = Object.fromEntries(
    Object.keys(entityTypeLabels).map((type) => [
      type,
      auditGraph.nodes.filter((node) => node.entity_type === type).length,
    ]),
  );

  return (
    <div>
      <ProjectSectionNav />
      <header className="border-b border-foreground/15">
        <div className="personal-shell py-14 sm:py-20">
          <p className="personal-kicker">
            <span aria-hidden="true" />
            Evidence wiki
          </p>
          <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <h1 className="personal-display text-[clamp(3.4rem,7vw,6.6rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              人物与历史
              <br />
              Wiki
            </h1>
            <div>
              <p className="font-serif text-2xl leading-relaxed sm:text-3xl">
                不是一篇“完整传记”，
                <br />
                而是一套可逐条返回来源的研究导航。
              </p>
              <p className="mt-5 text-sm leading-7 text-muted-foreground">
                每个实体页分开显示当前可确认、仍待核与不得写成事实的主张。旧图只作为
                Legacy 线索，不能反向生成事实。
              </p>
            </div>
          </div>
        </div>
      </header>

      <section className="border-b border-foreground/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell grid gap-px bg-white/15 sm:grid-cols-3">
          <div className="bg-[#202827] p-6">
            <ShieldCheck className="size-5 text-[#c38a82]" aria-hidden="true" />
            <p className="mt-4 font-serif text-3xl">{graphManifest.counts.audit_nodes}</p>
            <p className="mt-1 text-xs text-[#bdb9b0]">公开审计实体</p>
          </div>
          <div className="bg-[#202827] p-6">
            <Network className="size-5 text-[#c38a82]" aria-hidden="true" />
            <p className="mt-4 font-serif text-3xl">{graphManifest.counts.audit_edges}</p>
            <p className="mt-1 text-xs text-[#bdb9b0]">可回到主张的关系</p>
          </div>
          <div className="bg-[#202827] p-6">
            <TriangleAlert className="size-5 text-[#c38a82]" aria-hidden="true" />
            <p className="mt-4 font-serif text-3xl">{graphManifest.counts.crosswalk_records}</p>
            <p className="mt-1 text-xs text-[#bdb9b0]">旧图迁移裁决记录</p>
          </div>
        </div>
      </section>

      <section className="personal-shell py-12 sm:py-20">
        <div className="mb-8 flex flex-col justify-between gap-5 border-b border-foreground/15 pb-6 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
              公开审计索引
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold">
              六类实体，一套来源闭环
            </h2>
          </div>
          <div className="flex max-w-2xl flex-wrap gap-2 text-[11px] text-muted-foreground">
            {Object.entries(entityTypeLabels).map(([type, label]) => (
              <span key={type} className="border border-foreground/15 px-2.5 py-1.5">
                {label} {typeCounts[type] ?? 0}
              </span>
            ))}
          </div>
        </div>

        <WikiIndex nodes={auditGraph.nodes} />

        <div className="mt-12 flex flex-col justify-between gap-5 border-t border-foreground/15 pt-8 md:flex-row md:items-center">
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            想从关系结构进入？研究图谱支持时期、实体类型、证据状态和冲突筛选；
            Legacy 线索必须再次确认后才会加载。
          </p>
          <Link href="/graph" className="story-button story-button-primary">
            打开研究图谱
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

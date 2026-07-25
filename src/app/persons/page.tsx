import Link from 'next/link';
import { ArrowRight, User } from 'lucide-react';
import { PageHeader } from '@/components/section-header';
import {
  claimRecords,
  edgeRecords,
  personNodes,
  personRelation,
  personSummaries,
} from '@/lib/research-data';
import { cn } from '@/lib/utils';

function relatedClaimIds(nodeId: string): string[] {
  const ids = new Set<string>();
  for (const claim of claimRecords) {
    if (
      claim.subject_id === nodeId ||
      claim.object_or_value.split(';').includes(nodeId)
    ) ids.add(claim.claim_id);
  }
  for (const edge of edgeRecords) {
    if (edge.from_entity_id === nodeId || edge.to_entity_id === nodeId) {
      edge.claim_ids.forEach((claimId) => ids.add(claimId));
    }
  }
  return [...ids];
}

export default function PersonsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="人物索引"
        subtitle={`当前公开预览层只有${personNodes.length}个人物节点。没有人物节点的人名不会被擅自生成卡片。`}
      />

      <div className="rounded-xl border border-warning/30 bg-warning/10 p-5 mb-8 text-sm text-muted-foreground">
        P-001是candidate identity cluster，人物卡只是研究容器，不是连续身份已证证书。
        “苏开元—苏凯元”身份桥因混合来源依赖暂缓，本页不生成被暂缓的人物节点。
        李大超目前只出现在1942年编成表主张的文字中，尚未进入previewable人物节点，
        因此本页不会把他扩写成未经审批的人物档案。
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {personNodes.map((person) => {
          const candidate = person.entity_id === 'P-001';
          const claims = relatedClaimIds(person.entity_id);
          const href = person.entity_id === 'P-001'
            ? '/person'
            : undefined;
          const card = (
            <div className="h-full bg-card border border-border/40 rounded-xl p-5 shadow-card hover:shadow-float transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className={cn(
                  'w-12 h-12 rounded-full flex items-center justify-center border-2',
                  candidate
                    ? 'bg-candidate/10 border-dashed border-candidate text-candidate'
                    : 'bg-confirmed/10 border-confirmed text-confirmed'
                )}>
                  <User className="w-5 h-5" />
                </div>
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full font-medium',
                  candidate ? 'bg-candidate/10 text-candidate' : 'bg-confirmed/10 text-confirmed'
                )}>
                  {candidate ? '候选边界保留' : '已确认作者/见证人'}
                </span>
              </div>
              <p className="font-mono text-xs text-primary mt-4">{person.entity_id}</p>
              <h2 className="font-serif text-xl font-semibold text-foreground mt-1">{person.canonical_label}</h2>
              {person.variant_label && person.variant_label !== person.canonical_label && (
                <p className="text-xs text-muted-foreground mt-1">原字形：{person.variant_label}</p>
              )}
              <p className="text-sm text-candidate mt-2">{personRelation(person.entity_id)}</p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-muted-foreground">
                identity_status: {person.identity_status}
              </p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {personSummaries[person.entity_id]}
              </p>
              <div className="mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground flex justify-between">
                <span>关联主张 {claims.length}</span>
                <span>来源载体 {person.source_ids.length}</span>
              </div>
              {href && (
                <p className="mt-4 text-sm text-primary font-medium inline-flex items-center gap-1">
                  查看边界说明 <ArrowRight className="w-3.5 h-3.5" />
                </p>
              )}
            </div>
          );
          return href ? <Link key={person.entity_id} href={href}>{card}</Link> : <div key={person.entity_id}>{card}</div>;
        })}
      </div>

      <div className="mt-12 bg-surface-container-lowest border border-border/40 rounded-xl p-6">
        <h2 className="font-serif text-xl font-semibold text-foreground mb-3">收录规则</h2>
        <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
          <li>人物必须先进入知识图谱并具备可回指的来源或主张。</li>
          <li>同名、异写和疑似同人先保留为分离节点，用候选关系连接。</li>
          <li>未进入previewable层的人物不在本地预览页扩写。</li>
          <li>在世亲属与私人身份材料默认不公开。</li>
        </ul>
      </div>
    </div>
  );
}

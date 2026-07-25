import { AlertTriangle, HelpCircle, Link2, ShieldAlert } from 'lucide-react';
import { PageHeader } from '@/components/section-header';
import { identityCandidateClaims, sourceById } from '@/lib/research-data';

const unresolved = [
  '出生日期、出生地和卒年尚未达到公开定论门槛。',
  '1929教育记录与跨姓名轨身份桥因混合来源依赖暂缓展示，尚不能作为公开人物履历。',
  '1933年任命只证明公报刊载的时点，不能外推完整任期。',
  '1936年材料只应表述为朱自清的当时见闻与文字记录。',
  '1942年材料是日方编成表的记载，不能替代中方任命令或证明实际权限。',
  '入党、延安、北平秘密活动等高风险主张尚未进入当前previewable层。',
];

export default function ControversiesPage() {
  const claim = identityCandidateClaims[0];
  const sources = (claim?.source_ids ?? [])
    .map((sourceId) => sourceById.get(sourceId))
    .filter((source) => source !== undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="争议与未决"
        subtitle="当前预览没有获准展示的跨姓名轨候选关系；人物主张仍保留identity_link_status与scene门槛。"
      />

      <section className="mb-12">
        <div className="rounded-2xl border border-candidate/40 bg-candidate/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Link2 className="w-7 h-7 text-candidate shrink-0" />
            <div>
              <h2 className="font-serif text-2xl font-bold text-foreground mt-2">
                跨姓名轨身份桥：暂缓展示
              </h2>
              {claim ? (
                <>
                  <p className="font-mono text-xs text-candidate mt-2">{claim.claim_id} · {claim.status}</p>
                  <p className="text-foreground/90 mt-4 leading-relaxed">{claim.quote_or_assertion}</p>
                  <p className="mt-4 font-mono text-xs font-semibold text-disputed">
                    scene_eligible={String(claim.scene_eligible)} · identity_link_status={claim.identity_link_status}
                  </p>
                </>
              ) : (
                <p className="text-foreground/90 mt-4 leading-relaxed">
                  1929记录与“苏开元—苏凯元”身份桥含混合公开／私有来源依赖。
                  V7R4权威代次在逐记录公开投影获批前仍将其整体撤出本地预览，因此当前候选数组为空。
                  这项安全降级不等于证伪，也不允许复述被暂缓的来源细节。
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {sources.length > 0 && (
        <section className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sources.map((source) => (
            <article key={source.source_id} className="bg-card border border-border/40 rounded-xl p-5 shadow-card">
              <p className="font-mono text-xs text-primary">{source.source_id}</p>
              <h3 className="font-serif text-lg font-semibold text-foreground mt-1">{source.title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{source.date_or_range}</p>
              <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                {source.source_type}｜载体状态：{source.carrier_status}
              </p>
            </article>
          ))}
        </section>
      )}

      <section className="mb-12">
        <div className="bg-card border border-border/40 rounded-xl p-6 shadow-card">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-disputed shrink-0 mt-0.5" />
            <div>
              <h2 className="font-serif text-xl font-semibold text-foreground">当前裁决边界</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                混合公开／私有依赖的记录不能靠删除私有来源编号后继续公开，因为主张正文、人物字段或关系本身也可能受私有材料影响。
                在来源依赖闭包未通过前，正式传记、出生年、教育履历、人物节点和跨轨关系均不得合并或展示。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-2xl font-bold text-foreground mb-5">尚不能写成事实</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {unresolved.map((item) => (
            <div key={item} className="bg-surface-container-lowest border border-border/40 rounded-xl p-5">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-disputed shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">{item}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-5">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <p className="text-sm text-muted-foreground">
            “没有进入当前预览层”不等于已经证伪，只表示尚未通过本轮证据与公开边界审核。
          </p>
        </div>
      </section>
    </div>
  );
}

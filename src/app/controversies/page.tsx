import Link from 'next/link';
import { AlertTriangle, ArrowRight, HelpCircle, Link2, ShieldAlert } from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
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
    <div>
      <ProjectSectionNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="还没查清的问题"
        subtitle="这里不替空白选择一个更顺的答案，而是说明缺哪一页原件、为什么要停下来，以及下一步去哪里找。"
      />

      <section className="mb-12">
        <div className="rounded-2xl border border-candidate/40 bg-candidate/10 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <Link2 className="w-7 h-7 text-candidate shrink-0" />
            <div>
              <h2 className="font-serif text-xl font-bold text-foreground mt-2">
                两种姓名，是不是同一个人？
              </h2>
              {claim ? (
                <>
                  <p className="mt-2 text-xs font-semibold tracking-[0.12em] text-candidate uppercase">身份仍待确认</p>
                  <p className="text-foreground/90 mt-4 leading-relaxed">{claim.quote_or_assertion}</p>
                  <p className="mt-4 text-xs font-semibold text-disputed">
                    在原始学籍、军籍号或明确异名字段出现前，两条记录仍分开保存。
                  </p>
                </>
              ) : (
                <p className="text-foreground/90 mt-4 leading-relaxed">
                  现有材料让“蘇開元”与“蘇凱元”很像同一个人，但还缺能把两种写法明确连起来的原始字段。
                  所以本站继续分开保存两条记录：这不等于已经证伪，也不等于可以把两段经历拼成一份传记。
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
              <h2 className="font-serif text-lg font-semibold text-foreground">为什么现在不能合并</h2>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                姓名相近、时间相容和同一地区只能形成一个很强的查询方向，不能替代原始学籍、人事编号或明确异名记录。
                在这些身份锚出现前，出生年、教育履历和后续经历都不能无条件拼接。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12 grid gap-6 border border-foreground/15 bg-[#eee9df] p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
        <div>
          <p className="story-kicker">把疑问变成行动</p>
          <h2 className="mt-3 font-serif text-2xl font-semibold">每一个未解问题，都应该对应一项具体查档任务。</h2>
          <p className="mt-4 max-w-2xl text-sm leading-[1.7] text-muted-foreground">
            查档现场会告诉你正在找哪份材料、当前走到哪里，以及即使取得它仍不能自动证明什么。
          </p>
        </div>
        <Link href="/missions" className="story-button story-button-primary">
          查看查档任务
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold text-foreground mb-5">尚不能写成事实</h2>
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
    </div>
  );
}

import Link from 'next/link';
import { AlertTriangle, Calendar, HelpCircle, MapPin, User } from 'lucide-react';
import { ClaimCard } from '@/components/claim-card';
import { PageHeader } from '@/components/section-header';
import { RelationGraph } from '@/components/relation-graph';
import { SourceCard } from '@/components/source-card';
import { TimelineView } from '@/components/timeline-view';
import {
  claimCard,
  claimRecords,
  edgeRecords,
  eventRecords,
  graphEdges,
  graphNodes,
  identityCandidateClaims,
  personNodes,
  personRelation,
  personSummaries,
  sourceCards,
  timelineItems,
} from '@/lib/research-data';

const openQuestions = [
  {
    title: '“苏开元”与“苏凯元”是否确定为同一人？',
    detail: '现在还不能确定。相关身份桥及1929记录含混合公开／私有来源依赖，V7R4权威代次仍暂缓展示；在逐记录投影获批前，不能合并人物节点或对外复述其细节。',
  },
  {
    title: '生卒年、准确籍贯和家庭信息是什么？',
    detail: '公开预览层没有足以形成定论的证据。发起人自述的曾祖孙关系也不是当前公开层的已证亲属结论。',
  },
  {
    title: '陆士学籍、毕业与回国路径能否闭环？',
    detail: '尚不能。相关1929记录已因混合来源依赖暂缓展示；正式学籍、毕业证明和归国路径仍需档案馆材料及公开边界复核。',
  },
  {
    title: '1933、1936和1942职务之间的任期如何衔接？',
    detail: '公报、朱自清见闻与日方编成表分别提供时点锚，尚不能自动拼成连续无缺的履历。',
  },
  {
    title: '1938—1950年的入党、延安、北平等主张如何核验？',
    detail: '这些属于高风险待核主张，本地预览暂不展示为事实，必须回到档案、同期报刊或独立来源。',
  },
];

export default function PersonPage() {
  const candidate = identityCandidateClaims[0];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="苏开元"
        subtitle="不是一篇已经写完的传记，而是一组能够回到来源逐条检查的历史主张。"
      />

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-candidate/10 text-candidate rounded-full text-sm font-medium">
          <HelpCircle className="w-4 h-4" />
          P-001为candidate identity cluster；身份链未闭环
        </span>
        <span className="text-muted-foreground text-sm inline-flex items-center gap-1.5">
          <Calendar className="w-4 h-4" />
          生卒年未形成公开定论
        </span>
        <span className="text-muted-foreground text-sm inline-flex items-center gap-1.5">
          <MapPin className="w-4 h-4" />
          籍贯暂未形成公开定论
        </span>
      </div>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">目前能安全说到哪里</h2>
        <div className="bg-card border border-border/40 rounded-xl p-6 shadow-card space-y-4 text-foreground/90 leading-relaxed">
          <p>
            当前公开预览层保留了三组彼此分离的史料记录：1933年团长任命公报、
            1936年朱自清在平地泉的见闻，以及1942年日方编成表。
            它们都出现“苏开元／蘇開元”字样，但每组只证明其来源在指定范围内如此记载。
          </p>
          <p>
            当前人物型主张的身份连接仍candidate，并且scene_eligible=false。
            因此不能把三组记录并成同一人的完整生平、连续任期、党籍、秘密工作或1948—1949年行动。
          </p>
          <p className="border-l-2 border-candidate pl-4 text-sm text-muted-foreground">
            1929记录与“苏开元—苏凯元”身份桥因混合来源依赖暂缓展示。
            这不是证伪结论，而是公开依赖闭包未通过时的安全降级。
          </p>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-3">候选身份说明</h2>
        <div className="rounded-xl border border-candidate/30 bg-candidate/10 p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-candidate shrink-0 mt-0.5" />
            <div>
              {candidate ? (
                <>
                  <p className="font-semibold text-foreground">{candidate.quote_or_assertion}</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    主张状态：{candidate.status}｜identity_link_status：{candidate.identity_link_status}｜
                    scene_eligible={String(candidate.scene_eligible)}｜主张：{candidate.claim_id}｜
                    公开锚：{candidate.identity_anchor_ids.join('、')}。候选身份主张不得直接合并人物节点。
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-foreground">当前没有获准展示的provisional身份主张</p>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    1929记录与“苏开元—苏凯元”身份桥因混合来源依赖暂缓。
                    在公开投影逐记录获批前，本站不展示候选内容、来源细节或跨轨连线。
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">真实预览图谱</h2>
        <p className="text-muted-foreground mb-6 text-sm">
          图中包含人物、地点、机构、职务和文献节点；仅绘制当前图谱中已有的{edgeRecords.length}条关系，不补画被暂缓或推测关系。
        </p>
        <RelationGraph nodes={graphNodes} edges={graphEdges} height={480} />
      </section>

      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold text-foreground mb-2">{claimRecords.length}条原子主张</h2>
            <p className="text-muted-foreground text-sm">载体数量与独立来源数量分开显示。</p>
          </div>
          <Link href="/methodology" className="text-sm text-primary hover:underline hidden sm:inline">
            查看方法 →
          </Link>
        </div>
        <div className="space-y-4">
          {claimRecords.map((claim) => (
            <ClaimCard key={claim.claim_id} {...claimCard(claim)} />
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">当前人物节点</h2>
          <Link href="/persons" className="text-sm text-primary hover:underline">
            人物索引 →
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {personNodes.map((person) => (
            <div key={person.entity_id} className="bg-card border border-border/40 rounded-xl p-5 shadow-card">
              <User className="w-8 h-8 text-primary mb-3" />
              <p className="font-mono text-xs text-primary mb-1">{person.entity_id}</p>
              <h3 className="font-serif font-semibold text-lg text-foreground">{person.canonical_label}</h3>
              <p className="text-xs text-candidate mt-1">{personRelation(person.entity_id)}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                {personSummaries[person.entity_id]}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">{eventRecords.length}组分离的文献姓名记录</h2>
          <Link href="/timeline" className="text-sm text-primary hover:underline">
            完整时间线 →
          </Link>
        </div>
        <TimelineView items={timelineItems} />
      </section>

      <section className="mb-14">
        <div className="flex items-end justify-between mb-6">
          <h2 className="font-serif text-xl font-bold text-foreground">代表性来源</h2>
          <Link href="/archives" className="text-sm text-primary hover:underline">
            {sourceCards.length}项来源 →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sourceCards.slice(0, 3).map((source) => (
            <SourceCard key={source.sourceId} {...source} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold text-foreground mb-6">禁止用推测填满的空白</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {openQuestions.map((question) => (
            <div key={question.title} className="bg-card border border-border/40 rounded-xl p-5 shadow-card">
              <div className="flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-disputed shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-foreground">{question.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{question.detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

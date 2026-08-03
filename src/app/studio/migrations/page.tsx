import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  DatabaseZap,
  EyeOff,
  FileLock2,
  GitCompareArrows,
  ShieldCheck,
} from 'lucide-react';
import driftSummaryJson from '../../../../public/data/graph/legacy-drift-summary.json';

export const metadata: Metadata = {
  title: '图谱迁移收件箱｜Handx web0.1',
  description: '本地查看 Legacy 图谱新增候选的隔离、审计与发布门禁状态。',
};

type DriftSummary = {
  status: 'quarantined' | 'approved_current';
  message: string;
  approved_projection: { nodes: number; edges: number };
  upstream_observed: { nodes: number; edges: number };
  review: {
    quarantined_modified_nodes?: number;
    quarantined_public_node_field_changes?: number;
    quarantined_nodes?: number;
    quarantined_edges?: number;
    quarantined_inventory_records?: number;
    quarantined_blocked_records?: number;
  };
};

const summary = driftSummaryJson as DriftSummary;

const rules = [
  '新增候选不会自动进入访客图谱，也不会生成事实关系。',
  '逐项记录使用无语义编号和内容指纹，不在网页中暴露姓名、关系或家属材料。',
  '只有进入审计主张、补齐来源定位并完成人工发布审查，才可能另行迁移。',
] as const;

export default function GraphMigrationInboxPage() {
  const review = summary.review;
  const blocked = review.quarantined_blocked_records ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,0.86fr)_minmax(28rem,1.14fr)] lg:items-end lg:gap-20">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Local migration inbox
            </p>
            <h1 className="personal-display mt-7 text-[clamp(3.2rem,6.2vw,6.1rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              图谱迁移
              <br />
              收件箱
            </h1>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 border border-primary/30 bg-primary/8 px-3 py-2 text-sm text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
              {summary.status === 'quarantined' ? '隔离门禁正常' : '上游与批准版一致'}
            </div>
            <p className="mt-6 font-serif text-2xl leading-relaxed text-foreground sm:text-3xl">
              新资料先进入候选层，
              <br />
              不直接改写人物历史。
            </p>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted-foreground">
              {summary.message} 这个页面只展示统计和门禁结果；逐项内容留在本机私密收件箱，不发送给浏览器。
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 sm:py-18">
        <div className="personal-shell">
          <div className="grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-2 xl:grid-cols-4">
            <article className="bg-background p-6 sm:min-h-52">
              <DatabaseZap className="size-5 text-primary" aria-hidden="true" />
              <strong className="mt-8 block font-serif text-4xl">
                {summary.approved_projection.nodes}/{summary.approved_projection.edges}
              </strong>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">访客端批准节点／关系</span>
            </article>
            <article className="bg-background p-6 sm:min-h-52">
              <GitCompareArrows className="size-5 text-primary" aria-hidden="true" />
              <strong className="mt-8 block font-serif text-4xl">
                +{review.quarantined_nodes ?? 0}/+{review.quarantined_edges ?? 0}
              </strong>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">新增候选节点／关系</span>
            </article>
            <article className="bg-background p-6 sm:min-h-52">
              <EyeOff className="size-5 text-primary" aria-hidden="true" />
              <strong className="mt-8 block font-serif text-4xl">
                {review.quarantined_modified_nodes ?? 0}
              </strong>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">
                既有记录发生变化，其中 {review.quarantined_public_node_field_changes ?? 0} 项影响展示字段
              </span>
            </article>
            <article className="bg-background p-6 sm:min-h-52">
              <FileLock2 className="size-5 text-primary" aria-hidden="true" />
              <strong className="mt-8 block font-serif text-4xl">{blocked}</strong>
              <span className="mt-2 block text-sm leading-6 text-muted-foreground">逐项阻断，公开泄漏为 0</span>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-card py-14 sm:py-20">
        <div className="personal-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-20">
          <div>
            <p className="story-kicker">受控迁移规则</p>
            <h2 className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              先登记存在，
              <br />
              再决定能否使用。
            </h2>
          </div>
          <ol className="grid gap-4">
            {rules.map((rule, index) => (
              <li key={rule} className="flex gap-4 border-t border-foreground/15 pt-5">
                <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <span className="font-mono text-[11px] text-primary">0{index + 1}</span>
                  <p className="mt-2 text-base leading-8 text-foreground">{rule}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-14 sm:py-20">
        <div className="personal-shell grid gap-8 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end">
          <div>
            <p className="story-kicker">下一道门</p>
            <h2 className="mt-4 max-w-3xl font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              把候选转成来源卡与原子主张，而不是直接点“合并”。
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground">
              当前收件箱为只读。下一轮会优先挑选公开人物与公开文献候选，逐条补身份锚点、来源定位、权利状态与公开等级。
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/graph" className="story-button story-button-primary">
              查看批准图谱
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/methodology" className="story-button story-button-secondary">
              查看研究方法
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

import Link from 'next/link';
import {
  Archive,
  ArrowRight,
  BookOpen,
  CircleSlash2,
  Database,
  FileKey2,
  Fingerprint,
  LockKeyhole,
  ShieldCheck,
} from 'lucide-react';
import siteStatus from '@/data/site-status.json';

const generationStateLabels: Record<string, string> = {
  local_preview_subset: '本地预览子集',
  audited_with_active_quarantine: '审计层有效 · 漂移隔离中',
  pre_execution_baseline: '执行前行动基线',
};

const productStateLabels: Record<string, string> = {
  local_reader: '本地阅读版',
  active_candidate_not_served: '候选版 · 尚未切换',
  local_review: '本地编辑审阅',
  review_only: '仅供审稿',
};

const inventoryLabels: Record<string, string> = {
  sources: '来源',
  claims: '主张',
  nodes: '节点',
  edges: '关系',
  audited_sources: '审计来源',
  audited_claims: '审计主张',
  audited_nodes: '审计实体',
  audited_edges: '审计关系',
  legacy_nodes: 'Legacy 节点',
  legacy_edges: 'Legacy 关系',
  crosswalk_records: '迁移映射',
  missions: '行动卡',
  institutions: '涉及机构',
  highlighted: '优先展示',
  completed: '已取得结果',
  pages: '水印页',
  numbered_chapters: '编号章节',
  commentable_sections: '可评论段落',
  articles: '专题',
  paragraphs: '段落',
  review_only: '待人工审阅',
  not_for_media: '禁止进入媒体包',
  public_ready: '可公开段落',
  mother_content_total: '母内容',
  eligible_for_review_package: '可生成审稿包',
  blocked_from_media: '被媒体门禁阻断',
  platform_templates: '平台模板',
};

function displayDate(value: string): string {
  return value.slice(0, 10);
}

function numericInventory(values: object): Record<string, number> {
  return Object.fromEntries(
    Object.entries(values).filter((entry): entry is [string, number] => typeof entry[1] === 'number'),
  );
}

function Inventory({ values }: { values: Record<string, number> }) {
  return (
    <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden border border-foreground/15 bg-foreground/15 sm:grid-cols-3">
      {Object.entries(values).map(([key, value]) => (
        <div key={key} className="bg-background px-4 py-4">
          <dt className="text-xs leading-5 text-muted-foreground">
            {inventoryLabels[key] ?? key}
          </dt>
          <dd className="mt-1 font-serif text-2xl font-semibold tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function SiteStatusDashboard() {
  const machineContract = siteStatus.machine_contract;
  const rights = siteStatus.rights_and_publication;

  return (
    <main data-status-contract={siteStatus.schema_version}>
      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-10 py-16 sm:py-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(26rem,1.15fr)] lg:items-end lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Data &amp; service status
            </p>
            <h1 className="personal-display mt-7 text-[clamp(1.40rem,2.85vw,2.81rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              版本，
              <br />
              不是分数。
            </h1>
          </div>
          <div>
            <p className="font-serif text-2xl leading-relaxed text-foreground sm:text-xl">
              把数据代次、产品状态、权利门槛和服务开关分开看。
            </p>
            <p className="mt-6 max-w-2xl text-[15px] leading-[1.7] text-muted-foreground">
              这里展示的是“当前系统正在使用哪一份数据、哪些东西只在本机、哪些入口仍然关闭”。
              数量只是清单规模，绝不是苏开元历史研究的完成比例。
            </p>
            <div className="mt-7 flex flex-wrap gap-3 text-sm">
              <span className="border border-foreground/20 bg-background px-4 py-2">本地审阅版</span>
              <span className="border border-foreground/20 bg-background px-4 py-2">公网部署未授权</span>
              <span className="border border-foreground/20 bg-background px-4 py-2">历史完成率：不计算</span>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10" aria-labelledby="service-status-heading">
        <div className="personal-shell">
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
            <div>
              <CircleSlash2 className="size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <p className="story-kicker mt-6">服务开放状态</p>
              <h2 id="service-status-heading" className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                现在没有“悄悄开启”的能力。
              </h2>
              <p className="mt-6 text-[15px] leading-[1.7] text-muted-foreground">
                当前服务模式只保留为“研究需求访谈”的产品方向，入口尚未开放；页面不会接收上传、调用模型或代替你发布内容。
              </p>
            </div>

            <div className="grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-2">
              {[
                ['允许的服务模式', '仅研究需求访谈', machineContract.service_mode === 'research_interview_only'],
                ['文件上传', '关闭', machineContract.uploads === false],
                ['模型处理', '关闭', machineContract.model_processing === 'off'],
                ['向外传输', '拒绝', machineContract.external_egress === 'deny'],
                ['自动生成史实', '关闭', machineContract.auto_fact_generation === false],
                ['支付与打赏', '关闭', machineContract.payment === false],
                ['平台自动发布', '关闭', machineContract.auto_publish === false],
                ['公网部署授权', '未授权', machineContract.deployment_authorized === false],
              ].map(([label, value, safe]) => (
                <div key={String(label)} className="bg-background p-5 sm:min-h-32">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
                    {safe ? <ShieldCheck className="size-4 text-primary" aria-hidden="true" /> : null}
                  </div>
                  <p className="mt-5 font-serif text-2xl font-semibold">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10" aria-labelledby="data-generations-heading">
        <div className="personal-shell">
          <div className="max-w-3xl">
            <Database className="size-8 text-[#c38a82]" strokeWidth={1.5} aria-hidden="true" />
            <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#c38a82]">历史数据代次</p>
            <h2 id="data-generations-heading" className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              三份清单，回答三个不同问题。
            </h2>
            <p className="mt-6 text-[15px] leading-[1.7] text-[#d7cfc2]">
              公开预览子集、审计图谱和查档行动基线不能相互替代，也不能把它们的数量相加成研究进度。
            </p>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {siteStatus.historical_data_generations.map((generation) => (
              <article key={generation.id} className="border border-white/20 bg-white/[0.04] p-6">
                <div className="flex items-start justify-between gap-4">
                  <Archive className="size-6 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
                  <span className="text-right font-mono text-[0.66rem] text-[#aca79f]">{generation.schema_version}</span>
                </div>
                <h3 className="mt-8 font-serif text-2xl font-semibold">{generation.label}</h3>
                <p className="mt-3 text-sm font-medium text-[#d7cfc2]">
                  {generationStateLabels[generation.state] ?? generation.state}
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-white/15 pt-5">
                  {Object.entries(generation.inventory).map(([key, value]) => (
                    <div key={key}>
                      <dt className="text-xs text-[#aca79f]">{inventoryLabels[key] ?? key}</dt>
                      <dd className="mt-1 font-serif text-xl font-semibold tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-6 border-t border-white/15 pt-5 text-sm leading-[1.7] text-[#d7cfc2]">{generation.boundary}</p>
                <p className="mt-4 text-xs text-[#aca79f]">数据日期：{displayDate(generation.generated_at)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10" aria-labelledby="product-artifacts-heading">
        <div className="personal-shell">
          <div className="grid gap-10 lg:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
            <div>
              <BookOpen className="size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
              <p className="story-kicker mt-6">产品构建状态</p>
              <h2 id="product-artifacts-heading" className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                能看见，不等于能公开。
              </h2>
              <p className="mt-6 text-[15px] leading-[1.7] text-muted-foreground">
                阅读器、下一版候选、专题和媒体工作台各自拥有独立门槛。这里的“通过／阻断”只描述工程和编辑门禁。
              </p>
            </div>

            <div className="space-y-5">
              {siteStatus.product_artifacts.map((artifact) => (
                <article key={artifact.id} className="border border-foreground/15 p-6 sm:p-7">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{productStateLabels[artifact.state] ?? artifact.state}</p>
                      <h3 className="mt-3 font-serif text-2xl font-semibold">{artifact.label}</h3>
                    </div>
                    {'version' in artifact ? (
                      <span className="w-fit border border-foreground/20 px-3 py-1 font-mono text-xs">v{artifact.version}</span>
                    ) : null}
                  </div>
                  {artifact.inventory ? (
                    <Inventory values={numericInventory(artifact.inventory)} />
                  ) : null}
                  {artifact.gate_state ? (
                    <div className="mt-6 border border-primary/25 bg-primary/[0.04] p-5">
                      <p className="text-sm font-semibold">版本切换门槛</p>
                      <p className="mt-2 text-sm leading-[1.7] text-muted-foreground">
                        共 {artifact.gate_state.total} 项：{artifact.gate_state.passed} 项已具备，{artifact.gate_state.blocked} 项仍阻断整体切换。
                        这不是历史研究完成率。
                      </p>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 py-16 sm:py-10" aria-labelledby="rights-status-heading">
        <div className="personal-shell">
          <div className="max-w-3xl">
            <FileKey2 className="size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <p className="story-kicker mt-6">权利与发布状态</p>
            <h2 id="rights-status-heading" className="mt-4 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              目前，所有对外发布门都关着。
            </h2>
          </div>

          <div className="mt-10 grid gap-px border border-foreground/15 bg-foreground/15 md:grid-cols-2 xl:grid-cols-4">
            {[
              {
                title: '逐项权利护照',
                value: `${rights.registry.records} 项`,
                detail: `覆盖资产、小说页、文章、专题段落和来源登记；${rights.registry.permission_pending} 项仍待补权利链，公开就绪为 ${rights.registry.public_ready}。`,
              },
              {
                title: '站内资产',
                value: `${rights.static_assets.total} 项`,
                detail: `可公开发布 ${rights.static_assets.publishable} 项；当前全部只限本地内部预览。`,
              },
              {
                title: '小说页面',
                value: `${rights.novel.local_only_pages} 页特别限制`,
                detail: '全书仍为本地阅读版；无转载许可，候选版也尚未切换。',
              },
              {
                title: '媒体素材包',
                value: '仅供人工审稿',
                detail: '不自动发布、不携带平台令牌，也不等于获得公开传播授权。',
              },
            ].map((item) => (
              <article key={item.title} className="bg-background p-6 sm:min-h-64">
                <LockKeyhole className="size-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                <p className="mt-8 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{item.title}</p>
                <h3 className="mt-3 font-serif text-2xl font-semibold">{item.value}</h3>
                <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">{item.detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 py-8 sm:py-10">
        <div className="personal-shell grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <Fingerprint className="size-7 text-primary" strokeWidth={1.5} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">这份状态也有自己的指纹。</h2>
            <p className="mt-5 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
              它由 {siteStatus.input_fingerprints.length} 份本地清单和内容合同确定性聚合；任一输入发生变化而未重新生成时，验证会失败关闭。
              最后汇总的数据时间为 {displayDate(siteStatus.assembled_at)}。
            </p>
            <details className="mt-6 border border-foreground/15 p-5">
              <summary className="cursor-pointer text-sm font-semibold">查看输入指纹与生成编号</summary>
              <dl className="mt-5 space-y-3 font-mono text-[0.7rem] leading-5 text-muted-foreground">
                {siteStatus.input_fingerprints.map((input) => (
                  <div key={input.path} className="grid gap-1 border-t border-foreground/10 pt-3 sm:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.2fr)]">
                    <dt className="break-all">{input.path}</dt>
                    <dd className="break-all">sha256:{input.sha256}</dd>
                  </div>
                ))}
                <div className="grid gap-1 border-t border-foreground/10 pt-3 sm:grid-cols-[minmax(13rem,0.8fr)_minmax(0,1.2fr)]">
                  <dt>generation_id</dt>
                  <dd className="break-all">{siteStatus.generation_id}</dd>
                </div>
              </dl>
            </details>
          </div>

          <div className="flex flex-col gap-4">
            <a href="/data/site-status.json" className="story-button story-button-primary">
              查看机器可读合同
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
            <Link href="/studio/research-log" className="story-button story-button-secondary">
              打开站主执行台
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/rights" className="story-text-link">
              查看权利边界
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

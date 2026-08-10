'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BookOpenText,
  CircleHelp,
  Database,
  FileText,
  Network,
  Route,
} from 'lucide-react';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { RelationGraph, type GraphNode } from '@/components/relation-graph';
import { ResearchGraphExplorer } from '@/components/research-graph-explorer';
import { KnowledgeGraphAtlas } from '@/components/knowledge-graph-atlas';
import legacyGraph from '../../../public/data/graph/legacy-graph.json';
import { graphStoryRoutes } from '@/content/editorial';
import {
  graphEdges,
  graphNodes,
  nodeById,
  nodeRecords,
} from '@/lib/research-data';
import { cn } from '@/lib/utils';

const entityTypeLabels: Record<string, string> = {
  Person: '人物',
  Organization: '机构',
  Place: '地点',
  Role: '职务记录',
  Document: '文献',
};

const readerBoundaries: Record<string, string> = {
  'P-001': '这是一个候选身份簇。当前页面只把分离记录放在同一研究对象周围，不宣告完整身份已经闭合。',
  'P-006': '《绥行纪略》的作者和 1936 年记录者；节点不代表他掌握苏开元的完整生平。',
  'O-012': '文献中出现的组织称谓，只显示 1936 年文本范围内的语义。',
  'L-002': '1936 年文本中的地点。图上的位置不表示现代地图坐标。',
  'R-002': '1933 年同期公报中的一项任命记录，不自动延长为完整任期。',
  'D-027': '1942 年日方军事情报图表；它反映该材料的编成认知，而不是中方任命原件。',
  'R-039': '日方图表所列称谓，不自动证明正式任命范围、私交或秘密协作。',
};

export default function GraphPage() {
  const [viewMode, setViewMode] = useState<'atlas' | 'story' | 'research'>('atlas');
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(
    () => graphNodes.find((node) => node.id === graphStoryRoutes[0]?.focusNodeId) ?? null,
  );
  const [activeRouteId, setActiveRouteId] = useState<string | null>(
    graphStoryRoutes[0]?.id ?? null,
  );
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const rawNode = selectedNode ? nodeById.get(selectedNode.id) : undefined;
  const activeRoute = useMemo(
    () => graphStoryRoutes.find((route) => route.id === activeRouteId),
    [activeRouteId],
  );
  const activeStep = activeRoute?.steps[activeStepIndex];

  const replaceGraphUrl = (values: {
    mode: 'atlas' | 'story' | 'research';
    route?: string | null;
    step?: number;
    focus?: string | null;
  }) => {
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('mode', values.mode);
    if (values.mode === 'story' && values.route) {
      url.searchParams.set('route', values.route);
      url.searchParams.set('step', String(values.step ?? 0));
    } else {
      url.searchParams.delete('route');
      url.searchParams.delete('step');
    }
    if (values.focus) url.searchParams.set('focus', values.focus);
    else url.searchParams.delete('focus');
    window.history.replaceState(null, '', `${url.pathname}?${url.searchParams.toString()}`);
  };

  useEffect(() => {
    const params = new URL(window.location.href).searchParams;
    const requestedMode = params.get('mode');
    if (requestedMode === 'research') {
      setViewMode('research');
      return;
    }
    const requestedRoute = graphStoryRoutes.find((route) => route.id === params.get('route'));
    const requestedStep = Number.parseInt(params.get('step') ?? '0', 10);
    const safeStep = requestedRoute
      ? Math.min(Math.max(Number.isFinite(requestedStep) ? requestedStep : 0, 0), requestedRoute.steps.length - 1)
      : 0;
    const requestedFocus = params.get('focus');
    const focusNode = graphNodes.find((node) => node.id === requestedFocus)
      ?? graphNodes.find((node) => node.id === requestedRoute?.steps[safeStep]?.nodeId);
    if (requestedRoute) {
      setActiveRouteId(requestedRoute.id);
      setActiveStepIndex(safeStep);
    }
    if (focusNode) setSelectedNode(focusNode);
  }, []);

  const openRoute = (routeId: string) => {
    const route = graphStoryRoutes.find((item) => item.id === routeId);
    setActiveRouteId(routeId);
    setActiveStepIndex(0);
    setSelectedNode(
      graphNodes.find((node) => node.id === route?.steps[0]?.nodeId) ?? null,
    );
    replaceGraphUrl({
      mode: 'story',
      route: routeId,
      step: 0,
      focus: route?.steps[0]?.nodeId ?? null,
    });
  };

  const openStep = (stepIndex: number) => {
    const step = activeRoute?.steps[stepIndex];
    if (!step) return;
    setActiveStepIndex(stepIndex);
    setSelectedNode(graphNodes.find((node) => node.id === step.nodeId) ?? null);
    replaceGraphUrl({ mode: 'story', route: activeRoute?.id, step: stepIndex, focus: step.nodeId });
  };

  return (
    <div className="graph-story-page overflow-hidden">
      <ProjectSectionNav />
      <section className="border-b border-foreground/15">
        <div className="personal-shell grid gap-10 py-7 sm:py-7 lg:grid-cols-[minmax(0,0.85fr)_minmax(28rem,1.15fr)] lg:items-end lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Story graph
            </p>
            <h1 className="personal-display mt-7 text-[clamp(1.54rem,2.94vw,2.89rem)] font-semibold leading-[0.94] tracking-[-0.06em]">
              人物与历史，
              <br />
              如何连成证据
            </h1>
          </div>
          <div>
            <p className="font-serif text-2xl leading-relaxed text-foreground sm:text-xl">
              先沿故事找到问题，
              <br />
              再回研究图谱查证。
            </p>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-muted-foreground">
              故事模式用三条路线帮助普通读者进入；研究模式按需加载完整公开审计投影，并把每条关系接回主张与来源定位。
            </p>
            <div className="mt-7 flex flex-wrap gap-x-7 gap-y-3 text-xs text-muted-foreground">
              <span>故事模式 {nodeRecords.length} 个审阅节点</span>
              <span>研究模式 229 个实体／127 条关系</span>
              <span>{graphStoryRoutes.length} 条策展路线</span>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-card">
        <div className="personal-shell grid gap-px bg-foreground/15 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => {
              setViewMode('atlas');
              replaceGraphUrl({ mode: 'atlas', focus: null });
            }}
            className={cn(
              'group min-h-32 bg-background p-6 text-left transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary',
              viewMode === 'atlas' && 'bg-card',
            )}
            aria-pressed={viewMode === 'atlas'}
          >
            <Network className="size-5 text-primary" aria-hidden="true" />
            <strong className="mt-3 block font-serif text-2xl">全图</strong>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">
              一屏看完全部人物、事件与机构，可自由缩放。
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('story');
              replaceGraphUrl({ mode: 'story', route: activeRouteId, step: activeStepIndex, focus: selectedNode?.id });
            }}
            className={cn(
              'group min-h-32 bg-background p-6 text-left transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary',
              viewMode === 'story' && 'bg-card',
            )}
            aria-pressed={viewMode === 'story'}
          >
            <BookOpenText className="size-5 text-primary" aria-hidden="true" />
            <strong className="mt-3 block font-serif text-2xl">故事模式</strong>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">
              三条策展路线，适合第一次认识苏开元研究。
            </span>
          </button>
          <button
            type="button"
            onClick={() => {
              setViewMode('research');
              replaceGraphUrl({ mode: 'research', focus: null });
            }}
            className={cn(
              'group min-h-32 bg-background p-6 text-left transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary',
              viewMode === 'research' && 'bg-card',
            )}
            aria-pressed={viewMode === 'research'}
          >
            <Database className="size-5 text-primary" aria-hidden="true" />
            <strong className="mt-3 block font-serif text-2xl">研究模式</strong>
            <span className="mt-2 block text-sm leading-6 text-muted-foreground">
              搜索、筛选、Wiki 回链；Legacy 线索默认关闭。
            </span>
          </button>
        </div>
      </section>

      {viewMode === 'atlas' ? (
        <section className="border-b border-foreground/15 py-7 sm:py-10">
          <div className="personal-shell">
            <div className="mb-6 max-w-3xl">
              <p className="story-kicker">全图</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold tracking-[-0.04em]">
                这些人，同时在一张图上。
              </h2>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                圆点是人，菱形是事件，方框是机构与部队；圆点越大，连接越多。
                这是旧研究阶段的线索索引，用来看清关系的形状——每一条要当成事实，仍要回到来源与主张。
              </p>
            </div>
            <KnowledgeGraphAtlas
              nodes={legacyGraph.nodes as never}
              edges={legacyGraph.edges as never}
              notice={legacyGraph.warning}
            />
          </div>
        </section>
      ) : viewMode === 'story' ? (
        <>
          <section className="border-b border-foreground/15 py-7 sm:py-10">
        <div className="personal-shell">
          <div className="grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {graphStoryRoutes.map((routeItem) => (
              <button
                key={routeItem.id}
                type="button"
                onClick={() => openRoute(routeItem.id)}
                className={cn(
                  'group min-h-56 bg-background p-7 text-left transition-colors hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary',
                  activeRouteId === routeItem.id && 'bg-card',
                )}
                aria-pressed={activeRouteId === routeItem.id}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="font-serif text-3xl italic text-primary/35">{routeItem.number}</span>
                  <Route className="size-5 text-primary" strokeWidth={1.5} aria-hidden="true" />
                </div>
                <strong className="mt-7 block font-serif text-2xl font-semibold">{routeItem.title}</strong>
                <span className="mt-3 block text-sm leading-[1.7] text-foreground">{routeItem.path}</span>
                <span className="mt-4 block text-xs leading-6 text-muted-foreground">{routeItem.note}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

          <section className="py-9 sm:py-10">
        <div className="personal-shell">
          {activeRoute && (
            <ol className="mb-6 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-5">
              {activeRoute.steps.map((step, index) => (
                <li key={`${activeRoute.id}-${step.title}`} className="bg-background">
                  <button
                    type="button"
                    onClick={() => openStep(index)}
                    aria-current={activeStepIndex === index ? 'step' : undefined}
                    className={cn(
                      'h-full min-h-28 w-full p-4 text-left transition hover:bg-card focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary',
                      activeStepIndex === index && 'bg-card',
                    )}
                  >
                    <span className="font-mono text-[10px] text-primary">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <strong className="mt-2 block text-sm leading-6">
                      {step.title}
                    </strong>
                  </button>
                </li>
              ))}
            </ol>
          )}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.42fr)_minmax(21rem,0.58fr)]">
            <RelationGraph
              nodes={graphNodes}
              edges={graphEdges}
              width={800}
              height={520}
              onNodeClick={(node) => {
                setSelectedNode(node);
                setActiveRouteId(null);
                setActiveStepIndex(0);
                replaceGraphUrl({ mode: 'story', focus: node.id });
              }}
              selectedNodeId={selectedNode?.id}
              className="rounded-none border-foreground/15"
            />

            <aside
              id="graph-node-detail"
              aria-live="polite"
              aria-atomic="true"
              className="graph-detail-panel"
            >
              {activeRoute && (
                <div className="border-b border-foreground/15 pb-6">
                  <p className="text-[10px] font-bold tracking-[0.18em] text-primary uppercase">正在沿路线阅读</p>
                  <h2 className="mt-3 font-serif text-2xl font-semibold">{activeRoute.title}</h2>
                  <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">{activeRoute.note}</p>
                </div>
              )}

              {activeStep && (
                <div className="border-b border-foreground/15 py-6">
                  <p className="font-mono text-[10px] text-primary">
                    STEP {String(activeStepIndex + 1).padStart(2, '0')} / {activeRoute?.steps.length}
                  </p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold">{activeStep.title}</h3>
                  <p className="mt-3 text-sm leading-[1.7]">{activeStep.moment}</p>
                  <p className="mt-4 border-l-2 border-primary pl-3 font-serif text-[15px] leading-[1.7] text-muted-foreground">
                    {activeStep.quote}
                  </p>
                  <dl className="mt-5 space-y-3 text-xs leading-6">
                    <div>
                      <dt className="font-semibold text-confirmed">这能确认</dt>
                      <dd className="text-muted-foreground">{activeStep.canConfirm}</dd>
                    </div>
                    <div>
                      <dt className="font-semibold text-disputed">还不能确认</dt>
                      <dd className="text-muted-foreground">{activeStep.cannotConfirm}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/archives/${encodeURIComponent(activeStep.sourceId)}`}
                    className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
                  >
                    回到 {activeStep.sourceId}
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </Link>
                </div>
              )}

              {rawNode ? (
                <div className={cn((activeRoute || activeStep) && 'pt-6')}>
                  <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                    {entityTypeLabels[rawNode.entity_type] ?? rawNode.entity_type}
                  </p>
                  <h2 className="mt-2 font-serif text-3xl font-semibold leading-tight">{rawNode.canonical_label}</h2>
                  {rawNode.variant_label && rawNode.variant_label !== rawNode.canonical_label && (
                    <p className="mt-2 text-sm text-muted-foreground">文献异写：{rawNode.variant_label}</p>
                  )}
                  <p className="mt-6 border-l-2 border-primary pl-4 text-sm leading-[1.7] text-foreground">
                    {readerBoundaries[rawNode.entity_id] ?? '这个节点只在当前来源允许的范围内显示。'}
                  </p>

                  <div className="mt-7 border-t border-foreground/15 pt-5">
                    <p className="text-xs text-muted-foreground">支持载体</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {rawNode.source_ids.map((sourceId) => (
                        <Link
                          key={sourceId}
                          href={`/archives/${encodeURIComponent(sourceId)}`}
                          className="inline-flex min-h-9 items-center gap-1.5 border border-foreground/15 px-3 text-xs text-foreground transition-colors hover:border-primary hover:text-primary"
                        >
                          <FileText className="size-3.5" aria-hidden="true" />
                          {sourceId}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex min-h-72 flex-col justify-center">
                  <CircleHelp className="size-8 text-primary" strokeWidth={1.5} aria-hidden="true" />
                  <h2 className="mt-5 font-serif text-2xl font-semibold">先选一条路线，或点一个节点。</h2>
                  <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                    右侧会告诉你这个节点是什么、边界在哪里，以及可以回到哪些来源。
                  </p>
                </div>
              )}
            </aside>
          </div>
        </div>
          </section>

          <section className="border-y border-white/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell grid gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-14">
          <div>
            <Network className="size-7 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-4xl font-semibold tracking-[-0.04em]">这张图没有画什么，同样重要。</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <p className="border-t border-white/20 pt-5 text-sm leading-[1.7] text-[#c9c5bd]">
              没有把蘇開元与蘇凱元直接合并，也没有把 1929 年记录接入当前预览。
            </p>
            <p className="border-t border-white/20 pt-5 text-sm leading-[1.7] text-[#c9c5bd]">
              没有把“同一图表并列”升级成朋友、同学、上下级或共同任务。
            </p>
            <p className="border-t border-white/20 pt-5 text-sm leading-[1.7] text-[#c9c5bd]">
              文献、地点和职务节点可以暂时没有边；这不是遗漏，而是证据稀疏度。
            </p>
            <p className="border-t border-white/20 pt-5 text-sm leading-[1.7] text-[#c9c5bd]">
              图上距离、方位和大小只服务阅读，不表达权力、亲密或因果强弱。
            </p>
          </div>
        </div>
          </section>

          <section className="py-7 sm:py-10">
        <div className="personal-shell flex flex-col justify-between gap-8 border-b border-foreground/15 pb-12 md:flex-row md:items-end">
          <div>
            <BookOpenText className="size-6 text-primary" aria-hidden="true" />
            <h2 className="mt-5 font-serif text-3xl font-semibold">看完图，回到故事与原件。</h2>
            <p className="mt-3 max-w-xl text-sm leading-[1.7] text-muted-foreground">
              图谱是导航，不是结论本身。真正的判断仍发生在原文、上下文和冲突记录里。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/discover/same-name" className="story-button story-button-secondary">
              读身份谜题
              <ArrowRight className="size-4" />
            </Link>
            <Link href="/archives" className="story-button story-button-primary">
              打开原件
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </div>
          </section>
        </>
      ) : (
        <section className="py-7 sm:py-8">
          <div className="personal-shell">
            <ResearchGraphExplorer />
          </div>
        </section>
      )}
    </div>
  );
}

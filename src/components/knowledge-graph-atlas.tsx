'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, { type Core, type LayoutOptions, type NodeSingular } from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { Focus, Minus, Plus, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

cytoscape.use(fcose);

export interface AtlasNode {
  id: string;
  label: string;
  group: 'person' | 'event' | 'org';
  subgroup?: string;
  period?: string;
  title?: string;
  legacy_reliability?: string;
}

export interface AtlasEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  period?: string;
}

/**
 * One colour per person cluster, so the shape of the network is readable before
 * a single label is. Events and organisations keep a single colour each: they
 * are scenery for the people, and colouring them too turns the canvas to noise.
 */
const CLUSTER_COLORS: Record<string, string> = {
  传主: '#e8a33d',
  家族: '#7fd1b9',
  '东北军-讲武堂系': '#4aa3df',
  留日同学: '#9b8bd6',
  傅作义系: '#5b8ff9',
  '军统与对手': '#8c8c96',
  中共线: '#e05c5c',
  历史大人物: '#3fbf8f',
  北平名流: '#e8709b',
  公安战线: '#c9a227',
};
const CLUSTER_FALLBACK = '#6f7b8a';
const EVENT_COLOR = '#c9a227';
const ORG_BG = '#2a3442';
const ORG_BORDER = '#5c7ea8';

function clusterColor(subgroup?: string): string {
  return (subgroup && CLUSTER_COLORS[subgroup]) || CLUSTER_FALLBACK;
}

export function KnowledgeGraphAtlas({
  nodes,
  edges,
  notice,
}: {
  nodes: readonly AtlasNode[];
  edges: readonly AtlasEdge[];
  notice?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Core | null>(null);
  const [selected, setSelected] = useState<AtlasNode | null>(null);
  const [hiddenClusters, setHiddenClusters] = useState<ReadonlySet<string>>(new Set());
  const [ready, setReady] = useState(false);

  const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes]);

  const degrees = useMemo(() => {
    const counts = new Map<string, number>();
    for (const edge of edges) {
      counts.set(edge.from, (counts.get(edge.from) ?? 0) + 1);
      counts.set(edge.to, (counts.get(edge.to) ?? 0) + 1);
    }
    return counts;
  }, [edges]);

  const clusters = useMemo(() => {
    const seen = new Map<string, number>();
    for (const node of nodes) {
      if (node.group !== 'person') continue;
      const key = node.subgroup ?? '其他';
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    return [...seen.entries()].sort((a, b) => b[1] - a[1]);
  }, [nodes]);

  const elements = useMemo(() => {
    const nodeElements = nodes.map((node) => {
      const degree = degrees.get(node.id) ?? 0;
      const isSubject = node.subgroup === '传主';
      const size =
        node.group === 'person'
          ? Math.min(58, 22 + degree * 2.4) * (isSubject ? 1.5 : 1)
          : node.group === 'event'
            ? 18
            : 24;
      return {
        data: {
          id: node.id,
          label: node.label,
          group: node.group,
          cluster: node.subgroup ?? '其他',
          color: node.group === 'person' ? clusterColor(node.subgroup) : EVENT_COLOR,
          size,
          fontSize: isSubject ? 19 : node.group === 'person' ? 12 : 10,
          uncertain: node.legacy_reliability === 'C' ? 'yes' : 'no',
        },
      };
    });
    const edgeElements = edges
      .filter((edge) => nodeById.has(edge.from) && nodeById.has(edge.to))
      .map((edge) => ({
        data: {
          id: edge.id,
          source: edge.from,
          target: edge.to,
          // Long relation notes become tooltips rather than canvas clutter.
          label: edge.label && edge.label.length <= 10 ? edge.label : '',
        },
      }));
    return [...nodeElements, ...edgeElements];
  }, [nodes, edges, degrees, nodeById]);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = cytoscape({
      container: containerRef.current,
      elements,
      wheelSensitivity: 0.2,
      minZoom: 0.08,
      maxZoom: 4,
      boxSelectionEnabled: false,
      style: [
        {
          selector: 'node',
          style: {
            label: 'data(label)',
            'background-color': 'data(color)',
            width: 'data(size)',
            height: 'data(size)',
            'font-size': 'data(fontSize)',
            'font-family': '"PingFang SC", "Microsoft YaHei", sans-serif',
            color: '#e8e6e0',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-outline-color': '#12161c',
            'text-outline-width': 2.5,
            'border-width': 1.5,
            'border-color': '#12161c',
            'transition-property': 'opacity',
            'transition-duration': 160,
          },
        },
        {
          selector: 'node[group = "event"]',
          style: { shape: 'diamond', color: '#d6c690' },
        },
        {
          selector: 'node[group = "org"]',
          style: {
            shape: 'round-rectangle',
            'background-color': ORG_BG,
            'border-color': ORG_BORDER,
            'border-width': 2,
            color: '#a8bcd4',
            width: 'label',
            height: 22,
            padding: '7px',
            'text-valign': 'center',
            'text-margin-y': 0,
          },
        },
        {
          // Reliability C: still shown, but visibly not settled.
          selector: 'node[uncertain = "yes"]',
          style: { 'border-color': '#e87d7d', 'border-width': 2.5, 'border-style': 'dashed' },
        },
        {
          selector: 'edge',
          style: {
            width: 1,
            'line-color': '#3f4753',
            'curve-style': 'bezier',
            label: 'data(label)',
            'font-size': 8,
            color: '#7b8494',
            'text-outline-color': '#12161c',
            'text-outline-width': 2,
            'text-rotation': 'autorotate',
            opacity: 0.85,
          },
        },
        { selector: '.dimmed', style: { opacity: 0.09 } },
        {
          selector: '.spotlight',
          style: { 'line-color': '#e8a33d', width: 2.2, opacity: 1, color: '#e8c98a' },
        },
        { selector: 'node.spotlight', style: { 'border-color': '#e8a33d', 'border-width': 3 } },
        { selector: '.hidden', style: { display: 'none' } },
      ],
    });
    graphRef.current = graph;

    const layout: LayoutOptions = {
      name: 'fcose',
      animate: false,
      quality: 'proof',
      randomize: true,
      // Loose enough that 107 nodes settle without label collisions, tight
      // enough that the whole network still fits one screen after fit().
      nodeSeparation: 130,
      idealEdgeLength: 130,
      nodeRepulsion: 9000,
      gravity: 0.22,
      numIter: 3200,
      fit: true,
      padding: 44,
    } as LayoutOptions;
    graph.layout(layout).run();
    // Physics settles once, then the view is frozen and fitted — the whole graph
    // in one frame is the point; a permanently drifting canvas is not.
    graph.fit(undefined, 44);
    setReady(true);

    graph.on('tap', 'node', (event) => {
      const node = event.target as NodeSingular;
      const neighborhood = node.closedNeighborhood();
      graph.elements().addClass('dimmed');
      neighborhood.removeClass('dimmed').addClass('spotlight');
      setSelected(nodeById.get(node.id()) ?? null);
    });
    graph.on('tap', (event) => {
      if (event.target === graph) {
        graph.elements().removeClass('dimmed spotlight');
        setSelected(null);
      }
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [elements, nodeById]);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.batch(() => {
      graph.nodes().forEach((node) => {
        const cluster = node.data('cluster') as string;
        const isPerson = node.data('group') === 'person';
        node.toggleClass('hidden', isPerson && hiddenClusters.has(cluster));
      });
      graph.edges().forEach((edge) => {
        edge.toggleClass(
          'hidden',
          edge.source().hasClass('hidden') || edge.target().hasClass('hidden'),
        );
      });
    });
  }, [hiddenClusters]);

  const toggleCluster = useCallback((cluster: string) => {
    setHiddenClusters((current) => {
      const next = new Set(current);
      if (next.has(cluster)) next.delete(cluster);
      else next.add(cluster);
      return next;
    });
  }, []);

  const fit = useCallback(() => graphRef.current?.fit(undefined, 44), []);
  const zoomBy = useCallback((factor: number) => {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom({ level: graph.zoom() * factor, renderedPosition: { x: graph.width() / 2, y: graph.height() / 2 } });
  }, []);
  const reset = useCallback(() => {
    setHiddenClusters(new Set());
    graphRef.current?.elements().removeClass('dimmed spotlight');
    setSelected(null);
    fit();
  }, [fit]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_19rem]">
      <div className="relative overflow-hidden border border-foreground/20 bg-[#12161c]">
        {/* Explicit height, not `absolute inset-0`: cytoscape sets position:relative
            on its own container, which cancels the absolute positioning and
            collapses the canvas to zero height. */}
        <div
          ref={containerRef}
          className="h-[38rem] w-full sm:h-[44rem] lg:h-[48rem]"
          role="img"
          aria-label={`苏开元知识图谱全图：${nodes.length} 个节点、${edges.length} 条关系，可缩放、拖动与选择`}
        />
        {!ready && (
          <p className="absolute inset-0 grid place-items-center text-sm text-[#8b93a1]">
            正在排布 {nodes.length} 个节点…
          </p>
        )}
        <div className="absolute top-3 right-3 z-10 flex gap-1.5">
          <Button type="button" variant="outline" size="sm" className="bg-background/95" onClick={() => zoomBy(1.3)} aria-label="放大">
            <Plus className="size-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-background/95" onClick={() => zoomBy(1 / 1.3)} aria-label="缩小">
            <Minus className="size-4" aria-hidden="true" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-background/95" onClick={fit}>
            <Focus className="size-4" aria-hidden="true" />
            全图
          </Button>
          <Button type="button" variant="outline" size="sm" className="bg-background/95" onClick={reset} aria-label="重置">
            <RotateCcw className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="pointer-events-none absolute bottom-3 left-4 z-10 text-[11px] text-[#6f7885]">
          {nodes.length} 节点 · {edges.length} 关系 · 滚轮缩放，拖动平移，点击节点看邻居
        </p>
      </div>

      <aside className="flex flex-col gap-4">
        {selected ? (
          <div className="border border-foreground/15 bg-card p-4">
            <p className="font-mono text-[10px] tracking-[0.15em] text-primary uppercase">
              {selected.group === 'person' ? 'Person' : selected.group === 'event' ? 'Event' : 'Organisation'}
            </p>
            <h3 className="mt-2 font-serif text-2xl font-semibold">{selected.label}</h3>
            {selected.subgroup && (
              <p className="mt-1 text-xs text-muted-foreground">
                {selected.subgroup}
                {selected.period ? ` · ${selected.period}` : ''}
              </p>
            )}
            {selected.title && <p className="mt-3 text-sm leading-[1.8] text-muted-foreground">{selected.title}</p>}
            {selected.legacy_reliability === 'C' && (
              <p className="mt-3 border border-amber-800/25 bg-amber-50 p-2 text-[11px] leading-5 text-amber-950">
                这一条的可靠度记为 C：线索存在，但还不足以当作结论。
              </p>
            )}
          </div>
        ) : (
          <div className="border border-foreground/15 bg-card p-4">
            <h3 className="font-serif text-lg font-semibold">图例</h3>
            <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-[#e8a33d]" aria-hidden="true" />
                人物（圆点越大，连接越多）
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rotate-45 bg-[#c9a227]" aria-hidden="true" />
                事件
              </li>
              <li className="flex items-center gap-2">
                <span className="h-3 w-5 rounded-sm border border-[#5c7ea8] bg-[#2a3442]" aria-hidden="true" />
                机构与部队
              </li>
              <li className="flex items-center gap-2">
                <span className="size-3 rounded-full border-2 border-dashed border-[#e87d7d]" aria-hidden="true" />
                可靠度 C，仅作线索
              </li>
            </ul>
          </div>
        )}

        <div className="border border-foreground/15 bg-card p-4">
          <h3 className="font-serif text-lg font-semibold">人物族群</h3>
          <p className="mt-1 text-[11px] text-muted-foreground">点一下可以暂时隐藏某一群人。</p>
          <ul className="mt-3 space-y-1.5">
            {clusters.map(([cluster, count]) => {
              const hidden = hiddenClusters.has(cluster);
              return (
                <li key={cluster}>
                  <button
                    type="button"
                    onClick={() => toggleCluster(cluster)}
                    aria-pressed={!hidden}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-muted',
                      hidden && 'opacity-40',
                    )}
                  >
                    <span
                      className="size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: clusterColor(cluster) }}
                      aria-hidden="true"
                    />
                    <span className="flex-1">{cluster}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {notice && (
          <p className="border border-amber-800/20 bg-amber-50 p-3 text-[11px] leading-5 text-amber-950">
            {notice}
          </p>
        )}
      </aside>
    </div>
  );
}

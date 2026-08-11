'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import cytoscape, {
  type Core,
  type ElementDefinition,
  type LayoutOptions,
  type NodeSingular,
  type StylesheetJson,
} from 'cytoscape';
import fcose from 'cytoscape-fcose';
import {
  AlertTriangle,
  ExternalLink,
  Filter,
  Focus,
  LoaderCircle,
  Network,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  type AuditClaim,
  type AuditEdge,
  type AuditGraphBundle,
  type AuditNode,
  type EntityType,
  type LegacyGraphBundle,
  claimBucket,
  claimStatusLabels,
  entityTypeLabels,
  migrationStatusLabels,
} from '@/lib/graph-wiki-types';
import { cn } from '@/lib/utils';

cytoscape.use(fcose);

type GraphLayer = 'audit' | 'legacy';
type EvidenceFilter =
  | 'all'
  | 'working_verified'
  | 'needs_archive'
  | 'provisional'
  | 'blocked';
type PeriodFilter = 'all' | 'before-1930' | '1930s' | '1940s' | 'after-1949';

interface SelectedAuditNode {
  layer: 'audit';
  node: AuditNode;
}

interface SelectedLegacyNode {
  layer: 'legacy';
  node: LegacyGraphBundle['nodes'][number];
}

type SelectedNode = SelectedAuditNode | SelectedLegacyNode;

const entityColors: Record<EntityType, string> = {
  Person: '#8d3f39',
  Event: '#b46f41',
  Organization: '#4f6a66',
  Place: '#6b7a45',
  Role: '#7e5a7b',
  Document: '#4f6480',
};

const graphStyles: StylesheetJson = [
  {
    selector: 'node',
    style: {
      'background-color': 'data(color)',
      'border-color': '#fffaf0',
      'border-width': 2,
      color: '#24211d',
      label: 'data(label)',
      'font-size': 9,
      'font-family': 'serif',
      'font-weight': 600,
      'text-background-color': '#fffaf0',
      'text-background-opacity': 0.92,
      'text-background-padding': '3px',
      'text-margin-y': 18,
      'text-wrap': 'wrap',
      'text-max-width': '90px',
      height: 24,
      width: 24,
      'overlay-opacity': 0,
    },
  },
  {
    selector: 'node.candidate',
    style: {
      'border-color': '#bd7b28',
      'border-style': 'dashed',
      'border-width': 3,
    },
  },
  {
    selector: 'node.core',
    style: {
      height: 38,
      width: 38,
      'border-color': '#8d3f39',
      'border-width': 4,
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#171513',
      'border-width': 5,
    },
  },
  {
    selector: 'edge',
    style: {
      'curve-style': 'bezier',
      'line-color': '#a7a097',
      'target-arrow-color': '#a7a097',
      'target-arrow-shape': 'triangle',
      'arrow-scale': 0.65,
      opacity: 0.55,
      width: 1.25,
      'overlay-opacity': 0,
    },
  },
  {
    selector: 'edge.provisional',
    style: {
      'line-style': 'dashed',
      'line-color': '#bd7b28',
      'target-arrow-color': '#bd7b28',
    },
  },
  {
    selector: 'edge.blocked',
    style: {
      'line-style': 'dotted',
      'line-color': '#8b8177',
      'target-arrow-color': '#8b8177',
      opacity: 0.4,
    },
  },
  {
    selector: '.faded',
    style: {
      opacity: 0.08,
      'text-opacity': 0,
    },
  },
  {
    selector: '.highlighted',
    style: {
      opacity: 1,
      width: 3,
      'z-index': 99,
    },
  },
];

const periodLabels: Record<PeriodFilter, string> = {
  all: '全部时期',
  'before-1930': '1930年前',
  '1930s': '1930年代',
  '1940s': '1940年代',
  'after-1949': '1949年后',
};

const evidenceLabels: Record<EvidenceFilter, string> = {
  all: '全部证据状态',
  working_verified: '工作核验',
  needs_archive: '需档案核验',
  provisional: '候选主张',
  blocked: '不得作为事实',
};

function parseStartYear(value: string): number | undefined {
  const match = value.match(/(?:18|19|20)\d{2}/);
  return match ? Number(match[0]) : undefined;
}

function periodMatches(year: number | undefined, filter: PeriodFilter): boolean {
  if (filter === 'all') return true;
  if (year === undefined) return false;
  if (filter === 'before-1930') return year < 1930;
  if (filter === '1930s') return year >= 1930 && year <= 1939;
  if (filter === '1940s') return year >= 1940 && year <= 1949;
  return year > 1949;
}

function candidateIdentity(node: AuditNode): boolean {
  const status = node.identity_status.toLowerCase();
  return (
    status.includes('candidate') ||
    status.includes('claimed') ||
    status.includes('needs archive') ||
    status.includes('unresolved')
  );
}

function auditElements(
  nodes: AuditNode[],
  edges: AuditEdge[],
): ElementDefinition[] {
  return [
    ...nodes.map((node) => ({
      data: {
        id: node.entity_id,
        label: node.canonical_label,
        color: entityColors[node.entity_type],
      },
      classes: cn(
        candidateIdentity(node) && 'candidate',
        node.entity_id === 'P-001' && 'core',
      ),
    })),
    ...edges.map((edge) => ({
      data: {
        id: edge.edge_id,
        source: edge.from_entity_id,
        target: edge.to_entity_id,
        label: edge.relation,
      },
      classes:
        edge.edge_status === 'working_verified'
          ? ''
          : edge.edge_status === 'not_supported'
            ? 'blocked'
            : 'provisional',
    })),
  ];
}

function legacyElements(bundle: LegacyGraphBundle): ElementDefinition[] {
  const groupColors: Record<string, string> = {
    person: '#7f756d',
    event: '#8e7e67',
    org: '#65746f',
  };
  return [
    ...bundle.nodes.map((node) => ({
      data: {
        id: node.id,
        label: node.label,
        color: groupColors[node.group] ?? '#7f756d',
      },
      classes: cn('candidate', node.id === 'su-kaiyuan' && 'core'),
    })),
    ...bundle.edges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.from,
        target: edge.to,
        label: edge.label,
      },
      classes: 'blocked',
    })),
  ];
}

function GraphCanvas({
  elements,
  onSelectNode,
}: {
  elements: ElementDefinition[];
  onSelectNode: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const graphRef = useRef<Core | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const graph = cytoscape({
      container: containerRef.current,
      elements,
      style: graphStyles,
      wheelSensitivity: 0.18,
      minZoom: 0.2,
      maxZoom: 2.5,
      boxSelectionEnabled: false,
    });
    graphRef.current = graph;

    const layoutOptions = {
      name: 'fcose',
      animate: false,
      quality: 'default',
      randomize: true,
      nodeSeparation: 70,
      idealEdgeLength: 85,
      fit: true,
      padding: 36,
    } as LayoutOptions;
    graph.layout(layoutOptions).run();

    const selectHandler = (event: cytoscape.EventObject) => {
      const node = event.target as NodeSingular;
      const neighborhood = node.closedNeighborhood();
      graph.elements().addClass('faded');
      neighborhood.removeClass('faded');
      neighborhood.edges().addClass('highlighted');
      onSelectNode(node.id());
    };
    graph.on('tap', 'node', selectHandler);
    graph.on('tap', (event) => {
      if (event.target === graph) graph.elements().removeClass('faded highlighted');
    });

    return () => {
      graph.destroy();
      graphRef.current = null;
    };
  }, [elements, onSelectNode]);

  return (
    <div className="relative min-h-[34rem] overflow-hidden border border-foreground/15 bg-[#f8f4ec]">
      <div
        ref={containerRef}
        className="absolute inset-0"
        role="img"
        aria-label="可缩放、拖动和选择节点的知识图谱"
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="absolute top-3 right-3 z-10 bg-background/95"
        onClick={() => graphRef.current?.fit(undefined, 36)}
      >
        <Focus className="size-4" aria-hidden="true" />
        适应画布
      </Button>
    </div>
  );
}

export function ResearchGraphExplorer() {
  const [auditData, setAuditData] = useState<AuditGraphBundle | null>(null);
  const [legacyData, setLegacyData] = useState<LegacyGraphBundle | null>(null);
  const [layer, setLayer] = useState<GraphLayer>('audit');
  const [showLegacyConfirm, setShowLegacyConfirm] = useState(false);
  const [search, setSearch] = useState('');
  const [entityType, setEntityType] = useState<'all' | EntityType>('all');
  const [period, setPeriod] = useState<PeriodFilter>('all');
  const [evidence, setEvidence] = useState<EvidenceFilter>('all');
  const [conflictsOnly, setConflictsOnly] = useState(false);
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    // Loopback endpoint, not a static file: the research graphs are no longer
    // under public/, because the public edition serves public/ wholesale.
    fetch('/api/local/research-graph?graph=audit', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<AuditGraphBundle>;
      })
      .then((bundle) => {
        setAuditData(bundle);
        setSelected({ layer: 'audit', node: bundle.nodes[0] });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setLoadError('审计图谱数据加载失败，请刷新页面重试。');
      });
    return () => controller.abort();
  }, []);

  const claimIndex = useMemo(() => {
    const index = new Map<string, AuditClaim[]>();
    if (!auditData) return index;
    for (const claim of auditData.claims) {
      const claims = index.get(claim.subject_id) ?? [];
      claims.push(claim);
      index.set(claim.subject_id, claims);
    }
    return index;
  }, [auditData]);

  const filteredAudit = useMemo(() => {
    if (!auditData) return { nodes: [] as AuditNode[], edges: [] as AuditEdge[] };
    const query = search.trim().toLocaleLowerCase('zh-CN');
    const nodes = auditData.nodes.filter((node) => {
      const claims = claimIndex.get(node.entity_id) ?? [];
      const text = [
        node.entity_id,
        node.canonical_label,
        node.variant_label,
        node.identity_status,
        ...claims.map((claim) => claim.quote_or_assertion),
      ]
        .join(' ')
        .toLocaleLowerCase('zh-CN');
      if (query && !text.includes(query)) return false;
      if (entityType !== 'all' && node.entity_type !== entityType) return false;

      const years = [
        parseStartYear(node.valid_time_start),
        ...claims.map((claim) => parseStartYear(claim.time_start)),
      ];
      if (period !== 'all' && !years.some((year) => periodMatches(year, period))) {
        return false;
      }

      if (evidence === 'blocked') {
        if (!claims.some((claim) => claimBucket(claim) === 'blocked')) return false;
      } else if (
        evidence !== 'all' &&
        !claims.some((claim) => claim.status === evidence)
      ) {
        return false;
      }
      if (
        conflictsOnly &&
        !claims.some(
          (claim) =>
            Boolean(claim.conflict_set_id) || claim.conflicts_with.length > 0,
        )
      ) {
        return false;
      }
      return true;
    });
    const nodeIds = new Set(nodes.map((node) => node.entity_id));
    const edges = auditData.edges.filter(
      (edge) =>
        nodeIds.has(edge.from_entity_id) &&
        nodeIds.has(edge.to_entity_id),
    );
    return { nodes, edges };
  }, [
    auditData,
    claimIndex,
    conflictsOnly,
    entityType,
    evidence,
    period,
    search,
  ]);

  const elements = useMemo(() => {
    if (layer === 'legacy' && legacyData) return legacyElements(legacyData);
    return auditElements(filteredAudit.nodes, filteredAudit.edges);
  }, [filteredAudit, layer, legacyData]);

  const selectedAuditClaims =
    selected?.layer === 'audit'
      ? claimIndex.get(selected.node.entity_id) ?? []
      : [];
  const selectedAuditEdges =
    selected?.layer === 'audit' && auditData
      ? auditData.edges.filter(
          (edge) =>
            edge.from_entity_id === selected.node.entity_id ||
            edge.to_entity_id === selected.node.entity_id,
        )
      : [];

  const loadLegacy = async () => {
    setLoadError('');
    try {
      const response = await fetch('/api/local/research-graph?graph=legacy', {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bundle = (await response.json()) as LegacyGraphBundle;
      setLegacyData(bundle);
      setLayer('legacy');
      setSelected({ layer: 'legacy', node: bundle.nodes[0] });
      setShowLegacyConfirm(false);
    } catch {
      setLoadError('Legacy 线索数据加载失败，请稍后重试。');
    }
  };

  const selectNode = useCallback((nodeId: string) => {
    if (layer === 'legacy') {
      const node = legacyData?.nodes.find((item) => item.id === nodeId);
      if (node) setSelected({ layer: 'legacy', node });
      return;
    }
    const node = auditData?.nodes.find((item) => item.entity_id === nodeId);
    if (node) setSelected({ layer: 'audit', node });
  }, [auditData, layer, legacyData]);

  if (!auditData) {
    return (
      <div className="flex min-h-80 items-center justify-center border border-foreground/15 bg-card">
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : (
          <p className="inline-flex items-center gap-3 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
            正在加载审计图谱……
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-4 border border-foreground/15 bg-card p-5 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Research graph
          </p>
          <h2 className="mt-2 font-serif text-xl font-semibold">
            {layer === 'audit' ? '审计研究图谱' : 'Legacy 线索图'}
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
            {layer === 'audit'
              ? '这里展示公开审计投影。关系必须通过主张回到来源定位；工作核验仍不等于最终历史定论。'
              : legacyData?.warning}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={layer === 'audit' ? 'default' : 'outline'}
            onClick={() => {
              setLayer('audit');
              setSelected({ layer: 'audit', node: auditData.nodes[0] });
            }}
          >
            <ShieldCheck className="size-4" aria-hidden="true" />
            审计图谱
          </Button>
          <Button
            type="button"
            variant={layer === 'legacy' ? 'default' : 'outline'}
            onClick={() => {
              if (legacyData) {
                setLayer('legacy');
                setSelected({ layer: 'legacy', node: legacyData.nodes[0] });
              } else {
                setShowLegacyConfirm(true);
              }
            }}
          >
            <AlertTriangle className="size-4" aria-hidden="true" />
            Legacy 线索
          </Button>
        </div>
      </div>

      {showLegacyConfirm && (
        <section
          className="mt-4 border-2 border-candidate bg-candidate/10 p-5"
          aria-labelledby="legacy-confirm-title"
        >
          <h3 id="legacy-confirm-title" className="font-serif text-lg font-semibold">
            打开的是旧研究线索，不是事实图
          </h3>
          <p className="mt-2 max-w-3xl text-sm leading-[1.7] text-muted-foreground">
            旧图包含未经原子化核验的人物描述与关系。本站只保留节点标题、关系标签和迁移裁决，
            不复制旧详情，也不会把旧 A／B／C 评级、身份映射或因果关系升级为事实。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => void loadLegacy()}>
              我理解，加载 107 个线索节点
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowLegacyConfirm(false)}
            >
              取消
            </Button>
          </div>
        </section>
      )}

      {loadError && (
        <p className="mt-4 border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {loadError}
        </p>
      )}

      {layer === 'audit' && (
        <section
          className="mt-4 grid gap-3 border border-foreground/15 bg-background p-4 md:grid-cols-2 xl:grid-cols-5"
          aria-label="研究图谱筛选器"
        >
          <label className="xl:col-span-2">
            <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Search className="size-3.5" aria-hidden="true" />
              搜索实体或主张
            </span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="例如：李英夫、平地泉、435团"
              className="min-h-11 w-full border border-foreground/20 bg-card px-3 text-sm outline-none focus:border-primary"
            />
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              实体类型
            </span>
            <select
              value={entityType}
              onChange={(event) =>
                setEntityType(event.target.value as 'all' | EntityType)
              }
              className="min-h-11 w-full border border-foreground/20 bg-card px-3 text-sm"
            >
              <option value="all">全部实体</option>
              {Object.entries(entityTypeLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              时期
            </span>
            <select
              value={period}
              onChange={(event) =>
                setPeriod(event.target.value as PeriodFilter)
              }
              className="min-h-11 w-full border border-foreground/20 bg-card px-3 text-sm"
            >
              {Object.entries(periodLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              证据状态
            </span>
            <select
              value={evidence}
              onChange={(event) =>
                setEvidence(event.target.value as EvidenceFilter)
              }
              className="min-h-11 w-full border border-foreground/20 bg-card px-3 text-sm"
            >
              {Object.entries(evidenceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-3 md:col-span-2 xl:col-span-5">
            <Checkbox
              checked={conflictsOnly}
              onCheckedChange={(checked) => setConflictsOnly(checked === true)}
            />
            <span className="inline-flex items-center gap-2 text-sm">
              <Filter className="size-4 text-primary" aria-hidden="true" />
              只看存在冲突集或相互冲突主张的实体
            </span>
          </label>
        </section>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(21rem,0.5fr)]">
        <div>
          {elements.length > 0 ? (
            <GraphCanvas elements={elements} onSelectNode={selectNode} />
          ) : (
            <div className="flex min-h-[34rem] items-center justify-center border border-foreground/15 bg-card p-8 text-center">
              <div>
                <Network className="mx-auto size-8 text-primary" aria-hidden="true" />
                <h3 className="mt-4 font-serif text-lg font-semibold">没有匹配结果</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  请减少筛选条件，或换一个关键词。
                </p>
              </div>
            </div>
          )}
          <p className="mt-3 text-xs leading-6 text-muted-foreground">
            {layer === 'audit'
              ? `当前显示 ${filteredAudit.nodes.length} 个实体、${filteredAudit.edges.length} 条关系；完整投影为 ${auditData.nodes.length}/${auditData.edges.length}。`
              : `Legacy 当前加载 ${legacyData?.nodes.length ?? 0} 个线索节点、${legacyData?.edges.length ?? 0} 条旧关系。`}
            图上距离、方向和大小不表达亲密、权力或因果强弱。
          </p>
        </div>

        <aside
          className="border border-foreground/15 bg-card p-5"
          aria-live="polite"
          aria-label="图谱节点详情"
        >
          {selected?.layer === 'audit' ? (
            <>
              <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
                {entityTypeLabels[selected.node.entity_type]}
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold">
                {selected.node.canonical_label}
              </h3>
              {selected.node.variant_label &&
                selected.node.variant_label !== selected.node.canonical_label && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    文献异写：{selected.node.variant_label}
                  </p>
                )}
              <p className="mt-5 border-l-2 border-primary pl-4 text-sm leading-[1.7] text-muted-foreground">
                {selected.node.identity_status}
              </p>
              <dl className="mt-6 grid grid-cols-3 gap-2 text-center">
                <div className="border border-foreground/15 p-2">
                  <dt className="text-[10px] text-muted-foreground">主张</dt>
                  <dd className="mt-1 font-serif text-base">{selectedAuditClaims.length}</dd>
                </div>
                <div className="border border-foreground/15 p-2">
                  <dt className="text-[10px] text-muted-foreground">关系</dt>
                  <dd className="mt-1 font-serif text-base">{selectedAuditEdges.length}</dd>
                </div>
                <div className="border border-foreground/15 p-2">
                  <dt className="text-[10px] text-muted-foreground">来源</dt>
                  <dd className="mt-1 font-serif text-base">{selected.node.source_ids.length}</dd>
                </div>
              </dl>
              <div className="mt-6 space-y-2">
                {selectedAuditClaims.slice(0, 4).map((claim) => (
                  <div
                    key={claim.claim_id}
                    className="border-t border-foreground/15 pt-3"
                  >
                    <p className="text-[10px] font-semibold text-primary">
                      {claim.claim_id} · {claimStatusLabels[claim.status]}
                    </p>
                    <p className="mt-1 line-clamp-3 text-xs leading-6 text-muted-foreground">
                      {claim.quote_or_assertion}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href={`/wiki/${encodeURIComponent(selected.node.entity_id)}`}
                className="story-button story-button-primary mt-6 w-full justify-center"
              >
                打开完整 Wiki
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </>
          ) : selected?.layer === 'legacy' ? (
            <>
              <p className="text-xs font-bold tracking-[0.16em] text-candidate uppercase">
                Legacy clue
              </p>
              <h3 className="mt-2 font-serif text-xl font-semibold">
                {selected.node.label}
              </h3>
              <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                {selected.node.title || '旧图未提供简短标题。'}
              </p>
              <dl className="mt-6 space-y-3 border-y border-foreground/15 py-5 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">旧评级</dt>
                  <dd>{selected.node.legacy_reliability || '未标注'}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">迁移状态</dt>
                  <dd className="text-right">
                    {migrationStatusLabels[selected.node.migration.migration_status]}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 border-l-2 border-candidate pl-4 text-sm leading-[1.7] text-muted-foreground">
                {selected.node.migration.decision}
              </p>
              <Link
                href={`/legacy/${encodeURIComponent(selected.node.id)}`}
                className="story-button story-button-secondary mt-6 w-full justify-center"
              >
                查看迁移裁决
                <ExternalLink className="size-4" aria-hidden="true" />
              </Link>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">请选择一个节点。</p>
          )}
        </aside>
      </div>

      <details className="mt-4 border border-foreground/15 bg-card p-5">
        <summary className="cursor-pointer text-sm font-semibold">
          用文字列表浏览当前节点
        </summary>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(layer === 'audit'
            ? filteredAudit.nodes.slice(0, 120).map((node) => ({
                id: node.entity_id,
                label: node.canonical_label,
                href: `/wiki/${encodeURIComponent(node.entity_id)}`,
              }))
            : (legacyData?.nodes ?? []).slice(0, 120).map((node) => ({
                id: node.id,
                label: node.label,
                href: `/legacy/${encodeURIComponent(node.id)}`,
              }))
          ).map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="border border-foreground/10 px-3 py-2 text-sm hover:border-primary hover:text-primary"
            >
              <span className="mr-2 font-mono text-[10px] text-muted-foreground">
                {item.id}
              </span>
              {item.label}
            </Link>
          ))}
        </div>
        {(layer === 'audit' ? filteredAudit.nodes.length : legacyData?.nodes.length ?? 0) >
          120 && (
          <p className="mt-3 text-xs text-muted-foreground">
            为控制页面长度，文字列表先显示前120项；可用上方搜索缩小范围。
          </p>
        )}
      </details>
    </div>
  );
}

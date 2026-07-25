'use client';

import { useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, Maximize, User, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type NodeStatus = 'confirmed' | 'candidate' | 'disputed';
export type RelationStatus = 'confirmed' | 'candidate' | 'disputed';

export interface GraphNode {
  id: string;
  name: string;
  x: number;
  y: number;
  status: NodeStatus;
  isCore?: boolean;
  entityType?: string;
  sourceCount?: number;
  relationCount?: number;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  status: RelationStatus;
}

interface RelationGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width?: number;
  height?: number;
  className?: string;
  onNodeClick?: (node: GraphNode) => void;
  selectedNodeId?: string | null;
}

const statusColors: Record<NodeStatus, { fill: string; stroke: string; text: string }> = {
  confirmed: { fill: '#DCFCE7', stroke: '#15803D', text: '#14532D' },
  candidate: { fill: '#FEF3C7', stroke: '#B45309', text: '#78350F' },
  disputed: { fill: '#F3F4F6', stroke: '#6B7280', text: '#374151' },
};

const edgeColors: Record<RelationStatus, { stroke: string; dasharray?: string }> = {
  confirmed: { stroke: '#15803D' },
  candidate: { stroke: '#B45309', dasharray: '6 4' },
  disputed: { stroke: '#6B7280', dasharray: '2 4' },
};

const statusLabels: Record<NodeStatus, string> = {
  confirmed: '已核节点',
  candidate: '候选',
  disputed: '存疑',
};

export function RelationGraph({
  nodes,
  edges,
  width = 700,
  height = 480,
  className,
  onNodeClick,
  selectedNodeId,
}: RelationGraphProps) {
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);

  useEffect(() => {
    if (selectedNodeId !== undefined) setSelectedId(selectedNodeId);
  }, [selectedNodeId]);

  const getNodeById = (id: string) => nodes.find((n) => n.id === id);

  const handleZoomIn = () => setScale((s) => Math.min(s + 0.2, 2));
  const handleZoomOut = () => setScale((s) => Math.max(s - 0.2, 1));
  const handleReset = () => setScale(1);
  const selectNode = (node: GraphNode) => {
    setSelectedId(node.id);
    onNodeClick?.(node);
  };

  const viewBox = {
    x: -width / 2,
    y: -height / 2,
    w: width,
    h: height,
  };
  const canvasWidth = Math.max(Math.round(width * scale), width);
  const effectiveScale = canvasWidth / width;
  const canvasHeight = Math.round(height * effectiveScale);

  return (
    <div className={cn('bg-surface-container-lowest rounded-xl border border-border/40 overflow-hidden', className)}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 border-b border-border/30 bg-card">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs" aria-label="图谱图例">
          <span className="font-medium text-foreground">图例</span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3.5 h-3.5 rounded-full bg-[#DCFCE7] border-2 border-[#15803D]" />已核验
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <span className="w-3.5 h-3.5 rounded-full bg-[#FEF3C7] border-2 border-dashed border-[#B45309]" />候选
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <svg width="20" height="6" aria-hidden="true"><line x1="0" y1="3" x2="20" y2="3" stroke="#15803D" strokeWidth="2" /></svg>实线已核关系
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <svg width="20" height="6" aria-hidden="true"><line x1="0" y1="3" x2="20" y2="3" stroke="#B45309" strokeWidth="2" strokeDasharray="6 4" /></svg>虚线候选关系
          </span>
        </div>
        <div className="flex items-center self-end sm:self-auto gap-1 rounded-lg border border-border/40 p-1 shadow-card shrink-0">
          <button onClick={handleZoomOut} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="缩小图谱">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-muted-foreground px-1 min-w-[3rem] text-center" aria-live="polite">
            {Math.round(effectiveScale * 100)}%
          </span>
          <button onClick={handleZoomIn} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="放大图谱">
            <ZoomIn className="w-4 h-4" />
          </button>
          <button onClick={handleReset} className="p-2 rounded hover:bg-muted text-muted-foreground hover:text-foreground" aria-label="重置图谱缩放">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="overflow-auto max-h-[70vh] overscroll-contain"
        role="region"
        tabIndex={0}
        aria-label="可横向和纵向滚动的关系图谱画布"
      >
        <svg
          viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.w} ${viewBox.h}`}
          width={canvasWidth}
          height={canvasHeight}
          className="block max-w-none transition-[width,height] duration-200"
        >
        {/* Grid background */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#E5DED0" strokeWidth="0.5" opacity="0.5" />
          </pattern>
        </defs>
        <rect x={viewBox.x} y={viewBox.y} width={viewBox.w} height={viewBox.h} fill="url(#grid)" />

        {/* Edges */}
        <g>
          {edges.map((edge) => {
            const source = getNodeById(edge.source);
            const target = getNodeById(edge.target);
            if (!source || !target) return null;

            const edgeCfg = edgeColors[edge.status];
            const midX = (source.x + target.x) / 2;
            const midY = (source.y + target.y) / 2;
            const isHovered = hoveredEdge === edge.id;

            return (
              <g
                key={edge.id}
                onMouseEnter={() => setHoveredEdge(edge.id)}
                onMouseLeave={() => setHoveredEdge(null)}
              >
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke={edgeCfg.stroke}
                  strokeWidth={isHovered ? 2.5 : 1.5}
                  strokeDasharray={edgeCfg.dasharray}
                  style={{
                    opacity: selectedId && selectedId !== source.id && selectedId !== target.id ? 0.3 : 0.7,
                    transition: 'all 0.2s',
                  }}
                />
                {/* Relation label */}
                <g transform={`translate(${midX}, ${midY})`}>
                  <rect
                    x={-edge.label.length * 5 - 4}
                    y={-9}
                    width={edge.label.length * 10 + 8}
                    height={18}
                    rx={4}
                    fill="#FFFBF0"
                    stroke={edgeCfg.stroke}
                    strokeWidth="1"
                    opacity={isHovered ? 1 : 0.9}
                  />
                  <text
                    textAnchor="middle"
                    y={4}
                    fontSize="11"
                    fill={edgeCfg.stroke}
                    fontWeight="500"
                  >
                    {edge.label}
                    {edge.status !== 'confirmed' && '?'}
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {nodes.map((node) => {
            const cfg = statusColors[node.status];
            const isSelected = selectedId === node.id;
            const isFocused = focusedId === node.id;
            const radius = node.isCore ? 38 : 30;

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                role="button"
                tabIndex={0}
                aria-label={`${node.name}，${statusLabels[node.status]}，${onNodeClick ? '查看节点详情' : '突出显示节点'}`}
                aria-pressed={isSelected}
                aria-controls={onNodeClick ? 'graph-node-detail' : undefined}
                onClick={() => selectNode(node)}
                onFocus={() => setFocusedId(node.id)}
                onBlur={() => setFocusedId(null)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    selectNode(node);
                  }
                }}
                className="cursor-pointer"
              >
                <title>{`${node.name}，${statusLabels[node.status]}`}</title>
                {isFocused && (
                  <circle
                    r={radius + 10}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="4"
                  />
                )}
                {/* Outer ring for selected */}
                {isSelected && (
                  <circle
                    r={radius + 6}
                    fill="none"
                    stroke="#991B1B"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                )}
                {/* Node circle */}
                <circle
                  r={radius}
                  fill={cfg.fill}
                  stroke={cfg.stroke}
                  strokeWidth={node.status === 'confirmed' ? 2.5 : 2}
                  strokeDasharray={node.status !== 'confirmed' ? '4 3' : undefined}
                  className="transition-all duration-200 hover:opacity-80"
                />
                {/* Node icon */}
                {node.isCore ? (
                  <text textAnchor="middle" y={5} fontSize="14" fontWeight="600" fill={cfg.text}>
                    苏
                  </text>
                ) : (
                  <text textAnchor="middle" y={4} fontSize="12" fill={cfg.text}>
                    {node.name.charAt(0)}
                  </text>
                )}
                {/* Name label */}
                <text
                  textAnchor="middle"
                  y={radius + 16}
                  fontSize="12"
                  fontWeight="500"
                  fill="#1F2937"
                >
                  {node.name}
                </text>
                {/* Status badge */}
                <text
                  textAnchor="middle"
                  y={radius + 30}
                  fontSize="10"
                  fill="#6B7280"
                >
                  {statusLabels[node.status]}
                </text>
              </g>
            );
          })}
        </g>
        </svg>
      </div>

      <div className="px-4 py-2.5 border-t border-border/30 bg-muted/30 text-xs text-muted-foreground text-center">
        二维图在小屏上可横向滚动 · 关系判定以史料证据为准 · 点击节点或聚焦后按回车操作
      </div>
      <details className="border-t border-border/30 px-4 py-3 text-sm">
        <summary className="cursor-pointer font-medium text-foreground">
          图谱文字清单（{nodes.length}节点 / {edges.length}关系）
        </summary>
        <h3 className="mt-4 font-semibold text-foreground">节点列表</h3>
        <ul className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {nodes.map((node) => (
            <li key={`html-${node.id}`}>
              <button
                type="button"
                onClick={() => selectNode(node)}
                aria-pressed={selectedId === node.id}
                aria-controls={onNodeClick ? 'graph-node-detail' : undefined}
                className={cn(
                  'w-full min-h-11 rounded-md border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
                  selectedId === node.id
                    ? 'border-primary bg-primary/10'
                    : 'border-border/50 bg-card hover:bg-muted',
                )}
              >
                <span className="block font-medium text-foreground">{node.name}</span>
                <span className="block mt-0.5 text-xs text-muted-foreground">
                  {statusLabels[node.status]} · {node.entityType ?? '未分类'} · 来源载体 {node.sourceCount ?? 0}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <h3 className="mt-5 font-semibold text-foreground">关系列表</h3>
        <ul className="mt-2 space-y-2 text-muted-foreground">
          {edges.map((edge) => (
            <li key={`text-${edge.id}`}>
              {getNodeById(edge.source)?.name ?? edge.source} — {edge.label}
              {edge.status !== 'confirmed' ? '（候选）' : ''} → {getNodeById(edge.target)?.name ?? edge.target}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

// Person detail panel to pair with graph
export function GraphPersonPanel({ node }: { node: GraphNode | null }) {
  if (!node) {
    return (
      <div className="bg-card border border-border/40 rounded-xl p-6 text-center shadow-card h-full flex flex-col items-center justify-center min-h-[300px]">
        <HelpCircle className="w-10 h-10 text-muted-foreground/40 mb-3" />
        <p className="text-muted-foreground text-sm">点击图谱中的节点查看人物详情</p>
      </div>
    );
  }

  const cfg = statusColors[node.status];

  return (
    <div className="bg-card border border-border/40 rounded-xl shadow-card overflow-hidden h-full">
      <div className="p-5 border-b border-border/30">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold shrink-0"
            style={{ backgroundColor: cfg.fill, color: cfg.text, border: `2px ${node.status === 'confirmed' ? 'solid' : 'dashed'} ${cfg.stroke}` }}
          >
            {node.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-serif font-semibold text-lg text-foreground">{node.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 mt-0.5"
              style={{ backgroundColor: cfg.fill + '80', color: cfg.stroke }}
            >
              <User className="w-3 h-3" />
              {statusLabels[node.status]}
            </span>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-4">
        {node.entityType && (
          <div>
            <p className="text-xs text-muted-foreground mb-1">节点类型</p>
            <p className="text-sm text-foreground">{node.entityType}</p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-lg font-semibold text-foreground">{node.relationCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">关联关系</p>
          </div>
          <div className="bg-muted/50 rounded-lg p-2.5">
            <p className="text-lg font-semibold text-foreground">{node.sourceCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">史料来源</p>
          </div>
        </div>
        <a href="/persons" className="block text-center text-primary text-sm font-medium hover:underline py-2">
          查看完整资料 →
        </a>
      </div>
    </div>
  );
}

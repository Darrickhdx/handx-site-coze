'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';
import {
  type AuditNode,
  type EntityType,
  entityTypeLabels,
} from '@/lib/graph-wiki-data';

export function WikiIndex({ nodes }: { nodes: AuditNode[] }) {
  const [query, setQuery] = useState('');
  const [entityType, setEntityType] = useState<'all' | EntityType>('all');

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    return nodes.filter((node) => {
      if (entityType !== 'all' && node.entity_type !== entityType) return false;
      if (!normalized) return true;
      return [
        node.entity_id,
        node.canonical_label,
        node.variant_label,
        node.identity_status,
      ]
        .join(' ')
        .toLocaleLowerCase('zh-CN')
        .includes(normalized);
    });
  }, [entityType, nodes, query]);

  return (
    <div>
      <div className="grid gap-3 border border-foreground/15 bg-card p-4 md:grid-cols-[1fr_16rem]">
        <label>
          <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
            <Search className="size-3.5" aria-hidden="true" />
            搜索 Wiki
          </span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="人名、事件、机构、实体编号或文献异写"
            className="min-h-11 w-full border border-foreground/20 bg-background px-3 text-sm outline-none focus:border-primary"
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
            className="min-h-11 w-full border border-foreground/20 bg-background px-3 text-sm"
          >
            <option value="all">全部类型</option>
            {Object.entries(entityTypeLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-4 text-xs text-muted-foreground" aria-live="polite">
        找到 {filtered.length} 个实体
      </p>

      <div className="mt-4 grid gap-px border border-foreground/15 bg-foreground/15 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((node) => (
          <Link
            key={node.entity_id}
            href={`/wiki/${encodeURIComponent(node.entity_id)}`}
            className="group min-h-44 bg-background p-5 transition-colors hover:bg-card"
          >
            <div className="flex items-start justify-between gap-4">
              <span className="font-mono text-[10px] font-semibold tracking-[0.08em] text-primary">
                {node.entity_id}
              </span>
              <span className="border border-foreground/15 px-2 py-1 text-[10px] text-muted-foreground">
                {entityTypeLabels[node.entity_type]}
              </span>
            </div>
            <h2 className="mt-5 font-serif text-xl font-semibold">
              {node.canonical_label}
            </h2>
            {node.variant_label &&
              node.variant_label !== node.canonical_label && (
                <p className="mt-1 text-xs text-muted-foreground">
                  异写：{node.variant_label}
                </p>
              )}
            <p className="mt-4 line-clamp-2 text-xs leading-6 text-muted-foreground">
              {node.identity_status}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary">
              查看主张与来源
              <ArrowRight
                className="size-3.5 transition-transform group-hover:translate-x-1"
                aria-hidden="true"
              />
            </span>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-4 border border-foreground/15 bg-card p-10 text-center">
          <p className="font-serif text-base font-semibold">没有匹配的 Wiki 实体</p>
          <p className="mt-2 text-sm text-muted-foreground">
            尝试移除筛选条件，或使用实体编号搜索。
          </p>
        </div>
      )}
    </div>
  );
}

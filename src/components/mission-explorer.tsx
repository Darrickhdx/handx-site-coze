'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ListFilter,
  MapPin,
  Search,
} from 'lucide-react';
import { archiveMissions } from '@/lib/archive-missions';

type Mission = (typeof archiveMissions)[number];

function priorityLabel(value: string): string {
  const normalized = value.toLowerCase();
  if (normalized === 'p0' || normalized.includes('first') || normalized.includes('immediate')) {
    return '最先查';
  }
  if (normalized === 'p1' || normalized.includes('follow') || normalized.includes('next')) {
    return '等回复再查';
  }
  if (normalized === 'p2' || normalized.includes('condition')) {
    return '条件成熟后再去';
  }
  return '其他任务';
}

function searchableText(mission: Mission): string {
  return [
    mission.missionId,
    mission.institution,
    mission.institutionType,
    mission.modeLabel,
    mission.topic,
    mission.researchQuestion,
    mission.catalogReference,
    ...mission.people,
  ].join(' ').toLocaleLowerCase('zh-CN');
}

export function MissionExplorer() {
  const [priority, setPriority] = useState('all');
  const [placeOrType, setPlaceOrType] = useState('all');
  const [query, setQuery] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(12);

  const priorities = useMemo(
    () => Array.from(new Set(archiveMissions.map((mission) => mission.executionPriority))),
    [],
  );
  const placeOptions = useMemo(() => {
    const modes = Array.from(new Set(archiveMissions.map((mission) => mission.modeLabel)))
      .map((value) => ({ key: `mode:${value}`, label: value }));
    const types = Array.from(new Set(archiveMissions.map((mission) => mission.institutionType)))
      .map((value) => ({ key: `type:${value}`, label: value }));
    return [...modes, ...types];
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
    return archiveMissions.filter((mission) => {
      if (priority !== 'all' && mission.executionPriority !== priority) return false;
      if (placeOrType.startsWith('mode:') && mission.modeLabel !== placeOrType.slice(5)) return false;
      if (placeOrType.startsWith('type:') && mission.institutionType !== placeOrType.slice(5)) return false;
      if (normalizedQuery && !searchableText(mission).includes(normalizedQuery)) return false;
      return true;
    });
  }, [placeOrType, priority, query]);

  const visible = filtered.slice(0, visibleLimit);

  function resetLimit() {
    setVisibleLimit(12);
  }

  return (
    <div className="min-w-0">
      <div className="border border-foreground/15 bg-card p-5 sm:p-7">
        <div className="flex items-center gap-3">
          <ListFilter className="size-5 text-primary" aria-hidden="true" />
          <h3 className="font-serif text-xl font-semibold">筛选查档任务</h3>
        </div>
        <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[0.75fr_1fr_1.25fr]">
          <label className="grid min-w-0 gap-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            行动顺序
            <select
              value={priority}
              onChange={(event) => {
                setPriority(event.target.value);
                resetLimit();
              }}
              className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm font-normal tracking-normal text-foreground outline-none focus:border-primary"
            >
              <option value="all">全部行动顺序</option>
              {priorities.map((value) => (
                <option key={value} value={value}>{priorityLabel(value)}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            地点或机构类型
            <select
              value={placeOrType}
              onChange={(event) => {
                setPlaceOrType(event.target.value);
                resetLimit();
              }}
              className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background px-3 text-sm font-normal tracking-normal text-foreground outline-none focus:border-primary"
            >
              <option value="all">全部地点与机构</option>
              {placeOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="grid min-w-0 gap-2 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            人物、问题或目录号
            <span className="relative block min-w-0">
              <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetLimit();
                }}
                placeholder="例如：李英夫、平地泉、PID"
                maxLength={100}
                className="min-h-11 w-full min-w-0 border border-foreground/20 bg-background py-2 pl-10 pr-3 text-sm font-normal tracking-normal text-foreground outline-none placeholder:text-muted-foreground/55 focus:border-primary"
              />
            </span>
          </label>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p role="status">找到 {filtered.length} 项任务，当前显示 {visible.length} 项。</p>
        {(priority !== 'all' || placeOrType !== 'all' || query) && (
          <button
            type="button"
            onClick={() => {
              setPriority('all');
              setPlaceOrType('all');
              setQuery('');
              resetLimit();
            }}
            className="inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline"
          >
            清除筛选
          </button>
        )}
      </div>

      {visible.length > 0 ? (
        <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
          {visible.map((mission) => (
            <article key={mission.missionId} className="flex min-w-0 flex-col border border-foreground/15 bg-card p-5 sm:p-6">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
                <span className="border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
                  {priorityLabel(mission.executionPriority)}
                </span>
                <span className="text-xs text-muted-foreground">{mission.missionId}</span>
              </div>

              <h3 className="mt-5 break-words font-serif text-2xl font-semibold leading-snug tracking-[-0.025em]">
                {mission.researchQuestion}
              </h3>

              <div className="mt-5 grid min-w-0 gap-3 text-sm leading-6 text-muted-foreground">
                <p className="flex min-w-0 items-start gap-2">
                  <MapPin className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 break-words">{mission.modeLabel}</span>
                </p>
                <p className="flex min-w-0 items-start gap-2">
                  <Building2 className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 break-words">{mission.institution}</span>
                </p>
              </div>

              <div className="mt-5 border-l-2 border-accent bg-[#eee8dc] p-4">
                <p className="text-xs font-semibold tracking-[0.1em] text-accent uppercase">当前真实状态</p>
                <p className="mt-2 text-sm font-semibold leading-6">{mission.status.publicLabel}</p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">下一步：{mission.publicNextStep}</p>
              </div>

              <p className="mt-5 min-w-0 break-words text-xs leading-6 text-muted-foreground">
                公开目录号：<span className="break-all text-foreground">{mission.catalogReference}</span>
              </p>

              <Link
                href={`/missions/${encodeURIComponent(mission.missionId)}`}
                className="story-text-link mt-auto min-h-11 pt-6"
              >
                查看任务与公开线索工具
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-5 border border-foreground/15 bg-card p-8 text-center">
          <p className="font-serif text-2xl font-semibold">没有符合当前条件的任务</p>
          <p className="mt-3 text-sm leading-[1.8] text-muted-foreground">试试清除筛选，或只输入一个人物姓名。</p>
        </div>
      )}

      {visible.length < filtered.length && (
        <div className="mt-7 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleLimit((current) => current + 12)}
            className="story-button story-button-secondary"
          >
            再显示 {Math.min(12, filtered.length - visible.length)} 项
          </button>
        </div>
      )}
    </div>
  );
}

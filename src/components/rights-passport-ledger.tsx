'use client';

import { useMemo, useState } from 'react';
import {
  Ban,
  CheckCircle2,
  ChevronDown,
  FileKey2,
  Filter,
  Fingerprint,
  Link2,
  LockKeyhole,
  Search,
  ShieldAlert,
} from 'lucide-react';
import type {
  RightsControlState,
  RightsPassportCategory,
  RightsPassportRecord,
  RightsPassportRegistry,
} from '@/lib/rights-passports';

const categoryLabels: Record<RightsPassportCategory, string> = {
  site_asset: '网站资产',
  novel_page: '小说页图',
  article: '原创文章',
  topic_paragraph: '专题段落',
  source_reference: '来源登记',
};

const controlLabels: Record<RightsControlState, string> = {
  owned: '本站控制的原创内容',
  licensed: '仅在限定范围获授权',
  permission_pending: '权利待核',
};

const controlStyles: Record<RightsControlState, string> = {
  owned: 'border-[#6f897d]/35 bg-[#6f897d]/10 text-[#526a60]',
  licensed: 'border-[#9a7a38]/35 bg-[#9a7a38]/10 text-[#765c25]',
  permission_pending: 'border-[#a46760]/35 bg-[#a46760]/10 text-[#8c514b]',
};

const categoryOrder: RightsPassportCategory[] = [
  'site_asset',
  'novel_page',
  'article',
  'topic_paragraph',
  'source_reference',
];

const pageSize = 24;

function shortenedHash(value: string): string {
  return `${value.slice(0, 12)}…${value.slice(-8)}`;
}

function isExternalReference(reference: string): boolean {
  return /^https:\/\//.test(reference);
}

export function RightsPassportLedger({ registry }: { registry: RightsPassportRegistry }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | RightsPassportCategory>('all');
  const [controlState, setControlState] = useState<'all' | RightsControlState>('all');
  const [mediaGate, setMediaGate] = useState<'all' | 'review_only' | 'not_for_media'>('all');
  const [visibleCount, setVisibleCount] = useState(pageSize);

  const records = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
    return registry.records.filter((record) => {
      if (category !== 'all' && record.category !== category) return false;
      if (controlState !== 'all' && record.control_state !== controlState) return false;
      if (mediaGate !== 'all' && record.media_gate !== mediaGate) return false;
      if (!normalizedQuery) return true;
      return [
        record.passport_id,
        record.title,
        record.canonical_reference,
        record.provenance.source_key,
        ...record.provenance.source_ids,
      ].some((value) => value.toLocaleLowerCase('zh-CN').includes(normalizedQuery));
    });
  }, [category, controlState, mediaGate, query, registry.records]);

  const shownRecords = records.slice(0, visibleCount);

  const resetVisibleCount = () => setVisibleCount(pageSize);

  return (
    <div className="bg-[#f4f0e8]">
      <section className="border-b border-foreground/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell">
          <div className="inline-flex items-center gap-2 border border-[#d5a09a]/40 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#d5a09a] uppercase">
            <LockKeyhole className="size-3.5" aria-hidden="true" />
            站主本机台账 · 全部阻断公开发布
          </div>
          <p className="personal-kicker personal-kicker-light mt-10">
            <span aria-hidden="true" />
            Rights passport ledger
          </p>
          <h1 className="mt-7 max-w-5xl font-serif text-5xl font-semibold leading-[1.04] tracking-[-0.05em] sm:text-7xl">
            先回答“有没有权利”，
            <span className="block text-[#d5a09a]">再回答“能不能传播”。</span>
          </h1>
          <p className="mt-8 max-w-3xl text-[15px] leading-[1.7] text-[#c9c3b8]">
            这份台账把网站资产、小说页图、原创文章、专题段落与来源登记逐项拆开。
            “我拥有表达权”“只获本地使用授权”“来源可以外链”是三件不同的事；任何未知状态都按权利待核并阻断。
          </p>
          <div className="mt-10 grid gap-px overflow-hidden border border-white/15 bg-white/15 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['护照总数', registry._meta.counts.records],
              ['权利待核', registry._meta.counts.by_control_state.permission_pending],
              ['禁止媒体复用', registry._meta.counts.by_media_gate.not_for_media],
              ['可以公开', registry._meta.counts.public_ready],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#202827] p-5">
                <strong className="block font-serif text-4xl text-[#f3efe7]">{value}</strong>
                <span className="mt-2 block text-xs tracking-[0.08em] text-[#a9a69f] uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-7 sm:py-10">
        <div className="personal-shell">
          <div className="grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {[
              {
                icon: Fingerprint,
                title: '权利依据',
                body: 'owned、licensed 与 permission_pending 分开登记。有限授权绝不被扩大成公开或商业授权。',
              },
              {
                icon: FileKey2,
                title: '使用范围',
                body: 'local_only 与具体 reuse scope 单独记录。能在本机浏览，不代表能复制、上传、改编或训练。',
              },
              {
                icon: Ban,
                title: '传播门禁',
                body: 'not_for_media 会阻止进入媒体包；所有条目目前都是 no-license-granted、public_ready=false。',
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="bg-[#f4f0e8] p-7 sm:p-9">
                  <Icon className="size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
                  <h2 className="mt-6 font-serif text-3xl font-semibold">{item.title}</h2>
                  <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{item.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-7 sm:py-10">
        <div className="personal-shell">
          <div className="flex flex-col gap-6 border-b border-foreground/15 pb-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="personal-kicker">
                <span aria-hidden="true" />
                Item-by-item registry
              </p>
              <h2 className="personal-heading mt-5">逐项看清：谁控制、能做什么、为什么仍被阻断。</h2>
            </div>
            <p className="max-w-md text-sm leading-[1.7] text-muted-foreground">
              当前显示 {Math.min(shownRecords.length, records.length)} / {records.length} 项；
              内容哈希用于确认登记对象是否变化，不是版权证明或授权凭证。
            </p>
          </div>

          <div className="mt-8 grid gap-4 border border-foreground/15 bg-white/35 p-5 lg:grid-cols-[minmax(15rem,1fr)_repeat(3,minmax(10rem,0.42fr))]">
            <label className="relative">
              <span className="sr-only">搜索权利护照</span>
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  resetVisibleCount();
                }}
                type="search"
                placeholder="搜索名称、护照号或来源号"
                className="h-12 w-full border border-foreground/20 bg-[#f4f0e8] pr-4 pl-11 text-sm outline-none focus:border-primary"
              />
            </label>
            <label className="relative">
              <span className="sr-only">按内容类型筛选</span>
              <select
                value={category}
                onChange={(event) => {
                  setCategory(event.target.value as typeof category);
                  resetVisibleCount();
                }}
                className="h-12 w-full appearance-none border border-foreground/20 bg-[#f4f0e8] px-4 pr-10 text-sm outline-none focus:border-primary"
              >
                <option value="all">全部内容类型</option>
                {categoryOrder.map((value) => (
                  <option key={value} value={value}>{categoryLabels[value]}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </label>
            <label className="relative">
              <span className="sr-only">按权利依据筛选</span>
              <select
                value={controlState}
                onChange={(event) => {
                  setControlState(event.target.value as typeof controlState);
                  resetVisibleCount();
                }}
                className="h-12 w-full appearance-none border border-foreground/20 bg-[#f4f0e8] px-4 pr-10 text-sm outline-none focus:border-primary"
              >
                <option value="all">全部权利依据</option>
                {(Object.keys(controlLabels) as RightsControlState[]).map((value) => (
                  <option key={value} value={value}>{controlLabels[value]}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </label>
            <label className="relative">
              <span className="sr-only">按媒体门禁筛选</span>
              <select
                value={mediaGate}
                onChange={(event) => {
                  setMediaGate(event.target.value as typeof mediaGate);
                  resetVisibleCount();
                }}
                className="h-12 w-full appearance-none border border-foreground/20 bg-[#f4f0e8] px-4 pr-10 text-sm outline-none focus:border-primary"
              >
                <option value="all">全部媒体门禁</option>
                <option value="not_for_media">不得进入媒体包</option>
                <option value="review_only">仅供内部审稿</option>
              </select>
              <Filter className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            </label>
          </div>

          {shownRecords.length === 0 ? (
            <div className="mt-8 border border-dashed border-foreground/25 p-10 text-center text-sm text-muted-foreground">
              没有符合当前条件的权利护照。
            </div>
          ) : (
            <div className="mt-8 grid gap-4 xl:grid-cols-2">
              {shownRecords.map((record) => (
                <PassportCard key={record.passport_id} record={record} />
              ))}
            </div>
          )}

          {records.length > shownRecords.length && (
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + pageSize)}
              className="story-button story-button-secondary mx-auto mt-8"
            >
              再显示 {Math.min(pageSize, records.length - shownRecords.length)} 项
              <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-[#ece4d8] py-8">
        <div className="personal-shell flex items-start gap-4">
          <ShieldAlert className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="max-w-4xl text-sm leading-[1.7] text-muted-foreground">
            默认规则：缺少权利依据的内容不会被归入 owned 或 licensed，而是进入 permission_pending；
            即使权利依据明确，也必须另行通过事实、隐私、肖像与发布环境审核。台账不会自动把任何条目改成 public_ready。
          </p>
        </div>
      </section>
    </div>
  );
}
function PassportCard({ record }: { record: RightsPassportRecord }) {
  return (
    <article className="border border-foreground/15 bg-white/38 p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`border px-2.5 py-1 text-[10px] font-semibold tracking-[0.08em] ${controlStyles[record.control_state]}`}>
          {controlLabels[record.control_state]}
        </span>
        {record.local_only && (
          <span className="border border-foreground/15 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">local_only</span>
        )}
        {record.media_gate === 'not_for_media' && (
          <span className="border border-[#a46760]/30 px-2.5 py-1 text-[10px] font-semibold text-[#8c514b]">not_for_media</span>
        )}
        <span className="border border-foreground/15 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">no-license-granted</span>
      </div>

      <p className="mt-5 font-mono text-[10px] tracking-[0.08em] text-primary">{record.passport_id}</p>
      <h3 className="mt-2 font-serif text-2xl font-semibold leading-snug">{record.title}</h3>
      <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{record.block_reason}</p>

      <dl className="mt-6 grid gap-4 border-t border-foreground/15 pt-5 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">复用范围</dt>
          <dd className="mt-1 break-words font-medium">{record.reuse_scope}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">内容哈希</dt>
          <dd className="mt-1 font-mono text-[11px]" title={record.content_sha256}>{shortenedHash(record.content_sha256)}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">登记来源</dt>
          <dd className="mt-1 break-words font-medium">{record.provenance.dataset}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-semibold tracking-[0.1em] text-muted-foreground uppercase">来源定位</dt>
          <dd className="mt-1 break-words font-medium">{record.provenance.source_key}</dd>
        </div>
      </dl>

      <details className="mt-5 border-t border-foreground/15 pt-4">
        <summary className="cursor-pointer text-xs font-semibold text-foreground">查看权利依据与边界</summary>
        <div className="mt-4 space-y-3 text-xs leading-6 text-muted-foreground">
          <p>{record.control_evidence}</p>
          <p>{record.provenance.note}</p>
          {record.provenance.source_ids.length > 0 && (
            <p>关联来源：{record.provenance.source_ids.join('、')}</p>
          )}
          <p className="flex items-center gap-2 text-foreground">
            <CheckCircle2 className="size-3.5 text-primary" aria-hidden="true" />
            public_ready=false · must_not_deploy=true
          </p>
        </div>
      </details>

      {isExternalReference(record.canonical_reference) ? (
        <a
          href={record.canonical_reference}
          target="_blank"
          rel="noreferrer"
          className="story-text-link mt-5 text-xs"
        >
          仅打开外部来源页
          <Link2 className="size-3.5" aria-hidden="true" />
        </a>
      ) : (
        <p className="mt-5 break-all text-[11px] text-muted-foreground">登记对象：{record.canonical_reference}</p>
      )}
    </article>
  );
}

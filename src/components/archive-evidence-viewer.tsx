'use client';

import Image from 'next/image';
import { useState } from 'react';
import {
  ExternalLink,
  FileSearch,
  LocateFixed,
  Minus,
  Plus,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type ViewerTab = 'locator' | 'claims' | 'original';

interface ViewerClaim {
  id: string;
  status: string;
  assertion: string;
  locator: string;
}

interface ViewerPreview {
  path: string;
  alt: string;
  rightsScope: 'local_internal_preview_only';
  publishable: false;
  note: string;
}

interface ArchiveEvidenceViewerProps {
  sourceId: string;
  title: string;
  locator: string;
  publicUrl: string;
  publicUrlStatus: string;
  claims: readonly ViewerClaim[];
  preview?: ViewerPreview;
}

const tabs: readonly { id: ViewerTab; label: string }[] = [
  { id: 'locator', label: '读这一页' },
  { id: 'claims', label: '这一页直接说了什么' },
  { id: 'original', label: '回到原馆' },
];

export function ArchiveEvidenceViewer({
  sourceId,
  title,
  locator,
  publicUrl,
  publicUrlStatus,
  claims,
  preview,
}: ArchiveEvidenceViewerProps) {
  const [activeTab, setActiveTab] = useState<ViewerTab>('locator');
  const [zoom, setZoom] = useState(1);

  return (
    <section
      id="viewer"
      className="scroll-mt-28 overflow-hidden border border-foreground/15 bg-[#202827] text-[#f3efe7]"
      data-source-viewer={sourceId}
    >
      <div className="flex flex-col gap-5 border-b border-white/15 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div>
          <p className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#c38a82] uppercase">
            原文伴读 · {sourceId}
          </p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">在这份原件里，读这一刻</h2>
        </div>
        <div className="flex gap-1" role="tablist" aria-label={`${title}查看方式`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'border px-4 py-2 text-xs font-semibold transition-colors',
                activeTab === tab.id
                  ? 'border-[#c38a82] bg-[#c38a82] text-[#202827]'
                  : 'border-white/20 text-[#d7cfc2] hover:border-white/50 hover:text-white',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-[16rem]">
        {activeTab === 'locator' && (
          <div className="grid min-h-[16rem] lg:grid-cols-[minmax(0,1.35fr)_minmax(19rem,0.65fr)]">
            <div className="overflow-auto border-b border-white/15 bg-[#161c1b] p-4 lg:border-b-0 lg:border-r">
              {preview ? (
                <div className="min-w-[36rem]">
                  <div className="mb-3 flex items-center justify-between gap-4 text-[11px] text-[#bdb9b0]">
                    <span>放大这一页，慢一点读</span>
                    <span className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="缩小原件局部"
                        onClick={() => setZoom((value) => Math.max(1, value - 0.25))}
                        className="border border-white/20 p-1.5 hover:border-white/50"
                      >
                        <Minus className="size-3.5" aria-hidden="true" />
                      </button>
                      <span className="w-12 text-center font-mono">{Math.round(zoom * 100)}%</span>
                      <button
                        type="button"
                        aria-label="放大原件局部"
                        onClick={() => setZoom((value) => Math.min(2, value + 0.25))}
                        className="border border-white/20 p-1.5 hover:border-white/50"
                      >
                        <Plus className="size-3.5" aria-hidden="true" />
                      </button>
                    </span>
                  </div>
                  <div style={{ width: `${zoom * 100}%` }}>
                    <Image
                      src={preview.path}
                      alt={preview.alt}
                      width={1835}
                      height={1035}
                      sizes="(min-width: 1024px) 64vw, 100vw"
                      className="h-auto w-full grayscale"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[15rem] flex-col items-center justify-center border border-dashed border-white/20 p-8 text-center">
                  <FileSearch className="size-10 text-[#c38a82]" strokeWidth={1.2} aria-hidden="true" />
                  <p className="mt-6 font-serif text-2xl">这份材料请回到原馆阅读</p>
                  <p className="mt-4 max-w-lg text-sm leading-[1.7] text-[#bdb9b0]">
                    这里保留了能带你找回它的起点，但没有展示许可覆盖的扫描图。请用下面的线索回到保存它的地方。
                  </p>
                </div>
              )}
            </div>
            <aside className="p-6 sm:p-8">
              <LocateFixed className="size-6 text-[#c38a82]" aria-hidden="true" />
              <p className="mt-5 text-[10px] font-semibold tracking-[0.15em] text-[#c38a82] uppercase">从这里找到原文</p>
              <p className="mt-4 text-sm leading-[1.7] text-[#d7cfc2]">{locator}</p>
              <div className="mt-7 border-t border-white/15 pt-5 text-xs leading-6 text-[#bdb9b0]">
                {preview ? preview.note : '本站保留的是阅读线索，不用空白占位冒充一份看不见的原件。'}
              </div>
            </aside>
          </div>
        )}

        {activeTab === 'claims' && (
          <div className="grid gap-px bg-white/15 sm:grid-cols-2">
            {claims.length > 0 ? (
              claims.map((claim) => (
                <article key={claim.id} className="bg-[#202827] p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-mono text-xs text-[#c38a82]">{claim.id}</span>
                    <span className="text-[10px] text-[#bdb9b0]">{claim.status}</span>
                  </div>
                  <p className="mt-5 text-sm leading-[1.7] text-[#f3efe7]">{claim.assertion}</p>
                  <p className="mt-5 border-l-2 border-[#c38a82]/60 pl-4 text-xs leading-6 text-[#bdb9b0]">
                    {claim.locator}
                  </p>
                </article>
              ))
            ) : (
              <p className="bg-[#202827] p-8 text-sm text-[#bdb9b0]">
                这份材料还没有被写成本站的阅读说明。你仍可以从“回到原馆”继续查看。
              </p>
            )}
          </div>
        )}

        {activeTab === 'original' && (
          <div className="grid min-h-[16rem] place-items-center p-8 text-center">
            <div className="max-w-2xl">
              <ShieldAlert className="mx-auto size-9 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
              <h3 className="mt-6 font-serif text-3xl font-semibold">
                {publicUrl ? '回到保存它的地方，继续读下去' : '这份材料还没有可安全公开的原馆入口'}
              </h3>
              <p className="mt-5 text-sm leading-[1.7] text-[#bdb9b0]">
                本站展示的只是理解这段故事所需的局部与线索；完整上下文、阅读权限和使用规则，都以保存机构为准。
              </p>
              {publicUrl && (
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex items-center gap-2 border border-[#c38a82] bg-[#c38a82] px-5 py-3 text-sm font-semibold text-[#202827]"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  {publicUrlStatus === 'official_or_institutional' ? '去机构原件／资料页继续读' : '去登记的公开资料页继续读'}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

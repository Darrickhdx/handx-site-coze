import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Check, CirclePause, FileClock, ShieldAlert } from 'lucide-react';
import {
  candidateNovelEdition,
  novelEditionGateLabels,
  novelEditionRegistry,
} from '@/lib/novel-editions';

export const metadata: Metadata = {
  title: '小说版本迁移台｜Handx Studio',
  description: '本地查看《英雄无名》V1.3候选版的冻结、审权、页码映射和版本隔离门禁。',
};

export default function NovelMigrationStudioPage() {
  const checks = Object.entries(candidateNovelEdition.gate_checks ?? {});

  return (
    <main className="min-h-screen bg-[#f4f0e8]">
      <header className="border-b border-white/15 bg-[#202827] text-[#f3efe7]">
        <div className="personal-shell py-7 sm:py-10">
          <Link href="/studio" className="inline-flex items-center gap-2 text-sm text-[#bdb9b0] hover:text-white">
            <ArrowLeft className="size-4" aria-hidden="true" />
            返回站主管理台
          </Link>
          <p className="mt-9 text-[10px] font-semibold tracking-[0.16em] text-[#c38a82] uppercase">Owner only · migration gate</p>
          <h1 className="mt-4 font-serif text-2xl font-semibold tracking-[-0.05em] sm:text-3xl">小说版本迁移</h1>
          <p className="mt-6 max-w-3xl text-sm leading-[1.7] text-[#bdb9b0]">
            当前读者仍在 V{novelEditionRegistry.current_reader.version}。V1.3 的源文件只被读取、计算哈希与结构，不生成候选页图，也不向浏览器暴露本地路径或原始正文。
          </p>
        </div>
      </header>

      <section className="personal-shell py-8 sm:py-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['候选页数', String(candidateNovelEdition.pages)],
            ['编号章节', String(candidateNovelEdition.numbered_chapters)],
            ['图版护照', `${candidateNovelEdition.rights_ledger_records}/${candidateNovelEdition.figure_plates}`],
            ['阻断门禁', String(candidateNovelEdition.blocked_gates?.length ?? 0)],
          ].map(([label, value]) => (
            <div key={label} className="border border-foreground/15 bg-card p-5">
              <p className="text-xs text-muted-foreground">{label}</p>
              <strong className="mt-3 block font-serif text-xl">{value}</strong>
            </div>
          ))}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(22rem,0.75fr)]">
          <section className="border border-foreground/15 bg-background p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <FileClock className="size-5 text-primary" aria-hidden="true" />
              <h2 className="font-serif text-2xl font-semibold">逐项门禁</h2>
            </div>
            <ol className="mt-7 divide-y divide-foreground/15 border-y border-foreground/15">
              {checks.map(([key, value]) => (
                <li key={key} className="flex items-start gap-3 py-4">
                  {value ? (
                    <Check className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  ) : (
                    <CirclePause className="mt-0.5 size-5 shrink-0 text-amber-800" aria-hidden="true" />
                  )}
                  <div>
                    <p className="text-sm font-semibold">{novelEditionGateLabels[key] ?? key}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{value ? 'PASS' : 'BLOCKED'}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <aside className="border border-amber-800/20 bg-amber-50 p-6 sm:p-8">
            <ShieldAlert className="size-6 text-amber-900" aria-hidden="true" />
            <h2 className="mt-5 font-serif text-2xl font-semibold text-amber-950">停止条件</h2>
            <p className="mt-5 text-sm leading-[1.7] text-amber-950/75">
              只要任一关键门禁未通过，`candidate_static_pages_generated` 必须保持 false；V1.3 原始 PDF、DOCX、Markdown 和整套页图都不得进入静态目录、Git 或媒体包。
            </p>
            <p className="mt-5 font-mono text-[11px] leading-5 text-amber-950/70">
              must_not_deploy=true<br />
              deployment_authorized=false<br />
              strategy=parallel_import_then_atomic_switch
            </p>
            <Link href="/novel/editions" className="story-text-link mt-7">查看读者版说明</Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

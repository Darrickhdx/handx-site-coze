import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CircleDotDashed, LockKeyhole, SearchCheck } from 'lucide-react';
import { FamilyHistoryDiagnostic } from '@/components/family-history-diagnostic';
import {
  diagnosticDemoTraces,
  familyHistoryDiagnosticContract,
} from '@/content/family-history-diagnostic';

export const metadata: Metadata = {
  title: 'AI 家族史起步诊断｜鉴真小秃驴',
  description: '不上传原件、不保存答案，用五个选择题判断家族史研究应该从资料盘点、身份分流、调档、叙事还是隐私边界开始。',
};

export default function FamilyHistoryDiagnosisPage() {
  return (
    <div className="bg-[#f4f0e8]">
      <section className="border-b border-foreground/15 py-16 sm:py-24">
        <div className="personal-shell grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(20rem,0.65fr)] lg:items-end lg:gap-20">
          <div>
            <p className="personal-kicker"><span aria-hidden="true" />AI family history lab</p>
            <h1 className="personal-display mt-7 max-w-5xl text-[clamp(3.2rem,6vw,6rem)] font-semibold leading-[0.96] tracking-[-0.06em]">
              先别上传原件。
              <span className="mt-2 block text-accent">先判断，你家应该从哪一步开始。</span>
            </h1>
            <p className="mt-7 max-w-3xl font-serif text-xl leading-relaxed sm:text-2xl">
              给手里有口述、照片、旧信、扫描件或馆藏线索，却不知道怎样开始的人。
            </p>
          </div>
          <aside className="border-l-2 border-primary pl-6">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">当前状态</p>
            <p className="mt-3 text-base font-semibold">当前仅开放小范围需求访谈</p>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              正式收费服务尚未开放；没有上传、订单、支付、自动事实生成或外部模型处理。
            </p>
          </aside>
        </div>
      </section>

      <section id="start" className="scroll-mt-28 py-14 sm:py-20">
        <div className="personal-shell">
          <FamilyHistoryDiagnostic />
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-24">
        <div className="personal-shell">
          <div className="grid gap-10 lg:grid-cols-[0.68fr_1.32fr] lg:gap-20">
            <div>
              <SearchCheck className="size-8 text-[#c38a82]" strokeWidth={1.4} aria-hidden="true" />
              <h2 className="mt-7 font-serif text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
                诊断不是问卷营销，方法可以当场核对。
              </h2>
              <p className="mt-6 text-sm leading-7 text-[#bdb9b0]">
                苏开元项目中的两个真实例子，分别演示“同一作品去重”和“身份候选不自动合并”。
              </p>
            </div>
            <div className="space-y-5">
              {diagnosticDemoTraces.map((demo) => (
                <article
                  key={demo.id}
                  className="border border-white/15 bg-white/[0.035] p-6 sm:p-8"
                  data-demo-trace={demo.id}
                >
                  <p className="text-xs font-semibold tracking-[0.14em] text-[#c38a82] uppercase">
                    {demo.id} · {demo.publicationStatus}
                  </p>
                  <h3 className="mt-3 font-serif text-2xl font-semibold">{demo.title}</h3>
                  <p className="mt-4 text-sm leading-7 text-[#c6c1b8]">{demo.conclusion}</p>
                  <div className="mt-5 flex flex-wrap gap-2 text-xs text-[#bdb9b0]">
                    {demo.claimIds.map((claimId) => <span key={claimId} className="border border-white/15 px-2 py-1">{claimId}</span>)}
                    {demo.sourceIds.map((sourceId) => <span key={sourceId} className="border border-white/15 px-2 py-1">{sourceId}</span>)}
                  </div>
                  <p className="mt-5 border-l-2 border-[#c38a82] pl-4 text-sm leading-7 text-[#d7cfc2]">
                    {demo.carrierCount} 个载体 → {demo.independentSourceCount} 个独立来源。{demo.cannotInfer}
                  </p>
                  <Link href={demo.href} className="personal-dark-link mt-6">
                    查看完整案例
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="personal-shell grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
          <article className="bg-[#f4f0e8] p-7 sm:p-9">
            <CircleDotDashed className="size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-2xl font-semibold">现在开放什么</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              只开放方法演示，以及不涉及原件正文的小范围需求访谈；不是付费订单、档案鉴定或服务报价。
            </p>
          </article>
          <article className="bg-[#f4f0e8] p-7 sm:p-9">
            <LockKeyhole className="size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-2xl font-semibold">现在不接收什么</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              不接收原件、私人通信、身份证件、精确住址、活人敏感信息或未成年人材料；这些内容也不要粘贴到普通留言。
            </p>
          </article>
          <article className="bg-[#f4f0e8] p-7 sm:p-9">
            <SearchCheck className="size-7 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-2xl font-semibold">怎样继续</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              完成自评后，只复制不含姓名和正文的摘要；若结果允许，可由你主动打开邮件申请访谈，本站不会自动发送。
            </p>
          </article>
        </div>
        <div className="personal-shell mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/sukaiyuan" className="story-button story-button-primary">
            查看苏开元案例
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
          <Link href="/privacy" className="story-text-link">阅读隐私边界</Link>
        </div>
      </section>

      <span className="sr-only">{familyHistoryDiagnosticContract.resultDisclaimer}</span>
    </div>
  );
}

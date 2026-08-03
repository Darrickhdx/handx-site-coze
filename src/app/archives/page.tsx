import { AlertTriangle, Link2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { ProjectSectionNav } from '@/components/project-section-nav';
import { PageHeader } from '@/components/section-header';
import { SourceCard } from '@/components/source-card';
import { sourceCards, sourceRecords } from '@/lib/research-data';

export default function ArchivesPage() {
  const publicLinks = sourceRecords.filter((source) => Boolean(source.public_url)).length;
  const bodyVerified = sourceRecords.filter((source) => source.content_scope === 'body-verified').length;
  const metadataOnly = sourceRecords.filter((source) => source.content_scope === 'metadata-only').length;
  const coverVisible = sourceRecords.filter((source) => source.content_scope === 'cover-visible').length;
  const interpreted = sourceRecords.filter((source) => source.content_scope === 'interpreted').length;

  return (
    <div>
      <ProjectSectionNav />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <PageHeader
          title="史料阅览室"
          subtitle={`${sourceRecords.length}项来源记录，${publicLinks}项有公开入口。其中body-verified ${bodyVerified}项、metadata-only ${metadataOnly}项、cover-visible ${coverVisible}项、interpreted ${interpreted}项。`}
        />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        <div className="rounded-xl border border-confirmed/30 bg-confirmed/10 p-5">
          <ShieldCheck className="w-5 h-5 text-confirmed mb-2" />
          <p className="font-semibold text-foreground">来源ID完整保留</p>
          <p className="text-sm text-muted-foreground mt-1">每张卡都可回到SRC编号和公开导出记录。</p>
        </div>
        <div className="rounded-xl border border-candidate/30 bg-candidate/10 p-5">
          <Link2 className="w-5 h-5 text-candidate mb-2" />
          <p className="font-semibold text-foreground">同源载体不重复加权</p>
          <p className="text-sm text-muted-foreground mt-1">转录、影印、索引和同一作品的不同入口须辨明关系。</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
          <AlertTriangle className="w-5 h-5 text-warning mb-2" />
          <p className="font-semibold text-foreground">metadata/cover不是正文</p>
          <p className="text-sm text-muted-foreground mt-1">metadata-only只证明目录记录存在；cover-visible只能引用可见封面字段。</p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
          <AlertTriangle className="w-5 h-5 text-warning mb-2" />
          <p className="font-semibold text-foreground">已核正文也有范围</p>
          <p className="text-sm text-muted-foreground mt-1">body-verified只对verified_extent有效；unread_extent不会因一页已读而自动清零。</p>
        </div>
      </div>

      <section aria-labelledby="source-list-heading" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <h2 id="source-list-heading" className="sr-only">来源目录</h2>
        {sourceCards.map((source) => (
          <SourceCard key={source.sourceId} {...source} />
        ))}
      </section>

      <section className="mt-10 grid gap-6 border border-foreground/15 bg-[#eee9df] p-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8">
        <div>
          <p className="story-kicker">还没取得的原件</p>
          <h2 className="mt-3 font-serif text-3xl font-semibold">来源目录之外，还有 33 项正在等待推进的查档任务。</h2>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-muted-foreground">
            它们记录“下一步去哪里、找哪一页、拿到什么才算完成”；全部仍在执行前阶段，不是新增史实成果。
          </p>
        </div>
        <Link href="/missions" className="story-button story-button-primary">
          进入查档现场
        </Link>
      </section>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="bg-surface-container-lowest border border-border/40 rounded-xl p-6">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4">本批来源如何理解</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
            <li>SRC-002是《绥行纪略》的本地转录，对应官方影印SRC-013，不算第二个独立来源。</li>
            <li>SRC-039是1933年公报，SRC-042是官职资料库索引；二者在CL-092中独立来源数仍为1。</li>
            <li>SRC-042的content_scope=metadata-only；它只支持“索引如此记录”，不支持未见公报正文内容。</li>
            <li>SRC-095是日方同期档案，应表述为“该档案如何记载”，不能替代中方任命令。</li>
            <li>1929记录与身份桥所依赖的载体因混合公开／私有来源依赖暂缓，不进入本页来源目录。</li>
          </ul>
        </section>
        <section className="bg-surface-container-lowest border border-border/40 rounded-xl p-6">
          <h2 className="font-serif text-xl font-semibold text-foreground mb-4">引用规则</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-2">
            <li>优先引用原来源标题、编号、日期、页码或档号。</li>
            <li>先核对原文，再引用本站短主张；本站不是二次权威。</li>
            <li>不把目录、验证码页、OCR命中或有限预览称为正文原件。</li>
            <li>引用时同时标注content_scope、verified_extent、total_extent_known和unread_extent。</li>
            <li>权利状态未批准前，不复制整页扫描或长篇原文到公开网站。</li>
          </ul>
        </section>
        </div>
      </div>
    </div>
  );
}

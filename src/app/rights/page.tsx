import Link from 'next/link';
import {
  ArrowRight,
  BookCopy,
  Check,
  CircleAlert,
  ExternalLink,
  FileLock2,
  ImageIcon,
  PackageCheck,
  Scale,
  Share2,
} from 'lucide-react';
import { profile } from '@/content/profile';
import { articleRightsPassports } from '@/content/publication-rights';
import { rightsPassportRegistry } from '@/lib/rights-passports';

const contentLayers = [
  {
    icon: Share2,
    title: '未来可开放传播层（尚未生效）',
    scope: '原创研究文章、原创人物卡、原创图表与方法说明',
    policy: '候选方案：CC BY-NC-SA 4.0 · 未生效',
    detail: '若作者最终逐页启用，可允许非商业转载、节选、翻译、视频化与改编；须署名、链接原文、说明修改并相同方式共享。',
    tone: 'text-[#617f71]',
  },
  {
    icon: FileLock2,
    title: '商业核心层',
    scope: '小说正文及页图、剧本、影视方案、课程、未刊稿与完整故事设定',
    policy: '保留全部权利',
    detail: '水印页图仅供本机审阅。适当引用以外的复制、OCR、改编、出版、摄制、商业训练或产品化使用，须事先取得书面许可。',
    tone: 'text-[#a46760]',
  },
  {
    icon: Scale,
    title: '受限档案层',
    scope: '家属原件、高清扫描、照片、第三方文字与馆藏材料',
    policy: '逐件判断、逐件授权',
    detail: '不跟随全站许可。原件所有权不等于著作权；权属未闭环时只做必要预览或外链。',
    tone: 'text-[#8c6d2b]',
  },
] as const;

const requiredAttribution = [
  '作者：鉴真小秃驴',
  '原文标题与可点击的原文链接',
  '许可证名称及链接',
  '是否节选、翻译、编辑或作过其他修改',
] as const;

const commercialUses = [
  '广告号、品牌号、带货号及以获客为目的的转载',
  '付费文章、课程、社群、企业报告、图书与数据库',
  '影视、纪录片、短剧、音频节目、游戏与展览开发',
  '商业 AI 训练、语料库、知识库或产品功能',
] as const;

const legalReferences = [
  {
    label: '《中华人民共和国著作权法》',
    href: 'https://www.ncac.gov.cn/xxfb/flfg/flfg_532/202103/t20210309_50530.html',
  },
  {
    label: '《信息网络传播权保护条例》',
    href: 'https://xzfg.moj.gov.cn/law/detail?LawID=167',
  },
  {
    label: '国家版权局：规范网络转载版权秩序',
    href: 'https://www.ncac.gov.cn/xxfb/tzgg/201504/t20150422_50363.html',
  },
  {
    label: 'CC BY-NC-SA 4.0 中文说明',
    href: 'https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans',
  },
] as const;

export default function RightsPage() {
  return (
    <div className="bg-[#f4f0e8]">
      <section className="border-b border-foreground/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell">
          <div className="inline-flex items-center gap-2 border border-[#d5a09a]/40 px-3 py-1.5 text-[10px] font-semibold tracking-[0.16em] text-[#d5a09a] uppercase">
            <CircleAlert className="size-3.5" aria-hidden="true" />
            尚未发放许可 · 当前全部保留权利
          </div>
          <p className="personal-kicker personal-kicker-light mt-10">
            <span aria-hidden="true" />
            Rights &amp; republication
          </p>
          <h1 className="mt-7 max-w-5xl font-serif text-2xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-3xl">
            让内容传播得更远，
            <span className="block text-[#d5a09a]">也让作者、原文与史料出处一起被看见。</span>
          </h1>
          <p className="mt-8 max-w-3xl text-[15px] leading-[1.7] text-[#bdb9b0]">
            本站不采用“一律禁止转载”，也不把所有材料粗暴地套进同一许可证。
            核心原则是分层：能开放的主动开放，应保留的明确保留，权属不明的绝不代替权利人授权。
          </p>
          <p className="mt-5 max-w-3xl border-l-2 border-[#d5a09a] pl-4 text-sm font-semibold leading-[1.7] text-[#f3efe7]">
            本页目前只是一份拟议政策，不构成 CC 或其他使用许可。只有未来某个内容页面明确显示
            “许可已生效”时，转载者才可按该页面所示范围使用。
          </p>
          <Link
            href="/studio/rights-ledger"
            className="story-button personal-button-primary mt-8"
          >
            查看 {rightsPassportRegistry._meta.counts.records} 项权利护照台账
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-16 sm:py-10">
        <div className="personal-shell">
          <div className="grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 lg:grid-cols-3">
            {contentLayers.map((layer) => {
              const Icon = layer.icon;
              return (
                <article key={layer.title} className="bg-[#f4f0e8] p-7 sm:p-9">
                  <Icon className={`size-7 ${layer.tone}`} strokeWidth={1.4} aria-hidden="true" />
                  <h2 className="mt-7 font-serif text-2xl font-semibold">{layer.title}</h2>
                  <p className="mt-3 text-xs font-semibold tracking-[0.1em] text-primary uppercase">
                    {layer.policy}
                  </p>
                  <p className="mt-6 text-sm font-medium leading-[1.7] text-foreground">{layer.scope}</p>
                  <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{layer.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-[#ece4d8] py-16 sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Novel page images
            </p>
            <ImageIcon className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">182 页可读，不等于 182 页都可发布。</h2>
          </div>
          <div className="space-y-6 text-sm leading-[1.7] text-muted-foreground">
            <p>
              《英雄无名》当前以带像素水印的 WebP 页图提供本机全文与分章阅读；原始 DOCX、PDF
              不进入静态路由、构建产物或版本仓库。所有页图仍是
              <code className="mx-1 border border-foreground/15 bg-white/45 px-1.5 py-0.5 text-xs">
                no-license-granted
              </code>
              ，不得因“能在浏览器打开”推定已经获得转载、训练或改编许可。
            </p>
            <p>
              第 6、14、22、28、47、116、177 页含家属影像或权利尚未闭环的第三方图版，
              固定标记为 <code className="mx-1 text-xs">local_only</code>，只保存在本机，
              不进入私有 GitHub 仓库。其余派生页图可以作为私有工程资产备份，但仍不得公开部署。
            </p>
            <p className="border-l-2 border-primary bg-white/45 px-5 py-4 text-foreground">
              水印、降低分辨率、禁止选择或禁止右键只能提高直接复制成本，不能阻止截图、抓包或 OCR，
              更不能代替权利核验、访问控制与依法维权。
            </p>
            <p>
              新发现的 V1.3 候选版含 47 幅正文图版，但当前结构化权利台账只有 26 条；因此新版 519 页尚未生成网站页图。
              <Link href="/novel/editions" className="ml-1 text-foreground underline decoration-foreground/25 underline-offset-4">
                查看版本与审权门禁
              </Link>
              。
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 bg-white/30 py-7 sm:py-10">
        <div className="personal-shell grid gap-10 lg:grid-cols-[0.65fr_1.35fr] lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Article passports
            </p>
            <h2 className="personal-heading mt-6">规则不只写在页脚，而是落到每一篇文章。</h2>
          </div>
          <div>
            <p className="text-sm leading-[1.7] text-muted-foreground">
              当前三篇文章均已生成独立权利身份证，记录作者、版本、来源、第三方材料与复用边界；
              全部仍是本地审阅稿，许可状态统一为
              <code className="mx-1 border border-foreground/15 bg-white/45 px-1.5 py-0.5 text-xs">
                no-license-granted
              </code>
              。复制署名格式只是帮助正确标注，不代表取得转载许可。
            </p>
            <div className="mt-7 border-t border-foreground/15">
              {Object.values(articleRightsPassports).map((passport) => (
                <Link
                  key={passport.rightsId}
                  href={passport.canonicalPath}
                  className="group grid gap-2 border-b border-foreground/15 py-5 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:items-center sm:gap-5"
                >
                  <span className="font-mono text-[10px] text-primary">{passport.rightsId}</span>
                  <span className="text-sm font-medium">{passport.citation.split('》，')[0]}》</span>
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground transition group-hover:text-primary">
                    查看身份证
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell grid gap-14 lg:grid-cols-[0.68fr_1.32fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              How to share
            </p>
            <BookCopy className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">未来若页面明确启用 CC，转载时须带走这四项信息。</h2>
          </div>

          <div>
            <div className="grid gap-3 sm:grid-cols-2">
              {requiredAttribution.map((item) => (
                <div key={item} className="flex min-h-24 items-start gap-3 border border-foreground/15 bg-white/35 p-5">
                  <Check className="mt-1 size-4 shrink-0 text-primary" aria-hidden="true" />
                  <p className="text-sm leading-[1.7]">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-l-2 border-primary bg-white/45 p-6 sm:p-8">
              <p className="text-[10px] font-semibold tracking-[0.16em] text-primary uppercase">
                许可生效后的拟议署名格式
              </p>
              <blockquote className="mt-4 font-serif text-base leading-9">
                若原页面已经明确标注 CC BY-NC-SA 4.0：本文节选／改编自鉴真小秃驴《文章标题》，原文：
                <span className="break-all text-primary"> https://原文地址</span>。
                已按原页面许可使用；内容已经节选／翻译／编辑。
              </blockquote>
            </div>

            <p className="mt-6 text-sm leading-[1.7] text-muted-foreground">
              转载者不得删除史料来源、把候选身份改写为确定事实，也不得暗示作者为转载内容、产品或机构背书。
              “来源网络”“侵删”不能替代授权与署名。
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Media review packages
            </p>
            <PackageCheck className="mt-8 size-8 text-[#d5a09a]" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="mt-6 font-serif text-2xl font-semibold leading-tight sm:text-2xl">
              一键导出是审稿动作，不是发布授权。
            </h2>
          </div>
          <div>
            <p className="text-[15px] leading-[1.7] text-[#d7cfc2]">
              媒体矩阵工作台生成的所有包固定为
              <code className="mx-1 border border-white/15 bg-white/5 px-1.5 py-0.5 text-xs">
                review_only
              </code>
              ，附带母内容哈希、权利身份证、主张与来源快照、事实／解释／文学虚构标签和人工审核清单。
            </p>
            <p className="mt-5 text-sm leading-[1.7] text-[#bdb9b0]">
              当前工作台不连接小红书、抖音、微信公众号、视频号、快手、B站或 YouTube
              账号，不保存平台令牌，也不调用直发接口。下载、复制文案或打开平台后台，都不把
              <code className="mx-1 text-xs">review_only</code> 自动提升为
              <code className="mx-1 text-xs">public_ready</code>；公开前仍须逐包完成人工事实与权利复核。
            </p>
            <Link href="/studio/media" className="story-button personal-button-primary mt-8">
              查看本机媒体审稿台
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#ece4d8] py-16 sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Commercial use
            </p>
            <h2 className="personal-heading mt-6">这些情况，请先取得书面授权。</h2>
            <div className="mt-8 space-y-3">
              {commercialUses.map((item) => (
                <p key={item} className="flex items-start gap-3 text-sm leading-[1.7]">
                  <ArrowRight className="mt-1.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className="border border-foreground/15 bg-[#f4f0e8] p-7 sm:p-9">
            <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">拟议媒体绿色通道</p>
            <h3 className="mt-4 font-serif text-xl font-semibold">传播可以免费，授权不能含糊。</h3>
            <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">
              可信新闻媒体、纪录片团队和公益文化项目，可邮件申请一次性零费用传播授权。
              影视开发、出版整合、付费产品和商业 AI 使用仍需单独议价并明确作品版本、平台、期限、署名与改编范围。
            </p>
            <a
              href={`mailto:${profile.email}?subject=${encodeURIComponent('版权与转载方案咨询')}`}
              className="story-button personal-button-primary mt-8"
            >
              咨询未来授权
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Archive boundary
            </p>
            <h2 className="personal-heading mt-6">拥有一张旧纸，不等于拥有它的全部版权。</h2>
          </div>
          <div className="space-y-6 text-[15px] leading-[1.7] text-muted-foreground">
            <p>
              家属保存的书信、照片和扫描件，必须分别核对作者、摄影者、继承关系与公开同意。
              权利链未闭环前，高清原件留在私有档案库；网页只显示经过审核的必要局部或外部馆藏链接。
            </p>
            <p>
              公共领域史料也不会被本站重新“圈占”。历史事实可以由任何人用自己的语言讲述；
              本站只对原创考证文字、节点选择、关系编排与可视化表达主张相应权利。
            </p>
            <p>
              第三方引文、照片和馆藏图片均从全站许可中排除，以条目旁的作者、出处、权利状态和使用范围为准。
              低清、水印与禁止右键只能降低复制便利，不能代替合法授权。
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 bg-white/35 py-8 sm:py-10">
        <div className="personal-shell grid gap-10 lg:grid-cols-2 lg:gap-14">
          <div>
            <h2 className="font-serif text-2xl font-semibold">投诉、纠错与下架</h2>
            <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">
              请发送争议页面、具体位置、权利证明或反证、希望采取的措施与联系方式。
              收到后将先确认、保存版本证据；必要时临时隐藏，再根据核查结果补署名、更正、恢复或删除。
            </p>
            <a
              href={`mailto:${profile.email}?subject=${encodeURIComponent('版权投诉或史实纠错')}`}
              className="story-text-link mt-6"
            >
              {profile.email}
              <ArrowRight className="size-4" aria-hidden="true" />
            </a>
          </div>
          <div>
            <h2 className="font-serif text-2xl font-semibold">规则依据</h2>
            <div className="mt-4 border-t border-foreground/15">
              {legalReferences.map((reference) => (
                <a
                  key={reference.href}
                  href={reference.href}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center justify-between gap-5 border-b border-foreground/15 py-4 text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {reference.label}
                  <ExternalLink className="size-3.5 shrink-0 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              ))}
            </div>
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              本页是传播与权利管理方案，不构成针对具体争议的法律意见。CC 许可原则上不可撤销，
              因此本草案在正式公开前仍需逐类确认；当前不存在默认许可。
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-foreground/15 py-8">
        <div className="personal-shell flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            了解本站实际收集哪些访问、留言与章节评论数据，请阅读隐私说明。
          </p>
          <Link href="/privacy" className="story-text-link">
            查看隐私说明
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}

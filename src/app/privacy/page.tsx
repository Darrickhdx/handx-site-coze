import Link from 'next/link';
import {
  ArrowRight,
  Cookie,
  Database,
  EyeOff,
  LockKeyhole,
  MessageSquareText,
  ShieldCheck,
} from 'lucide-react';
import { profile } from '@/content/profile';

const privacyCards = [
  {
    icon: ShieldCheck,
    title: '自评答案只在当前页面',
    body: '家族史起步诊断是零统计区：不收自由文本或文件，不发送页面访问或答案，不写入网址、统计、Cookie 或浏览器存储；刷新、退出或关闭页面即清空。',
  },
  {
    icon: EyeOff,
    title: '不记录身份指纹',
    body: '访问统计和小说评论都不保存 IP、User-Agent、完整 referrer、搜索词或跨站 Cookie；不做设备指纹与会话回放。',
  },
  {
    icon: Cookie,
    title: '不用跨站 Cookie',
    body: '本地统计只在当前标签会话中生成随机编号；服务端加盐哈希后保存。浏览器开启 DNT 或 GPC 时不发送统计。',
  },
  {
    icon: MessageSquareText,
    title: '评论先审后显',
    body: '章节评论先进入本机 pending 队列；公开接口只返回已批准内容。读者意见不会成为知识图谱主张、史料来源或专题证据。',
  },
  {
    icon: LockKeyhole,
    title: '主人能力留在本机',
    body: '语料命中索引、评论审核、统计看板和媒体审稿台均为主人专用；不连接公开数据库、平台账号或自动发布接口。',
  },
] as const;

export default function PrivacyPage() {
  return (
    <div className="bg-[#f4f0e8]">
      <section className="border-b border-foreground/15 py-16 sm:py-10">
        <div className="personal-shell">
          <p className="personal-kicker">
            <span aria-hidden="true" />
            Privacy by design
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-14">
            <div>
              <ShieldCheck className="size-9 text-primary" strokeWidth={1.35} aria-hidden="true" />
              <h1 className="personal-heading mt-7">只记录理解网站所必需的数据。</h1>
            </div>
            <div>
              <p className="max-w-3xl font-serif text-2xl leading-relaxed">
                当前版本仍是只运行在本机的审阅站。访问统计、留言、小说评论和主人工作台同样坚持：
                最少收集、用途清楚、默认私密、绝不自动公开。
              </p>
              <p className="mt-5 text-sm leading-[1.7] text-muted-foreground">
                本说明描述的是当前已经实现的本地功能。未来若公开上线或接入第三方服务，必须先更新说明、重新完成授权与安全检查。
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-foreground/15 py-8 sm:py-10">
        <div className="personal-shell grid gap-px overflow-hidden border border-foreground/15 bg-foreground/15 sm:grid-cols-2">
          {privacyCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className="bg-[#f4f0e8] p-7 sm:p-9">
                <Icon className="size-6 text-primary" strokeWidth={1.4} aria-hidden="true" />
                <h2 className="mt-6 font-serif text-2xl font-semibold">{card.title}</h2>
                <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">{card.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="py-16 sm:py-10">
        <div className="personal-shell grid gap-14 lg:grid-cols-[0.68fr_1.32fr] lg:gap-24">
          <div>
            <p className="personal-kicker">
              <span aria-hidden="true" />
              Data inventory
            </p>
            <Database className="mt-8 size-8 text-primary" strokeWidth={1.4} aria-hidden="true" />
            <h2 className="personal-heading mt-6">五类数据，彼此隔离。</h2>
          </div>
          <div className="space-y-8">
            <article className="border-t border-foreground/15 pt-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">00 · 浏览器内自评</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">五个选择题，只在当前页面内存计算</h3>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                家族史起步诊断不收姓名、自由文本或文件，不调用外部模型，也不把选择写入统计、留言、网址、
                Cookie、localStorage 或 sessionStorage。结果是资料准备度建议，不是历史事实鉴定；刷新或退出即清空答案。
              </p>
              <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                只有你主动点击“复制低敏摘要”时，摘要才会进入系统剪贴板；主动点击邮件入口时，摘要才会交给你的邮件客户端。
                本站不会替你发送，两项操作在隐私优先结果中都不会形成访谈提交。
              </p>
            </article>
            <article className="border-t border-foreground/15 pt-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">01 · 访问与操作统计</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">页面路径、事件名称、时间与匿名会话哈希</h3>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                用来回答“哪些页面有人看、哪个传播渠道带来有效阅读、读者从哪里继续、哪些入口没有作用”。
                页面路径会删除查询参数；来源只保存预设类别（如微信、小红书、搜索、二维码）和站主预先登记的非个人化活动编号，
                不保存完整 referrer、来源页面路径或自由文本 UTM。
              </p>
              <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                文章只记录“有效阅读”和“读到文末”两个里程碑，不保存精确停留秒数、连续滚动百分比、鼠标轨迹或屏幕录制。
                会话随机编号只在当前浏览器标签有效，服务端只落盘不可逆截断哈希，因此不能识别跨标签或跨日回访。
              </p>
            </article>
            <article className="border-t border-foreground/15 pt-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">02 · 私密留言</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">留言正文，以及你自愿留下的称呼和回复方式</h3>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                只用于阅读、回复和判断是否继续交流。普通留言与历史研究材料分开保存，不进入搜索、图谱、文章或公开留言墙。
                联系方式永远不会出现在公开页面。
              </p>
            </article>
            <article className="border-t border-foreground/15 pt-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">03 · 小说章节评论</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">投稿正文与审核事件，分别追加保存</h3>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                评论仅收集章节编号、可选称呼、正文、提交时间、匿名会话哈希与同意版本；不采集 IP 或
                User-Agent。投稿始终先进入 <code className="mx-1 text-xs">pending</code>，
                批准、拒绝、标记垃圾或撤回以独立事件追加记录，不覆盖原投稿。章节页面只能读取当前状态为“已批准”的评论。
              </p>
              <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                评论是读者意见，不论是否通过显示审核，都不会自动进入人物 Wiki、知识图谱、历史专题、来源台账或媒体事实卡。
              </p>
            </article>
            <article className="border-t border-foreground/15 pt-6">
              <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">04 · 主人索引与媒体导出</p>
              <h3 className="mt-3 font-serif text-3xl font-semibold">只读命中，不自动造事实；只生成审稿包，不自动直发</h3>
              <p className="mt-4 text-sm leading-[1.7] text-muted-foreground">
                主人语料索引只向持有本机管理员密钥的页面返回 P1 文档标题、定位和材料类别；
                P2／P3 正文、本机绝对路径和家属私密内容不会发送到浏览器。自动命中只是检索线索，不创建主张或关系。
              </p>
              <p className="mt-3 text-sm leading-[1.7] text-muted-foreground">
                媒体工作台在浏览器中生成 <code className="mx-1 text-xs">review_only</code> ZIP；
                当前不登录平台、不保存平台令牌、不调用直发接口。下载文件由站主自行保管和人工复核。
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-y border-foreground/15 bg-[#202827] py-16 text-[#f3efe7] sm:py-10">
        <div className="personal-shell grid gap-12 lg:grid-cols-2 lg:gap-14">
          <div>
            <p className="personal-kicker personal-kicker-light">
              <span aria-hidden="true" />
              Storage &amp; control
            </p>
            <h2 className="mt-7 font-serif text-4xl font-semibold sm:text-5xl">数据现在存在哪里？</h2>
            <p className="mt-6 text-sm leading-[1.7] text-[#bdb9b0]">
              访问事件、留言、评论投稿、评论审核事件和主人语料索引写入私有运行数据区，
              文件权限仅允许本机账户读写；它们不在 public 目录、不会进入研究 JSON、不会进入构建产物，
              并已排除在版本管理之外。媒体包只由浏览器下载，不由网站自动上传。
            </p>
          </div>
          <div className="border border-white/15 p-7 sm:p-9">
            <p className="text-xs font-semibold tracking-[0.14em] text-[#d5a09a] uppercase">当前保留与删除</p>
            <p className="mt-5 text-sm leading-[1.7] text-[#bdb9b0]">
              本地原型暂未启用自动清理周期，由站主人工管理。公开上线前必须配置清晰期限：
              原始分析事件建议 30–90 天，待处理留言与评论建议 90 天。评论当前采用追加式审计日志，
              “撤回”会追加状态事件；如需物理删除，须由站主在本机完成并保留必要的处理记录。
            </p>
            <p className="mt-5 text-sm leading-[1.7] text-[#bdb9b0]">
              精确到时间、页面与临时会话编号的“最近访问记录”只在输入本机看板密钥后显示；
              接口不会返回原始会话哈希。当前看板里的数据主要来自开发与验收，不代表真实访客。
            </p>
            <p className="mt-5 text-sm leading-[1.7] text-[#bdb9b0]">
              如需查询、更正、撤回或删除本人留言／评论，请提供大致提交时间、对应页面与内容特征，发送至
              <a href={`mailto:${profile.email}`} className="ml-1 text-white underline decoration-white/30 underline-offset-4">
                {profile.email}
              </a>
              。
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-10">
        <div className="personal-shell flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold">本地数据看板</p>
            <p className="mt-2 max-w-2xl text-sm leading-[1.7] text-muted-foreground">
              站主可在本机直接查看脱敏访问统计；留言正文和回复方式还需要单独的本机看板密钥。
              小说评论使用独立的审核入口，同样需要本机管理员密钥。两个入口都不会随当前版本对外部署。
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/insights" className="story-button personal-button-primary">
              查看本机看板
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/studio/comments" className="story-button personal-button-secondary">
              审核小说评论
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link href="/rights" className="story-text-link">
              版权与转载说明
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

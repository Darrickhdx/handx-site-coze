import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Database,
  FileSearch,
  GitBranch,
  ShieldCheck,
} from 'lucide-react';
import { EvidenceLegend } from '@/components/evidence-legend';
import { PageHeader } from '@/components/section-header';
import {
  dataMeta,
  eventRecords,
  identityBlockedClaimCount,
  sceneEligibleClaimCount,
} from '@/lib/research-data';

const workflow = [
  {
    icon: FileSearch,
    title: '1. 登记来源载体',
    text: '记录唯一SRC编号、文献身份、载体类型、取得日期、公开等级、权利状态和可定位入口。',
  },
  {
    icon: Database,
    title: '2. 拆成原子主张',
    text: '每条CL只表达一个可检查陈述，保留时间、地点、原文定位、证据层级和冲突项。',
  },
  {
    icon: GitBranch,
    title: '3. 建立图谱关系',
    text: '人物、地点、机构、职务、事件和文献分节点；同名或异写先分离，再用候选关系连接。',
  },
  {
    icon: ShieldCheck,
    title: '4. 经过公开分层',
    text: 'candidate、previewable、publishable逐层筛选；私人依赖和未审权利会污染下游并阻止发布。',
  },
];

export default function MethodologyPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="研究方法"
        subtitle="目标不是把故事写顺，而是让每一句话都能回到来源、定位和公开边界。"
      />

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-6">从原件到网页的四步链</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {workflow.map((item) => (
            <div key={item.title} className="bg-card border border-border/40 rounded-xl p-6 shadow-card">
              <item.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-3">五层证据体系</h2>
        <p className="text-sm text-muted-foreground mb-6">
          等级描述来源性质和可核性，不是机械打分。即使A级材料也只能证明其原文实际记载的范围。
        </p>
        <EvidenceLegend variant="full" />
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-5">原子主张必须保留什么</h2>
        <div className="bg-surface-container-lowest border border-border/40 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            {[
              ['唯一编号', 'CL编号不会随文案重写而改变。'],
              ['主语—谓语—宾语', '把复合叙事拆为可单独证伪的陈述。'],
              ['时间与地点', '保留精度；不知道具体日就不能伪装成精确日期。'],
              ['来源与定位', '记录SRC编号、页码、段落或档案定位。'],
              ['独立来源数', '镜像、转录、索引和同源转载不重复计数。'],
              ['状态与冲突', 'working_verified、provisional及冲突项显式保存。'],
              ['公开等级', 'P0/P1/P2/P3决定能否进入不同数据层。'],
              ['权利状态', '能看见不等于能重新发布扫描、照片或全文。'],
              ['身份链', 'identity_link_status保留candidate、unresolved、verified或rejected；姓名相同不自动并人。'],
              ['场景门槛', 'scene_eligible=false时，不得改写为真人场景、对白、连续履历或亲属事实。'],
            ].map(([title, text]) => (
              <div key={title} className="bg-card rounded-lg border border-border/30 p-4">
                <p className="font-semibold text-foreground">{title}</p>
                <p className="text-muted-foreground mt-1 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-5">当前发布闸门</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-confirmed/30 bg-confirmed/10 p-6">
            <div className="flex items-center gap-2 font-semibold text-confirmed">
              <CheckCircle2 className="w-5 h-5" />
              本地预览已批准
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              当前范围是{eventRecords.length}组分离文献记录的元数据、{dataMeta.source_counts.claims}条短主张、
              {dataMeta.source_counts.nodes}个节点和{dataMeta.source_counts.edges}条关系。
              其中{identityBlockedClaimCount}条主张身份链未闭环，只有{sceneEligibleClaimCount}条非人物文献内容主张scene_eligible=true。
              1929记录与身份桥因混合来源依赖暂缓；本地预览不包含扫描件、全文转录、家属私密材料或P2/P3。
            </p>
          </div>
          <div className="rounded-xl border border-disputed/30 bg-disputed/10 p-6">
            <div className="flex items-center gap-2 font-semibold text-disputed">
              <AlertTriangle className="w-5 h-5" />
              公开部署未授权
            </div>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              must_not_deploy={String(dataMeta.must_not_deploy)}；deployment_authorized={String(dataMeta.deployment_authorized)}。
              publishable层仍为空，权利审核尚未逐项放行。
            </p>
          </div>
        </div>
      </section>

      <section className="mb-14">
        <h2 className="font-serif text-xl font-bold text-foreground mb-5 flex items-center gap-3">
          <Bot className="w-6 h-6 text-primary" />AI使用边界
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-confirmed/30 rounded-xl p-6">
            <h3 className="font-semibold text-confirmed">可以辅助</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground mt-3 space-y-2">
              <li>OCR初识、检索、去重和结构化整理</li>
              <li>生成待核假设与档案申请清单</li>
              <li>网站代码、数据校验和视觉模板</li>
              <li>对小说场景标注史实、外推和虚构</li>
            </ul>
          </div>
          <div className="bg-card border border-disputed/30 rounded-xl p-6">
            <h3 className="font-semibold text-disputed">不能替代</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground mt-3 space-y-2">
              <li>原始档案、同期报刊和人工原文核对</li>
              <li>身份认定、党籍判断或秘密行动定论</li>
              <li>缺失经历、对白、私生活和因果链的“合理脑补”</li>
              <li>版权、隐私和公开授权的最终审查</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-serif text-xl font-bold text-foreground mb-4">纠错机制当前状态</h2>
        <div className="bg-surface-container-lowest border border-border/40 rounded-xl p-6 text-sm text-muted-foreground leading-relaxed">
          正式邮箱、GitHub Issues和公开投稿流程尚未启用，因此本站不承诺回复时限，也不声称已有持续运营机制。
          上线前需先建立来源提交模板、隐私同意、版权声明、审核责任人和公开更正日志。
        </div>
      </section>
    </div>
  );
}

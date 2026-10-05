/** Public product positioning. Personal responsibilities remain owner-provided. */
export const productPositioning = {
  focus: 'AI · 软硬件 · 日本业务',
  headline: '把现场需求，做成可交付的产品。',
  headlineLead: '把现场需求，',
  headlineOutcome: '做成可交付的产品。',
  introduction: '我是鉴真小秃驴。从嵌入式研发到产品定义、软件平台与日本业务，习惯把设备、数据、现场流程和交付放在一起考虑。',
  evidence: '18 年多产品与工程经历 · 曾在东京常驻近两年（本人提供）',
  currentFocus: '现在关注 AI 信息研究、售货机智能运营与传统行业数字化。先把问题与验证边界说明白，再决定怎样投入。',
} as const;

export const collaborationBrief = [
  { title: '业务问题', description: '想解决什么？谁在什么现场遇到了什么困难？' },
  { title: '当前阶段', description: '还在探索、已有原型，还是正在交付？现有设备与系统是什么？' },
  { title: '希望我参与的部分', description: '需求与产品定义、软硬件协同、验证，或客户导入与交付。' },
] as const;

export const deliveryStages = [
  { number: '01', title: '找到真正的问题', description: '理解使用现场、业务目标与限制，明确需要解决什么。' },
  { number: '02', title: '定义方案与边界', description: '连接设备、软件、数据与流程，约定原型范围和验收依据。' },
  { number: '03', title: '验证后再推进', description: '用原型和小试点验证，组织研发协作，跟进客户导入与交付。' },
] as const;

export const pps7700Case = {
  title: 'PPS7700：让日本自动售货机接入移动支付',
  status: '已商业化',
  period: '2020—2024',
  role: '产品与日本业务负责人（本人提供）',
  problem: '围绕存量日本自动售货机，连接扫码支付、通信、终端适配与平台管理。产品工作需要同时面对设备限制、现场使用和客户导入。',
  responsibility: '负责市场研究、产品定义、软硬件研发协同、客户导入、报价合同与交付，连接设备销售与持续服务。曾在东京常驻近两年。',
  responsibilityNote: '项目时间、任职、驻日经历与个人负责范围由本人提供；公开官方资料核验产品背景，不能单独证明个人贡献。',
  constraints: [
    { title: '终端与存量设备', description: '把支付终端能力放进既有售货机场景，设备适配与现场使用需要一起考虑。' },
    { title: '设备与持续服务', description: '扫码支付、通信和平台管理相互关联，产品定义需要覆盖设备交付后的服务。' },
    { title: '研发与客户导入', description: '在研发协同之外，连接客户需求、报价合同和交付范围。' },
  ],
  constraintsNote: '这里呈现项目需要协调的约束；现有资料未记录具体方案取舍，不将它们写成已经证实的个人决策。',
  delivery: '参与 PPS7700 从 0 到 1 的研发协同与商业化。公开官方资料将其描述为日本自动售货机的一体化嵌入式支付终端。',
  award: '2022 GOOD DESIGN AWARD · 22G110834',
  awardNote: '受赏企业：INSPIRY JAPAN 株式会社。产品由团队共同开发，奖项属于产品及受赏企业。',
  awardUrl: 'https://www.g-mark.org/gallery/winners/7551',
} as const;

export const researchAndCreation = [
  { title: '寻找苏开元', label: '研究与知识工程', description: '来源登记、主张拆分、原件回查与修订记录。AI 协助整理，历史判断回到材料。', href: '/sukaiyuan', linkLabel: '看研究与证据', note: '身份关联与亲属关系仍待闭环。' },
  { title: '《英雄无名》V1.5', label: '创作与内容交付', description: '538 页、36 章，已形成可阅读的完整作品；从 Markdown 真源到排版与网页水印页图。', href: '/novel', linkLabel: '免费阅读小说', note: '小说属于文学创作，不反向证明史实。' },
] as const;

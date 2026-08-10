import {
  Bot,
  BookOpenText,
  Boxes,
  Cpu,
  FileText,
  GitBranch,
  Layers3,
  Network,
  type LucideIcon,
} from 'lucide-react';

export type PrimaryNavigationItem = {
  href: string;
  label: string;
  activePaths: readonly string[];
};

export const primaryNavigation: readonly PrimaryNavigationItem[] = [
  {
    href: '/about',
    label: '关于我',
    activePaths: ['/about'],
  },
  {
    href: '/ai',
    label: '独立开发',
    activePaths: ['/ai', '/studio'],
  },
  {
    href: '/sukaiyuan',
    label: '寻找苏开元',
    activePaths: [
      '/sukaiyuan',
      '/evidence',
      '/graph',
      '/wiki',
      '/archives',
      '/missions',
      '/topics',
      '/person',
      '/persons',
      '/events',
      '/timeline',
      '/controversies',
      '/methodology',
      '/legacy',
    ],
  },
  {
    href: '/novel',
    label: '小说',
    activePaths: ['/novel'],
  },
  {
    href: '/discover',
    label: '文章',
    activePaths: ['/discover'],
  },
] as const;

export type AiProof = {
  number: string;
  eyebrow: string;
  title: string;
  description: string;
  note: string;
  icon: LucideIcon;
};

export const aiProofs: readonly AiProof[] = [
  {
    number: '01',
    eyebrow: 'AI × 内容流水线',
    title: '一份材料，一路走到成品',
    description: '结构化、分层标注、版本冻结、批量产出。538 页的书和它的网页页图，来自同一条能重跑的管线。',
    note: 'Markdown 是唯一真源，排版与页图都是产物',
    icon: Boxes,
  },
  {
    number: '02',
    eyebrow: 'AI × 知识工程',
    title: '一个人也能做复杂知识工程',
    description: '来源登记、主张拆解、实体消歧、关系图谱。AI 负责整理和提问，"算不算事实"留给人。',
    note: '技术提高效率，历史判断仍回到材料',
    icon: Network,
  },
  {
    number: '03',
    eyebrow: 'AI × 硬件与行业系统',
    title: '知道真实世界会在哪里卡住',
    description: '智能终端、移动支付与线下商业系统的二十多年（本人履历）。现在它是判断约束的底子。',
    note: '不是当前主业，是判断力的来源',
    icon: Cpu,
  },
] as const;

export type SelectedContent = {
  href: string;
  kind: string;
  title: string;
  description: string;
  meta: string;
  icon: LucideIcon;
};

export const selectedContents: readonly SelectedContent[] = [
  {
    href: '/discover/1936-pingdiquan',
    kind: '给历史读者',
    title: '朱自清在平地泉遇见了谁？',
    description: '从一行 1936 年同期记录进入苏开元故事，也看清一份原件能证明什么、不能证明什么。',
    meta: '约 6 分钟',
    icon: FileText,
  },
  {
    href: '/discover/ai-family-history',
    kind: '给独立开发者',
    title: '怎样用 AI 重建一段家族史',
    description: '从混乱文件到来源台账、人物关系和可读叙事，一套仍在持续迭代的真实工作流。',
    meta: '方法手记',
    icon: Bot,
  },
  {
    href: '/novel',
    kind: '给小说读者',
    title: '《英雄无名》全文阅读',
    description: '全书 538 页、36 章，免费阅读。史实、合理外推与文学虚构分层标记，小说不反向充当史料。',
    meta: '538 页 · 免费读',
    icon: BookOpenText,
  },
] as const;

export const suKaiyuanArchiveGroups = [
  {
    title: '先看懂关系',
    description: '用图谱认识人物、事件与材料之间的连接。',
    href: '/graph',
    label: '打开知识图谱',
    icon: GitBranch,
  },
  {
    title: '再查具体条目',
    description: '按人物、事件、机构、地点和文献进入 Wiki。',
    href: '/wiki',
    label: '进入人物与事件 Wiki',
    icon: Layers3,
  },
  {
    title: '最后回到原件',
    description: '查看来源身份、原文定位、保存状态与公开入口。',
    href: '/archives',
    label: '进入原件阅览室',
    icon: FileText,
  },
  {
    title: '继续寻找缺失的一页',
    description: '看清下一步去哪里、找什么，以及拿到什么才算完成。',
    href: '/missions',
    label: '进入查档现场',
    icon: BookOpenText,
  },
] as const;

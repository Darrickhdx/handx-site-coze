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
    label: 'AI 与产品',
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
      '/novel',
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
    eyebrow: 'AI × 硬件',
    title: '让模型能力进入真实设备',
    description: '从场景、传感器和边缘能力出发，把 AI 变成可制造、可部署、可维护的终端产品。',
    note: '能力来自二十多年软硬一体产品实践',
    icon: Cpu,
  },
  {
    number: '02',
    eyebrow: 'AI × 行业系统',
    title: '让新能力接进旧世界',
    description: '理解支付、零售和运营系统的真实约束，让 AI 改善流程，而不是只停留在演示。',
    note: '重点是系统连接、业务闭环与规模化落地',
    icon: Boxes,
  },
  {
    number: '03',
    eyebrow: 'AI × 个人知识',
    title: '一个人也能做复杂知识工程',
    description: '以苏开元计划为样本，连接来源台账、知识图谱、写作、网站与多媒体内容。',
    note: '技术提高效率，历史判断仍回到材料',
    icon: Network,
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
    kind: '给 AI 实践者',
    title: '怎样用 AI 重建一段家族史',
    description: '从混乱文件到来源台账、人物关系和可读叙事，一套仍在持续迭代的真实工作流。',
    meta: '方法手记',
    icon: Bot,
  },
  {
    href: '/novel',
    kind: '给小说读者',
    title: '《英雄无名》全文阅读',
    description: '182 页、32 章。史实、合理外推与文学虚构分层标记，小说不反向充当史料。',
    meta: '完整本地审阅版',
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

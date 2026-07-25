import {
  Bot,
  BookMarked,
  GitBranch,
  type LucideIcon,
  NotebookPen,
  Route,
  Sparkles,
} from 'lucide-react';

export type HomeSection = {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  href: string;
  linkLabel: string;
  icon: LucideIcon;
  accent: 'forest' | 'oxblood' | 'amber' | 'ink';
};

export const homeSections: HomeSection[] = [
  {
    id: 'sukaiyuan-project',
    eyebrow: '旗舰项目 01',
    title: '档案现场',
    description: '从 1936 年一行同期记录进入：看原件、读上下文，也看清它暂时不能证明什么。',
    status: '人物专题与原件阅览已开放',
    href: '/sukaiyuan',
    linkLabel: '进入苏开元计划',
    icon: GitBranch,
    accent: 'forest',
  },
  {
    id: 'stories',
    eyebrow: '专题与选题',
    title: '发现',
    description: '把人物、事件、未解问题和技术方法写成普通读者也愿意读完、愿意分享的故事。',
    status: '首批 3 篇完整专题已上线',
    href: '/discover',
    linkLabel: '浏览最新专题',
    icon: BookMarked,
    accent: 'oxblood',
  },
  {
    id: 'ai-lab',
    eyebrow: '方法与实践',
    title: 'AI 实验室',
    description: '公开从杂乱文件、来源台账、知识图谱到网站与内容矩阵的真实工作流。',
    status: '第一篇方法长文已上线',
    href: '/discover/ai-family-history',
    linkLabel: '阅读 AI 家族史方法',
    icon: Bot,
    accent: 'amber',
  },
  {
    id: 'fiction',
    eyebrow: '小说与影视',
    title: '创作室',
    description: '让史料与想象各归其位：已核史实、合理外推、纯虚构始终清楚标记。',
    status: '3 篇审计样章可读',
    href: '/novel',
    linkLabel: '进入小说试读',
    icon: NotebookPen,
    accent: 'ink',
  },
];

export const firstVisitPaths = [
  {
    number: '01',
    icon: Sparkles,
    title: '先读一篇真正的故事',
    description: '从朱自清留下的一行文字开始，六分钟读懂一份原件的力量与边界。',
    href: '/discover/1936-pingdiquan',
    label: '阅读首篇专题',
  },
  {
    number: '02',
    icon: Bot,
    title: '再看 AI 怎样参与这项研究',
    description: '从来源去重、身份分流到知识图谱，看 AI 如何提高效率，又怎样被证据边界约束。',
    href: '/discover/ai-family-history',
    label: '阅读 AI 方法',
  },
  {
    number: '03',
    icon: Route,
    title: '最后认识背后的人',
    description: '了解鉴真小秃驴二十多年的产品经历，以及为什么把 AI 用到产业现场和家族史里。',
    href: '/about',
    label: '认识网站发起人',
  },
];

export const knowledgeNodes = [
  { id: 'sukaiyuan', label: '苏开元计划', note: '旗舰项目', href: '/sukaiyuan', tone: 'primary' },
  { id: 'pingdiquan', label: '1936 · 平地泉', note: '同期记录', href: '/sukaiyuan#pingdiquan', tone: 'forest' },
  { id: 'zhuziqing', label: '朱自清', note: '《绥行纪略》', href: '/persons', tone: 'ink' },
  { id: 'originals', label: '原件', note: '影印与定位', href: '/archives', tone: 'amber' },
  { id: 'graph', label: '知识图谱', note: '人物与事件', href: '/graph', tone: 'forest' },
  { id: 'notes', label: '研究日志', note: '方法与未解', href: '/methodology', tone: 'ink' },
] as const;

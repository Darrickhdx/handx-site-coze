export type NovelCompanionMode = 'source_anchor' | 'conflict' | 'literary_boundary';

export interface NovelCompanionEntry {
  id: string;
  chapterLabel: string;
  chapterHref: string;
  mode: NovelCompanionMode;
  modeLabel: string;
  title: string;
  lead: string;
  canCarry: string;
  cannotCarry: string;
  claimIds: readonly string[];
  sourceIds: readonly string[];
  evidencePathId?: string;
}

export const novelCompanionEntries: readonly NovelCompanionEntry[] = [
  {
    id: 'pingdiquan-1936',
    chapterLabel: '第一章 · 有名',
    chapterHref: '/novel/chapter/chapter-01',
    mode: 'source_anchor',
    modeLabel: '同期文献锚',
    title: '朱自清写下的那次平地泉会面',
    lead: '1936 年校刊把“苏开元团长”放进了一个确切日期、地点与会面语境。',
    canCarry: '可承载文中出现的姓名、称谓和答复意旨。',
    cannotCarry: '不能替小说证明人物内心、完整军职、党籍或跨年代秘密行动。',
    claimIds: ['CL-013', 'CL-014'],
    sourceIds: ['SRC-013'],
    evidencePathId: 'pingdiquan-1936',
  },
  {
    id: 'identity-track',
    chapterLabel: '第二至第五章 · 青年与入傅',
    chapterHref: '/sukaiyuan/dossier',
    mode: 'conflict',
    modeLabel: '候选身份桥',
    title: '蘇開元、蘇凱元与 Su Kai-yuan',
    lead: '调查表、后出校补名簿与人名鉴形成强连接，也同时留下年龄、毕业时间和姓名写法冲突。',
    canCarry: '可作为小说寻找人物身份的真实张力来源。',
    cannotCarry: '不能把所有近形姓名记录无条件拼成家族人物的一条完整履历。',
    claimIds: [],
    sourceIds: ['SRC-103', 'SRC-104', 'SRC-088'],
  },
  {
    id: 'appointment-1933',
    chapterLabel: '公开军职轨 · 1933',
    chapterHref: '/sukaiyuan/dossier#dossier-start',
    mode: 'source_anchor',
    modeLabel: '同期任命文字',
    title: '第四三五团团长的纸面任命',
    lead: '1933 年国民政府公报留下了一条可逐字定位的任命记录。',
    canCarry: '可承载公报所写姓名、番号、职务与刊载日期。',
    cannotCarry: '不能自动证明实际到任、任期、具体战斗或与其他年份记录同人。',
    claimIds: ['CL-092'],
    sourceIds: ['SRC-039'],
    evidencePathId: 'appointment-1933',
  },
  {
    id: 'chart-1942',
    chapterLabel: '第十九章 · 延安',
    chapterHref: '/novel/chapter/chapter-19',
    mode: 'conflict',
    modeLabel: '敌方情报列名',
    title: '1942 年表格里有名字，却没有旅程',
    lead: '日方编成表把李大超与蘇開元并列为“高级参议”，这是列名证据，不是秘密路线证明。',
    canCarry: '可承载“敌方资料当时如此列示”的历史背景。',
    cannotCarry: '不能证明延安行程、私人协作、正式中方任命或具体权限。',
    claimIds: ['CL-167', 'CL-168'],
    sourceIds: ['SRC-095'],
    evidencePathId: 'chart-1942',
  },
  {
    id: 'beiping-boundary',
    chapterLabel: '第二十六至第三十章 · 北平终局',
    chapterHref: '/novel/chapter/chapter-26',
    mode: 'literary_boundary',
    modeLabel: '高风险文学重构',
    title: '一座城的结局，不能被缩成一个人的功劳',
    lead: '围城、谈判、停火、改编与入城属于公共历史主线；小说让小人物承受其中的联络与选择。',
    canCarry: '可用已知时代进程约束人物行动的可能范围。',
    cannotCarry: '不能把“劝开城”“一封信改变北平”或最高层会面写成已核史实。',
    claimIds: [],
    sourceIds: [],
    evidencePathId: 'beiping-boundary',
  },
  {
    id: 'case-boundary',
    chapterLabel: '第三十章 · 破案不能认领',
    chapterHref: '/novel/chapter/chapter-30',
    mode: 'literary_boundary',
    modeLabel: '不得反向入史',
    title: '博物馆里有案件，不等于案件里已经有苏开元',
    lead: '展陈和公共案件资料可以建立时代背景；如果没有姓名原件，就不能把人物嵌入具体侦破功劳。',
    canCarry: '可承载新中国初期公安工作的制度与环境背景。',
    cannotCarry: '不能由小说场景反推苏开元参与某案，更不能进入知识图谱事实边。',
    claimIds: [],
    sourceIds: [],
    evidencePathId: 'case-boundary',
  },
] as const;

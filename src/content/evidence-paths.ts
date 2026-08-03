export type EvidencePathMode = 'scene_companion' | 'research_note' | 'blocked';

export interface EvidencePath {
  id: string;
  eyebrow: string;
  title: string;
  deck: string;
  period: string;
  mode: EvidencePathMode;
  storyLabel: string;
  storyHref: string;
  storyQuestion: string;
  chapterSlug: string;
  storyPageStart: number;
  storyPageEnd: number;
  chapterAssetSha256: string;
  claimIds: readonly string[];
  sourceIds: readonly string[];
  selectedSourceIds: readonly string[];
  sourceFamilyCount: number;
  personFactAllowed: false;
  readerVerdict: string;
  canSay: string;
  cannotSay: string;
  identityBoundary: string;
  nextQuestion: string;
}

export const storyEvidenceContract = {
  schemaVersion: 'story-evidence-1.0',
  novelEditionId: 'hero-wuming-v0-3',
  novelPdfSha256: '3913ae458296646e3151ab9ad2b6646a7104cfe538a80e095b6563fef652d152',
  novelDocxSha256: '4d72bb26a15a45a95ca7f21795a4365db057fac06025b4fc7b4b330fa9ba1b09',
  researchGenerationId: 'gen-be85198ed9f3663e20903ab7011b8ca234ed7fe10a3f3e7f170730d9d8352a7e',
  researchGenerationManifestSha256: 'c32ec1d4c3b931677de19ce5c462e788b5966d7820334c4b5016f71c80d302c0',
  mustNotDeploy: true,
  deploymentAuthorized: false,
  bridgeIds: ['pingdiquan-1936', 'appointment-1933', 'chart-1942'],
  currentPersonFactScenes: 0,
} as const;

export const evidencePathModeLabels: Record<EvidencePathMode, string> = {
  scene_companion: '来源伴读，不是身份认证',
  research_note: '研究旁注，不认证本场',
  blocked: '到此止步，不得入史',
};

export const evidencePaths: readonly EvidencePath[] = [
  {
    id: 'pingdiquan-1936',
    eyebrow: '一场真实会面',
    title: '朱自清在平地泉遇见了谁？',
    deck: '从小说第一章回到 1936 年校刊，看见姓名、称谓和一句关于学生组织的答复如何落在纸面上。',
    period: '1936-11-21',
    mode: 'scene_companion',
    storyLabel: '《英雄无名》第一章 · 有名',
    storyHref: '/novel/chapter/chapter-01',
    storyQuestion: '小说把这次会面写成了人物出场；原件究竟允许我们保留多少？',
    chapterSlug: 'chapter-01',
    storyPageStart: 20,
    storyPageEnd: 26,
    chapterAssetSha256: '5bff67ce49b2c28a66ac787c94fe32f82cb654e60cadcc8640ff0b7a0e44d31c',
    claimIds: ['CL-013', 'CL-014'],
    sourceIds: ['SRC-002', 'SRC-013'],
    selectedSourceIds: ['SRC-013'],
    sourceFamilyCount: 1,
    personFactAllowed: false,
    readerVerdict: '校刊的会面记录与答复意旨可核；网站仍不把文中对象直接认证为家族人物的连续生平。',
    canSay: '朱自清记载自己在平地泉遇到“留守司令苏开元团长”，并记下其对学生保持组织独立性的态度。',
    cannotSay: '不能把表情、私下动机、完整军职、党籍或后来秘密行动写成校刊已经证明。',
    identityBoundary: 'V7R4 安全预览把 CL-013／014 的人物身份链保持为 candidate、scene_eligible=false；因此这里只是来源伴读，不是“本场真人事实认证”。',
    nextQuestion: '寻找同期部队名册、平地泉留守编制及其他会面记录。',
  },
  {
    id: 'appointment-1933',
    eyebrow: '一条纸面任命',
    title: '435 团团长，是任命还是完整任期？',
    deck: '国民政府公报能锁定一条任命文字，却不能替我们补出到任、离任与战斗经过。',
    period: '1933-03-09',
    mode: 'research_note',
    storyLabel: '《英雄无名》早期军职背景',
    storyHref: '/novel/chapter/chapter-01',
    storyQuestion: '一条公报里的姓名和番号，可以为小说人物背景提供什么，又不能提供什么？',
    chapterSlug: 'chapter-01',
    storyPageStart: 20,
    storyPageEnd: 26,
    chapterAssetSha256: '5bff67ce49b2c28a66ac787c94fe32f82cb654e60cadcc8640ff0b7a0e44d31c',
    claimIds: ['CL-092'],
    sourceIds: ['SRC-039', 'SRC-042'],
    selectedSourceIds: ['SRC-039'],
    sourceFamilyCount: 1,
    personFactAllowed: false,
    readerVerdict: '公报任命文字可核；V7R4 中人物身份仍为 candidate，本旁注不证明某一场小说情节。',
    canSay: '1933 年 3 月 9 日公报刊载蘇開元获任第七十二师第二一八旅第四三五团团长。',
    cannotSay: '不能自动写成此前已经到任、持续任职到某年，或因此参加了某场具体战斗。',
    identityBoundary: 'SRC-042 只是资料库索引，不增加独立来源数；公报同页的七十二／七十三师异常与跨年同名问题继续保留。',
    nextQuestion: '继续核对军令、部队职员录、番号异常与实际到离职记录。',
  },
  {
    id: 'chart-1942',
    eyebrow: '敌方档案中的列名',
    title: '1942 年表格有名字，为什么没有延安路线？',
    deck: '日方编成表把李大超与蘇開元并列为高级参议；它能证明表格如何列示，却不能证明两人的私下旅程。',
    period: '1942-08',
    mode: 'research_note',
    storyLabel: '《英雄无名》第十六章 · 延安',
    storyHref: '/novel/chapter/chapter-16',
    storyQuestion: '敌方情报表里的一行列名，能否成为秘密行动的证据？',
    chapterSlug: 'chapter-16',
    storyPageStart: 99,
    storyPageEnd: 102,
    chapterAssetSha256: 'eb6a320c075f361c870f8952ce818ad32b8fff1924eb7ca90b24ba590510ef7e',
    claimIds: ['CL-167', 'CL-168'],
    sourceIds: ['SRC-095'],
    selectedSourceIds: ['SRC-095'],
    sourceFamilyCount: 1,
    personFactAllowed: false,
    readerVerdict: '文献列名可核；人物正式任命、权限、私交和延安路线都没有因此获得认证。',
    canSay: '1942 年 8 月日方编成表在傅作义指挥部队项下并列李大超、蘇開元为高级参议。',
    cannotSay: '不能把敌方表格改写成中方任命令，也不能证明延安行程、会面或两人的秘密协作。',
    identityBoundary: 'CL-167 只说明文献内容；CL-168 的人物归属在 V7R4 中仍为 candidate、scene_eligible=false，两者必须分开显示。',
    nextQuestion: '寻找中方职员录、任命文件、交通记录及李大超同时期材料。',
  },
  {
    id: 'beiping-boundary',
    eyebrow: '最诱人的英雄叙事',
    title: '一封信，能不能改变北平的结局？',
    deck: '小说可以让小人物承担联络、等待与风险；公共历史不能因此被压缩成一人的决定。',
    period: '1948—1949',
    mode: 'blocked',
    storyLabel: '《英雄无名》第二十四章 · 围城',
    storyHref: '/novel/chapter/chapter-24',
    storyQuestion: '戏剧上最有力的一刻，为什么在史料链里必须显示空白？',
    chapterSlug: 'chapter-24',
    storyPageStart: 139,
    storyPageEnd: 143,
    chapterAssetSha256: 'd267c184f3c13a8b87960c1a4c6e1e78a4088ad695b4d0d962c02c1b80e7264a',
    claimIds: [],
    sourceIds: [],
    selectedSourceIds: [],
    sourceFamilyCount: 0,
    personFactAllowed: false,
    readerVerdict: '现有安全预览没有支持“苏开元一人促成北平结局”的真人关键因果。',
    canSay: '可用公共历史进程约束围城、谈判、停火、改编与入城的时代背景。',
    cannotSay: '不能把劝开城、最高层会面或一封信改变全局写成已核史实。',
    identityBoundary: '没有来源链，就不生成主张、关系边或媒体事实卡；小说场景不会反向进入人物史。',
    nextQuestion: '按机构与行动拆分检索军调部、华北剿总、北平地下交通和谈判参与者原始档案。',
  },
  {
    id: 'case-boundary',
    eyebrow: '博物馆里的案件',
    title: '有一个案件，是否就有苏开元？',
    deck: '制度史与案件展陈可以提供时代空气；没有姓名原件，就不能把人物嵌入侦破功劳。',
    period: '1949—1950',
    mode: 'blocked',
    storyLabel: '《英雄无名》第二十八章 · 破案不能认领',
    storyHref: '/novel/chapter/chapter-28',
    storyQuestion: '真实案件背景与真实人物参与之间，缺的究竟是哪一环？',
    chapterSlug: 'chapter-28',
    storyPageStart: 154,
    storyPageEnd: 156,
    chapterAssetSha256: '4c7752b53706d03973488fe171221167947533a83c3575d4ab3a2fa82bdafc01',
    claimIds: [],
    sourceIds: [],
    selectedSourceIds: [],
    sourceFamilyCount: 0,
    personFactAllowed: false,
    readerVerdict: '现有安全预览没有把苏开元与具体案件闭环。',
    canSay: '可以研究新中国初期公安工作的制度、机构与案件背景。',
    cannotSay: '不能从小说情节或博物馆展陈反推苏开元参与某案，更不能认领单人破案功劳。',
    identityBoundary: '背景资料只连接时代，不连接人物；人物参与必须出现可定位姓名材料。',
    nextQuestion: '优先查北京市公安任职名册、案件卷宗目录、工作报告与同事回忆的原始载体。',
  },
] as const;

export const evidencePathById = new Map(
  evidencePaths.map((path) => [path.id, path]),
);

export const sourcePreviewAssets: Readonly<
  Record<
    string,
    {
      path: string;
      sha256: string;
      alt: string;
      rightsScope: 'local_internal_preview_only';
      displayScope: 'local_source_viewer_only';
      notForMedia: true;
      publishable: false;
      note: string;
    }
  >
> = {
  'SRC-013': {
    path: '/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png',
    sha256: 'c94a3d5dcd0cede08ce46f13d050df06445841d51918f382cf24f99baf794861',
    alt: '1936 年《绥行纪略》官方数字影印的本地审阅局部',
    rightsScope: 'local_internal_preview_only',
    displayScope: 'local_source_viewer_only',
    notForMedia: true,
    publishable: false,
    note: '第三方史料局部，仅供本地研究审阅；公开使用应回到原馆并核对馆藏规则。',
  },
};

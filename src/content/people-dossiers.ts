export type PersonDossierStatus =
  | 'candidate_core'
  | 'identified_witness'
  | 'identified_public_figure'
  | 'target_identity_split';

export type PersonMilestoneMode =
  | 'documented'
  | 'attributed'
  | 'conflict'
  | 'identity_firewall';

export interface PersonMilestone {
  id: string;
  period: string;
  title: string;
  summary: string;
  mode: PersonMilestoneMode;
  claimIds: readonly string[];
  contextClaimIds?: readonly string[];
}

export interface PersonRelationCard {
  edgeId: string;
  readerSentence: string;
}

export interface PersonSourceCarrierFamily {
  familyId: string;
  familyLabel: string;
  carrierLabel: string;
}

export interface PersonDossier {
  entityId: string;
  displayName: string;
  initials: string;
  eyebrow: string;
  status: PersonDossierStatus;
  roleInStory: string;
  oneLine: string;
  whyHere: string;
  identityBoundary: string;
  portraitMode: 'typographic_no_historical_image';
  biographyComplete: false;
  lifeStatus: 'deceased_public_record' | 'unknown_not_asserted';
  lifeStatusBasis: string;
  privacyStatus: 'historical_public_material_only';
  publicationStatus: 'local_review_only';
  overviewClaimIds: readonly string[];
  identityBoundaryClaimIds: readonly string[];
  relationCards: readonly PersonRelationCard[];
  milestones: readonly PersonMilestone[];
  featuredSourceIds: readonly string[];
  relatedLinks: readonly { label: string; href: string }[];
}

export const personDossierStatusLabels: Record<PersonDossierStatus, string> = {
  candidate_core: '核心研究对象 · 身份未闭环',
  identified_witness: '已识别记录者／见证人',
  identified_public_figure: '已识别公共历史人物',
  target_identity_split: '绥远军人线索 · 与其他同名者分开',
};

export const personMilestoneModeLabels: Record<PersonMilestoneMode, string> = {
  documented: '文献记录',
  attributed: '有归属的回忆／研究说法',
  conflict: '冲突并列',
  identity_firewall: '同名隔离',
};

export const personSourceCarrierFamilyById = new Map<string, PersonSourceCarrierFamily>([
  ['SRC-002', { familyId: 'WORK-SUIXINGJILUE', familyLabel: '《绥行纪略》同一作品', carrierLabel: '本地文字转录' }],
  ['SRC-013', { familyId: 'WORK-SUIXINGJILUE', familyLabel: '《绥行纪略》同一作品', carrierLabel: '同期校刊官方影印' }],
  ['SRC-039', { familyId: 'WORK-GAZETTE-1075', familyLabel: '《国民政府公报》第1075号同一记录', carrierLabel: '同期数字影印' }],
  ['SRC-042', { familyId: 'WORK-GAZETTE-1075', familyLabel: '《国民政府公报》第1075号同一记录', carrierLabel: '官方数据库索引' }],
  ['SRC-022', { familyId: 'WORK-QIAO-LOCAL-GAZETTEER', familyLabel: '乔培新地方志人物传同一作品', carrierLabel: '公开页（一）' }],
  ['SRC-022-R1', { familyId: 'WORK-QIAO-LOCAL-GAZETTEER', familyLabel: '乔培新地方志人物传同一作品', carrierLabel: '公开页（二）' }],
  ['SRC-083', { familyId: 'WORK-QIAO-LOCAL-GAZETTEER', familyLabel: '乔培新地方志人物传同一作品', carrierLabel: '本地扫描载体' }],
]);

export const peopleDossiers: readonly PersonDossier[] = [
  {
    entityId: 'P-001',
    displayName: '苏开元',
    initials: '苏',
    eyebrow: '寻找的中心',
    status: 'candidate_core',
    roleInStory: '连接不同年代碎片、承受身份空白的人',
    oneLine: '他不是一条已经写完的履历，而是一组正在被原件逐步照亮的同名记录。',
    whyHere: '家族记忆让这个名字进入寻找；公报、校刊、日方档案与后出回忆让它在不同年代出现。网站的任务不是把空白填满，而是把每一次出现分别放回原文。',
    identityBoundary: 'P-001 是候选身份簇。SRC-103 的 1929 年调查表写“蘇開元”；1977 年校补名簿回溯 1927—1929 学籍时写“蘇凱元”。两条记录形成候选身份桥，但不能自动合并为连续生平。苏凯原（P-003）与康原（P-004）仍是独立待核线索，不得回填 P-001。',
    portraitMode: 'typographic_no_historical_image',
    biographyComplete: false,
    lifeStatus: 'unknown_not_asserted',
    lifeStatusBasis: '本策展层不根据家属材料或出生推算公开生存状态。',
    privacyStatus: 'historical_public_material_only',
    publicationStatus: 'local_review_only',
    overviewClaimIds: ['CL-092', 'CL-013', 'CL-014', 'CL-168', 'CL-177', 'CL-178', 'CL-179'],
    identityBoundaryClaimIds: ['CL-177', 'CL-178', 'CL-179'],
    relationCards: [],
    milestones: [
      {
        id: 'su-1933',
        period: '1933',
        title: '公报里的一条团长任命',
        summary: '可核的是纸面任命；到任、任期和具体行动仍是另外的问题。',
        mode: 'documented',
        claimIds: ['CL-092'],
      },
      {
        id: 'su-1936',
        period: '1936',
        title: '朱自清在平地泉写下这个名字',
        summary: '同期校刊留下称谓和答复意旨；小说现场的动作、心理与跨年身份不由校刊证明。',
        mode: 'documented',
        claimIds: ['CL-013', 'CL-014'],
      },
      {
        id: 'su-1942',
        period: '1942',
        title: '日方编成表中的高级参议列名',
        summary: '表格如何列示可以核对；正式中方任命、权限和秘密路线不能从中推出。',
        mode: 'documented',
        claimIds: ['CL-168'],
        contextClaimIds: ['CL-167'],
      },
      {
        id: 'su-identity',
        period: '1927—1929',
        title: '1929“蘇開元”与校补名簿“蘇凱元”的候选身份桥',
        summary: '同县、同校、同科与相容时间窗形成强连接；1977 年名簿是校补材料，不是 1929 年原始学籍，这条桥也不向其他年代和亲属身份自动外溢。',
        mode: 'conflict',
        claimIds: ['CL-177', 'CL-178', 'CL-179'],
        contextClaimIds: ['CL-176', 'CL-181'],
      },
    ],
    featuredSourceIds: ['SRC-013', 'SRC-039', 'SRC-095', 'SRC-103', 'SRC-104'],
    relatedLinks: [
      { label: '打开身份互动案卷', href: '/sukaiyuan/dossier' },
      { label: '沿故事证据链阅读', href: '/evidence' },
      { label: '查看完整 Wiki', href: '/wiki/P-001' },
    ],
  },
  {
    entityId: 'P-005',
    displayName: '李英夫',
    initials: '李',
    eyebrow: '最重要的参与者证词',
    status: 'identified_witness',
    roleInStory: '见证、回忆，也制造需要继续核对的问题',
    oneLine: '他留下了目前最完整的苏开元回忆文本，同时也必须被当作有立场、有时间距离的参与者来阅读。',
    whyHere: '李英夫既有可由公报核对的公开军职，也在晚年回忆中叙述自己与苏开元的多次交集。两条材料轨必须并行：公报支持履历片段，回忆提供检索方向和故事原型。',
    identityBoundary: 'P-005 与“李广荣”明确分离；“李亦荣”是回忆作者自述的原名线索，不能借他人的陆士名录补齐李英夫履历。北京市政协与全国政协同名记录仍分别保留身份桥状态。',
    portraitMode: 'typographic_no_historical_image',
    biographyComplete: false,
    lifeStatus: 'unknown_not_asserted',
    lifeStatusBasis: '当前人物档案没有登记可公开复核的生卒闭环。',
    privacyStatus: 'historical_public_material_only',
    publicationStatus: 'local_review_only',
    overviewClaimIds: ['CL-035', 'CL-036', 'CL-039', 'CL-040', 'CL-041'],
    identityBoundaryClaimIds: ['CL-034', 'CL-038'],
    relationCards: [
      { edgeId: 'REL-033', readerSentence: '李英夫后来回忆称，他曾向苏开元发出警告。' },
      { edgeId: 'REL-034', readerSentence: '李英夫后来回忆称，他曾为苏开元提供住处或交通帮助。' },
    ],
    milestones: [
      {
        id: 'liyingfu-appointments',
        period: '1933—1935',
        title: '公报可核的军职与军阶',
        summary: '1933 年参谋处长任命与 1935 年步兵中校任命是目前最稳固的公开履历锚。',
        mode: 'documented',
        claimIds: ['CL-035', 'CL-036'],
      },
      {
        id: 'liyingfu-school',
        period: '早年',
        title: '日本陆士经历仍缺期次与科别',
        summary: '回忆系统与后出研究都提供留学军校线索，但不能把李广荣的名录记录移植给李英夫。',
        mode: 'identity_firewall',
        claimIds: ['CL-038', 'CL-034'],
      },
      {
        id: 'liyingfu-su',
        period: '1931—1948',
        title: '回忆中的三组苏开元交集',
        summary: '介绍冯基平、示警与提供住处／交通都来自参与者回忆；可作为查档路线和文学原型，不是同期行动日志。',
        mode: 'attributed',
        claimIds: ['CL-039', 'CL-040', 'CL-041'],
      },
      {
        id: 'liyingfu-1956',
        period: '1956',
        title: '战后座谈中的人物思想线索',
        summary: '学术研究把他放进 1956 年座谈语境，为战后经历提供一条可继续核对的公共材料线。',
        mode: 'attributed',
        claimIds: ['CL-157', 'CL-158'],
      },
    ],
    featuredSourceIds: ['SRC-001', 'SRC-039', 'SRC-040', 'SRC-090'],
    relatedLinks: [
      { label: '查看完整 Wiki', href: '/wiki/P-005' },
      { label: '阅读李英夫原文来源卡', href: '/archives/SRC-001' },
      { label: '进入小说', href: '/novel' },
    ],
  },
  {
    entityId: 'P-017',
    displayName: '李大超',
    initials: '超',
    eyebrow: '同名迷雾中的绥远军人',
    status: 'target_identity_split',
    roleInStory: '把训练体系、游击军与 1942 幕僚表连接起来的目标人物',
    oneLine: '关于李大超，最重要的进展不是“找到更多同名记录”，而是把绥远军事轨与上海、广东、台湾轨强制分开。',
    whyHere: '1936 年朱自清的文字、1937 年军事背景研究与 1942 年日方编成表暂按一条目标人物轨并列，但不等于已证为同一个真人的连续履历；它与另一个党政文教人物李大超在时间、地点和机构上冲突。',
    identityBoundary: '本页只讨论 P-017“绥远军人李大超”。P-020、P-029、P-031 及“李树万”假设不得并入；同名目录也不会自动增加这条人物轨的可信度。',
    portraitMode: 'typographic_no_historical_image',
    biographyComplete: false,
    lifeStatus: 'unknown_not_asserted',
    lifeStatusBasis: '同名人物仍在分流，本策展层不推断生存状态。',
    privacyStatus: 'historical_public_material_only',
    publicationStatus: 'local_review_only',
    overviewClaimIds: ['CL-044', 'CL-045', 'CL-048', 'CL-049', 'CL-169', 'CL-170'],
    identityBoundaryClaimIds: ['CL-051', 'CL-072'],
    relationCards: [
      { edgeId: 'REL-124', readerSentence: '1942 年日方编成表把李大超与蘇開元并列在高级参议栏。' },
    ],
    milestones: [
      {
        id: 'lidachao-1936',
        period: '1936',
        title: '归绥常备队的李副主任',
        summary: '朱自清记下其称谓与训练内容；地点是归绥，不应移动到次日平地泉。',
        mode: 'documented',
        claimIds: ['CL-044', 'CL-045'],
      },
      {
        id: 'lidachao-1937',
        period: '1937',
        title: '国民兵团与绥远游击军线索',
        summary: '后出学术研究与大事记提供公共军事背景；正式任命和精确编制仍要继续核。',
        mode: 'documented',
        claimIds: ['CL-048', 'CL-049'],
      },
      {
        id: 'lidachao-1942',
        period: '1942',
        title: '与蘇開元并列于高级参议栏',
        summary: '并列说明同一日方编成表如何认识幕僚带；不能推出两人的私交、上下级或秘密协作。',
        mode: 'attributed',
        claimIds: ['CL-169', 'CL-170'],
      },
      {
        id: 'lidachao-firewall',
        period: '跨年代',
        title: '同名人物必须分流',
        summary: '绥远军人与上海—广东—台湾党政文教轨在 1930 年代形成不相容活动线，网站不做强制合并。',
        mode: 'identity_firewall',
        claimIds: ['CL-051', 'CL-072'],
      },
    ],
    featuredSourceIds: ['SRC-013', 'SRC-026', 'SRC-028', 'SRC-095'],
    relatedLinks: [
      { label: '查看完整 Wiki', href: '/wiki/P-017' },
      { label: '查看 1942 研究旁注', href: '/evidence/chart-1942' },
      { label: '查看另一个李大超（上海市政与文教记录）', href: '/wiki/P-020' },
    ],
  },
  {
    entityId: 'P-006',
    displayName: '朱自清',
    initials: '朱',
    eyebrow: '1936 年的记录者',
    status: 'identified_witness',
    roleInStory: '让两个名字在同期校刊里留下声音的人',
    oneLine: '他不是苏开元生平的全知见证人，却留下了目前最重要的一段同期现场文字。',
    whyHere: '《绥行纪略》让 1936 年归绥与平地泉的会面、称谓和训练话题有了可定位原文。对这个项目而言，朱自清首先是一位记录者。',
    identityBoundary: '确认作者与绥远之行，不等于作者掌握苏开元或李大超的完整身份；文章之外的背景必须另找来源。',
    portraitMode: 'typographic_no_historical_image',
    biographyComplete: false,
    lifeStatus: 'deceased_public_record',
    lifeStatusBasis: '公共人物生平已有广泛公开记录；本页仍只使用项目登记材料。',
    privacyStatus: 'historical_public_material_only',
    publicationStatus: 'local_review_only',
    overviewClaimIds: ['CL-032'],
    identityBoundaryClaimIds: ['CL-032'],
    relationCards: [
      { edgeId: 'REL-010', readerSentence: '朱自清在 1936 年《绥行纪略》中记录了一次与“苏开元团长”的公开会面。' },
    ],
    milestones: [
      {
        id: 'zhuzhiqing-1936',
        period: '1936',
        title: '参加慰问团并写下《绥行纪略》',
        summary: '清华校史材料与校刊影印共同支持这次行程及文章背景。',
        mode: 'documented',
        claimIds: ['CL-032'],
        contextClaimIds: ['CL-013', 'CL-014', 'CL-044', 'CL-045'],
      },
    ],
    featuredSourceIds: ['SRC-011', 'SRC-013'],
    relatedLinks: [
      { label: '阅读 1936 专题', href: '/discover/1936-pingdiquan' },
      { label: '查看平地泉证据链', href: '/evidence/pingdiquan-1936' },
      { label: '查看完整 Wiki', href: '/wiki/P-006' },
    ],
  },
  {
    entityId: 'P-010',
    displayName: '乔培新',
    initials: '乔',
    eyebrow: '组织代价与冲突证词',
    status: 'identified_public_figure',
    roleInStory: '让“乔培新脱险事件”从英雄桥段变成需要逐版本核对的事件',
    oneLine: '他的公开履历相对清楚，但被捕、脱险与苏开元角色存在年份、路线和叙述来源冲突。',
    whyHere: '清华经历、入党、曾用名与到达延安有公开材料支撑；“谁下令、何时被捕、如何脱险”主要来自后出回忆和地方志，不能合成一条无缝传奇。',
    identityBoundary: '乔森显、苏子仁是公开讣告记录的曾用名；出生年 1911／1912 与包头县长年份冲突必须并列。苏开元是否参与脱险另属待核关系。',
    portraitMode: 'typographic_no_historical_image',
    biographyComplete: false,
    lifeStatus: 'deceased_public_record',
    lifeStatusBasis: '人物公开讣告已进入登记来源；本页不展示私人身份材料。',
    privacyStatus: 'historical_public_material_only',
    publicationStatus: 'local_review_only',
    overviewClaimIds: ['CL-055', 'CL-056', 'CL-057', 'CL-061', 'CL-081', 'CL-135', 'CL-136'],
    identityBoundaryClaimIds: ['CL-058', 'CL-059', 'CL-090'],
    relationCards: [
      { edgeId: 'REL-076', readerSentence: '后出材料称，苏开元曾接到涉及乔培新的拘捕命令。' },
      { edgeId: 'REL-077', readerSentence: '后出材料称，苏开元有意让乔培新脱身。' },
      { edgeId: 'REL-080', readerSentence: '李英夫后来回忆称，苏开元当时并不知道乔培新的政治身份。' },
      { edgeId: 'REL-108', readerSentence: '后出回忆称，苏开元与乔培新曾建立联系并经常见面。' },
      { edgeId: 'REL-111', readerSentence: '后出回忆称，苏开元曾亲自向乔培新示警。' },
    ],
    milestones: [
      {
        id: 'qiao-public',
        period: '1933—1936',
        title: '清华、入党与曾用名',
        summary: '两类公开材料构成乔培新个人履历的稳固部分，但不为苏开元党籍背书。',
        mode: 'documented',
        claimIds: ['CL-055', 'CL-056', 'CL-057', 'CL-090'],
      },
      {
        id: 'qiao-birth',
        period: '1911／1912',
        title: '出生年份冲突',
        summary: '地方志与新华社讣告给出不同年份；网站保留两条，不默认替读者选一版。',
        mode: 'conflict',
        claimIds: ['CL-058', 'CL-059'],
      },
      {
        id: 'qiao-yanan',
        period: '1941',
        title: '进入延安系统',
        summary: '到达延安可作为个人年表锚，但不能反向证明苏开元如何帮助其脱险。',
        mode: 'documented',
        claimIds: ['CL-061'],
      },
      {
        id: 'qiao-escape',
        period: '1940—1941',
        title: '被捕与脱险的多版本叙述',
        summary: '李英夫版本与地方志版本在日期、路线和行动者上不同；只能逐版本展示。',
        mode: 'attributed',
        claimIds: ['CL-081', 'CL-135', 'CL-136'],
        contextClaimIds: ['CL-079', 'CL-080', 'CL-132', 'CL-137'],
      },
    ],
    featuredSourceIds: ['SRC-001', 'SRC-022', 'SRC-023'],
    relatedLinks: [
      { label: '查看完整 Wiki', href: '/wiki/P-010' },
      { label: '阅读小说', href: '/novel' },
      { label: '查看傅作义档案', href: '/persons/P-007' },
    ],
  },
  {
    entityId: 'P-007',
    displayName: '傅作义',
    initials: '傅',
    eyebrow: '权力与公共历史主线',
    status: 'identified_public_figure',
    roleInStory: '不能被主角取代的决策与制度背景',
    oneLine: '他的公开历史体量远大于本项目；网站只展示与苏开元研究直接相关的少数切面。',
    whyHere: '苏开元、李英夫、李大超与乔培新的多条材料都发生在傅作义系统周围。人物群像需要保留权力中心，但不能把所有组织决定缩成私人关系。',
    identityBoundary: '本页不是傅作义完整传记。关于乔培新被捕命令的日期与因果来自不同后出版本，不能伪作命令原件；北平结局也不能归功于某一个联络者。',
    portraitMode: 'typographic_no_historical_image',
    biographyComplete: false,
    lifeStatus: 'deceased_public_record',
    lifeStatusBasis: '公共人物生平已有广泛公开记录；本页仍只选择与本项目直接相关的切面。',
    privacyStatus: 'historical_public_material_only',
    publicationStatus: 'local_review_only',
    overviewClaimIds: ['CL-066', 'CL-018', 'CL-133', 'CL-134'],
    identityBoundaryClaimIds: ['CL-018', 'CL-133', 'CL-134'],
    relationCards: [],
    milestones: [
      {
        id: 'fu-tianjin',
        period: '1928',
        title: '天津警备司令的公共背景锚',
        summary: '这条公开背景有助于理解傅作义系统的形成，但不自动证明其他人物在同一时间加入。',
        mode: 'documented',
        claimIds: ['CL-066'],
      },
      {
        id: 'fu-qiao',
        period: '1940／1941',
        title: '关于拘捕乔培新的冲突版本',
        summary: '李英夫回忆与地方志把命令放在不同时间和因果链中，必须分别归属来源。',
        mode: 'conflict',
        claimIds: ['CL-018', 'CL-133', 'CL-134'],
      },
    ],
    featuredSourceIds: ['SRC-001', 'SRC-022', 'SRC-029'],
    relatedLinks: [
      { label: '查看完整 Wiki', href: '/wiki/P-007' },
      { label: '查看乔培新档案', href: '/persons/P-010' },
      { label: '阅读北平停止链', href: '/evidence/beiping-boundary' },
    ],
  },
] as const;

export const peopleDossierById = new Map(
  peopleDossiers.map((dossier) => [dossier.entityId, dossier]),
);

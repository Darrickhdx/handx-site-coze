export type DiagnosticTrackId =
  | 'privacy_first'
  | 'inventory_first'
  | 'identity_first'
  | 'archive_first'
  | 'narrative_first';

export type DiagnosticQuestionId =
  | 'materials'
  | 'problem'
  | 'scale'
  | 'privacy'
  | 'working_boundary';

export interface DiagnosticOption {
  id: string;
  label: string;
  description: string;
  weights: Partial<Record<DiagnosticTrackId, number>>;
}

export interface DiagnosticQuestion {
  id: DiagnosticQuestionId;
  prompt: string;
  helper: string;
  options: readonly DiagnosticOption[];
}

export interface DiagnosticTrack {
  id: DiagnosticTrackId;
  eyebrow: string;
  title: string;
  explanation: string;
  actions: readonly [string, string, string];
  stopGate: string;
  exampleLabel: string;
  exampleHref: string;
  interviewEligible: boolean;
}

export interface DiagnosticDemoTrace {
  id: string;
  title: string;
  conclusion: string;
  claimIds: readonly string[];
  sourceIds: readonly string[];
  independentSourceKeys: readonly string[];
  carrierCount: number;
  independentSourceCount: number;
  cannotInfer: string;
  href: string;
  publicationStatus: 'local_review_only';
}

export const familyHistoryDiagnosticContract = {
  schemaVersion: 'family-history-start-v1',
  questionCount: 5,
  executionScope: 'browser_memory_only',
  storageScope: 'none_refresh_clears_answers',
  acceptsFreeText: false,
  acceptsFiles: false,
  sendsNetworkRequests: false,
  persistsAnswers: false,
  logsAnswerAnalytics: false,
  callsExternalModels: false,
  generatesHistoricalClaims: false,
  serviceStatus: 'small_scope_interview_only_not_paid_order',
  resultDisclaimer: '这是资料准备度诊断，不是历史事实鉴定、档案结论或服务报价。',
  mustNotDeploy: true,
} as const;

export const diagnosticQuestions: readonly DiagnosticQuestion[] = [
  {
    id: 'materials',
    prompt: '你手里的材料，现在更像哪一种状态？',
    helper: '这里只选择材料形态，不填写任何人名、地址或原文内容。',
    options: [
      {
        id: 'oral_and_photos',
        label: '主要是口述、照片和零散纸张',
        description: '线索很多，但还没有统一目录。',
        weights: { inventory_first: 3, privacy_first: 1 },
      },
      {
        id: 'mixed_files',
        label: '有一批 PDF、Word、扫描件和网页摘录',
        description: '文件不少，同一材料可能有多个副本。',
        weights: { inventory_first: 4 },
      },
      {
        id: 'archive_locators',
        label: '已有档号、书目或报刊线索',
        description: '知道一些来源入口，但还没形成任务单。',
        weights: { archive_first: 4 },
      },
      {
        id: 'organized_evidence',
        label: '已有目录、来源定位和较清楚的时间线',
        description: '材料结构比较稳定，想进一步形成内容。',
        weights: { narrative_first: 4 },
      },
    ],
  },
  {
    id: 'problem',
    prompt: '目前最卡住你的，是什么？',
    helper: '选择最想先解决的一项；诊断不会替你判断人物身份或历史功劳。',
    options: [
      {
        id: 'duplicates',
        label: '分不清原件、复印件、OCR 和二手转述',
        description: '担心同一来源被重复计算。',
        weights: { inventory_first: 5 },
      },
      {
        id: 'same_name',
        label: '同名、异写或跨年代记录对不上',
        description: '最需要的是身份分流和冲突表。',
        weights: { identity_first: 6 },
      },
      {
        id: 'where_to_search',
        label: '知道问题，但不知道下一步去哪里找',
        description: '需要把问题改写成可执行的调档任务。',
        weights: { archive_first: 6 },
      },
      {
        id: 'how_to_tell',
        label: '材料已有基础，但不知道怎样讲得真实又好看',
        description: '需要区分事实、有限外推和文学表达。',
        weights: { narrative_first: 6 },
      },
    ],
  },
  {
    id: 'scale',
    prompt: '材料大约有多少？',
    helper: '只选数量级，不需要上传清单。',
    options: [
      {
        id: 'under_20',
        label: '20 项以内',
        description: '可以先做一轮人工登记与问题清单。',
        weights: { inventory_first: 1, identity_first: 1 },
      },
      {
        id: '20_to_100',
        label: '20—100 项',
        description: '适合建立统一命名、哈希和来源家族。',
        weights: { inventory_first: 3 },
      },
      {
        id: 'over_100',
        label: '100 项以上',
        description: '需要批量索引，但历史判断仍由人工把关。',
        weights: { inventory_first: 4, archive_first: 1 },
      },
      {
        id: 'unknown_scale',
        label: '还数不清',
        description: '先把“有什么”看清，比立刻写故事更重要。',
        weights: { inventory_first: 4 },
      },
    ],
  },
  {
    id: 'privacy',
    prompt: '材料是否涉及在世亲属或授权不明内容？',
    helper: '只判断风险类型，不填写具体身份。',
    options: [
      {
        id: 'deceased_public_only',
        label: '主要是已故人物与公开材料',
        description: '仍需逐项核对版权与公开范围。',
        weights: {},
      },
      {
        id: 'living_people',
        label: '包含在世亲属信息',
        description: '应先建立脱敏、授权和访问分级。',
        weights: { privacy_first: 10 },
      },
      {
        id: 'private_correspondence',
        label: '包含私人通信、未成年人或家庭敏感内容',
        description: '在任何整理或展示之前先做隐私隔离。',
        weights: { privacy_first: 12 },
      },
      {
        id: 'privacy_unknown',
        label: '不确定',
        description: '不知道就先按较高敏感级处理。',
        weights: { privacy_first: 9 },
      },
    ],
  },
  {
    id: 'working_boundary',
    prompt: '现阶段，你愿意先整理到什么程度？',
    helper: '本页不会要求你提交任何材料；这只是帮助安排第一步。',
    options: [
      {
        id: 'local_inventory_only',
        label: '只想先在自己电脑里盘点',
        description: '从本地目录和隐私分级开始。',
        weights: { inventory_first: 2, privacy_first: 1 },
      },
      {
        id: 'redacted_catalogue',
        label: '可以整理一份脱敏目录',
        description: '只记录材料类型、年代和来源状态。',
        weights: { inventory_first: 2 },
      },
      {
        id: 'public_locators',
        label: '可以整理公开馆藏、书目和档号',
        description: '适合形成外部检索与调档任务单。',
        weights: { archive_first: 3 },
      },
      {
        id: 'boundary_unsure',
        label: '还没想好',
        description: '先看隐私与权利清单，再决定是否继续。',
        weights: { privacy_first: 4 },
      },
    ],
  },
] as const;

export const diagnosticTracks: Record<DiagnosticTrackId, DiagnosticTrack> = {
  privacy_first: {
    id: 'privacy_first',
    eyebrow: '建议起点 · 隐私优先',
    title: '先做隐私与授权清单',
    explanation: '你的选择中包含在世人物、私人通信或授权边界不明的风险。此时最重要的不是检索或写作，而是先决定什么能看、谁能看、什么绝不进入浏览器。',
    actions: [
      '把材料按公开、家庭可见、严格私密三档分开。',
      '只用角色称谓记录在世人物，不复制联系方式、证件和详细住址。',
      '为照片、书信与口述分别登记权利人和是否同意使用。',
    ],
    stopGate: '隐私与授权没有明确前，不上传原件、不进入普通留言，也不制作公开人物页。',
    exampleLabel: '阅读本站当前隐私边界',
    exampleHref: '/privacy',
    interviewEligible: false,
  },
  inventory_first: {
    id: 'inventory_first',
    eyebrow: '建议起点 · 资料体检',
    title: '先建立唯一原件登记表',
    explanation: '你的材料首先需要回答“有哪些作品、每份有几个载体”。把 PDF、OCR、转录和网页缓存分清后，后面的检索、图谱与写作才不会重复加权。',
    actions: [
      '为每项材料登记标题、年代、载体、可读范围和来源位置。',
      '用哈希与作品名称识别镜像副本和同一作品的不同载体。',
      '把口述、网页二传、小说与 AI 整理单独分层，不直接生成事实。',
    ],
    stopGate: '在来源家族尚未分清前，不统计“有几份证据”，也不开始完整传记。',
    exampleLabel: '看《绥行纪略》的载体去重',
    exampleHref: '/evidence/pingdiquan-1936',
    interviewEligible: true,
  },
  identity_first: {
    id: 'identity_first',
    eyebrow: '建议起点 · 身份分流',
    title: '先把同名与异写拆成不同人物轨',
    explanation: '你最需要的不是补全一条顺滑履历，而是把姓名、籍贯、年龄、学校、单位和年代逐项对齐，让不能同时成立的记录先分开。',
    actions: [
      '为每种姓名写法建立独立身份卡，不默认合并。',
      '列出至少两类可验证身份锚，并记录每一条的来源位置。',
      '建立冲突年表，明确哪些字段需要学籍、人事或军籍原档。',
    ],
    stopGate: '缺少明确异名字段、同一编号或多项独立身份锚时，只能写“候选同人”。',
    exampleLabel: '亲自比对蘇開元与蘇凱元',
    exampleHref: '/sukaiyuan/dossier',
    interviewEligible: true,
  },
  archive_first: {
    id: 'archive_first',
    eyebrow: '建议起点 · 调档路线',
    title: '把问题改写成一张可执行任务单',
    explanation: '你已经有一些书目、档号或明确问题。下一步不是继续泛搜，而是把机构、馆藏、检索词、时间窗和期望字段写成可以发送或现场执行的请求。',
    actions: [
      '把每个问题改成“要找哪个字段、由哪类材料回答”。',
      '登记馆藏机构、目录入口、档号、复制规则与联系状态。',
      '为每次检索保留日期、关键词、命中与失败原因。',
    ],
    stopGate: '目录题名、搜索命中和馆藏说明只能生成调档线索，不能替代正文。',
    exampleLabel: '查看本站原件与来源入口',
    exampleHref: '/archives',
    interviewEligible: true,
  },
  narrative_first: {
    id: 'narrative_first',
    eyebrow: '建议起点 · 证据型叙事',
    title: '在事实、外推与文学之间立边界',
    explanation: '你的材料已有一定结构，可以开始设计文章、纪念册或网站。但每一段仍要知道它依据哪条主张，以及哪些动作、对白和心理属于创作。',
    actions: [
      '先选择三到五个可以回到原文的关键节点。',
      '为每个段落标记事实、有限外推或文学表达。',
      '把来源入口和“不能推出什么”放进读者可见层。',
    ],
    stopGate: '任何写得很真的文学细节，都不能反向成为人物履历、图谱关系或媒体事实卡。',
    exampleLabel: '沿小说场景回到历史主张',
    exampleHref: '/evidence',
    interviewEligible: true,
  },
};

export const diagnosticDemoTraces: readonly DiagnosticDemoTrace[] = [
  {
    id: 'DEMO-SOURCE-FAMILY',
    title: '两个文件，为什么只算一个来源？',
    conclusion: 'SRC-002 是文字转录，SRC-013 是官方影印；它们属于《绥行纪略》同一作品家族。',
    claimIds: ['CL-013', 'CL-014'],
    sourceIds: ['SRC-002', 'SRC-013'],
    independentSourceKeys: ['work:suixing-jilue-1936'],
    carrierCount: 2,
    independentSourceCount: 1,
    cannotInfer: '不能因为有两个链接，就声称两份独立材料互相证明。',
    href: '/evidence/pingdiquan-1936',
    publicationStatus: 'local_review_only',
  },
  {
    id: 'DEMO-IDENTITY-BRIDGE',
    title: '多项字段相合，为什么仍是候选身份？',
    conclusion: 'SRC-103 与 SRC-104 提供姓名、籍贯、学校和时间窗线索，但仍缺原始学籍中的明确异名字段。',
    claimIds: ['CL-177', 'CL-181', 'CL-179'],
    sourceIds: ['SRC-103', 'SRC-104'],
    independentSourceKeys: ['archive:jacar-b05015400400', 'work:guo-roster-1977'],
    carrierCount: 2,
    independentSourceCount: 2,
    cannotInfer: '不能自动把不同姓名轨合并为一条完整生平。',
    href: '/sukaiyuan/dossier',
    publicationStatus: 'local_review_only',
  },
] as const;

const routeOrder: readonly DiagnosticTrackId[] = [
  'inventory_first',
  'identity_first',
  'archive_first',
  'narrative_first',
];

export function resolveDiagnosticTrack(
  answers: Partial<Record<DiagnosticQuestionId, string>>,
): DiagnosticTrack {
  if (answers.privacy && answers.privacy !== 'deceased_public_only') {
    return diagnosticTracks.privacy_first;
  }
  if (answers.working_boundary === 'boundary_unsure') {
    return diagnosticTracks.privacy_first;
  }

  const scores: Record<DiagnosticTrackId, number> = {
    privacy_first: 0,
    inventory_first: 0,
    identity_first: 0,
    archive_first: 0,
    narrative_first: 0,
  };

  for (const question of diagnosticQuestions) {
    const answer = answers[question.id];
    const option = question.options.find((candidate) => candidate.id === answer);
    if (!option) continue;
    for (const [trackId, weight] of Object.entries(option.weights) as Array<[DiagnosticTrackId, number]>) {
      scores[trackId] += weight;
    }
  }

  const winningTrack = routeOrder.reduce((current, candidate) =>
    scores[candidate] > scores[current] ? candidate : current,
  );
  return diagnosticTracks[winningTrack];
}

export function buildLowSensitivitySummary(
  answers: Partial<Record<DiagnosticQuestionId, string>>,
  track: DiagnosticTrack,
): string {
  const selectedLabels = diagnosticQuestions.map((question) => {
    const option = question.options.find((candidate) => candidate.id === answers[question.id]);
    return `${question.prompt} ${option?.label ?? '未回答'}`;
  });
  return [
    '家族史研究起步摘要（不含姓名与原件正文）',
    `推荐起点：${track.title}`,
    ...selectedLabels,
    `停止门：${track.stopGate}`,
    familyHistoryDiagnosticContract.resultDisclaimer,
  ].join('\n');
}

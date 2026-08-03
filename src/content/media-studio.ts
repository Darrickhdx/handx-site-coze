import {
  getMediaEligibleTopicParagraphs,
  topicArticles,
  type TopicMode,
  type TopicPublicationStatus,
  type TopicProvenanceLayer,
} from '@/content/topics';

export const mediaPackageStatuses = ['review_only', 'public_ready'] as const;
export type MediaPackageStatus = (typeof mediaPackageStatuses)[number];

export type EditorialLabel = 'fact' | 'interpretation' | 'fiction';

export type MediaPlatformId =
  | 'xiaohongshu'
  | 'short_video'
  | 'wechat_official'
  | 'moments'
  | 'long_video';

export type MediaThemeId =
  | 'archive_red'
  | 'minimal_mono'
  | 'documentary_film';

export interface EvidenceSnapshot {
  claim_ids: readonly string[];
  source_ids: readonly string[];
  excluded_claim_ids: readonly string[];
  excluded_source_ids: readonly string[];
}

export type MediaIdentityStatus =
  | 'verified'
  | 'not_applicable'
  | 'candidate';

export interface MediaClaimTrace {
  claim_id: string;
  status: 'working_verified' | 'provisional' | 'blocked';
  locator: string;
  source_ids: readonly string[];
  identity_status: MediaIdentityStatus;
  contains_key_person_causality: boolean;
}

export interface MediaSourceTrace {
  source_id: string;
  work_family_id: string;
  carrier_role: 'primary_record' | 'same_work_index' | 'independent_source';
  public_tier: 'P0' | 'P1' | 'P2' | 'P3';
  locator: string;
  public_url_status:
    | 'official_or_institutional'
    | 'registered_public_locator'
    | 'not_available';
  rights_status: 'review_reuse_allowed' | 'blocked';
  rights_basis: string;
  rights_registry_refs: readonly `RP-${string}`[];
  contains_family_private: boolean;
}

export interface MediaSourceFamilyTrace {
  work_family_id: string;
  source_ids: readonly string[];
  evidence_weight: 'one_independent_work';
  carrier_relationship: 'single_carrier' | 'same_work_multiple_carriers';
}

export interface MediaTraceability {
  claims: readonly MediaClaimTrace[];
  sources: readonly MediaSourceTrace[];
  source_families: readonly MediaSourceFamilyTrace[];
}

export interface RightsPassport {
  rights_id: `MRP-${string}`;
  owner: string;
  content_license: 'no-license-granted';
  rights_status: 'review_reuse_allowed' | 'blocked';
  rights_traceable: boolean;
  review_reuse_authorized: boolean;
  reuse_scope: 'internal_review_only' | 'blocked';
  rights_basis: string;
  registry_refs: readonly `RP-${string}`[];
  third_party_assets: 'excluded' | 'approved' | 'blocked';
  public_release_authorized: false;
  permitted_use: 'local_editorial_review';
}

export interface MediaContentRisks {
  contains_family_private: boolean;
  contains_unverified_identity: boolean;
  contains_key_person_causality: boolean;
}

export interface MediaMotherContent {
  id: string;
  title: string;
  shortTitle: string;
  angle: string;
  body: string;
  hook: string;
  topic_mode: TopicMode;
  editorial_label: EditorialLabel;
  disclosure_label: string;
  publication_status: TopicPublicationStatus;
  provenance_layer: TopicProvenanceLayer;
  revision_hash: `sha256:${string}`;
  evidence_snapshot: EvidenceSnapshot;
  traceability: MediaTraceability;
  rights_passport: RightsPassport;
  content_risks: MediaContentRisks;
}

export type MediaGateReasonCode =
  | 'not_for_media'
  | 'legacy_content'
  | 'mode_not_source_backed'
  | 'non_fact_editorial'
  | 'missing_editorial_disclosure'
  | 'missing_claim_trace'
  | 'missing_source_trace'
  | 'claim_not_verified'
  | 'unverified_identity'
  | 'key_person_causality'
  | 'family_private_material'
  | 'source_rights_blocked'
  | 'rights_not_traceable'
  | 'rights_reuse_not_allowed'
  | 'third_party_rights_blocked'
  | 'excluded_evidence_present'
  | 'unsafe_content_fragment';

export interface MediaGateDecision {
  decision: 'allow_review_package' | 'blocked';
  allowed: boolean;
  reasons: readonly MediaGateReasonCode[];
}

export const mediaGateReasonLabels: Record<MediaGateReasonCode, string> = {
  not_for_media: '专题已标记为不得进入媒体素材',
  legacy_content: 'Legacy 旧研究线索不得进入传播包',
  mode_not_source_backed: '问题或解释内容只能预览，只有来源支持的段落可以导出',
  non_fact_editorial: '可导出内容必须明确标记为来源支持的事实摘录',
  missing_editorial_disclosure: '问题、解释或文学内容缺少显式标签',
  missing_claim_trace: '主张编号没有完整的定位记录',
  missing_source_trace: '来源编号没有完整的定位记录',
  claim_not_verified: '主张仍处于暂存或阻断状态',
  unverified_identity: '真人身份尚未闭环',
  key_person_causality: '包含未经核验的真人关键因果',
  family_private_material: '包含家属私密材料',
  source_rights_blocked: '来源的本次复用权利未确认',
  rights_not_traceable: '母内容权利护照不可追溯',
  rights_reuse_not_allowed: '母内容未授权本地审稿复用',
  third_party_rights_blocked: '第三方资产未获本次使用许可',
  excluded_evidence_present: '仍携带被排除的主张或来源',
  unsafe_content_fragment: '正文含本机路径、凭证或其他敏感片段',
};

export interface MediaTheme {
  id: MediaThemeId;
  name: string;
  description: string;
  colors: {
    background: string;
    foreground: string;
    accent: string;
    muted: string;
  };
  treatment: string;
}

export interface MediaPlatform {
  id: MediaPlatformId;
  name: string;
  channelLabel: string;
  dimensions: {
    width: number;
    height: number;
  };
  deliverables: readonly string[];
  direct_publish: false;
  workspace_links: readonly {
    label: string;
    href: string;
  }[];
}

export interface DistributionPackage {
  schema_version: '1.1';
  package_id: string;
  package_status: MediaPackageStatus;
  generated_at: string;
  source: {
    id: string;
    revision_hash: `sha256:${string}`;
    title: string;
    topic_mode: 'source_backed';
    editorial_label: EditorialLabel;
    disclosure_label: string;
  };
  platform: {
    id: MediaPlatformId;
    name: string;
    dimensions: MediaPlatform['dimensions'];
    direct_publish: false;
  };
  theme: {
    id: MediaThemeId;
    name: string;
  };
  evidence_snapshot: EvidenceSnapshot;
  traceability: MediaTraceability;
  rights_passport: RightsPassport;
  gate: {
    decision: 'allow_review_package';
    reasons: readonly [];
  };
  policy: {
    must_not_deploy: true;
    auto_publish: false;
    external_egress: 'deny';
    platform_accounts_connected: false;
  };
  delivery: {
    method: 'browser_zip';
    contains_localhost_links: false;
    contains_platform_token: false;
    human_review_required: true;
    auto_publish: false;
    external_egress: 'deny';
  };
  manual_review_checklist: readonly string[];
}

const comparisonTopic = topicArticles[0];
const safeTopicParagraphs = getMediaEligibleTopicParagraphs(comparisonTopic);
const excludedTopicParagraphs = comparisonTopic.sections
  .flatMap((section) => [...section.paragraphs])
  .filter(
    (paragraph) =>
      paragraph.publication_status === 'not_for_media',
  );

const comparisonTopicBody = safeTopicParagraphs
  .map((paragraph) => paragraph.text)
  .join('\n\n');

const comparisonTopicClaims = [
  ...new Set(safeTopicParagraphs.flatMap((paragraph) => paragraph.claim_ids)),
];
const comparisonTopicSources = [
  ...new Set(safeTopicParagraphs.flatMap((paragraph) => paragraph.source_ids)),
];
const excludedTopicClaims = [
  ...new Set(
    excludedTopicParagraphs.flatMap((paragraph) => paragraph.claim_ids),
  ),
];
const excludedTopicSources = [
  ...new Set(
    excludedTopicParagraphs.flatMap((paragraph) => paragraph.source_ids),
  ),
];

const comparisonRightsPassport: RightsPassport = {
  rights_id: 'MRP-HANDX-EDITORIAL-V1',
  owner: '韩大昕／鉴真小秃驴',
  content_license: 'no-license-granted',
  rights_status: 'review_reuse_allowed',
  rights_traceable: true,
  review_reuse_authorized: true,
  reuse_scope: 'internal_review_only',
  rights_basis: '本站原创专题编辑内容，只允许在本机生成审稿包',
  registry_refs: [
    'RP-TOPIC-dong-yan-su-evidence-visibility-visibility-not-ranking',
    'RP-TOPIC-dong-yan-su-evidence-visibility-three-visibility-paths',
  ],
  third_party_assets: 'excluded',
  public_release_authorized: false,
  permitted_use: 'local_editorial_review',
};

const blockedRightsPassport: RightsPassport = {
  ...comparisonRightsPassport,
  rights_id: 'MRP-LEGACY-BLOCKED-V1',
  rights_status: 'blocked',
  review_reuse_authorized: false,
  reuse_scope: 'blocked',
  rights_basis: 'Legacy 内容未建立可复用权利链',
  registry_refs: [],
};

const pingdiquanRightsPassport: RightsPassport = {
  ...comparisonRightsPassport,
  rights_id: 'MRP-TOPIC-PINGDIQUAN-V1',
  rights_basis: '本站原创专题段落，只复用文字与来源定位，不打包第三方影印',
  registry_refs: [
    'RP-TOPIC-dong-yan-su-evidence-visibility-pingdiquan-contemporaneous-anchor',
    'RP-TOPIC-dong-yan-su-evidence-visibility-student-organization-response',
  ],
};

const dongqiwuRightsPassport: RightsPassport = {
  ...comparisonRightsPassport,
  rights_id: 'MRP-TOPIC-DONGQIWU-V1',
  rights_basis: '本站原创专题段落的审稿改写，只复用文字与来源定位',
  registry_refs: [
    'RP-TOPIC-dong-yan-su-evidence-visibility-dongqiwu-gazette-anchor',
  ],
};

const methodRightsPassport: RightsPassport = {
  ...comparisonRightsPassport,
  rights_id: 'MRP-ARTICLE-AI-METHOD-V1',
  rights_basis: '本站原创方法论，只允许内部审稿复用',
  registry_refs: ['RP-DISC-003'],
};

const jacarBlockedRightsPassport: RightsPassport = {
  ...blockedRightsPassport,
  rights_id: 'MRP-SOURCE-JACAR-BLOCKED-V1',
  rights_basis: '当前仅有来源元数据引用权利登记，未建立媒体改写护照',
  registry_refs: ['RP-SOURCE-SRC-095'],
};

const claimTraces: Record<string, MediaClaimTrace> = {
  'CL-013': {
    claim_id: 'CL-013',
    status: 'working_verified',
    locator:
      'SRC-013《国立清华大学校刊》第792号第2版《绥行纪略》连续段；二十一日晨到平地泉、早饭后“遇留守司令苏开元团长”',
    source_ids: ['SRC-002', 'SRC-013'],
    identity_status: 'candidate',
    contains_key_person_causality: false,
  },
  'CL-014': {
    claim_id: 'CL-014',
    status: 'working_verified',
    locator:
      'SRC-013《国立清华大学校刊》第792号第2版《绥行纪略》连续段；二十一日平地泉段全文',
    source_ids: ['SRC-002', 'SRC-013'],
    identity_status: 'candidate',
    contains_key_person_causality: false,
  },
  'CL-112': {
    claim_id: 'CL-112',
    status: 'working_verified',
    locator: '第1075号PDF物理页3；官职库董其武姓名页第1笔',
    source_ids: ['SRC-039', 'SRC-062'],
    identity_status: 'verified',
    contains_key_person_causality: false,
  },
  'CL-167': {
    claim_id: 'CL-167',
    status: 'working_verified',
    locator: 'JACAR C13031948700原PDF物理页2顶部；官方元数据同段翻刻',
    source_ids: ['SRC-095'],
    identity_status: 'not_applicable',
    contains_key_person_causality: false,
  },
};

const sourceTraces: Record<string, MediaSourceTrace> = {
  'SRC-013': {
    source_id: 'SRC-013',
    work_family_id: 'WORK-QINGHUA-XIAOKAN-792-SUIXINGJILUE',
    carrier_role: 'primary_record',
    public_tier: 'P0',
    locator:
      '整期PDF第1—2版；第2版中下部《绥行纪略》连续段；条目sysID=81937',
    public_url_status: 'official_or_institutional',
    rights_status: 'review_reuse_allowed',
    rights_basis: '仅复用来源元数据、定位与必要短引，不打包影印页',
    rights_registry_refs: [
      'RP-TOPIC-dong-yan-su-evidence-visibility-pingdiquan-contemporaneous-anchor',
      'RP-TOPIC-dong-yan-su-evidence-visibility-student-organization-response',
    ],
    contains_family_private: false,
  },
  'SRC-039': {
    source_id: 'SRC-039',
    work_family_id: 'WORK-GOV-GAZETTE-1075-DONGQIWU',
    carrier_role: 'primary_record',
    public_tier: 'P0',
    locator: 'PDF物理页3附近军职任命表',
    public_url_status: 'official_or_institutional',
    rights_status: 'review_reuse_allowed',
    rights_basis: '仅复用公报元数据、定位与有边界的转述，不打包影印页',
    rights_registry_refs: [
      'RP-TOPIC-dong-yan-su-evidence-visibility-dongqiwu-gazette-anchor',
    ],
    contains_family_private: false,
  },
  'SRC-062': {
    source_id: 'SRC-062',
    work_family_id: 'WORK-GOV-GAZETTE-1075-DONGQIWU',
    carrier_role: 'same_work_index',
    public_tier: 'P0',
    locator: '姓名页第1笔；对应第1075号PDF物理页3',
    public_url_status: 'registered_public_locator',
    rights_status: 'review_reuse_allowed',
    rights_basis: '仅复用公开目录定位与有边界的转述',
    rights_registry_refs: [
      'RP-TOPIC-dong-yan-su-evidence-visibility-dongqiwu-gazette-anchor',
    ],
    contains_family_private: false,
  },
  'SRC-095': {
    source_id: 'SRC-095',
    work_family_id: 'WORK-JACAR-C13031948700',
    carrier_role: 'primary_record',
    public_tier: 'P0',
    locator:
      'Ref.C13031948700；原PDF物理页2顶部‘第八战区副司令傅作义指挥部队’机关人员；JACAR元数据翻刻同段',
    public_url_status: 'official_or_institutional',
    rights_status: 'blocked',
    rights_basis: '当前权利登记只允许来源元数据引用，禁止进入媒体导出',
    rights_registry_refs: ['RP-SOURCE-SRC-095'],
    contains_family_private: false,
  },
};

function makeTraceability(
  claimIds: readonly string[],
  sourceIds: readonly string[],
): MediaTraceability {
  const sources = sourceIds.flatMap((id) =>
    sourceTraces[id] ? [sourceTraces[id]] : [],
  );
  const sourceFamilies = [...new Set(sources.map((source) => source.work_family_id))]
    .map((workFamilyId) => {
      const members = sources.filter(
        (source) => source.work_family_id === workFamilyId,
      );
      return {
        work_family_id: workFamilyId,
        source_ids: members.map((source) => source.source_id),
        evidence_weight: 'one_independent_work' as const,
        carrier_relationship:
          members.length > 1
            ? ('same_work_multiple_carriers' as const)
            : ('single_carrier' as const),
      };
    });
  return {
    claims: claimIds.flatMap((id) => (claimTraces[id] ? [claimTraces[id]] : [])),
    sources,
    source_families: sourceFamilies,
  };
}

const safeContentRisks: MediaContentRisks = {
  contains_family_private: false,
  contains_unverified_identity: false,
  contains_key_person_causality: false,
};

export const allMediaMotherContent = [
  {
    id: 'topic-evidence-visibility',
    title: comparisonTopic.title,
    shortTitle: '三个人，三种被历史看见的方式',
    angle: '不比功劳大小，比较证据怎样进入公共记忆。',
    hook: '为什么有些人进入史册，有些人仍停在档案边缘？',
    body: comparisonTopicBody,
    topic_mode: 'interpretation',
    editorial_label: 'interpretation',
    disclosure_label: '观点／解释，不是史实结论',
    publication_status: 'review_only',
    provenance_layer: 'editorial',
    revision_hash:
      'sha256:064db7991578edc051032a9cbae920ba94de9fc39769daeb1e16d1dd0ee7de64',
    evidence_snapshot: {
      claim_ids: comparisonTopicClaims,
      source_ids: comparisonTopicSources,
      excluded_claim_ids: excludedTopicClaims,
      excluded_source_ids: excludedTopicSources,
    },
    traceability: makeTraceability(
      comparisonTopicClaims,
      comparisonTopicSources,
    ),
    rights_passport: comparisonRightsPassport,
    content_risks: {
      ...safeContentRisks,
      contains_unverified_identity: true,
    },
  },
  {
    id: 'pingdiquan-source-window',
    title: '朱自清在平地泉遇见了谁？',
    shortTitle: '1936年的一条同期记录',
    angle: '用一张旧报版面，解释“可以确认”和“仍然不知道”的边界。',
    hook: '一句“留守司令苏开元团长”，到底能证明多少？',
    body:
      '1936年11月21日的平地泉段落中，朱自清写到“遇留守司令苏开元团长”。同一段还记录了学生救国会组织方式的讨论。这条同期记录能够支持记录者、日期、地点、称谓和答复大意，却不能独自完成家族身份桥，也不能推出完整履历、组织身份或后来的行动。',
    topic_mode: 'source_backed',
    editorial_label: 'fact',
    disclosure_label: '来源支持的最小事实；身份桥仍待核',
    publication_status: 'review_only',
    provenance_layer: 'audited',
    revision_hash:
      'sha256:e7dd52b12a5fca0c28b5a8c15e394b0b10ae8e74b73f35897a2ba2f2dc113d57',
    evidence_snapshot: {
      claim_ids: ['CL-013', 'CL-014'],
      source_ids: ['SRC-013'],
      excluded_claim_ids: [],
      excluded_source_ids: [],
    },
    traceability: makeTraceability(
      ['CL-013', 'CL-014'],
      ['SRC-013'],
    ),
    rights_passport: pingdiquanRightsPassport,
    content_risks: {
      ...safeContentRisks,
      contains_unverified_identity: true,
    },
  },
  {
    id: 'jacar-1942-document-window',
    title: '1942年日方编成表留下了什么？',
    shortTitle: '一条可回到原页的1942年列名',
    angle: '只讲档案在这一页写了什么，不把列名扩写成完整履历。',
    hook: '李大超与“蘇開元”，为什么会出现在同一张编成表里？',
    body:
      '1942年8月的日方《第八战区编成表》在傅作义指挥部队项下，把李大超与“蘇開元”并列为高级参议。JACAR档案号为C13031948700，定位在原PDF物理页2顶部。它能证明这份日方文件在这一页如此列名，不能代替中方任命令，也不能单独证明更长任期、秘密身份或具体行动。',
    topic_mode: 'source_backed',
    editorial_label: 'fact',
    disclosure_label: '来源支持的文献内容；不作跨档案身份推断',
    publication_status: 'review_only',
    provenance_layer: 'audited',
    revision_hash:
      'sha256:b8cba85fae85d6b08f67dae36e222b11530943896d3677d0fe982846b0527386',
    evidence_snapshot: {
      claim_ids: ['CL-167'],
      source_ids: ['SRC-095'],
      excluded_claim_ids: [],
      excluded_source_ids: [],
    },
    traceability: makeTraceability(['CL-167'], ['SRC-095']),
    rights_passport: jacarBlockedRightsPassport,
    content_risks: safeContentRisks,
  },
  {
    id: 'dongqiwu-1933-appointment-record',
    title: '一条公报怎样成为人物时间线的锚点？',
    shortTitle: '1933年董其武任命记录',
    angle: '把纸面任命、任期与后来行动分开，不让一条记录承担过多结论。',
    hook: '1933年3月9日的公报，究竟确认了董其武的哪一步？',
    body:
      '《国民政府公报》第1075号记录，1933年3月9日任命董其武为第七十三师第二百十八旅第四百三十六团团长。原公报可定位到PDF物理页3，官职资料库姓名页第1笔提供对应索引。这条记录支持该次纸面任命，不自动证明实际任期长度、所有后续行动，也不能反向补证苏开元的经历。',
    topic_mode: 'source_backed',
    editorial_label: 'fact',
    disclosure_label: '来源支持的任命记录；不外推任期与后果',
    publication_status: 'review_only',
    provenance_layer: 'audited',
    revision_hash:
      'sha256:2da00fc2f0b28091bbb5e8d9b4ebadac3f952d1dc14ae1e8cee7ca01b13d2d4b',
    evidence_snapshot: {
      claim_ids: ['CL-112'],
      source_ids: ['SRC-039', 'SRC-062'],
      excluded_claim_ids: [],
      excluded_source_ids: [],
    },
    traceability: makeTraceability(
      ['CL-112'],
      ['SRC-039', 'SRC-062'],
    ),
    rights_passport: dongqiwuRightsPassport,
    content_risks: safeContentRisks,
  },
  {
    id: 'fix-method-boundary',
    title: '历史小说为什么需要 F／I／X 三层合同？',
    shortTitle: 'AI 写家族史，最危险的是“太像真的”',
    angle: '把史实、合理外推和纯虚构分别标出来。',
    hook: '故事可以很真，但不能因此升级成史实。',
    body:
      'F 是可回到来源定位的最小事实，I 是从事实出发且明确止步位置的合理外推，X 是对白、行动细节和合成人物等文学构造。三层合同的作用不是削弱故事，而是让创作保持自由的同时，不反向污染真人历史。',
    topic_mode: 'interpretation',
    editorial_label: 'interpretation',
    disclosure_label: '研究方法解释，不是历史事实主张',
    publication_status: 'review_only',
    provenance_layer: 'editorial',
    revision_hash:
      'sha256:d04f1480630a4d0596c6619f8f35acd34fca86138a9df74d7b2c73de06d3853e',
    evidence_snapshot: {
      claim_ids: [],
      source_ids: [],
      excluded_claim_ids: [],
      excluded_source_ids: [],
    },
    traceability: makeTraceability([], []),
    rights_passport: methodRightsPassport,
    content_risks: safeContentRisks,
  },
  {
    id: 'legacy-comparison-draft',
    title: '旧稿人物功劳排名',
    shortTitle: 'Legacy 线索样本',
    angle: '旧稿保留为研究迁移对象。',
    hook: '这条内容不应进入任何传播素材。',
    body:
      '旧稿中的人物排名、政治身份和关键因果尚未完成原子主张与来源定位，不能用于媒体传播。',
    topic_mode: 'interpretation',
    editorial_label: 'interpretation',
    disclosure_label: 'Legacy 线索，不构成史实',
    publication_status: 'not_for_media',
    provenance_layer: 'legacy',
    revision_hash:
      'sha256:67b5b101a82a0d0558fd37dba5b5c319df1d7ce25fc4ada65570f4032d2983bc',
    evidence_snapshot: {
      claim_ids: ['LEGACY-UNVERIFIED'],
      source_ids: ['LEGACY-DRAFT'],
      excluded_claim_ids: ['LEGACY-UNVERIFIED'],
      excluded_source_ids: ['LEGACY-DRAFT'],
    },
    traceability: makeTraceability([], []),
    rights_passport: blockedRightsPassport,
    content_risks: {
      ...safeContentRisks,
      contains_unverified_identity: true,
      contains_key_person_causality: true,
    },
  },
] as const satisfies readonly MediaMotherContent[];

const unsafeContentPatterns = [
  /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?/iu,
  /(?:file:\/\/|\/users\/|\/home\/)/iu,
  /(?:bearer\s+[a-z0-9._~-]+|appsecret|oauth[_-]?token|api[_-]?key)/iu,
] as const;

export function evaluateMediaGate(
  content: MediaMotherContent,
): MediaGateDecision {
  const reasons: MediaGateReasonCode[] = [];
  const add = (reason: MediaGateReasonCode) => {
    if (!reasons.includes(reason)) reasons.push(reason);
  };

  if (content.publication_status === 'not_for_media') add('not_for_media');
  if (content.provenance_layer === 'legacy') add('legacy_content');
  if (content.topic_mode !== 'source_backed') add('mode_not_source_backed');
  if (
    content.topic_mode === 'source_backed' &&
    content.editorial_label !== 'fact'
  ) {
    add('non_fact_editorial');
  }
  if (content.disclosure_label.trim().length < 4) {
    add('missing_editorial_disclosure');
  }
  if (
    content.evidence_snapshot.excluded_claim_ids.length > 0 ||
    content.evidence_snapshot.excluded_source_ids.length > 0
  ) {
    add('excluded_evidence_present');
  }

  const tracedClaimIds = new Set(
    content.traceability.claims.map((claim) => claim.claim_id),
  );
  const tracedSourceIds = new Set(
    content.traceability.sources.map((source) => source.source_id),
  );
  if (
    content.evidence_snapshot.claim_ids.length === 0 ||
    content.evidence_snapshot.claim_ids.some((id) => !tracedClaimIds.has(id))
  ) {
    add('missing_claim_trace');
  }
  if (
    content.evidence_snapshot.source_ids.length === 0 ||
    content.evidence_snapshot.source_ids.some((id) => !tracedSourceIds.has(id))
  ) {
    add('missing_source_trace');
  }
  if (
    content.traceability.claims.some(
      (claim) => claim.status !== 'working_verified' || !claim.locator.trim(),
    )
  ) {
    add('claim_not_verified');
  }
  if (
    content.content_risks.contains_unverified_identity ||
    content.traceability.claims.some(
      (claim) => claim.identity_status === 'candidate',
    )
  ) {
    add('unverified_identity');
  }
  if (
    content.content_risks.contains_key_person_causality ||
    content.traceability.claims.some(
      (claim) => claim.contains_key_person_causality,
    )
  ) {
    add('key_person_causality');
  }
  if (
    content.content_risks.contains_family_private ||
    content.traceability.sources.some(
      (source) => source.contains_family_private,
    )
  ) {
    add('family_private_material');
  }
  if (
    content.traceability.sources.some(
      (source) =>
        source.public_tier !== 'P0' ||
        source.rights_status !== 'review_reuse_allowed' ||
        !source.locator.trim() ||
        !source.rights_basis.trim() ||
        source.rights_registry_refs.length === 0,
    )
  ) {
    add('source_rights_blocked');
  }
  if (
    !content.rights_passport.rights_traceable ||
    !content.rights_passport.rights_id.trim() ||
    !content.rights_passport.rights_basis.trim() ||
    content.rights_passport.registry_refs.length === 0
  ) {
    add('rights_not_traceable');
  }
  if (
    !content.rights_passport.review_reuse_authorized ||
    content.rights_passport.rights_status !== 'review_reuse_allowed' ||
    content.rights_passport.reuse_scope !== 'internal_review_only'
  ) {
    add('rights_reuse_not_allowed');
  }
  if (content.rights_passport.third_party_assets === 'blocked') {
    add('third_party_rights_blocked');
  }
  if (
    unsafeContentPatterns.some((pattern) =>
      pattern.test(
        [content.title, content.hook, content.angle, content.body].join('\n'),
      ),
    )
  ) {
    add('unsafe_content_fragment');
  }

  return {
    decision: reasons.length === 0 ? 'allow_review_package' : 'blocked',
    allowed: reasons.length === 0,
    reasons,
  };
}

export function isMediaEligible(
  content: MediaMotherContent,
): content is MediaMotherContent {
  return evaluateMediaGate(content).allowed;
}

export const mediaMotherContent: readonly MediaMotherContent[] =
  allMediaMotherContent.filter(isMediaEligible);

export const mediaThemes = [
  {
    id: 'archive_red',
    name: '档案红',
    description: '旧纸、朱红与黑墨，适合史料、人物和问题卡。',
    colors: {
      background: '#f1eadc',
      foreground: '#242927',
      accent: '#8b312b',
      muted: '#746e64',
    },
    treatment: '纸张编号 · 档案印章 · 细线网格',
  },
  {
    id: 'minimal_mono',
    name: '极简黑白',
    description: '高对比留白与大字标题，适合方法论和观点摘要。',
    colors: {
      background: '#f7f6f2',
      foreground: '#151716',
      accent: '#151716',
      muted: '#777a77',
    },
    treatment: '大字标题 · 极细分隔 · 无装饰底图',
  },
  {
    id: 'documentary_film',
    name: '胶片纪实',
    description: '深灰片场、暖色字幕与时间码，适合视频封面和口播。',
    colors: {
      background: '#202827',
      foreground: '#f3efe7',
      accent: '#c38a82',
      muted: '#bdb9b0',
    },
    treatment: '胶片颗粒 · 时间码 · 纪实字幕',
  },
] as const satisfies readonly MediaTheme[];

export const mediaPlatforms = [
  {
    id: 'xiaohongshu',
    name: '小红书图文',
    channelLabel: '小红书',
    dimensions: { width: 1080, height: 1440 },
    deliverables: ['封面 PNG', '多页卡片文案', '标题与话题'],
    direct_publish: false,
    workspace_links: [
      {
        label: '打开小红书创作服务平台',
        href: 'https://creator.xiaohongshu.com/',
      },
    ],
  },
  {
    id: 'short_video',
    name: '竖屏短视频',
    channelLabel: '抖音 · 视频号 · 快手',
    dimensions: { width: 1080, height: 1920 },
    deliverables: ['竖屏封面 PNG', '30–60秒口播稿', '分镜与 SRT 字幕'],
    direct_publish: false,
    workspace_links: [
      {
        label: '打开抖音创作者中心',
        href: 'https://creator.douyin.com/',
      },
      {
        label: '打开快手创作者服务平台',
        href: 'https://cp.kuaishou.com/',
      },
      {
        label: '打开微信公众平台',
        href: 'https://channels.weixin.qq.com/',
      },
    ],
  },
  {
    id: 'wechat_official',
    name: '公众号长文',
    channelLabel: '微信公众号',
    dimensions: { width: 1080, height: 1440 },
    deliverables: ['头图 PNG', '富文本 HTML', '摘要与文末来源'],
    direct_publish: false,
    workspace_links: [
      {
        label: '打开微信公众平台',
        href: 'https://mp.weixin.qq.com/',
      },
    ],
  },
  {
    id: 'moments',
    name: '朋友圈海报',
    channelLabel: '微信朋友圈',
    dimensions: { width: 1080, height: 1440 },
    deliverables: ['分享海报 PNG', '短文案', '人工检查清单'],
    direct_publish: false,
    workspace_links: [],
  },
  {
    id: 'long_video',
    name: '横屏长视频',
    channelLabel: 'B站 · YouTube',
    dimensions: { width: 1920, height: 1080 },
    deliverables: ['横屏封面 PNG', '长视频脚本', '章节与 SRT/VTT'],
    direct_publish: false,
    workspace_links: [
      {
        label: '打开 B站创作中心',
        href: 'https://member.bilibili.com/platform/upload/video/frame',
      },
      {
        label: '打开 YouTube Studio',
        href: 'https://studio.youtube.com/',
      },
    ],
  },
] as const satisfies readonly MediaPlatform[];

export const mediaReviewChecklist = [
  '标题没有把提问改写成已证结论。',
  '真人身份、政治身份、行动与历史后果均未越过证据定位。',
  '图片、引文和音乐拥有本次使用所需的权利。',
  '素材不含家属私密材料、绝对路径、管理员令牌或平台凭证。',
  '所有外链均面向可公开地址，且不包含本机地址。',
  '发布前由本人完成平台预览与最终确认。',
] as const;

export function getMediaMotherContent(
  id: string,
): MediaMotherContent | undefined {
  return mediaMotherContent.find((content) => content.id === id);
}

export function getMediaTheme(id: string): MediaTheme | undefined {
  return mediaThemes.find((theme) => theme.id === id);
}

export function getMediaPlatform(id: string): MediaPlatform | undefined {
  return mediaPlatforms.find((platform) => platform.id === id);
}

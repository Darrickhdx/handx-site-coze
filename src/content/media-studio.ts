import {
  getMediaEligibleTopicParagraphs,
  topicArticles,
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

export interface RightsPassport {
  owner: string;
  content_license: 'no-license-granted';
  third_party_assets: 'excluded';
  public_release_authorized: false;
  permitted_use: 'local_editorial_review';
}

export interface MediaMotherContent {
  id: string;
  title: string;
  shortTitle: string;
  angle: string;
  body: string;
  hook: string;
  editorial_label: EditorialLabel;
  publication_status: TopicPublicationStatus;
  provenance_layer: TopicProvenanceLayer;
  revision_hash: `sha256:${string}`;
  evidence_snapshot: EvidenceSnapshot;
  rights_passport: RightsPassport;
}

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
  schema_version: '1.0';
  package_id: string;
  package_status: MediaPackageStatus;
  generated_at: string;
  source: {
    id: string;
    revision_hash: `sha256:${string}`;
    title: string;
    editorial_label: EditorialLabel;
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
  rights_passport: RightsPassport;
  delivery: {
    method: 'browser_zip';
    contains_localhost_links: false;
    contains_platform_token: false;
    human_review_required: true;
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

const defaultRightsPassport: RightsPassport = {
  owner: '韩大昕／鉴真小秃驴',
  content_license: 'no-license-granted',
  third_party_assets: 'excluded',
  public_release_authorized: false,
  permitted_use: 'local_editorial_review',
};

export const allMediaMotherContent = [
  {
    id: 'topic-evidence-visibility',
    title: comparisonTopic.title,
    shortTitle: '三个人，三种被历史看见的方式',
    angle: '不比功劳大小，比较证据怎样进入公共记忆。',
    hook: '为什么有些人进入史册，有些人仍停在档案边缘？',
    body: comparisonTopicBody,
    editorial_label: 'interpretation',
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
    rights_passport: defaultRightsPassport,
  },
  {
    id: 'pingdiquan-source-window',
    title: '朱自清在平地泉遇见了谁？',
    shortTitle: '1936年的一条同期记录',
    angle: '用一张旧报版面，解释“可以确认”和“仍然不知道”的边界。',
    hook: '一句“留守司令苏开元团长”，到底能证明多少？',
    body:
      '1936年11月21日的平地泉段落中，朱自清写到“遇留守司令苏开元团长”。同一段还记录了学生救国会组织方式的讨论。这条同期记录能够支持记录者、日期、地点、称谓和答复大意，却不能独自完成家族身份桥，也不能推出完整履历、组织身份或后来的行动。',
    editorial_label: 'fact',
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
    rights_passport: defaultRightsPassport,
  },
  {
    id: 'fix-method-boundary',
    title: '历史小说为什么需要 F／I／X 三层合同？',
    shortTitle: 'AI 写家族史，最危险的是“太像真的”',
    angle: '把史实、合理外推和纯虚构分别标出来。',
    hook: '故事可以很真，但不能因此升级成史实。',
    body:
      'F 是可回到来源定位的最小事实，I 是从事实出发且明确止步位置的合理外推，X 是对白、行动细节和合成人物等文学构造。三层合同的作用不是削弱故事，而是让创作保持自由的同时，不反向污染真人历史。',
    editorial_label: 'interpretation',
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
    rights_passport: defaultRightsPassport,
  },
  {
    id: 'legacy-comparison-draft',
    title: '旧稿人物功劳排名',
    shortTitle: 'Legacy 线索样本',
    angle: '旧稿保留为研究迁移对象。',
    hook: '这条内容不应进入任何传播素材。',
    body:
      '旧稿中的人物排名、政治身份和关键因果尚未完成原子主张与来源定位，不能用于媒体传播。',
    editorial_label: 'interpretation',
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
    rights_passport: defaultRightsPassport,
  },
] as const satisfies readonly MediaMotherContent[];

export function isMediaEligible(
  content: MediaMotherContent,
): content is MediaMotherContent {
  return (
    content.publication_status !== 'not_for_media' &&
    content.provenance_layer !== 'legacy'
  );
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

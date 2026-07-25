export type ArticleRightsStatus = 'draft_all_rights_reserved';

export interface ArticleSourceCredit {
  sourceId: string;
  creator: string;
  title: string;
  publisher: string;
  date: string;
  href: string;
  relationship: string;
}

export interface ArticleRightsPassport {
  rightsId: `RP-DISC-${string}`;
  slug: '1936-pingdiquan' | 'same-name' | 'ai-family-history';
  status: ArticleRightsStatus;
  statusLabel: string;
  author: string;
  authorRole: string;
  version: string;
  canonicalPath: string;
  publicUrl: null;
  licenseState: 'no-license-granted';
  originalRights: string;
  linkSharing: string;
  quotationRule: string;
  permissionRequired: string;
  sourceBoundary: string;
  historicalFactsBoundary: string;
  commercialFictionBoundary: string;
  citation: string;
  teaser: string;
  sourceCredits: readonly ArticleSourceCredit[];
  thirdPartyMaterials: readonly {
    materialId: string;
    kind: 'short-quotation' | 'facsimile';
    creator: string;
    workTitle: string;
    sourceId: string;
    locator: string;
    sourceUrl: string;
    assetPath?: string;
    displayScope: string;
    publishability: 'local-preview-only' | 'external-link-only' | 'necessary-quotation-only';
    reuseNotice: string;
  }[];
}

const common = {
  status: 'draft_all_rights_reserved' as const,
  statusLabel: '本地审阅稿 · 尚未发放转载许可',
  author: '鉴真小秃驴',
  authorRole: '原创策划、研究判断与最终编辑；AI 辅助检索、整理与表达',
  version: '2026-07-24 · v1',
  publicUrl: null,
  licenseState: 'no-license-granted' as const,
  originalRights: '本文的原创文字、结构与可视化编排 © 2026 鉴真小秃驴，当前保留全部权利。',
  linkSharing: '可以直接分享原文链接，并建议同时保留作者与标题；分享链接不等于复制正文。',
  quotationRule:
    '法律允许范围内的合理引用，应明确标注作者、文章标题、原文链接，并保留被引史料的原作者与出处；不得改变“已证／未证”的原意。',
  permissionRequired:
    '全文或大段转载、翻译、音视频改编、课程／数据库收录、商业传播及 AI 训练，均须事先取得书面授权。',
  sourceBoundary:
    '下列史料、馆藏影印、第三方引文与机构页面不包含在本文原创文字权利中；它们分别遵循原作者、馆藏机构或权利人的规则。',
  historicalFactsBoundary:
    '历史事实不由本站独占。任何人都可以独立核验，并用自己的语言叙述；本站保护的是原创写法、考证路径、选择编排、注释与可视化表达。',
  commercialFictionBoundary:
    '小说人物设定、剧情、样章、剧本、故事圣经及影视开发方案全部保留权利；公开史实与研究方法不构成小说或影视改编授权。',
} as const;

export const articleRightsPassports: Record<ArticleRightsPassport['slug'], ArticleRightsPassport> = {
  '1936-pingdiquan': {
    ...common,
    rightsId: 'RP-DISC-001',
    slug: '1936-pingdiquan',
    canonicalPath: '/discover/1936-pingdiquan',
    citation:
      '鉴真小秃驴：《朱自清在平地泉遇见了谁？》，苏开元计划，本地审阅稿 v1，2026-07-24，公开链接待启用。',
    teaser:
      '一张 1936 年的校刊，能证明一个人出现过，却不能替他写完一生。',
    sourceCredits: [
      {
        sourceId: 'SRC-013',
        creator: '朱自清',
        title: '《绥行纪略》',
        publisher: '《国立清华大学校刊》第 792 号；清华大学图书馆数字化',
        date: '1936-11-26',
        href: 'https://thujournal.lib.tsinghua.edu.cn/swfPath/glqhdxxk/0792.pdf',
        relationship: '本文核心同期来源；正文只转述已逐字核对的连续段落。',
      },
      {
        sourceId: 'SRC-002',
        creator: '朱自清',
        title: '《绥行纪略》本地转录',
        publisher: '同一作品的本地文字载体',
        date: '转录已与官方影印核对',
        href: '/archives#SRC-002',
        relationship: '是 SRC-013 的转录载体，不作为第二个独立来源重复加权。',
      },
    ],
    thirdPartyMaterials: [
      {
        materialId: 'TP-SRC-013-Q1',
        kind: 'short-quotation',
        creator: '朱自清',
        workTitle: '《绥行纪略》',
        sourceId: 'SRC-013',
        locator: '《国立清华大学校刊》第 792 号第 2 版中下部连续段',
        sourceUrl: 'https://thujournal.lib.tsinghua.edu.cn/swfPath/glqhdxxk/0792.pdf',
        displayScope: '为说明研究对象而使用的必要短引文',
        publishability: 'necessary-quotation-only',
        reuseNotice: '本文作者不代替原作者、权利人或馆藏机构授权。',
      },
      {
        materialId: 'TP-SRC-013-F1',
        kind: 'facsimile',
        creator: '朱自清／国立清华大学校刊',
        workTitle: '《绥行纪略》所在版面局部',
        sourceId: 'SRC-013',
        locator: '《国立清华大学校刊》第 792 号第 2 版中下部',
        sourceUrl: 'https://thujournal.lib.tsinghua.edu.cn/swfPath/glqhdxxk/0792.pdf',
        assetPath: '/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png',
        displayScope: '本地研究审阅所需的局部影印',
        publishability: 'local-preview-only',
        reuseNotice: '不随本文授权；公开版须取得许可或移除本地影印、改用原馆藏外链。',
      },
    ],
  },
  'same-name': {
    ...common,
    rightsId: 'RP-DISC-002',
    slug: 'same-name',
    canonicalPath: '/discover/same-name',
    citation:
      '鉴真小秃驴：《同一个名字，为什么还不能拼成同一个人？》，苏开元计划，本地审阅稿 v1，2026-07-24，公开链接待启用。',
    teaser:
      '同一个名字可以把三份档案吸引到同一张桌上，却不能自动把它们拼成同一个人。',
    sourceCredits: [
      {
        sourceId: 'SRC-039',
        creator: '国民政府',
        title: '《国民政府公报》第 1075 号',
        publisher: '国立政治大学图书馆数字化',
        date: '1933-03-09',
        href: 'https://gpost.lib.nccu.edu.tw/GovIMG/2/22image/1075.pdf',
        relationship: '支持 1933 年军职任命记录，不自动证明更长任期。',
      },
      {
        sourceId: 'SRC-013',
        creator: '朱自清',
        title: '《绥行纪略》',
        publisher: '《国立清华大学校刊》第 792 号；清华大学图书馆数字化',
        date: '1936-11-26',
        href: 'https://thujournal.lib.tsinghua.edu.cn/swfPath/glqhdxxk/0792.pdf',
        relationship: '支持 1936 年平地泉会面记录，不负责连接前后身份。',
      },
      {
        sourceId: 'SRC-095',
        creator: '戊集团参谋部',
        title: '《第八战区编成表》（除胡宗南军、回教军）',
        publisher: '防卫省防卫研究所藏；JACAR 数字化',
        date: '1942-08 上旬',
        href: 'https://www.jacar.archives.go.jp/das/meta/C13031948700',
        relationship: '支持日方资料中的 1942 年称谓；不等同于中方正式任命书。',
      },
    ],
    thirdPartyMaterials: [],
  },
  'ai-family-history': {
    ...common,
    rightsId: 'RP-DISC-003',
    slug: 'ai-family-history',
    canonicalPath: '/discover/ai-family-history',
    citation:
      '鉴真小秃驴：《AI 写家族史，最危险的是“太像真的”》，苏开元计划，本地审阅稿 v1，2026-07-24，公开链接待启用。',
    teaser:
      'AI 最擅长把断片补成一条流畅人生；真正可靠的家族史，需要一套阻止流畅冒充真实的工作流。',
    sourceCredits: [
      {
        sourceId: 'METHOD-LOCAL-01',
        creator: '鉴真小秃驴',
        title: '苏开元计划：研究方法与证据分层',
        publisher: '本站本地研究方法页',
        date: '2026-07-24',
        href: '/methodology',
        relationship: '本文是该本地工作流的面向读者版本，不替代每条历史主张的来源台账。',
      },
      {
        sourceId: 'RIGHTS-LOCAL-01',
        creator: '鉴真小秃驴',
        title: '版权、转载与史料边界',
        publisher: '本站拟议政策页',
        date: '2026-07-24',
        href: '/rights',
        relationship: '说明原创表达、第三方材料与家属原件之间的权利边界。',
      },
    ],
    thirdPartyMaterials: [],
  },
};

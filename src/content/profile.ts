export const profile = {
  displayName: '鉴真小秃驴',
  title: 'AI 产品与软硬件实践者',
  statement:
    '从真实业务现场出发，连接硬件、软件、数据与 AI。',
  email: 'hdx13466545299@qq.com',
  portrait: '/assets/personal/jian-zhen-xiao-tu-lv-portrait.jpg',
  wechatQr: '/assets/personal/jian-zhen-xiao-tu-lv-wechat-qr.png',
  shortBio:
    'AI 产品与软硬件实践者，关注日本业务与传统行业数字化。18 年多产品与工程经历，从嵌入式硬件研发走向产品定义、软件平台、客户交付和日本业务经营；持续探索 AI 信息研究、售货机运营和大型设施数字化。',
  homeBio:
    '我是鉴真小秃驴，关注日本业务与传统行业数字化。从嵌入式硬件研发起步，逐步走进产品定义、软件平台、客户交付和日本业务经营。18 年多产品与工程经历，让我习惯从真实业务现场连接硬件、软件、数据与 AI。',
  aboutBio:
    '曾在东京常驻近两年，负责日本自动售货机移动支付产品 PPS7700 从 0 到 1 的研发协同与商业化。现在持续探索 AI 信息研究与知识管理、售货机智能运营和大型办公设施数字化。',
  workingMethod:
    '先找到现场问题，再明确数据、流程与验收标准；通过原型和小试点验证，组织研究、设计、开发与测试协作。我负责目标、边界、优先级和验收。',
} as const;

/** Connect the personal introduction with the work presented on this site. */
export const personaBridge =
  '从现场问题出发，把硬件、软件、数据与 AI 连成可验收的产品。';

export const profileHighlights = [
  {
    value: '538 页',
    label: '《英雄无名》从 Markdown 到印刷版，全书免费读',
  },
  {
    value: '1 人',
    label: '这座网站：Next.js 16，构建前跑完整条数据校验链',
  },
  {
    value: '逐条回源',
    label: '来源登记与逐条主张核验，构成一条可重跑的考据流水线',
  },
  {
    value: '18 年多',
    label: '产品与工程经历（本人提供）',
  },
] as const;

/** Delivered work, in the order it best proves the claim above. */
export const indieBuilds = [
  {
    number: '01',
    title: '《英雄无名》V1.5',
    metric: '538 页 · 36 章 · 62 幅图版',
    description:
      'Markdown 是唯一真源，排版、印刷版 PDF 与网页水印页图都是产物。换一版，全书页码、章节、评论与阅读进度一起迁移。',
    href: '/novel',
    status: '全书可读',
  },
  {
    number: '02',
    title: '苏开元考据流水线',
    metric: '来源台账 · 原子主张 · 关系图谱',
    description:
      '一份材料进来，先登记来源，再拆成可定位的主张，然后才允许进入图谱和正文。证据不足时标未知，出现反证时留修订记录。',
    href: '/graph',
    status: '持续运行',
  },
  {
    number: '03',
    title: 'handx：这座网站',
    metric: 'Next.js 16 · 全链路数据校验',
    description:
      '页面不允许比数据更完整。章节页码、图谱节点、权利状态全部由生成脚本产出并校验，改文案改不动事实。',
    href: '/about',
    status: '公开阅读版',
  },
] as const;

export const aiPracticeAreas = [
  {
    number: '01',
    title: 'AI × 软硬件产品',
    description:
      '从设备能力、现场约束和商业场景出发，连接视觉硬件、边缘计算、软件平台与数据，明确原型、交付和维护的范围。',
  },
  {
    number: '02',
    title: 'AI × 传统行业数字化',
    description:
      '围绕售货机运营和大型办公设施，梳理库存、补货、现金核对、路线作业及业务流程，用可追溯的数据与小试点验证方案。',
  },
  {
    number: '03',
    title: 'AI × 信息研究与知识管理',
    description:
      '连接多源采集、正文归档、AI 摘要、知识关联、全文检索和持续跟踪。让 AI 协助整理，让人负责来源判断与结果验收。',
  },
] as const;

export interface CareerExperience {
  organization: string;
  role: string;
  description: string;
  period?: string;
  status?: string;
  industry?: string;
  projectTitle?: string;
  publicTimeline?: string;
  projectFact?: string;
  evidenceBoundary?: string;
  visualKind?: 'vending-payment' | 'counter-payment' | 'smart-retail' | 'offline-payment';
  sources?: readonly {
    label: string;
    url: string;
    note: string;
  }[];
}

export const careerExperience: readonly CareerExperience[] = [
  {
    organization: 'INSPIRY JAPAN 株式会社',
    role: '产品与日本业务负责人',
    description:
      '本人提供：2020—2024 年负责市场研究、产品定义、软硬件研发协同、客户导入、报价合同与交付；曾在东京常驻近两年，参与 PPS7700 从 0 到 1 的研发与商业化。',
    industry: '日本自动贩卖机 × 无现金支付',
    projectTitle: 'PPS7700：把支付、设备接入与运营数据装进一台自动贩卖机',
    publicTimeline:
      '公司设立 2018｜官方新闻称 2020-12“市场提供开始”｜官方沿革列 2021 发售｜2022 Good Design Award',
    projectFact:
      '公开资料将 PPS7700 定位为面向日本自动贩卖机的一体化嵌入式无现金支付终端。产品获 2022 Good Design Award，官方受赏编号 22G110834，受赏企业为 INSPIRY JAPAN 株式会社。',
    evidenceBoundary:
      '公开资料能证明公司、产品、时间节点和获奖，不能证明站主的职务与职责。官方开发访谈明确为多人共同开发，并另述技术研发负责人，因此不写“独立领导全部研发”。',
    visualKind: 'vending-payment',
    sources: [
      {
        label: 'PPS7700 官方产品页',
        url: 'https://inspiry.jp/services/pps7700/',
        note: '产品定位与功能背景。',
      },
      {
        label: '官方新闻与沿革',
        url: 'https://www.inspiry.jp/news/',
        note: '保留“2020 市场提供”与“2021 发售”两种官方表述。',
      },
      {
        label: '官方开发访谈',
        url: 'https://inspiry.jp/cashless_knowledge3/',
        note: '团队开发边界。',
      },
      {
        label: '2022 Good Design Award',
        url: 'https://archive.jidp.or.jp/ja/pressrelease/2022/gdawinnerslist221007.pdf',
        note: '官方名单第 22 页，受赏编号 22G110834；属于产品获奖。',
      },
    ],
  },
  {
    organization: '意锐新创',
    role: '高级产品总监',
    description:
      '本人自述：负责小白盒、支付音箱等支付硬件；其中“支付音箱”尚无独立公开项目锚点，只保留在本人履历层。',
    industry: '线下收银台 × 自助扫码',
    projectTitle: '意锐小白盒：让顾客自己完成扫码支付',
    publicTimeline:
      '产品雏形公开追溯至 2008｜2015 进入规模化支付阶段｜2017 安全认证｜2018 银检认证及“累计出货 100 万+”媒体口径',
    projectFact:
      '公开报道显示，小白盒把顾客付款码的自助识读接入既有收银场景，降低商户导入扫码支付的设备与交互门槛；“100 万+”是 2018 年报道援引采访的累计出货口径。',
    evidenceBoundary:
      '“100 万+”不等于站主个人业绩；支付音箱未找到独立公开项目锚点，不能放进“项目已证”结论。',
    visualKind: 'counter-payment',
    sources: [
      {
        label: '中国日报：产品与认证',
        url: 'https://qiye.chinadaily.com.cn/2018-04/25/content_36089100.htm',
        note: '产品功能与认证背景。',
      },
      {
        label: 'IT之家：累计出货报道',
        url: 'https://www.ithome.com/0/377/101.htm',
        note: '“100 万+”为转载报道口径。',
      },
      {
        label: 'TechNode：海外支付场景',
        url: 'https://technode.com/2018/09/10/qr-code-payment-overseas-china/',
        note: '英文报道中的产品背景。',
      },
    ],
  },
  {
    organization: '迈外迪',
    role: '高级硬件产品总监',
    description:
      '本人自述：负责面向线下商业的多传感器智能硬件与系统；个人项目关联仍待私有材料闭环。',
    industry: '多传感硬件 × 智能商业',
    projectTitle: '迈创路由：让线下商业形成“感知—分析—行动”闭环',
    publicTimeline:
      '产品组合公开 2017-12｜GMIC 展示 2018-04/05｜2020 后官方演进为商业场景感知产品系',
    projectFact:
      '2017—2018 年公开方案把摄像头、Wi-Fi／蓝牙、声音与边缘处理转成结构化数据，再送入 BI 与应用平台，用于热区、动线及经营分析。',
    evidenceBoundary:
      '公开资料能证明公司当时推出该体系，不能证明站主个人负责范围；后续产品系只说明公司演进，不能反推其任职期贡献。',
    visualKind: 'smart-retail',
    sources: [
      {
        label: '2018 GMIC 产品报道',
        url: 'https://www.prnasia.com/story/209556-1.shtml',
        note: '摄像头、声音、设备与 Wi-Fi 能力。',
      },
      {
        label: '迈外迪公司与业务',
        url: 'https://wiwide.com/about/',
        note: '公司公开定位。',
      },
      {
        label: '商业场景感知演进',
        url: 'https://wiwide.com/introduce/perception/?active=2',
        note: '后续产品体系，只作公司演进背景。',
      },
    ],
  },
  {
    organization: '互帮国际',
    role: '研发总监',
    description:
      '本人自述：参与线下零售数据采集和早期离线二维码支付产品研发；个人贡献不从专利发明人或公司报道反推。',
    industry: '零售数据 × 商户端离线支付',
    projectTitle: '酷方 × 酷贝：一条连接数据，一条连接支付',
    publicTimeline:
      '离线支付专利申请 2014-01｜酷贝公开称 2014 上半年诞生｜产品报道 2014-12 与 2015-02',
    projectFact:
      '公开资料描述：酷方在不替换原有 POS 的前提下采集实时销售数据；酷贝让商户端设备离线生成动态订单码，再由消费者联网手机完成支付与确认。',
    evidenceBoundary:
      '准确表述是“商户端离线”，不是全链路离线。专利公开发明人名单不能证明站主贡献；支付宝案例的“贝芯／贝屏”与酷贝分开，不互相替代。',
    visualKind: 'offline-payment',
    sources: [
      {
        label: '虎嗅：酷方与酷贝',
        url: 'https://www.huxiu.com/article/108021.html',
        note: '2015 年同期项目报道。',
      },
      {
        label: '离线支付专利',
        url: 'https://patents.google.com/patent/CN104794611A/zh',
        note: '申请时间与权利背景；不证明站主个人贡献。',
      },
      {
        label: '支付宝案例：贝芯／贝屏',
        url: 'https://open.alipay.com/caseCenter/caseCenterDetail.htm?id=36',
        note: '另一个产品命名体系，不能替换成酷贝。',
      },
    ],
  },
  {
    organization: '西门子 · 航天五院',
    role: '早期工程与技术经历',
    description:
      '本人提供：早期从事消防控制器硬件、射频与导入认证，以及工业计算机和控制器的硬件、FPGA、驱动、量产测试，逐步建立从底层技术到产品交付的工程视角。',
    evidenceBoundary:
      '该段任职与具体项目由本人提供；机构官网只能核验组织背景，不能证明个人部门、职务、年份或贡献。',
    sources: [
      {
        label: '西门子中国官方简介',
        url: 'https://www.siemens.com/zh-cn/company/about/siemens-in-china/',
        note: '仅核验机构背景。',
      },
      {
        label: '中国空间技术研究院简介',
        url: 'https://www.cast.cn/3g/channel/1239',
        note: '仅核验机构背景。',
      },
    ],
  },
];

/** Personal project experience; public sources support product background only. */
export const projectExperience: readonly CareerExperience[] = [
  {
    organization: 'INSPIRY JAPAN 株式会社',
    projectTitle: 'PPS7700：日本自动售货机移动支付',
    role: '产品与日本业务负责人',
    period: '2020—2024',
    status: '已商业化',
    industry: '自动售货机 × 移动支付',
    description:
      '围绕存量售货机的扫码支付、通信、终端适配与平台管理，负责市场研究、产品定义、软硬件研发协同、客户导入、报价合同与交付，连接设备销售与持续服务。',
    projectFact: careerExperience[0].projectFact,
    evidenceBoundary:
      '项目时间、个人职务与负责范围由本人提供。官方获奖名单可核验 PPS7700 产品获奖；产品由团队共同开发，奖项不表述为个人独立获奖。',
    sources: careerExperience[0].sources,
  },
  {
    organization: '日本自动售货机场景',
    projectTitle: '日本自动售货机智能运营',
    role: '产品与系统实践',
    status: '研发验证及试点准备',
    industry: '销售数据 × 现场作业',
    description:
      '围绕销售依据、库存补货、现金核对和路线作业，连接设备、现场人员与总部，探索能够追溯的运营流程。',
    evidenceBoundary:
      '当前处于研发验证及试点准备阶段，现场效果与生产部署仍待验证。',
  },
  {
    organization: '独立实践',
    projectTitle: 'AI 信息研究与知识管理',
    role: '需求与架构 · 协同开发与验收',
    period: '2026',
    status: '持续实践',
    industry: '多源信息 × 知识管理',
    description:
      '建设多源采集、正文归档、AI 摘要、知识关联、全文检索与持续跟踪流程，负责需求、架构、协同开发、成本管理与验收。本站的研究与内容工作也是实践的一部分。',
    evidenceBoundary:
      '独立实践与负责范围由本人提供；AI 生成的摘要和关联需要回到来源核对。',
  },
  {
    organization: '视觉与智能终端项目',
    projectTitle: 'AI 视觉与边缘计算',
    role: '硬件产品负责人',
    period: '2018—2020',
    status: '产品经历',
    industry: '视觉硬件 × 边缘计算',
    description:
      '围绕 Jetson、视觉硬件、算法与商业场景开展产品工作，包括客流统计产品，连接设备能力、算法需求与现场使用。',
    evidenceBoundary:
      '项目时间、个人职务与负责范围由本人提供。',
  },
  {
    organization: '互帮国际',
    projectTitle: '酷贝与酷方：支付与线下数据采集',
    role: '产品负责人',
    period: '2013—2018',
    status: '产品经历',
    industry: '商户终端 × 支付与数据服务',
    description:
      '围绕酷贝的商户端离线二维码支付和酷方的线下数据采集，连接终端、商户与数据服务，负责产品定义、产品路线、原型测试与推广。',
    projectFact: careerExperience[3].projectFact,
    evidenceBoundary: careerExperience[3].evidenceBoundary,
    sources: careerExperience[3].sources,
  },
  {
    organization: '大型办公设施',
    projectTitle: '大型办公设施数字化',
    role: '项目计划与交付协作',
    status: '项目经历',
    industry: '能源、物业与办公运营',
    description:
      '围绕能源、物业、会议及办公运营系统，组织计划、供应商协同、风险管理与交付，通过工作包、看板和问题闭环推进实施。',
    evidenceBoundary:
      '项目内容与负责范围由本人提供。',
  },
];

export const education = {
  school: '北京交通大学',
  program: '微电子专业',
  degree: '硕士',
} as const;

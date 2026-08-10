export const profile = {
  displayName: '鉴真小秃驴',
  title: '独立开发者 · AI 工作流 / 内容流水线',
  statement:
    '一个人，用 AI 把复杂的东西做完整——从一份档案到一本书，从一条流水线到一座网站。',
  email: 'hdx13466545299@qq.com',
  portrait: '/assets/personal/jian-zhen-xiao-tu-lv-portrait.jpg',
  wechatQr: '/assets/personal/jian-zhen-xiao-tu-lv-wechat-qr.png',
  shortBio:
    '独立开发者。我用 AI 做完整的东西：一本 538 页的书、一座自己写的网站、一条能重复跑的考据流水线——起点是一个被历史漏掉的人。此前二十多年做智能终端、移动支付与线下商业系统（本人履历），那段经历现在是判断力的来源，不是当前主业。',
  homeBio:
    '我是鉴真小秃驴，一个独立开发者。我关心的不是模型能做什么，而是一个人能不能用它把一件复杂的事做到底：把一份 1936 年的旧文献，变成可核验的主张、一张关系图、一本读得下去的小说，再变成一座能自己跑起来的网站。这个站就是那条流水线的现场，也是它的产物。',
} as const;

/**
 * The bridging claim for the whole site: the indie-developer identity is
 * evidenced by the delivered work, not by a résumé.
 */
export const personaBridge =
  '独立开发者的证明不是简历，是交付物。我的交付物是一个人的名字。';

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
    value: '123 份',
    label: '来源登记与逐条主张核验，构成一条可重跑的考据流水线',
  },
  {
    value: '20 年+',
    label: '软硬一体与智能终端经验（本人提供）',
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
    metric: '123 来源 · 107 节点关系图',
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
    status: '本地审阅版',
  },
] as const;

export const aiPracticeAreas = [
  {
    number: '01',
    title: 'AI × 内容流水线',
    description:
      '把一堆散落的材料变成可发布的成品：结构化、分层标注、版本冻结、批量产出，中间每一步都能重跑和复核。',
  },
  {
    number: '02',
    title: 'AI × 知识工程',
    description:
      '来源登记、主张拆解、实体消歧、关系图谱。让 AI 负责整理和提问，把"这一条能不能算事实"留给人。',
  },
  {
    number: '03',
    title: 'AI × 硬件与行业系统',
    description:
      '二十多年智能终端、移动支付与线下商业系统的经验（本人履历）。现在它是判断真实约束的底子，不是当前主业。',
  },
] as const;

export interface CareerExperience {
  organization: string;
  role: string;
  description: string;
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
    role: '创始团队成员 · 产品总负责人',
    description:
      '本人自述：负责产品定义、软硬件协同与市场推进；公开资料未完成个人职务与职责的身份闭环。',
    industry: '日本自动贩卖机 × 无现金支付',
    projectTitle: 'PPS7700：把支付、设备接入与运营数据装进一台自动贩卖机',
    publicTimeline:
      '公司设立 2018｜官方新闻称 2020-12“市场提供开始”｜官方沿革列 2021 发售｜2022 Good Design Award',
    projectFact:
      '公开资料将 PPS7700 定位为面向日本自动贩卖机的一体化嵌入式无现金支付终端，把支付、屏幕交互、设备接口与销售数据在线化连接在同一产品链路中。',
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
        note: '获奖名单。',
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
      '在大型技术组织中建立工程基础，并逐步形成从底层技术、软硬件协同到完整产品落地的系统视角。',
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

export const education = {
  school: '北京交通大学',
  program: '微电子专业',
  degree: '硕士',
} as const;

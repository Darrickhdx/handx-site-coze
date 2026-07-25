export const profile = {
  displayName: '鉴真小秃驴',
  title: 'AI 产业产品化实践者 · 软硬一体产品负责人',
  statement: '把 AI 从模型能力，变成传统行业真正能运行的设备、系统与产品。',
  email: 'hdx13466545299@qq.com',
  portrait: '/assets/personal/jian-zhen-xiao-tu-lv-portrait.jpg',
  wechatQr: '/assets/personal/jian-zhen-xiao-tu-lv-wechat-qr.png',
  shortBio:
    '据本人履历，拥有 20 年以上软硬一体智能终端、支付硬件与系统平台经验，长期参与从 0 到 1 的产品创新与规模化落地。现在专注把 AI、硬件、行业系统与真实业务连接起来，也用“苏开元计划”实践 AI 时代的个人知识工程。',
  homeBio:
    '我是鉴真小秃驴。过去二十多年，我一直在智能终端、移动支付与线下商业系统里，把复杂技术变成真正可以生产、部署和规模化使用的产品。现在，我把同样的产品方法带进 AI：既研究它怎样改变传统行业，也用它追索曾祖父苏开元，把散落的家族档案连接成可以阅读、核对和继续生长的故事。',
} as const;

export const profileHighlights = [
  {
    value: '20 年+',
    label: '软硬一体与智能终端经验（本人提供）',
  },
  {
    value: '0 → 1',
    label: '产品创新、系统设计与商业落地（本人提供）',
  },
  {
    value: '100 万+*',
    label: '小白盒累计出货（公开报道，非个人 KPI）',
  },
  {
    value: '中国 × 日本',
    label: '跨市场产品设计与推广经历（本人提供）',
  },
] as const;

export const aiPracticeAreas = [
  {
    number: '01',
    title: 'AI × 硬件',
    description:
      '关注模型能力怎样进入智能终端、传感设备和边缘场景，最终转化为稳定、可制造、可维护的产品。',
  },
  {
    number: '02',
    title: 'AI × 行业系统',
    description:
      '把 AI 接入传统行业已有的支付、运营与系统平台，让它真正改善流程、决策和现场效率。',
  },
  {
    number: '03',
    title: 'AI × 个人知识',
    description:
      '以苏开元计划为长期样本，实践档案整理、来源核验、知识图谱、内容生产与历史叙事。',
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

/** Public reading notes; originals and private family material stay outside the site. */
export const researchUpdateDate = '2026-10-04';

export const sourceLocatorCorrections: Readonly<Record<string, string>> = {
  'SRC-013': '《国立清华大学校刊》第792号：第一版／PDF1底部起刊，续文在第二版／PDF2；“留守司令蘇開元團長”及学生组织谈话位于第二版中下部。整期共2页，逐字核读限平地泉连续段；单篇第一页PDF不含该段。',
  'SRC-039': '《国民政府公报》第1075号，PDF物理页3／印刷页3军职任命表：苏开元为第七十二师第二百十八旅第四百三十五团团长；同页董其武条为第七十三师第二百十八旅，原载差异保留。',
};

export const claimLocatorCorrections: Readonly<Record<string, string>> = {
  'CL-013': 'SRC-013《国立清华大学校刊》第792号第二版／PDF物理页2中下部《绥行纪略》续文；二十一日平地泉段“遇留守司令蘇開元團長”。',
  'CL-014': 'SRC-013《国立清华大学校刊》第792号第二版／PDF物理页2中下部；二十一日平地泉段关于学生组织方式的连续文字。',
  'CL-022': '李英夫《苏开元在傅作义部的革命活动》，印刷页79／PDF物理页8，七五事件后的联系与送葬示威回忆段；全文印刷页72—82／PDF1—11。',
};

export const recentResearchReadings = [
  {
    id: 'survey-1929',
    period: '1929 · 同期调查表',
    title: '“蘇開元”所在的一栏',
    locator: 'JACAR B05015400400 · PDF13／印刷页10／原图0096；全件23页，核读限名册该栏。',
    summary: '调查表同栏列有蘇開元、年龄“二六”、陆军士官学校步兵科二年生和青冈县。本轮对原图复核，将旧转录“三年生”更正为“二年生”。',
    boundary: '外部调查表不是学校原始学籍；年龄不换算成唯一出生年，也不单凭姓名接入家族身份。',
    href: 'https://www.jacar.archives.go.jp/das/meta/B05015400400',
    linkLabel: '到 JACAR 查看来源',
  },
  {
    id: 'gazette-1933',
    period: '1933 · 同期公报',
    title: '任命可以定位，番号差异仍保留',
    locator: '《国民政府公报》第1075号 · PDF3／印刷页3任命表；全件4页，核读限相关任命条。',
    summary: '苏开元条任命为第七十二师第二百十八旅第四百三十五团团长；同页董其武条写第七十三师第二百十八旅。两条按原载并列，不擅自统一师号。',
    boundary: '纸面任命不能证明实际到任日、完整任期或战斗行动。',
    href: 'https://gpost.lib.nccu.edu.tw/GovIMG/2/22image/1075.pdf',
    linkLabel: '到政治大学图书馆查看公报',
  },
  {
    id: 'journal-1936',
    period: '1936 · 同期校刊',
    title: '区分文章开头与苏开元所在续文',
    locator: '《国立清华大学校刊》第792号 · 第一版／PDF1底部起刊，苏开元段在第二版／PDF2中下部；整期2页，核读限相关段。',
    summary: '朱自清记下1936年11月21日在平地泉所见的“留守司令蘇開元團長”。回到整期PDF可区分文章开头与续文；只看单篇第一页PDF，会漏掉苏开元段。',
    boundary: '该段支持记录者、日期、地点、称谓及答复意旨，不能独自证明长期政治身份或亲属关系。',
    href: 'https://thujournal.lib.tsinghua.edu.cn/swfPath/glqhdxxk/0792.pdf',
    linkLabel: '到清华大学图书馆查看校刊',
  },
  {
    id: 'chart-1942',
    period: '1942 · 同期日方情报表',
    title: '“高级参议”是图表中的列名',
    locator: 'JACAR C13031948700 · PDF2顶部傅作义指挥部人员栏；全件4页，核读限该栏。',
    summary: '日方编成表在傅作义指挥部队项下将李大超与蘇開元并列为高级参议。',
    boundary: '敌方情报表不能替代中方正式任命；并列不证明私交、组织关系或秘密协作。',
    href: 'https://www.jacar.archives.go.jp/das/meta/C13031948700',
    linkLabel: '到 JACAR 查看编成表',
  },
  {
    id: 'memoir-jibeiping',
    period: '1948 · 后出回忆中的行动',
    title: '苏开元与纪清漪：先回到李英夫的文字',
    locator: '李英夫《苏开元在傅作义部的革命活动》 · 印刷页79／PDF8；本地载体全文印72—82／PDF1—11。',
    summary: '李英夫回忆，七五事件后苏开元联系马毅、纪清漪等，发动以送葬死难学生为名的示威。本轮将联系对象与动员行动分开记录；同一文章仍只计一个证人来源。',
    boundary: '回忆未给出游行具体日期、路线或纪清漪现场行为。文中1938年入党的说法也属后出回忆，仍缺组织原件。',
    href: '/archives/SRC-001',
    linkLabel: '查看回忆来源登记',
  },
  {
    id: 'ji-review-2021',
    period: '2021 · 后出综述与待查原文',
    title: '纪清漪资料增加了查档方向',
    locator: '童洪锡，嘉瑞成律师事务所纪清漪文章，2021-10-19；核读限相关叙述、署名、日期与文末参考文献。',
    summary: '后出律师群像提及苏开元与纪清漪参加北平和平解放工作的关系，并列出两篇参考文献；逐句对应的参考原文和卷页尚未取得。',
    boundary: '不据一句综述认定直接领导关系、联系次数或具体任务。网页、截图和转载同属一个来源家族。',
    href: 'https://www.jrc.com.cn/party/2f6c5228-fe66-4802-aaf0-97f9c3b2d17a',
    linkLabel: '阅读嘉瑞成原文',
  },
] as const;

export const researchUpdateOpenQuestions =
  '1935年第1750号公报、1937年人名鉴与1977年校补名簿保留既有登记和定位，本轮不宣称已逐页核完。苏开元／苏凯元同一性及家族身份仍未闭环。新增材料不自动构成连续传记，小说不充当史料。';

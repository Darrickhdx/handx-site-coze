export type IdentityDossierItem = {
  id: string;
  year: string;
  dateLabel: string;
  sourceId: string;
  claimIds: readonly string[];
  sourceKind: string;
  title: string;
  recordHeading: string;
  recordText: string;
  status: 'document_verified' | 'candidate_bridge' | 'conflict' | 'bounded_record';
  statusLabel: string;
  canConfirm: readonly string[];
  cannotConfirm: readonly string[];
  anchors: readonly string[];
  question: string;
  image?: {
    src: string;
    alt: string;
    width: number;
    height: number;
  };
};

export const identityDossierItems: readonly IdentityDossierItem[] = [
  {
    id: 'survey-1929',
    year: '1929',
    dateLabel: '1929.03.05',
    sourceId: 'SRC-103',
    claimIds: ['CL-176', 'CL-177', 'CL-178'],
    sourceKind: '外务省档案所存满铁调查转报',
    title: '调查表中的“蘇開元”',
    recordHeading: '黑龙江省出身日本在留学生一览',
    recordText: '蘇開元｜二六｜陸軍士官學校步兵科三年生｜青岡縣',
    status: 'document_verified',
    statusLabel: '原表字段已核',
    canConfirm: [
      '这份同期调查表在同一纵栏写下姓名、年龄、学校学科、年级与籍贯字段。',
      '可以准确写成“1929 年调查表如此记载”。',
    ],
    cannotConfirm: [
      '它不是日本陆军士官学校的原始学籍卡，不能单独证明正式在籍或最终毕业。',
      '“26 岁”不能直接换算成唯一出生年，更不能单凭姓名认定为家族人物。',
    ],
    anchors: ['姓名：蘇開元', '籍贯：青岡縣', '学校／科别', '年龄字段'],
    question: '这四个字段，能否在另一份独立名簿中再次同时出现？',
  },
  {
    id: 'roster-1977',
    year: '1927–29',
    dateLabel: '1977 年出版｜所载 1927.10—1929.07',
    sourceId: 'SRC-104',
    claimIds: ['CL-179', 'CL-180', 'CL-181'],
    sourceKind: '1977 年出版的后出校补名簿数字影印',
    title: '名簿中的“蘇凱元”',
    recordHeading: '日本陆军士官学校中华民国留学生名簿',
    recordText: '蘇凱元｜第二十期｜步兵｜黑龙江青冈县兴华镇',
    status: 'candidate_bridge',
    statusLabel: '高置信候选桥',
    canConfirm: [
      '1977 年校补名簿确实在第二十期表中列出“蘇凱元”及科别、籍贯。',
      '与 1929 调查表相比，近形姓名、同县籍贯、同校同科和相容时间窗形成高置信候选桥。',
    ],
    cannotConfirm: [
      '校补名簿不是个人毕业证，也不是当年学校原始学籍原卷。',
      '“高置信候选”仍不等于对外传记可以无条件合并两个人名轨道。',
    ],
    anchors: ['近形姓名', '同县籍贯', '同校同科', '相容时间窗'],
    question: '还缺原学籍、军籍号或明确异名字段，才能把候选桥变成身份闭环。',
  },
  {
    id: 'gazette-1933',
    year: '1933',
    dateLabel: '1933.03.09',
    sourceId: 'SRC-039',
    claimIds: ['CL-092'],
    sourceKind: '同期国民政府公报',
    title: '公报中的“蘇開元”',
    recordHeading: '《国民政府公报》第 1075 号',
    recordText: '任命蘇開元陸軍第七十二師第二百十八旅第四百三十五團團長',
    status: 'bounded_record',
    statusLabel: '任命记录已核',
    canConfirm: [
      '公报在这一日期刊载了姓名、师旅团番号与团长职务。',
      '这是一条可定位的纸面任命记录。',
    ],
    cannotConfirm: [
      '不能由发布日期倒推出实际到任日、完整任期或具体战斗行动。',
      '这张公报本身没有提供籍贯、学籍号或亲属字段，无法独自接上前一张卡。',
      '同页另一条记录把同一第二一八旅置于第七十三师，七十二／七十三师冲突必须保留。',
    ],
    anchors: ['姓名', '日期', '师旅团番号', '职务'],
    question: '军职轨道出现了，但它与 1929 年留学生记录之间仍有四年空白。',
  },
  {
    id: 'encounter-1936',
    year: '1936',
    dateLabel: '1936.11.21',
    sourceId: 'SRC-013',
    claimIds: ['CL-013', 'CL-014'],
    sourceKind: '同期校刊现场见闻',
    title: '朱自清笔下的“苏开元团长”',
    recordHeading: '《国立清华大学校刊》第 792 号《绥行纪略》',
    recordText: '遇留守司令蘇開元團長',
    status: 'document_verified',
    statusLabel: '现场称谓已核',
    canConfirm: [
      '朱自清在平地泉段落中使用了这一姓名与称谓。',
      '同一段可以支持他对学生组织共同工作与保持一定独立性的答复意旨。',
    ],
    cannotConfirm: [
      '一次会面不能证明完整军职、党籍、长期政治身份或后来秘密行动。',
      '记录者没有写人物传记，也没有替家族身份完成认证。',
    ],
    anchors: ['日期', '地点：平地泉', '姓名与称谓', '记录者'],
    question: '第一次有了近似“现场镜头”，但镜头之外仍然是空白。',
    image: {
      src: '/assets/sukaiyuan/1936-sui-xing-ji-lue-proof.png',
      alt: '1936 年朱自清《绥行纪略》同期校刊影印局部',
      width: 1835,
      height: 1035,
    },
  },
  {
    id: 'who-is-who-1937',
    year: '1937',
    dateLabel: '昭和十二年版',
    sourceId: 'SRC-088',
    claimIds: ['CL-148', 'CL-149', 'CL-150', 'CL-151', 'CL-152', 'CL-153'],
    sourceKind: '同期编纂型人名鉴',
    title: '条目标题里的第三种写法',
    recordHeading: '《現代中華民国満洲帝国人名鑑》',
    recordText: '蘇開元 Su Kai-yuan',
    status: 'conflict',
    statusLabel: '条目已核，履历有冲突',
    canConfirm: [
      '1937 年人名鉴存在以“蘇開元 Su Kai-yuan”为标题的条目。',
      '可以逐项说明人名鉴怎样概述出生年、陆士经历及福建、天津、435 团和集宁职务。',
    ],
    cannotConfirm: [
      '编纂型人名鉴不是每一项履历的原始任命或学籍证明。',
      '其“1905 年生、1928 年毕业”与其他材料形成张力，不能选最顺的一版覆盖冲突。',
    ],
    anchors: ['汉字姓名', '罗马字转写', '履历串', '1937 年编纂语境'],
    question: '一份看似最完整的条目，反而同时制造了出生年与毕业时间的新问题。',
  },
  {
    id: 'chart-1942',
    year: '1942',
    dateLabel: '1942.08',
    sourceId: 'SRC-095',
    claimIds: ['CL-167', 'CL-168'],
    sourceKind: '同期日方军事情报图表',
    title: '敌方编成表里的“高级参议”',
    recordHeading: '《第八战区编成表》',
    recordText: '高級参議｜李大超｜蘇開元',
    status: 'bounded_record',
    statusLabel: '图表列名已核',
    canConfirm: [
      '日方编成表在傅作义指挥部队项下并列李大超与蘇開元，并标作高级参议。',
      '可以准确陈述敌方情报材料在 1942 年怎样列示。',
    ],
    cannotConfirm: [
      '敌方情报表不是中方正式任命原件，不能锁定任命日、权限或任期。',
      '并列出现不等于私人交往，更不证明秘密协作或政治身份。',
    ],
    anchors: ['姓名', '时间', '组织位置', '材料立场'],
    question: '从 1937 到 1942 的连续过程仍然没有被原件填满。',
  },
] as const;

export const identityDossierVerdict = {
  label: '高置信候选，尚未闭环',
  summary:
    '1929 调查表与 1977 校补名簿之间已经形成多字段候选桥；1933、1936、1937、1942 又提供了分离的姓名与职务记录。但现有材料仍不足以把所有年份无条件写成同一人的连续传记。',
  established: ['六份材料均可回到来源卡与定位', '1929 调查记录与 1977 出版名簿所载 1927—1929 记录形成多字段候选桥', '1933、1936、1942各有独立的同期记录'],
  missing: ['日本陆士原始学籍或军籍号', '明确的异名／改名原始记录', '能够连接空白年份的人事原卷', '家族身份与公开记录之间的独立锚点'],
} as const;

export const identityTrackComparison = {
  openTrack: [
    {
      label: '蘇開元轨',
      tone: 'primary',
      records: [
        '1929｜同期调查表：青冈、陆士步兵科三年生',
        '1933｜公报：第 435 团团长',
        '1935.05.24｜官职资料索引：陆军步兵中校',
        '1936｜朱自清平地泉记录',
        '1942｜日方编成表：高级参议',
      ],
      sources: 'SRC-103 / SRC-039 / SRC-042 / SRC-013 / SRC-095',
    },
    {
      label: '蘇凱元轨',
      tone: 'muted',
      records: [
        '1932｜官职资料索引：第五十七师第一七一旅参谋',
        '1935.05.23｜官职资料索引：陆军步兵中校',
        '1977 出版｜名簿回录 1927—1929：第二十期步兵、青冈县兴华镇',
      ],
      sources: 'SRC-043 / SRC-104',
    },
  ],
  assumedBridge: [
    '1929｜陆士步兵科三年生',
    '1932—1933｜两条不同番号的军职记录',
    '1935.05.23—24｜两种姓名相隔一天的中校记录',
    '1936｜平地泉现场称谓',
    '1942｜日方编成表高级参议',
  ],
  warning:
    '这只是“假设身份桥成立后会形成的研究路径”，用于暴露需要解释的连续性与冲突；不是已经确认的完整生平。',
} as const;

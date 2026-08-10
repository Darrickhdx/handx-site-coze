/**
 * The research method, written to be reusable by someone else.
 *
 * Synthesised from the project's own working documents — the data dictionary,
 * the evidence policy, and the "must not assert" list — rather than described
 * in the abstract. Every rule here is one that has already changed a decision
 * in this project.
 */

export const methodologyIntro = {
  kicker: '方法论',
  title: '怎样把一个人从档案里找回来，而不把他编出来',
  dek: '一套给个人研究者的工作方法：材料怎么登记、事实怎么分级、身份怎么分流、AI 用在哪一步、以及哪些话在证据到位前不许写。',
  lede:
    '我用它找了三年曾外祖父。它没有让我更快得到答案，但它让我每次说“这条能确认”的时候，自己知道凭的是什么。',
} as const;

export const fourLayers = [
  {
    layer: '载体',
    key: 'artifact_id',
    what: '一个物理文件：路径、大小、哈希。',
    rule: '同一份内容的 PDF、DOCX、扫描件、OCR 文本是四个载体，但只是一份材料的四种形态。',
  },
  {
    layer: '来源',
    key: 'source_id',
    what: '一部作品、一篇报道、一份回忆、一件档案或一个网页。',
    rule: '载体归属到来源。转录、镜像、转载指回它们代表的那个来源，不新增来源。',
  },
  {
    layer: '主张',
    key: 'claim_id',
    what: '一条可证伪的判断：谁、何时、何地、被如何记录、做了什么。',
    rule: '每条主张必须带来源、定位（页码／版面／条目号）、证据等级、独立来源数和状态。',
  },
  {
    layer: '图谱',
    key: 'entity_id / edge_id',
    what: '人物、机构、地点、事件、职务、文献，以及它们之间的关系。',
    rule: '每条关系必须回链到具体主张。没有主张支撑的连线不许存在。',
  },
] as const;

export const independenceRule = {
  title: '一篇文章不该被数成五个来源',
  body:
    '这是个人研究最容易出错的地方：同一篇回忆录，你手上有原刊 PDF、别人转的 DOCX、OCR 出来的文本、一个数据库索引条目、还有两个网站的转载。看起来是六份材料，实际上只有一份。',
  mechanism:
    '每个来源记录带一个人工判断的 independent_source_key。同一篇文章的所有形态共用一个键，计算“独立来源数”时只算一次。数据库索引和它指向的原件也不能在证明同一段正文时重复加权。',
  consequence:
    '结果往往令人沮丧：一条你以为有六个来源支持的结论，真实独立来源数是一。但这就是它该有的样子。',
} as const;

export const identityRules = [
  {
    code: 'VG',
    name: '已证别名组',
    meaning: '已有可定位材料证明是同一个人的不同名字，比如原名与曾用名之间有直接证据。',
    guard: '不能只因为字形相近、或某个百科这么写，就建立一个 VG。',
  },
  {
    code: 'CI',
    name: '候选身份簇',
    meaning: '两个姓名或记录可能属于同一人，但还缺军籍、籍贯、出生信息、履历卡或照片来闭环。',
    guard: 'CI 不等于已证同人，也不等于已证是两个人。它就是“还不知道”。',
  },
] as const;

export const identityPrinciples = [
  '姓名记录先于人物归属：先登记“某份文件里出现了这个名字”，再谈“这个名字是谁”。',
  '同名跨地区、跨行业强制分流：上海的文教干部和绥远的军人，即使同名同姓，也必须是两个节点。',
  '“暂不合并”表示证据不足，不表示已经证明他们是不同的人——这两句话在研究里完全不同。',
  '把两个高概率同人的节点强行合并，会让后面所有引用它的结论一起失去可追溯性。',
];

export const evidenceTiers = [
  { tier: 'A', name: '同期原始', note: '事件当时产生的记录：公报、名簿、档案、同期刊物。' },
  { tier: 'B', name: '权威可核', note: '后出但可核验的权威编纂、正式出版的研究。' },
  { tier: 'C', name: '回忆与后出文史', note: '当事人或旁人的回忆、文史资料。有价值，但记忆会变形。' },
  { tier: 'D', name: '家属与未署名', note: '家族口述、未署名材料。是线索的富矿，不是事实的依据。' },
  { tier: 'E', name: '旧稿、AI 与二传', note: '早期自己的稿子、模型输出、网络转述。只能用来找方向。' },
] as const;

export const claimStates = [
  { state: 'working_verified', note: '已核到定位，可在标明边界的前提下使用。' },
  { state: 'provisional', note: '暂时采用，但还没到能写进正文的程度。' },
  { state: 'needs_archive', note: '需要去查档才能推进——这是最有用的状态，它会变成待办。' },
  { state: 'not_supported', note: '现有材料不支持。留着，因为它记录了“我们查过”。' },
  { state: 'rejected_for_fact', note: '曾经写过，后来被推翻。必须留痕，否则等于没纠错。' },
] as const;

export const fixLayers = [
  {
    code: 'F',
    name: '可核事实',
    body: '能回到来源定位的最小事实。只在它能证明的范围内使用，不自动延伸成完整履历。',
  },
  {
    code: 'I',
    name: '合理外推',
    body: '从事实出发的推断，但必须标明它从哪一步开始不再有材料支撑。',
  },
  {
    code: 'X',
    name: '文学构造',
    body: '人物内心、对白、动作、合成情节。小说需要它，研究库不接受它回流。',
  },
] as const;

export const forbiddenList = {
  title: '写一份「现在不许写成事实」的清单',
  body:
    '这是整套方法里最反直觉、也最有用的一份文件。它不是“这些是假的”，而是“这些截至今天还没到能当事实写的门槛”。',
  examples: [
    '不写精确生年——三份材料给了三个年份，那就三个并列，不挑一个顺手的。',
    '不把同名同姓写成同一人，即使所有旁证都指向那个方向。',
    '不从一次会面记录，推出一个人的完整军职、政治身份或长期动机。',
    '不把敌方情报表里的“同列一栏”，写成两人有私交或上下级关系。',
    '不写真人的入党、密令、单线联系——高敏感政治身份只能等档案。',
  ],
  why:
    '把禁令写下来，比把结论写下来更能保护研究。因为诱惑总是出现在你最想要那个答案的时候，而清单是你清醒时写给冲动时的自己的。',
} as const;

export const aiBoundary = {
  title: 'AI 用在哪一步，不用在哪一步',
  canDo: [
    '发现：在几百份材料里找出可能相关的段落。',
    'OCR 与转录候选：给出草稿，由人逐字校对。',
    '翻译草稿：日文、繁体档案的初步理解。',
    '结构化：把散乱笔记整理成来源表、主张表的候选行。',
    '表达辅助：把已核实的内容写成读得下去的文字。',
  ],
  cannotDo: [
    '决定一条主张是否成立。',
    '在没有定位的情况下补全人名、日期、职务。',
    '把几条弱线索“综合判断”成一个结论。',
    '为了叙事顺畅，填上材料里没有的因果。',
  ],
  sharpest:
    '模型之间的共识不增加证据等级。三个模型都同意，仍然是零个来源。',
} as const;

export const reuseChecklist = [
  '先建来源表，再动笔。哪怕只有五份材料，也先给它们编号。',
  '每写一句关于真人的话，问自己：这句话回到哪一份材料的第几页。',
  '给同名的人建两个节点，等证据来合并，不要等证据来拆分。',
  '把“我现在还不能写什么”写下来，并且定期回看它。',
  '让 AI 做搜索、整理和表达，把判断留给自己。',
  '出现反证时，不要删掉旧结论——标记它被推翻，并留下时间。',
];

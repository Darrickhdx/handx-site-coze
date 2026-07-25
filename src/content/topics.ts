export const topicModes = [
  'source_backed',
  'question',
  'interpretation',
] as const;

export type TopicMode = (typeof topicModes)[number];

export const topicPublicationStatuses = [
  'review_only',
  'public_ready',
  'not_for_media',
] as const;

export type TopicPublicationStatus =
  (typeof topicPublicationStatuses)[number];

export type TopicProvenanceLayer = 'audited' | 'editorial' | 'legacy';

export interface TopicParagraph {
  id: string;
  text: string;
  mode: TopicMode;
  claim_ids: readonly string[];
  source_ids: readonly string[];
  publication_status: TopicPublicationStatus;
  risk_flags: readonly string[];
  provenance_layer: TopicProvenanceLayer;
}

export interface TopicSection {
  id: string;
  title: string;
  paragraphs: readonly TopicParagraph[];
}

export interface TopicArticle {
  slug: string;
  title: string;
  shortTitle: string;
  eyebrow: string;
  dek: string;
  thesis: string;
  updatedAt: string;
  reviewStatus: 'local_review';
  sections: readonly TopicSection[];
}

export const topicArticles = [
  {
    slug: 'dong-yan-su-evidence-visibility',
    title:
      '董其武、阎又文与苏开元：为什么有些人进入史册，有些人仍停在档案边缘？',
    shortTitle: '三个人，三种被历史看见的方式',
    eyebrow: '话题实验室 · 证据如何被看见',
    dek:
      '这不是一张功劳排行榜。我们把原来的英雄比较，改写成一个更能被核对的问题：不同类型的材料，怎样决定一个人物能否进入公共叙事？',
    thesis:
      '真正值得比较的不是谁更传奇，而是每个人留下了什么材料、这些材料处于哪一层证据，以及仍缺少哪一块关键拼图。',
    updatedAt: '2026-07-26',
    reviewStatus: 'local_review',
    sections: [
      {
        id: 'rewrite-the-question',
        title: '先把“谁更重要”改写成“谁更容易被看见”',
        paragraphs: [
          {
            id: 'visibility-not-ranking',
            text:
              '人物比较最容易滑向排名：谁的贡献更大、谁承担的风险更高、谁更值得纪念。但当三个人的证据形态并不对称时，这种排名没有共同尺度。董其武、阎又文和苏开元首先应当被放回各自的材料体系，而不是被压进同一张英雄榜。',
            mode: 'interpretation',
            claim_ids: [],
            source_ids: [],
            publication_status: 'review_only',
            risk_flags: ['comparison_not_ranking', 'asymmetric_evidence'],
            provenance_layer: 'editorial',
          },
          {
            id: 'three-visibility-paths',
            text:
              '这篇文章只提出三条观察路径：公开军政履历如何形成稳定传记，秘密工作如何在后来获得档案说明，以及家属记忆中的人物如何等待身份桥和原件补全。三条路径可以互相照亮，却不能互相代替证明。',
            mode: 'interpretation',
            claim_ids: [],
            source_ids: [],
            publication_status: 'review_only',
            risk_flags: ['no_cross_person_proof'],
            provenance_layer: 'editorial',
          },
        ],
      },
      {
        id: 'sukaiyuan-anchor',
        title: '苏开元：先从一条可以回到版面的记录开始',
        paragraphs: [
          {
            id: 'pingdiquan-contemporaneous-anchor',
            text:
              '目前可以稳定展示的一条同期锚点来自朱自清《绥行纪略》：1936年11月21日的平地泉段落写到“遇留守司令苏开元团长”。这句话能确认记录者、日期、地点和当时使用的称谓，但不能独自证明家族身份、完整军旅履历或后来的秘密活动。',
            mode: 'source_backed',
            claim_ids: ['CL-013'],
            source_ids: ['SRC-013'],
            publication_status: 'review_only',
            risk_flags: ['candidate_identity', 'locator_bounded'],
            provenance_layer: 'audited',
          },
          {
            id: 'student-organization-response',
            text:
              '同一段还记录了苏开元对学生救国会组织方式的答复：可以加入自卫会共同工作，也可以单独办理以保持独立性。它适合讨论一个人在具体场合说了什么，不适合被扩写成贯穿一生的政治立场或组织身份。',
            mode: 'source_backed',
            claim_ids: ['CL-014'],
            source_ids: ['SRC-013'],
            publication_status: 'review_only',
            risk_flags: ['do_not_infer_motive', 'do_not_infer_party_identity'],
            provenance_layer: 'audited',
          },
        ],
      },
      {
        id: 'dongqiwu-anchor',
        title: '董其武：公开材料为什么更容易形成连续履历',
        paragraphs: [
          {
            id: 'dongqiwu-gazette-anchor',
            text:
              '现有图谱中，董其武有一条可定位的政府公报任命记录：1933年3月9日，公报任命董其武为第七十三师第二百十八旅第四百三十六团团长。这条记录只证明该次纸面任命，不自动证明任期长度、所有后续行动，也不反向证明苏开元的经历。',
            mode: 'source_backed',
            claim_ids: ['CL-112'],
            source_ids: ['SRC-039', 'SRC-062'],
            publication_status: 'review_only',
            risk_flags: ['appointment_not_tenure', 'no_cross_person_proof'],
            provenance_layer: 'audited',
          },
          {
            id: 'public-record-visibility',
            text:
              '这条公报提示了一种“被看见”的机制：规范化的任命、番号和日期容易进入目录、数据库与后来的传记。材料形式更稳定，不等于人物天然更重要；它只意味着后人更容易建立一条可复核的时间线。',
            mode: 'interpretation',
            claim_ids: ['CL-112'],
            source_ids: ['SRC-039', 'SRC-062'],
            publication_status: 'review_only',
            risk_flags: ['interpretation_from_record_form'],
            provenance_layer: 'editorial',
          },
        ],
      },
      {
        id: 'yanyouwen-reference',
        title: '阎又文：为什么现在只能作为研究参照',
        paragraphs: [
          {
            id: 'yanyouwen-not-yet-a-proof',
            text:
              '阎又文经常被用于讨论秘密身份、身后公开与家庭知情边界，但当前苏开元公开图谱尚未为这些叙述建立同等粒度的原子主张和原文定位。在补齐人物卡、来源家族和具体定位前，他只能提示检索方向，不能充当苏开元身份或行动的旁证。',
            mode: 'question',
            claim_ids: [],
            source_ids: [],
            publication_status: 'not_for_media',
            risk_flags: [
              'missing_atomic_claims',
              'biography_not_yet_audited',
              'not_for_media',
            ],
            provenance_layer: 'editorial',
          },
        ],
      },
      {
        id: 'what-cannot-be-concluded',
        title: '三个人可以并置，但不能直接画等号',
        paragraphs: [
          {
            id: 'comparison-boundary',
            text:
              '从一条同期见闻、一条政府公报和一组尚待审计的公开传记，不能推出三个人拥有相同身份、承担相同任务或处在同一条秘密工作链。并置的价值是暴露材料差异，而不是用一个知名人物替另一个人物补完缺失的证据。',
            mode: 'interpretation',
            claim_ids: ['CL-013', 'CL-112'],
            source_ids: ['SRC-013', 'SRC-039', 'SRC-062'],
            publication_status: 'review_only',
            risk_flags: ['no_identity_transfer', 'no_causal_transfer'],
            provenance_layer: 'editorial',
          },
          {
            id: 'five-heroes-lead',
            text:
              '2025年的公开报道把苏开元列入1936年绥东战役“五个民族英雄”，但当前登记状态仍是临时线索。下一步需要找到报道所依据的同期报纸版面或独立原件，再判断能否讨论苏开元与董其武是否曾被同一时期的报道并列。',
            mode: 'question',
            claim_ids: ['CL-015'],
            source_ids: ['SRC-005'],
            publication_status: 'not_for_media',
            risk_flags: ['later_reporting', 'primary_source_missing', 'not_for_media'],
            provenance_layer: 'audited',
          },
        ],
      },
      {
        id: 'open-questions',
        title: '真正值得继续追的，不是传奇，而是四个可证伪问题',
        paragraphs: [
          {
            id: 'identity-bridge-question',
            text:
              '第一，1933、1936和1942年材料中的同名记录，能否用单位、职务序列、签名或人事档案完成身份闭环？在闭环以前，这些记录不得拼成一条确定传记。',
            mode: 'question',
            claim_ids: ['CL-013', 'CL-092', 'CL-168', 'CL-179'],
            source_ids: [
              'SRC-013',
              'SRC-039',
              'SRC-042',
              'SRC-095',
              'SRC-103',
              'SRC-104',
            ],
            publication_status: 'not_for_media',
            risk_flags: ['candidate_identity', 'not_for_media'],
            provenance_layer: 'audited',
          },
          {
            id: 'party-and-beiping-question',
            text:
              '第二，关于入党程序、北平活动、公安职务和具体案件的说法，分别能否找到组织档案、人事任免、同期文件或两个真正独立的参与者来源？在此之前，它们只能留在研究问题清单。',
            mode: 'question',
            claim_ids: ['CL-022', 'CL-030', 'CL-141'],
            source_ids: ['SRC-001', 'SRC-007', 'SRC-008', 'SRC-085'],
            publication_status: 'not_for_media',
            risk_flags: [
              'political_identity_unverified',
              'beiping_action_unverified',
              'role_scope_unverified',
              'not_for_media',
            ],
            provenance_layer: 'audited',
          },
          {
            id: 'yanyouwen-source-question',
            text:
              '第三，阎又文的公开叙述分别来自哪些原始档案、机构说明和参与者回忆？只有把“后来如何公开”拆成可定位主张，才可能进行材料机制上的比较。',
            mode: 'question',
            claim_ids: [],
            source_ids: [],
            publication_status: 'not_for_media',
            risk_flags: ['source_family_needed', 'not_for_media'],
            provenance_layer: 'editorial',
          },
          {
            id: 'public-memory-question',
            text:
              '第四，当档案、回忆、家属记忆和大众传播共同塑造人物形象时，哪些句子可以公开陈述，哪些只能保留为带出处的回忆，哪些必须明确说“目前不知道”？这才是这个专题希望持续追踪的核心问题。',
            mode: 'interpretation',
            claim_ids: [],
            source_ids: [],
            publication_status: 'review_only',
            risk_flags: ['editorial_boundary'],
            provenance_layer: 'editorial',
          },
        ],
      },
    ],
  },
] as const satisfies readonly TopicArticle[];

export type TopicSlug = (typeof topicArticles)[number]['slug'];

export function getTopicBySlug(slug: string): TopicArticle | undefined {
  return topicArticles.find((topic) => topic.slug === slug);
}

export function getTopicParagraphs(topic: TopicArticle): TopicParagraph[] {
  return topic.sections.flatMap((section) => [...section.paragraphs]);
}

export function getMediaEligibleTopicParagraphs(
  topic: TopicArticle,
): TopicParagraph[] {
  return getTopicParagraphs(topic).filter(
    (paragraph) =>
      paragraph.publication_status !== 'not_for_media' &&
      paragraph.provenance_layer !== 'legacy',
  );
}

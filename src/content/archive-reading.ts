export type ArchiveReadingMoment = {
  sourceId: string;
  era: string;
  title: string;
  opening: string;
  whatWeCanSee: string;
  unanswered: string;
  readingHref: string;
  storyHref: string;
};

/**
 * Reader-facing entry points for the archive. These lines deliberately only
 * paraphrase the linked source contract: they invite a reader into a moment,
 * without silently promoting a source locator into a completed biography.
 */
export const archiveReadingMoments: readonly ArchiveReadingMoment[] = [
  {
    sourceId: 'SRC-013',
    era: '1936 · 平地泉',
    title: '一行字，把家史带回平地泉',
    opening: '朱自清在校刊里写下：他在一次公开会面中，遇见“留守司令蘇開元團長”。',
    whatWeCanSee: '这一页把日期、地点、称谓与一次会面的轮廓，同时留在了纸上。',
    unanswered: '被写下的人是不是我的曾祖父？这一问，还需要更多原件回答。',
    readingHref: '/archives/SRC-013',
    storyHref: '/discover/1936-pingdiquan',
  },
  {
    sourceId: 'SRC-039',
    era: '1933 · 一条任命',
    title: '一个番号，让名字回到1933年',
    opening: '一则公报里，“蘇開元”与第四三五团团长的任命并列出现。',
    whatWeCanSee: '它让一段军职记录有了可回看的日期与正式出处。',
    unanswered: '任命之后是否到任、任职多久、身在何处，仍不是这一页能替我们补完的故事。',
    readingHref: '/archives/SRC-039',
    storyHref: '/evidence/appointment-1933',
  },
  {
    sourceId: 'SRC-095',
    era: '1942 · 一张编成表',
    title: '两个名字，在一张表里并排出现',
    opening: '日方编成表把李大超与蘇開元并列为高级参议。',
    whatWeCanSee: '它让两个后来会被反复提起的名字，在一个具体时点有了同框的资料现场。',
    unanswered: '同框不等于私交，更不等于一条秘密路线；真正的故事要从能看见的地方开始。',
    readingHref: '/archives/SRC-095',
    storyHref: '/evidence/chart-1942',
  },
] as const;

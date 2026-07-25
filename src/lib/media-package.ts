import {
  isMediaEligible,
  mediaReviewChecklist,
  type DistributionPackage,
  type MediaMotherContent,
  type MediaPlatform,
  type MediaTheme,
} from '@/content/media-studio';

export interface MediaTextFile {
  path: string;
  content: string;
}

function splitSentences(value: string): string[] {
  return value
    .split(/(?<=[。！？])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatSrt(sentences: readonly string[]): string {
  return sentences
    .slice(0, 8)
    .map((sentence, index) => {
      const start = index * 6;
      const end = start + 5;
      return `${index + 1}\n00:00:${String(start).padStart(2, '0')},000 --> 00:00:${String(end).padStart(2, '0')},500\n${sentence}`;
    })
    .join('\n\n');
}

function formatVtt(sentences: readonly string[]): string {
  const cues = sentences
    .slice(0, 8)
    .map((sentence, index) => {
      const start = index * 6;
      const end = start + 5;
      return `00:00:${String(start).padStart(2, '0')}.000 --> 00:00:${String(end).padStart(2, '0')}.500\n${sentence}`;
    })
    .join('\n\n');
  return `WEBVTT\n\n${cues}\n`;
}

export function buildDistributionPackage(
  content: MediaMotherContent,
  platform: MediaPlatform,
  theme: MediaTheme,
  generatedAt: string,
): DistributionPackage {
  if (!isMediaEligible(content)) {
    throw new Error('这条母内容被传播门禁阻断，不能生成媒体包。');
  }
  if (platform.direct_publish !== false) {
    throw new Error('V0.1 不允许平台直发。');
  }

  const distributionPackage: DistributionPackage = {
    schema_version: '1.0',
    package_id: [
      content.id,
      platform.id,
      theme.id,
      content.revision_hash.slice(7, 19),
    ].join('--'),
    package_status: 'review_only',
    generated_at: generatedAt,
    source: {
      id: content.id,
      revision_hash: content.revision_hash,
      title: content.title,
      editorial_label: content.editorial_label,
    },
    platform: {
      id: platform.id,
      name: platform.name,
      dimensions: platform.dimensions,
      direct_publish: false,
    },
    theme: {
      id: theme.id,
      name: theme.name,
    },
    evidence_snapshot: {
      claim_ids: [...content.evidence_snapshot.claim_ids],
      source_ids: [...content.evidence_snapshot.source_ids],
      excluded_claim_ids: [],
      excluded_source_ids: [],
    },
    rights_passport: content.rights_passport,
    delivery: {
      method: 'browser_zip',
      contains_localhost_links: false,
      contains_platform_token: false,
      human_review_required: true,
    },
    manual_review_checklist: mediaReviewChecklist,
  };

  assertSafeDistributionPackage(distributionPackage);
  return distributionPackage;
}

export function assertSafeDistributionPackage(
  distributionPackage: DistributionPackage,
): void {
  const serialized = JSON.stringify(distributionPackage).toLowerCase();
  const forbiddenFragments = [
    '127.0.0.1',
    'http://localhost',
    'https://localhost',
    'not_for_media',
    '"provenance_layer":"legacy"',
    'bearer ',
    'appsecret',
    'oauth_token',
  ];
  const forbidden = forbiddenFragments.find((fragment) =>
    serialized.includes(fragment),
  );
  if (forbidden) {
    throw new Error(`媒体包安全检查未通过：发现 ${forbidden}`);
  }
  if (
    distributionPackage.package_status !== 'review_only' ||
    distributionPackage.platform.direct_publish !== false
  ) {
    throw new Error('V0.1 媒体包必须保持 review_only 且禁止直发。');
  }
}

export function buildPlatformCaption(
  content: MediaMotherContent,
  platform: MediaPlatform,
): string {
  const tags =
    platform.id === 'xiaohongshu'
      ? '#家族史 #AI知识工程 #历史研究 #苏开元计划'
      : platform.id === 'wechat_official'
        ? '苏开元计划｜历史研究｜AI知识工程'
        : '#苏开元计划 #家族史研究 #AI';

  return [
    content.hook,
    '',
    content.angle,
    '',
    splitSentences(content.body).slice(0, 3).join(''),
    '',
    '注：当前为内部审稿素材。事实、解释与文学内容已分层；发布前仍需人工复核来源与权利。',
    '',
    tags,
  ].join('\n');
}

export function buildMediaTextFiles(
  content: MediaMotherContent,
  platform: MediaPlatform,
  distributionPackage: DistributionPackage,
): MediaTextFile[] {
  const sentences = splitSentences(content.body);
  const caption = buildPlatformCaption(content, platform);
  const common: MediaTextFile[] = [
    {
      path: 'manifest.json',
      content: `${JSON.stringify(distributionPackage, null, 2)}\n`,
    },
    {
      path: 'RIGHTS-PASSPORT.json',
      content: `${JSON.stringify(distributionPackage.rights_passport, null, 2)}\n`,
    },
    {
      path: 'REVIEW-CHECKLIST.md',
      content: [
        '# 发布前人工审核',
        '',
        ...mediaReviewChecklist.map((item) => `- [ ] ${item}`),
        '',
        '> 当前包状态：review_only。本站不会代替你自动发布。',
        '',
      ].join('\n'),
    },
    {
      path: 'caption.md',
      content: `${caption}\n`,
    },
    {
      path: 'source-note.txt',
      content: [
        content.title,
        `内容修订哈希：${content.revision_hash}`,
        `内容标签：${content.editorial_label}`,
        `主张编号：${content.evidence_snapshot.claim_ids.join('、') || '无'}`,
        `来源编号：${content.evidence_snapshot.source_ids.join('、') || '无'}`,
        '',
        content.body,
        '',
      ].join('\n'),
    },
  ];

  if (platform.id === 'xiaohongshu') {
    return [
      ...common,
      {
        path: 'xiaohongshu-carousel.md',
        content: [
          '# 小红书多页图文卡',
          '',
          `## 01 封面\n${content.hook}`,
          `## 02 为什么值得问\n${content.angle}`,
          ...sentences
            .slice(0, 5)
            .map((sentence, index) => `## ${String(index + 3).padStart(2, '0')} 证据边界\n${sentence}`),
          '## 末页\n这不是功劳排名，而是一份可以继续核对的问题清单。',
          '',
        ].join('\n\n'),
      },
    ];
  }

  if (platform.id === 'short_video') {
    return [
      ...common,
      {
        path: 'voiceover.md',
        content: [
          '# 30–60秒口播稿',
          '',
          `开场：${content.hook}`,
          `转折：${content.angle}`,
          ...sentences.slice(0, 6),
          '收束：先看证据怎样被保存，再讨论一个人怎样被历史看见。',
          '',
        ].join('\n\n'),
      },
      {
        path: 'storyboard.md',
        content: [
          '# 竖屏分镜',
          '',
          '- 00:00–00:05｜标题卡：问题，不是结论',
          '- 00:05–00:18｜材料卡：显示主张编号与来源编号',
          '- 00:18–00:36｜边界卡：能确认什么，不能推出什么',
          '- 00:36–00:50｜待核卡：下一步应该找哪类原件',
          '- 00:50–00:60｜结尾卡：内部审稿，发布前人工复核',
          '',
        ].join('\n'),
      },
      { path: 'subtitles.srt', content: `${formatSrt(sentences)}\n` },
    ];
  }

  if (platform.id === 'wechat_official') {
    const paragraphs = content.body
      .split('\n\n')
      .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
      .join('\n');
    return [
      ...common,
      {
        path: 'wechat-article.html',
        content: [
          '<!doctype html>',
          '<html lang="zh-CN"><meta charset="utf-8">',
          `<title>${escapeHtml(content.title)}</title>`,
          '<article>',
          `<h1>${escapeHtml(content.title)}</h1>`,
          `<p><strong>${escapeHtml(content.angle)}</strong></p>`,
          paragraphs,
          '<hr>',
          `<p>主张编号：${escapeHtml(content.evidence_snapshot.claim_ids.join('、') || '无')}</p>`,
          `<p>来源编号：${escapeHtml(content.evidence_snapshot.source_ids.join('、') || '无')}</p>`,
          '<p>当前状态：内部审稿／尚未授权发布。</p>',
          '</article></html>',
          '',
        ].join('\n'),
      },
      {
        path: 'summary.txt',
        content: `${content.hook}\n${content.angle}\n`,
      },
    ];
  }

  if (platform.id === 'moments') {
    return [
      ...common,
      {
        path: 'moments-copy.txt',
        content: [
          content.hook,
          content.angle,
          '我正在把家族材料、同期史料和AI知识工程连接起来。这次先不急着下结论，只展示证据到哪里、问题还剩什么。',
          '（内部审稿，发布前人工复核）',
          '',
        ].join('\n\n'),
      },
    ];
  }

  return [
    ...common,
    {
      path: 'long-video-script.md',
      content: [
        '# B站／YouTube 长视频脚本',
        '',
        `## 冷开场\n${content.hook}`,
        `## 第一章：问题如何被改写\n${content.angle}`,
        `## 第二章：逐条看材料\n${sentences.slice(0, 4).join('\n\n')}`,
        `## 第三章：不能推出什么\n${sentences.slice(4, 7).join('\n\n') || '回到来源定位，停止跨人物补证。'}`,
        '## 结尾\n真正值得追问的，是材料怎样决定一个人能否被历史看见。',
        '',
      ].join('\n\n'),
    },
    {
      path: 'chapters.txt',
      content: [
        '00:00 问题，不是排名',
        '01:15 三种材料形态',
        '03:40 可以确认的最小事实',
        '06:20 不能跨越的证据边界',
        '08:10 下一轮查档清单',
        '',
      ].join('\n'),
    },
    { path: 'subtitles.srt', content: `${formatSrt(sentences)}\n` },
    { path: 'subtitles.vtt', content: formatVtt(sentences) },
  ];
}

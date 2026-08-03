import {
  evaluateMediaGate,
  mediaGateReasonLabels,
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

function assertMediaContentEligible(content: MediaMotherContent): void {
  const gate = evaluateMediaGate(content);
  if (!gate.allowed) {
    const explanation = gate.reasons
      .map((reason) => mediaGateReasonLabels[reason])
      .join('；');
    throw new Error(`传播门禁已阻断：${explanation}`);
  }
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
  assertMediaContentEligible(content);
  if (platform.direct_publish !== false) {
    throw new Error('V0.1 不允许平台直发。');
  }

  const distributionPackage: DistributionPackage = {
    schema_version: '1.1',
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
      topic_mode: 'source_backed',
      editorial_label: content.editorial_label,
      disclosure_label: content.disclosure_label,
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
    traceability: {
      claims: content.traceability.claims.map((claim) => ({
        ...claim,
        source_ids: [...claim.source_ids],
      })),
      sources: content.traceability.sources.map((source) => ({
        ...source,
        rights_registry_refs: [...source.rights_registry_refs],
      })),
      source_families: content.traceability.source_families.map((family) => ({
        ...family,
        source_ids: [...family.source_ids],
      })),
    },
    rights_passport: { ...content.rights_passport },
    gate: {
      decision: 'allow_review_package',
      reasons: [],
    },
    policy: {
      must_not_deploy: true,
      auto_publish: false,
      external_egress: 'deny',
      platform_accounts_connected: false,
    },
    delivery: {
      method: 'browser_zip',
      contains_localhost_links: false,
      contains_platform_token: false,
      human_review_required: true,
      auto_publish: false,
      external_egress: 'deny',
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
    'legacy-unverified',
    'legacy-draft',
    'private-runtime',
    'file://',
    '/users/',
    '/home/',
    'bearer ',
    'appsecret',
    'oauth_token',
    'oauth-token',
    'api_key',
    'api-key',
    'wxid_',
  ];
  const forbidden = forbiddenFragments.find((fragment) =>
    serialized.includes(fragment),
  );
  if (forbidden) {
    throw new Error(`媒体包安全检查未通过：发现 ${forbidden}`);
  }
  if (
    distributionPackage.schema_version !== '1.1' ||
    distributionPackage.package_status !== 'review_only' ||
    distributionPackage.platform.direct_publish !== false ||
    distributionPackage.source.topic_mode !== 'source_backed' ||
    distributionPackage.source.editorial_label !== 'fact' ||
    distributionPackage.source.disclosure_label.trim().length < 4 ||
    distributionPackage.gate.decision !== 'allow_review_package' ||
    distributionPackage.gate.reasons.length !== 0 ||
    distributionPackage.policy.must_not_deploy !== true ||
    distributionPackage.policy.auto_publish !== false ||
    distributionPackage.policy.external_egress !== 'deny' ||
    distributionPackage.policy.platform_accounts_connected !== false ||
    distributionPackage.delivery.auto_publish !== false ||
    distributionPackage.delivery.external_egress !== 'deny' ||
    distributionPackage.delivery.contains_localhost_links !== false ||
    distributionPackage.delivery.contains_platform_token !== false ||
    distributionPackage.delivery.human_review_required !== true
  ) {
    throw new Error(
      '媒体包必须保持 review_only、source_backed、must_not_deploy、external_egress=deny 且禁止直发。',
    );
  }
  if (
    distributionPackage.rights_passport.rights_traceable !== true ||
    distributionPackage.rights_passport.review_reuse_authorized !== true ||
    distributionPackage.rights_passport.rights_status !==
      'review_reuse_allowed' ||
    distributionPackage.rights_passport.reuse_scope !==
      'internal_review_only' ||
    !distributionPackage.rights_passport.rights_basis.trim() ||
    distributionPackage.rights_passport.registry_refs.length === 0 ||
    distributionPackage.rights_passport.third_party_assets === 'blocked' ||
    distributionPackage.rights_passport.public_release_authorized !== false
  ) {
    throw new Error('媒体包权利护照未达到本地审稿复用门槛。');
  }
  if (
    distributionPackage.evidence_snapshot.claim_ids.length === 0 ||
    distributionPackage.evidence_snapshot.source_ids.length === 0 ||
    distributionPackage.evidence_snapshot.excluded_claim_ids.length > 0 ||
    distributionPackage.evidence_snapshot.excluded_source_ids.length > 0
  ) {
    throw new Error('媒体包证据快照缺失或仍携带被排除内容。');
  }
  const tracedClaims = new Set(
    distributionPackage.traceability.claims.map((claim) => claim.claim_id),
  );
  const tracedSources = new Set(
    distributionPackage.traceability.sources.map((source) => source.source_id),
  );
  const familySourceIds = distributionPackage.traceability.source_families
    .flatMap((family) => family.source_ids);
  const familySourceSet = new Set(familySourceIds);
  const expectedClaimIds = [...distributionPackage.evidence_snapshot.claim_ids]
    .sort()
    .join('|');
  const actualClaimIds = [...tracedClaims].sort().join('|');
  const expectedSourceIds = [...distributionPackage.evidence_snapshot.source_ids]
    .sort()
    .join('|');
  const actualSourceIds = [...tracedSources].sort().join('|');
  if (
    distributionPackage.evidence_snapshot.claim_ids.some(
      (claimId) => !tracedClaims.has(claimId),
    ) ||
    distributionPackage.evidence_snapshot.source_ids.some(
      (sourceId) => !tracedSources.has(sourceId),
    ) ||
    expectedClaimIds !== actualClaimIds ||
    expectedSourceIds !== actualSourceIds
  ) {
    throw new Error('媒体包中的主张或来源无法回到定位记录。');
  }
  if (
    familySourceIds.length !== familySourceSet.size ||
    familySourceSet.size !== tracedSources.size ||
    [...tracedSources].some((sourceId) => !familySourceSet.has(sourceId)) ||
    distributionPackage.traceability.source_families.some((family) => {
      const members = distributionPackage.traceability.sources.filter(
        (source) => source.work_family_id === family.work_family_id,
      );
      return (
        !family.work_family_id.trim() ||
        family.evidence_weight !== 'one_independent_work' ||
        family.source_ids.length !== members.length ||
        family.source_ids.some(
          (sourceId) => !members.some((source) => source.source_id === sourceId),
        ) ||
        family.carrier_relationship !==
          (members.length > 1
            ? 'same_work_multiple_carriers'
            : 'single_carrier') ||
        (members.length > 1 &&
          members.filter((source) => source.carrier_role === 'primary_record')
            .length !== 1) ||
        (members.length > 1 &&
          members.some((source) => source.carrier_role === 'independent_source'))
      );
    })
  ) {
    throw new Error('媒体包没有把同一作品的多个载体收束为一个独立证据家族。');
  }
  if (
    distributionPackage.traceability.claims.some(
      (claim) =>
        claim.status !== 'working_verified' ||
        claim.identity_status === 'candidate' ||
        claim.contains_key_person_causality ||
        !claim.locator.trim(),
    )
  ) {
    throw new Error('媒体包包含未核身份、真人关键因果或不可定位主张。');
  }
  if (
    distributionPackage.traceability.sources.some(
      (source) =>
        source.public_tier !== 'P0' ||
        source.rights_status !== 'review_reuse_allowed' ||
        source.contains_family_private ||
        !source.work_family_id.trim() ||
        !source.locator.trim() ||
        !source.rights_basis.trim() ||
        source.rights_registry_refs.length === 0,
    )
  ) {
    throw new Error('媒体包包含私密来源、权利阻断或不可定位来源。');
  }
}

export function buildPlatformCaption(
  content: MediaMotherContent,
  platform: MediaPlatform,
): string {
  assertMediaContentEligible(content);
  const tags =
    platform.id === 'xiaohongshu'
      ? '#家族史 #AI知识工程 #历史研究 #苏开元计划'
      : platform.id === 'wechat_official'
        ? '苏开元计划｜历史研究｜AI知识工程'
        : '#苏开元计划 #家族史研究 #AI';

  return [
    `【${content.disclosure_label}】`,
    '',
    content.hook,
    '',
    content.angle,
    '',
    splitSentences(content.body).slice(0, 3).join(''),
    '',
    '注：当前为内部审稿素材。只使用可回到主张、来源定位和权利护照的来源支持内容；发布前仍需人工复核。',
    '',
    tags,
  ].join('\n');
}

export function buildMediaTextFiles(
  content: MediaMotherContent,
  platform: MediaPlatform,
  distributionPackage: DistributionPackage,
): MediaTextFile[] {
  assertMediaContentEligible(content);
  assertSafeDistributionPackage(distributionPackage);
  if (
    distributionPackage.source.id !== content.id ||
    distributionPackage.source.revision_hash !== content.revision_hash ||
    distributionPackage.platform.id !== platform.id
  ) {
    throw new Error('媒体包与当前母内容或平台不匹配。');
  }
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
      path: 'TRACEABILITY.json',
      content: `${JSON.stringify(distributionPackage.traceability, null, 2)}\n`,
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
        `段落模式：${content.topic_mode}`,
        `内容标签：${content.disclosure_label}`,
        `权利护照：${content.rights_passport.rights_id}`,
        `主张编号：${content.evidence_snapshot.claim_ids.join('、') || '无'}`,
        `来源编号：${content.evidence_snapshot.source_ids.join('、') || '无'}`,
        `独立作品家族：${content.traceability.source_families.length}（同一作品的索引、翻刻或不同载体不重复计权）`,
        `载体依赖：${content.traceability.source_families.map((family) => `${family.work_family_id}｜${family.source_ids.join(' + ')}｜${family.carrier_relationship}`).join('；')}`,
        `主张定位：${content.traceability.claims.map((claim) => `${claim.claim_id}｜${claim.locator}`).join('；')}`,
        `来源定位：${content.traceability.sources.map((source) => `${source.source_id}｜${source.locator}`).join('；')}`,
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

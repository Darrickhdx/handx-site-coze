import { createHash } from 'node:crypto';
import {
  allMediaMotherContent,
  mediaMotherContent,
  mediaPlatforms,
  mediaThemes,
} from '../src/content/media-studio';
import {
  getMediaEligibleTopicParagraphs,
  getTopicParagraphs,
  topicArticles,
  topicModes,
  topicPublicationStatuses,
} from '../src/content/topics';
import {
  assertSafeDistributionPackage,
  buildDistributionPackage,
  buildMediaTextFiles,
} from '../src/lib/media-package';

function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertUnique(values: readonly string[], label: string): void {
  const duplicates = values.filter(
    (value, index) => values.indexOf(value) !== index,
  );
  invariant(
    duplicates.length === 0,
    `${label} 存在重复值：${[...new Set(duplicates)].join('、')}`,
  );
}

const requiredTitle =
  '董其武、阎又文与苏开元：为什么有些人进入史册，有些人仍停在档案边缘？';
const forbiddenTopicPhrases = [
  '合于一身',
  '贡献最大',
  '代价最重',
  '一人促成北平',
  '档案至今封存',
  '他把自己藏得太成功',
];
const forbiddenLocalOnlyNovelFragments = [6, 14, 22, 28, 47, 116, 177]
  .flatMap((page) => {
    const suffix = String(page).padStart(3, '0');
    return [
      `page-${suffix}.webp`,
      `/novel/hero-wuming/pages/page-${suffix}`,
      `/novel/hero-wuming/pages-responsive/page-${suffix}`,
    ];
  });

assertUnique(
  topicArticles.map((topic) => topic.slug),
  '专题 slug',
);
invariant(
  topicArticles.some((topic) => topic.title === requiredTitle),
  '缺少计划指定的董其武／阎又文／苏开元问题型专题。',
);

let topicParagraphCount = 0;
let blockedTopicParagraphCount = 0;
for (const topic of topicArticles) {
  const paragraphs = getTopicParagraphs(topic);
  const eligible = getMediaEligibleTopicParagraphs(topic);
  topicParagraphCount += paragraphs.length;
  blockedTopicParagraphCount += paragraphs.length - eligible.length;
  assertUnique(
    topic.sections.map((section) => section.id),
    `${topic.slug} section id`,
  );
  assertUnique(
    paragraphs.map((paragraph) => paragraph.id),
    `${topic.slug} paragraph id`,
  );

  for (const paragraph of paragraphs) {
    invariant(
      topicModes.includes(paragraph.mode),
      `${paragraph.id} 的 mode 不合法。`,
    );
    invariant(
      topicPublicationStatuses.includes(paragraph.publication_status),
      `${paragraph.id} 的 publication_status 不合法。`,
    );
    invariant(
      paragraph.text.trim().length > 20,
      `${paragraph.id} 的正文过短。`,
    );
    if (paragraph.mode === 'source_backed') {
      invariant(
        paragraph.claim_ids.length > 0 && paragraph.source_ids.length > 0,
        `${paragraph.id} 标记为 source_backed，但缺少主张或来源编号。`,
      );
    }
    if (paragraph.provenance_layer === 'legacy') {
      invariant(
        paragraph.publication_status === 'not_for_media',
        `${paragraph.id} 的 Legacy 内容未被 not_for_media 阻断。`,
      );
    }
    if (paragraph.publication_status === 'not_for_media') {
      invariant(
        !eligible.some((candidate) => candidate.id === paragraph.id),
        `${paragraph.id} 错误进入媒体可用段落。`,
      );
    }
    for (const phrase of forbiddenTopicPhrases) {
      invariant(
        !paragraph.text.includes(phrase),
        `${paragraph.id} 含有计划明确禁止的结论性短语：${phrase}`,
      );
    }
  }
}

invariant(mediaThemes.length === 3, '媒体主题必须恰好为三套。');
assertUnique(
  mediaThemes.map((theme) => theme.id),
  '媒体主题 id',
);
assertUnique(
  mediaPlatforms.map((platform) => platform.id),
  '媒体平台 id',
);
assertUnique(
  allMediaMotherContent.map((content) => content.id),
  '母内容 id',
);
invariant(
  allMediaMotherContent.some(
    (content) =>
      content.publication_status === 'not_for_media' &&
      content.provenance_layer === 'legacy',
  ),
  '验证夹具缺少被门禁阻断的 Legacy 母内容。',
);
invariant(
  mediaMotherContent.every(
    (content) =>
      content.publication_status !== 'not_for_media' &&
      content.provenance_layer !== 'legacy',
  ),
  '安全母内容列表混入 not_for_media 或 Legacy。',
);

for (const content of allMediaMotherContent) {
  const actualHash = createHash('sha256')
    .update(content.body, 'utf8')
    .digest('hex');
  invariant(
    content.revision_hash === `sha256:${actualHash}`,
    `${content.id} 的 revision_hash 已过期。`,
  );
}

for (const platform of mediaPlatforms) {
  invariant(
    platform.direct_publish === false,
    `${platform.id} 错误启用了平台直发。`,
  );
  invariant(
    platform.dimensions.width > 0 && platform.dimensions.height > 0,
    `${platform.id} 缺少有效画布尺寸。`,
  );
  for (const workspace of platform.workspace_links) {
    invariant(
      workspace.href.startsWith('https://'),
      `${platform.id} 含有非 HTTPS 后台链接。`,
    );
    invariant(
      !/localhost|127\.0\.0\.1/u.test(workspace.href),
      `${platform.id} 含有本机后台链接。`,
    );
  }
}

let packageScenarioCount = 0;
for (const content of mediaMotherContent) {
  for (const platform of mediaPlatforms) {
    for (const theme of mediaThemes) {
      const distributionPackage = buildDistributionPackage(
        content,
        platform,
        theme,
        '2026-07-26T00:00:00.000Z',
      );
      assertSafeDistributionPackage(distributionPackage);
      invariant(
        distributionPackage.evidence_snapshot.excluded_claim_ids.length === 0 &&
          distributionPackage.evidence_snapshot.excluded_source_ids.length ===
            0,
        `${distributionPackage.package_id} 泄露了被门禁排除的编号。`,
      );
      const textFiles = buildMediaTextFiles(
        content,
        platform,
        distributionPackage,
      );
      const serializedFiles = textFiles
        .map((file) => `${file.path}\n${file.content}`)
        .join('\n')
        .toLowerCase();
      invariant(
        !serializedFiles.includes('127.0.0.1') &&
          !serializedFiles.includes('http://localhost') &&
          !serializedFiles.includes('https://localhost'),
        `${distributionPackage.package_id} 含有本机地址。`,
      );
      invariant(
        !serializedFiles.includes('legacy-unverified') &&
          !serializedFiles.includes('legacy-draft'),
        `${distributionPackage.package_id} 含有 Legacy 线索。`,
      );
      invariant(
        forbiddenLocalOnlyNovelFragments.every(
          (fragment) => !serializedFiles.includes(fragment),
        ),
        `${distributionPackage.package_id} 夹带小说 local_only 资产线索。`,
      );
      invariant(
        textFiles.some((file) => file.path === 'manifest.json') &&
          textFiles.some((file) => file.path === 'REVIEW-CHECKLIST.md') &&
          textFiles.some((file) => file.path === 'RIGHTS-PASSPORT.json'),
        `${distributionPackage.package_id} 缺少审计文件。`,
      );
      packageScenarioCount += 1;
    }
  }
}

console.log(
  [
    'PASS topics/media',
    `topics=${topicArticles.length}`,
    `paragraphs=${topicParagraphCount}`,
    `blocked_paragraphs=${blockedTopicParagraphCount}`,
    `safe_mother_content=${mediaMotherContent.length}`,
    `package_scenarios=${packageScenarioCount}`,
  ].join(' '),
);

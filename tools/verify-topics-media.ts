import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  allMediaMotherContent,
  evaluateMediaGate,
  mediaGateReasonLabels,
  mediaMotherContent,
  mediaPlatforms,
  mediaThemes,
  type DistributionPackage,
  type MediaGateReasonCode,
  type MediaMotherContent,
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

function expectThrows(action: () => unknown, label: string): void {
  let threw = false;
  try {
    action();
  } catch {
    threw = true;
  }
  invariant(threw, `${label} 本应被门禁阻断。`);
}

function cloneContent(
  content: MediaMotherContent,
  overrides: Partial<MediaMotherContent>,
): MediaMotherContent {
  return {
    ...content,
    ...overrides,
  };
}

const auditGraph = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'public/data/graph/audit-graph.json'),
    'utf8',
  ),
) as {
  claims: Array<{
    claim_id: string;
    status: string;
    locator: string;
    source_ids: string[];
    public_tier: string;
  }>;
  sources: Array<{
    source_id: string;
    locator: string;
    public_tier: string;
    public_url_status: string;
  }>;
};
const auditClaims = new Map(
  auditGraph.claims.map((claim) => [claim.claim_id, claim]),
);
const auditSources = new Map(
  auditGraph.sources.map((source) => [source.source_id, source]),
);
const rightsLedger = JSON.parse(
  readFileSync(
    resolve(process.cwd(), 'src/data/rights-passports.json'),
    'utf8',
  ),
) as {
  _meta: {
    must_not_deploy: boolean;
    public_ready: boolean;
  };
  records: Array<{
    passport_id: string;
    control_state: string;
    reuse_scope: string;
    media_gate: string;
    public_ready: boolean;
    must_not_deploy: boolean;
    provenance: { source_ids: string[] };
  }>;
};
invariant(
  rightsLedger._meta.must_not_deploy === true &&
    rightsLedger._meta.public_ready === false,
  '权利护照台账必须保持本地审阅状态。',
);
const rightsRecords = new Map(
  rightsLedger.records.map((record) => [record.passport_id, record]),
);

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
    (content) => evaluateMediaGate(content).allowed,
  ),
  '安全母内容列表混入未通过完整事实门禁的内容。',
);

const blockedMotherContent = allMediaMotherContent.filter(
  (content) => !evaluateMediaGate(content).allowed,
);
invariant(mediaMotherContent.length >= 1, '事实门禁后没有可生成的母内容。');
invariant(blockedMotherContent.length >= 1, '缺少门禁阻断样本。');

for (const content of allMediaMotherContent) {
  const decision = evaluateMediaGate(content);
  invariant(
    decision.reasons.every(
      (reason) => Boolean(mediaGateReasonLabels[reason]),
    ),
    `${content.id} 存在没有读者说明的门禁原因。`,
  );
  if (content.topic_mode !== 'source_backed') {
    invariant(
      content.disclosure_label.trim().length >= 4,
      `${content.id} 的问题／解释／文学内容缺少显式标签。`,
    );
    invariant(
      decision.reasons.includes('mode_not_source_backed'),
      `${content.id} 的非 source_backed 内容错误通过门禁。`,
    );
  }
  if (decision.allowed) {
    invariant(
      content.topic_mode === 'source_backed' &&
        content.editorial_label === 'fact' &&
        content.provenance_layer === 'audited',
      `${content.id} 没有满足来源支持事实摘录的基本门槛。`,
    );
    invariant(
      content.rights_passport.rights_traceable &&
        content.rights_passport.review_reuse_authorized &&
        content.rights_passport.rights_status === 'review_reuse_allowed' &&
        content.rights_passport.reuse_scope === 'internal_review_only' &&
        content.rights_passport.registry_refs.length > 0 &&
        content.rights_passport.third_party_assets !== 'blocked',
      `${content.id} 的权利护照未达到本地审稿复用门槛。`,
    );
    for (const passportId of content.rights_passport.registry_refs) {
      const rightsRecord = rightsRecords.get(passportId);
      invariant(
        rightsRecord,
        `${content.id} 的权利登记 ${passportId} 不存在。`,
      );
      invariant(
        rightsRecord.control_state === 'owned' &&
          rightsRecord.reuse_scope === 'internal_review_only' &&
          rightsRecord.media_gate === 'review_only' &&
          rightsRecord.public_ready === false &&
          rightsRecord.must_not_deploy === true,
        `${content.id}/${passportId} 未允许本地审稿复用。`,
      );
      invariant(
        content.evidence_snapshot.source_ids.every((sourceId) =>
          rightsRecord.provenance.source_ids.includes(sourceId),
        ),
        `${content.id}/${passportId} 没有覆盖媒体包的来源。`,
      );
    }
    assertUnique(
      content.evidence_snapshot.claim_ids,
      `${content.id} claim id`,
    );
    assertUnique(
      content.evidence_snapshot.source_ids,
      `${content.id} source id`,
    );
    assertUnique(
      content.traceability.claims.map((claim) => claim.claim_id),
      `${content.id} claim trace`,
    );
    assertUnique(
      content.traceability.sources.map((source) => source.source_id),
      `${content.id} source trace`,
    );
    assertUnique(
      content.traceability.source_families.map(
        (family) => family.work_family_id,
      ),
      `${content.id} source family`,
    );

    const familySourceIds = content.traceability.source_families.flatMap(
      (family) => family.source_ids,
    );
    invariant(
      familySourceIds.length === content.traceability.sources.length &&
        new Set(familySourceIds).size === familySourceIds.length &&
        content.traceability.sources.every((source) =>
          familySourceIds.includes(source.source_id),
        ),
      `${content.id} 没有把每个载体唯一归入作品家族。`,
    );
    for (const family of content.traceability.source_families) {
      const members = content.traceability.sources.filter(
        (source) => source.work_family_id === family.work_family_id,
      );
      invariant(
        family.evidence_weight === 'one_independent_work' &&
          family.source_ids.length === members.length &&
          family.carrier_relationship ===
            (members.length > 1
              ? 'same_work_multiple_carriers'
              : 'single_carrier') &&
          (members.length === 1 ||
            (members.filter((source) => source.carrier_role === 'primary_record')
              .length === 1 &&
              members
                .filter((source) => source.carrier_role !== 'primary_record')
                .every((source) => source.carrier_role === 'same_work_index'))),
        `${content.id}/${family.work_family_id} 错把同一作品载体当成独立互证。`,
      );
    }

    for (const trace of content.traceability.claims) {
      const auditClaim = auditClaims.get(trace.claim_id);
      invariant(auditClaim, `${content.id} 引用了不存在的 ${trace.claim_id}。`);
      invariant(
        auditClaim.status === trace.status &&
          auditClaim.locator === trace.locator &&
          auditClaim.public_tier === 'P0',
        `${content.id}/${trace.claim_id} 与审计图谱状态或定位不一致。`,
      );
      invariant(
        trace.identity_status !== 'candidate' &&
          !trace.contains_key_person_causality,
        `${content.id}/${trace.claim_id} 含未核身份或真人关键因果。`,
      );
      invariant(
        content.evidence_snapshot.source_ids.every((sourceId) =>
          trace.source_ids.includes(sourceId),
        ),
        `${content.id}/${trace.claim_id} 没有覆盖媒体包的全部来源。`,
      );
    }

    for (const trace of content.traceability.sources) {
      const auditSource = auditSources.get(trace.source_id);
      invariant(auditSource, `${content.id} 引用了不存在的 ${trace.source_id}。`);
      invariant(
        auditSource.public_tier === trace.public_tier &&
          auditSource.public_url_status === trace.public_url_status &&
          auditSource.locator.includes(trace.locator),
        `${content.id}/${trace.source_id} 与审计图谱公开层级或定位不一致。`,
      );
      invariant(
        trace.public_tier === 'P0' &&
          trace.rights_status === 'review_reuse_allowed' &&
          !trace.contains_family_private &&
          trace.work_family_id.trim().length > 8 &&
          trace.rights_basis.trim().length > 8 &&
          trace.rights_registry_refs.length > 0,
        `${content.id}/${trace.source_id} 未达到公开定位与复用权利门槛。`,
      );
      for (const passportId of trace.rights_registry_refs) {
        invariant(
          rightsRecords.has(passportId),
          `${content.id}/${trace.source_id} 的权利登记 ${passportId} 不存在。`,
        );
      }
    }
  }
}

const pingdiquanGate = evaluateMediaGate(
  allMediaMotherContent.find(
    (content) => content.id === 'pingdiquan-source-window',
  ) as MediaMotherContent,
);
invariant(
  pingdiquanGate.reasons.includes('unverified_identity'),
  '平地泉同名材料未被“身份未闭环”门禁阻断。',
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
        distributionPackage.schema_version === '1.1' &&
          distributionPackage.package_status === 'review_only' &&
          distributionPackage.source.topic_mode === 'source_backed' &&
          distributionPackage.gate.decision === 'allow_review_package' &&
          distributionPackage.policy.must_not_deploy === true &&
          distributionPackage.policy.auto_publish === false &&
          distributionPackage.policy.external_egress === 'deny' &&
          distributionPackage.policy.platform_accounts_connected === false,
        `${distributionPackage.package_id} 的发布安全合同不完整。`,
      );
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
          !serializedFiles.includes('https://localhost') &&
          !serializedFiles.includes('/users/') &&
          !serializedFiles.includes('/home/') &&
          !serializedFiles.includes('file://') &&
          !serializedFiles.includes('private-runtime') &&
          !serializedFiles.includes('bearer ') &&
          !serializedFiles.includes('appsecret') &&
          !serializedFiles.includes('oauth_token'),
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
          textFiles.some((file) => file.path === 'RIGHTS-PASSPORT.json') &&
          textFiles.some((file) => file.path === 'TRACEABILITY.json'),
        `${distributionPackage.package_id} 缺少审计文件。`,
      );
      packageScenarioCount += 1;
    }
  }
}

const safeFixture = mediaMotherContent[0];
const syntheticAbsolutePath = ['/', 'Users', 'example', 'private.txt'].join('/');
const requiredBlockedReasons: Array<{
  reason: MediaGateReasonCode;
  content: MediaMotherContent;
}> = [
  {
    reason: 'mode_not_source_backed',
    content: cloneContent(safeFixture, {
      topic_mode: 'interpretation',
      editorial_label: 'interpretation',
      disclosure_label: '观点／解释，不是史实结论',
    }),
  },
  {
    reason: 'missing_editorial_disclosure',
    content: cloneContent(safeFixture, { disclosure_label: '' }),
  },
  {
    reason: 'unverified_identity',
    content: cloneContent(safeFixture, {
      traceability: {
        ...safeFixture.traceability,
        claims: safeFixture.traceability.claims.map((claim, index) =>
          index === 0 ? { ...claim, identity_status: 'candidate' } : claim,
        ),
      },
    }),
  },
  {
    reason: 'key_person_causality',
    content: cloneContent(safeFixture, {
      content_risks: {
        ...safeFixture.content_risks,
        contains_key_person_causality: true,
      },
    }),
  },
  {
    reason: 'family_private_material',
    content: cloneContent(safeFixture, {
      content_risks: {
        ...safeFixture.content_risks,
        contains_family_private: true,
      },
    }),
  },
  {
    reason: 'source_rights_blocked',
    content: cloneContent(safeFixture, {
      traceability: {
        ...safeFixture.traceability,
        sources: safeFixture.traceability.sources.map((source, index) =>
          index === 0 ? { ...source, rights_status: 'blocked' } : source,
        ),
      },
    }),
  },
  {
    reason: 'source_rights_blocked',
    content: cloneContent(safeFixture, {
      traceability: {
        ...safeFixture.traceability,
        sources: safeFixture.traceability.sources.map((source, index) =>
          index === 0
            ? {
                ...source,
                rights_status: 'public_ready' as typeof source.rights_status,
              }
            : source,
        ),
      },
    }),
  },
  {
    reason: 'rights_not_traceable',
    content: cloneContent(safeFixture, {
      rights_passport: {
        ...safeFixture.rights_passport,
        rights_traceable: false,
      },
    }),
  },
  {
    reason: 'rights_reuse_not_allowed',
    content: cloneContent(safeFixture, {
      rights_passport: {
        ...safeFixture.rights_passport,
        review_reuse_authorized: false,
      },
    }),
  },
  {
    reason: 'rights_reuse_not_allowed',
    content: cloneContent(safeFixture, {
      rights_passport: {
        ...safeFixture.rights_passport,
        rights_status:
          'public_ready' as typeof safeFixture.rights_passport.rights_status,
      },
    }),
  },
  {
    reason: 'not_for_media',
    content: cloneContent(safeFixture, { publication_status: 'not_for_media' }),
  },
  {
    reason: 'legacy_content',
    content: cloneContent(safeFixture, { provenance_layer: 'legacy' }),
  },
  {
    reason: 'unsafe_content_fragment',
    content: cloneContent(safeFixture, {
      body: `${safeFixture.body}\n${syntheticAbsolutePath}`,
    }),
  },
];

for (const scenario of requiredBlockedReasons) {
  const decision = evaluateMediaGate(scenario.content);
  invariant(
    !decision.allowed && decision.reasons.includes(scenario.reason),
    `对抗样本没有触发 ${scenario.reason}。`,
  );
  expectThrows(
    () =>
      buildDistributionPackage(
        scenario.content,
        mediaPlatforms[0],
        mediaThemes[0],
        '2026-08-04T00:00:00.000Z',
      ),
    `对抗样本 ${scenario.reason}`,
  );
}

const safePackage = buildDistributionPackage(
  safeFixture,
  mediaPlatforms[0],
  mediaThemes[0],
  '2026-08-04T00:00:00.000Z',
);
const tamperedPolicy = JSON.parse(JSON.stringify(safePackage)) as DistributionPackage;
(tamperedPolicy.policy as { auto_publish: boolean }).auto_publish = true;
expectThrows(
  () => assertSafeDistributionPackage(tamperedPolicy),
  'auto_publish=true 包',
);
const tamperedPath = JSON.parse(JSON.stringify(safePackage)) as DistributionPackage;
(tamperedPath.source as { title: string }).title = syntheticAbsolutePath;
expectThrows(
  () => assertSafeDistributionPackage(tamperedPath),
  '绝对路径包',
);
const tamperedIdentity = JSON.parse(
  JSON.stringify(safePackage),
) as DistributionPackage;
(tamperedIdentity.traceability.claims[0] as { identity_status: string }).identity_status =
  'candidate';
expectThrows(
  () => assertSafeDistributionPackage(tamperedIdentity),
  '未核身份包',
);
const tamperedCarrierFamily = JSON.parse(
  JSON.stringify(safePackage),
) as DistributionPackage;
(
  tamperedCarrierFamily.traceability.source_families[0] as {
    carrier_relationship: string;
  }
).carrier_relationship = 'single_carrier';
expectThrows(
  () => assertSafeDistributionPackage(tamperedCarrierFamily),
  '同一作品多载体重复计权包',
);

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

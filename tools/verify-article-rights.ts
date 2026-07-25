import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { articleBodies } from '../src/content/editorial';
import { articleRightsPassports } from '../src/content/publication-rights';

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const projectRoot = resolve(process.cwd());
const research = JSON.parse(
  readFileSync(resolve(projectRoot, 'src/data/research.json'), 'utf8'),
) as { sources?: Array<{ source_id?: string }> };
const assetManifest = JSON.parse(
  readFileSync(resolve(projectRoot, 'public/assets/asset-manifest.json'), 'utf8'),
) as {
  assets?: Array<{
    path?: string;
    publishable?: boolean;
    rights_scope?: string;
  }>;
};

const articleSlugs = Object.keys(articleBodies).sort();
const passportSlugs = Object.keys(articleRightsPassports).sort();
assertCondition(
  JSON.stringify(articleSlugs) === JSON.stringify(passportSlugs),
  'Article bodies and rights passports must have exactly the same slugs',
);

const rightsIds = new Set<string>();
const researchSourceIds = new Set(
  (research.sources ?? []).map((source) => source.source_id).filter(Boolean),
);
const manifestAssets = new Map(
  (assetManifest.assets ?? []).map((asset) => [`/${asset.path}`, asset]),
);

for (const slug of articleSlugs) {
  const passport = articleRightsPassports[slug as keyof typeof articleRightsPassports];
  assertCondition(!rightsIds.has(passport.rightsId), `Duplicate rights id: ${passport.rightsId}`);
  rightsIds.add(passport.rightsId);
  assertCondition(passport.canonicalPath === `/discover/${slug}`, `Wrong canonical path: ${slug}`);
  assertCondition(passport.publicUrl === null, `${slug} must not have a public URL in local review`);
  assertCondition(
    passport.licenseState === 'no-license-granted',
    `${slug} must not grant an open license`,
  );
  assertCondition(
    passport.status === 'draft_all_rights_reserved',
    `${slug} must remain an all-rights-reserved local draft`,
  );

  for (const source of passport.sourceCredits) {
    const isInternalMethodReference = source.sourceId.startsWith('METHOD-')
      || source.sourceId.startsWith('RIGHTS-');
    assertCondition(
      researchSourceIds.has(source.sourceId) || isInternalMethodReference,
      `${slug} references unknown source id ${source.sourceId}`,
    );
    assertCondition(Boolean(source.creator && source.title && source.href), `${slug} has incomplete source credit`);
  }

  for (const material of passport.thirdPartyMaterials) {
    assertCondition(researchSourceIds.has(material.sourceId), `${slug} third-party material has unknown source`);
    assertCondition(
      Boolean(
        material.creator
        && material.workTitle
        && material.locator
        && material.sourceUrl
        && material.reuseNotice
      ),
      `${slug} third-party material ${material.materialId} is incomplete`,
    );
    if (material.assetPath) {
      const asset = manifestAssets.get(material.assetPath);
      assertCondition(Boolean(asset), `${material.assetPath} is missing from the asset manifest`);
      assertCondition(asset?.publishable === false, `${material.assetPath} must remain non-publishable`);
      assertCondition(
        asset?.rights_scope === 'local_internal_preview_only',
        `${material.assetPath} must remain local-preview-only`,
      );
      assertCondition(
        material.publishability === 'local-preview-only',
        `${material.materialId} conflicts with the asset publication gate`,
      );
    }
  }
}

console.log(JSON.stringify({
  status: 'PASS',
  articles: articleSlugs.length,
  rights_ids: [...rightsIds],
  license_state: 'no-license-granted',
  public_urls: 0,
}, null, 2));

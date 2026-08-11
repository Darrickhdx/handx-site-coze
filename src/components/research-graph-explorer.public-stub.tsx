'use client';

/**
 * Stands in for the research graph explorer in public-edition builds.
 *
 * The real component is 832 lines that read the audit graph's migration
 * records, claim buckets and identity statuses. Gating it with
 * `{!isPublicEdition && <ResearchGraphExplorer />}` stops it rendering but not
 * from being bundled — the import is static, so its code ships either way, and
 * the property names alone describe the research schema.
 *
 * next.config.ts resolves this file in its place when SITE_EDITION=public, so
 * the public bundle contains this and nothing else. It renders null because the
 * edition check above it means it is never reached; if it ever is, an empty
 * panel is the right failure.
 */
export function ResearchGraphExplorer(): null {
  return null;
}

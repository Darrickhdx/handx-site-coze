import { FileText, ArrowRight, Calendar, ShieldAlert } from 'lucide-react';
import { EvidenceBadge, EvidenceLevel } from './evidence-legend';
import { cn } from '@/lib/utils';

export type IdentityLinkStatus = 'not-applicable' | 'unresolved' | 'candidate' | 'verified' | 'rejected';

export interface ClaimCardProps {
  title: string;
  /** 主张内容（主字段） */
  content?: string;
  /** 主张内容（别名，兼容 summary 写法） */
  summary?: string;
  evidenceLevel: EvidenceLevel;
  /** 同一作品可能有多个载体，载体数不能当作独立来源数。 */
  carrierCount?: number;
  /** 经同源去重后的独立来源数。 */
  independenceCount?: number;
  /** 当数字容易被误读时，改用一条明确的来源解释。 */
  sourceInterpretation?: string;
  /** 旧字段兼容；新页面应使用 carrierCount。 */
  sourceCount?: number;
  certainty?: 'high' | 'medium' | 'low';
  /** 日期（主字段） */
  date?: string;
  /** 最后更新日期（别名） */
  lastUpdated?: string;
  disputed?: boolean;
  identityLinkStatus?: IdentityLinkStatus;
  sceneEligible?: boolean;
  verifiedExtent?: string;
  identityAnchorIds?: string[];
  identityAnchorsRedacted?: boolean;
  tags?: string[];
  href?: string;
  className?: string;
}

const certaintyConfig = {
  high: { label: '置信度高', color: 'text-confirmed' },
  medium: { label: '置信度中', color: 'text-candidate' },
  low: { label: '置信度低', color: 'text-disputed' },
};

export function ClaimCard({
  title,
  content,
  summary,
  evidenceLevel,
  carrierCount,
  independenceCount,
  sourceInterpretation,
  sourceCount,
  certainty,
  date,
  lastUpdated,
  disputed,
  identityLinkStatus,
  sceneEligible,
  verifiedExtent,
  identityAnchorIds,
  identityAnchorsRedacted,
  tags,
  href,
  className,
}: ClaimCardProps) {
  const bodyText = content ?? summary ?? '';
  const dateText = date ?? lastUpdated;
  const displayedCarrierCount = carrierCount ?? sourceCount;
  const certaintyCfg = certainty ? certaintyConfig[certainty] : null;
  const identityBoundaryLabels = {
    unresolved: '身份链：unresolved（未解决）',
    candidate: '身份链：candidate（候选，未证）',
    rejected: '身份链：rejected（已拒绝并人）',
  } as const;
  const leftBorderColor = {
    archive: 'border-l-evidence-high',
    official: 'border-l-evidence-medium',
    memoir: 'border-l-evidence-low',
    oral: 'border-l-evidence-oral',
    speculation: 'border-l-muted-foreground',
  }[evidenceLevel];

  const CardTag = href ? 'a' : 'div';

  return (
    <CardTag
      href={href}
      className={cn(
        'block bg-card border border-border/40 rounded-lg p-4 sm:p-5 shadow-card',
        'border-l-4',
        leftBorderColor,
        disputed && 'ring-1 ring-candidate/20',
        'hover:shadow-float hover:border-border/60 transition-all duration-200',
        href && 'cursor-pointer',
        className
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h3 className="font-serif font-semibold text-lg sm:text-lg text-foreground leading-snug pr-2">
          {title}
        </h3>
        <EvidenceBadge level={evidenceLevel} size="xs" />
      </div>

      <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-3">
        {bodyText}
      </p>

      {identityLinkStatus && identityLinkStatus in identityBoundaryLabels && (
        <div className="mb-3 rounded-md border border-candidate/30 bg-candidate/10 px-3 py-2 text-xs font-semibold text-candidate">
          {identityBoundaryLabels[
            identityLinkStatus as keyof typeof identityBoundaryLabels
          ]}
          <span className="block mt-1 font-normal text-muted-foreground">
            姓名相同、字段相容或同时出现，都不足以把记录并入同一人的连续生平。
          </span>
        </div>
      )}

      {sceneEligible === false && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-disputed/30 bg-disputed/10 px-3 py-2 text-xs font-semibold text-disputed">
          <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            scene_eligible=false：不得直接写成真人场景、对白、连续履历或亲属身份事实。
          </span>
        </div>
      )}

      {verifiedExtent && (
        <details className="mb-3 rounded-md border border-border/40 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <summary className="cursor-pointer font-medium text-foreground/80">查看本主张实际核验范围</summary>
          <p className="mt-2 leading-relaxed">{verifiedExtent}</p>
          {identityAnchorIds && identityAnchorIds.length > 0 && identityAnchorIds[0] !== 'none' && (
            <p className="mt-2 font-mono">
              公开身份锚：{identityAnchorIds.join('、')}
              {identityAnchorsRedacted ? '（部分非公开锚已移除）' : ''}
            </p>
          )}
        </details>
      )}

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
        {displayedCarrierCount !== undefined && (
          <span className="inline-flex items-center gap-1">
            <FileText className="w-3 h-3" />
            载体 {displayedCarrierCount} 个
          </span>
        )}
        {independenceCount !== undefined && (
          <span className="inline-flex items-center gap-1 font-medium text-foreground/70">
            独立来源 {independenceCount} 个
          </span>
        )}
        {sourceInterpretation && (
          <span className="basis-full inline-flex items-start gap-1 font-medium text-foreground/70">
            <FileText className="w-3 h-3 mt-0.5 shrink-0" />
            {sourceInterpretation}
          </span>
        )}
        {certaintyCfg && (
          <span className={cn('inline-flex items-center gap-1 font-medium', certaintyCfg.color)}>
            {certaintyCfg.label}
          </span>
        )}
        {dateText && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {dateText}
          </span>
        )}
        {tags && tags.length > 0 && (
          <span className="inline-flex items-center gap-1">
            {tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
                {tag}
              </span>
            ))}
          </span>
        )}
        {href && (
          <span className="ml-auto inline-flex items-center gap-1 text-primary font-medium">
            查看详情
            <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </div>
    </CardTag>
  );
}

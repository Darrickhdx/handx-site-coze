'use client';

import { FileArchive, BookOpen, ScrollText, Newspaper, MessageCircle, BookMarked, ExternalLink, Copy, Check } from 'lucide-react';
import { EvidenceBadge, EvidenceLevel } from './evidence-legend';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export type SourceType = 'archive' | 'official_record' | 'memoir' | 'newspaper' | 'oral' | 'other';

const typeConfig: Record<SourceType, { label: string; icon: typeof FileArchive; colorClass: string; bgClass: string; borderClass: string }> = {
  archive: { label: '档案原件', icon: FileArchive, colorClass: 'text-evidence-high', bgClass: 'bg-evidence-high/5', borderClass: 'border-t-evidence-high/40' },
  official_record: { label: '官方出版物', icon: BookOpen, colorClass: 'text-evidence-medium', bgClass: 'bg-evidence-medium/5', borderClass: 'border-t-evidence-medium/40' },
  memoir: { label: '回忆录', icon: ScrollText, colorClass: 'text-evidence-low', bgClass: 'bg-evidence-low/5', borderClass: 'border-t-evidence-low/40' },
  newspaper: { label: '报纸期刊', icon: Newspaper, colorClass: 'text-evidence-high', bgClass: 'bg-evidence-high/5', borderClass: 'border-t-evidence-high/40' },
  oral: { label: '口述历史', icon: MessageCircle, colorClass: 'text-evidence-oral', bgClass: 'bg-evidence-oral/5', borderClass: 'border-t-evidence-oral/40' },
  other: { label: '其他', icon: BookMarked, colorClass: 'text-muted-foreground', bgClass: 'bg-muted', borderClass: 'border-t-muted-foreground/40' },
};

export type AccessStatus = 'public' | 'restricted' | 'lost';
export type ContentScope = 'metadata-only' | 'cover-visible' | 'body-verified' | 'interpreted';

const accessConfig: Record<AccessStatus, { label: string; color: string; bg: string }> = {
  public: { label: '公开可查', color: 'text-confirmed', bg: 'bg-confirmed/10' },
  restricted: { label: '有限公开', color: 'text-candidate', bg: 'bg-candidate/10' },
  lost: { label: '已佚/待访求', color: 'text-muted-foreground', bg: 'bg-muted' },
};

const contentScopeConfig: Record<ContentScope, { label: string; className: string; boundary: string }> = {
  'metadata-only': {
    label: 'metadata-only · 仅元数据',
    className: 'border-disputed/30 bg-disputed/10 text-disputed',
    boundary: '只能证明目录或索引如此记录，不得当作未见正文的内容。',
  },
  'cover-visible': {
    label: 'cover-visible · 仅封面/预览可见',
    className: 'border-disputed/30 bg-disputed/10 text-disputed',
    boundary: '只能陈述封面或预览中可见的文字，不得推出人物履历或正文内容。',
  },
  'body-verified': {
    label: 'body-verified · 定位范围内正文已核',
    className: 'border-confirmed/30 bg-confirmed/10 text-confirmed',
    boundary: '只对下列verified_extent负责；未读页面、附件和卷内其他范围不随之升级。',
  },
  interpreted: {
    label: 'interpreted · 解释性载体',
    className: 'border-candidate/30 bg-candidate/10 text-candidate',
    boundary: '这是解释、转录或派生层，不得冒充原件正文或增加独立证据数。',
  },
};

export interface SourceCardProps {
  id?: string;
  sourceId?: string;
  title: string;
  type: SourceType;
  author?: string;
  publisher?: string;
  year?: number;
  accessStatus: AccessStatus;
  evidenceLevel: EvidenceLevel;
  excerpt?: string;
  citationCount?: number;
  publicUrl?: string;
  carrierStatus?: string;
  representationOf?: string;
  dateLabel?: string;
  contentScope: ContentScope;
  verifiedExtent: string;
  totalExtentKnown: string;
  unreadExtent: string;
  className?: string;
}

export function SourceCard({
  id,
  title,
  sourceId,
  type,
  author,
  publisher,
  year,
  accessStatus,
  evidenceLevel,
  excerpt,
  citationCount,
  publicUrl,
  carrierStatus,
  representationOf,
  dateLabel,
  contentScope,
  verifiedExtent,
  totalExtentKnown,
  unreadExtent,
  className,
}: SourceCardProps) {
  const typeCfg = typeConfig[type];
  const accessCfg = accessConfig[accessStatus];
  const TypeIcon = typeCfg.icon;
  const scopeCfg = contentScopeConfig[contentScope];
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const citation = `${author ? author + '. ' : ''}${title}${publisher ? '[' + publisher + ']' : ''}${year ? ', ' + year : ''}.`;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(citation);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 4000);
    }
  };

  const isLost = accessStatus === 'lost';

  return (
    <div
      id={id ?? sourceId}
      className={cn(
        'scroll-mt-28 bg-card border border-border/40 rounded-lg shadow-card overflow-hidden transition-all duration-200 hover:shadow-float',
        'border-t-4',
        typeCfg.borderClass,
        isLost && 'opacity-60',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn('w-7 h-7 rounded flex items-center justify-center shrink-0', typeCfg.bgClass)}>
            <TypeIcon className={cn('w-4 h-4', typeCfg.colorClass)} />
          </div>
          <span className={cn('text-xs font-medium shrink-0', typeCfg.colorClass)}>
            {typeCfg.label}
          </span>
        </div>
        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium shrink-0', accessCfg.color, accessCfg.bg)}>
          {accessCfg.label}
        </span>
      </div>

      {/* Title & meta */}
      <div className="px-4 pb-3">
        {sourceId && (
          <p className="font-mono text-[11px] text-primary mb-1">{sourceId}</p>
        )}
        <h3 className={cn(
          'font-serif font-semibold text-base text-foreground mb-1.5 leading-snug',
          isLost && 'line-through decoration-muted-foreground/50'
        )}>
          {title}
        </h3>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {author && <span>{author}</span>}
          {publisher && <span>{publisher}</span>}
          {year && <span>{year}年</span>}
          {dateLabel && <span>{dateLabel}</span>}
        </div>
        {(carrierStatus || representationOf) && (
          <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
            {carrierStatus && <p>载体状态：{carrierStatus}</p>}
            {representationOf && <p>同源对应：{representationOf}</p>}
          </div>
        )}
      </div>

      <div className="px-4 pb-3">
        <div className={cn('rounded-md border px-3 py-2 text-xs', scopeCfg.className)}>
          <p className="font-semibold">{scopeCfg.label}</p>
          <p className="mt-1 leading-relaxed text-muted-foreground">{scopeCfg.boundary}</p>
        </div>
        <dl className="mt-2 space-y-1 rounded-md border border-border/30 bg-muted/20 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          <div>
            <dt className="inline font-semibold text-foreground/80">verified_extent：</dt>
            <dd className="inline">{verifiedExtent}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-foreground/80">total_extent_known：</dt>
            <dd className="inline">{totalExtentKnown}</dd>
          </div>
          <div>
            <dt className="inline font-semibold text-foreground/80">unread_extent：</dt>
            <dd className="inline">{unreadExtent}</dd>
          </div>
        </dl>
      </div>

      {/* Excerpt */}
      {excerpt && (
        <div className="px-4 pb-3">
          <blockquote className="text-xs text-muted-foreground/90 leading-relaxed border-l-2 border-border pl-3 italic line-clamp-3">
            &ldquo;{excerpt}&rdquo;
          </blockquote>
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border/30 bg-muted/30 flex flex-wrap items-center justify-between gap-1 text-xs">
        <div className="flex items-center gap-3">
          <EvidenceBadge level={evidenceLevel} size="xs" />
          {citationCount !== undefined && (
            <span className="text-muted-foreground">被引用 {citationCount} 次</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="inline-flex min-h-11 items-center gap-1 px-2 text-primary hover:text-primary/80 font-medium transition-colors"
          aria-label={`复制《${title}》的引用格式`}
        >
          {copyStatus === 'copied' ? (
            <>
              <Check className="w-3.5 h-3.5" />
              已复制
            </>
          ) : copyStatus === 'error' ? (
            <>
              <Copy className="w-3.5 h-3.5" />
              复制失败
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              引用
            </>
          )}
        </button>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center gap-1 px-2 text-primary hover:text-primary/80 font-medium"
            aria-label={`打开《${title}》的原始入口（新窗口）`}
          >
            原始入口
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
        <span className="sr-only" role="status" aria-live="polite">
          {copyStatus === 'copied' ? '引用格式已复制' : copyStatus === 'error' ? '复制失败，请手动复制' : ''}
        </span>
      </div>
    </div>
  );
}

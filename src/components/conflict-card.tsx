import { useState } from 'react';
import { Scale, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { EvidenceBadge, EvidenceLevel } from './evidence-legend';
import { cn } from '@/lib/utils';

export type ConflictStatus = 'pending' | 'progress' | 'clarified' | 'disputed';

const statusConfig: Record<ConflictStatus, { label: string; icon: typeof AlertCircle; color: string; bg: string }> = {
  pending: { label: '待考证', icon: Clock, color: 'text-candidate', bg: 'bg-candidate/10' },
  progress: { label: '研究中有新进展', icon: AlertCircle, color: 'text-warning', bg: 'bg-warning/10' },
  disputed: { label: '存疑/有争议', icon: AlertCircle, color: 'text-disputed', bg: 'bg-disputed/10' },
  clarified: { label: '已澄清', icon: CheckCircle2, color: 'text-confirmed', bg: 'bg-confirmed/10' },
};

interface ClaimSide {
  title: string;
  description: string;
  evidenceLevel: string;
  sources: Array<{ id: string; title: string }>;
  proponent?: string;
}

export interface ConflictCardProps {
  title: string;
  category: string;
  status: ConflictStatus;
  sideA: ClaimSide;
  sideB: ClaimSide;
  editorNote: string;
  lastUpdated: string;
  defaultOpen?: boolean;
}

export function ConflictCard({
  title,
  category,
  status,
  sideA,
  sideB,
  editorNote,
  lastUpdated,
  defaultOpen = false,
}: ConflictCardProps) {
  const [open, setOpen] = useState(defaultOpen);
  const statusCfg = statusConfig[status];
  const StatusIcon = statusCfg.icon;

  return (
    <div
      className={cn(
        'bg-card border border-border/40 rounded-lg shadow-card overflow-hidden transition-all',
        status === 'disputed' && 'border-l-4 border-l-disputed',
        status === 'clarified' && 'border-l-4 border-l-confirmed'
      )}
    >
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 sm:px-5 py-4 text-left flex items-start justify-between gap-3 hover:bg-muted/30 transition-colors"
        aria-expanded={open}
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground font-medium">
              {category}
            </span>
            <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1', statusCfg.color, statusCfg.bg)}>
              <StatusIcon className="w-3 h-3" />
              {statusCfg.label}
            </span>
          </div>
          <h3 className="font-serif font-semibold text-base sm:text-lg text-foreground leading-snug">
            {title}
          </h3>
        </div>
        <div className="shrink-0 mt-1 text-muted-foreground">
          {open ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </button>

      {/* Content */}
      {open && (
        <div className="px-4 sm:px-5 pb-5 border-t border-border/30">
          {/* Two sides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            {/* Side A */}
            <div className="bg-muted/40 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-evidence-high" />
                <span className="font-semibold text-sm text-foreground">说法 A</span>
              </div>
              <h4 className="font-serif font-medium text-foreground mb-2">{sideA.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {sideA.description}
              </p>
              <EvidenceBadge level={sideA.evidenceLevel as EvidenceLevel} size="xs" />
              {sideA.proponent && (
                <p className="text-xs text-muted-foreground mt-2">主张方：{sideA.proponent}</p>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">支持证据：</p>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                  {sideA.sources.map((s) => (
                    <li key={s.id} className="truncate">{s.title}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Side B */}
            <div className="bg-muted/40 rounded-lg p-4 border border-border/30">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="w-4 h-4 text-evidence-low" />
                <span className="font-semibold text-sm text-foreground">说法 B</span>
              </div>
              <h4 className="font-serif font-medium text-foreground mb-2">{sideB.title}</h4>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {sideB.description}
              </p>
              <EvidenceBadge level={sideB.evidenceLevel as EvidenceLevel} size="xs" />
              {sideB.proponent && (
                <p className="text-xs text-muted-foreground mt-2">主张方：{sideB.proponent}</p>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">支持证据：</p>
                <ul className="list-disc pl-4 text-xs text-muted-foreground space-y-0.5">
                  {sideB.sources.map((s) => (
                    <li key={s.id} className="truncate">{s.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Editor note */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
            <p className="text-xs font-medium text-primary mb-1">编者按</p>
            <p className="text-sm text-foreground/80 leading-relaxed">{editorNote}</p>
          </div>

          {/* Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>最后更新：{lastUpdated}</span>
            <a href="/about" className="text-primary hover:underline">
              提供新线索 →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

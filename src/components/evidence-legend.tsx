import { FileText, BookOpen, ScrollText, MessageCircle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export type EvidenceLevel = 'archive' | 'official' | 'memoir' | 'oral' | 'speculation';

export const evidenceConfig: Record<EvidenceLevel, {
  label: string;
  colorClass: string;
  bgClass: string;
  icon: typeof FileText;
  order: number;
}> = {
  archive: { label: 'A｜同期档案/报刊', colorClass: 'text-evidence-high', bgClass: 'bg-evidence-high', icon: FileText, order: 1 },
  official: { label: 'B｜权威文史/军史', colorClass: 'text-evidence-medium', bgClass: 'bg-evidence-medium', icon: BookOpen, order: 2 },
  memoir: { label: 'C｜参与者回忆', colorClass: 'text-evidence-low', bgClass: 'bg-evidence-low', icon: ScrollText, order: 3 },
  oral: { label: 'D｜家属口述/履历', colorClass: 'text-evidence-oral', bgClass: 'bg-evidence-oral', icon: MessageCircle, order: 4 },
  speculation: { label: 'E｜小说/AI/二传', colorClass: 'text-muted-foreground', bgClass: 'bg-muted-foreground', icon: HelpCircle, order: 5 },
};

interface EvidenceLegendProps {
  variant?: 'inline' | 'full' | 'compact' | 'detailed';
  className?: string;
}

export function EvidenceLegend({ variant = 'inline', className }: EvidenceLegendProps) {
  const levels = Object.entries(evidenceConfig) as [EvidenceLevel, typeof evidenceConfig[EvidenceLevel]][];
  const sorted = levels.sort((a, b) => a[1].order - b[1].order);

  if (variant === 'compact') {
    return (
      <div className={cn('flex flex-wrap items-center gap-3 text-xs', className)}>
        {sorted.map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', cfg.bgClass)} />
            <span className="text-muted-foreground">{cfg.label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'full' || variant === 'detailed') {
    const descriptions: Record<EvidenceLevel, string> = {
      archive: '事件同期形成的档案、报刊、公报或可核验影印。仍须核对文献语境和同源载体。',
      official: '权威机构后编的文史、军史、名录或研究成果。不能替代同期原始记录。',
      memoir: '参与者或见证者事后回忆。可提供线索，但须考虑记忆偏差与叙述立场。',
      oral: '家属口述、无署名履历等内部线索。默认不直接写成公开史实。',
      speculation: '旧小说、AI整理和网络二传。只用于检索和创作线索，不能独立作证。',
    };
    return (
      <div className={cn('grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3', className)}>
        {sorted.map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <div key={key} className="bg-card border border-border/40 rounded-lg p-4 shadow-card">
              <div className="flex items-center gap-2.5 mb-2">
                <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', cfg.bgClass + '/10')}>
                  <Icon className={cn('w-4.5 h-4.5', cfg.colorClass)} />
                </div>
                <div>
                  <span className={cn('font-semibold text-sm', cfg.colorClass)}>{cfg.label}</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {descriptions[key]}
              </p>
            </div>
          );
        })}
      </div>
    );
  }

  // inline variant
  return (
    <div className={cn('flex flex-wrap items-center gap-4 text-xs', className)}>
      <span className="text-muted-foreground font-medium">证据等级：</span>
      {sorted.map(([key, cfg]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={cn('w-2.5 h-2.5 rounded-full', cfg.bgClass)} />
          <span className="text-muted-foreground">{cfg.label}</span>
        </div>
      ))}
    </div>
  );
}

export function EvidenceBadge({ level, size = 'sm' }: { level: EvidenceLevel; size?: 'sm' | 'xs' }) {
  const cfg = evidenceConfig[level];
  const Icon = cfg.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium',
        cfg.bgClass + '/10',
        cfg.colorClass,
        size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-2 py-0.5 text-[10px]'
      )}
    >
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-2.5 h-2.5'} />
      {cfg.label}
    </span>
  );
}

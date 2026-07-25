import { EvidenceBadge, EvidenceLevel } from './evidence-legend';
import { cn } from '@/lib/utils';
import { Calendar, FileText, MapPin, Users } from 'lucide-react';

export type TimelineEventCategory = 'official' | 'military' | 'education' | 'social' | 'writing' | 'travel' | 'family' | 'other';

const categoryLabels: Record<TimelineEventCategory, string> = {
  official: '任职',
  military: '军职',
  education: '调查表教育记录',
  social: '交往',
  writing: '著述',
  travel: '行踪',
  family: '家庭',
  other: '其他',
};

const categoryColors: Record<TimelineEventCategory, string> = {
  official: 'bg-evidence-high/10 text-evidence-high',
  military: 'bg-evidence-high/10 text-evidence-high',
  education: 'bg-candidate/10 text-candidate',
  social: 'bg-evidence-low/10 text-evidence-low',
  writing: 'bg-primary/10 text-primary',
  travel: 'bg-candidate/10 text-candidate',
  family: 'bg-confirmed/10 text-confirmed',
  other: 'bg-muted text-muted-foreground',
};

export interface TimelineItem {
  id: string;
  year: number;
  month?: number;
  day?: number;
  datePrecision: 'exact' | 'month' | 'year' | 'approximate' | 'uncertain';
  title: string;
  description: string;
  category: TimelineEventCategory;
  evidenceLevel: EvidenceLevel;
  disputed?: boolean;
  sceneEligible: boolean;
  identityLinkStatuses: string[];
  sourceCount: number;
  location?: string;
  context?: string;
  persons?: string[];
}

export function TimelineView({ items }: { items: TimelineItem[] }) {
  const sortedItems = [...items].sort((a, b) => {
    const aVal = a.year * 365 + (a.month || 6) * 30 + (a.day || 15);
    const bVal = b.year * 365 + (b.month || 6) * 30 + (b.day || 15);
    return aVal - bVal;
  });

  const formatDate = (item: TimelineItem) => {
    switch (item.datePrecision) {
      case 'exact':
        return `${item.year}年${item.month}月${item.day}日`;
      case 'month':
        return `${item.year}年${item.month}月`;
      case 'year':
        return `${item.year}年`;
      case 'approximate':
        return `约${item.year}年`;
      case 'uncertain':
        return `${item.year}年？`;
      default:
        return `${item.year}年`;
    }
  };

  const dotColor = (level: EvidenceLevel, disputed?: boolean) => {
    if (disputed) return 'bg-disputed';
    switch (level) {
      case 'archive':
        return 'bg-evidence-high';
      case 'official':
        return 'bg-evidence-medium';
      case 'memoir':
        return 'bg-evidence-low';
      case 'oral':
        return 'bg-evidence-oral';
      case 'speculation':
        return 'bg-muted-foreground/40';
      default:
        return 'bg-muted-foreground';
    }
  };

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-4 sm:left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 sm:translate-x-0" />

      <div className="space-y-6">
        {sortedItems.map((item, index) => {
          const isLeft = index % 2 === 0;
          return (
            <div key={item.id} className="relative block sm:flex sm:items-start sm:gap-8">
              {/* Date - mobile: left side; desktop: alternate */}
              <div className="hidden sm:block sm:w-[calc(50%-1.5rem)] text-right shrink-0">
                {isLeft ? (
                  <DateBadge date={formatDate(item)} precision={item.datePrecision} />
                ) : null}
              </div>

              {/* Dot */}
              <div className="absolute left-4 sm:left-1/2 -translate-x-1/2 mt-1.5 z-10">
                <div className={cn(
                  'w-4 h-4 rounded-full border-2 border-surface-container shadow-sm',
                  dotColor(item.evidenceLevel, item.disputed)
                )} />
              </div>

              {/* Mobile date */}
              <div className="sm:hidden pl-10 mb-2">
                <DateBadge date={formatDate(item)} precision={item.datePrecision} />
              </div>

              {/* Card */}
              <div className="ml-10 min-w-0 sm:ml-0 sm:flex-1 sm:w-[calc(50%-1.5rem)]">
                {!isLeft && (
                  <div className="hidden sm:block mb-2">
                    <DateBadge date={formatDate(item)} precision={item.datePrecision} />
                  </div>
                )}
                <div className={cn(
                  'bg-card border border-border/40 rounded-lg shadow-card p-4 transition-all hover:shadow-float',
                  item.disputed && 'border-l-4 border-l-disputed'
                )}>
                  {/* Top row */}
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full font-medium',
                      categoryColors[item.category]
                    )}>
                      {categoryLabels[item.category]}
                    </span>
                    <EvidenceBadge level={item.evidenceLevel} size="xs" />
                    {item.disputed && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-disputed/10 text-disputed">
                        身份连接未闭环
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-semibold text-foreground mb-1.5 text-base">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {item.description}
                  </p>

                  {item.sceneEligible === false && (
                    <div className="mb-3 rounded-md border border-disputed/30 bg-disputed/10 px-3 py-2 text-xs font-semibold text-disputed">
                      scene_eligible=false：该时点只是文献姓名记录，不得与前后同名记录串成连续人生或直接改写为真人场景。
                    </div>
                  )}

                  {item.identityLinkStatuses.some((status) =>
                    status === 'candidate' || status === 'unresolved' || status === 'rejected'
                  ) && (
                    <p className="mb-3 font-mono text-[11px] text-candidate">
                      identity_link_status: {item.identityLinkStatuses.join(' / ')}
                    </p>
                  )}

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                    {item.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.location}
                      </span>
                    )}
                    {item.context && (
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        记载载体：{item.context}
                      </span>
                    )}
                    {item.persons && item.persons.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        涉及 {item.persons.length} 人
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      独立来源 {item.sourceCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DateBadge({ date, precision }: { date: string; precision: string }) {
  return (
    <div className={cn(
      'inline-block font-serif font-semibold',
      precision === 'approximate' || precision === 'uncertain'
        ? 'text-muted-foreground italic'
        : 'text-foreground'
    )}>
      {date}
    </div>
  );
}

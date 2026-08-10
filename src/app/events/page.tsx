import { BookOpenText, Calendar, FileText, MapPin, Users } from 'lucide-react';
import { EvidenceBadge } from '@/components/evidence-legend';
import { PageHeader } from '@/components/section-header';
import { evidenceLevelForTier, eventRecords } from '@/lib/research-data';

function formatDate(event: (typeof eventRecords)[number]): string {
  if (event.date_precision === 'exact') return event.date_start;
  if (event.date_precision === 'month') return `${event.date_start}（月）`;
  return event.date_start;
}

export default function EventsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="事件索引"
        subtitle={`${eventRecords.length}组展示单元均由previewable主张派生；当前仅含1933、1936、1942三组分离记录，不是连续生平。`}
      />

      <div className="rounded-xl border border-border/40 bg-surface-container-lowest p-5 mb-8">
        <p className="font-semibold text-foreground">当前共 {eventRecords.length} 组事件锚</p>
        <p className="text-sm text-muted-foreground mt-2">
          “事件”只是为阅读将同一文献时点的CL主张组成展示单元，不表示跨年份已完成身份连接。每组独立来源数均为1。
        </p>
      </div>

      <div className="space-y-4">
        {eventRecords.map((event) => (
          <article key={event.event_id} className="bg-card border border-border/40 rounded-xl p-5 sm:p-6 shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="sm:w-32 shrink-0">
                <p className="font-serif font-bold text-base text-foreground">{formatDate(event)}</p>
                <p className="font-mono text-[11px] text-primary mt-1">{event.event_id}</p>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <EvidenceBadge level={evidenceLevelForTier(event.evidence_tier)} size="xs" />
                  <span className="text-xs px-2 py-0.5 rounded-full bg-confirmed/10 text-confirmed font-medium">
                    文献范围已核读
                  </span>
                  {event.scene_eligible === false && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-disputed/10 text-disputed font-medium">
                      scene_eligible=false
                    </span>
                  )}
                </div>
                <h2 className="font-serif text-lg font-semibold text-foreground">{event.title}</h2>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{event.description}</p>
                {event.note && (
                  <p className="mt-3 text-sm border-l-2 border-warning pl-3 text-muted-foreground">
                    边界：{event.note}
                  </p>
                )}
                <p className="mt-3 font-mono text-[11px] text-candidate">
                  identity_link_status: {event.identity_link_statuses.join(' / ')}
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                  {event.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />{event.location}
                    </span>
                  )}
                  {event.context && (
                    <span className="inline-flex items-center gap-1">
                      <BookOpenText className="w-3.5 h-3.5" />记载载体：{event.context}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />{event.people.join('、')}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />载体 {event.carrier_count} / 独立来源 {event.independence_count}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />主张 {event.claim_ids.join('、')}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">
                  来源：{event.source_ids.join('、')}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

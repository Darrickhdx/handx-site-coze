import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/section-header';
import { TimelineView } from '@/components/timeline-view';
import { eventRecords, timelineItems } from '@/lib/research-data';

export default function TimelinePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <PageHeader
        title="时间线"
        subtitle={`当前本地预览只呈现${eventRecords.length}组可定位的同名文献记录（1933、1936、1942）；它们不构成一个人的连续履历。`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl border border-confirmed/30 bg-confirmed/10 p-5">
          <div className="flex items-center gap-2 text-confirmed font-semibold">
            <CheckCircle2 className="w-5 h-5" />
            {eventRecords.length}组展示单元的支持主张均为A级
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            每组独立来源数均为1；多个影印、转录或索引载体不会重复加权。
          </p>
        </div>
        <div className="rounded-xl border border-warning/30 bg-warning/10 p-5">
          <div className="flex items-center gap-2 text-warning font-semibold">
            <AlertTriangle className="w-5 h-5" />
            身份链不等于姓名相同
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            当前{eventRecords.length}组展示单元均为scene_eligible=false，不得自动并人、串联任期或直接改写为真人场景。
          </p>
        </div>
      </div>

      <section aria-labelledby="timeline-anchors-heading">
        <h2 id="timeline-anchors-heading" className="sr-only">{eventRecords.length}组分离的文献姓名记录</h2>
        <TimelineView items={timelineItems} />
      </section>

      <div className="mt-12 bg-surface-container-lowest border border-border/40 rounded-xl p-6">
        <h2 className="font-serif text-lg font-semibold text-foreground mb-4">逐组边界</h2>
        <div className="space-y-4">
          {eventRecords.map((event) => (
            <div key={event.event_id} className="border-b border-border/30 last:border-0 pb-4 last:pb-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-xs text-primary">{event.event_id}</span>
                <span className="text-xs text-muted-foreground">主张 {event.claim_ids.join('、')}</span>
              </div>
              <h3 className="font-semibold text-foreground">{event.title}</h3>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                {event.note || '只按来源原有表述记录，不外推完整任期、权限或后续行动。'}
              </p>
              <p className="mt-2 font-mono text-[11px] text-disputed">
                scene_eligible={String(event.scene_eligible)} · identity_link_status={event.identity_link_statuses.join('/')}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

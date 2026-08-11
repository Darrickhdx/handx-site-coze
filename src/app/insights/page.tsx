'use client';

import { useState } from 'react';
import { LocalInsightsDashboard } from '@/components/local-insights-dashboard';
import { PublicTrafficDashboard } from '@/components/public-traffic-dashboard';
import { cn } from '@/lib/utils';

/**
 * Two audiences of one owner: what happened on this machine while reviewing,
 * and what is happening on the public site. Kept on one page because they are
 * the same question asked of two places.
 */
export default function InsightsPage() {
  const [tab, setTab] = useState<'public' | 'local'>('public');

  return (
    <div className="min-h-screen bg-[#f4f0e8]">
      <div className="border-b border-foreground/15 bg-card">
        <div className="personal-shell flex gap-px">
          {(
            [
              ['public', '公开站访问'],
              ['local', '本机审阅记录'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              aria-pressed={tab === key}
              className={cn(
                'px-5 py-3 text-sm font-semibold transition-colors',
                tab === key
                  ? 'border-b-2 border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      {tab === 'public' ? <PublicTrafficDashboard /> : <LocalInsightsDashboard />}
    </div>
  );
}

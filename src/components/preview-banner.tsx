import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { projectRelease } from '@/content/project';

export function PreviewBanner() {
  return (
    <div className="border-b border-warning/25 bg-[#eee4d1] text-warning-foreground">
      <div className="mx-auto flex max-w-[78rem] flex-wrap items-start justify-center gap-x-3 gap-y-1 px-4 py-2 text-center text-[11px] font-medium leading-5 sm:items-center sm:px-6 sm:text-xs">
        <ShieldAlert className="mt-0.5 size-3.5 shrink-0 text-warning sm:mt-0" />
        <span>
          {projectRelease.displayName} · 本地审阅版 · 研究资料仍在核验 · 未授权外部部署或公开发布
        </span>
        <Link
          href="/studio/comments"
          className="underline decoration-warning/35 underline-offset-4 hover:decoration-warning"
        >
          站主管理
        </Link>
      </div>
    </div>
  );
}

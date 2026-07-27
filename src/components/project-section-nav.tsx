'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const projectItems = [
  { href: '/sukaiyuan', label: '项目首页', paths: ['/sukaiyuan'] },
  { href: '/discover/1936-pingdiquan', label: '从故事开始', paths: ['/discover/1936-pingdiquan'] },
  { href: '/graph', label: '知识图谱', paths: ['/graph'] },
  { href: '/wiki', label: 'Wiki', paths: ['/wiki', '/legacy'] },
  { href: '/archives', label: '原件与来源', paths: ['/archives'] },
  { href: '/topics', label: '研究专题', paths: ['/topics'] },
  { href: '/novel', label: '小说', paths: ['/novel'] },
] as const;

export function ProjectSectionNav() {
  const pathname = usePathname();
  const isActive = (paths: readonly string[]) =>
    paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  return (
    <nav
      aria-label="苏开元计划内导航"
      className="border-b border-foreground/15 bg-card/75"
    >
      <div className="personal-shell flex items-center gap-5 overflow-x-auto py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <span className="shrink-0 text-[10px] font-bold tracking-[0.17em] text-primary uppercase">
          苏开元计划
        </span>
        <span className="h-4 w-px shrink-0 bg-foreground/15" aria-hidden="true" />
        {projectItems.map((item) => {
          const active = isActive(item.paths);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'shrink-0 py-1 text-xs font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              )}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

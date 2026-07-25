import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'left' | 'center';
  className?: string;
  children?: ReactNode;
}

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  align = 'left',
  className,
  children,
}: SectionHeaderProps) {
  return (
    <div className={cn(
      'mb-6 sm:mb-8',
      align === 'center' && 'text-center',
      className
    )}>
      {eyebrow && (
        <p className={cn(
          'text-sm font-medium text-primary mb-2 tracking-wide',
          align === 'center' ? 'mx-auto' : ''
        )}>
          {eyebrow}
        </p>
      )}
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mb-2 leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-base max-w-2xl">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
}

export function PageHeader({ title, subtitle, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-8 sm:mb-10 pt-4 sm:pt-6', className)}>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 leading-tight">
        {title}
      </h1>
      {subtitle && (
        <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}

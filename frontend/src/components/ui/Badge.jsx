import { cn } from '@/utils/classNames';

const toneStyles = {
  teal: { backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)', borderColor: 'var(--accent)' },
  amber: { backgroundColor: 'var(--warning-soft)', color: 'var(--warning-text)', borderColor: 'var(--warning-text)' },
  rose: { backgroundColor: 'var(--danger-soft)', color: 'var(--danger-text)', borderColor: 'var(--danger)' },
  slate: { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' },
};

export function Badge({ children, tone = 'slate', className }) {
  return (
    <span
      className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset animate-scale-in', className)}
      style={{
        backgroundColor: toneStyles[tone]?.backgroundColor,
        color: toneStyles[tone]?.color,
        '--tw-ring-color': toneStyles[tone]?.borderColor,
      }}
    >
      {children}
    </span>
  );
}

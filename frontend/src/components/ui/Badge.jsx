import { cn } from '@/utils/classNames';

const tones = {
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
};

export function Badge({ children, tone = 'slate', className }) {
  return <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1', tones[tone], className)}>{children}</span>;
}

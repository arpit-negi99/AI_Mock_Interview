import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ title = 'No data yet', description, actionLabel, onAction }) {
  return (
    <div className="rounded-xl border border-dashed p-8 text-center" style={{ borderColor: 'var(--border-secondary)', backgroundColor: 'var(--bg-secondary)' }}>
      <Inbox className="mx-auto h-10 w-10 animate-float" style={{ color: 'var(--text-tertiary)' }} />
      <h3 className="mt-3 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm" style={{ color: 'var(--text-tertiary)' }}>{description}</p>}
      {actionLabel && <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

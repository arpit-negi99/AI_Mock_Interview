import { Inbox } from 'lucide-react';
import { Button } from './Button';

export function EmptyState({ title = 'No data yet', description, actionLabel, onAction }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <Inbox className="mx-auto h-10 w-10 text-slate-400" />
      <h3 className="mt-3 text-base font-semibold text-slate-950">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{description}</p>}
      {actionLabel && <Button className="mt-4" onClick={onAction}>{actionLabel}</Button>}
    </div>
  );
}

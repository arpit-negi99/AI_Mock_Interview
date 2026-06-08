import { AlertCircle, RotateCcw } from 'lucide-react';
import { Button } from './Button';

export function ErrorMessage({ title = 'Something went wrong', message, onRetry }) {
  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-rose-900">
      <div className="flex gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-rose-700">{message || 'Please retry the request.'}</p>
          {onRetry && <Button variant="secondary" className="mt-3" icon={RotateCcw} onClick={onRetry}>Retry</Button>}
        </div>
      </div>
    </div>
  );
}

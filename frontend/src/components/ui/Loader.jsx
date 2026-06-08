import { Loader2 } from 'lucide-react';

export function Loader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-48 items-center justify-center gap-3 text-slate-600">
      <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      <span className="text-sm font-medium">{label}</span>
    </div>
  );
}

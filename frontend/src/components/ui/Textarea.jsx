import { cn } from '@/utils/classNames';

export function Textarea({ label, error, className, id, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block text-sm font-medium text-slate-700" htmlFor={inputId}>
      {label && <span className="mb-1.5 block">{label}</span>}
      <textarea
        id={inputId}
        className={cn('min-h-28 w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2.5 text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-teal-500', error && 'border-rose-400', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
      {error && <span className="mt-1 block text-xs text-rose-600">{error}</span>}
    </label>
  );
}

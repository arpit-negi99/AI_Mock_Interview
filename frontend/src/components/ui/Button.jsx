import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';

const variants = {
  primary: 'bg-teal-600 text-white hover:bg-teal-700 border-teal-600',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 border-transparent',
  danger: 'bg-rose-600 text-white hover:bg-rose-700 border-rose-600',
};

export function Button({ children, className, variant = 'primary', isLoading = false, icon: Icon, disabled, type = 'button', ...props }) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60',
        variants[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </button>
  );
}

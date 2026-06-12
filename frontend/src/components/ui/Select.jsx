import { cn } from '@/utils/classNames';

export function Select({ label, error, options = [], className, id, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block text-sm font-medium" style={{ color: 'var(--text-secondary)' }} htmlFor={inputId}>
      {label && <span className="mb-1.5 block">{label}</span>}
      <select
        id={inputId}
        className={cn(
          'w-full rounded-lg border px-3 py-2.5 shadow-sm transition-all duration-200 focus:ring-2',
          error && 'ring-2',
          className,
        )}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          borderColor: error ? 'var(--danger)' : 'var(--border-primary)',
          color: 'var(--text-primary)',
          '--tw-ring-color': error ? 'var(--danger-soft)' : 'var(--accent-glow)',
        }}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error && <span className="mt-1 block text-xs" style={{ color: 'var(--danger-text)' }}>{error}</span>}
    </label>
  );
}

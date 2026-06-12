import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/classNames';

const baseClasses = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60';

const variantStyles = {
  primary: {
    backgroundColor: 'var(--accent)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--accent)',
  },
  secondary: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    borderColor: 'var(--border-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    color: 'var(--text-secondary)',
    borderColor: 'transparent',
  },
  danger: {
    backgroundColor: 'var(--danger)',
    color: 'var(--text-inverse)',
    borderColor: 'var(--danger)',
  },
};

export function Button({ children, className, variant = 'primary', isLoading = false, icon: Icon, disabled, type = 'button', ...props }) {
  return (
    <motion.button
      type={type}
      disabled={disabled || isLoading}
      whileTap={{ scale: 0.97 }}
      className={cn(baseClasses, className)}
      style={variantStyles[variant] || variantStyles.primary}
      {...props}
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : Icon ? <Icon className="h-4 w-4" /> : null}
      {children}
    </motion.button>
  );
}

import { motion } from 'framer-motion';
import { cn } from '@/utils/classNames';

export function Card({ children, className, animate = true }) {
  const Component = animate ? motion.div : 'div';
  return (
    <Component
      initial={animate ? { opacity: 0, y: 12 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { duration: 0.35, ease: 'easeOut' } : undefined}
      className={cn('rounded-xl border p-5 transition-shadow duration-300 hover:shadow-lg', className)}
      style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </Component>
  );
}

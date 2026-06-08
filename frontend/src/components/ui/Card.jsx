import { motion } from 'framer-motion';
import { cn } from '@/utils/classNames';

export function Card({ children, className, animate = true }) {
  const Component = animate ? motion.div : 'div';
  return (
    <Component
      initial={animate ? { opacity: 0, y: 10 } : undefined}
      animate={animate ? { opacity: 1, y: 0 } : undefined}
      transition={animate ? { duration: 0.25 } : undefined}
      className={cn('rounded-lg border border-slate-200 bg-white p-5 shadow-soft', className)}
    >
      {children}
    </Component>
  );
}

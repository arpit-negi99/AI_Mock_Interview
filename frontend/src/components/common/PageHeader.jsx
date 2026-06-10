import { motion } from 'framer-motion';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } } };

export function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <motion.div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between" variants={container} initial="hidden" animate="show">
      <div>
        {eyebrow && <motion.p variants={item} className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>{eyebrow}</motion.p>}
        <motion.h1 variants={item} className="mt-1 text-2xl font-bold sm:text-3xl" style={{ color: 'var(--text-primary)' }}>{title}</motion.h1>
        {description && <motion.p variants={item} className="mt-2 max-w-3xl text-sm" style={{ color: 'var(--text-secondary)' }}>{description}</motion.p>}
      </div>
      {actions && <motion.div variants={item} className="flex flex-wrap gap-2">{actions}</motion.div>}
    </motion.div>
  );
}

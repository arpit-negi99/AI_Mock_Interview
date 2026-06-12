import { motion } from 'framer-motion';

export function Loader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-4">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: 'var(--accent)' }}
            animate={{ scale: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="text-sm font-medium" style={{ color: 'var(--text-tertiary)' }}>{label}</span>
    </div>
  );
}

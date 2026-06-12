import { motion } from 'framer-motion';

export function SpeakingAnimation() {
  return (
    <div className="flex h-10 items-end gap-1" aria-label="AI speaking">
      {[18, 30, 22, 36, 24].map((height, index) => (
        <motion.span
          key={index}
          className="w-2 rounded-full"
          style={{ backgroundColor: 'var(--accent)', height }}
          animate={{ scaleY: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: index * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

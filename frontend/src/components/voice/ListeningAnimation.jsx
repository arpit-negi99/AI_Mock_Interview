import { motion } from 'framer-motion';

export function ListeningAnimation() {
  return (
    <div className="relative h-12 w-12" aria-label="Listening">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute inset-0 rounded-full"
          style={{ borderColor: 'var(--accent)', border: '2px solid' }}
          animate={{ scale: [0.8, 2], opacity: [0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
        />
      ))}
      <span className="absolute inset-3 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
    </div>
  );
}

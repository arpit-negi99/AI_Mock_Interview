import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { Button } from '@/components/ui/Button';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
      <motion.p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>404</motion.p>
      <motion.h1
        className="mt-3 text-7xl font-extrabold animate-float"
        style={{ color: 'var(--text-primary)' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        404
      </motion.h1>
      <motion.p className="mt-4 text-lg" style={{ color: 'var(--text-secondary)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>Page not found</motion.p>
      <motion.p className="mt-2" style={{ color: 'var(--text-tertiary)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>The page may have moved or the route has not been enabled yet.</motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Link to={ROUTES.HOME} className="mt-6 inline-block"><Button>Go home</Button></Link>
      </motion.div>
    </section>
  );
}

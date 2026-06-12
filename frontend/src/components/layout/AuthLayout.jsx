import { Link, Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BrainCircuit } from 'lucide-react';
import { APP_CONFIG } from '@/constants/appConfig';
import { ROUTES } from '@/constants/routes';

export function AuthLayout() {
  return (
    <div className="app-shell grid min-h-screen lg:grid-cols-[1fr_520px]">
      <section className="relative hidden overflow-hidden px-12 py-10 lg:flex lg:flex-col lg:justify-between">
        {/* Animated decorative orbs */}
        <motion.div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--accent)' }} animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div className="pointer-events-none absolute bottom-20 right-10 h-64 w-64 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: 'var(--accent)' }} animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.2, 0.1] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }} />
        
        <Link to={ROUTES.HOME} className="relative z-10 flex items-center gap-2 font-bold" style={{ color: 'var(--text-primary)' }}>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}><BrainCircuit className="h-5 w-5" /></span>
          {APP_CONFIG.name}
        </Link>
        <motion.div className="relative z-10 max-w-xl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>Mock interview ecosystem</p>
          <h1 className="mt-4 text-5xl font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>Practice realistic interviews and turn feedback into a plan.</h1>
          <p className="mt-5 text-lg" style={{ color: 'var(--text-secondary)' }}>Role-aware dashboards, AI evaluation workflows, and backend-ready service boundaries are already prepared.</p>
        </motion.div>
        <p className="relative z-10 text-sm" style={{ color: 'var(--text-tertiary)' }}>Use any email containing admin to preview admin access in mock mode.</p>
      </section>
      <main className="flex items-center justify-center px-4 py-10" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <Outlet />
      </main>
    </div>
  );
}

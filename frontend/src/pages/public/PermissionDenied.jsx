import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function PermissionDenied({ homePath = '/' }) {
  return (
    <section className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
        <ShieldAlert className="h-12 w-12 mx-auto" style={{ color: 'var(--warning-text)' }} />
      </motion.div>
      <motion.h1 className="mt-4 text-3xl font-bold" style={{ color: 'var(--text-primary)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>Permission denied</motion.h1>
      <motion.p className="mt-2 max-w-md text-sm" style={{ color: 'var(--text-secondary)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>Frontend guards only control the visible experience. The backend must enforce real authorization for production access.</motion.p>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <Link to={homePath} className="mt-6 inline-block"><Button>Return to dashboard</Button></Link>
      </motion.div>
    </section>
  );
}

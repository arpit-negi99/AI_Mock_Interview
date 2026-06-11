import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, BrainCircuit, ClipboardCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { ROUTES } from '@/constants/routes';
import { ROLES } from '@/constants/roles';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';

const capabilities = [
  { title: 'Configure interviews', text: 'Pick role, seniority, skills, mode, duration, and response format.', icon: ClipboardCheck },
  { title: 'AI evaluation pipeline', text: 'Structured scoring, rubric alignment, and retry-friendly report states.', icon: BrainCircuit },
  { title: 'Progress intelligence', text: 'Practice plans and dashboards built for high-volume session history.', icon: BarChart3 },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.12 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } } };

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const startPracticeRoute = isAuthenticated
    ? user?.role === ROLES.ADMIN
      ? ROUTES.ADMIN_DASHBOARD
      : ROUTES.INTERVIEW_CONFIGURATION
    : ROUTES.REGISTER;
  const startPracticeLabel = isAuthenticated ? 'Start practice' : 'Start practicing';

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 lg:px-8">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <motion.div variants={container} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>AI Mock Interview Ecosystem</motion.p>
          <motion.h1 variants={fadeUp} className="mt-4 text-4xl font-bold leading-tight sm:text-6xl" style={{ color: 'var(--text-primary)' }}>Prepare, interview, evaluate, and improve in one production-ready workspace.</motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-2xl text-lg" style={{ color: 'var(--text-secondary)' }}>A scalable frontend foundation for candidate practice, multimodal response submission, AI feedback, admin controls, and future backend integration.</motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition-all duration-200 hover:shadow-lg" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }} to={startPracticeRoute}>{startPracticeLabel} <ArrowRight className="h-4 w-4" /></Link>
            <Link className="inline-flex items-center rounded-lg border px-5 py-3 text-sm font-semibold transition-all duration-200" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)' }} to={ROUTES.FEATURES}>View features</Link>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-xl border p-4"
          style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', boxShadow: 'var(--shadow-soft)' }}
        >
          <div className="rounded-lg p-5" style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }}>
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: 'var(--border-primary)' }}>
              <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>Live Interview Session</span>
              <span className="rounded-full px-3 py-1 text-xs font-medium" style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-text)' }}>AI ready</span>
            </div>
            <div className="mt-5 space-y-3">
              {['Question prompt', 'Text response editor', 'Audio/video submission', 'Evaluation queue'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.5 + index * 0.1 }}
                  className="flex items-center gap-3 rounded-lg p-3"
                  style={{ backgroundColor: 'var(--bg-tertiary)' }}
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold" style={{ backgroundColor: 'var(--accent)', color: 'var(--text-inverse)' }}>{index + 1}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div className="mt-12 grid gap-4 md:grid-cols-3" variants={container} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-50px' }}>
        {capabilities.map(({ title, text, icon: Icon }) => (
          <motion.div key={title} variants={fadeUp}>
            <Card>
              <Icon className="h-6 w-6" style={{ color: 'var(--accent)' }} />
              <h2 className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

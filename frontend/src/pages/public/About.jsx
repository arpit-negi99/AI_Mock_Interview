import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function About() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHeader title="About InterviewAI" description="A frontend architecture for realistic mock interview workflows, evaluation reports, and operational administration." />
      <motion.div className="grid gap-4 lg:grid-cols-3" variants={container} initial="hidden" animate="show">
        {['Candidate-first practice', 'AI-ready evaluation', 'Admin governance'].map((title) => (
          <motion.div key={title} variants={item}>
            <Card>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>Built with reusable React components, protected routes, role guards, service boundaries, and scalable data views.</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}

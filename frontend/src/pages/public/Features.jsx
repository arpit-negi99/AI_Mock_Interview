import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { PageHeader } from '@/components/common/PageHeader';

const features = ['Role-based routing', 'Mock-ready API services', 'Text, audio, and video response UI', 'Evaluation and feedback pages', 'Admin question bank and rubrics', 'Search, filters, pagination-ready tables'];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } };

export default function Features() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
      <PageHeader title="Platform Features" description="Every screen is structured so real APIs can replace dummy data without changing the user-facing flow." />
      <Card>
        <motion.div className="grid gap-3 md:grid-cols-2" variants={container} initial="hidden" animate="show">
          {features.map((feature) => (
            <motion.div key={feature} variants={item} className="flex items-center gap-3 rounded-lg p-3" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{feature}</span>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </section>
  );
}

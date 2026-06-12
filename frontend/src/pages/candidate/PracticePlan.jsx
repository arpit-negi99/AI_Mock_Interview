import { CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';

const tasks = ['Review React rendering patterns', 'Record a concise system design answer', 'Complete two behavioral drills', 'Revisit feedback report after next session'];
const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { duration: 0.3 } } };

export default function PracticePlan() {
  return (
    <>
      <PageHeader title="Practice plan" description="A progression surface for AI-generated drills, due dates, and completion state." />
      <Card>
        <motion.div className="space-y-3" variants={container} initial="hidden" animate="show">
          {tasks.map((task) => (
            <motion.div key={task} variants={item} className="flex items-center gap-3 rounded-lg border p-3" style={{ borderColor: 'var(--border-primary)' }}>
              <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{task}</span>
            </motion.div>
          ))}
        </motion.div>
      </Card>
    </>
  );
}

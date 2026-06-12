import { motion } from 'framer-motion';
import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const scores = [{ label: 'Technical depth', score: 86 }, { label: 'Communication', score: 79 }, { label: 'Problem solving', score: 84 }, { label: 'Role alignment', score: 88 }];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function EvaluationResult() {
  return (
    <>
      <PageHeader title="Evaluation result" description="Scorecards are structured for rubric-based AI responses and reviewer overrides." />
      <motion.div className="grid gap-4 md:grid-cols-2" variants={container} initial="hidden" animate="show">
        {scores.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{s.label}</h2>
                <Badge tone="teal">{s.score}%</Badge>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                <motion.div
                  className="h-2 rounded-full"
                  style={{ backgroundColor: 'var(--accent)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${s.score}%` }}
                  transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                />
              </div>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

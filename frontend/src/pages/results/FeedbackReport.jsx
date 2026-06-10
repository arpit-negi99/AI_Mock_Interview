import { motion } from 'framer-motion';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function FeedbackReport() {
  return (
    <>
      <PageHeader title="Feedback report" description="A candidate-friendly report surface for strengths, gaps, transcript references, and practice recommendations." />
      <motion.div className="grid gap-4 lg:grid-cols-3" variants={container} initial="hidden" animate="show">
        {[
          ['Strengths', 'Clear tradeoff discussion, good performance vocabulary, and specific React examples.'],
          ['Improve next', 'Quantify impact earlier and connect optimization choices to user-facing latency.'],
          ['AI recommendation', 'Practice a 2-minute answer using situation, action, outcome, and metric framing.'],
        ].map(([title, text]) => (
          <motion.div key={title} variants={item}>
            <Card>
              <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h2>
              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>{text}</p>
            </Card>
          </motion.div>
        ))}
      </motion.div>
    </>
  );
}

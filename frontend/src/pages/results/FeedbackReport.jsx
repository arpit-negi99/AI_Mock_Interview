import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';

export default function FeedbackReport() {
  return (
    <>
      <PageHeader title="Feedback report" description="A candidate-friendly report surface for strengths, gaps, transcript references, and practice recommendations." />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ['Strengths', 'Clear tradeoff discussion, good performance vocabulary, and specific React examples.'],
          ['Improve next', 'Quantify impact earlier and connect optimization choices to user-facing latency.'],
          ['AI recommendation', 'Practice a 2-minute answer using situation, action, outcome, and metric framing.'],
        ].map(([title, text]) => (
          <Card key={title}>
            <h2 className="font-semibold text-slate-950">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{text}</p>
          </Card>
        ))}
      </div>
    </>
  );
}

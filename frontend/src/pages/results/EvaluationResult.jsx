import { PageHeader } from '@/components/common/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

const scores = [{ label: 'Technical depth', score: 86 }, { label: 'Communication', score: 79 }, { label: 'Problem solving', score: 84 }, { label: 'Role alignment', score: 88 }];

export default function EvaluationResult() {
  return (
    <>
      <PageHeader title="Evaluation result" description="Scorecards are structured for rubric-based AI responses and reviewer overrides." />
      <div className="grid gap-4 md:grid-cols-2">
        {scores.map((item) => (
          <Card key={item.label}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-950">{item.label}</h2>
              <Badge tone="teal">{item.score}%</Badge>
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-teal-600" style={{ width: `${item.score}%` }} />
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}

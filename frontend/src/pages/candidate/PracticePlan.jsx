import { CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Card } from '@/components/ui/Card';

const tasks = ['Review React rendering patterns', 'Record a concise system design answer', 'Complete two behavioral drills', 'Revisit feedback report after next session'];

export default function PracticePlan() {
  return (
    <>
      <PageHeader title="Practice plan" description="A progression surface for AI-generated drills, due dates, and completion state." />
      <Card>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task} className="flex items-center gap-3 rounded-md border border-slate-200 p-3">
              <CheckCircle2 className="h-5 w-5 text-teal-600" />
              <span className="text-sm font-medium text-slate-700">{task}</span>
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

import { Card } from '@/components/ui/Card';

export function QuestionCard({ question }) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-widest text-teal-700">AI interviewer</p>
      <h2 className="mt-3 text-2xl font-semibold leading-snug text-slate-950">{question || 'Start a voice interview to receive your first question.'}</h2>
    </Card>
  );
}

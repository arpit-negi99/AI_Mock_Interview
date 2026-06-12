import { Card } from '@/components/ui/Card';

export function QuestionCard({ question }) {
  return (
    <Card>
      <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: 'var(--accent-text)' }}>AI interviewer</p>
      <h2 className="mt-3 text-2xl font-semibold leading-snug" style={{ color: 'var(--text-primary)' }}>{question || 'Start a voice interview to receive your first question.'}</h2>
    </Card>
  );
}

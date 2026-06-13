import { Badge } from '@/components/ui/Badge';

const labels = {
  idle: 'Idle',
  listening: 'Listening',
  processing: 'Processing answer',
  'ai-speaking': 'AI is speaking',
  speaking: 'AI is speaking',
  error: 'Voice error',
};

export function InterviewStatusIndicator({ state }) {
  const tone = state === 'error' ? 'rose' : state === 'processing' ? 'amber' : 'teal';
  return <Badge tone={tone}>{labels[state] || state}</Badge>;
}

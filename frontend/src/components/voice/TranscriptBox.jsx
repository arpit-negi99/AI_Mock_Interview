import { Textarea } from '@/components/ui/Textarea';

export function TranscriptBox({ transcript, onChange }) {
  return (
    <Textarea
      label="Answer transcript"
      value={transcript}
      onChange={(event) => onChange(event.target.value)}
      placeholder="Your spoken answer transcript appears here. Debug text input is available for development."
    />
  );
}

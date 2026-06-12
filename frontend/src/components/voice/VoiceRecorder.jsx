import { Mic, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ListeningAnimation } from './ListeningAnimation';

export function VoiceRecorder({ state, onStart, onStop, onRetry, supported }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Voice answer</p>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>{supported ? 'Push to talk, review transcript, then submit.' : 'SpeechRecognition unavailable. Use debug transcript input.'}</p>
        </div>
        {state === 'listening' && <ListeningAnimation />}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button icon={Mic} onClick={onStart} disabled={!supported || state === 'listening'}>Start talking</Button>
        <Button variant="secondary" icon={Square} onClick={onStop} disabled={state !== 'listening'}>Stop</Button>
        <Button variant="ghost" icon={RotateCcw} onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}

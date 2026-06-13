import { Mic, Square, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ListeningAnimation } from './ListeningAnimation';

export function VoiceRecorder({ state, onStart, onStop, onRetry, supported, audioLevel = 0 }) {
  const level = Math.min(100, Math.round(audioLevel * 100));
  return (
    <div className="border border-slate-800 bg-slate-950/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-slate-100">Voice answer</p>
          <p className="text-sm text-slate-400">{supported ? 'Speak naturally. Silence submits your answer.' : 'Microphone recording is unavailable in this browser.'}</p>
        </div>
        {state === 'listening' && <ListeningAnimation />}
      </div>
      <div className="mt-4 h-2 overflow-hidden bg-slate-800">
        <div className="h-full bg-cyan-300 transition-[width]" style={{ width: `${level}%` }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button icon={Mic} onClick={onStart} disabled={!supported || state === 'listening'}>Start talking</Button>
        <Button variant="secondary" icon={Square} onClick={onStop} disabled={state !== 'listening'}>Stop</Button>
        <Button variant="ghost" icon={RotateCcw} onClick={onRetry}>Retry</Button>
      </div>
    </div>
  );
}

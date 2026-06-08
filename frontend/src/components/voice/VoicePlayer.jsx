import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function VoicePlayer({ muted, onToggleMute, onReplay }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="secondary" icon={Volume2} onClick={onReplay}>Replay question</Button>
      <Button variant="ghost" icon={muted ? VolumeX : Volume2} onClick={onToggleMute}>{muted ? 'Unmute' : 'Mute'}</Button>
    </div>
  );
}

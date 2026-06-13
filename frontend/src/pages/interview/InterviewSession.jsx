import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Mic, MicOff, PhoneOff, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useVoiceInterview } from '@/hooks/useVoiceInterview';
import { voiceInterviewService } from '@/services/voiceInterviewService';
import { Button } from '@/components/ui/Button';
import { InterviewStatusIndicator } from '@/components/voice/InterviewStatusIndicator';
import { InterviewTimer } from '@/components/voice/InterviewTimer';
import { QuestionCard } from '@/components/voice/QuestionCard';
import { SpeakingAnimation } from '@/components/voice/SpeakingAnimation';
import { TranscriptBox } from '@/components/voice/TranscriptBox';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';

export default function InterviewSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const sessionId = location.state?.sessionId;
  const [muted, setMuted] = useState(false);
  const initialTts = location.state?.tts || location.state?.firstTts || null;

  const interview = useVoiceInterview({
    sessionId,
    initialQuestion: location.state?.firstQuestion || '',
    initialTts,
    muted,
    onEnded: () => {
      toast.success('Interview completed');
      navigate(ROUTES.FEEDBACK_REPORT, { state: { sessionId } });
    },
    onError: (error) => toast.error(error.message || 'Voice interview failed'),
  });

  const statusLabel = useMemo(() => ({
    'ai-speaking': 'Alex is speaking',
    listening: 'Listening',
    processing: 'Thinking',
    idle: 'Ready',
    error: 'Needs attention',
  }[interview.state] || 'Ready'), [interview.state]);

  if (!sessionId) {
    navigate(ROUTES.INTERVIEW_CONFIGURATION);
    return null;
  }

  const endInterview = async () => {
    await voiceInterviewService.end(sessionId);
    navigate(ROUTES.CANDIDATE_DASHBOARD);
  };

  return (
    <div className="min-h-[calc(100vh-96px)] rounded-none border border-slate-800 bg-[#090d12] p-4 text-slate-100 shadow-2xl sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-semibold tracking-normal text-white">AI Interview Room</h1>
          <p className="text-sm text-slate-400">Alex · Technical interviewer</p>
        </div>
        <div className="flex items-center gap-3">
          <InterviewStatusIndicator state={interview.state} />
          <InterviewTimer minutes={location.state?.duration || 15} onComplete={() => toast.success('Time limit reached')} />
        </div>
      </div>

      <div className="grid min-h-[520px] gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="flex min-h-[360px] flex-col items-center justify-center border border-slate-800 bg-[#101720] p-6">
          <div className={`flex h-40 w-40 items-center justify-center rounded-full border ${interview.state === 'ai-speaking' ? 'border-cyan-300 shadow-[0_0_44px_rgba(34,211,238,0.24)]' : 'border-slate-700'}`}>
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-900 text-4xl font-semibold text-cyan-200">A</div>
          </div>
          <div className="mt-8 h-12">
            {interview.state === 'ai-speaking' ? <SpeakingAnimation audioLevel={0.8} /> : <p className="text-sm text-slate-400">{statusLabel}</p>}
          </div>
          <div className="mt-8 w-full max-w-3xl">
            <QuestionCard question={interview.question || 'Preparing your first question...'} />
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="border border-slate-800 bg-[#101720] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Your answer</h2>
              <span className="text-xs text-slate-500">{interview.state === 'listening' ? 'Auto-submit after silence' : 'Mic standby'}</span>
            </div>
            <VoiceRecorder
              state={interview.state}
              supported={Boolean(navigator.mediaDevices?.getUserMedia)}
              audioLevel={interview.audioLevel}
              onStart={interview.startListening}
              onStop={interview.stopListening}
              onRetry={() => interview.setTranscript('')}
            />
          </div>

          <div className="min-h-56 border border-slate-800 bg-[#101720] p-4">
            <TranscriptBox transcript={interview.transcript} onChange={interview.setTranscript} />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-center gap-3 border border-slate-800 bg-[#101720] p-4">
            <Button icon={interview.state === 'listening' ? MicOff : Mic} onClick={interview.state === 'listening' ? interview.stopListening : interview.startListening} disabled={interview.state === 'processing' || interview.state === 'ai-speaking'}>
              {interview.state === 'listening' ? 'Stop' : 'Answer'}
            </Button>
            <Button variant="secondary" icon={RotateCcw} onClick={interview.replay}>Replay</Button>
            <Button variant="ghost" icon={muted ? VolumeX : Volume2} onClick={() => setMuted((value) => !value)}>{muted ? 'Unmute' : 'Mute'}</Button>
            <Button variant="danger" icon={PhoneOff} onClick={endInterview}>End call</Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

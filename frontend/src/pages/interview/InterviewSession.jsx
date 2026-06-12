import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useAuth } from '@/hooks/useAuth';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { getSocket } from '@/services/socketClient';
import { voiceInterviewService } from '@/services/voiceInterviewService';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { InterviewStatusIndicator } from '@/components/voice/InterviewStatusIndicator';
import { InterviewTimer } from '@/components/voice/InterviewTimer';
import { QuestionCard } from '@/components/voice/QuestionCard';
import { SpeakingAnimation } from '@/components/voice/SpeakingAnimation';
import { TranscriptBox } from '@/components/voice/TranscriptBox';
import { VoicePlayer } from '@/components/voice/VoicePlayer';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';

export default function InterviewSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useAuth();
  const sessionId = location.state?.sessionId;
  const [question, setQuestion] = useState(location.state?.firstQuestion || '');
  const [muted, setMuted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const autoSubmitRef = useRef(null);
  const { transcript, setTranscript, voiceState, setVoiceState, error, startListening, stopListening, resetTranscript, isSupported } = useSpeechRecognition({
    silenceMs: 4500,
    onSilence: (finalTranscript) => autoSubmitRef.current?.(finalTranscript),
  });

  const socket = useMemo(() => getSocket(token), [token]);

  const speak = useCallback((text) => {
    if (!text || muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    setVoiceState('speaking');
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.onend = () => setVoiceState('idle');
    utterance.onerror = () => setVoiceState('error');
    window.speechSynthesis.speak(utterance);
  }, [muted, setVoiceState]);

  useEffect(() => {
    if (!sessionId) {
      navigate(ROUTES.INTERVIEW_CONFIGURATION);
      return;
    }
    socket.connect();
    socket.emit('interview:start', { sessionId });
    socket.on('ai:question', (payload) => {
      const text = payload.question?.text || payload.question?.questionText || payload.aiResult?.questionText;
      setQuestion(text);
      resetTranscript();
      speak(text);
    });
    socket.on('ai:follow-up', (payload) => {
      const text = payload.question?.text || payload.aiResult?.questionText;
      setQuestion(text);
      resetTranscript();
      speak(text);
    });
    socket.on('ai:clarification', (payload) => {
      const text = payload.question?.text || payload.aiResult?.questionText;
      setQuestion(text);
      resetTranscript();
      speak(text);
    });
    socket.on('interview:processing', () => setVoiceState('processing'));
    socket.on('interview:ended', (payload) => {
      const text = payload.question?.text || payload.aiResult?.questionText || 'Interview completed.';
      setQuestion(text);
      speak(text);
      toast.success('Interview ended');
    });
    socket.on('interview:error', (payload) => toast.error(payload.message || 'Socket error'));
    return () => {
      socket.off('ai:question');
      socket.off('ai:follow-up');
      socket.off('ai:clarification');
      socket.off('interview:processing');
      socket.off('interview:ended');
      socket.off('interview:error');
      socket.disconnect();
    };
  }, [navigate, resetTranscript, sessionId, socket, speak, setVoiceState]);

  const submitAnswer = useCallback(async (answerText = transcript) => {
    const finalTranscript = answerText.trim();
    if (!finalTranscript) {
      toast.error('Record or type an answer transcript first');
      return;
    }
    setIsSubmitting(true);
    setVoiceState('processing');
    try {
      const response = await voiceInterviewService.answerText(sessionId, finalTranscript);
      const data = response.data || response;
      const text = data.question?.text || data.aiResult?.questionText;
      setQuestion(text);
      resetTranscript();
      speak(text);
    } catch (err) {
      toast.error(err.message || 'Answer submission failed');
      setVoiceState('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [resetTranscript, sessionId, setVoiceState, speak, transcript]);

  useEffect(() => {
    autoSubmitRef.current = submitAnswer;
  }, [submitAnswer]);

  return (
    <>
      <PageHeader
        title="Voice interview room"
        description="AI speaks the question, you answer with microphone input, and the backend stores the question-answer history."
        actions={<InterviewStatusIndicator state={voiceState} />}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          <QuestionCard question={question} />
          <VoiceRecorder state={voiceState} supported={isSupported} onStart={startListening} onStop={stopListening} onRetry={resetTranscript} />
          <TranscriptBox transcript={transcript} onChange={setTranscript} />
          {error && <p className="text-sm" style={{ color: 'var(--danger-text)' }}>{error}</p>}
          <Button icon={Send} isLoading={isSubmitting} onClick={() => submitAnswer()}>Submit voice answer</Button>
        </div>
        <Card>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Session</h2>
            <InterviewTimer minutes={location.state?.duration || 15} onComplete={() => toast.success('Time limit reached')} />
          </div>
          <div className="mt-5 space-y-4">
            {voiceState === 'speaking' && <SpeakingAnimation />}
            <VoicePlayer muted={muted} onToggleMute={() => setMuted((value) => !value)} onReplay={() => speak(question)} />
            <Button variant="danger" onClick={() => voiceInterviewService.end(sessionId).then(() => navigate(ROUTES.CANDIDATE_DASHBOARD))}>End interview</Button>
          </div>
        </Card>
      </div>
    </>
  );
}

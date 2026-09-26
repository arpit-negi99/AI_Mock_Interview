import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowUpRight, AudioLines, Check, ChevronDown, Clock3, CornerDownRight, Mic, MicOff, RotateCcw, Send, Sparkles, Square, Volume2, VolumeX } from 'lucide-react';
import { ROUTES } from '@/constants/routes';
import { useVoiceInterview } from '@/hooks/useVoiceInterview';
import { voiceInterviewService } from '@/services/voiceInterviewService';
import { InterviewTimer } from '@/components/voice/InterviewTimer';

const tracks = { core_cse: 'Computer science', dsa: 'Data structures & algorithms', behavioral: 'Behavioral', resume: 'Resume deep dive', project: 'Project deep dive' };

export default function InterviewSession() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const sessionId = params.get('session') || location.state?.sessionId;
  const [muted, setMuted] = useState(false);
  const [ending, setEnding] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [timeEnded, setTimeEnded] = useState(false);
  const interview = useVoiceInterview({ sessionId, muted,
    onEnded: () => navigate(ROUTES.FEEDBACK_REPORT, { state: { sessionId } }),
  });
  if (!sessionId) return <Navigate to={ROUTES.INTERVIEW_CONFIGURATION} replace />;

  const session = interview.session;
  const busy = ending || ['processing', 'loading'].includes(interview.state);
  const listening = interview.state === 'listening';
  const speaking = interview.state === 'ai-speaking';
  const expired = session?.status === 'expired' || timeEnded;
  const mainNumber = Math.min((session?.currentQuestionIndex || 0) + 1, session?.totalQuestions || 5);
  const words = interview.transcript.trim().split(/\s+/).filter(Boolean).length;
  const followUp = ['followup', 'clarification'].includes(interview.currentQuestion?.questionType);
  const answered = interview.history.filter((item) => item.answeredAt);
  const status = { loading: 'Restoring your session', idle: 'Ready when you are', listening: 'Listening to your answer', processing: 'Considering your answer', 'ai-speaking': 'Alex is speaking', error: 'Ready to retry' }[interview.state];

  async function finish() {
    setEnding(true);
    interview.stopListening();
    interview.cancelSpeech();
    try {
      await voiceInterviewService.end(sessionId);
      navigate(ROUTES.FEEDBACK_REPORT, { state: { sessionId } });
    } catch (error) { toast.error(error.message || 'Could not finish the interview. Please retry.'); }
    finally { setEnding(false); setConfirmEnd(false); }
  }

  return (
    <div className="interview-studio">
      <header className="studio-header">
        <div className="studio-brand"><span className="studio-logo"><AudioLines size={22} /></span><div><span className="studio-eyebrow">PRACTICE / INTERVIEW ROOM</span><h1>{tracks[session?.interviewType] || 'Your mock interview'}</h1></div></div>
        <div className="studio-header-meta"><span className="studio-live"><i /> In session</span><span className="studio-clock"><Clock3 size={15} /><InterviewTimer minutes={session?.duration || 15} startedAt={session?.startedAt} onComplete={() => setTimeEnded(true)} /></span></div>
      </header>

      <div className="studio-layout">
        <main className="studio-main">
          <div className="studio-progress"><span>Question <b>{mainNumber}</b> / {session?.totalQuestions || 5}</span><div role="progressbar" aria-label="Main question progress" aria-valuenow={mainNumber} aria-valuemin={0} aria-valuemax={session?.totalQuestions || 5}><i style={{ width: (mainNumber / (session?.totalQuestions || 5) * 100) + '%' }} /></div><span>{session?.difficulty || 'medium'} level</span></div>
          <section className="studio-question-panel" aria-labelledby="question-heading">
            <div className="studio-interviewer"><div className="studio-avatar">A<span /></div><div><h2>Alex <span>AI INTERVIEWER</span></h2><p>{status}</p></div><div className={'studio-wave ' + (speaking || listening || busy ? 'is-active' : '')} aria-hidden="true">{[12, 22, 32, 19, 36, 25, 14].map((height, index) => <i key={index} style={{ height, animationDelay: (index * 0.12) + 's' }} />)}</div></div>
            <div className="studio-question-meta"><span>{followUp ? <CornerDownRight size={14} /> : <Sparkles size={14} />}{followUp ? 'A closer look at your answer' : 'Your next challenge'}</span><span>{interview.currentQuestion?.topic || 'Getting ready'}</span></div>
            <h2 id="question-heading" className="studio-question" aria-live="polite">{interview.question || 'Preparing a conversation around your goals...'}</h2>
            <div className="studio-question-footer"><span>Take a moment. Think out loud.</span><button onClick={speaking ? interview.cancelSpeech : interview.replay} disabled={busy || listening || muted || !interview.question}><Volume2 size={16} />{speaking ? 'Stop reading' : 'Read question'}</button></div>
          </section>

          <section className={'studio-answer-panel ' + (listening ? 'is-listening' : '')} aria-labelledby="answer-heading">
            <div className="studio-answer-header"><h2 id="answer-heading">Your answer</h2><span>{listening ? 'Recording - stop to review' : 'Speak or type. You are in control.'}</span></div>
            <label className="sr-only" htmlFor="interview-answer">Your answer</label>
            <textarea id="interview-answer" value={interview.transcript} onChange={(event) => interview.setTranscript(event.target.value)} disabled={busy || listening || expired} maxLength={12000} placeholder="Walk through your reasoning, explain your choices, and share a concrete example..." onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && !busy && !listening && !expired) { event.preventDefault(); interview.submitAnswer(); } }} />
            {interview.error && <div className="studio-notice" role="alert">{interview.error}{!session && <button onClick={() => interview.loadSession().catch((error) => toast.error(error.message))}>Retry loading session</button>}</div>}
            {!interview.voiceSupported && <p className="studio-input-hint">Voice input is not available in this browser. You can complete the full interview by typing.</p>}
            {expired && <p className="studio-notice">Your session time has ended. Finish the interview to review your feedback.</p>}
            <div className="studio-answer-footer"><button className={'studio-record ' + (listening ? 'recording' : '')} onClick={listening ? interview.stopListening : interview.startListening} disabled={busy || !session || expired || !interview.voiceSupported}>{listening ? <MicOff size={18} /> : <Mic size={18} />}{listening ? 'Stop recording' : 'Use microphone'}</button><span className="studio-word-count">{words} words</span><button className="studio-submit" onClick={interview.submitAnswer} disabled={busy || listening || !session || expired || words < 5}>{busy ? 'Please wait...' : 'Submit answer'}<Send size={16} /></button></div>
          </section>
          <div className="studio-bottom-note"><span><Check size={14} /> Your answer stays editable until you submit.</span><span>Ctrl / Cmd + Enter to submit</span></div>
        </main>

        <aside className="studio-sidebar">
          <section className="studio-session-card"><span className="studio-eyebrow">YOUR SESSION</span><h2>A little practice.<br />A lot more prepared.</h2><dl><div><dt>Experience</dt><dd>{session?.experienceLevel || '-'}</dd></div><div><dt>Follow-ups</dt><dd>Up to {session?.maxCrossQuestions ?? 2} per question</dd></div><div><dt>Answered</dt><dd>{answered.length} exchanges</dd></div></dl><div className={'studio-mode ' + (session?.generationMode === 'practice' ? 'practice' : '')}><i /><div><strong>{!session ? 'Connecting' : session.generationMode === 'ai' ? 'AI interviewer' : 'Local practice mode'}</strong><p>{!session ? 'Loading your interview.' : session.generationMode === 'ai' ? 'Questions adapt to your answers.' : 'Using built-in questions. Feedback is a provisional estimate.'}</p></div></div></section>
          <section className="studio-conversation"><h2>Conversation <span>{answered.length}</span></h2>{answered.length === 0 ? <div className="studio-conversation-empty"><CornerDownRight size={22} /><p>Your conversation takes shape here.</p><span>Completed answers appear as you go.</span></div> : <div className="studio-exchanges">{answered.map((item, index) => <details key={index}><summary><span className="studio-exchange-number">{String(index + 1).padStart(2, '0')}</span><span>{item.topic || 'Discussion'}<small>{item.questionType === 'main' ? 'Main question' : 'Follow-up'}</small></span><ChevronDown size={14} /></summary><p>{item.questionText}</p><blockquote>{item.answerTranscript}</blockquote></details>)}</div>}</section>
          {session?.storageMode === 'memory' && <p className="studio-input-hint">Temporary session storage. Progress will be lost if the server restarts.</p>}
          <div className="studio-controls"><button onClick={() => { interview.cancelSpeech(); setMuted((value) => !value); }} aria-pressed={muted}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}{muted ? 'Sound off' : 'Sound on'}</button><button onClick={interview.replay} disabled={busy || listening || muted}><RotateCcw size={15} />Replay</button></div>
          {confirmEnd ? <div className="studio-finish-confirm"><p>Finish now and review your feedback? An unsubmitted draft will not be included.</p><button className="studio-submit" onClick={finish} disabled={busy}>Finish & view feedback <ArrowUpRight size={16} /></button><button onClick={() => setConfirmEnd(false)} disabled={ending}>Keep practicing</button></div> : <button className="studio-end" onClick={() => setConfirmEnd(true)} disabled={busy}><Square size={14} /> Finish interview <ArrowUpRight size={15} /></button>}
        </aside>
      </div>
    </div>
  );
}

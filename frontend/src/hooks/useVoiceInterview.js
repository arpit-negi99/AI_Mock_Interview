import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceInterviewService } from '@/services/voiceInterviewService';

export function useVoiceInterview({ sessionId, muted = false, onEnded, onError }) {
  const [state, setState] = useState('loading');
  const [session, setSession] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [voiceSupported] = useState(() => Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  const recognitionRef = useRef(null);
  const submittingRef = useRef(false);
  const mountedRef = useRef(false);
  const callbacks = useRef({ onEnded, onError });
  const utteranceRef = useRef(null);
  useEffect(() => { callbacks.current = { onEnded, onError }; }, [onEnded, onError]);

  const cancelSpeech = useCallback(() => {
    if (utteranceRef.current) { utteranceRef.current.onend = null; utteranceRef.current.onerror = null; }
    window.speechSynthesis?.cancel();
    setState((value) => value === 'ai-speaking' ? 'idle' : value);
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const loadSession = useCallback(async () => {
    const response = await voiceInterviewService.getSession(sessionId);
    const data = response.data || response;
    const value = { ...data.session, storageMode: data.storageMode };
    if (!mountedRef.current) return value;
    setSession(value);
    setError('');
    setState((current) => ['error', 'loading'].includes(current) ? 'idle' : current);
    if (value.status === 'completed') callbacks.current.onEnded?.();
    return value;
  }, [sessionId]);

  useEffect(() => {
    mountedRef.current = true;
    let active = true;
    if (sessionId) {
      loadSession().then(() => { if (active) setState('idle'); }).catch((failure) => {
        if (active) { setState('error'); setError(failure.message || 'Could not restore your session.'); }
      });
    }
    return () => {
      active = false;
      mountedRef.current = false;
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, [loadSession, sessionId]);

  const history = session?.questionHistory || [];
  const currentQuestion = history.at(-1);
  const question = currentQuestion?.questionText || '';

  const replay = useCallback(() => {
    if (muted || !question || !window.speechSynthesis) return;
    cancelSpeech();
    const utterance = new SpeechSynthesisUtterance(question);
    utteranceRef.current = utterance;
    utterance.rate = 0.96;
    utterance.onend = () => { if (mountedRef.current) setState('idle'); };
    utterance.onerror = () => { if (mountedRef.current) setState('idle'); };
    setState('ai-speaking');
    window.speechSynthesis.speak(utterance);
  }, [cancelSpeech, muted, question]);

  const startListening = useCallback(() => {
    if (!voiceSupported || submittingRef.current || recognitionRef.current) return;
    cancelSpeech();
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    const prefix = transcript.trim();
    recognition.onresult = (event) => {
      const spoken = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ');
      if (mountedRef.current) setTranscript([prefix, spoken].filter(Boolean).join(' '));
    };
    recognition.onerror = (event) => {
      if (!mountedRef.current || event.error === 'aborted') return;
      setError(event.error === 'not-allowed' ? 'Microphone access was denied. You can type your answer below.' : 'Voice input stopped. Review the transcript or continue typing.');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      if (mountedRef.current) setState((value) => value === 'listening' ? 'idle' : value);
    };
    recognitionRef.current = recognition;
    try { recognition.start(); setState('listening'); setError(''); }
    catch { recognitionRef.current = null; setError('Voice input is unavailable. You can type your answer.'); }
  }, [cancelSpeech, transcript, voiceSupported]);

  const submitAnswer = useCallback(async () => {
    if (submittingRef.current || !session || state === 'listening') return;
    const answer = transcript.trim();
    if (answer.split(/\s+/).filter(Boolean).length < 5) { setError('Add a little more detail (at least five words) before submitting.'); return; }
    submittingRef.current = true;
    cancelSpeech();
    setState('processing');
    setError('');
    const count = session.questionHistory.length;
    try {
      const response = await voiceInterviewService.answerText(sessionId, answer, count);
      const data = response.data || response;
      if (!mountedRef.current) return;
      setSession((previous) => ({ ...data.session, storageMode: previous?.storageMode }));
      setTranscript('');
      setState('idle');
      if (data.ended) callbacks.current.onEnded?.(data);
    } catch (failure) {
      if (!mountedRef.current) return;
      // A response may be lost after the server has accepted the answer.
      // Reconcile before allowing a retry against the next question.
      let recovered = false;
      try {
        const fresh = await loadSession();
        recovered = fresh.status === 'completed' || fresh.questionHistory.length > count;
      } catch { /* Keep the answer so the user can retry. */ }
      if (!mountedRef.current) return;
      if (recovered) { setTranscript(''); setState('idle'); }
      else { setState('error'); setError(failure.message || 'Your answer could not be submitted. It is still here; try again.'); }
    } finally { submittingRef.current = false; }
  }, [cancelSpeech, loadSession, session, sessionId, state, transcript]);

  return { state, session, question, currentQuestion, history, transcript, setTranscript, error,
    voiceSupported, startListening, stopListening, replay, cancelSpeech, submitAnswer, loadSession };
}

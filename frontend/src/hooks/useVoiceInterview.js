import { useCallback, useEffect, useRef, useState } from 'react';
import { voiceInterviewService } from '@/services/voiceInterviewService';

function toAudioUrl(tts) {
  if (!tts?.audioContent) return tts?.audioUrl || null;
  const byteString = atob(tts.audioContent);
  const bytes = new Uint8Array(byteString.length);
  for (let index = 0; index < byteString.length; index += 1) bytes[index] = byteString.charCodeAt(index);
  return URL.createObjectURL(new Blob([bytes], { type: tts.mimeType || 'audio/mpeg' }));
}

function createSpeechRecognition(onText) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return null;
  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
  recognition.onresult = (event) => {
    const text = Array.from(event.results).map((result) => result[0]?.transcript || '').join(' ').trim();
    onText(text);
  };
  return recognition;
}

export function useVoiceInterview({ sessionId, initialQuestion = '', initialTts = null, muted = false, onEnded, onError }) {
  const [state, setState] = useState('idle');
  const [question, setQuestion] = useState(initialQuestion);
  const [transcript, setTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [lastTts, setLastTts] = useState(initialTts);
  const transcriptRef = useRef('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const analyserFrameRef = useRef(null);
  const hasSubmittedRef = useRef(false);
  const didAutoPlayRef = useRef(false);
  const startListeningRef = useRef(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) window.clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = null;
  }, []);

  const stopMeter = useCallback(() => {
    if (analyserFrameRef.current) cancelAnimationFrame(analyserFrameRef.current);
    analyserFrameRef.current = null;
    setAudioLevel(0);
  }, []);

  const playTts = useCallback(async (tts, fallbackText = question) => {
    if (!fallbackText && !tts) return;
    if (muted) {
      setState('idle');
      return;
    }
    const audioUrl = toAudioUrl(tts);
    if (audioUrl) {
      setState('ai-speaking');
      await new Promise((resolve, reject) => {
        const audio = new Audio(audioUrl);
        audio.onended = resolve;
        audio.onerror = reject;
        audio.play().catch(reject);
      }).catch(() => {
        if (window.speechSynthesis && fallbackText) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(fallbackText);
          utterance.onend = () => setState('idle');
          window.speechSynthesis.speak(utterance);
        }
      });
      if (audioUrl.startsWith('blob:')) URL.revokeObjectURL(audioUrl);
    } else if (window.speechSynthesis && fallbackText) {
      setState('ai-speaking');
      await new Promise((resolve) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(fallbackText);
        utterance.onend = resolve;
        utterance.onerror = resolve;
        window.speechSynthesis.speak(utterance);
      });
    }
    setState('idle');
  }, [muted, question]);

  const updateTranscript = useCallback((value) => {
    transcriptRef.current = value;
    setTranscript(value);
  }, []);

  const finalizeRecording = useCallback(async () => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    clearSilenceTimer();
    stopMeter();
    recognitionRef.current?.stop?.();
    streamRef.current?.getTracks?.().forEach((track) => track.stop());

    setState('processing');
    const recorder = mediaRecorderRef.current;
    const blob = new Blob(chunksRef.current, { type: recorder?.mimeType || 'audio/webm' });
    const formData = new FormData();
    formData.append('audio', blob, 'answer.webm');
    if (transcriptRef.current.trim()) formData.append('fallbackText', transcriptRef.current.trim());

    try {
      const response = await voiceInterviewService.answerAudio(sessionId, formData);
      const data = response.data || response;
      if (data.ended) {
        setQuestion(data.ttsText || 'Interview completed.');
        setLastTts(data.tts);
        await playTts(data.tts, data.ttsText);
        onEnded?.(data);
        return;
      }
      const nextText = data.nextQuestion || data.question?.text || data.aiResult?.questionText || '';
      setQuestion(nextText);
      updateTranscript('');
      setLastTts(data.tts);
      await playTts(data.tts, nextText);
      startListeningRef.current?.();
    } catch (error) {
      setState('error');
      onError?.(error);
    } finally {
      hasSubmittedRef.current = false;
    }
  }, [clearSilenceTimer, onEnded, onError, playTts, sessionId, stopMeter, updateTranscript]);

  const submitRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.stop();
      return;
    }
    finalizeRecording();
  }, [finalizeRecording]);

  const startListening = useCallback(async () => {
    if (!sessionId) return;
    updateTranscript('');
    chunksRef.current = [];
    hasSubmittedRef.current = false;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;
    const recorder = new MediaRecorder(stream);
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => finalizeRecording();
    recorder.start();

    recognitionRef.current = createSpeechRecognition(updateTranscript);
    recognitionRef.current?.start?.();

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    const data = new Uint8Array(analyser.frequencyBinCount);
    source.connect(analyser);
    setState('listening');

    const meter = () => {
      analyser.getByteTimeDomainData(data);
      const peak = data.reduce((max, value) => Math.max(max, Math.abs(value - 128)), 0) / 128;
      setAudioLevel(peak);
      if (peak > 0.04) {
        clearSilenceTimer();
        silenceTimerRef.current = window.setTimeout(() => submitRecording(), 4500);
      }
      analyserFrameRef.current = requestAnimationFrame(meter);
    };
    meter();
  }, [clearSilenceTimer, finalizeRecording, sessionId, submitRecording, updateTranscript]);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const replay = useCallback(() => playTts(lastTts, question), [lastTts, playTts, question]);

  useEffect(() => {
    if (didAutoPlayRef.current || (!initialTts && !initialQuestion)) return undefined;
    didAutoPlayRef.current = true;
    const timer = window.setTimeout(() => playTts(initialTts, initialQuestion), 0);
    return () => window.clearTimeout(timer);
  }, [initialQuestion, initialTts, playTts]);

  useEffect(() => {
    return () => {
      clearSilenceTimer();
      stopMeter();
      streamRef.current?.getTracks?.().forEach((track) => track.stop());
      recognitionRef.current?.stop?.();
    };
  }, [clearSilenceTimer, stopMeter]);

  return { state, question, transcript, setTranscript: updateTranscript, audioLevel, startListening, stopListening: submitRecording, replay, playTts };
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export function useSpeechRecognition({ silenceMs = 4500, onSilence } = {}) {
  const Recognition = useMemo(() => window.SpeechRecognition || window.webkitSpeechRecognition, []);
  const recognitionRef = useRef(null);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef(null);
  const latestTranscriptRef = useRef('');
  const [transcript, setTranscript] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [error, setError] = useState('');

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const scheduleSilenceSubmit = useCallback((text) => {
    clearSilenceTimer();
    if (!text.trim()) return;
    silenceTimerRef.current = window.setTimeout(() => {
      const finalText = latestTranscriptRef.current.trim();
      if (!finalText) return;
      shouldListenRef.current = false;
      recognitionRef.current?.stop();
      setVoiceState('idle');
      onSilence?.(finalText);
    }, silenceMs);
  }, [clearSilenceTimer, onSilence, silenceMs]);

  const startListening = useCallback(() => {
    if (!Recognition) {
      setError('Speech recognition is not supported in this browser.');
      setVoiceState('error');
      return;
    }
    clearSilenceTimer();
    shouldListenRef.current = true;
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.onstart = () => setVoiceState('listening');
    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission denied.' : 'Speech recognition failed.');
      shouldListenRef.current = false;
      clearSilenceTimer();
      setVoiceState('error');
    };
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((result) => result[0].transcript).join(' ');
      latestTranscriptRef.current = text;
      setTranscript(text);
      scheduleSilenceSubmit(text);
    };
    recognition.onend = () => {
      if (shouldListenRef.current) {
        try {
          recognition.start();
        } catch {
          setVoiceState((state) => (state === 'listening' ? 'idle' : state));
        }
        return;
      }
      setVoiceState((state) => (state === 'listening' ? 'idle' : state));
    };
    recognitionRef.current = recognition;
    recognition.start();
  }, [Recognition, clearSilenceTimer, scheduleSilenceSubmit]);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    clearSilenceTimer();
    recognitionRef.current?.stop();
  }, [clearSilenceTimer]);
  const resetTranscript = useCallback(() => {
    latestTranscriptRef.current = '';
    clearSilenceTimer();
    setTranscript('');
  }, [clearSilenceTimer]);

  useEffect(() => () => {
    shouldListenRef.current = false;
    clearSilenceTimer();
    recognitionRef.current?.abort?.();
  }, [clearSilenceTimer]);

  return { transcript, setTranscript, voiceState, setVoiceState, error, startListening, stopListening, resetTranscript, isSupported: Boolean(Recognition) };
}

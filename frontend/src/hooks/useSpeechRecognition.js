import { useCallback, useMemo, useRef, useState } from 'react';

export function useSpeechRecognition() {
  const Recognition = useMemo(() => window.SpeechRecognition || window.webkitSpeechRecognition, []);
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [voiceState, setVoiceState] = useState('idle');
  const [error, setError] = useState('');

  const startListening = useCallback(() => {
    if (!Recognition) {
      setError('Speech recognition is not supported in this browser.');
      setVoiceState('error');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => setVoiceState('listening');
    recognition.onerror = (event) => {
      setError(event.error === 'not-allowed' ? 'Microphone permission denied.' : 'Speech recognition failed.');
      setVoiceState('error');
    };
    recognition.onresult = (event) => {
      const text = Array.from(event.results).map((result) => result[0].transcript).join(' ');
      setTranscript(text);
    };
    recognition.onend = () => setVoiceState((state) => (state === 'listening' ? 'idle' : state));
    recognitionRef.current = recognition;
    recognition.start();
  }, [Recognition]);

  const stopListening = useCallback(() => recognitionRef.current?.stop(), []);
  const resetTranscript = useCallback(() => setTranscript(''), []);

  return { transcript, setTranscript, voiceState, setVoiceState, error, startListening, stopListening, resetTranscript, isSupported: Boolean(Recognition) };
}

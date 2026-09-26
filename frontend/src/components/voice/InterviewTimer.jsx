import { useEffect, useRef, useState } from 'react';

export function InterviewTimer({ minutes = 15, startedAt, onComplete }) {
  const [now, setNow] = useState(() => Date.now());
  const [mountedAt] = useState(() => Date.now());
  const completedRef = useRef(false);
  const deadline = (startedAt ? new Date(startedAt).getTime() : mountedAt) + minutes * 60000;
  const remaining = Math.max(0, Math.ceil((deadline - now) / 1000));
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => {
    if (remaining === 0 && !completedRef.current) { completedRef.current = true; onComplete?.(); }
  }, [remaining, onComplete]);
  return <span className={remaining < 120 ? 'text-amber-600 tabular-nums' : 'tabular-nums'} aria-label="Time remaining">{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span>;
}

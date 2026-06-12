import { useEffect, useState } from 'react';

export function InterviewTimer({ minutes = 15, onComplete }) {
  const [remaining, setRemaining] = useState(minutes * 60);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining((value) => {
        if (value <= 1) {
          window.clearInterval(timer);
          onComplete?.();
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [onComplete]);

  const isWarning = remaining < 120;
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  return (
    <span
      className="font-mono text-sm font-semibold transition-colors duration-300"
      style={{ color: isWarning ? 'var(--danger)' : 'var(--text-secondary)' }}
    >
      {mm}:{ss}
    </span>
  );
}

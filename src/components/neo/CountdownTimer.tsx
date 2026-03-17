'use client';

import { useState, useEffect } from 'react';

function useCountdown() {
  const [target] = useState(() => Date.now() + 48 * 3600000);
  const [t, setT] = useState({ h: 47, m: 59, s: 59 });

  useEffect(() => {
    const tick = () => {
      const d = Math.max(0, target - Date.now());
      setT({
        h: Math.floor(d / 3600000),
        m: Math.floor((d % 3600000) / 60000),
        s: Math.floor((d % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return t;
}

interface CountdownTimerProps {
  big?: boolean;
}

export default function CountdownTimer({ big = false }: CountdownTimerProps) {
  const { h, m, s } = useCountdown();
  const pad = (n: number) => String(n).padStart(2, '0');

  if (big) {
    return (
      <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
        {[pad(h), pad(m), pad(s)].map((v, i) => (
          <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span
              style={{
                background: '#1a1a2e',
                color: '#f59e0b',
                borderRadius: 8,
                padding: '6px 10px',
                fontSize: 20,
                fontWeight: 900,
                fontFamily: 'monospace',
                border: '2px solid #333',
                minWidth: 42,
                textAlign: 'center',
                display: 'inline-block',
              }}
            >
              {v}
            </span>
            {i < 2 && <span style={{ color: '#1a1a2e', fontWeight: 900, fontSize: 18 }}>:</span>}
          </span>
        ))}
      </span>
    );
  }

  return (
    <span
      style={{
        background: '#fee2e2',
        color: '#dc2626',
        borderRadius: 8,
        padding: '3px 10px',
        fontSize: 13,
        fontWeight: 800,
        fontFamily: 'monospace',
        letterSpacing: 1,
      }}
    >
      {pad(h)}:{pad(m)}:{pad(s)}
    </span>
  );
}

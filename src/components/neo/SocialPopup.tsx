'use client';

import { useState, useEffect, useCallback } from 'react';
import { Icon } from '@/lib/icons';

interface PopupMessage {
  icon: string;
  text: string;
  time: string;
}

interface SocialPopupProps {
  messages: PopupMessage[];
}

export default function SocialPopup({ messages }: SocialPopupProps) {
  const [cur, setCur] = useState(0);
  const [show, setShow] = useState(false);
  const [order, setOrder] = useState<number[]>([]);

  // Shuffle message order on mount
  useEffect(() => {
    const indices = Array.from({ length: messages.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    setOrder(indices);
  }, [messages.length]);

  const getRandomDelay = useCallback(() => {
    return 8000 + Math.floor(Math.random() * 12000); // 8-20 seconds
  }, []);

  // Initial appearance with random delay
  useEffect(() => {
    const d = setTimeout(() => setShow(true), 3000 + Math.floor(Math.random() * 4000));
    return () => clearTimeout(d);
  }, []);

  // Cycle through messages with random intervals
  useEffect(() => {
    if (!show || order.length === 0) return;
    const delay = getRandomDelay();
    const id = setTimeout(() => {
      setShow(false);
      setTimeout(() => {
        setCur((c) => (c + 1) % order.length);
        setShow(true);
      }, 500);
    }, delay);
    return () => clearTimeout(id);
  }, [show, cur, order.length, getRandomDelay]);

  if (order.length === 0) return null;
  const p = messages[order[cur]];
  if (!p) return null;

  return (
    <div
      onClick={() => { setShow(false); window.location.hash = 'pricing'; }}
      style={{
        position: 'fixed',
        bottom: 16,
        left: 12,
        right: 12,
        zIndex: 9999,
        background: '#fff',
        border: '3px solid #1a1a2e',
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 370,
        width: 'calc(100% - 24px)',
        boxShadow: '4px 4px 0px #1a1a2e',
        transform: show ? 'translateY(0)' : 'translateY(160%)',
        opacity: show ? 1 : 0,
        transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', color: '#1a1a2e' }}>
        <Icon name={p.icon} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{p.text}</div>
        {p.time && <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>{p.time}</div>}
      </div>
    </div>
  );
}

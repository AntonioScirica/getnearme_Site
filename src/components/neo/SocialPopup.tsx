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

  const getRandomInterval = useCallback(() => {
    return 60000 + Math.floor(Math.random() * 60000); // 60-120 seconds between popups
  }, []);

  // Initial appearance with random delay
  useEffect(() => {
    const d = setTimeout(() => setShow(true), 15000 + Math.floor(Math.random() * 10000));
    return () => clearTimeout(d);
  }, []);

  // Auto-hide after 3s, then schedule next popup
  useEffect(() => {
    if (!show || order.length === 0) return;
    // Hide after 3 seconds
    const hideId = setTimeout(() => {
      setShow(false);
    }, 3000);
    return () => clearTimeout(hideId);
  }, [show, order.length]);

  // After hiding, wait long interval then show next
  useEffect(() => {
    if (show || order.length === 0) return;
    const nextId = setTimeout(() => {
      setCur((c) => (c + 1) % order.length);
      setShow(true);
    }, getRandomInterval());
    return () => clearTimeout(nextId);
  }, [show, order.length, getRandomInterval]);

  if (order.length === 0) return null;
  const p = messages[order[cur]];
  if (!p) return null;
  if (!show) return null;

  return (
    <div
      onClick={() => { setShow(false); window.location.hash = 'pricing'; }}
      className="social-popup-enter"
      style={{
        position: 'fixed',
        bottom: 16,
        left: 12,
        right: 12,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid rgba(26,26,46,0.10)',
        borderRadius: 14,
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        maxWidth: 370,
        width: 'calc(100% - 24px)',
        boxShadow: '0 8px 24px rgba(16,24,40,0.14)',
        cursor: 'pointer',
        animation: 'popupSlideIn 0.4s ease forwards',
      }}
    >
      <span style={{ display: 'flex', color: '#1a1a2e' }}>
        <Icon name={p.icon} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{p.text}</div>
        {p.time && <div style={{ color: '#6b7280', fontSize: 11, marginTop: 2 }}>{p.time}</div>}
      </div>
      <style>{`
        @keyframes popupSlideIn {
          from { transform: translateY(120%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

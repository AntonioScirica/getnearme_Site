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
  const [fading, setFading] = useState(false);
  const [visible, setVisible] = useState(false);
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
    return 120000 + Math.floor(Math.random() * 120000); // 120-240 seconds between popups
  }, []);

  // Initial appearance with random delay
  useEffect(() => {
    const d = setTimeout(() => setShow(true), 15000 + Math.floor(Math.random() * 10000));
    return () => clearTimeout(d);
  }, []);

  // When show turns true, make visible
  useEffect(() => {
    if (show) {
      setVisible(true);
      setFading(false);
    }
  }, [show]);

  // Auto-hide after 3s with fade out
  useEffect(() => {
    if (!show || order.length === 0) return;
    const hideId = setTimeout(() => {
      setFading(true);
      setTimeout(() => {
        setShow(false);
        setVisible(false);
        setFading(false);
      }, 500);
    }, 3000);
    return () => clearTimeout(hideId);
  }, [show, order.length]);

  // After hiding, wait long interval then show next
  useEffect(() => {
    if (show || visible || order.length === 0) return;
    const nextId = setTimeout(() => {
      setCur((c) => (c + 1) % order.length);
      setShow(true);
    }, getRandomInterval());
    return () => clearTimeout(nextId);
  }, [show, visible, order.length, getRandomInterval]);

  if (order.length === 0) return null;
  const p = messages[order[cur]];
  if (!p) return null;
  if (!visible) return null;

  return (
    <div
      onClick={() => {
        setFading(true);
        setTimeout(() => {
          setShow(false);
          setVisible(false);
          setFading(false);
          window.location.hash = 'pricing';
        }, 300);
      }}
      style={{
        position: 'fixed',
        bottom: 14,
        left: 11,
        right: 11,
        zIndex: 9999,
        background: '#fff',
        border: '1px solid rgba(26,26,46,0.10)',
        borderRadius: 13,
        padding: '13px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        maxWidth: 333,
        width: 'calc(100% - 22px)',
        boxShadow: '0 8px 24px rgba(16,24,40,0.14)',
        cursor: 'pointer',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.5s ease',
        animation: !fading ? 'popupFadeIn 0.5s ease forwards' : undefined,
      }}
    >
      <span style={{ display: 'flex', color: '#1a1a2e' }}>
        <Icon name={p.icon} size={22} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#1a1a2e', fontSize: 11.5, fontWeight: 700, lineHeight: 1.4 }}>{p.text}</div>
        {p.time && <div style={{ color: '#6b7280', fontSize: 10, marginTop: 2 }}>{p.time}</div>}
      </div>
      <style>{`
        @keyframes popupFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

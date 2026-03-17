'use client';

import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const d = setTimeout(() => setShow(true), 4000);
    return () => clearTimeout(d);
  }, []);

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => {
      setShow(false);
      setTimeout(() => {
        setCur((c) => (c + 1) % messages.length);
        setShow(true);
      }, 500);
    }, 14000);
    return () => clearInterval(id);
  }, [show, messages.length]);

  const handleClick = () => {
    setShow(false);
    window.location.hash = 'pricing';
  };

  const p = messages[cur];
  if (!p) return null;

  return (
    <div
      onClick={handleClick}
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
      <span style={{ fontSize: 22 }}>{p.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#1a1a2e', fontSize: 13, fontWeight: 700, lineHeight: 1.4 }}>{p.text}</div>
        {p.time && <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>{p.time}</div>}
      </div>
    </div>
  );
}

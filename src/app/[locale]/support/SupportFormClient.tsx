'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function SupportFormClient({ locale }: { locale: string }) {
  const [email, setEmail] = useState('');
  const [type, setType] = useState<'support' | 'bug'>('support');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/support-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, message }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Errore server');
      }
      setStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Errore nell\'invio');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div style={{ textAlign: 'center', padding: '54px 0' }}>
        <div
          style={{
            width: 65,
            height: 65,
            borderRadius: '50%',
            background: '#10b981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 22px',
            fontSize: 32,
            color: '#fff',
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: 25, fontWeight: 900, color: '#1a1a2e', marginBottom: 7 }}>
          Messaggio inviato
        </h2>
        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 29 }}>
          Ti risponderemo il prima possibile.
        </p>
        <Link
          href={`/${locale}`}
          style={{
            display: 'inline-block',
            background: '#f59e0b',
            color: '#1a1a2e',
            border: '1px solid rgba(26,26,46,0.10)',
            borderRadius: 11,
            padding: '13px 29px',
            fontWeight: 900,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Torna alla home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Tipo richiesta */}
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 7 }}>
          Tipo di richiesta
        </label>
        <div style={{ display: 'flex', gap: 11 }}>
          {(['support', 'bug'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              style={{
                flex: 1,
                padding: '11px 14px',
                borderRadius: 11,
                border: `2px solid ${type === t ? '#2563eb' : '#e5e7eb'}`,
                background: type === t ? '#eff6ff' : '#fff',
                color: type === t ? '#2563eb' : '#71717a',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16 }}>{t === 'support' ? '💬' : '🐛'}</span>
              {t === 'support' ? 'Supporto' : 'Segnala un problema'}
            </button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="email"
          style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 7 }}
        >
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="La tua email"
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 11,
            border: '2px solid #e5e7eb',
            fontSize: 14,
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Messaggio */}
      <div>
        <label
          htmlFor="message"
          style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 7 }}
        >
          Messaggio
        </label>
        <textarea
          id="message"
          required
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Descrivi il tuo problema o la tua richiesta..."
          style={{
            width: '100%',
            padding: '13px 14px',
            borderRadius: 11,
            border: '2px solid #e5e7eb',
            fontSize: 14,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>
          {errorMsg || 'Errore nell\'invio'}. Riprova o scrivici a info@getnearme.it
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          background: status === 'sending' ? '#9ca3af' : '#f59e0b',
          color: '#1a1a2e',
          border: '1px solid rgba(26,26,46,0.10)',
          borderRadius: 11,
          padding: '14px 29px',
          fontWeight: 900,
          fontSize: 14,
          cursor: status === 'sending' ? 'not-allowed' : 'pointer',
          width: '100%',
        }}
      >
        {status === 'sending' ? 'Invio in corso...' : 'Invia messaggio'}
      </button>
    </form>
  );
}

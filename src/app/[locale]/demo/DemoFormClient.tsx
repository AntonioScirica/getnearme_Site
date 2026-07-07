'use client';

import { useState } from 'react';
import Link from 'next/link';

interface DemoTranslations {
  fieldName: string;
  fieldEmail: string;
  fieldAgencyName: string;
  fieldPhone: string;
  fieldMessage: string;
  submit: string;
  submitting: string;
  successTitle: string;
  successMessage: string;
  errorMessage: string;
  backToHome: string;
}

export default function DemoFormClient({
  t,
  locale,
}: {
  t: DemoTranslations;
  locale: string;
}) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    nomeAgenzia: '',
    telefono: '',
    messaggio: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    try {
      const res = await fetch('/api/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus('success');
    } catch {
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
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: 25, fontWeight: 900, color: '#1a1a2e', marginBottom: 7 }}>
          {t.successTitle}
        </h2>
        <p style={{ color: '#71717a', fontSize: 14, marginBottom: 29 }}>{t.successMessage}</p>
        <Link
          href={`/${locale}`}
          style={{
            display: 'inline-block',
            background: '#f59e0b',
            color: '#1a1a2e',
            border: '1px solid rgba(26,26,46,0.10)',
            padding: '13px 29px',
            borderRadius: 11,
            fontWeight: 800,
            fontSize: 14,
            textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(16,24,40,0.08)',
          }}
        >
          {t.backToHome}
        </Link>
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '13px 14px',
    border: '1px solid rgba(26,26,46,0.10)',
    borderRadius: 11,
    fontSize: 14,
    fontWeight: 500,
    outline: 'none',
    transition: 'box-shadow 0.15s',
    background: '#fff',
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 5 }}>
          {t.fieldName} *
        </label>
        <input
          type="text"
          required
          minLength={2}
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          style={inputStyle}
          onFocus={(e) => (e.target.style.boxShadow = '4px 4px 0px #f59e0b')}
          onBlur={(e) => (e.target.style.boxShadow = 'none')}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 5 }}>
          {t.fieldEmail} *
        </label>
        <input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          style={inputStyle}
          onFocus={(e) => (e.target.style.boxShadow = '4px 4px 0px #f59e0b')}
          onBlur={(e) => (e.target.style.boxShadow = 'none')}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 5 }}>
          {t.fieldAgencyName} *
        </label>
        <input
          type="text"
          required
          minLength={2}
          value={form.nomeAgenzia}
          onChange={(e) => setForm({ ...form, nomeAgenzia: e.target.value })}
          style={inputStyle}
          onFocus={(e) => (e.target.style.boxShadow = '4px 4px 0px #f59e0b')}
          onBlur={(e) => (e.target.style.boxShadow = 'none')}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 5 }}>
          {t.fieldPhone}
        </label>
        <input
          type="tel"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          style={inputStyle}
          onFocus={(e) => (e.target.style.boxShadow = '4px 4px 0px #f59e0b')}
          onBlur={(e) => (e.target.style.boxShadow = 'none')}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#1a1a2e', marginBottom: 5 }}>
          {t.fieldMessage}
        </label>
        <textarea
          rows={4}
          value={form.messaggio}
          onChange={(e) => setForm({ ...form, messaggio: e.target.value })}
          style={{ ...inputStyle, resize: 'vertical' }}
          onFocus={(e) => (e.target.style.boxShadow = '4px 4px 0px #f59e0b')}
          onBlur={(e) => (e.target.style.boxShadow = 'none')}
        />
      </div>

      {status === 'error' && (
        <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 600, margin: 0 }}>{t.errorMessage}</p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        style={{
          width: '100%',
          padding: '14px',
          background: status === 'sending' ? '#d97706' : '#f59e0b',
          color: '#1a1a2e',
          border: '1px solid rgba(26,26,46,0.10)',
          borderRadius: 13,
          fontWeight: 900,
          fontSize: 14,
          cursor: status === 'sending' ? 'wait' : 'pointer',
          boxShadow: '0 4px 16px rgba(16,24,40,0.08)',
          transition: 'all 0.15s',
          letterSpacing: 0.5,
        }}
      >
        {status === 'sending' ? t.submitting : t.submit}
      </button>
    </form>
  );
}

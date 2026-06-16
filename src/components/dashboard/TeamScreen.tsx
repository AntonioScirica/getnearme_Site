'use client';

// Team agenzia: crea team, invita membri (email + invite code), gestisci ruoli.
// Riservato ai piani Agenzia. Logica portata dall'estensione (manage-team).

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { s, Box, Icon } from './ui';
import type { UserData } from '@/app/[locale]/dashboard/page';
import {
  getTeamStatus, createTeam, updateTeamName, regenerateInviteCode,
  inviteTeamMember, removeTeamMember, revokeInvite, leaveTeam, dissolveTeam,
  avatarColor, initials,
  type TeamStatus,
} from '@/lib/team';

const ACCENT = '#3B83F6';

function Avatar({ email, url, size = 38 }: { email: string; url?: string | null; size?: number }) {
  if (url) return <img src={url} alt={email} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <span style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: avatarColor(email), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 700 }}>
      {initials(email)}
    </span>
  );
}

export default function TeamScreen({
  toast,
  go,
  isAgency,
}: {
  toast: (msg: string, icon?: string) => void;
  go?: (r: string, params?: Record<string, unknown>) => void;
  isAgency: boolean;
  userData?: UserData | null;
}) {
  const [status, setStatus] = useState<TeamStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [confirm, setConfirm] = useState<null | { title: string; sub: string; danger?: boolean; onYes: () => void }>(null);

  const refresh = useCallback(async () => {
    const st = await getTeamStatus();
    setStatus(st);
    setLoading(false);
  }, []);

  useEffect(() => { if (isAgency) refresh(); else setLoading(false); }, [isAgency, refresh]);

  const isOwner = status?.role === 'owner';
  const owner = useMemo(() => status?.members.find((m) => m.role === 'owner') || null, [status]);

  // ── Azioni ───────────────────────────────────────────────────────────────
  const wrap = async (fn: () => Promise<{ error: string | null } | { error?: string }>, okMsg?: string) => {
    setBusy(true);
    try {
      const res = await fn();
      const err = (res as { error?: string | null }).error;
      if (err) { toast(err, 'x'); return false; }
      if (okMsg) toast(okMsg, 'check');
      await refresh();
      return true;
    } finally { setBusy(false); }
  };

  const onCreate = () => {
    const n = nameInput.trim();
    if (!n) { toast('Inserisci un nome', 'x'); return; }
    wrap(() => createTeam(n), 'Team creato!');
  };
  const onRename = () => {
    const n = nameInput.trim();
    if (!n) return;
    wrap(() => updateTeamName(n), 'Nome aggiornato');
  };
  const onInvite = () => {
    const e = inviteEmail.trim();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { toast('Email non valida', 'x'); return; }
    wrap(() => inviteTeamMember(e), `Invito inviato a ${e}`).then((ok) => { if (ok) setInviteEmail(''); });
  };
  const onRegen = () => wrap(() => regenerateInviteCode(), 'Codice rigenerato');
  const copyCode = () => {
    if (!status?.invite_code) return;
    navigator.clipboard?.writeText(status.invite_code).then(() => toast('Codice copiato', 'check')).catch(() => {});
  };

  // ── Stati di rendering ─────────────────────────────────────────────────────
  if (loading) {
    return <div style={s('display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 200px)')}><div style={{ width: 24, height: 24, border: '3px solid #e4e1da', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  }

  // Non agenzia → blocco
  if (!isAgency) {
    return (
      <div style={s('max-width:680px;margin:0 auto;padding:64px 32px;text-align:center')}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s('width:64px;height:64px;border-radius:18px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 18px')}><Icon name="users" size={28} color={ACCENT} /></div>
        <h1 style={s('margin:0 0 8px;font-size:22px;font-weight:800;letter-spacing:-.3px')}>Team riservato ai piani Agenzia</h1>
        <p style={s('margin:0 0 22px;font-size:14px;color:#8c867d;line-height:1.6;max-width:440px;margin-left:auto;margin-right:auto')}>Invita collaboratori, condividi il brand e gestisci i crediti del team. Passa a un piano Agenzia per attivarlo.</p>
        <Box as="button" onClick={() => go?.('account', { tier: 'agency' as const })} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 22px;border-radius:12px;cursor:pointer')} hover={s('background:#2b6fe0')}>Scopri i piani Agenzia</Box>
      </div>
    );
  }

  return (
    <div style={s('max-width:880px;margin:0 auto;padding:32px 32px 64px')}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s('margin-bottom:24px')}>
        <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>Team</h1>
        <div style={s('color:#8c867d;font-size:14px')}>Gestisci collaboratori e accessi della tua agenzia.</div>
      </div>

      {/* Notifica: un membro ha lasciato */}
      {status?.member_left && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 16px', marginBottom: 18 }}>
          <Icon name="info" size={16} color="#ea580c" />
          <span style={{ fontSize: 13, color: '#9a3412', fontWeight: 600 }}>{status.member_left.email} ha lasciato il team.</span>
        </div>
      )}

      {/* ── Nessun team → crea ── */}
      {!status?.in_team && (
        <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;padding:28px')}>
          <h3 style={s('margin:0 0 6px;font-size:16px;font-weight:800')}>Crea il tuo team</h3>
          <p style={s('margin:0 0 16px;font-size:13.5px;color:#8c867d;line-height:1.5')}>Dai un nome al team, poi invita i collaboratori via email o con il codice invito.</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }} placeholder="Es. Studio Rossi Immobiliare" style={{ flex: 1, minWidth: 220, border: '1px solid #e4e1da', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', color: '#211f1c' }} />
            <Box as="button" onClick={onCreate} disabled={busy} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:11px 22px;border-radius:10px;cursor:pointer')} hover={s('background:#2b6fe0')}>Crea team</Box>
          </div>
        </div>
      )}

      {/* ── Owner dashboard ── */}
      {status?.in_team && isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Nome team */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;padding:22px 24px')}>
            <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px')}>Nome team</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input defaultValue={status.team_name} onChange={(e) => setNameInput(e.target.value)} placeholder={status.team_name || 'Nome team'} style={{ flex: 1, minWidth: 220, border: '1px solid #e4e1da', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', color: '#211f1c' }} />
              <Box as="button" onClick={onRename} disabled={busy} style={s('border:1px solid #d8d4cb;background:#fff;color:#8c867d;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer')} hover={{ borderColor: ACCENT, color: ACCENT }}>Salva</Box>
            </div>
          </div>

          {/* Invito email + codice */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;padding:22px 24px')}>
            <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px')}>Invita collaboratori</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onInvite(); }} placeholder="email@collaboratore.it" type="email" style={{ flex: 1, minWidth: 220, border: '1px solid #e4e1da', borderRadius: 10, padding: '11px 14px', fontSize: 14, outline: 'none', color: '#211f1c' }} />
              <Box as="button" onClick={onInvite} disabled={busy} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:11px 20px;border-radius:10px;cursor:pointer;display:inline-flex;align-items:center;gap:7px')} hover={s('background:#2b6fe0')}><Icon name="at-sign" size={15} color="#fff" />Invita</Box>
            </div>
            {/* Codice invito */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#faf9f7', border: '1px dashed #d8d4cb', borderRadius: 10, padding: '10px 14px' }}>
              <Icon name="link" size={15} color="#b3aca1" />
              <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: '#211f1c', fontFamily: 'monospace', letterSpacing: '.05em' }}>{status.invite_code || '—'}</span>
              <span onClick={copyCode} title="Copia" style={{ cursor: 'pointer', display: 'flex' }}><Icon name="copy" size={16} color="#8c867d" /></span>
              <span onClick={onRegen} title="Rigenera" style={{ cursor: 'pointer', display: 'flex' }}><Icon name="refresh-cw" size={15} color="#8c867d" /></span>
            </div>
          </div>

          {/* Membri */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;padding:22px 24px')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em')}>Membri</div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#8c867d' }}>{status.member_count}/{status.max_members}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {status.members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f6f4f0' }}>
                  <Avatar email={m.email} url={m.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: m.role === 'owner' ? '#eef4fe' : '#f0ede7', color: m.role === 'owner' ? ACCENT : '#8c867d', textTransform: 'uppercase', letterSpacing: '.03em' }}>{m.role === 'owner' ? 'Owner' : 'Membro'}</span>
                  {m.role !== 'owner' && (
                    <span onClick={() => setConfirm({ title: 'Rimuovere il membro?', sub: `${m.email} perderà l'accesso al team.`, danger: true, onYes: () => wrap(() => removeTeamMember(m.user_id), 'Membro rimosso') })} title="Rimuovi" style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={16} color="#cfcabf" /></span>
                  )}
                </div>
              ))}
            </div>

            {/* Inviti pending */}
            {status.pending_invites.length > 0 && (
              <>
                <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:18px 0 10px')}>Inviti in sospeso</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {status.pending_invites.map((inv) => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: '1px solid #f6f4f0' }}>
                      <span style={{ width: 38, height: 38, borderRadius: '50%', flexShrink: 0, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="calendar" size={16} color="#b3aca1" /></span>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 14, color: '#8c867d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.email}</div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#b3aca1' }}>In attesa</span>
                      <span onClick={() => wrap(() => revokeInvite(inv.id), 'Invito revocato')} title="Revoca" style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={16} color="#cfcabf" /></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dissolvi */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box as="button" onClick={() => setConfirm({ title: 'Sciogliere il team?', sub: 'Tutti i membri verranno rimossi e gli inviti annullati. Azione irreversibile.', danger: true, onYes: () => wrap(() => dissolveTeam(), 'Team sciolto') })} style={s('border:1px solid #fca5a5;background:#fff;color:#dc2626;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer')} hover={{ background: '#fef2f2' }}>Sciogli team</Box>
          </div>
        </div>
      )}

      {/* ── Member view ── */}
      {status?.in_team && !isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;padding:24px')}>
            <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:14px')}>Il tuo team</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Avatar email={owner?.email || ''} url={owner?.avatar_url} size={46} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#211f1c' }}>{status.team_name}</div>
                <div style={{ fontSize: 13, color: '#8c867d' }}>Owner: {owner?.email || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 10, padding: '12px 14px', marginTop: 18 }}>
              <Icon name="circle-check" size={16} color={ACCENT} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#1d5fd0' }}>Hai accesso Agenzia tramite il tuo team.</span>
            </div>
          </div>

          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:16px;padding:22px 24px')}>
            <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:12px')}>Membri ({status.member_count})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {status.members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#faf9f7', borderRadius: 99, padding: '5px 12px 5px 5px' }}>
                  <Avatar email={m.email} url={m.avatar_url} size={26} />
                  <span style={{ fontSize: 12.5, color: '#211f1c', maxWidth: 160, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box as="button" onClick={() => setConfirm({ title: 'Lasciare il team?', sub: 'Perderai l\'accesso Agenzia condiviso e le risorse del team.', danger: true, onYes: () => wrap(() => leaveTeam(), 'Hai lasciato il team') })} style={s('border:1px solid #fdba74;background:#fff;color:#ea580c;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer')} hover={{ background: '#fff7ed' }}>Lascia team</Box>
          </div>
        </div>
      )}

      {/* ── Modale conferma ── */}
      {confirm && (
        <div onClick={() => setConfirm(null)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px')}>
          <div onClick={(e) => e.stopPropagation()} style={s('width:100%;max-width:420px;background:var(--bg-card);border-radius:18px;box-shadow:0 32px 64px rgba(20,18,15,.2);padding:28px;text-align:center')}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: confirm.danger ? '#fef2f2' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Icon name={confirm.danger ? 'alert-triangle' : 'info'} size={24} color={confirm.danger ? '#dc2626' : ACCENT} />
            </div>
            <h3 style={s('margin:0 0 6px;font-size:17px;font-weight:800')}>{confirm.title}</h3>
            <p style={s('margin:0 0 22px;font-size:13.5px;color:#8c867d;line-height:1.5')}>{confirm.sub}</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <Box as="button" onClick={() => setConfirm(null)} style={s('flex:1;border:1px solid #d8d4cb;background:#fff;color:#8c867d;font-size:14px;font-weight:700;padding:11px 0;border-radius:10px;cursor:pointer')} hover={s('background:#faf9f7')}>Annulla</Box>
              <Box as="button" onClick={() => { const f = confirm.onYes; setConfirm(null); f(); }} style={{ flex: 1, border: 'none', background: confirm.danger ? '#dc2626' : ACCENT, color: '#fff', fontSize: 14, fontWeight: 700, padding: '11px 0', borderRadius: 10, cursor: 'pointer' }} hover={{ background: confirm.danger ? '#b91c1c' : '#2b6fe0' }}>Conferma</Box>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

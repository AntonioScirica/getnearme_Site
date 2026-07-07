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

function Avatar({ email, url, size = 34 }: { email: string; url?: string | null; size?: number }) {
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
  userData,
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
  const owner = useMemo(() => status?.members?.find((m) => m.role === 'owner') || null, [status]);

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
  const [limitPopup, setLimitPopup] = useState(false);

  // Collaboratori max = teams.max_members (seat-based: utenti acquistati - 1; legacy: 4).
  const MAX_MEMBERS = status?.max_members || 4;
  const occupiedSlots = (status?.members?.filter(m => m.role !== 'owner').length || 0) + (status?.pending_invites?.length || 0);

  const onInvite = () => {
    if (occupiedSlots >= MAX_MEMBERS) { setLimitPopup(true); return; }
    const e = inviteEmail.trim();
    if (!e || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { toast('Email non valida', 'x'); return; }
    const ownEmail = userData?.email?.toLowerCase();
    if (ownEmail && e.toLowerCase() === ownEmail) { toast('Non puoi invitare te stesso', 'x'); return; }
    wrap(() => inviteTeamMember(e), `Invito inviato a ${e}`).then((ok) => { if (ok) setInviteEmail(''); });
  };

  // ── Stati di rendering ─────────────────────────────────────────────────────
  if (loading) {
    return <div style={s('display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 180px)')}><div style={{ width: 22, height: 22, border: '3px solid #e4e1da', borderTopColor: ACCENT, borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>;
  }

  // Non agenzia → blocco
  if (!isAgency) {
    return (
      <div style={s('max-width:680px;margin:0 auto;padding:58px 29px;text-align:center')}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={s('width:58px;height:58px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 16px')}><Icon name="users" size={25} color={ACCENT} /></div>
        <h1 style={s('margin:0 0 7px;font-size:20px;font-weight:800;letter-spacing:-.3px')}>Team riservato ai piani Agenzia</h1>
        <p style={s('margin:0 0 20px;font-size:13px;color:#8c867d;line-height:1.6;max-width:396px;margin-left:auto;margin-right:auto')}>Invita collaboratori, condividi il brand e gestisci i crediti del team. Passa a un piano Agenzia per attivarlo.</p>
        <Box as="button" onClick={() => go?.('account', { tier: 'agency' as const })} style={s('border:none;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:11px 20px;border-radius:11px;cursor:pointer')} hover={s('background:#2b6fe0')}>Scopri i piani Agenzia</Box>
      </div>
    );
  }

  return (
    <div style={s('max-width:880px;margin:0 auto;padding:29px 29px 58px')}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={s('margin-bottom:22px')}>
        <h1 style={s('margin:0 0 4px;font-size:23px;font-weight:800;letter-spacing:-.5px')}>Team</h1>
        <div style={s('color:#8c867d;font-size:13px')}>Gestisci collaboratori e accessi della tua agenzia.</div>
      </div>

      {/* Notifica: un membro ha lasciato */}
      {status?.member_left && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 11, padding: '11px 14px', marginBottom: 16 }}>
          <Icon name="info" size={14} color="#ea580c" />
          <span style={{ fontSize: 12, color: '#9a3412', fontWeight: 600 }}>{status.member_left.email} ha lasciato il team.</span>
        </div>
      )}

      {/* ── Nessun team → crea ── */}
      {!status?.in_team && (
        <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;padding:25px')}>
          <h3 style={s('margin:0 0 5px;font-size:14.5px;font-weight:800')}>Crea il tuo team</h3>
          <p style={s('margin:0 0 14px;font-size:12px;color:#8c867d;line-height:1.5')}>Dai un nome al team, poi invita i collaboratori via email o con il codice invito.</p>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
            <input value={nameInput} onChange={(e) => setNameInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onCreate(); }} placeholder="Es. Studio Rossi Immobiliare" style={{ flex: 1, minWidth: 198, border: '1px solid #e4e1da', borderRadius: 9, padding: '10px 13px', fontSize: 13, outline: 'none', color: '#211f1c' }} />
            <Box as="button" onClick={onCreate} disabled={busy} className="max-md:!w-full" style={s('border:none;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:9px;cursor:pointer')} hover={s('background:#2b6fe0')}>Crea team</Box>
          </div>
        </div>
      )}

      {/* ── Owner dashboard ── */}
      {status?.in_team && isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Nome team */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;padding:20px 22px')}>
            <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:9px')}>Nome team</div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
              <input defaultValue={status.team_name} onChange={(e) => setNameInput(e.target.value)} placeholder={status.team_name || 'Nome team'} style={{ flex: 1, minWidth: 198, border: '1px solid #e4e1da', borderRadius: 9, padding: '9px 13px', fontSize: 13, outline: 'none', color: '#211f1c' }} />
              <Box as="button" onClick={onRename} disabled={busy} className="max-md:!w-full" style={s('border:1px solid #d8d4cb;background:#fff;color:#8c867d;font-size:11.5px;font-weight:700;padding:9px 16px;border-radius:9px;cursor:pointer')} hover={{ borderColor: ACCENT, color: ACCENT }}>Salva</Box>
            </div>
          </div>

          {/* Invito email + codice */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;padding:20px 22px')}>
            <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:9px')}>Invita collaboratori</div>
            <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', marginBottom: 13 }}>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onInvite(); }} placeholder="email@collaboratore.it" type="email" style={{ flex: 1, minWidth: 198, border: '1px solid #e4e1da', borderRadius: 9, padding: '10px 13px', fontSize: 13, outline: 'none', color: '#211f1c' }} />
              <Box as="button" onClick={onInvite} disabled={busy} className="max-md:!w-full max-md:!justify-center" style={s('border:none;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:10px 18px;border-radius:9px;cursor:pointer;display:inline-flex;align-items:center;gap:6px')} hover={s('background:#2b6fe0')}>Invita</Box>
            </div>
          </div>

          {/* Membri */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;padding:20px 22px')}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 13 }}>
              <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em')}>Membri</div>
              <span style={{ fontSize: 11, fontWeight: 700, color: occupiedSlots >= MAX_MEMBERS ? '#ea580c' : '#8c867d' }}>{occupiedSlots}/{MAX_MEMBERS}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {status.members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0', borderBottom: '1px solid #f6f4f0' }}>
                  <Avatar email={m.email} url={m.avatar_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#211f1c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</div>
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 9px', borderRadius: 7, background: m.role === 'owner' ? '#eef4fe' : '#f0ede7', color: m.role === 'owner' ? ACCENT : '#8c867d', textTransform: 'uppercase', letterSpacing: '.03em' }}>{m.role === 'owner' ? 'Owner' : 'Membro'}</span>
                  {m.role !== 'owner' && (
                    <span onClick={() => setConfirm({ title: 'Rimuovere il membro?', sub: `${m.email} perderà l'accesso al team.`, danger: true, onYes: () => wrap(() => removeTeamMember(m.user_id), 'Membro rimosso') })} title="Rimuovi" style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={14} color="#cfcabf" /></span>
                  )}
                </div>
              ))}
            </div>

            {/* Inviti pending */}
            {status.pending_invites.length > 0 && (
              <>
                <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin:16px 0 9px')}>Inviti in sospeso</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {status.pending_invites.map((inv) => (
                    <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '7px 0', borderBottom: '1px solid #f6f4f0' }}>
                      <span style={{ width: 34, height: 34, borderRadius: '50%', flexShrink: 0, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="calendar" size={14} color="#b3aca1" /></span>
                      <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: '#8c867d', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{inv.email}</div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: '#b3aca1' }}>In attesa</span>
                      <span onClick={() => wrap(() => revokeInvite(inv.id), 'Invito revocato')} title="Revoca" style={{ cursor: 'pointer', display: 'flex' }}><Icon name="x" size={14} color="#cfcabf" /></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Dissolvi */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box as="button" onClick={() => setConfirm({ title: 'Sciogliere il team?', sub: 'Tutti i membri verranno rimossi e gli inviti annullati. Azione irreversibile.', danger: true, onYes: () => wrap(() => dissolveTeam(), 'Team sciolto') })} className="max-md:!w-full" style={s('border:1px solid #fca5a5;background:#fff;color:#dc2626;font-size:11.5px;font-weight:700;padding:9px 16px;border-radius:9px;cursor:pointer')} hover={{ background: '#fef2f2' }}>Sciogli team</Box>
          </div>
        </div>
      )}

      {/* ── Member view ── */}
      {status?.in_team && !isOwner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;padding:22px')}>
            <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:13px')}>Il tuo team</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
              <Avatar email={owner?.email || ''} url={owner?.avatar_url} size={41} />
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: '#211f1c' }}>{status.team_name}</div>
                <div style={{ fontSize: 12, color: '#8c867d' }}>Owner: {owner?.email || '—'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 9, padding: '11px 13px', marginTop: 16 }}>
              <Icon name="circle-check" size={14} color={ACCENT} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#1d5fd0' }}>Hai accesso Agenzia tramite il tuo team.</span>
            </div>
          </div>

          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:14px;padding:20px 22px')}>
            <div style={s('font-size:10px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:11px')}>Membri ({status.member_count})</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {status.members.map((m) => (
                <div key={m.user_id} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#faf9f7', borderRadius: 99, padding: '4px 11px 4px 4px' }}>
                  <Avatar email={m.email} url={m.avatar_url} size={23} />
                  <span style={{ fontSize: 11.5, color: '#211f1c', maxWidth: 144, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.email}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Box as="button" onClick={() => setConfirm({ title: 'Lasciare il team?', sub: 'Perderai l\'accesso Agenzia condiviso e le risorse del team.', danger: true, onYes: () => wrap(() => leaveTeam(), 'Hai lasciato il team') })} className="max-md:!w-full" style={s('border:1px solid #fdba74;background:#fff;color:#ea580c;font-size:11.5px;font-weight:700;padding:9px 16px;border-radius:9px;cursor:pointer')} hover={{ background: '#fff7ed' }}>Lascia team</Box>
          </div>
        </div>
      )}

      {/* ── Popup limite raggiunto ── */}
      {limitPopup && (
        <div onClick={() => setLimitPopup(false)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:22px')}>
          <div onClick={(e) => e.stopPropagation()} style={s('width:100%;max-width:378px;background:var(--bg-card);border-radius:16px;box-shadow:0 32px 64px rgba(20,18,15,.2);padding:25px;text-align:center')}>
            <div style={{ width: 47, height: 47, borderRadius: '50%', background: '#fff7ed', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="users" size={22} color="#ea580c" />
            </div>
            <h3 style={s('margin:0 0 5px;font-size:15px;font-weight:800')}>Limite raggiunto</h3>
            <p style={s('margin:0 0 20px;font-size:12px;color:#8c867d;line-height:1.5')}>Hai raggiunto il massimo di {MAX_MEMBERS} collaboratori.<br/>Contattaci per aggiungere altri slot al tuo team.</p>
            <div style={{ display: 'flex', gap: 9 }}>
              <Box as="button" onClick={() => setLimitPopup(false)} style={s('flex:1;border:1px solid #d8d4cb;background:#fff;color:#8c867d;font-size:13px;font-weight:700;padding:10px 0;border-radius:9px;cursor:pointer')} hover={s('background:#faf9f7')}>Chiudi</Box>
              <a href="mailto:info@getnearme.it?subject=Richiesta%20slot%20team%20extra" style={{ flex: 1, border: 'none', background: ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, cursor: 'pointer', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Contattaci</a>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale conferma ── */}
      {confirm && (
        <div onClick={() => setConfirm(null)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:22px')}>
          <div onClick={(e) => e.stopPropagation()} style={s('width:100%;max-width:378px;background:var(--bg-card);border-radius:16px;box-shadow:0 32px 64px rgba(20,18,15,.2);padding:25px;text-align:center')}>
            <div style={{ width: 47, height: 47, borderRadius: '50%', background: confirm.danger ? '#fef2f2' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name={confirm.danger ? 'alert-triangle' : 'info'} size={22} color={confirm.danger ? '#dc2626' : ACCENT} />
            </div>
            <h3 style={s('margin:0 0 5px;font-size:15px;font-weight:800')}>{confirm.title}</h3>
            <p style={s('margin:0 0 20px;font-size:12px;color:#8c867d;line-height:1.5')}>{confirm.sub}</p>
            <div style={{ display: 'flex', gap: 9 }}>
              <Box as="button" onClick={() => setConfirm(null)} style={s('flex:1;border:1px solid #d8d4cb;background:#fff;color:#8c867d;font-size:13px;font-weight:700;padding:10px 0;border-radius:9px;cursor:pointer')} hover={s('background:#faf9f7')}>Annulla</Box>
              <Box as="button" onClick={() => { const f = confirm.onYes; setConfirm(null); f(); }} style={{ flex: 1, border: 'none', background: confirm.danger ? '#dc2626' : ACCENT, color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, cursor: 'pointer' }} hover={{ background: confirm.danger ? '#b91c1c' : '#2b6fe0' }}>Conferma</Box>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

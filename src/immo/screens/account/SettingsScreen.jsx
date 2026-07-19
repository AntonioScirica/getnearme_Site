import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Toggle from '../../components/Toggle.jsx'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'

// Notifiche: SOLO via email. Ogni voce è una preferenza email; niente push/WhatsApp.
const NOTIF_AGENT = [
  ['mail', 'Nuovi lead e messaggi', 'Email appena arriva un lead o un messaggio'],
  ['digest', 'Riepilogo giornaliero', 'Un riassunto via email delle attività del giorno'],
]
const NOTIF_PRIVATO = [
  ['mail', 'Nuovi immobili in zona', 'Email quando esce un annuncio in linea con le tue ricerche'],
  ['digest', 'Riepilogo settimanale', 'Le novità della settimana via email'],
]

const LABEL = { fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2', padding: '0 2px' }
const INPUT = { marginTop: 7, width: '100%', boxSizing: 'border-box', minHeight: 46, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '0 14px', fontSize: 14.5, color: '#15181F', outline: 'none', fontFamily: 'inherit' }

// Dialog "Modifica account": nome, telefono, zona. L'email NON è modificabile (contattare l'assistenza).
function AccountEditModal({ open, onClose }) {
  const { d, updateProfile } = useApp()
  const isPrivato = d.session.persona === 'privato'
  const [name, setName] = useState(d.session.name)
  const [phone, setPhone] = useState(d.session.phone || '')
  const [zone, setZone] = useState(d.session.zone || '')
  const save = () => {
    if (!name.trim()) return
    updateProfile({ name, phone, zone })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Modifica account">
      <div style={LABEL}>Nome e cognome</div>
      <input value={name} onChange={e => setName(e.target.value)} autoFocus style={INPUT} />
      <div style={{ ...LABEL, marginTop: 14 }}>Telefono</div>
      <input value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" placeholder="+39 …" style={INPUT} />
      <div style={{ ...LABEL, marginTop: 14 }}>{isPrivato ? 'Zona di ricerca' : 'Zona operativa'}</div>
      <input value={zone} onChange={e => setZone(e.target.value)} placeholder="Es. Milano Sud-Est" style={INPUT} />

      {/* Email in sola lettura: si modifica solo tramite assistenza */}
      <div style={{ marginTop: 16, background: '#F0F3F9', border: '1px solid #E2E7F1', borderRadius: 13, padding: '12px 14px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8A91A6" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}><rect x="5" y="10.5" width="14" height="9" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
        <div style={{ fontSize: 12.5, color: '#666E82', lineHeight: 1.5 }}>
          <span style={{ fontWeight: 700, color: '#3A4152' }}>Email · {d.session.email}</span><br />
          Per modificare l'email contatta l'assistenza.
        </div>
      </div>

      <div onClick={save} className="hb" style={{ marginTop: 16, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Salva</div>
    </Modal>
  )
}

export default function SettingsScreen() {
  const { d, nav, toast, toggleSetting, isDesktop } = useApp()
  const isFree = d.plan === 'Community'
  const isPrivato = d.session.persona === 'privato'
  const [accOpen, setAccOpen] = useState(false)

  const notifList = isPrivato ? NOTIF_PRIVATO : NOTIF_AGENT
  const zoneLabel = isPrivato ? 'Zona di ricerca' : 'Zona operativa'
  const accountRows = [
    { label: 'Nome', value: d.session.name, editable: true },
    { label: 'Telefono', value: d.session.phone, editable: true },
    { label: zoneLabel, value: d.session.zone, editable: true },
    { label: 'Email', value: d.session.email, editable: false },
  ]

  const cardStyle = { margin: isDesktop ? 0 : '0 20px', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, overflow: 'hidden' }
  const sectionStyle = { padding: isDesktop ? '22px 0 8px' : '20px 20px 8px', fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2' }
  const rowPad = isDesktop ? '15px 18px' : '14px 16px'

  return (
    <div style={{ maxWidth: isDesktop ? 640 : 'none', margin: isDesktop ? '0 auto' : 0, width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 48px' : '0 0 40px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="Impostazioni" />

      {/* Banner piano AI (non per il privato: non usa crediti né abbonamento) */}
      {!isPrivato && (
        <div className="hb" onClick={() => nav('billing')} style={{ margin: isDesktop ? '14px 0 0' : '0 20px', background: 'linear-gradient(120deg,#2A1F71,#6E56F8)', borderRadius: 19, padding: isDesktop ? 18 : 16, display: 'flex', alignItems: 'center', gap: isDesktop ? 14 : 13, cursor: 'pointer' }}>
          <div style={{ width: isDesktop ? 46 : 44, height: isDesktop ? 46 : 44, borderRadius: 14, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
            <Icon d={ICONS.spark} size={isDesktop ? 22 : 21} fill="#fff" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: isDesktop ? 15 : 14.5, color: '#fff' }}>Piano {d.plan}{isFree ? ' · Gratis' : ''}</div>
            <div style={{ fontSize: isDesktop ? 12.5 : 12, color: 'rgba(255,255,255,.75)', marginTop: 1 }}>{isFree ? 'Passa a Pro AI: 100 crediti al mese e strumenti illimitati' : `${d.credits} crediti AI disponibili questo mese`}</div>
          </div>
          <div style={{ background: '#fff', color: '#4B39C8', fontSize: isDesktop ? 12.5 : 12, fontWeight: 800, borderRadius: 99, padding: isDesktop ? '9px 16px' : '8px 13px', flex: 'none' }}>{isFree ? 'Upgrade' : 'Gestisci'}</div>
        </div>
      )}

      {/* Account */}
      <div style={sectionStyle}>Account</div>
      <div style={cardStyle}>
        {accountRows.map((r, i) => (
          <div key={r.label} className="hbg2" onClick={() => (r.editable ? setAccOpen(true) : toast("Per modificare l'email contatta l'assistenza"))} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: rowPad, borderBottom: i < accountRows.length - 1 ? '1px solid #F0F3F9' : 'none', cursor: 'pointer' }}>
            <span style={{ fontWeight: 600, fontSize: 14, flex: 'none' }}>{r.label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <span style={{ fontSize: 13.5, color: '#8A91A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.value}</span>
              {r.editable
                ? <Icon d={ICONS.fwd} size={15} stroke="#979EB2" sw={2.2} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: '#B0956B', background: '#F6EFDF', borderRadius: 99, padding: '3px 9px', flex: 'none' }}>Assistenza</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Notifiche — solo via email */}
      <div style={sectionStyle}>Notifiche</div>
      <div style={{ margin: isDesktop ? '0 0 8px' : '0 20px 8px', display: 'flex', alignItems: 'center', gap: 8, padding: '0 2px' }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#8A91A6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><rect x="3.5" y="5.5" width="17" height="13" rx="2" /><path d="M4 7l8 6 8-6" /></svg>
        <div style={{ fontSize: 12.5, color: '#8A91A6', lineHeight: 1.4 }}>Le notifiche vengono inviate <b style={{ color: '#666E82' }}>solo via email</b> a {d.session.email}.</div>
      </div>
      <div style={cardStyle}>
        {notifList.map(([k, t, sub], i) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isDesktop ? '14px 18px' : '13px 16px', borderBottom: i < notifList.length - 1 ? '1px solid #F0F3F9' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{t}</div>
              <div style={{ fontSize: isDesktop ? 12 : 11.5, color: '#979EB2', marginTop: 1 }}>{sub}</div>
            </div>
            <Toggle on={!!d.setts[k]} onClick={() => toggleSetting(k)} />
          </div>
        ))}
      </div>

      {/* Altro (privacy, visibilità, lingua, assistenza) */}
      <div style={sectionStyle}>Altro</div>
      <div style={cardStyle}>
        {/* Visibilità profilo: toggle solo per agente/agenzia (il privato non appare nelle ricerche) */}
        {!isPrivato && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isDesktop ? '14px 18px' : '13px 16px', borderBottom: '1px solid #F0F3F9' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Profilo visibile</div>
              <div style={{ fontSize: isDesktop ? 12 : 11.5, color: '#979EB2', marginTop: 1 }}>Appari nelle ricerche di zona su Agente Immo</div>
            </div>
            <Toggle on={!!d.setts.vis} onClick={() => toggleSetting('vis')} />
          </div>
        )}
        <div className="hbg2" onClick={() => toast(isPrivato ? 'Gestisci la privacy del tuo account' : 'Gestisci chi può vedere i tuoi contatti')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: rowPad, borderBottom: '1px solid #F0F3F9', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Privacy</span>
          <Icon d={ICONS.fwd} size={15} stroke="#979EB2" sw={2.2} />
        </div>
        <div className="hbg2" onClick={() => toast('Altre lingue in arrivo')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: rowPad, borderBottom: '1px solid #F0F3F9', cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Lingua</span>
          <span style={{ fontSize: 13.5, color: '#8A91A6' }}>Italiano</span>
        </div>
        <div className="hbg2" onClick={() => toast('Il supporto risponde entro 24 ore')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: rowPad, cursor: 'pointer' }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>Assistenza</span>
          <Icon d={ICONS.fwd} size={15} stroke="#979EB2" sw={2.2} />
        </div>
      </div>

      {/* Uscita dall'account: azione nel Profilo */}
      <div className="hbg2" onClick={() => nav('profile')} style={{ margin: isDesktop ? '16px 0 0' : '16px 20px 0', minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, fontWeight: 700, fontSize: 14, color: '#3A4152', cursor: 'pointer' }}>
        <Icon d={ICONS.user} size={17} stroke="#3A4152" sw={1.9} />
        Vai al profilo per uscire dall'account
      </div>

      {accOpen && <AccountEditModal open onClose={() => setAccOpen(false)} />}
    </div>
  )
}

import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, STAGES } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Drawer from '../../components/Drawer.jsx'
import Placeholder from '../../components/Placeholder.jsx'

// Icone/colori per le voci extra della timeline (l.tl), per chiave k
const TL_KIND = {
  note: { d: ICONS.doc, ibg: '#F4ECD9', ic: '#8A6E24' },
  cal: { d: ICONS.cal, ibg: '#E4EDF7', ic: '#2E5C8A' },
  stage: { d: ICONS.funnel, ibg: '#EAF0FD', ic: '#3C5BAA' },
}

export default function LeadDetail() {
  const { d, ui, isDesktop, toast, closeLead, leadById, propById, openProp, openChat, setLeadStage, addLeadNote, scheduleVisit, createDeal } = useApp()
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteTxt, setNoteTxt] = useState('')

  const l = leadById(ui.selLead) || d.leads[0]
  const p = propById(l.propId)
  const ci = STAGES.indexOf(l.stage)
  const first = l.n.split(' ')[0]

  // Timeline: la richiesta è sempre presente; le voci "canned" successive appaiono solo se il lead
  // ha raggiunto quella fase (così un lead nuovo con tl vuoto non mostra risposte/visite inventate).
  const tl = [
    { t: 'Richiesta ricevuta da ' + l.src, d2: l.msg, h: l.time, d: ICONS.funnel, ibg: '#FDE9E4', ic: '#B03B22' },
    ...(ci >= STAGES.indexOf('Contattato') ? [{ t: 'Risposta inviata', d2: 'Proposta di visita in settimana', h: '12:33 · oggi', d: ICONS.chat, ibg: '#EAF0FD', ic: '#3C5BAA' }] : []),
    ...(ci >= STAGES.indexOf('Visita') ? [{ t: 'Visita pianificata', d2: 'Giovedì 23 luglio · 18:00', h: '12:40 · oggi', d: ICONS.cal, ibg: '#E4EDF7', ic: '#2E5C8A' }] : []),
    ...l.tl.map(e => ({ ...e, ...(TL_KIND[e.k] || TL_KIND.note) })),
  ]

  const saveNote = () => {
    if (!noteTxt.trim()) return
    addLeadNote(l.id, noteTxt)
    setNoteTxt('')
    setNoteOpen(false)
  }

  const hasDeal = d.deals.some(dl => dl.who === l.n)
  const goProp = () => { closeLead(); openProp(l.propId) }
  const goChat = () => { closeLead(); openChat(l.id === 2 ? 3 : 1) }
  const goDeal = () => { closeLead(); createDeal(l.id) }

  const quickActions = [
    { t: 'Chiama', d: ICONS.phone, sw: 1.9, on: () => toast('Chiamata in corso...') },
    { t: 'Messaggio', d: ICONS.chat, sw: 1.9, on: goChat },
    { t: 'Pianifica visita', d: ICONS.cal, sw: 1.8, on: () => scheduleVisit(l.id) },
  ]

  return (
    <Drawer open onClose={closeLead} width={520}>
      <div style={{ padding: isDesktop ? '20px 22px 32px' : '18px 20px 40px' }}>
        {/* Header: avatar, nome, chiudi */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: isDesktop ? 56 : 62, height: isDesktop ? 56 : 62, borderRadius: '50%', background: l.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: '#3A4152', flex: 'none' }}>{l.ini}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: '-.4px' }}>{l.n}</span>
              {l.hot && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', color: '#B03B22', background: '#FDE9E4', borderRadius: 99, padding: '3px 8px' }}>CALDO</span>}
            </div>
            <div style={{ fontSize: 12, color: '#8A91A6', marginTop: 2 }}>via {l.src} · {l.time}</div>
          </div>
          <div onClick={closeLead} className="hb" style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15181F" strokeWidth="2.1" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </div>
        </div>

        {/* Contatti: telefono e email */}
        <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
          <div onClick={() => toast('Chiamata in corso...')} className="hbg" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 12, padding: '8px 12px', cursor: 'pointer' }}>
            <Icon d={ICONS.phone} size={14} stroke="#3C5BAA" sw={1.9} />
            <span style={{ fontSize: 12.5, color: '#3A4152', fontWeight: 600 }}>{l.ph}</span>
          </div>
          <div onClick={() => toast('Bozza email pronta')} className="hbg" style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 12, padding: '8px 12px', cursor: 'pointer', minWidth: 0 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3C5BAA" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 6.5h17v11h-17v-11ZM3.5 7.5 12 13.5l8.5-6" /></svg>
            <span style={{ fontSize: 12.5, color: '#3A4152', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.mail}</span>
          </div>
        </div>

        {/* Azioni rapide */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {quickActions.map((a, i) => (
            <div key={a.t} className="hb" onClick={a.on} style={{ flex: 1, minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: i === 0 ? '#537EEC' : '#EAF0FD', color: i === 0 ? '#F4F6FA' : '#3C5BAA', borderRadius: 13, fontWeight: 700, fontSize: 12.5, cursor: 'pointer', textAlign: 'center' }}>
              <Icon d={a.d} size={16} stroke={i === 0 ? '#F4F6FA' : '#3C5BAA'} sw={a.sw} />{a.t}
            </div>
          ))}
        </div>

        {/* Fase della trattativa: un unico Select chiaro (niente più spunte sulle altre fasi) */}
        <div style={{ padding: '20px 0 8px', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Fase della trattativa</div>
        <div style={{ position: 'relative' }}>
          <select
            value={l.stage}
            onChange={e => setLeadStage(l.id, e.target.value)}
            style={{ width: '100%', minHeight: 48, appearance: 'none', WebkitAppearance: 'none', background: '#fff', border: '1.5px solid #B2C5F6', borderRadius: 14, padding: '0 42px 0 16px', fontSize: 14.5, fontWeight: 700, color: '#3C5BAA', cursor: 'pointer', outline: 'none' }}
          >
            {STAGES.map((stage, i) => (
              <option key={stage} value={stage}>{'Fase ' + (i + 1) + ' di ' + STAGES.length + ' · ' + stage}</option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon d="M6 9.5 12 15.5 18 9.5" size={16} stroke="#3C5BAA" sw={2.4} />
          </div>
        </div>
        {/* Barra di avanzamento fase */}
        <div style={{ display: 'flex', gap: 5, marginTop: 10 }}>
          {STAGES.map((stage, i) => (
            <div key={stage} style={{ flex: 1, height: 5, borderRadius: 99, background: i <= ci ? '#537EEC' : '#E6EAF3' }} />
          ))}
        </div>

        {/* Assistente AI */}
        <div style={{ margin: '14px 0 0', background: '#EFECFF', borderRadius: 16, padding: '13px 15px', display: 'flex', gap: 11, alignItems: 'flex-start' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#6E56F8" style={{ flex: 'none', marginTop: 1 }}><path d={ICONS.spark} /></svg>
          <div style={{ fontSize: 12.5, color: '#4B39C8', lineHeight: 1.5 }}><b>Assistente AI:</b> {first} ha un budget dichiarato e cerca in zona. Rispondi entro 1 ora: i lead ricontattati subito convertono il 60% in più.</div>
        </div>

        {/* Crea / vai alla trattativa */}
        <div onClick={goDeal} className="hb" style={{ margin: '12px 0 0', minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 13, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <Icon d={ICONS.doc} size={15} stroke="#3A4152" sw={1.8} />{hasDeal ? 'Vai alla trattativa' : 'Crea trattativa'}
        </div>

        {/* Immobile richiesto */}
        <div style={{ padding: '20px 0 8px', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Immobile richiesto</div>
        {p && (
          <div onClick={goProp} className="hbd" style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: 12, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
            <Placeholder label="Foto" style={{ width: 78, height: 58 }} tone={l.id % 2 === 0 ? 'warm' : 'blue'} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{p.t}</div>
              <div style={{ fontSize: 12, color: '#666E82' }}>{p.zone}</div>
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 14.5, color: '#3C5BAA' }}>{p.price}</div>
          </div>
        )}

        {/* Attività / timeline */}
        <div style={{ padding: '20px 0 8px', display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Attività</div>
          <div onClick={() => setNoteOpen(o => !o)} style={{ fontSize: 13, fontWeight: 600, color: '#537EEC', cursor: 'pointer' }}>+ Nota</div>
        </div>
        {noteOpen && (
          <div style={{ margin: '0 0 10px', display: 'flex', gap: 8 }}>
            <input value={noteTxt} onChange={e => setNoteTxt(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveNote() }} placeholder="Scrivi una nota..." autoFocus style={{ flex: 1, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '11px 14px', fontSize: 13.5, fontFamily: 'inherit', color: '#15181F', outline: 'none' }} />
            <div onClick={saveNote} className="hb" style={{ background: '#537EEC', color: '#F4F6FA', borderRadius: 13, padding: '0 16px', display: 'flex', alignItems: 'center', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Salva</div>
          </div>
        )}
        <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: '16px 16px 6px' }}>
          {tl.map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: e.ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                  <Icon d={e.d} size={14} stroke={e.ic} sw={2} />
                </div>
                <div style={{ width: 2, flex: 1, background: i < tl.length - 1 ? '#EDF0F7' : 'transparent', margin: '3px 0' }} />
              </div>
              <div style={{ paddingBottom: 16, flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{e.t}</div>
                <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 1 }}>{e.d2}</div>
                <div style={{ fontSize: 11, color: '#979EB2', marginTop: 2 }}>{e.h}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Drawer>
  )
}

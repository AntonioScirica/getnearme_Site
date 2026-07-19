import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, CONVO_TAGSTYLE } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Avatar from '../../components/Avatar.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import PageHeader from '../../components/PageHeader.jsx'

// Messaggi responsive: due pannelli affiancati ≥900px, lista O thread (ui.chatPane) sotto.
const CHIPS = ['Tutti', 'Lead', 'Network', 'Team']
const QUICK_REPLIES = ['Suggerisci risposta', 'Invia disponibilità visite', 'Allega scheda immobile']

// ---- Riga conversazione (condivisa lista mobile/desktop) ----
function ConvoRow({ c, active, isLast }) {
  const { isDesktop, openChat } = useApp()
  const [tagBg, tagCol] = CONVO_TAGSTYLE[c.tag] || CONVO_TAGSTYLE.Altro
  return (
    <div
      className={active ? '' : 'hbg2'}
      onClick={() => openChat(c.id)}
      style={{
        display: 'flex', alignItems: 'center', gap: isDesktop ? 11 : 12,
        padding: isDesktop ? '11px 10px' : '13px 15px',
        borderRadius: isDesktop ? 14 : 0,
        borderBottom: !isDesktop && !isLast ? '1px solid #F0F3F9' : 'none',
        cursor: 'pointer', background: active ? '#fff' : 'transparent',
      }}
    >
      <div style={{ width: isDesktop ? 44 : 48, height: isDesktop ? 44 : 48, borderRadius: '50%', background: c.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: isDesktop ? 13.5 : 14.5, color: '#3A4152', flex: 'none', position: 'relative' }}>
        {c.ini}
        {c.id === 1 && <span style={{ position: 'absolute', bottom: 1, right: 1, width: 11, height: 11, borderRadius: '50%', background: '#34B36B', border: '2px solid #fff' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span style={{ fontWeight: 700, fontSize: isDesktop ? 13.5 : 14.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.n}</span>
          <span style={{ background: tagBg, color: tagCol, fontSize: 9, fontWeight: 800, letterSpacing: '.05em', borderRadius: 99, padding: '2.5px 7px', textTransform: 'uppercase', flex: 'none' }}>{c.tag}</span>
          <span style={{ flex: 1 }} />
          <span style={{ fontSize: isDesktop ? 10.5 : 11, color: '#979EB2', fontWeight: 600, flex: 'none' }}>{c.time}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ flex: 1, fontSize: isDesktop ? 12 : 12.5, color: c.unread ? '#15181F' : '#8A91A6', fontWeight: c.unread ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.last}</span>
          {c.unread > 0 && (
            <span style={{ minWidth: isDesktop ? 17 : 19, height: isDesktop ? 17 : 19, borderRadius: 99, background: '#537EEC', color: '#fff', fontSize: isDesktop ? 9.5 : 10.5, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px', boxSizing: 'border-box', flex: 'none' }}>{c.unread}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ---- Pannello lista conversazioni (ricerca + chip filtro) ----
function ConvoList() {
  const { d, ui, setUi, isDesktop, toast } = useApp()
  const [q, setQ] = useState('')
  const filter = ui.msgFilter || 'Tutti'
  const convos = d.convos.filter(c => (filter === 'Tutti' || c.tag === filter) && c.n.toLowerCase().includes(q.trim().toLowerCase()))
  const selId = (d.convos.find(c => c.id === ui.selChat) || d.convos[0] || {}).id

  const searchBox = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 11, padding: '9px 12px' }}>
      <Icon d={ICONS.search} size={15} stroke="#979EB2" sw={1.9} />
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca conversazioni" style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: '#15181F', outline: 'none', fontFamily: 'inherit', minWidth: 0 }} />
    </div>
  )

  const chips = (
    <div className="no-scrollbar" style={{ display: 'flex', gap: 8, padding: isDesktop ? '10px 18px 4px' : '12px 20px 4px', overflowX: 'auto', flex: 'none' }}>
      {CHIPS.map(t => {
        const a = filter === t
        return (
          <div key={t} onClick={() => setUi({ msgFilter: t })} style={{ flex: 'none', padding: '9px 15px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: a ? '#15181F' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #15181F' : '1px solid #DFE4EF' }}>{t}</div>
        )
      })}
    </div>
  )

  const empty = !convos.length && (
    <div style={{ padding: '26px 20px', textAlign: 'center', fontSize: 13, color: '#8A91A6', fontWeight: 600 }}>Nessuna conversazione in questo filtro.</div>
  )

  if (isDesktop) {
    return (
      <div style={{ width: 320, flex: 'none', borderRight: '1px solid #E6EAF3', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ padding: '20px 18px 0', flex: 'none' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 21, letterSpacing: '-.5px' }}>Messaggi</div>
          <div style={{ marginTop: 10 }}>{searchBox}</div>
        </div>
        {chips}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 10px 16px', minHeight: 0 }}>
          {convos.map(c => <ConvoRow key={c.id} c={c} active={c.id === selId} isLast />)}
          {empty}
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: '12px 0 40px' }}>
      <PageHeader
        title="Messaggi"
        onBack={null}
        right={
          <div onClick={() => toast('Nuovo messaggio: scegli un contatto dal CRM')} style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <Icon d={ICONS.pencil} size={19} sw={1.9} />
          </div>
        }
      />
      <div style={{ padding: '0 20px' }}>{searchBox}</div>
      {chips}
      <div style={{ margin: '8px 20px 0', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 19, overflow: 'hidden' }}>
        {convos.map((c, i) => <ConvoRow key={c.id} c={c} active={false} isLast={i === convos.length - 1} />)}
        {empty}
      </div>
    </div>
  )
}

// ---- Pannello thread (bolle, card immobile, quick replies, composer) ----
function ChatThread() {
  const { d, ui, setUi, toast, propById, openProp, openLead, openAuthor, sendMessage, draftReply, isDesktop } = useApp()
  const selC = d.convos.find(c => c.id === ui.selChat) || d.convos[0]
  const msgs = selC ? d.threads[selC.id] || [] : []
  const scrollEl = useRef(null)

  // Immobile collegato alla conversazione (dal lead con lo stesso nome, come in DMessages)
  const lead = selC ? d.leads.find(l => l.n === selC.n) : null
  const linkedProp = lead ? propById(lead.propId) : null

  // Auto-scroll in fondo quando cambiano chat o messaggi
  useEffect(() => {
    if (scrollEl.current) scrollEl.current.scrollTop = scrollEl.current.scrollHeight
  }, [selC && selC.id, msgs.length])

  if (!selC) {
    return <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#8A91A6', fontWeight: 600, background: '#F8FAFD' }}>Nessuna conversazione selezionata</div>
  }

  const send = () => sendMessage(selC.id, ui.chatInput)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, background: '#F8FAFD', height: isDesktop ? 'auto' : '100%', boxSizing: 'border-box' }}>
      {/* Header thread */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 12 : 11, padding: isDesktop ? '14px 22px' : '12px 14px 10px', borderBottom: isDesktop ? '1px solid #E6EAF3' : '1px solid #E8EBF4', background: isDesktop ? '#F4F6FA' : 'rgba(255,255,255,.92)', backdropFilter: isDesktop ? 'none' : 'blur(10px)', flex: 'none', zIndex: 10 }}>
        {!isDesktop && (
          <div onClick={() => setUi({ chatPane: false })} style={{ width: 42, height: 42, borderRadius: 13, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <Icon d={ICONS.back} size={19} sw={2} />
          </div>
        )}
        {/* Header cliccabile: apre la scheda del cliente (lead) o il profilo del contatto */}
        <div
          onClick={() => (lead ? openLead(lead.id) : openAuthor({ n: selC.n, ini: selC.ini, c: selC.c, role: selC.tag === 'Team' ? 'Team' : selC.tag === 'Network' ? 'Agente' : 'Contatto' }))}
          style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 12 : 11, flex: 1, minWidth: 0, cursor: 'pointer' }}
        >
          <Avatar ini={selC.ini} c={selC.c} size={42} fs={13.5} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{selC.n}</span>
              <Icon d={ICONS.fwd} size={14} stroke="#C6CEE0" sw={2.4} />
            </div>
            <div style={{ fontSize: isDesktop ? 11.5 : 11, color: '#34B36B', fontWeight: 700 }}>● online ora</div>
          </div>
        </div>
        {isDesktop && linkedProp && (
          <div className="hsh" onClick={() => openProp(linkedProp.id)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 99, padding: '7px 13px', cursor: 'pointer', flex: 'none' }}>
            <Icon d={ICONS.build} size={13} stroke="#3C5BAA" sw={1.9} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3C5BAA' }}>{linkedProp.t}</span>
          </div>
        )}
        <div className="hb" onClick={() => toast('Chiamata in corso...')} style={{ width: isDesktop ? 40 : 42, height: isDesktop ? 40 : 42, borderRadius: isDesktop ? 12 : 13, background: '#EAF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
          <Icon d={ICONS.phone} size={isDesktop ? 16 : 17} stroke="#3C5BAA" sw={1.9} />
        </div>
      </div>

      {/* Messaggi */}
      <div ref={scrollEl} className="no-scrollbar" style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: isDesktop ? '20px 26px 8px' : '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: isDesktop ? 10 : 9 }}>
        <div style={{ alignSelf: 'center', background: '#E6EAF3', color: '#8A91A6', fontSize: 10.5, fontWeight: 700, borderRadius: 99, padding: '4px 12px', flex: 'none' }}>Oggi</div>
        {msgs.map((m, i) => {
          const p = m.prop ? propById(m.prop) : null
          return (
            <div key={selC.id + '-' + i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.me ? 'flex-end' : 'flex-start', flex: 'none' }}>
              {p && (
                <div className="hsh" onClick={() => openProp(p.id)} style={{ width: isDesktop ? 280 : 236, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 14px rgba(24,29,26,.06)' }}>
                  <div style={{ height: isDesktop ? 120 : 104 }}>
                    <Placeholder label="Scheda immobile" shape="rect" tone={isDesktop ? 'blue' : 'warm'} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                  </div>
                  <div style={{ padding: isDesktop ? '11px 13px' : '10px 12px' }}>
                    <div style={{ fontWeight: 700, fontSize: isDesktop ? 13 : 12.5 }}>{p.t}</div>
                    <div style={{ fontSize: isDesktop ? 11.5 : 11, color: '#666E82', marginTop: 1 }}>{p.zone}</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 15 : 14, color: '#3C5BAA', marginTop: 4 }}>{p.price}</div>
                  </div>
                </div>
              )}
              {m.t && (
                <div style={{ maxWidth: isDesktop ? '56%' : '78%', background: m.me ? '#537EEC' : '#fff', color: m.me ? '#F4F6FA' : '#15181F', borderRadius: m.me ? '18px 18px 5px 18px' : '18px 18px 18px 5px', padding: isDesktop ? '11px 15px' : '11px 14px', fontSize: 14, lineHeight: isDesktop ? 1.5 : 1.45, boxShadow: '0 2px 8px rgba(24,29,26,.05)' }}>
                  {m.who && <div style={{ fontSize: 10.5, fontWeight: 800, color: '#4B39C8', marginBottom: 2 }}>{m.who}</div>}
                  {m.t}
                </div>
              )}
              <div style={{ fontSize: 10, color: '#979EB2', marginTop: 3, padding: '0 4px' }}>{m.h}</div>
            </div>
          )
        })}
      </div>

      {/* Quick replies AI */}
      <div className="no-scrollbar" style={{ padding: isDesktop ? '8px 26px 6px' : '8px 16px 6px', display: 'flex', gap: 7, overflowX: 'auto', flex: 'none' }}>
        {QUICK_REPLIES.map(t => (
          <div key={t} className="hb" onClick={() => draftReply(selC.id)} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 6, background: '#EFECFF', border: '1px solid #DDD4FA', borderRadius: 99, padding: '8px 13px', cursor: 'pointer' }}>
            <Icon d={ICONS.spark} size={12} fill="#6E56F8" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#4B39C8' }}>{t}</span>
          </div>
        ))}
      </div>

      {/* Composer */}
      <div style={{ padding: isDesktop ? '6px 26px 20px' : '6px 16px 24px', display: 'flex', gap: isDesktop ? 10 : 9, alignItems: 'center', flex: 'none' }}>
        {!isDesktop && (
          <div onClick={() => toast('Allega: foto, scheda immobile o documento')} style={{ width: 44, height: 44, borderRadius: '50%', background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <Icon d={ICONS.plus} size={19} stroke="#5B6376" sw={1.9} />
          </div>
        )}
        <input
          value={ui.chatInput}
          onChange={e => setUi({ chatInput: e.target.value })}
          onKeyDown={e => { if (e.key === 'Enter') send() }}
          placeholder="Scrivi un messaggio..."
          style={{ flex: 1, minWidth: 0, minHeight: isDesktop ? 46 : 44, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 99, padding: '0 17px', fontSize: 14, outline: 'none', color: '#15181F', fontFamily: 'inherit' }}
        />
        <div className="hb" onClick={send} style={{ width: isDesktop ? 46 : 44, height: isDesktop ? 46 : 44, borderRadius: '50%', background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F4F6FA" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20.5 3.5 11 13M20.5 3.5l-6.2 17-3.8-7.5L3 9.7l17.5-6.2Z" /></svg>
        </div>
      </div>
    </div>
  )
}

export default function MessagesScreen() {
  const { ui, isDesktop } = useApp()

  if (isDesktop) {
    // Due pannelli affiancati a piena altezza: il contenitore della shell ha già overflowY auto,
    // qui basta riempirlo (height 100%) e far scrollare i pannelli internamente.
    return (
      <div style={{ height: '100%', display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        <ConvoList />
        <ChatThread />
      </div>
    )
  }

  return ui.chatPane ? <ChatThread /> : <ConvoList />
}

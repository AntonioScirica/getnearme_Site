import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, SRCSTYLE, STAGES, STAGECOLS, DEAL_STAGES, DEAL_STAGE_META, CONTACT_TAGSTYLE } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Avatar from '../../components/Avatar.jsx'
import Modal from '../../components/Modal.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import EmptyState from '../../components/EmptyState.jsx'

const CRM_TABS = [['contatti', 'Contatti'], ['lead', 'Lead'], ['trattative', 'Trattative']]
const CONTACT_TAGS = ['Compratore', 'Venditrice', 'Inquilino', 'Investitrice', 'Professionista']

// Stili condivisi dai form (Nuovo/Modifica contatto, Nuovo lead)
const inputStyle = { boxSizing: 'border-box', width: '100%', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 14, padding: '13px 15px', fontSize: 14.5, fontFamily: 'inherit', color: '#15181F', outline: 'none' }
const selectStyle = { ...inputStyle, minHeight: 48, padding: '0 14px', appearance: 'none', WebkitAppearance: 'none', fontWeight: 600, cursor: 'pointer' }
const fieldLabel = { marginTop: 12, fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2', padding: '0 6px' }
const num = s => Number(String(s).replace(/[^\d]/g, '')) || 0
const fmtEuro = v => v >= 1e6 ? '€ ' + (v / 1e6).toFixed(2).replace('.', ',') + 'M' : v >= 1000 ? '€ ' + Math.round(v / 1000) + 'K' : '€ ' + v

export default function CrmScreen() {
  const { d, ui, setUi, isDesktop, toast, openLead, openDeal, propById } = useApp()
  const [search, setSearch] = useState('')

  const hasClosed = d.leads.some(l => l.stage === 'Chiuso')
  const cols = hasClosed ? STAGES : STAGES.slice(0, 4)
  const stageChips = STAGES.slice(0, 4).map(t => ({ t, n: d.leads.filter(l => l.stage === t).length, c: STAGECOLS[t] }))
  const q = search.trim().toLowerCase()
  const contacts = d.contacts.filter(c => !q || (c.n + ' ' + c.ph + ' ' + (c.mail || '')).toLowerCase().includes(q))

  // Card KPI trattative calcolate da d.deals (In corso = non ancora al rogito, Chiuse = al rogito)
  const inCorso = d.deals.filter(x => x.stage !== 'Rogito').reduce((a, x) => a + num(x.val), 0)
  const chiuse = d.deals.filter(x => x.stage === 'Rogito').reduce((a, x) => a + num(x.val), 0)
  const dealStats = [['In corso', fmtEuro(inCorso), '#15181F'], ['Chiuse nel 2026', fmtEuro(chiuse), '#3C5BAA'], ['Provvigioni stimate', fmtEuro(Math.round((inCorso + chiuse) * 0.03)), '#15181F']]

  // Azione del pulsante "Aggiungi" contestuale alla tab attiva
  const addAction = ui.crmTab === 'contatti'
    ? { label: 'Aggiungi contatto', on: () => setUi({ addContactOpen: true }) }
    : ui.crmTab === 'trattative'
      ? { label: 'Nuova trattativa', on: () => setUi({ dealPickerOpen: true }) }
      : { label: 'Aggiungi lead', on: () => setUi({ addLeadOpen: true, addLeadStage: null }) }

  const addBtn = (
    <div className="hb" onClick={addAction.on} style={{ display: 'flex', alignItems: 'center', gap: 6, background: isDesktop ? '#537EEC' : '#fff', color: isDesktop ? '#F4F6FA' : '#15181F', border: isDesktop ? 'none' : '1px solid #DFE4EF', borderRadius: isDesktop ? 11 : 99, padding: isDesktop ? '10px 16px' : '11px 15px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 'none', whiteSpace: 'nowrap' }}>
      <Icon d={ICONS.plus} size={15} stroke={isDesktop ? '#F4F6FA' : '#15181F'} sw={2.4} />{addAction.label}
    </div>
  )

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 48px' : '0 0 118px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="CRM" onBack={null} right={addBtn} />

      {/* Tab Lead / Contatti / Trattative */}
      <div style={{ margin: isDesktop ? '14px 0 0' : '0 20px', display: 'flex', background: '#E6EAF3', borderRadius: isDesktop ? 12 : 14, padding: isDesktop ? 3 : 4, width: isDesktop ? 'fit-content' : 'auto' }}>
        {CRM_TABS.map(([id, t]) => {
          const a = ui.crmTab === id
          return (
            <div key={id} onClick={() => setUi({ crmTab: id })} style={isDesktop
              ? { padding: '8px 16px', borderRadius: 9, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: a ? '#fff' : 'transparent', color: a ? '#15181F' : '#666E82', boxShadow: a ? '0 2px 8px rgba(24,29,26,.08)' : 'none' }
              : { flex: 1, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: a ? '#fff' : 'transparent', color: a ? '#15181F' : '#666E82', boxShadow: a ? '0 3px 10px rgba(24,29,26,.1)' : 'none' }}>{t}</div>
          )
        })}
      </div>

      {/* Legenda: cosa sono le tre sezioni */}
      <div style={{ margin: isDesktop ? '10px 0 0' : '10px 20px 0', fontSize: 12, color: '#8A91A6', lineHeight: 1.5 }}>
        <b style={{ color: '#666E82' }}>Contatti</b> = la tua rubrica · <b style={{ color: '#666E82' }}>Lead</b> = richieste in arrivo · <b style={{ color: '#666E82' }}>Trattative</b> = affari aperti
      </div>

      {/* ---- Lead: kanban su tutti i breakpoint ---- */}
      {ui.crmTab === 'lead' && (
        d.leads.length === 0 ? (
          <div style={{ margin: isDesktop ? '18px 0 0' : '14px 20px 0' }}>
            <EmptyState icon={ICONS.funnel} title="Ancora nessun lead" sub="I lead sono le richieste in arrivo dai portali, dal tuo profilo e dal passaparola. Aggiungine uno per iniziare a seguirlo nella pipeline." cta="Aggiungi lead" onCta={() => setUi({ addLeadOpen: true, addLeadStage: null })} />
          </div>
        ) : (
          <>
            {!isDesktop && (
              <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '14px 20px 0' }}>
                {stageChips.map(s => (
                  <div key={s.t} style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '9px 13px' }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.c }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{s.t}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 800, color: '#979EB2' }}>{s.n}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="no-scrollbar" style={{ display: 'flex', gap: 14, overflowX: 'auto', alignItems: 'flex-start', marginTop: isDesktop ? 18 : 12, padding: isDesktop ? 0 : '0 20px 8px' }}>
              {cols.map(stage => {
                const leads = d.leads.filter(l => l.stage === stage)
                return (
                  <div key={stage} style={{ flex: '0 0 270px', background: '#EDF0F7', borderRadius: 18, padding: 10, minHeight: 200, boxSizing: 'border-box' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px 10px' }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: STAGECOLS[stage] }} />
                      <span style={{ fontSize: 12.5, fontWeight: 800, letterSpacing: '.03em' }}>{stage}</span>
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#979EB2', background: '#fff', borderRadius: 99, padding: '2px 8px' }}>{leads.length}</span>
                      <div style={{ flex: 1 }} />
                      <span onClick={() => setUi({ addLeadOpen: true, addLeadStage: stage })} title={'Aggiungi lead in ' + stage} style={{ color: '#979EB2', fontWeight: 800, cursor: 'pointer', fontSize: 16, lineHeight: 1 }}>+</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                      {leads.map(l => {
                        const p = propById(l.propId)
                        const [srcBg, srcCol] = SRCSTYLE[l.src] || ['#EDF0F7', '#5B6376']
                        return (
                          <div key={l.id} className="hsh" onClick={() => openLead(l.id)} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '12px 13px', cursor: 'pointer' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                              <Avatar ini={l.ini} c={l.c} size={34} fs={11.5} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13 }}>{l.n}</span>
                                  {l.hot && <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', color: '#B03B22', background: '#FDE9E4', borderRadius: 99, padding: '2.5px 7px', flex: 'none' }}>CALDO</span>}
                                </div>
                                <div style={{ fontSize: 11, color: '#8A91A6' }}>{l.time}</div>
                              </div>
                            </div>
                            <div style={{ marginTop: 9, fontSize: 12, color: '#3A4152', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{l.msg}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                              <div style={{ background: srcBg, color: srcCol, fontSize: 9.5, fontWeight: 800, borderRadius: 99, padding: '3px 8px', flex: 'none' }}>{l.src}</div>
                              <div style={{ flex: 1, fontSize: 11, color: '#979EB2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p ? p.t : ''}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )
      )}

      {/* ---- Contatti ---- */}
      {ui.crmTab === 'contatti' && (
        <>
          {d.contacts.length === 0 ? (
            <div style={{ margin: isDesktop ? '18px 0 0' : '14px 20px 0' }}>
              <EmptyState icon={ICONS.users} title="Nessun contatto" sub="La rubrica è vuota. Aggiungi il tuo primo contatto: ogni nuovo lead ne crea uno automaticamente." cta="Aggiungi contatto" onCta={() => setUi({ addContactOpen: true })} />
            </div>
          ) : (
            <>
              <div style={{ margin: isDesktop ? '18px 0 0' : '14px 20px 0', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '12px 15px', maxWidth: isDesktop ? 420 : 'none' }}>
                <Icon d={ICONS.search} size={18} stroke="#979EB2" sw={1.9} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder={'Cerca tra ' + d.contacts.length + ' contatti...'} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#15181F', fontFamily: 'inherit' }} />
              </div>

              <div style={{ margin: isDesktop ? '14px 0 0' : '12px 20px 0', background: '#fff', border: '1px solid #DFE4EF', borderRadius: isDesktop ? 20 : 18, overflow: 'hidden' }}>
                {isDesktop && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.8fr 1fr 44px', gap: 12, padding: '12px 18px', background: '#F8FAFD', borderBottom: '1px solid #E6EAF3', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>
                    <span>Contatto</span><span>Telefono</span><span>Email</span><span>Tipo</span><span></span>
                  </div>
                )}
                {contacts.map((c, i) => {
                  const [tagBg, tagCol] = CONTACT_TAGSTYLE[c.tag] || ['#EDF0F7', '#3A4152']
                  const open = () => setUi({ editContact: c })
                  if (isDesktop) return (
                    <div key={c.n} className="hbg2" onClick={open} style={{ display: 'grid', gridTemplateColumns: '2fr 1.4fr 1.8fr 1fr 44px', gap: 12, padding: '12px 18px', borderBottom: i < contacts.length - 1 ? '1px solid #F0F3F9' : 'none', alignItems: 'center', cursor: 'pointer' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                        <Avatar ini={c.ini} c={c.c} size={38} fs={12} />
                        <span style={{ fontWeight: 700, fontSize: 13.5 }}>{c.n}</span>
                      </div>
                      <span style={{ fontSize: 13, color: '#3A4152' }}>{c.ph}</span>
                      <span style={{ fontSize: 13, color: '#3A4152', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.mail}</span>
                      <div><span style={{ background: tagBg, color: tagCol, fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '4px 10px' }}>{c.tag}</span></div>
                      <div className="hb" onClick={e => { e.stopPropagation(); toast('Chiamata in corso...') }} style={{ width: 34, height: 34, borderRadius: 10, background: '#EAF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Icon d={ICONS.phone} size={15} stroke="#3C5BAA" sw={1.9} />
                      </div>
                    </div>
                  )
                  return (
                    <div key={c.n} onClick={open} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 15px', borderBottom: i < contacts.length - 1 ? '1px solid #F0F3F9' : 'none', cursor: 'pointer' }}>
                      <Avatar ini={c.ini} c={c.c} size={42} fs={13} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{c.n}</div>
                        <div style={{ fontSize: 12, color: '#8A91A6', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.ph}{c.mail && c.mail !== '—' ? ' · ' + c.mail : ''}</div>
                      </div>
                      <div style={{ background: tagBg, color: tagCol, fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '4px 10px', flex: 'none' }}>{c.tag}</div>
                    </div>
                  )
                })}
                {contacts.length === 0 && <div style={{ padding: '18px 15px', fontSize: 13, color: '#8A91A6', textAlign: 'center' }}>Nessun contatto trovato</div>}
              </div>

              <div onClick={() => toast('Importazione contatti in arrivo')} style={{ margin: isDesktop ? '14px 0 0' : '12px 20px 0', display: 'flex', gap: 10, alignItems: 'center', background: '#E4EDF7', borderRadius: 14, padding: '12px 14px', cursor: 'pointer' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E5C8A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14.5V3.5M8 7l4-3.5L16 7M5 11.5v8h14v-8" /></svg>
                <div style={{ fontSize: 12.5, color: '#2E5C8A', fontWeight: 500 }}>Importa da rubrica, CSV o dal tuo vecchio gestionale.</div>
              </div>
            </>
          )}
        </>
      )}

      {/* ---- Trattative ---- */}
      {ui.crmTab === 'trattative' && (
        <>
          <div style={{ display: 'flex', gap: isDesktop ? 14 : 9, flexWrap: 'wrap', margin: isDesktop ? '18px 0 0' : '14px 20px 0' }}>
            {dealStats.map(([t, v, col]) => (
              <div key={t} style={{ flex: 1, minWidth: 140, background: '#fff', border: '1px solid #DFE4EF', borderRadius: isDesktop ? 18 : 16, padding: isDesktop ? 16 : '12px 13px' }}>
                <div style={{ fontSize: isDesktop ? 12 : 11, color: '#8A91A6', fontWeight: 700 }}>{t}</div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 26 : 21, marginTop: isDesktop ? 3 : 2, color: col }}>{v}</div>
              </div>
            ))}
          </div>
          {d.deals.length === 0 ? (
            <div style={{ margin: isDesktop ? '14px 0 0' : '12px 20px 0' }}>
              <EmptyState icon={ICONS.doc} title="Nessuna trattativa aperta" sub="Le trattative nascono da un lead: promuovine uno per seguirlo dalla proposta fino al rogito." cta="Apri una trattativa" onCta={() => setUi({ dealPickerOpen: true })} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(340px,100%),1fr))', gap: isDesktop ? 14 : 10, margin: isDesktop ? '14px 0 0' : '12px 20px 0' }}>
              {d.deals.map(dl => {
                const meta = DEAL_STAGE_META[dl.stage] || { pct: dl.pct, col: dl.col }
                return (
                  <div key={dl.id} className="hsh hbd" onClick={() => openDeal(dl.id)} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: isDesktop ? 18 : 17, padding: isDesktop ? 16 : '14px 15px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>{dl.t}</div>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 16 : 15.5, color: '#3C5BAA' }}>{dl.val}</div>
                    </div>
                    <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 2 }}>con {dl.who} · {dl.note}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: isDesktop ? 12 : 11 }}>
                      <div style={{ flex: 1, height: 7, borderRadius: 99, background: '#EDF0F7', overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 99, background: meta.col, width: meta.pct + '%' }} />
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: meta.col }}>{dl.stage}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 5, marginTop: 9, fontSize: 10.5, fontWeight: 700, color: '#979EB2', flexWrap: 'wrap' }}>
                      {DEAL_STAGES.map((s, i) => (
                        <span key={s} style={{ display: 'flex', gap: 5 }}>
                          <span style={{ color: s === dl.stage ? meta.col : '#979EB2', fontWeight: s === dl.stage ? 800 : 700 }}>{s}</span>
                          {i < DEAL_STAGES.length - 1 && <span style={{ color: '#C6CEE0' }}>→</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {(!!ui.addContactOpen || !!ui.editContact) && <ContactModal />}
      {ui.addLeadOpen && <AddLeadModal />}
      {ui.dealPickerOpen && <DealPickerModal />}
    </div>
  )
}

// Form "Nuovo contatto" / "Modifica contatto" nel Modal condiviso.
// In modalità modifica (ui.editContact) pre-compila i campi, permette di eliminare e mostra
// il link al lead collegato se esiste (join per nome).
function ContactModal() {
  const { d, ui, setUi, toast, addContact, updateContact, deleteContact, openLead } = useApp()
  const editing = ui.editContact
  const clean = v => (v && v !== '—') ? v : ''
  const [n, setN] = useState(editing ? editing.n : '')
  const [ph, setPh] = useState(editing ? clean(editing.ph) : '')
  const [mail, setMail] = useState(editing ? clean(editing.mail) : '')
  const [tag, setTag] = useState(editing ? editing.tag : 'Compratore')

  const close = () => setUi(editing ? { editContact: null } : { addContactOpen: false })
  const linkedLead = editing ? d.leads.find(l => l.n === editing.n) : null

  const save = () => {
    if (!n.trim()) { toast('Inserisci almeno il nome'); return }
    const payload = { n: n.trim(), ph: ph.trim() || '—', mail: mail.trim() || '—', tag }
    if (editing) updateContact(editing.n, payload)
    else { addContact(payload); setN(''); setPh(''); setMail(''); setTag('Compratore') }
  }

  return (
    <Modal open onClose={close} title={editing ? 'Modifica contatto' : 'Nuovo contatto'}>
      {!editing && <div style={{ fontSize: 12.5, color: '#8A91A6', padding: '0 6px' }}>Nome, telefono ed email: il resto lo aggiungi dopo.</div>}
      <div style={{ marginTop: editing ? 2 : 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={n} onChange={e => setN(e.target.value)} placeholder="Nome e cognome" autoFocus={!editing} style={inputStyle} />
        <input value={ph} onChange={e => setPh(e.target.value)} placeholder="Telefono" type="tel" style={inputStyle} />
        <input value={mail} onChange={e => setMail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
      </div>
      <div style={fieldLabel}>Tipo di contatto</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {CONTACT_TAGS.map(t => {
          const sel = tag === t
          const [bg, col] = CONTACT_TAGSTYLE[t] || ['#EDF0F7', '#3A4152']
          return (
            <div key={t} onClick={() => setTag(t)} style={{ background: sel ? bg : '#fff', color: sel ? col : '#666E82', border: sel ? '1.5px solid ' + col : '1px solid #DFE4EF', borderRadius: 99, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{t}</div>
          )
        })}
      </div>
      {linkedLead && (
        <div onClick={() => { setUi({ editContact: null }); openLead(linkedLead.id) }} className="hbg" style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 9, background: '#EAF0FD', borderRadius: 12, padding: '11px 13px', cursor: 'pointer' }}>
          <Icon d={ICONS.funnel} size={15} stroke="#3C5BAA" sw={1.9} />
          <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: '#3C5BAA' }}>Apri lead collegato · fase {linkedLead.stage}</span>
          <Icon d={ICONS.fwd} size={15} stroke="#3C5BAA" sw={2.2} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {editing && (
          <div onClick={() => deleteContact(editing.n)} className="hb" style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #F0C9BE', borderRadius: 15, cursor: 'pointer', padding: '0 18px', flex: 'none' }}>
            <Icon d={ICONS.trash} size={17} stroke="#B03B22" sw={1.9} />
          </div>
        )}
        <div onClick={save} className="hb" style={{ flex: 1, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{editing ? 'Salva modifiche' : 'Salva contatto'}</div>
      </div>
    </Modal>
  )
}

// Form "Nuovo lead": crea un lead nella pipeline (e il contatto abbinato in rubrica).
function AddLeadModal() {
  const { d, ui, setUi, toast, addLead } = useApp()
  const [n, setN] = useState('')
  const [ph, setPh] = useState('')
  const [mail, setMail] = useState('')
  const [tag, setTag] = useState('Compratore')
  const [stage, setStage] = useState(ui.addLeadStage || 'Nuovo')
  const [propId, setPropId] = useState('')

  const close = () => setUi({ addLeadOpen: false, addLeadStage: null })
  const save = () => {
    if (!n.trim()) { toast('Inserisci almeno il nome'); return }
    addLead({ n: n.trim(), ph: ph.trim(), mail: mail.trim(), tag, stage, propId: propId ? Number(propId) : null })
  }

  return (
    <Modal open onClose={close} title="Nuovo lead">
      <div style={{ fontSize: 12.5, color: '#8A91A6', padding: '0 6px' }}>Un lead è una richiesta da seguire. Lo aggiungo anche alla rubrica contatti.</div>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input value={n} onChange={e => setN(e.target.value)} placeholder="Nome e cognome" autoFocus style={inputStyle} />
        <input value={ph} onChange={e => setPh(e.target.value)} placeholder="Telefono" type="tel" style={inputStyle} />
        <input value={mail} onChange={e => setMail(e.target.value)} placeholder="Email" type="email" style={inputStyle} />
      </div>
      <div style={fieldLabel}>Fase</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {STAGES.slice(0, 4).map(s => {
          const sel = stage === s
          return <div key={s} onClick={() => setStage(s)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: sel ? '#EAF0FD' : '#fff', color: sel ? '#15181F' : '#666E82', border: sel ? '1.5px solid ' + STAGECOLS[s] : '1px solid #DFE4EF', borderRadius: 99, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: STAGECOLS[s] }} />{s}</div>
        })}
      </div>
      <div style={fieldLabel}>Tipo di contatto</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {CONTACT_TAGS.map(t => {
          const sel = tag === t
          const [bg, col] = CONTACT_TAGSTYLE[t] || ['#EDF0F7', '#3A4152']
          return <div key={t} onClick={() => setTag(t)} style={{ background: sel ? bg : '#fff', color: sel ? col : '#666E82', border: sel ? '1.5px solid ' + col : '1px solid #DFE4EF', borderRadius: 99, padding: '8px 13px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>{t}</div>
        })}
      </div>
      <div style={fieldLabel}>Immobile richiesto (opzionale)</div>
      <div style={{ position: 'relative', marginTop: 8 }}>
        <select value={propId} onChange={e => setPropId(e.target.value)} style={selectStyle}>
          <option value="">Nessun immobile</option>
          {d.props.map(p => <option key={p.id} value={p.id}>{p.t} · {p.zone.split(' · ')[0]}</option>)}
        </select>
        <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon d="M6 9.5 12 15.5 18 9.5" size={16} stroke="#8A91A6" sw={2.4} />
        </div>
      </div>
      <div onClick={save} className="hb" style={{ marginTop: 18, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Salva lead</div>
    </Modal>
  )
}

// Selettore lead per creare una trattativa (mirror di PropertyPickerModal).
function DealPickerModal() {
  const { d, setUi, createDeal } = useApp()
  const close = () => setUi({ dealPickerOpen: false })
  const pick = id => { setUi({ dealPickerOpen: false }); createDeal(id) }

  return (
    <Modal open onClose={close} title="Nuova trattativa">
      <div style={{ fontSize: 12.5, color: '#8A91A6', padding: '0 6px' }}>Scegli il lead da promuovere: la trattativa parte dalla fase Proposta.</div>
      {d.leads.length === 0 ? (
        <div style={{ marginTop: 12 }}>
          <EmptyState icon={ICONS.funnel} title="Nessun lead disponibile" sub="Le trattative nascono da un lead. Aggiungine prima uno al CRM." cta="Aggiungi lead" onCta={() => setUi({ dealPickerOpen: false, addLeadOpen: true })} />
        </div>
      ) : (
        <div className="no-scrollbar" style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {d.leads.map(l => {
            const has = d.deals.some(dl => dl.who === l.n)
            return (
              <div key={l.id} onClick={() => pick(l.id)} className="hbd" style={{ display: 'flex', gap: 11, alignItems: 'center', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
                <Avatar ini={l.ini} c={l.c} size={38} fs={12} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.n}</div>
                  <div style={{ fontSize: 12, color: '#8A91A6' }}>Fase CRM: {l.stage}{has ? ' · trattativa già aperta' : ''}</div>
                </div>
                <Icon d={ICONS.fwd} size={16} stroke="#979EB2" sw={2.2} />
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

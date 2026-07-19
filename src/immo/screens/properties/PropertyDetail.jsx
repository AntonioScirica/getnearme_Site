import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, TAGSTYLE } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import Drawer from '../../components/Drawer.jsx'
import EditPropertyModal from './EditPropertyModal.jsx'

const TONES = ['blue', 'warm', 'grey']

// Montato dalla shell quando ui.propOpen (non è una route).
export default function PropertyDetail() {
  const { d, ui, nav, toast, propById, openLead, publishProp, closeProp, toggleSaveProp } = useApp()
  const p = propById(ui.selProp) || d.props[0]
  const isPrivato = d.session.persona === 'privato'
  const [editOpen, setEditOpen] = useState(false)
  const savedP = !!d.savedProps[p.id]
  const [tagBg, tagCol] = TAGSTYLE[p.tag] || ['#EDF0F7', '#3A4152']
  const saves = Math.round(p.views / 18)
  const pLeads = d.leads.filter(l => l.propId === p.id)
  const isDraft = p.tag === 'Bozza'
  const cta = isDraft ? 'Pubblica annuncio' : 'Condividi annuncio'
  const onCta = () => (isDraft ? publishProp(p.id) : toast('Link copiato negli appunti'))

  const goLead = l => { closeProp(); openLead(l.id) }
  const goCopy = () => { closeProp(); nav('copyai') }
  const goStaging = () => { closeProp(); nav('staging') }
  const goReel = () => { closeProp(); nav('videoai') }
  const goCrm = () => { closeProp(); nav('crm') }
  const goAiStudio = () => { closeProp(); nav('aistudio') }
  const goComposer = () => { closeProp(); nav('composer') }

  return (
    <Drawer open onClose={closeProp} width={560}>
      <div style={{ height: 280, position: 'relative' }}>
        <Placeholder label={`Foto principale · ${p.t}`} tone={TONES[p.id % TONES.length]} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        <div onClick={closeProp} className="hb" style={{ position: 'absolute', top: 14, left: 14, width: 42, height: 42, borderRadius: '50%', background: 'rgba(24,29,26,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </div>
        {!isPrivato && (
          <div onClick={() => setEditOpen(true)} className="hb" style={{ position: 'absolute', top: 14, right: 14, display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(24,29,26,.5)', backdropFilter: 'blur(6px)', color: '#fff', borderRadius: 99, padding: '0 15px', height: 42, cursor: 'pointer' }}>
            <Icon d={ICONS.pencil} size={16} stroke="#fff" sw={2} />
            <span style={{ fontSize: 13, fontWeight: 700 }}>Modifica</span>
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 12, left: 14, background: 'rgba(24,29,26,.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '5px 11px', pointerEvents: 'none' }}>1 / 12 foto</div>
      </div>

      <div style={{ padding: '18px 20px 30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: tagBg, color: tagCol, fontSize: 11, fontWeight: 800, letterSpacing: '.04em', borderRadius: 99, padding: '5px 11px' }}>{p.tag}</div>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#8A6E24', background: '#FBF1DC', borderRadius: 99, padding: '5px 11px' }}>Classe {p.cls}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: 11.5, color: '#979EB2', fontWeight: 600 }}>Rif. IM-2026-{p.id}04</div>
        </div>
        <div style={{ marginTop: 10, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 27, letterSpacing: '-.7px', color: '#3C5BAA' }}>{p.price}</div>
        <div style={{ marginTop: 2, fontWeight: 700, fontSize: 17 }}>{p.t}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3, color: '#666E82', fontSize: 13 }}>
          <Icon d={ICONS.pin} size={14} stroke="#666E82" sw={1.9} />{p.zone}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 8, marginTop: 14 }}>
          {[[p.m2, 'm²'], [p.loc, 'locali'], [p.ba, 'bagni'], [p.pi, 'piano']].map(([v, l]) => (
            <div key={l} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 14, padding: '11px 6px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16 }}>{v}</div>
              <div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600, marginTop: 1 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Statistiche (solo proprietario) */}
        {!isPrivato && (
          <div style={{ marginTop: 14, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '13px 15px', display: 'flex', gap: 0 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>{p.views}</div>
              <div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>visualizzazioni</div>
            </div>
            <div style={{ width: 1, background: '#EDF0F7' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>{saves}</div>
              <div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>salvataggi</div>
            </div>
            <div style={{ width: 1, background: '#EDF0F7' }} />
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17, color: '#3C5BAA' }}>{pLeads.length}</div>
              <div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>lead</div>
            </div>
          </div>
        )}

        {/* Descrizione */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 8px' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16.5, letterSpacing: '-.3px' }}>Descrizione</div>
          {!isPrivato && (
            <div onClick={goCopy} className="hb" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFECFF', borderRadius: 99, padding: '7px 12px', cursor: 'pointer' }}>
              <Icon d={ICONS.spark} size={13} fill="#6E56F8" />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#4B39C8' }}>Copy AI</span>
            </div>
          )}
        </div>
        <div style={{ fontSize: 14, lineHeight: 1.6, color: '#3A4152', textWrap: 'pretty' }}>{p.desc}</div>

        {/* Privato: sola lettura → salva l'immobile e contatta l'agente */}
        {isPrivato && (
          <div style={{ display: 'flex', gap: 10, marginTop: 22 }}>
            <div onClick={() => toggleSaveProp(p.id)} className="hbg2" style={{ flex: 1, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: savedP ? '#EAF0FD' : '#fff', border: savedP ? '1.5px solid #537EEC' : '1.5px solid #CBD3E4', color: savedP ? '#3C5BAA' : '#15181F', borderRadius: 15, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>
              <Icon d={ICONS.star} size={16} fill={savedP ? '#537EEC' : 'none'} stroke={savedP ? '#537EEC' : '#5B6376'} sw={1.8} />{savedP ? 'Salvato' : 'Salva'}
            </div>
            <div onClick={() => toast("Richiesta di informazioni inviata all'agente")} className="hb" style={{ flex: 1.4, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>
              <Icon d={ICONS.chat} size={16} stroke="#F4F6FA" sw={1.9} />Contatta l'agente
            </div>
          </div>
        )}

        {/* Sezioni riservate al proprietario/agente */}
        {!isPrivato && (<>
        {/* Lead interessati */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 8px' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16.5, letterSpacing: '-.3px' }}>Lead su questo immobile</div>
          <div onClick={goCrm} style={{ fontSize: 13, fontWeight: 600, color: '#537EEC', cursor: 'pointer' }}>CRM</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {pLeads.slice(0, 3).map(l => (
            <div key={l.id} onClick={() => goLead(l)} className="hsh" style={{ display: 'flex', alignItems: 'center', gap: 11, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '11px 13px', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: l.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#3A4152' }}>{l.ini}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{l.n}</div>
                <div style={{ fontSize: 12, color: '#666E82', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l.msg}</div>
              </div>
              <div style={{ background: '#EAF0FD', color: '#3C5BAA', fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '4px 9px', flex: 'none' }}>{l.stage}</div>
            </div>
          ))}
          {pLeads.length === 0 && (
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '14px 15px', fontSize: 12.5, color: '#666E82' }}>Ancora nessun lead: pubblica l'annuncio o condividilo nel feed.</div>
          )}
        </div>

        {/* Asset AI */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 0 8px' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16.5, letterSpacing: '-.3px' }}>Asset AI</div>
          <div onClick={goAiStudio} style={{ fontSize: 13, fontWeight: 600, color: '#537EEC', cursor: 'pointer' }}>AI Studio</div>
        </div>
        <div style={{ display: 'flex', gap: 9, overflowX: 'auto', paddingBottom: 4 }}>
          <div onClick={goStaging} className="hb" style={{ flex: 'none', width: 150, background: 'linear-gradient(150deg,#4B39C8,#6E56F8)', borderRadius: 16, padding: 13, cursor: 'pointer' }}>
            <Icon d={ICONS.spark} size={19} fill="#fff" />
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 12.5, color: '#fff' }}>Staging soggiorno</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,.7)', marginTop: 1 }}>Pronto · 2 h fa</div>
          </div>
          <div onClick={goReel} className="hsh" style={{ flex: 'none', width: 150, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: 13, cursor: 'pointer' }}>
            <Icon d={ICONS.vid} size={19} stroke="#4B39C8" sw={1.8} />
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 12.5 }}>Genera un reel</div>
            <div style={{ fontSize: 10.5, color: '#8A91A6', marginTop: 1 }}>Dalle 12 foto · 5 crediti</div>
          </div>
          <div onClick={goCopy} className="hsh" style={{ flex: 'none', width: 150, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: 13, cursor: 'pointer' }}>
            <Icon d={ICONS.doc} size={19} stroke="#4B39C8" sw={1.8} />
            <div style={{ marginTop: 8, fontWeight: 700, fontSize: 12.5 }}>Copy annuncio</div>
            <div style={{ fontSize: 10.5, color: '#8A91A6', marginTop: 1 }}>3 varianti pronte</div>
          </div>
        </div>

        {/* Nota: pubblicato = visibile sul profilo; per promuoverlo servono post creati con l'AI */}
        <div style={{ marginTop: 22, display: 'flex', gap: 11, alignItems: 'flex-start', background: '#EFECFF', border: '1px solid #E0DAFB', borderRadius: 14, padding: '12px 14px' }}>
          <Icon d={ICONS.spark} size={17} fill="#6E56F8" />
          <div style={{ fontSize: 12.5, color: '#5B4FA8', lineHeight: 1.45, fontWeight: 500 }}>{isDraft ? 'È una bozza: pubblicala per mostrarla sul profilo.' : 'È pubblicato sul tuo profilo.'} Per promuoverlo e ricevere richieste crea dei post — con l'AI puoi scrivere il testo, migliorare le foto e creare video con l'home staging.</div>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <div onClick={goComposer} className="hbg2" style={{ flex: 1, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 15, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Crea post con l'AI</div>
          <div onClick={onCta} className="hb" style={{ flex: 1.4, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>{cta}</div>
        </div>
        </>)}
      </div>

      {!isPrivato && editOpen && <EditPropertyModal prop={p} open={editOpen} onClose={() => setEditOpen(false)} />}
    </Drawer>
  )
}

import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, TOOLS, STYLES, DAYS, COPYTEXTS } from '../../data/seed.js'
import { generateStaging, fileToResizedDataUrl } from '@/lib/staging'
import Icon from '../../components/Icon.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import Toggle from '../../components/Toggle.jsx'
import Modal from '../../components/Modal.jsx'
import EmptyState from '../../components/EmptyState.jsx'

const AI_TABS = [['hub', 'Panoramica'], ['staging', 'Home Staging'], ['photoedit', 'Photo Editing'], ['videoai', 'Video AI'], ['copyai', 'Copy AI'], ['planner', 'Social Planner']]
const VALID_TABS = AI_TABS.map(([id]) => id)
const STAG_PHOTOS = [[1, 'Soggiorno'], [2, 'Camera'], [3, 'Cucina'], [4, 'Studio']]
const PE_LIST = [
  ['luce', 'Migliora la luce', 'Esposizione e bilanciamento', ICONS.sun],
  ['cielo', 'Cielo azzurro', 'Sostituisce cieli grigi', ICONS.sky],
  ['persp', 'Raddrizza prospettiva', 'Linee verticali perfette', ICONS.persp],
  ['ogg', 'Rimuovi oggetti', 'Cavi, bidoni, disordine', ICONS.trash],
]
const VID_PROPS = [[3, 12], [1, 8], [2, 6]] // [propId, numero foto]
const VID_TPLS = [['Reel Tour', '9:16 · 30s', '24px'], ['Cinematic', '16:9 · 60s', '58px'], ['Stories', '9:16 · 15s', '24px']]
const CHSTYLE = { IG: ['Instagram', '#EFECFF', '#4B39C8'], FB: ['Facebook', '#EAF0FD', '#3C5BAA'], LI: ['LinkedIn', '#E4EDF7', '#2E5C8A'] }
const RECENT_NAV = { staging: 'staging', photoedit: 'photoedit', video: 'videoai', copy: 'copyai', plan: 'planner' }
const RECENT_ICON = { staging: TOOLS[0].d, photoedit: TOOLS[1].d, video: TOOLS[2].d, copy: TOOLS[3].d, plan: TOOLS[4].d }

// Mappa gli stili del design sui preset reali dell'edge function replicate-staging.
const STYLE_TO_PRESET = { Moderno: 'modern', Scandinavo: 'nordic', Industriale: 'industrial', Classico: 'boho' }

export default function AiStudioScreen() {
  const { d, ui, nav, setUi, toast, isDesktop, spendCredits, addRecent, publishPost, applyCopy, propById, openProp } = useApp()
  const aiTab = VALID_TABS.includes(ui.aiTab) ? ui.aiTab : 'hub'

  const stag = ui.stag || { step: 1, photo: 1, style: 'Moderno', pct: 56 }
  const pe = ui.pe || { luce: true, cielo: false, persp: false, ogg: false }
  const vid = ui.vid || { step: 1, prop: 3, tpl: 'Reel Tour', gen: false, done: false }
  const copy = ui.copy || { type: 'Annuncio portale', tone: 'Professionale', done: false }

  const vidProp = propById(vid.prop) || d.props[0]

  // Video AI: fine "montaggio" 2s dopo l'avvio della generazione
  useEffect(() => {
    if (!vid.gen) return
    const tm = setTimeout(() => {
      setUi(prev => ({ vid: { ...prev.vid, gen: false, done: true } }))
      addRecent({ t: 'Reel 30s · ' + vidProp.t, sub: 'Pronto da pubblicare', k: 'video' })
    }, 2000)
    return () => clearTimeout(tm)
  }, [vid.gen]) // eslint-disable-line react-hooks/exhaustive-deps

  const stagPhotoLabel = (STAG_PHOTOS.find(([id]) => id === stag.photo) || [1, 'Soggiorno'])[1]
  const peCr = Object.values(pe).filter(Boolean).length

  // ---- Staging reale (edge function replicate-staging via lib/staging) ----
  const fileRef = useRef(null)
  const [stagSrc, setStagSrc] = useState(null)      // data URL foto caricata
  const [stagOut, setStagOut] = useState(null)      // URL risultato AI
  const [stagBusy, setStagBusy] = useState(false)

  const pickPhoto = () => fileRef.current?.click()
  const onPhotoFile = async e => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    const dataUrl = await fileToResizedDataUrl(f)
    setStagSrc(dataUrl)
    setStagOut(null)
  }
  const runStaging = async () => {
    if (!stagSrc) { toast('Carica prima una foto'); pickPhoto(); return }
    if (stagBusy) return
    setStagBusy(true)
    try {
      const res = await generateStaging({ imageDataUrl: stagSrc, style: STYLE_TO_PRESET[stag.style] || 'modern' })
      if (res.ok) {
        setStagOut(res.outputUrl)
        addRecent({ t: 'Staging ' + stag.style, sub: 'Generato con AI', k: 'staging' })
        toast('Staging pronto')
      } else {
        toast(res.error)
      }
    } finally {
      setStagBusy(false)
    }
  }

  const copyToClipboard = () => {
    try { navigator.clipboard.writeText(COPYTEXTS[copy.type]) } catch { /* clipboard non disponibile: solo toast */ }
    toast('Testo copiato')
  }

  return (
    <div style={{ padding: isDesktop ? '0 0 48px' : '0 0 118px' }}>
      {/* ---- Header viola ---- */}
      <div style={{ background: 'linear-gradient(150deg,#221856 0%,#4B39C8 70%,#6E56F8 100%)', padding: isDesktop ? '26px 0 20px' : '16px 20px 18px', borderRadius: isDesktop ? 0 : '0 0 28px 28px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.12) 1px,transparent 1px)', backgroundSize: '24px 24px', animation: 'drift 9s linear infinite' }} />
        {/* Stessa gabbia del contenuto sotto (maxWidth 1000 + padding 32) per allineare titolo/tab alle card */}
        <div style={{ position: 'relative', maxWidth: 1000, margin: '0 auto', padding: isDesktop ? '0 32px' : 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 25 : 26, letterSpacing: '-.6px', color: '#fff' }}>AI Studio</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginTop: 2 }}>Il tuo reparto marketing, incluso nel piano.</div>
            </div>
            <div onClick={() => nav('billing')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.28)', borderRadius: 99, padding: '9px 15px', cursor: 'pointer', flex: 'none' }}>
              <Icon d={ICONS.star} size={14} fill="#FFD66E" />
              <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{d.credits} crediti</span>
            </div>
          </div>
          <div className="no-scrollbar" style={{ display: 'flex', flexWrap: 'nowrap', gap: 8, marginTop: 16, overflowX: 'auto' }}>
            {AI_TABS.map(([id, t]) => {
              const a = aiTab === id
              return (
                <div key={id} onClick={() => setUi({ aiTab: id })} style={{ flex: 'none', padding: '9px 16px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', background: a ? '#fff' : 'rgba(255,255,255,.12)', color: a ? '#4B39C8' : 'rgba(255,255,255,.85)', border: a ? '1px solid #fff' : '1px solid rgba(255,255,255,.25)' }}>{t}</div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '22px 32px 0' : '18px 20px 0' }}>

        {/* ---- Hub ---- */}
        {aiTab === 'hub' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 14 }}>
              {TOOLS.map(t => (
                <div key={t.id} className="hsh hbd" onClick={() => nav(t.id)} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 20, padding: 18, cursor: 'pointer' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 15, background: '#EFECFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon d={t.d} size={22} stroke="#4B39C8" sw={1.8} />
                  </div>
                  <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15.5 }}>{t.t}</div>
                  <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 2, lineHeight: 1.45 }}>{t.sub}</div>
                  <div style={{ marginTop: 12, display: 'inline-block', background: '#F4F6FA', borderRadius: 99, padding: '5px 11px', fontSize: 10.5, fontWeight: 800, color: '#8A91A6' }}>{t.cr}</div>
                </div>
              ))}
              <div style={{ background: 'linear-gradient(150deg,#16213D,#3C5BAA)', borderRadius: 20, padding: 18, display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, color: '#F4F6FA', letterSpacing: '-.3px' }}>+62% di lead</div>
                <div style={{ marginTop: 4, fontSize: 12.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.5, flex: 1 }}>per gli annunci con foto migliorate e video AI, rispetto alla media Agente Immo.</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 10 }}>Dati piattaforma · giugno 2026</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0 10px' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-.3px' }}>Creazioni recenti</div>
              {d.recents.length > 0 && <div className="hu" onClick={() => setUi({ aiArchiveOpen: true })} style={{ fontSize: 13, fontWeight: 600, color: '#537EEC', cursor: 'pointer' }}>Archivio completo</div>}
            </div>
            {d.recents.length === 0 ? (
              <EmptyState icon={ICONS.spark} title="Ancora nessuna creazione" sub="Home staging, foto migliorate, reel e testi appariranno qui appena li generi con l'AI." cta="Prova l'Home Staging" onCta={() => setUi({ aiTab: 'staging' })} />
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,300px),1fr))', gap: 12 }}>
                {d.recents.slice(0, 6).map((r, i) => (
                  <RecentRow key={r.t + i} r={r} onClick={() => nav(RECENT_NAV[r.k] || 'aistudio')} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ---- Home Staging ---- */}
        {aiTab === 'staging' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0,1.7fr) 320px' : '1fr', gap: 20, alignItems: 'start' }}>
            <div>
              <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', height: isDesktop ? 430 : 300, background: '#15181F' }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                  {stagSrc
                    ? <img src={stagSrc} alt="Prima" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <Placeholder label="PRIMA · carica una foto" tone="grey" style={{ width: '100%', height: '100%', borderRadius: 0 }} />}
                </div>
                <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 0 ${stag.pct}%)` }}>
                  {stagOut
                    ? <img src={stagOut} alt="Dopo" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <Placeholder label={stagBusy ? 'GENERAZIONE IN CORSO…' : `DOPO · arredata con AI (${stag.style})`} tone="violet" style={{ width: '100%', height: '100%', borderRadius: 0 }} />}
                </div>
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: stag.pct + '%', width: 3, background: '#fff', boxShadow: '0 0 12px rgba(0,0,0,.4)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: '50%', left: stag.pct + '%', transform: 'translate(-50%,-50%)', width: 38, height: 38, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 14px rgba(0,0,0,.35)', pointerEvents: 'none' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4B39C8" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6 4 12l5 6M15 6l5 6-5 6" /></svg>
                </div>
                <div style={{ position: 'absolute', top: 14, left: 14, background: 'rgba(24,29,26,.65)', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', borderRadius: 99, padding: '5px 11px', pointerEvents: 'none' }}>PRIMA</div>
                <div style={{ position: 'absolute', top: 14, right: 14, background: '#6E56F8', color: '#fff', fontSize: 11, fontWeight: 800, letterSpacing: '.06em', borderRadius: 99, padding: '5px 11px', pointerEvents: 'none' }}>DOPO · {stag.style}</div>
              </div>
              <input type="range" min="4" max="96" value={stag.pct} onChange={e => { const v = +e.target.value; setUi(prev => ({ stag: { ...prev.stag, pct: v } })) }} style={{ width: '100%', marginTop: 16, height: 26 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5, fontWeight: 700, color: '#979EB2' }}>
                <span>Trascina per confrontare prima e dopo</span>
                <span>{stagPhotoLabel} · Trilocale Porta Romana</span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Foto</div>
                <input ref={fileRef} type="file" accept="image/*" onChange={onPhotoFile} style={{ display: 'none' }} />
                <div className="hbd" onClick={pickPhoto} style={{ marginTop: 10, minHeight: 74, border: '1.5px dashed #C9BEFF', borderRadius: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', overflow: 'hidden', position: 'relative' }}>
                  {stagSrc ? (
                    <>
                      <img src={stagSrc} alt="Foto caricata" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 5, left: 5, background: 'rgba(24,29,26,.6)', color: '#fff', fontSize: 9, fontWeight: 700, borderRadius: 99, padding: '2px 7px' }}>Cambia foto</div>
                    </>
                  ) : (
                    <>
                      <Icon d={ICONS.spark} size={17} stroke="#6E56F8" />
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#4B39C8' }}>Carica la foto della stanza</div>
                    </>
                  )}
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Stile</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {STYLES.map(s => {
                    const sel = stag.style === s.n
                    return (
                      <div key={s.n} className="hbd" onClick={() => setUi(prev => ({ stag: { ...prev.stag, style: s.n } }))} style={{ display: 'flex', alignItems: 'center', gap: 10, border: sel ? '1.5px solid #6E56F8' : '1px solid #DFE4EF', borderRadius: 13, padding: '11px 13px', cursor: 'pointer' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 13.5, color: sel ? '#4B39C8' : '#15181F' }}>{s.n}</div>
                          <div style={{ fontSize: 11, color: '#8A91A6' }}>{s.sub}</div>
                        </div>
                        {sel && <Icon d={ICONS.check} size={16} stroke="#6E56F8" sw={2.6} />}
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="hb" onClick={runStaging} style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#6E56F8', color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', opacity: stagBusy ? 0.6 : 1 }}>
                <Icon d={ICONS.spark} size={15} fill="#fff" stroke="#fff" />{stagBusy ? 'Generazione…' : (stagOut ? 'Rigenera' : 'Genera con AI')}
              </div>
              {stagOut && (
                <a className="hb" href={stagOut} target="_blank" rel="noreferrer" style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #C9BEFF', color: '#4B39C8', borderRadius: 14, fontWeight: 700, fontSize: 13.5, cursor: 'pointer', textDecoration: 'none' }}>Apri / scarica risultato</a>
              )}
            </div>
          </div>
        )}

        {/* ---- Photo Editing ---- */}
        {aiTab === 'photoedit' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0,1.7fr) 320px' : '1fr', gap: 20, alignItems: 'start' }}>
            <PeCanvas height={isDesktop ? 430 : 250} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, overflow: 'hidden' }}>
                {PE_LIST.map(([k, t, sub, dd], i) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: i < PE_LIST.length - 1 ? '1px solid #F0F3F9' : 'none' }}>
                    <div style={{ width: 38, height: 38, borderRadius: 12, background: '#EFECFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                      <Icon d={dd} size={18} stroke="#4B39C8" sw={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5 }}>{t}</div>
                      <div style={{ fontSize: 11, color: '#8A91A6' }}>{sub}</div>
                    </div>
                    <Toggle on={!!pe[k]} onColor="#6E56F8" onClick={() => setUi(prev => ({ pe: { ...prev.pe, [k]: !prev.pe[k] } }))} />
                  </div>
                ))}
              </div>
              <div className="hbg2" onClick={() => toast('Miglioramenti pronti per tutte le 12 foto')} style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 14, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Applica a tutte le 12 foto</div>
              <div className="hb" onClick={() => { if (!peCr) { toast('Attiva almeno un miglioramento') } else if (spendCredits(peCr)) { addRecent({ t: 'Set foto migliorato', sub: 'Trilocale Porta Romana', k: 'photoedit' }); toast('Foto migliorate e salvate') } }} style={{ minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6E56F8', color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }}>Applica · {peCr} crediti</div>
            </div>
          </div>
        )}

        {/* ---- Video AI ---- */}
        {aiTab === 'videoai' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'minmax(0,1fr) 340px' : '1fr', gap: 24, alignItems: 'start' }}>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Immobile</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 10 }}>
                {VID_PROPS.map(([id, nf], i) => {
                  const p = propById(id)
                  const sel = vid.prop === id
                  return (
                    <div key={id} className="hsh" onClick={() => setUi(prev => ({ vid: { ...prev.vid, prop: id, done: false } }))} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: sel ? '1.5px solid #6E56F8' : '1px solid #DFE4EF', borderRadius: 15, padding: '12px 14px', cursor: 'pointer' }}>
                      <div style={{ width: 64, height: 48, borderRadius: 10, overflow: 'hidden', flex: 'none' }}><Placeholder tone={['blue', 'warm', 'grey'][i]} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{p ? p.t : ''}</div>
                        <div style={{ fontSize: 12, color: '#8A91A6' }}>{p ? p.zone : ''} · {nf} foto</div>
                      </div>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', border: sel ? '0 solid' : '1.5px solid #C6CEE0', background: sel ? '#6E56F8' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        {sel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 18, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Formato</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                {VID_TPLS.map(([n, sub, w]) => {
                  const sel = vid.tpl === n
                  return (
                    <div key={n} className="hbd" onClick={() => setUi(prev => ({ vid: { ...prev.vid, tpl: n, done: false } }))} style={{ flex: 1, background: '#fff', border: sel ? '1.5px solid #6E56F8' : '1px solid #DFE4EF', borderRadius: 15, padding: '14px 12px', cursor: 'pointer', textAlign: 'center' }}>
                      <div style={{ width: w, height: 42, borderRadius: 6, background: sel ? 'linear-gradient(160deg,#4B39C8,#6E56F8)' : '#DFE4EF', margin: '0 auto' }} />
                      <div style={{ marginTop: 9, fontWeight: 700, fontSize: 12.5, color: sel ? '#4B39C8' : '#15181F' }}>{n}</div>
                      <div style={{ fontSize: 11, color: '#979EB2', marginTop: 1 }}>{sub}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: 16, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 15px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4B39C8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18.5V6l11-2v12.5M9 18.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM20 16.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0Z" /></svg>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5 }}>Musica: Ambient Milano</div>
                  <div style={{ fontSize: 11.5, color: '#8A91A6' }}>Voce narrante AI in italiano</div>
                </div>
                <Icon d={ICONS.fwd} size={16} stroke="#979EB2" sw={2.2} />
              </div>
              <div className="hb" onClick={() => { if (spendCredits(5)) setUi(prev => ({ vid: { ...prev.vid, gen: true, done: false } })) }} style={{ marginTop: 18, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#6E56F8', color: '#fff', borderRadius: 15, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                <Icon d={ICONS.spark} size={17} fill="#fff" />Genera il video · 5 crediti
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: isDesktop ? 250 : 210, height: isDesktop ? 430 : 360, borderRadius: 26, background: '#15181F', position: 'relative', overflow: 'hidden', boxShadow: '0 24px 60px rgba(24,29,26,.3)' }}>
                <Placeholder label="Anteprima reel 9:16" tone="violet" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                {vid.gen && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(24,24,40,.82)', backdropFilter: 'blur(3px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="#C9BEFF" style={{ animation: 'blink 1s infinite' }}><path d="M12 3.5 13.7 8.8 19 10.5l-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7L12 3.5Z" /></svg>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>L'AI sta montando il reel...</div>
                    <div style={{ width: '66%', height: 6, borderRadius: 99, background: 'rgba(255,255,255,.18)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#6E56F8,#C9BEFF)', animation: 'fillBar 1.8s ease forwards' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Scelgo le foto migliori · scrivo i sottotitoli</div>
                  </div>
                )}
                {vid.done && (
                  <>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(24,29,26,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,.4)', animation: 'popIn .4s ease both' }}>
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5v13l10-6.5-10-6.5Z" /></svg>
                      </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, pointerEvents: 'none' }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#fff', textShadow: '0 1px 8px rgba(0,0,0,.5)' }}>{vidProp.t} · {vidProp.zone.split(' · ')[0]}</div>
                      <div style={{ marginTop: 7, height: 4, borderRadius: 99, background: 'rgba(255,255,255,.3)' }}><div style={{ width: '35%', height: '100%', borderRadius: 99, background: '#fff' }} /></div>
                      <div style={{ marginTop: 4, fontSize: 10.5, color: 'rgba(255,255,255,.8)' }}>0:10 / 0:30</div>
                    </div>
                  </>
                )}
              </div>
              {vid.done && (
                <div style={{ marginTop: 14, display: 'flex', gap: 8, width: '100%', maxWidth: 300 }}>
                  <div className="hb" onClick={() => publishPost('Nuovo reel: ' + vidProp.t + ' raccontato in 30 secondi. Fatto con AI Studio. 🎬', { reel: true })} style={{ flex: 1.4, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6E56F8', color: '#fff', borderRadius: 13, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Pubblica sul feed</div>
                  <div onClick={() => nav('planner')} style={{ flex: 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #C9BEFF', color: '#4B39C8', borderRadius: 13, fontWeight: 700, fontSize: 12.5, cursor: 'pointer' }}>Programma</div>
                  <div className="hbg2" onClick={() => toast('Download avviato · MP4 1080×1920')} style={{ width: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 13, cursor: 'pointer', flex: 'none' }}>
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#15181F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3.5v11M8 11l4 4 4-4M5 19.5h14" /></svg>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- Copy AI ---- */}
        {aiTab === 'copyai' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '340px minmax(0,1fr)' : '1fr', gap: isDesktop ? 24 : 16, alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: 16 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Cosa scriviamo?</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {['Annuncio portale', 'Post social', 'Email follow-up'].map(t => {
                    const a = copy.type === t
                    return <div key={t} onClick={() => setUi(prev => ({ copy: { ...prev.copy, type: t, done: false } }))} style={{ padding: '9px 14px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: a ? '#15181F' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #15181F' : '1px solid #DFE4EF' }}>{t}</div>
                  })}
                </div>
                <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Tono</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  {['Professionale', 'Caldo', 'Vivace'].map(t => {
                    const a = copy.tone === t
                    return <div key={t} onClick={() => setUi(prev => ({ copy: { ...prev.copy, tone: t, done: false } }))} style={{ padding: '9px 14px', borderRadius: 99, fontSize: 12.5, fontWeight: 700, cursor: 'pointer', background: a ? '#EFECFF' : '#fff', color: a ? '#4B39C8' : '#485062', border: a ? '1px solid #C9BEFF' : '1px solid #DFE4EF' }}>{t}</div>
                  })}
                </div>
              </div>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 11 }}>
                <div style={{ width: 54, height: 42, borderRadius: 9, overflow: 'hidden', flex: 'none' }}><Placeholder tone="warm" style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Trilocale con terrazzo</div>
                  <div style={{ fontSize: 11.5, color: '#8A91A6' }}>Porta Romana · € 485.000</div>
                </div>
                <div className="hu" onClick={() => nav('properties')} style={{ fontSize: 12, fontWeight: 700, color: '#537EEC', cursor: 'pointer' }}>Cambia</div>
              </div>
              <div className="hb" onClick={() => { setUi(prev => ({ copy: { ...prev.copy, done: true } })); addRecent({ t: 'Testo · ' + copy.type, sub: 'Tono ' + copy.tone.toLowerCase(), k: 'copy' }); toast('Testo generato in 3 secondi') }} style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#6E56F8', color: '#fff', borderRadius: 15, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>
                <Icon d={ICONS.spark} size={17} fill="#fff" />{copy.done ? "Genera un'altra variante" : 'Genera il testo'}
              </div>
            </div>
            <div>
              {copy.done ? (
                <div style={{ background: '#fff', border: '1.5px solid #C9BEFF', borderRadius: 20, overflow: 'hidden', animation: 'fadeUp .35s ease both' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '13px 18px', background: '#F5F2FF', borderBottom: '1px solid #E5DFFA' }}>
                    <Icon d={ICONS.spark} size={14} fill="#6E56F8" />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#4B39C8' }}>{copy.type} · tono {copy.tone.toLowerCase()}</span>
                    <div style={{ flex: 1 }} />
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: '#979EB2' }}>variante 2 di 3</span>
                  </div>
                  <div style={{ padding: isDesktop ? 20 : 15, fontSize: isDesktop ? 15 : 14, lineHeight: 1.65, color: '#282D39', whiteSpace: 'pre-line' }}>{COPYTEXTS[copy.type]}</div>
                  <div style={{ display: 'flex', gap: 9, padding: isDesktop ? '0 20px 20px' : '0 15px 15px' }}>
                    <div className="hbg" onClick={copyToClipboard} style={{ flex: isDesktop ? 'none' : 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4F6FA', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '0 18px' }}>Copia</div>
                    <div className="hb" onClick={() => applyCopy(1, copy.type)} style={{ flex: isDesktop ? 'none' : 1, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: '0 18px' }}>Usa nell'annuncio</div>
                    <div className="hb" onClick={() => toast('Nuova variante generata')} style={{ width: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#EFECFF', borderRadius: 12, cursor: 'pointer', flex: 'none' }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#4B39C8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5V8h-4.5" /></svg>
                    </div>
                  </div>
                </div>
              ) : isDesktop ? (
                <div style={{ border: '2px dashed #C6CEE0', borderRadius: 20, padding: '60px 40px', textAlign: 'center', background: 'rgba(255,255,255,.5)' }}>
                  <Icon d={ICONS.spark} size={34} fill="#C9BEFF" />
                  <div style={{ marginTop: 12, fontWeight: 700, fontSize: 15, color: '#5B6376' }}>Il testo apparirà qui</div>
                  <div style={{ fontSize: 13, color: '#979EB2', marginTop: 4, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>Scegli formato e tono, poi genera. Ogni variante è riscrivibile e modificabile.</div>
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* ---- Social Planner ---- */}
        {aiTab === 'planner' && (
          <>
            <div style={{ display: 'flex', gap: isDesktop ? 8 : 7 }}>
              {DAYS.map((dy, i) => {
                const sel = ui.planDay === i
                const has = !!(d.sched[i] && d.sched[i].length)
                return (
                  <div key={dy.d + i} onClick={() => setUi({ planDay: i })} style={{ flex: 1, textAlign: 'center', padding: isDesktop ? '12px 0 10px' : '10px 0 8px', borderRadius: isDesktop ? 15 : 14, cursor: 'pointer', background: sel ? '#15181F' : '#fff', border: sel ? '1px solid #15181F' : '1px solid #DFE4EF' }}>
                    <div style={{ fontSize: isDesktop ? 10.5 : 10, fontWeight: 700, color: sel ? 'rgba(255,255,255,.7)' : '#979EB2', textTransform: 'uppercase' }}>{dy.d}</div>
                    <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 18 : 16, color: sel ? '#F4F6FA' : '#15181F', marginTop: 1 }}>{dy.n}</div>
                    <div style={{ width: 5, height: 5, borderRadius: '50%', background: has ? (sel ? '#A2B9F5' : '#6E56F8') : 'transparent', margin: '5px auto 0' }} />
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 16, background: '#EFECFF', borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <Icon d={ICONS.spark} size={18} fill="#6E56F8" style={{ flex: 'none' }} />
              <div style={{ flex: 1, fontSize: 13, color: '#4B39C8', lineHeight: 1.45 }}><b>Momento d'oro:</b> il tuo pubblico è più attivo giovedì 18–20. Un post lì vale il doppio.</div>
              <div className="hb" onClick={() => setUi({ planDay: 3, planAddOpen: true })} style={{ background: '#6E56F8', color: '#fff', fontSize: 12, fontWeight: 800, borderRadius: 99, padding: '9px 15px', cursor: 'pointer', flex: 'none' }}>{isDesktop ? 'Usa questo slot' : 'Usa slot'}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '20px 0 10px' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16.5, letterSpacing: '-.3px', flex: 1 }}>In programma · {DAYS[ui.planDay].d} {DAYS[ui.planDay].n} luglio</div>
              <div className="hb" onClick={() => setUi({ planAddOpen: true })} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#6E56F8', color: '#fff', borderRadius: 11, padding: '9px 14px', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flex: 'none' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>Programma
              </div>
            </div>
            {!(d.sched[ui.planDay] && d.sched[ui.planDay].length) && (
              <div style={{ border: '2px dashed #C6CEE0', borderRadius: 18, padding: '36px 20px', textAlign: 'center', background: 'rgba(255,255,255,.5)' }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: '#5B6376' }}>Nessun contenuto programmato</div>
                <div style={{ fontSize: 13, color: '#979EB2', marginTop: 3 }}>Programma un post, un reel o una storia per questo giorno.</div>
              </div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(100%,340px),1fr))', gap: 12 }}>
              {(d.sched[ui.planDay] || []).map((s, i) => {
                const [chName, cc, tc] = CHSTYLE[s.ch] || ['Social', '#EDF0F7', '#5B6376']
                return (
                  <div key={ui.planDay + '-' + i} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '13px 15px' }}>
                    <div style={{ width: 54, flex: 'none', textAlign: 'center', background: '#F4F6FA', borderRadius: 11, padding: '9px 0', fontSize: 13, fontWeight: 800 }}>{s.h}</div>
                    <div style={{ width: 48, height: 48, borderRadius: 11, overflow: 'hidden', flex: 'none' }}><Placeholder tone={['blue', 'warm', 'green'][i % 3]} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.t}</div>
                      <div style={{ display: 'inline-flex', marginTop: 4, background: cc, color: tc, fontSize: 9.5, fontWeight: 800, letterSpacing: '.05em', borderRadius: 99, padding: '3px 9px' }}>{chName}</div>
                    </div>
                    <div className="hbg" onClick={() => setUi({ planAddOpen: true })} style={{ width: 38, height: 38, borderRadius: 12, background: '#F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
                      <Icon d={ICONS.pencil} size={15} stroke="#5B6376" sw={1.9} />
                    </div>
                  </div>
                )
              })}
            </div>
            <div style={{ padding: '20px 0 8px', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Collegamenti</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(100px,1fr))', gap: 9 }}>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: 12, textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 13 }}>Instagram</div><div style={{ fontSize: 10.5, color: '#3C5BAA', fontWeight: 700, marginTop: 2 }}>● Collegato</div></div>
              <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: 12, textAlign: 'center' }}><div style={{ fontWeight: 800, fontSize: 13 }}>Facebook</div><div style={{ fontSize: 10.5, color: '#3C5BAA', fontWeight: 700, marginTop: 2 }}>● Collegato</div></div>
              <div className="hbd" onClick={() => toast('Collegamento LinkedIn in arrivo')} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: 12, textAlign: 'center', cursor: 'pointer' }}><div style={{ fontWeight: 800, fontSize: 13 }}>LinkedIn</div><div style={{ fontSize: 10.5, color: '#979EB2', fontWeight: 700, marginTop: 2 }}>Collega</div></div>
            </div>
          </>
        )}
      </div>

      {ui.planAddOpen && <PlanAddModal />}
      {ui.aiArchiveOpen && <AiArchiveModal />}
    </div>
  )
}

// Riga di una creazione recente (riusata da hub e archivio): icona per tipo + titolo + orario.
function RecentRow({ r, onClick }) {
  return (
    <div className="hsh" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '12px 14px', cursor: 'pointer' }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: '#EFECFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
        <Icon d={RECENT_ICON[r.k] || TOOLS[0].d} size={20} stroke="#4B39C8" sw={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.t}</div>
        <div style={{ fontSize: 12, color: '#8A91A6', marginTop: 1 }}>{r.sub}</div>
      </div>
      <div style={{ fontSize: 11, color: '#979EB2', fontWeight: 600, flex: 'none' }}>{r.time}</div>
    </div>
  )
}

// Archivio completo: tutte le creazioni (non solo le 6 dell'hub), aperto dal link "Archivio completo".
function AiArchiveModal() {
  const { d, setUi, nav } = useApp()
  const close = () => setUi({ aiArchiveOpen: false })
  return (
    <Modal open onClose={close} title="Archivio completo" maxWidth={520}>
      {d.recents.length === 0 ? (
        <EmptyState icon={ICONS.spark} title="Ancora nessuna creazione" sub="Genera qualcosa con l'AI e lo ritrovi qui." />
      ) : (
        <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 9, maxHeight: 440, overflowY: 'auto' }}>
          {d.recents.map((r, i) => (
            <RecentRow key={r.t + i} r={r} onClick={() => { setUi({ aiArchiveOpen: false }); nav(RECENT_NAV[r.k] || 'aistudio') }} />
          ))}
        </div>
      )}
    </Modal>
  )
}

// Canvas Photo Editing con toggle Prima/Dopo funzionante
function PeCanvas({ height }) {
  const [after, setAfter] = useState(false)
  return (
    <div style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', height }}>
      <Placeholder label={after ? 'Anteprima migliorata' : 'Foto da migliorare · Trilocale Porta Romana'} tone={after ? 'green' : 'grey'} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
      <div style={{ position: 'absolute', top: 14, right: 14, background: '#6E56F8', color: '#fff', fontSize: 11, fontWeight: 800, borderRadius: 99, padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'blink 1s infinite' }} />ANTEPRIMA LIVE
      </div>
      <div style={{ position: 'absolute', bottom: 14, left: 14, display: 'flex', background: 'rgba(24,29,26,.6)', backdropFilter: 'blur(4px)', borderRadius: 99, padding: 3 }}>
        <div onClick={() => setAfter(false)} style={{ padding: '7px 15px', borderRadius: 99, fontSize: 11.5, fontWeight: 800, color: after ? 'rgba(255,255,255,.7)' : '#fff', background: after ? 'transparent' : 'rgba(255,255,255,.22)', cursor: 'pointer' }}>Prima</div>
        <div onClick={() => setAfter(true)} style={{ padding: '7px 15px', borderRadius: 99, fontSize: 11.5, fontWeight: 800, color: after ? '#fff' : 'rgba(255,255,255,.7)', background: after ? 'rgba(255,255,255,.22)' : 'transparent', cursor: 'pointer' }}>Dopo</div>
      </div>
    </div>
  )
}

// Modale: programma un contenuto (titolo, ora, canale) — bottom-sheet su mobile, card centrata su desktop
function PlanAddModal() {
  const { ui, setUi, schedulePost, toast } = useApp()
  const [t, setT] = useState('')
  const [h, setH] = useState('18:00')
  const [ch, setCh] = useState('IG')
  const close = () => setUi({ planAddOpen: false })
  const save = () => {
    if (!t.trim()) { toast('Dai un titolo al contenuto'); return }
    schedulePost(ui.planDay, { h: h || '18:00', t: t.trim(), ch })
  }

  return (
    <Modal open onClose={close} title="Programma contenuto">
      <div style={{ fontSize: 12.5, color: '#8A91A6', padding: '0 6px' }}>{DAYS[ui.planDay].d} {DAYS[ui.planDay].n} luglio</div>
      <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Titolo</div>
      <input value={t} onChange={e => setT(e.target.value)} placeholder="Es. Reel · Trilocale Porta Romana" autoFocus style={{ marginTop: 7, width: '100%', boxSizing: 'border-box', minHeight: 44, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 12, padding: '0 14px', fontSize: 14, color: '#15181F', outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Ora</div>
      <input type="time" value={h} onChange={e => setH(e.target.value)} style={{ marginTop: 7, width: '100%', boxSizing: 'border-box', minHeight: 44, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 12, padding: '0 14px', fontSize: 14, color: '#15181F', outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ marginTop: 14, fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }}>Canale</div>
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        {Object.keys(CHSTYLE).map(k => {
          const [name, cc, tc] = CHSTYLE[k]
          const a = ch === k
          return (
            <div key={k} onClick={() => setCh(k)} style={{ flex: 1, textAlign: 'center', padding: '10px 0', borderRadius: 12, fontSize: 12.5, fontWeight: 800, cursor: 'pointer', background: a ? cc : '#fff', color: a ? tc : '#485062', border: a ? '1.5px solid ' + tc : '1px solid #DFE4EF' }}>{name}</div>
          )
        })}
      </div>
      <div className="hb" onClick={save} style={{ marginTop: 20, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#6E56F8', color: '#fff', borderRadius: 14, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
      <Icon d={ICONS.cal} size={17} stroke="#fff" />Programma
      </div>
    </Modal>
  )
}

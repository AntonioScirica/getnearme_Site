import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Placeholder from '../../components/Placeholder.jsx'

const TIPO_CARDS = [
  ['Appartamento', ICONS.build],
  ['Attico', ICONS.attico],
  ['Villa', ICONS.villa],
  ['Ufficio', ICONS.biz],
]
const STEP_LABELS = ['Tipo e indirizzo', 'Dettagli', 'Foto e AI', 'Prezzo e annuncio']

// Wizard "Nuovo immobile": contenuto centrato in una card bianca su desktop, a tutta larghezza su mobile.
export default function NewPropertyWizard() {
  const { ui, setUi, back, nav, toast, addProperty, openProp, isDesktop } = useApp()
  const np = ui.np
  if (!np) return null

  const setNp = patch => setUi(prev => ({ np: { ...prev.np, ...patch } }))
  const bar = n => (np.step >= n ? '#537EEC' : '#CBD3E4')

  const title = np.tipo === 'Appartamento'
    ? (np.loc <= 2 ? 'Bilocale luminoso' : np.loc === 3 ? 'Trilocale luminoso' : 'Quadrilocale spazioso')
    : ({ Attico: 'Attico con terrazzo', Villa: 'Villa con giardino', Ufficio: 'Ufficio open space' }[np.tipo] || 'Immobile')
  const extrasOn = Object.keys(np.extras).filter(k => np.extras[k])
  const priceLabel = np.type === 'Affitto' ? `€ ${np.price || '1.200'}/mese` : `€ ${np.price || '350.000'}`

  const next = () => { if (np.step < 4) setNp({ step: np.step + 1 }); else addProperty() }
  const goBack = () => { if (np.step > 1) setNp({ step: np.step - 1 }); else back() }

  return (
    <div style={{ minHeight: '100%', boxSizing: 'border-box', padding: isDesktop ? '32px 24px 60px' : '12px 0 30px', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        width: '100%', maxWidth: isDesktop ? 520 : '100%', margin: isDesktop ? '0 auto' : 0,
        display: 'flex', flexDirection: 'column', flex: 1, boxSizing: 'border-box',
        ...(isDesktop ? { background: '#fff', border: '1px solid #DFE4EF', borderRadius: 24, boxShadow: '0 12px 40px rgba(24,29,26,.06)', padding: '26px 28px 30px' } : {}),
      }}>
        {np.step < 5 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: isDesktop ? 0 : '8px 20px 0' }}>
              <div onClick={goBack} className="hbg2" style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
                <Icon d={ICONS.back} size={18} sw={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19, letterSpacing: '-.4px' }}>Nuovo immobile</div>
                <div style={{ fontSize: 12, color: '#8A91A6', fontWeight: 600 }}>{STEP_LABELS[np.step - 1] || ''}</div>
              </div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: '#8A91A6' }}>{np.step}/4</div>
            </div>
            <div style={{ display: 'flex', gap: 6, padding: isDesktop ? '16px 0 0' : '12px 20px 0' }}>
              <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#537EEC' }} />
              <div style={{ flex: 1, height: 4, borderRadius: 99, background: bar(2) }} />
              <div style={{ flex: 1, height: 4, borderRadius: 99, background: bar(3) }} />
              <div style={{ flex: 1, height: 4, borderRadius: 99, background: bar(4) }} />
            </div>
          </>
        )}

        {np.step === 1 && (
          <div style={{ padding: isDesktop ? '20px 0 0' : '20px 20px 0', animation: 'fadeUp .35s ease both' }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2', marginBottom: 9 }}>Tipo di annuncio</div>
            <div style={{ display: 'flex', gap: 9 }}>
              {['Vendita', 'Affitto'].map(t => {
                const a = np.type === t
                return (
                  <div key={t} onClick={() => setNp({ type: t })} className={a ? '' : 'hbg2'} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, fontSize: 14, fontWeight: 700, cursor: 'pointer', background: a ? '#537EEC' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #537EEC' : '1px solid #DFE4EF' }}>{t}</div>
                )
              })}
            </div>
            <div style={{ marginTop: 18, fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2' }}>Tipologia</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginTop: 9 }}>
              {TIPO_CARDS.map(([t, dPath]) => {
                const a = np.tipo === t
                return (
                  <div key={t} onClick={() => setNp({ tipo: t })} className="hbd" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: a ? '1.5px solid #537EEC' : '1px solid #DFE4EF', borderRadius: 15, padding: '13px 13px', cursor: 'pointer' }}>
                    <Icon d={dPath} size={20} stroke={a ? '#3C5BAA' : '#8A91A6'} sw={1.8} />
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: a ? '#3C5BAA' : '#485062' }}>{t}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 18, fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2' }}>Indirizzo</div>
            <input
              value={np.addr}
              onChange={e => setNp({ addr: e.target.value })}
              placeholder="Via e numero civico, città"
              style={{ marginTop: 9, width: '100%', boxSizing: 'border-box', background: '#fff', border: '1.5px solid #537EEC', borderRadius: 15, padding: '14px 15px', fontSize: 14.5, fontWeight: 600, color: '#15181F', outline: 'none' }}
            />
            <div style={{ marginTop: 12, fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2' }}>Zona</div>
            <input
              value={np.zone}
              onChange={e => setNp({ zone: e.target.value })}
              placeholder="Quartiere · Città"
              style={{ marginTop: 9, width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '14px 15px', fontSize: 14.5, fontWeight: 600, color: '#15181F', outline: 'none' }}
            />
            <div style={{ marginTop: 10, height: 130, borderRadius: 16, position: 'relative', overflow: 'hidden', background: '#DDE3F0', backgroundImage: 'linear-gradient(rgba(255,255,255,.55) 1.5px,transparent 1.5px),linear-gradient(90deg,rgba(255,255,255,.55) 1.5px,transparent 1.5px)', backgroundSize: '26px 26px' }}>
              <div style={{ position: 'absolute', left: '38%', top: '15%', width: '24%', height: '70%', borderRadius: 8, background: 'rgba(83,126,236,.1)', border: '1.5px dashed rgba(83,126,236,.4)' }} />
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-90%)' }}>
                <svg width="34" height="34" viewBox="0 0 24 24" fill="#537EEC"><path d="M12 21.5s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11Z" /><circle cx="12" cy="10.4" r="2.6" fill="#F4F6FA" /></svg>
              </div>
              <div style={{ position: 'absolute', bottom: 8, right: 10, background: 'rgba(255,255,255,.85)', borderRadius: 8, padding: '4px 9px', fontSize: 10.5, fontWeight: 700, color: '#5B6376' }}>{(np.zone || 'Zona').split('·')[0].trim()} · zona verificata</div>
            </div>
          </div>
        )}

        {np.step === 2 && (
          <div style={{ padding: isDesktop ? '20px 0 0' : '20px 20px 0', animation: 'fadeUp .35s ease both' }}>
            <div style={{ display: 'flex', gap: 9 }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#979EB2', fontWeight: 700, flex: 1 }}>Superficie</span>
                  <Icon d={ICONS.pencil} size={12} stroke="#B7C2DC" sw={1.9} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 3 }}>
                  <input
                    className="npf"
                    value={np.m2}
                    onChange={e => setNp({ m2: e.target.value.replace(/[^0-9]/g, '') })}
                    inputMode="numeric"
                    aria-label="Superficie in metri quadri"
                    style={{ width: 54, outline: 'none', background: 'transparent', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19, color: '#15181F' }}
                  />
                  <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19 }}>m²</span>
                </div>
              </div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 11, color: '#979EB2', fontWeight: 700, flex: 1 }}>Piano</span>
                  <Icon d={ICONS.pencil} size={12} stroke="#B7C2DC" sw={1.9} />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3, marginTop: 3, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19 }}>
                  <input className="npf" value={np.piano} onChange={e => setNp({ piano: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" aria-label="Piano" style={{ width: 24, outline: 'none', background: 'transparent', font: 'inherit', color: '#15181F' }} />
                  <span>° di</span>
                  <input className="npf" value={np.pianiTot} onChange={e => setNp({ pianiTot: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" aria-label="Piani totali" style={{ width: 24, outline: 'none', background: 'transparent', font: 'inherit', color: '#15181F' }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '12px 15px', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>Locali</div>
              <div onClick={() => setNp({ loc: Math.max(1, np.loc - 1) })} className="hbg" style={{ width: 40, height: 40, borderRadius: 12, background: '#EDF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 19, fontWeight: 700, color: '#5B6376' }}>−</div>
              <div style={{ width: 44, textAlign: 'center', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19 }}>{np.loc}</div>
              <div onClick={() => setNp({ loc: Math.min(9, np.loc + 1) })} className="hb" style={{ width: 40, height: 40, borderRadius: 12, background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 19, fontWeight: 700, color: '#F4F6FA' }}>+</div>
            </div>
            <div style={{ marginTop: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '12px 15px', display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14.5 }}>Bagni</div>
              <div onClick={() => setNp({ bagni: Math.max(1, np.bagni - 1) })} className="hbg" style={{ width: 40, height: 40, borderRadius: 12, background: '#EDF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 19, fontWeight: 700, color: '#5B6376' }}>−</div>
              <div style={{ width: 44, textAlign: 'center', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 19 }}>{np.bagni}</div>
              <div onClick={() => setNp({ bagni: Math.min(5, np.bagni + 1) })} className="hb" style={{ width: 40, height: 40, borderRadius: 12, background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 19, fontWeight: 700, color: '#F4F6FA' }}>+</div>
            </div>
            <div style={{ marginTop: 18, fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2' }}>Caratteristiche</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 9 }}>
              {Object.keys(np.extras).map(t => {
                const sel = np.extras[t]
                return (
                  <div key={t} onClick={() => setNp({ extras: { ...np.extras, [t]: !sel } })} className="hbg2" style={{ padding: '10px 15px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: sel ? '#EAF0FD' : '#fff', color: sel ? '#3C5BAA' : '#485062', border: sel ? '1px solid #B2C5F6' : '1px solid #DFE4EF', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {sel && <Icon d={ICONS.check} size={13} stroke="#3C5BAA" sw={2.8} />}
                    {t}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 16, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14.5 }}>
              <span style={{ color: '#666E82' }}>Classe energetica</span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <select value={np.cls} onChange={e => setNp({ cls: e.target.value })} style={{ appearance: 'none', WebkitAppearance: 'none', border: 'none', background: 'transparent', fontWeight: 800, color: '#8A6E24', fontSize: 14.5, fontFamily: 'inherit', cursor: 'pointer', outline: 'none', paddingRight: 17, textAlignLast: 'right' }}>
                  {['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A6E24" strokeWidth="2.4" strokeLinecap="round" style={{ position: 'absolute', right: 0, pointerEvents: 'none' }}><path d="M6 9.5 12 15.5 18 9.5" /></svg>
              </div>
            </div>
            <div style={{ marginTop: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14.5 }}>
              <span style={{ color: '#666E82' }}>Spese condominiali</span>
              <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 2, fontWeight: 700 }}>
                <span>€</span>
                <input value={np.spese} onChange={e => setNp({ spese: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" style={{ width: 46, border: 'none', outline: 'none', background: 'transparent', font: 'inherit', color: '#15181F', textAlign: 'right', padding: 0 }} />
                <span>/mese</span>
              </div>
            </div>
          </div>
        )}

        {np.step === 3 && (
          <div style={{ padding: isDesktop ? '20px 0 0' : '20px 20px 0', animation: 'fadeUp .35s ease both' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ height: 120, borderRadius: 15, overflow: 'hidden', position: 'relative' }}>
                <Placeholder label="Soggiorno" tone="blue" style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#537EEC', color: '#fff', fontSize: 10, fontWeight: 800, borderRadius: 99, padding: '3px 8px', pointerEvents: 'none' }}>COPERTINA</div>
              </div>
              <div style={{ height: 120, borderRadius: 15, overflow: 'hidden' }}><Placeholder label="Cucina" tone="warm" style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
              <div style={{ height: 120, borderRadius: 15, overflow: 'hidden' }}><Placeholder label="Terrazzo" tone="grey" style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
              <div onClick={() => toast('Puoi aggiungere fino a 12 foto')} className="hbg2" style={{ height: 120, borderRadius: 15, border: '2px dashed #C6CEE0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer', background: 'rgba(255,255,255,.5)', boxSizing: 'border-box' }}>
                <Icon d={ICONS.plus} size={22} stroke="#979EB2" sw={2} />
                <div style={{ fontSize: 11.5, fontWeight: 700, color: '#979EB2' }}>Aggiungi foto</div>
              </div>
            </div>
            <div onClick={() => setNp({ ai: !np.ai })} className="hb" style={{ marginTop: 16, background: 'linear-gradient(120deg,#2A1F71,#4B39C8)', borderRadius: 18, padding: '15px 16px', display: 'flex', alignItems: 'center', gap: 13, cursor: 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon d={ICONS.spark} size={21} fill="#fff" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Migliora le foto con AI</div>
                <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.72)', marginTop: 1 }}>Luce, prospettiva e cielo · 2 crediti</div>
              </div>
              <div style={{ width: 50, height: 30, borderRadius: 99, background: np.ai ? '#A2B9F5' : 'rgba(255,255,255,.25)', position: 'relative', flex: 'none', transition: 'background .2s' }}>
                <div style={{ position: 'absolute', top: 3, left: np.ai ? 23 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 2px 6px rgba(0,0,0,.25)' }} />
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center', background: '#FBF1DC', borderRadius: 14, padding: '12px 14px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8A6E24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5h3.2l1.9-2.5h5.8l1.9 2.5H20a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5ZM12 17a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z" /></svg>
              <div style={{ fontSize: 12.5, color: '#8A6E24', lineHeight: 1.45, fontWeight: 500 }}>Annunci con <b>10+ foto</b> ricevono il doppio delle richieste. Ne mancano 7.</div>
            </div>
          </div>
        )}

        {np.step === 4 && (
          <div style={{ padding: isDesktop ? '20px 0 0' : '20px 20px 0', animation: 'fadeUp .35s ease both' }}>
            <div style={{ background: '#fff', border: '1.5px solid #537EEC', borderRadius: 17, padding: '15px 16px' }}>
              <div style={{ fontSize: 11, color: '#979EB2', fontWeight: 700 }}>Prezzo richiesto</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 2 }}>
                <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 29, letterSpacing: '-.7px', color: '#3C5BAA' }}>€</span>
                <input
                  value={np.price}
                  onChange={e => setNp({ price: e.target.value })}
                  placeholder={np.type === 'Affitto' ? '1.200' : '350.000'}
                  style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 29, letterSpacing: '-.7px', color: '#3C5BAA', padding: 0 }}
                />
                {np.type === 'Affitto' && <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16, color: '#3C5BAA' }}>/mese</span>}
              </div>
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 10, alignItems: 'center', background: '#EFECFF', borderRadius: 14, padding: '12px 14px' }}>
              <Icon d={ICONS.spark} size={17} fill="#6E56F8" />
              <div style={{ fontSize: 12.5, color: '#4B39C8', lineHeight: 1.45, fontWeight: 500 }}>Stima AI per la zona: <b>€ 470–510K</b>. Sei nel range giusto per vendere in 45 giorni.</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0 8px' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Testo annuncio</div>
              <div onClick={() => toast('Copy AI: nuova versione generata')} className="hb" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFECFF', borderRadius: 99, padding: '7px 12px', cursor: 'pointer' }}>
                <Icon d={ICONS.spark} size={13} fill="#6E56F8" />
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#4B39C8' }}>Copy AI</span>
              </div>
            </div>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: 15, fontSize: 13.5, lineHeight: 1.6, color: '#3A4152' }}>
              {title} di {np.m2 || 90} m² in {np.addr || np.zone || 'Milano'}. {np.loc} locali, {np.bagni} bagni{extrasOn.length ? ', ' + extrasOn.join(', ').toLowerCase() : ''}. {np.type === 'Affitto' ? 'Disponibile da subito.' : 'Visite su appuntamento.'}{np.ai ? ' Foto migliorate con AI.' : ''}
            </div>
            <div style={{ marginTop: 14, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ padding: '11px 15px', background: '#F4F6FA', borderBottom: '1px solid #E8EBF4', fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8A91A6' }}>Riepilogo</div>
              <div style={{ padding: '6px 15px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5, borderBottom: '1px solid #F0F3F9' }}><span style={{ color: '#666E82' }}>Tipologia</span><span style={{ fontWeight: 700 }}>{np.tipo} · {np.type}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5, borderBottom: '1px solid #F0F3F9' }}><span style={{ color: '#666E82' }}>Indirizzo</span><span style={{ fontWeight: 700 }}>{np.addr || '—'}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5, borderBottom: '1px solid #F0F3F9' }}><span style={{ color: '#666E82' }}>Dimensioni</span><span style={{ fontWeight: 700 }}>{np.m2 || 90} m² · {np.loc} locali · {np.bagni} bagni</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5, borderBottom: '1px solid #F0F3F9' }}><span style={{ color: '#666E82' }}>Prezzo</span><span style={{ fontWeight: 700, color: '#3C5BAA' }}>{priceLabel}</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 13.5 }}><span style={{ color: '#666E82' }}>Foto</span><span style={{ fontWeight: 700 }}>3{np.ai ? ' + migliorate con AI' : ''}</span></div>
              </div>
            </div>
          </div>
        )}

        {np.step === 5 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 22px', textAlign: 'center' }}>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'popIn .5s cubic-bezier(.2,1.4,.4,1) both', boxShadow: '0 18px 44px rgba(83,126,236,.35)' }}>
              <Icon d={ICONS.check} size={42} stroke="#F4F6FA" sw={2.6} />
            </div>
            <div style={{ marginTop: 20, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 25, letterSpacing: '-.7px' }}>Immobile pubblicato!</div>
            <div style={{ marginTop: 8, fontSize: 14.5, color: '#666E82', lineHeight: 1.55, maxWidth: 300 }}>Il {title.toLowerCase()} è ora <b style={{ color: '#3A4152' }}>{np.type === 'Affitto' ? 'in affitto' : 'in vendita'}</b> e visibile sul tuo profilo.</div>

            {/* Pubblicato ≠ promosso: come farsi trovare (con l'AI) */}
            <div style={{ marginTop: 18, width: '100%', textAlign: 'left', background: '#EFECFF', border: '1px solid #E0DAFB', borderRadius: 16, padding: '14px 15px', display: 'flex', gap: 11 }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={ICONS.spark} size={19} fill="#6E56F8" /></div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 14, color: '#3A2E9E' }}>Ora promuovilo con l'AI</div>
                <div style={{ fontSize: 12.5, color: '#5B4FA8', lineHeight: 1.5, marginTop: 2 }}>Pubblicarlo lo rende visibile sul profilo. Per ricevere richieste crea dei <b>post</b>: con l'AI scrivi il testo, migliori le foto e crei video con l'<b>home staging</b>.</div>
              </div>
            </div>

            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <div onClick={() => nav('composer')} className="hb" style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                <Icon d={ICONS.spark} size={17} fill="#fff" />
                Crea un post con l'AI
              </div>
              <div onClick={() => nav('videoai')} className="hb" style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'linear-gradient(120deg,#4B39C8,#6E56F8)', color: '#fff', borderRadius: 15, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
                <Icon d={ICONS.vid} size={18} stroke="#fff" sw={1.9} />
                Genera un reel · Home staging
              </div>
              <div onClick={() => openProp(np.createdId)} className="hbg2" style={{ minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 15, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Vedi l'annuncio sul profilo</div>
            </div>
          </div>
        )}

        {np.step < 5 && (
          <>
            <div style={{ flex: 1 }} />
            <div style={{ padding: isDesktop ? '20px 0 0' : '20px 20px 0' }}>
              <div onClick={next} className="hb" style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>{np.step < 4 ? 'Continua' : 'Pubblica immobile'}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import Modal from '../../components/Modal.jsx'

const TAGS = ['In vendita', 'In affitto', 'Bozza', 'Venduto']
const CLASSES = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G']

const LABEL = { fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2' }
const FIELD = { width: '100%', boxSizing: 'border-box', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '12px 14px', fontSize: 14.5, fontWeight: 600, color: '#15181F', outline: 'none', fontFamily: 'inherit' }

function Field({ label, children, style }) {
  return (
    <div style={{ ...style }}>
      <div style={{ ...LABEL, marginBottom: 7 }}>{label}</div>
      {children}
    </div>
  )
}

// Modale di modifica immobile: precompila i campi dell'immobile e li aggiorna nello store.
// Montato sopra il dettaglio (zIndex 100 del Modal > 90 del Drawer).
export default function EditPropertyModal({ prop, open, onClose }) {
  const { updateProperty } = useApp()
  const [f, setF] = useState({
    t: prop.t, tag: prop.tag, price: prop.price, zone: prop.zone,
    m2: String(prop.m2), pi: prop.pi === '—' ? '' : String(prop.pi).replace('°', ''),
    loc: prop.loc, ba: prop.ba, cls: prop.cls, desc: prop.desc,
  })
  const set = patch => setF(prev => ({ ...prev, ...patch }))
  const num = (key, min, max) => (
    <div style={{ display: 'flex', alignItems: 'center', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '6px 8px 6px 14px' }}>
      <div style={{ flex: 1, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 18 }}>{f[key]}</div>
      <div onClick={() => set({ [key]: Math.max(min, f[key] - 1) })} className="hbg" style={{ width: 34, height: 34, borderRadius: 10, background: '#EDF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#5B6376' }}>−</div>
      <div onClick={() => set({ [key]: Math.min(max, f[key] + 1) })} className="hb" style={{ width: 34, height: 34, borderRadius: 10, background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: '#F4F6FA', marginLeft: 6 }}>+</div>
    </div>
  )

  const save = () => {
    if (!f.t.trim()) return
    updateProperty(prop.id, {
      t: f.t.trim(),
      tag: f.tag,
      // Tieni `type` allineato allo stato scelto (Bozza/Venduto conservano il tipo precedente).
      type: f.tag === 'In affitto' ? 'Affitto' : f.tag === 'In vendita' ? 'Vendita' : prop.type,
      price: f.price.trim() || prop.price,
      zone: f.zone.trim() || prop.zone,
      m2: parseInt(f.m2) || prop.m2,
      pi: f.pi.trim() ? f.pi.replace(/[^0-9]/g, '') + '°' : '—',
      loc: f.loc,
      ba: f.ba,
      cls: f.cls,
      desc: f.desc.trim() || prop.desc,
    })
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Modifica immobile" maxWidth={480}>
      <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '66vh', overflowY: 'auto', padding: '2px 2px 4px' }}>
        <Field label="Titolo">
          <input value={f.t} onChange={e => set({ t: e.target.value })} style={FIELD} />
        </Field>

        <Field label="Stato">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TAGS.map(t => {
              const a = f.tag === t
              return (
                <div key={t} onClick={() => set({ tag: t })} className={a ? '' : 'hbg2'} style={{ padding: '9px 14px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: a ? '#15181F' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #15181F' : '1px solid #DFE4EF' }}>{t}</div>
              )
            })}
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Prezzo" style={{ flex: 1.3 }}>
            <input value={f.price} onChange={e => set({ price: e.target.value })} placeholder="€ 350.000" style={FIELD} />
          </Field>
          <Field label="Classe en." style={{ flex: 1 }}>
            <div style={{ position: 'relative' }}>
              <select value={f.cls} onChange={e => set({ cls: e.target.value })} style={{ ...FIELD, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer', paddingRight: 30 }}>
                {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8A91A6" strokeWidth="2.4" strokeLinecap="round" style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}><path d="M6 9.5 12 15.5 18 9.5" /></svg>
            </div>
          </Field>
        </div>

        <Field label="Zona">
          <input value={f.zone} onChange={e => set({ zone: e.target.value })} placeholder="Quartiere · Città" style={FIELD} />
        </Field>

        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Superficie (m²)" style={{ flex: 1 }}>
            <input value={f.m2} onChange={e => set({ m2: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" style={FIELD} />
          </Field>
          <Field label="Piano" style={{ flex: 1 }}>
            <input value={f.pi} onChange={e => set({ pi: e.target.value.replace(/[^0-9]/g, '') })} inputMode="numeric" placeholder="es. 3" style={FIELD} />
          </Field>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Field label="Locali" style={{ flex: 1 }}>{num('loc', 1, 9)}</Field>
          <Field label="Bagni" style={{ flex: 1 }}>{num('ba', 1, 5)}</Field>
        </div>

        <Field label="Descrizione">
          <textarea value={f.desc} onChange={e => set({ desc: e.target.value })} rows={4} style={{ ...FIELD, resize: 'vertical', lineHeight: 1.5, fontWeight: 500 }} />
        </Field>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <div onClick={onClose} className="hbg2" style={{ flex: 1, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Annulla</div>
        <div onClick={save} className="hb" style={{ flex: 1.4, minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Salva modifiche</div>
      </div>
    </Modal>
  )
}

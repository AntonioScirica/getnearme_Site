import { useApp } from '../store/store.jsx'
import { ICONS } from '../data/seed.js'
import Icon from './Icon.jsx'
import Modal from './Modal.jsx'
import Placeholder from './Placeholder.jsx'

// Selettore immobile per il composer: lista scegliibile degli immobili dell'utente.
// Riusa il Modal condiviso (bottom-sheet mobile / card centrata desktop).
export default function PropertyPickerModal({ open, onClose, selectedId, onPick }) {
  const { d } = useApp()
  const list = d.props
  return (
    <Modal open={open} onClose={onClose} title="Scegli un immobile">
      {list.length === 0 ? (
        <div style={{ fontSize: 13, color: '#8A91A6', padding: '8px 6px' }}>Non hai ancora immobili da allegare al post.</div>
      ) : (
        <div className="no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 360, overflowY: 'auto' }}>
          {list.map(p => {
            const sel = p.id === selectedId
            return (
              <div key={p.id} onClick={() => { onPick(p.id); onClose() }} className="hbd" style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', border: sel ? '1.5px solid #537EEC' : '1px solid #DFE4EF', borderRadius: 14, padding: 10, cursor: 'pointer' }}>
                <div style={{ width: 64, height: 50, borderRadius: 10, overflow: 'hidden', flex: 'none' }}>
                  <Placeholder label="Foto" tone={p.id % 2 === 0 ? 'warm' : 'blue'} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.t}</div>
                  <div style={{ fontSize: 12, color: '#666E82' }}>{p.zone}</div>
                </div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 14, color: '#3C5BAA', flex: 'none' }}>{p.price}</div>
                {sel && <Icon d={ICONS.check} size={16} stroke="#537EEC" sw={2.6} />}
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

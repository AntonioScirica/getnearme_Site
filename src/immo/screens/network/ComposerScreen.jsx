import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, COPYTEXTS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Avatar from '../../components/Avatar.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import PropertyPickerModal from '../../components/PropertyPickerModal.jsx'

const CHIP_DEFS = [
  { t: 'Foto', d: ICONS.cam },
  { t: 'Immobile', d: ICONS.build },
  { t: 'Reel', d: 'M3.5 6.5h12.5v11H3.5v-11ZM16 10.5l4.5-2.5v8L16 13.5' },
]

export default function ComposerScreen() {
  const { d, ui, setUi, back, toast, publishPost, isDesktop } = useApp()
  const [attachId, setAttachId] = useState(d.props[0] ? d.props[0].id : null)
  const [chips, setChips] = useState({ Foto: false, Reel: false })
  const [pickerOpen, setPickerOpen] = useState(false)
  const pr = attachId ? d.props.find(p => p.id === attachId) : null

  const chipOn = t => (t === 'Immobile' ? !!attachId : !!chips[t])
  const toggleChip = t => {
    if (t === 'Immobile') { setPickerOpen(true); return }
    setChips(c => ({ ...c, [t]: !c[t] }))
  }

  const doPublish = () => publishPost(ui.postText, pr ? { propId: pr.id } : {})
  const genCopy = () => { setUi({ postText: COPYTEXTS['Post social'] }); toast('Testo generato con Copy AI') }

  const cardStyle = isDesktop
    ? { maxWidth: 560, margin: '24px auto 48px', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 22, padding: '4px 0 22px', boxSizing: 'border-box' }
    : { minHeight: '100%', boxSizing: 'border-box', padding: '12px 0 30px' }

  const publishBtn = (
    <div onClick={doPublish} className="hb" style={{ background: '#537EEC', color: '#F4F6FA', fontSize: 13.5, fontWeight: 700, borderRadius: 99, padding: '11px 18px', cursor: 'pointer' }}>Pubblica</div>
  )

  return (
    <div style={cardStyle}>
      {/* Il composer usa insetti da 20px sul corpo: allinea l'header a quelli su desktop */}
      <div style={{ padding: isDesktop ? '0 20px' : 0 }}>
        <PageHeader title="Nuovo post" onBack={back} right={publishBtn} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 20px 0' }}>
        <Avatar ini={d.session.ini} c="#DDE5FB" size={42} fs={13.5} col="#3C5BAA" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14 }}>{d.session.name}</div>
          <div onClick={() => toast('Visibile a tutta la community')} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 99, padding: '3px 10px', fontSize: 11.5, fontWeight: 600, color: '#5B6376', cursor: 'pointer', marginTop: 2 }}>
            Pubblico · Tutta la community
            <Icon d="M6 9.5 12 15.5 18 9.5" size={10} stroke="#5B6376" sw={2.6} />
          </div>
        </div>
      </div>

      <textarea
        value={ui.postText}
        onChange={e => setUi({ postText: e.target.value })}
        placeholder="Racconta qualcosa al tuo network: un incarico, una vendita, un consiglio di zona..."
        style={{ margin: '14px 20px 0', minHeight: 150, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: 16, fontSize: 15, lineHeight: 1.55, color: '#15181F', resize: 'none', outline: 'none', boxSizing: 'border-box', width: 'calc(100% - 40px)', fontFamily: 'inherit' }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px 0' }}>
        <div onClick={genCopy} className="hb" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EFECFF', borderRadius: 99, padding: '8px 13px', cursor: 'pointer' }}>
          <Icon d={ICONS.spark} size={14} fill="#6E56F8" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#4B39C8' }}>Scrivi con Copy AI</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11.5, color: '#979EB2', fontWeight: 600 }}>{ui.postText.length}/1.500</div>
      </div>

      {pr && (
        <div style={{ margin: '16px 20px 0', border: '1px solid #DFE4EF', borderRadius: 16, overflow: 'hidden', background: '#fff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: '#F4F6FA', borderBottom: '1px solid #E8EBF4' }}>
            <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: '#8A91A6' }}>Allegato · Immobile</span>
            <div style={{ flex: 1 }} />
            <div onClick={() => setPickerOpen(true)} style={{ fontSize: 12, fontWeight: 700, color: '#3C5BAA', cursor: 'pointer' }}>Cambia</div>
            <div onClick={() => setAttachId(null)} style={{ fontSize: 12, fontWeight: 700, color: '#B03B22', cursor: 'pointer' }}>Rimuovi</div>
          </div>
          <div style={{ display: 'flex', gap: 12, padding: 12, alignItems: 'center' }}>
            <div style={{ width: 74, height: 58, borderRadius: 11, overflow: 'hidden', flex: 'none' }}><Placeholder label="Foto" tone="blue" style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{pr.t}</div>
              <div style={{ fontSize: 12, color: '#666E82' }}>{pr.zone}</div>
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 14.5, color: '#3C5BAA' }}>{pr.price}</div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 9, padding: '14px 20px 0', flexWrap: 'wrap' }}>
        {CHIP_DEFS.map(c => {
          const on = chipOn(c.t)
          return (
            <div key={c.t} onClick={() => toggleChip(c.t)} className="hbg2" style={{ display: 'flex', alignItems: 'center', gap: 7, background: on ? '#EAF0FD' : '#fff', border: on ? '1px solid #B2C5F6' : '1px solid #DFE4EF', borderRadius: 13, padding: '11px 14px', fontSize: 13, fontWeight: 600, color: on ? '#3C5BAA' : '#3A4152', cursor: 'pointer' }}>
              <Icon d={c.d} size={17} stroke={on ? '#3C5BAA' : '#3A4152'} sw={1.8} />
              {c.t}
            </div>
          )
        })}
      </div>

      <div style={{ margin: '14px 20px 0', display: 'flex', gap: 10, alignItems: 'center', background: '#EAF0FD', borderRadius: 14, padding: '12px 14px' }}>
        <Icon d={ICONS.trend} size={18} stroke="#3C5BAA" sw={1.8} />
        <div style={{ fontSize: 12.5, color: '#3C5BAA', lineHeight: 1.45, fontWeight: 500 }}>I post con un immobile allegato generano in media <b>3× più lead</b>.</div>
      </div>
      <PropertyPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} selectedId={attachId} onPick={setAttachId} />
    </div>
  )
}

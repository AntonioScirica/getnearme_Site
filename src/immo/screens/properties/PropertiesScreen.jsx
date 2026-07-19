import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PropertyCard from '../../components/cards/PropertyCard.jsx'

const CHIP_TAGS = ['Tutti', 'In vendita', 'In affitto', 'Bozza', 'Venduto']
const TONES = ['blue', 'warm', 'grey']

export default function PropertiesScreen() {
  const { d, ui, setUi, nav, isDesktop } = useApp()
  const [q, setQ] = useState('')
  const isPrivato = d.session.persona === 'privato'

  // Il privato sfoglia solo gli annunci pubblici (niente bozze).
  const catalog = isPrivato ? d.props.filter(p => p.tag !== 'Bozza') : d.props
  const chipTags = isPrivato ? CHIP_TAGS.filter(t => t !== 'Bozza') : CHIP_TAGS
  const chipFiltered = catalog.filter(p => ui.propChip === 'Tutti' || p.tag === ui.propChip)
  const query = q.trim().toLowerCase()
  const list = query ? chipFiltered.filter(p => (p.t + ' ' + p.zone).toLowerCase().includes(query)) : chipFiltered

  const newBtn = (
    <div onClick={() => nav('newprop')} className="hb" style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#537EEC', color: '#F4F6FA', borderRadius: isDesktop ? 11 : 99, padding: isDesktop ? '10px 16px' : '11px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: 'none' }}>
      <Icon d={ICONS.plus} size={15} stroke="#F4F6FA" sw={2.4} />Nuovo immobile
    </div>
  )

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 48px' : '0 0 118px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title={isPrivato ? 'Esplora immobili' : 'Immobili'} onBack={null} right={isPrivato ? null : newBtn} />

      {/* Ricerca */}
      <div style={{ margin: isDesktop ? '14px 0 0' : '0 20px', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '13px 15px', maxWidth: isDesktop ? 420 : 'none' }}>
        <Icon d={ICONS.search} size={18} stroke="#979EB2" sw={1.9} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Cerca per zona, indirizzo, cliente..."
          style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, color: '#15181F', fontFamily: 'inherit' }}
        />
      </div>

      {/* Chip filtri */}
      <div className="no-scrollbar" style={{ display: 'flex', gap: 8, overflowX: 'auto', margin: isDesktop ? '14px 0 0' : '12px 0 0', padding: isDesktop ? 0 : '0 20px' }}>
        {chipTags.map(t => {
          const n = t === 'Tutti' ? catalog.length : catalog.filter(p => p.tag === t).length
          const a = ui.propChip === t
          return (
            <div key={t} onClick={() => setUi({ propChip: t })} className={a ? '' : 'hbg2'} style={{ flex: 'none', padding: '9px 15px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: a ? '#15181F' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #15181F' : '1px solid #DFE4EF' }}>{t} · {n}</div>
          )
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', margin: isDesktop ? '14px 0 0' : '10px 20px 0' }}>
        <div style={{ fontSize: 12.5, color: '#8A91A6', fontWeight: 600 }}>{list.length} immobili · aggiornato ora</div>
      </div>

      {/* Griglia fluida */}
      {list.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14, margin: isDesktop ? '14px 0 0' : '12px 20px 0' }}>
          {list.map((p, i) => <PropertyCard key={p.id} p={p} tone={TONES[i % TONES.length]} />)}
        </div>
      ) : (
        <div style={{ margin: isDesktop ? '14px 0 0' : '12px 20px 0' }}>
          <EmptyState icon={ICONS.build} title="Nessun immobile trovato" sub="Prova a modificare la ricerca o i filtri applicati." />
        </div>
      )}
    </div>
  )
}

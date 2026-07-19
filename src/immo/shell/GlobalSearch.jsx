import { useMemo, useState } from 'react'
import { useApp } from '../store/store.jsx'
import { ICONS } from '../data/seed.js'
import Icon from '../components/Icon.jsx'

// Ricerca globale (topbar desktop): immobili, lead, contatti
export default function GlobalSearch() {
  const { d, openProp, openLead, nav } = useApp()
  const [q, setQ] = useState('')
  const results = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return null
    const props = d.props.filter(p => (p.t + ' ' + p.zone).toLowerCase().includes(s)).slice(0, 4)
    const leads = d.leads.filter(l => l.n.toLowerCase().includes(s)).slice(0, 4)
    const contacts = d.contacts.filter(c => c.n.toLowerCase().includes(s)).slice(0, 4)
    return { props, leads, contacts, empty: !props.length && !leads.length && !contacts.length }
  }, [q, d])

  const rowStyle = { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: 'pointer' }

  return (
    <div style={{ flex: 'none', width: 380, maxWidth: '40vw', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 12, padding: '10px 14px' }}>
        <Icon d={ICONS.search} size={17} stroke="#979EB2" sw={1.9} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cerca immobili, contatti, agenti..." style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13.5, color: '#15181F', minWidth: 0 }} />
        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#979EB2', background: '#EDF0F7', borderRadius: 6, padding: '2px 7px' }}>⌘K</span>
      </div>
      {results && (
        <div style={{ position: 'absolute', top: 46, left: 0, right: 0, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 14, boxShadow: '0 24px 60px rgba(24,29,26,.18)', padding: 8, zIndex: 70, maxHeight: 380, overflowY: 'auto' }}>
          {results.empty && <div style={{ padding: '12px 10px', fontSize: 13, color: '#8A91A6' }}>Nessun risultato per “{q}”</div>}
          {results.props.length > 0 && <GroupLabel t="Immobili" />}
          {results.props.map(p => (
            <div key={p.id} className="hbg2" onClick={() => { setQ(''); openProp(p.id) }} style={rowStyle}>
              <Icon d={ICONS.build} size={16} stroke="#3C5BAA" /><span style={{ fontWeight: 600, fontSize: 13 }}>{p.t}</span><span style={{ fontSize: 11.5, color: '#8A91A6' }}>{p.zone}</span>
            </div>
          ))}
          {results.leads.length > 0 && <GroupLabel t="Lead" />}
          {results.leads.map(l => (
            <div key={l.id} className="hbg2" onClick={() => { setQ(''); openLead(l.id) }} style={rowStyle}>
              <Icon d={ICONS.funnel} size={16} stroke="#B03B22" /><span style={{ fontWeight: 600, fontSize: 13 }}>{l.n}</span><span style={{ fontSize: 11.5, color: '#8A91A6' }}>{l.stage}</span>
            </div>
          ))}
          {results.contacts.length > 0 && <GroupLabel t="Contatti" />}
          {results.contacts.map(c => (
            <div key={c.n} className="hbg2" onClick={() => { setQ(''); nav('crm', { crmTab: 'contatti' }) }} style={rowStyle}>
              <Icon d={ICONS.user} size={16} stroke="#2E5C8A" /><span style={{ fontWeight: 600, fontSize: 13 }}>{c.n}</span><span style={{ fontSize: 11.5, color: '#8A91A6' }}>{c.tag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function GroupLabel({ t }) {
  return <div style={{ padding: '8px 10px 4px', fontSize: 10.5, fontWeight: 800, letterSpacing: '.08em', textTransform: 'uppercase', color: '#979EB2' }}>{t}</div>
}

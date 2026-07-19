import { useApp } from '../../store/store.jsx'
import { TAGSTYLE } from '../../data/seed.js'
import Placeholder from '../Placeholder.jsx'

// Card immobile per griglie (Immobili, Profilo). API: <PropertyCard p={prop} tone="blue" />
export default function PropertyCard({ p, tone = 'blue' }) {
  const { d, isDesktop, openProp } = useApp()
  const isPrivato = d.session.persona === 'privato'
  const [tagBg, tagCol] = TAGSTYLE[p.tag] || ['#EDF0F7', '#3A4152']
  const nl = d.leads.filter(l => l.propId === p.id).length
  const leadCol = nl > 0 ? '#3C5BAA' : '#979EB2'
  const savedP = !!d.savedProps[p.id]

  return (
    <div onClick={() => openProp(p.id)} className="hsh" style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 20, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 16px rgba(24,29,26,.04)' }}>
      <div style={{ height: isDesktop ? 170 : 172, position: 'relative' }}>
        <Placeholder label={'Foto · ' + p.t} tone={tone} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
        <div style={{ position: 'absolute', top: 12, left: 12, background: tagBg, color: tagCol, fontSize: isDesktop ? 10.5 : 11, fontWeight: 800, letterSpacing: '.04em', borderRadius: 99, padding: '5px 11px', pointerEvents: 'none' }}>{p.tag}</div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(24,29,26,.55)', backdropFilter: 'blur(4px)', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 99, padding: '5px 10px', display: 'flex', alignItems: 'center', gap: 5, pointerEvents: 'none' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" /></svg>
          {p.views}
        </div>
      </div>
      <div style={{ padding: '13px 15px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 18 : 19, letterSpacing: '-.4px', color: '#3C5BAA' }}>{p.price}</div>
          <div style={{ flex: 1 }} />
          <div style={{ fontSize: isDesktop ? 10.5 : 11, fontWeight: 800, color: '#8A6E24', background: '#FBF1DC', borderRadius: 7, padding: '3px 7px' }}>Classe {p.cls}</div>
        </div>
        <div style={{ marginTop: 3, fontWeight: 700, fontSize: isDesktop ? 14.5 : 15 }}>{p.t}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2, color: '#666E82', fontSize: 12.5 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#666E82" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21.5s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11ZM12 12.7a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z" /></svg>
          {p.zone}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 10 : 14, marginTop: 10, paddingTop: 10, borderTop: '1px solid #EDF0F7', fontSize: isDesktop ? 12 : 12.5, fontWeight: 600, color: '#3A4152' }}>
          <span>{p.m2} m²</span><span style={{ color: '#C6CEE0' }}>·</span><span>{p.loc} {isDesktop ? 'loc' : 'locali'}</span><span style={{ color: '#C6CEE0' }}>·</span><span>{p.ba} bagni</span>
          <div style={{ flex: 1 }} />
          {isPrivato ? (
            savedP && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#3C5BAA', fontWeight: 800 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="#3C5BAA" stroke="#3C5BAA" strokeWidth="1.6"><path d="M6.5 20.5V4.7a1.2 1.2 0 0 1 1.2-1.2h8.6a1.2 1.2 0 0 1 1.2 1.2v15.8L12 16.6l-5.5 3.9Z" /></svg>Salvato
              </span>
            )
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: leadCol, fontWeight: 800 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: leadCol }} />{nl} lead
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

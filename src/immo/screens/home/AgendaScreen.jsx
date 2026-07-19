import { useApp } from '../../store/store.jsx'
import PageHeader from '../../components/PageHeader.jsx'

// Agenda responsive (fusione mobile Agenda — chiusura del link "Calendario" in Home)
export default function AgendaScreen() {
  const { d, isDesktop } = useApp()

  return (
    <div style={{ maxWidth: isDesktop ? 640 : '100%', margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 40px' : '0 0 40px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="Agenda" subtitle={'Venerdì 17 luglio · ' + d.agenda.length + ' impegni'} />
      <div style={{ margin: isDesktop ? '10px 0 0' : '0 20px', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, overflow: 'hidden' }}>
        {d.agenda.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 13, padding: '14px 16px', borderBottom: i < d.agenda.length - 1 ? '1px solid #EDF0F7' : 'none', alignItems: 'center' }}>
            <div style={{ width: 52, flex: 'none', textAlign: 'center', background: a.hbg, borderRadius: 11, padding: '7px 0' }}>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: a.hc }}>{a.h}</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{a.t}</div>
              <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 1 }}>{a.d}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ margin: isDesktop ? '14px 0 0' : '14px 20px 0', padding: '12px 14px', borderRadius: 14, background: '#EAF0FD', fontSize: 12.5, color: '#3C5BAA', lineHeight: 1.45, fontWeight: 500 }}>
        Le visite pianificate dai lead compaiono qui automaticamente.
      </div>
    </div>
  )
}

import { useApp } from '../../store/store.jsx'
import { ICONS, TEAM } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import PageHeader from '../../components/PageHeader.jsx'

const ACTIVITY = [
  { who: 'Giulia', txt: 'ha chiuso la trattativa del villino Monteverde', time: '2 h fa', d: ICONS.check, ibg: '#EAF0FD', ic: '#3C5BAA' },
  { who: 'Marco', txt: 'ha generato 3 reel con AI Studio', time: '5 h fa', d: ICONS.spark, ibg: '#EFECFF', ic: '#6E56F8', fill: true },
  { who: 'Sara', txt: 'ha pubblicato il quadrilocale CityLife', time: 'Ieri', d: ICONS.build, ibg: '#FBF1DC', ic: '#8A6E24' },
  { who: 'Federico', txt: 'ha assegnato 2 lead a Marco', time: 'Ieri', d: ICONS.user, ibg: '#E4EDF7', ic: '#2E5C8A' },
]

export default function AgencyScreen() {
  const { toast, isDesktop } = useApp()

  const team = TEAM.map((m, i) => ({
    ...m,
    bb: i < TEAM.length - 1 ? '1px solid #F0F3F9' : 'none',
    w: m.pct + '%',
    role2: m.role.split(' ')[0],
    roleBg: i === 0 ? '#EAF0FD' : '#EDF0F7',
    roleCol: i === 0 ? '#3C5BAA' : '#5B6376',
  }))

  const inviteBtn = (
    <div className="hb" onClick={() => toast('Invito inviato via email')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#537EEC', color: '#F4F6FA', borderRadius: isDesktop ? 11 : 99, padding: isDesktop ? '10px 16px' : '10px 15px', fontSize: isDesktop ? 13 : 12.5, fontWeight: 700, cursor: 'pointer', flex: 'none' }}>
      <Icon d={ICONS.plus} size={isDesktop ? 14 : 14} stroke="#F4F6FA" sw={2.4} />{isDesktop ? 'Invita un agente' : 'Invita'}
    </div>
  )

  return (
    <div style={{ maxWidth: isDesktop ? 760 : 'none', margin: isDesktop ? '0 auto' : 0, width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 48px' : '0 0 40px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="Agenzia" right={inviteBtn} />

      {/* Card scura agenzia */}
      <div style={{ margin: isDesktop ? '14px 0 0' : '14px 20px 0', background: 'linear-gradient(150deg,#16213D,#3C5BAA)', borderRadius: isDesktop ? 24 : 22, padding: isDesktop ? 22 : 18, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 16 : 13, position: 'relative' }}>
          <div style={{ width: isDesktop ? 62 : 54, height: isDesktop ? 62 : 54, borderRadius: isDesktop ? 18 : 16, overflow: 'hidden', flex: 'none', background: '#F4F6FA' }}>
            <Placeholder label="Logo" style={{ width: '100%', height: '100%', borderRadius: 0 }} tone="grey" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 22 : 19, color: '#F4F6FA', letterSpacing: '-.4px' }}>Aurora Immobiliare</div>
            <div style={{ fontSize: isDesktop ? 13 : 12, color: 'rgba(255,255,255,.72)', marginTop: 1 }}>{isDesktop ? 'Milano · 6 agenti · su Agente Immo dal 2019 · piano Agency' : 'Milano · 6 agenti · dal 2019'}</div>
          </div>
          <div onClick={() => toast("Logo e colori dell'agenzia")} style={{ background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 11, padding: '8px 12px', fontSize: 11.5, fontWeight: 700, color: '#F4F6FA', cursor: 'pointer', flex: 'none' }}>Branding</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 15, position: 'relative' }}>
          {[['34', 'IMMOBILI', '#F4F6FA'], ['87', 'LEAD ATTIVI', '#F4F6FA'], ['€ 9,2M', 'PIPELINE', '#A2B9F5']].map(([v, l, c]) => (
            <div key={l} style={{ flex: 1, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', borderRadius: 13, padding: '10px 11px' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 18, color: c }}>{v}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', fontWeight: 700 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Team */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isDesktop ? '22px 0 10px' : '22px 20px 10px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-.3px' }}>Team</div>
        <div onClick={() => toast('Ruoli e permessi del team')} style={{ fontSize: 12.5, fontWeight: 600, color: '#537EEC', cursor: 'pointer' }}>Gestisci ruoli</div>
      </div>
      <div style={{ margin: isDesktop ? 0 : '0 20px', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 19, overflow: 'hidden' }}>
        {team.map(m => (
          <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 15px', borderBottom: m.bb }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13.5, color: '#3A4152', flex: 'none' }}>{m.ini}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{m.n}</span>
                <span style={{ background: m.roleBg, color: m.roleCol, fontSize: 9.5, fontWeight: 800, borderRadius: 99, padding: '2.5px 8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>{m.role2}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <div style={{ flex: 1, height: 5, borderRadius: 99, background: '#EDF0F7', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 99, background: '#537EEC', width: m.w }} />
                </div>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: '#8A91A6', flex: 'none' }}>{m.kpi}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attività del team */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isDesktop ? '22px 0 10px' : '22px 20px 10px' }}>
        <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-.3px' }}>Attività del team</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: isDesktop ? 0 : '0 20px' }}>
        {ACTIVITY.map((a, i) => (
          <div key={i} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '12px 14px', display: 'flex', gap: 11, alignItems: 'center' }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: a.ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
              {a.fill ? <Icon d={a.d} size={16} fill={a.ic} /> : <Icon d={a.d} size={16} stroke={a.ic} sw={1.9} />}
            </div>
            <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}><b>{a.who}</b> {a.txt}</div>
            <div style={{ fontSize: 10.5, color: '#979EB2', fontWeight: 600, flex: 'none' }}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

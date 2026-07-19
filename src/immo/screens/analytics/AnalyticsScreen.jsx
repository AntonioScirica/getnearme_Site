import { useState } from 'react'
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList,
} from 'recharts'
import { useApp } from '../../store/store.jsx'
import { ICONS, RANGE_META, SOURCE_META } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import EmptyState from '../../components/EmptyState.jsx'

const RANGES = [['7g', '7 giorni'], ['30g', '30 giorni'], ['90g', '90 giorni']]
const nf = n => n.toLocaleString('it-IT')

// ---- Tooltip condivisi (stile coerente con le card) ----
const TIP_BOX = { background: '#fff', border: '1px solid #DFE4EF', borderRadius: 11, padding: '8px 11px', boxShadow: '0 10px 30px rgba(24,29,26,.14)', fontSize: 12 }
const TIP_TITLE = { fontWeight: 700, color: '#15181F', fontSize: 12.5 }
const TIP_SUB = { color: '#666E82', marginTop: 2 }

function VisitsTip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={TIP_BOX}>
      <div style={TIP_TITLE}>{label}</div>
      <div style={TIP_SUB}><b style={{ color: '#3C5BAA' }}>{nf(payload[0].value)}</b> visite al profilo</div>
    </div>
  )
}

function SourceTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const s = payload[0].payload
  return (
    <div style={TIP_BOX}>
      <div style={{ ...TIP_TITLE, display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ width: 9, height: 9, borderRadius: 3, background: s.c }} />{s.n}
      </div>
      <div style={TIP_SUB}><b style={{ color: '#3A4152' }}>{s.count}</b> lead · {s.v}%</div>
    </div>
  )
}

function PropTip({ active, payload }) {
  if (!active || !payload || !payload.length) return null
  const p = payload[0].payload
  return (
    <div style={TIP_BOX}>
      <div style={TIP_TITLE}>{p.full}</div>
      <div style={TIP_SUB}>{p.zone} · <b style={{ color: '#3C5BAA' }}>{nf(p.views)}</b> visualizzazioni</div>
    </div>
  )
}

export default function AnalyticsScreen() {
  const { d, isDesktop, openProp, nav } = useApp()
  const [range, setRange] = useState('7g')

  const view = RANGE_META[range] || RANGE_META['7g']

  // ---- Metriche DERIVATE da d (indipendenti dall'intervallo: sono lo stato attuale) ----
  const leadCount = d.leads.length
  const hotCount = d.leads.filter(l => l.hot).length
  const viewsTotal = d.props.reduce((a, p) => a + (p.views || 0), 0)
  const reazioni = d.posts.reduce((a, p) => a + (p.likes || 0), 0)
  const topProps = [...d.props].filter(p => p.views > 0).sort((a, b) => b.views - a.views).slice(0, 4)

  // Serie visite (dipende dall'intervallo) → dati per l'AreaChart
  const visitData = view.bars.map((v, i) => ({ label: view.barLabels[i] || String(i + 1), v }))

  // Sorgenti lead: distribuzione reale di d.leads per campo src (donut)
  const srcCounts = d.leads.reduce((m, l) => { m[l.src] = (m[l.src] || 0) + 1; return m }, {})
  const donutSegs = Object.keys(SOURCE_META).filter(k => srcCounts[k]).map(k => ({
    n: SOURCE_META[k].label, c: SOURCE_META[k].c, count: srcCounts[k], v: Math.round(srcCounts[k] / leadCount * 100),
  }))

  // Immobili più visti → barre orizzontali (etichetta accorciata, titolo pieno nel tooltip)
  const propData = topProps.map(p => ({
    id: p.id, full: p.t, name: p.t.length > 17 ? p.t.slice(0, 16) + '…' : p.t,
    zone: p.zone.split(' · ')[0], views: p.views,
  }))

  const kpis = [
    { t: 'Visite al profilo', v: nf(view.profileVisits), badge: view.profileDelta, c: '#3C5BAA', bg: '#EAF0FD', icon: ICONS.trend, arrow: true },
    { t: 'Nuovi lead', v: nf(leadCount), badge: hotCount ? hotCount + ' caldi' : 'nel CRM', c: '#3C5BAA', bg: '#EAF0FD', icon: ICONS.funnel },
    { t: 'Immobili visti', v: nf(viewsTotal), badge: 'totale', c: '#8A6E24', bg: '#FBF1DC', icon: ICONS.build },
    { t: 'Tasso di risposta', v: '92%', badge: 'in 42 min', c: '#4B39C8', bg: '#EFECFF', icon: ICONS.chat },
  ]

  const card = { background: '#fff', border: '1px solid #DFE4EF', borderRadius: isDesktop ? 20 : 19, padding: isDesktop ? 18 : 16, boxSizing: 'border-box' }
  const cardTitle = { fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: isDesktop ? 16 : 15.5, letterSpacing: '-.3px' }
  const span2 = isDesktop ? { gridColumn: 'span 2' } : {}

  const rangeToggle = (
    <div style={{ display: 'flex', background: '#E6EAF3', borderRadius: 12, padding: 3, flex: 'none' }}>
      {RANGES.map(([id, label]) => {
        const a = range === id
        return (
          <div key={id} onClick={() => setRange(id)} style={{ padding: isDesktop ? '8px 14px' : '8px 13px', borderRadius: 9, fontSize: isDesktop ? 12.5 : 12, fontWeight: 700, cursor: 'pointer', background: a ? '#fff' : 'transparent', color: a ? '#15181F' : '#666E82', boxShadow: a ? '0 2px 8px rgba(24,29,26,.08)' : 'none' }}>{isDesktop ? label : id}</div>
        )
      })}
    </div>
  )

  const noData = leadCount === 0 && viewsTotal === 0
  const sideMargin = isDesktop ? '16px 0 0' : '12px 20px 0'

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 48px' : '0 0 118px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="Analytics" onBack={null} right={rangeToggle} />

      {noData ? (
        <div style={{ margin: sideMargin }}>
          <EmptyState icon={ICONS.trend} title="Ancora nessun dato" sub="Le statistiche compaiono quando ricevi lead e i tuoi immobili iniziano a essere visti. Pubblica un annuncio per partire." cta="Crea un immobile" onCta={() => nav('newprop')} />
        </div>
      ) : (
        <>
          {/* ---- Riga KPI ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(4,1fr)' : '1fr 1fr', gap: isDesktop ? 16 : 12, margin: sideMargin }}>
            {kpis.map(k => (
              <div key={k.t} style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 11.5, color: '#8A91A6', fontWeight: 700 }}>{k.t}</div>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={k.icon} size={15} stroke={k.c} sw={1.9} /></div>
                </div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 24 : 22, letterSpacing: '-.5px', marginTop: 8 }}>{k.v}</div>
                <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: k.c, background: k.bg, borderRadius: 99, padding: '3px 8px' }}>
                  {k.arrow && <Icon d={ICONS.trend} size={10} stroke={k.c} sw={3} />}{k.badge}
                </div>
              </div>
            ))}
          </div>

          {/* ---- Griglia grafici ---- */}
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? 'repeat(3,1fr)' : '1fr', gap: 16, alignItems: 'start', margin: isDesktop ? '16px 0 0' : '16px 20px 0' }}>

            {/* ---- Area visite (Recharts) ---- */}
            <div style={{ ...card, ...span2 }}>
              <div style={{ display: 'flex', alignItems: 'baseline' }}>
                <div style={cardTitle}>Visite al profilo</div>
                <div style={{ flex: 1 }} />
                <div style={{ fontSize: 11.5, color: '#979EB2', fontWeight: 600 }}>{view.dateLabel}</div>
              </div>
              <div style={{ height: isDesktop ? 220 : 190, marginTop: 12 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={visitData} margin={{ top: 6, right: 6, left: -14, bottom: 0 }}>
                    <defs>
                      <linearGradient id="visitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#537EEC" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#537EEC" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#EDF0F7" />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#979EB2' }} dy={4} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#979EB2' }} width={40} />
                    <Tooltip content={<VisitsTip />} cursor={{ stroke: '#CBD3E4', strokeDasharray: '4 4' }} />
                    <Area type="monotone" dataKey="v" stroke="#537EEC" strokeWidth={2.5} fill="url(#visitFill)" dot={{ r: 3, fill: '#537EEC', strokeWidth: 0 }} activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8, paddingTop: 12, borderTop: '1px solid #EDF0F7', display: 'flex', gap: 8, alignItems: 'center' }}>
                <Icon d={ICONS.spark} size={15} fill="#6E56F8" />
                <div style={{ fontSize: 12, color: '#4B39C8', fontWeight: 600 }}>{view.peak}</div>
              </div>
            </div>

            {/* ---- Donut sorgenti lead (Recharts) ---- */}
            <div style={card}>
              <div style={cardTitle}>Da dove arrivano i lead</div>
              {leadCount === 0 ? (
                <div style={{ marginTop: 14, fontSize: 13, color: '#8A91A6', lineHeight: 1.5 }}>Nessun lead ancora: quando ne arrivano, qui vedi da quale canale (profilo, portali, sito, passaparola).</div>
              ) : (
                <>
                  <div style={{ position: 'relative', height: 172, marginTop: 6 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={donutSegs} dataKey="count" nameKey="n" innerRadius={54} outerRadius={78} paddingAngle={2} stroke="none" startAngle={90} endAngle={-270} isAnimationActive>
                          {donutSegs.map(s => <Cell key={s.n} fill={s.c} />)}
                        </Pie>
                        <Tooltip content={<SourceTip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                      <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 24, letterSpacing: '-.5px' }}>{leadCount}</div>
                      <div style={{ fontSize: 9.5, color: '#979EB2', fontWeight: 800, letterSpacing: '.08em' }}>LEAD</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                    {donutSegs.map(s => (
                      <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 9, height: 9, borderRadius: 3, background: s.c, flex: 'none' }} />
                        <span style={{ flex: 1, fontSize: 12.5, fontWeight: 600, color: '#3A4152' }}>{s.n}</span>
                        <span style={{ fontSize: 12.5, fontWeight: 800 }}>{s.v}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ---- Immobili più visti: barre orizzontali (Recharts) ---- */}
            <div style={{ ...card, ...span2 }}>
              <div style={cardTitle}>Immobili più visti</div>
              {propData.length === 0 ? (
                <div style={{ marginTop: 14, fontSize: 13, color: '#8A91A6' }}>Nessun immobile con visite, per ora.</div>
              ) : (
                <div style={{ marginTop: 12, height: propData.length * 52 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart layout="vertical" data={propData} margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barCategoryGap="26%">
                      <defs>
                        <linearGradient id="hbar" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#537EEC" />
                          <stop offset="100%" stopColor="#7598F0" />
                        </linearGradient>
                      </defs>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" width={isDesktop ? 138 : 116} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#3A4152', fontWeight: 600 }} />
                      <Tooltip content={<PropTip />} cursor={{ fill: '#F4F6FA' }} />
                      <Bar dataKey="views" fill="url(#hbar)" radius={[6, 6, 6, 6]} barSize={16} cursor="pointer" onClick={(_, i) => openProp(propData[i].id)}>
                        <LabelList dataKey="views" position="right" formatter={v => nf(v)} style={{ fill: '#3C5BAA', fontWeight: 800, fontSize: 12 }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* ---- Colonna: Nuovi follower + Reazioni ---- */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 11.5, color: '#8A91A6', fontWeight: 700 }}>Nuovi follower</div>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EAF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={ICONS.users} size={15} stroke="#3C5BAA" sw={1.9} /></div>
                </div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-.5px', marginTop: 6 }}>+{nf(view.followers)}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#8A91A6' }}>nel periodo selezionato</div>
              </div>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ flex: 1, fontSize: 11.5, color: '#8A91A6', fontWeight: 700 }}>Reazioni ai post</div>
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: '#EFECFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={ICONS.spark} size={15} fill="#6E56F8" /></div>
                </div>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-.5px', marginTop: 6 }}>{nf(reazioni)}</div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#8A91A6' }}>su {d.posts.length} post pubblicati</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

import { useApp } from '../../store/store.jsx'
import { ICONS, DEAL_STAGES, DEAL_STAGE_META } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Avatar from '../../components/Avatar.jsx'
import Drawer from '../../components/Drawer.jsx'
import Placeholder from '../../components/Placeholder.jsx'

// Dettaglio trattativa: aperto cliccando una card in CRM › Trattative.
// Mostra pipeline, valore, note e i collegamenti a cliente (LeadDetail) e immobile (PropertyDetail).
export default function DealDetail() {
  const { d, ui, isDesktop, closeDeal, openLead, openProp, openChat, toast, setDealStage } = useApp()
  const deal = d.deals.find(x => x.id === ui.selDeal) || d.deals[0]
  if (!deal) return null

  const lead = d.leads.find(l => l.n === deal.who)
  const prop = d.props.find(p => p.t === deal.t)
  const ci = DEAL_STAGES.indexOf(deal.stage)
  // pct/colore derivati dalla fase corrente: seed e trattative create restano coerenti.
  const meta = DEAL_STAGE_META[deal.stage] || { pct: deal.pct, col: deal.col }

  const goLead = () => { if (lead) { closeDeal(); openLead(lead.id) } else toast('Nessuna scheda cliente collegata') }
  const goProp = () => { if (prop) { closeDeal(); openProp(prop.id) } else toast('Nessun immobile collegato') }
  const goChat = () => {
    const convo = d.convos.find(c => c.n === deal.who)
    if (convo) { closeDeal(); openChat(convo.id) } else toast('Nessuna chat con ' + deal.who)
  }

  return (
    <Drawer open onClose={closeDeal} width={520}>
      <div style={{ padding: isDesktop ? '20px 22px 32px' : '18px 20px 40px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: meta.col }}>Trattativa · {deal.stage}</div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 20, letterSpacing: '-.4px', marginTop: 3 }}>{deal.t}</div>
            <div style={{ fontSize: 12.5, color: '#8A91A6', marginTop: 2 }}>con {deal.who}</div>
          </div>
          <div onClick={closeDeal} className="hb" style={{ width: 38, height: 38, borderRadius: 12, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15181F" strokeWidth="2.1" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </div>
        </div>

        {/* Valore + avanzamento */}
        <div style={{ marginTop: 14, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '15px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <div style={{ flex: 1, fontSize: 12, color: '#8A91A6', fontWeight: 700 }}>Valore trattativa</div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 22, color: '#3C5BAA' }}>{deal.val}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div style={{ flex: 1, height: 8, borderRadius: 99, background: '#EDF0F7', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: meta.col, width: meta.pct + '%' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 800, color: meta.col }}>{meta.pct}%</div>
          </div>
        </div>

        {/* Fase: select per far avanzare la trattativa (come in LeadDetail) */}
        <div style={{ padding: '20px 0 8px', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Fasi della trattativa</div>
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <select
            value={deal.stage}
            onChange={e => setDealStage(deal.id, e.target.value)}
            style={{ width: '100%', minHeight: 48, appearance: 'none', WebkitAppearance: 'none', background: '#fff', border: '1.5px solid #B2C5F6', borderRadius: 14, padding: '0 42px 0 16px', fontSize: 14.5, fontWeight: 700, color: meta.col, cursor: 'pointer', outline: 'none' }}
          >
            {DEAL_STAGES.map((stage, i) => (
              <option key={stage} value={stage}>{'Fase ' + (i + 1) + ' di ' + DEAL_STAGES.length + ' · ' + stage}</option>
            ))}
          </select>
          <div style={{ position: 'absolute', right: 15, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <Icon d="M6 9.5 12 15.5 18 9.5" size={16} stroke={meta.col} sw={2.4} />
          </div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '6px 14px' }}>
          {DEAL_STAGES.map((stage, i) => {
            const active = i === ci, done = i < ci
            const dot = active ? meta.col : done ? '#3C5BAA' : '#fff'
            return (
              <div key={stage} style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', background: dot, border: active || done ? 'none' : '1.5px solid #C6CEE0', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    {done ? <Icon d={ICONS.check} size={13} stroke="#fff" sw={3} /> : active ? <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> : null}
                  </div>
                  <div style={{ width: 2, flex: 1, background: i < DEAL_STAGES.length - 1 ? '#EDF0F7' : 'transparent', margin: '3px 0' }} />
                </div>
                <div style={{ paddingBottom: 14, paddingTop: 4 }}>
                  <div style={{ fontWeight: active ? 800 : 700, fontSize: 13.5, color: active ? meta.col : done ? '#15181F' : '#979EB2' }}>{stage}</div>
                  {active && <div style={{ fontSize: 12, color: '#666E82', marginTop: 1 }}>{deal.note}</div>}
                </div>
              </div>
            )
          })}
        </div>

        {/* Cliente collegato */}
        <div style={{ padding: '20px 0 8px', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Cliente</div>
        <div onClick={goLead} className={lead ? 'hbd' : ''} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: 12, display: 'flex', gap: 12, alignItems: 'center', cursor: lead ? 'pointer' : 'default' }}>
          <Avatar ini={(lead && lead.ini) || deal.who.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()} c={(lead && lead.c) || '#DDE5FB'} size={40} fs={13} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13.5 }}>{deal.who}</div>
            <div style={{ fontSize: 12, color: '#666E82' }}>{lead ? 'Fase CRM: ' + lead.stage : 'Cliente della trattativa'}</div>
          </div>
          {lead && <Icon d={ICONS.fwd} size={16} stroke="#979EB2" sw={2.2} />}
        </div>
        <div onClick={goChat} className="hb" style={{ marginTop: 9, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#EAF0FD', color: '#3C5BAA', borderRadius: 13, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
          <Icon d={ICONS.chat} size={15} stroke="#3C5BAA" sw={1.9} />Scrivi al cliente
        </div>

        {/* Immobile collegato */}
        {prop && (
          <>
            <div style={{ padding: '20px 0 8px', fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-.3px' }}>Immobile</div>
            <div onClick={goProp} className="hbd" style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: 12, display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer' }}>
              <Placeholder label="Foto" style={{ width: 78, height: 58 }} tone={prop.id % 2 === 0 ? 'warm' : 'blue'} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{prop.t}</div>
                <div style={{ fontSize: 12, color: '#666E82' }}>{prop.zone}</div>
              </div>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 14.5, color: '#3C5BAA' }}>{prop.price}</div>
            </div>
          </>
        )}
      </div>
    </Drawer>
  )
}

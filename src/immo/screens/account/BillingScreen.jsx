import { useApp } from '../../store/store.jsx'
import { PLANS } from '../../data/seed.js'
import PageHeader from '../../components/PageHeader.jsx'

export default function BillingScreen() {
  const { d, setData, setPlan, isDesktop } = useApp()
  const annuale = d.billCycle === 'annuale'

  const seg = active => ({
    flex: isDesktop ? 'none' : 1, minHeight: isDesktop ? 'auto' : 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: isDesktop ? 10 : 11,
    padding: isDesktop ? '9px 18px' : 0,
    fontSize: 13, fontWeight: 700, cursor: 'pointer', gap: 6,
    background: active ? '#fff' : 'transparent', color: active ? '#15181F' : '#666E82',
    boxShadow: active ? (isDesktop ? '0 2px 8px rgba(24,29,26,.08)' : '0 3px 10px rgba(24,29,26,.1)') : 'none',
  })

  const creditsBadge = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFECFF', borderRadius: 99, padding: '8px 13px', flex: 'none' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="#4B39C8"><path d="M12 3.5 13.7 8.8 19 10.5l-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7L12 3.5Z" /></svg>
      <span style={{ fontSize: 11.5, fontWeight: 800, color: '#4B39C8' }}>{d.credits} crediti</span>
    </div>
  )

  const plans = PLANS.map(p => {
    const dark = !!p.hot
    const cur = p.n === d.plan
    return {
      ...p, cur, dark,
      price: annuale ? p.pa : p.pm,
      per: p.per ? p.per + (annuale ? ' · fatturato annuo' : '') : 'per sempre',
      bg: dark ? 'linear-gradient(150deg,#221856,#4B39C8)' : '#fff',
      bd: dark ? '1px solid #4B39C8' : '1px solid #DFE4EF',
      tc: dark ? '#fff' : '#15181F',
      sc: dark ? 'rgba(255,255,255,.72)' : '#8A91A6',
      ck: dark ? '#C9BEFF' : '#537EEC',
      btn: cur ? 'Il tuo piano' : 'Passa a ' + p.n,
      btnBg: cur ? '#EDF0F7' : dark ? '#fff' : '#537EEC',
      btnCol: cur ? '#8A91A6' : dark ? '#4B39C8' : '#F4F6FA',
    }
  })

  return (
    <div style={{ maxWidth: 1140, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 48px' : '0 0 40px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="Piani" subtitle={isDesktop ? "Inizia gratis. Paga solo quando l'AI ti fa guadagnare tempo." : undefined} right={creditsBadge} />

      {/* Switch Mensile / Annuale */}
      <div style={{ margin: isDesktop ? '16px 0 0' : '14px 20px 0', display: 'flex', background: '#E6EAF3', borderRadius: isDesktop ? 13 : 14, padding: isDesktop ? 4 : 4, width: isDesktop ? 'fit-content' : 'auto' }}>
        <div onClick={() => setData({ billCycle: 'mensile' })} style={seg(!annuale)}>Mensile</div>
        <div onClick={() => setData({ billCycle: 'annuale' })} style={seg(annuale)}>
          Annuale
          <span style={{ background: '#EAF0FD', color: '#3C5BAA', fontSize: 9.5, fontWeight: 800, borderRadius: 99, padding: '2px 7px' }}>-18%</span>
        </div>
      </div>

      {/* Griglia piani fluida */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: isDesktop ? 16 : 12, padding: isDesktop ? '20px 0 0' : '16px 20px 0', alignItems: 'stretch' }}>
        {plans.map(p => (
          <div key={p.n} style={{ background: p.bg, border: p.bd, borderRadius: isDesktop ? 24 : 22, padding: isDesktop ? 22 : 18, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {p.hot && (
              <div style={{ position: 'absolute', top: isDesktop ? 16 : 14, right: isDesktop ? -34 : -32, transform: 'rotate(38deg)', background: '#FFD66E', color: '#5A430E', fontSize: isDesktop ? 10 : 9.5, fontWeight: 800, letterSpacing: '.06em', padding: isDesktop ? '5px 40px' : '5px 38px' }}>CONSIGLIATO</div>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 19 : 18, letterSpacing: '-.4px', color: p.tc }}>{p.n}</div>
              {p.cur && <div style={{ background: '#EAF0FD', color: '#3C5BAA', fontSize: 9.5, fontWeight: 800, borderRadius: 99, padding: '3px 8px' }}>PIANO ATTUALE</div>}
            </div>
            <div style={{ fontSize: isDesktop ? 12.5 : 12, color: p.sc, marginTop: 1 }}>{p.sub}</div>
            <div style={{ marginTop: isDesktop ? 12 : 10, display: 'flex', alignItems: 'baseline', gap: 5 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 32 : 30, letterSpacing: '-.9px', color: p.tc }}>{p.price}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: p.sc }}>{p.per}</span>
            </div>
            <div style={{ marginTop: isDesktop ? 14 : 12, display: 'flex', flexDirection: 'column', gap: isDesktop ? 8 : 7, flex: 1 }}>
              {p.feats.map(f => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={p.ck} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  <span style={{ fontSize: 13, fontWeight: 500, color: p.tc }}>{f}</span>
                </div>
              ))}
            </div>
            <div
              className={p.cur ? undefined : 'hb'}
              onClick={p.cur ? undefined : () => setPlan(p.n)}
              style={{ marginTop: isDesktop ? 18 : 15, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: p.cur ? 'default' : 'pointer', background: p.btnBg, color: p.btnCol }}
            >{p.btn}</div>
          </div>
        ))}
      </div>

      <div style={{ margin: isDesktop ? '18px 0 0' : '16px 20px 0', fontSize: 11.5, lineHeight: 1.5, color: '#979EB2', textAlign: 'center' }}>
        I crediti AI si rinnovano ogni mese e non scadono per 90 giorni.<br />Disdici quando vuoi, in due tap.
      </div>
    </div>
  )
}

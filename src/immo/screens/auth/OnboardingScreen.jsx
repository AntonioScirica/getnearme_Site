import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Placeholder from '../../components/Placeholder.jsx'

// Onboarding in 3 step dopo la registrazione — wizard unico responsive (centrato, maxWidth 480)
const GOALS = [
  ['lead', 'Più lead di qualità', 'Richieste vere, non curiosi', ICONS.funnel, '#EAF0FD', '#3C5BAA'],
  ['brand', 'Brand personale', 'Farti conoscere nella tua zona', ICONS.spark, '#EFECFF', '#4B39C8'],
  ['speed', 'Vendere più veloce', 'Meno giorni sul mercato', ICONS.trend, '#FBF1DC', '#8A6E24'],
  ['team', 'Gestire il team', 'Coordinare agenti e incarichi', ICONS.users, '#E4EDF7', '#2E5C8A'],
]

export default function OnboardingScreen() {
  const { d, ui, setUi, setData, nav, toast, isDesktop } = useApp()
  const step = ui.obStep
  const firstName = d.session.name.split(' ')[0]

  const next = () => {
    if (step < 3) setUi({ obStep: step + 1 })
    else { nav('network'); toast('Profilo pronto. Benvenuto su Agente Immo!') }
  }

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '56px 22px' : '70px 22px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 6, flex: 1, maxWidth: 120 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: '#537EEC' }} />
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: step >= 2 ? '#537EEC' : '#CBD3E4' }} />
          <div style={{ flex: 1, height: 4, borderRadius: 99, background: step >= 3 ? '#537EEC' : '#CBD3E4' }} />
        </div>
        <div onClick={() => nav('network')} style={{ fontSize: 13.5, fontWeight: 600, color: '#8A91A6', cursor: 'pointer', padding: 10 }}>Salta</div>
      </div>

      {step === 1 && (
        <div style={{ marginTop: 22, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.8px' }}>Benvenuto, {firstName}.</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82', lineHeight: 1.5 }}>Il tuo profilo è il centro di tutto: chi ti trova qui deve fidarsi al primo sguardo.</div>
          <div style={{ marginTop: 26, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <Placeholder label="La tua foto" shape="circle" tone="blue" style={{ width: 128, height: 128 }} />
            <div onClick={() => toast('Caricamento foto disponibile a breve')} style={{ fontSize: 13, fontWeight: 600, color: '#537EEC', cursor: 'pointer' }}>Carica una foto professionale</div>
          </div>
          <div style={{ marginTop: 22, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '15px 16px', fontSize: 14.5, color: '#666E82', lineHeight: 1.5 }}>
            {d.bio}<span style={{ animation: 'blink 1.1s infinite', color: '#537EEC', fontWeight: 700 }}>|</span>
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ width: 26, height: 26, borderRadius: 8, background: '#EFECFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon d={ICONS.spark} size={15} fill="#6E56F8" />
            </div>
            <div style={{ fontSize: 12.5, color: '#6E56F8', fontWeight: 600 }}>Bio scritta con Copy AI — modificala come vuoi</div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: 22, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.8px' }}>Cosa vuoi ottenere?</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82' }}>Personalizziamo la tua Home in base agli obiettivi.</div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {GOALS.map(([id, t, sub, dd, ibg, ic]) => {
              const sel = !!d.goals[id]
              return (
                <div key={id} onClick={() => setData(prev => ({ goals: { ...prev.goals, [id]: !prev.goals[id] } }))} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: sel ? '1.5px solid #537EEC' : '1px solid #DFE4EF', borderRadius: 17, padding: 16, cursor: 'pointer' }}>
                  <div style={{ width: 42, height: 42, borderRadius: 13, background: ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon d={dd} size={21} stroke={ic} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#15181F' }}>{t}</div>
                    <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 1 }}>{sub}</div>
                  </div>
                  {sel && <Icon d={ICONS.check} size={20} stroke="#3C5BAA" sw={2.4} />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 22, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.8px' }}>Parti col piede giusto</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82' }}>Il primo passo giusto vale più di dieci dopo.</div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="hb" onClick={() => nav('newprop')} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#537EEC', borderRadius: 17, padding: '17px 16px', cursor: 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICONS.build} size={21} stroke="#F4F6FA" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5, color: '#F4F6FA' }}>Carica il primo immobile</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.72)', marginTop: 1 }}>Con foto migliorate dall'AI</div>
              </div>
              <Icon d={ICONS.fwd} size={18} stroke="#F4F6FA" sw={2.2} />
            </div>
            <div className="hbd" onClick={() => nav('composer')} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 17, padding: '17px 16px', cursor: 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: '#EAF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICONS.pencil} size={21} stroke="#3C5BAA" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>Scrivi il primo post</div>
                <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 1 }}>Fatti conoscere dal network</div>
              </div>
              <Icon d={ICONS.fwd} size={18} stroke="#979EB2" sw={2.2} />
            </div>
            <div className="hbd" onClick={() => nav('crm', { crmTab: 'contatti' })} style={{ display: 'flex', alignItems: 'center', gap: 13, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 17, padding: '17px 16px', cursor: 'pointer' }}>
              <div style={{ width: 42, height: 42, borderRadius: 13, background: '#FBF1DC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon d={ICONS.user} size={21} stroke="#8A6E24" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>Importa i contatti</div>
                <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 1 }}>Da rubrica o CSV, in un tap</div>
              </div>
              <Icon d={ICONS.fwd} size={18} stroke="#979EB2" sw={2.2} />
            </div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <div className="hb" onClick={next} style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 24 }}>
        {step < 3 ? 'Continua' : 'Vai alla Home'}
      </div>
    </div>
  )
}

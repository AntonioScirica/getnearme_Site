import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'

// Registrazione in 3 step — wizard unico responsive (contenuto centrato, maxWidth 480)
const ROLES = [
  ['agente', 'Agente immobiliare', 'Costruisci il tuo brand, gestisci immobili e clienti', ICONS.user],
  ['agenzia', 'Agenzia', 'Coordina il team e fai crescere il marchio', ICONS.biz],
  ['privato', 'Privato', 'Segui agenti, salva immobili, chiedi informazioni', 'M3.5 10.5 12 3.5l8.5 7M5.5 9v11.5h13V9'],
]

const inputStyle = { width: '100%', background: 'transparent', border: 'none', outline: 'none', fontSize: 15, color: '#15181F', fontFamily: 'inherit', padding: 0 }

export default function SignupScreen() {
  const { ui, setUi, nav, finishSignup, isDesktop } = useApp()
  const step = ui.signupStep
  const isAgency = ui.signupRole === 'agenzia'
  // Il privato non ha dati professionali: registrazione in 2 step (account + tipo profilo).
  const totalSteps = ui.signupRole === 'privato' ? 2 : 3

  const next = () => {
    if (step < totalSteps) setUi({ signupStep: step + 1 })
    else finishSignup(ui.signupName, ui.signupMail, ui.signupRole)
  }
  const goBack = () => { if (step > 1) setUi({ signupStep: step - 1 }); else nav('login') }

  return (
    <div style={{ minHeight: '100dvh', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '56px 22px' : '70px 22px 40px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div onClick={goBack} style={{ width: 44, height: 44, borderRadius: 14, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <Icon d={ICONS.back} size={20} sw={2} />
        </div>
        <div style={{ flex: 1, display: 'flex', gap: 6 }}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: step >= i + 1 ? '#537EEC' : '#CBD3E4' }} />
          ))}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#8A91A6' }}>{step}/{totalSteps}</div>
      </div>

      {step === 1 && (
        <div style={{ marginTop: 30, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.8px' }}>Crea il tuo account</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82' }}>Bastano due minuti. Il profilo pubblico arriva subito dopo.</div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '15px 16px' }}>
              <input value={ui.signupName} onChange={e => setUi({ signupName: e.target.value })} placeholder="Nome e cognome" style={inputStyle} />
            </div>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '15px 16px' }}>
              <input type="email" value={ui.signupMail} onChange={e => setUi({ signupMail: e.target.value })} placeholder="Email" style={inputStyle} />
            </div>
            <div style={{ background: '#fff', border: '1.5px solid #537EEC', borderRadius: 15, padding: '15px 16px', fontSize: 15, color: '#15181F', display: 'flex', justifyContent: 'space-between' }}>
              <span>••••••••••</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: '#537EEC' }}>Sicura</span>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12.5, color: '#979EB2', lineHeight: 1.5 }}>Registrandoti accetti <a href="#">Termini</a> e <a href="#">Privacy</a> di Immo.</div>
        </div>
      )}

      {step === 2 && (
        <div style={{ marginTop: 30, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.8px' }}>Chi sei su Agente Immo?</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82' }}>Puoi cambiare in ogni momento dalle impostazioni.</div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {ROLES.map(([id, t, sub, d]) => {
              const sel = ui.signupRole === id
              return (
                <div key={id} onClick={() => setUi({ signupRole: id })} style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#fff', border: sel ? '1.5px solid #537EEC' : '1px solid #DFE4EF', borderRadius: 18, padding: 16, cursor: 'pointer', boxShadow: sel ? '0 8px 22px rgba(83,126,236,.12)' : 'none' }}>
                  <div style={{ width: 46, height: 46, borderRadius: 14, background: sel ? '#537EEC' : '#EDF0F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    <Icon d={d} size={23} stroke={sel ? '#F4F6FA' : '#5B6376'} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15.5 }}>{t}</div>
                    <div style={{ fontSize: 13, color: '#666E82', marginTop: 2 }}>{sub}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: sel ? '0 solid' : '1.5px solid #C6CEE0', background: sel ? '#537EEC' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                    {sel && <Icon d={ICONS.check} size={12} stroke="#fff" sw={3.4} />}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ marginTop: 30, animation: 'fadeUp .4s ease both' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 28, letterSpacing: '-.8px' }}>{isAgency ? "I dati della tua agenzia" : 'I tuoi dati professionali'}</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82' }}>{isAgency ? "Danno credibilità al profilo dell'agenzia." : 'Danno credibilità al tuo profilo pubblico.'}</div>
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '15px 16px', fontSize: 15 }}>{isAgency ? 'Agenzia immobiliare registrata' : 'Agente immobiliare abilitato'}</div>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '15px 16px', fontSize: 15, display: 'flex', justifyContent: 'space-between' }}>
              <span>{isAgency ? 'P. IVA / REA' : 'N° REA / patentino'}</span><span style={{ color: '#15181F', fontWeight: 600 }}>MI-2481930</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '15px 16px', fontSize: 15, display: 'flex', justifyContent: 'space-between' }}>
              <span>{isAgency ? 'Sede operativa' : 'Zona operativa'}</span><span style={{ color: '#15181F', fontWeight: 600 }}>Milano</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '15px 16px', fontSize: 15, display: 'flex', justifyContent: 'space-between' }}>
              <span>{isAgency ? 'Numero di agenti' : 'Agenzia (opzionale)'}</span><span style={{ color: isAgency ? '#15181F' : '#979EB2', fontWeight: isAgency ? 600 : 400 }}>{isAgency ? '10 agenti' : 'Aurora Immobiliare'}</span>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'center', background: '#EAF0FD', borderRadius: 14, padding: '12px 14px' }}>
            <Icon d={ICONS.check} size={20} stroke="#3C5BAA" />
            <div style={{ fontSize: 12.5, color: '#3C5BAA', lineHeight: 1.4, fontWeight: 500 }}>{isAgency ? <>Verificheremo la P. IVA: il badge <b>Verificato</b> dà fiducia a tutto il team.</> : <>Verificheremo il patentino: il badge <b>Verificato</b> aumenta i lead del 40%.</>}</div>
          </div>
        </div>
      )}

      <div style={{ flex: 1 }} />
      <div className="hb" onClick={next} style={{ minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 15, fontWeight: 700, fontSize: 16, cursor: 'pointer', marginTop: 24 }}>
        {step < totalSteps ? 'Continua' : 'Crea il mio profilo'}
      </div>
    </div>
  )
}

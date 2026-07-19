import { useState } from 'react'
import { useApp } from '../../store/store.jsx'

// Login responsive: sotto i 900px gradiente verticale a schermo pieno (ex mobile),
// sopra split a due colonne con pannello brand + form (ex DLogin).
// Il form è un unico sotto-componente condiviso, parametrizzato con `dark`.

function LoginForm({ dark }) {
  const { d, login, nav, toast } = useApp()
  const [email, setEmail] = useState(d.session.email)
  const [pass, setPass] = useState('demo123456')
  const [show, setShow] = useState(false)

  const tryLogin = () => {
    if (!email.trim() || !pass.trim()) { toast('Inserisci email e password'); return }
    login()
  }

  const fieldStyle = dark
    ? { background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.22)', borderRadius: 15, padding: '15px 16px' }
    : { background: '#fff', border: '1px solid #DFE4EF', borderRadius: 14, padding: '15px 16px' }
  const inputStyle = {
    flex: 1, minWidth: 0, width: '100%', background: 'transparent', border: 'none', outline: 'none',
    color: dark ? 'rgba(255,255,255,.85)' : '#15181F', fontSize: dark ? 15 : 14.5, fontFamily: 'inherit', padding: 0,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={fieldStyle}>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder={dark ? 'La tua email' : 'Email'}
          style={inputStyle}
        />
      </div>
      <div style={{ ...fieldStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <input
          type={show ? 'text' : 'password'}
          value={pass}
          onChange={e => setPass(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') tryLogin() }}
          placeholder="Password"
          style={inputStyle}
        />
        <span onClick={() => setShow(s => !s)} style={{ fontSize: 12.5, fontWeight: 600, color: dark ? '#BECEF8' : '#537EEC', cursor: 'pointer', flex: 'none' }}>{show ? 'Nascondi' : 'Mostra'}</span>
      </div>
      <div
        className="hb"
        onClick={tryLogin}
        style={dark
          ? { minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFFFF', color: '#3C5BAA', borderRadius: 15, fontWeight: 700, fontSize: 16, cursor: 'pointer' }
          : { minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
      >Accedi</div>
      {!dark && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
          <div style={{ flex: 1, height: 1, background: '#DFE4EF' }} /><span style={{ fontSize: 11.5, color: '#979EB2', fontWeight: 600 }}>oppure</span><div style={{ flex: 1, height: 1, background: '#DFE4EF' }} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 10 }}>
        {['G · Google', ' · Apple'].map(t => (
          <div
            key={t}
            className={dark ? 'hb' : 'hbg2'}
            onClick={login}
            style={dark
              ? { flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.22)', borderRadius: 14, color: '#F4F6FA', fontWeight: 600, fontSize: 14, cursor: 'pointer' }
              : { flex: 1, minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, fontWeight: 600, fontSize: 13.5, cursor: 'pointer' }}
          >{t}</div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: 8, fontSize: dark ? 14 : 13.5, color: dark ? 'rgba(255,255,255,.7)' : '#666E82' }}>
        Nuovo su Agente Immo? <span onClick={() => nav('signup')} style={{ color: dark ? '#BECEF8' : '#537EEC', fontWeight: 700, cursor: 'pointer' }}>{dark ? 'Registrati' : 'Crea il profilo gratis'}</span>
      </div>
    </div>
  )
}

export default function LoginScreen() {
  const { isDesktop } = useApp()

  if (!isDesktop) {
    return (
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column', background: 'linear-gradient(175deg,#537EEC 0%,#3C5BAA 46%,#2A3F76 100%)', boxSizing: 'border-box' }}>
        <div style={{ padding: '96px 28px 0', flex: 1 }}>
          <div style={{ width: 58, height: 58, borderRadius: 17, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>
            <img src="/immo/logo-mark.png" alt="Agente Immo" style={{ width: 46, height: 46, objectFit: 'contain' }} />
          </div>
          <div style={{ marginTop: 16, fontSize: 11, fontWeight: 800, letterSpacing: '.16em', textTransform: 'uppercase', color: 'rgba(255,255,255,.55)' }}>Business. Network. Studio.</div>
          <div style={{ marginTop: 12, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 37, lineHeight: 1.08, letterSpacing: '-1.2px', color: '#F4F6FA', textWrap: 'pretty' }}>Il tuo business immobiliare, in una app.</div>
          <div style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.5, color: 'rgba(255,255,255,.75)', maxWidth: 300 }}>Profilo, network, immobili, clienti e AI Studio. Tutto quello che serve a un agente, in un posto solo.</div>
        </div>
        <div style={{ padding: '26px 22px 46px' }}>
          <LoginForm dark />
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100%', display: 'flex' }}>
      <div style={{ flex: 1.1, background: 'linear-gradient(165deg,#537EEC 0%,#3C5BAA 48%,#2A3F76 100%)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.09) 1px,transparent 1px)', backgroundSize: '28px 28px', animation: 'drift 10s linear infinite' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 13 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <img src="/immo/logo-mark.png" alt="Agente Immo" style={{ width: 38, height: 38, objectFit: 'contain' }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 23, color: '#FFFFFF', letterSpacing: '-.6px', lineHeight: 1 }}>Agente Immo</div>
            <div style={{ marginTop: 3, fontSize: 10.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,.6)' }}>Business. Network. Studio.</div>
          </div>
        </div>
        <div style={{ position: 'relative', maxWidth: 520 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 52, lineHeight: 1.05, letterSpacing: '-2px', color: '#F4F6FA', textWrap: 'pretty' }}>Il tuo business immobiliare, in un posto solo.</div>
          <div style={{ marginTop: 18, fontSize: 17, lineHeight: 1.6, color: 'rgba(255,255,255,.75)', maxWidth: 420 }}>Profilo, network, immobili, clienti e AI Studio. La piattaforma degli agenti che costruiscono il proprio nome.</div>
          <div style={{ marginTop: 30, display: 'flex', gap: 26 }}>
            <div><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 26, color: '#F4F6FA' }}>28.400</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>agenti su Agente Immo</div></div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.2)' }} />
            <div><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 26, color: '#F4F6FA' }}>140K</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>immobili gestiti</div></div>
            <div style={{ width: 1, background: 'rgba(255,255,255,.2)' }} />
            <div><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 26, color: '#F4F6FA' }}>21 gg</div><div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.65)', fontWeight: 600 }}>tempo medio di vendita</div></div>
          </div>
        </div>
        <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,255,255,.55)' }}>«Ho smesso di pagare cinque strumenti diversi.» — Giulia F., agente a Milano</div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ width: 400 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 30, letterSpacing: '-.8px' }}>Bentornato</div>
          <div style={{ marginTop: 6, fontSize: 14.5, color: '#666E82' }}>Accedi al tuo spazio di lavoro.</div>
          <div style={{ marginTop: 26 }}>
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  )
}

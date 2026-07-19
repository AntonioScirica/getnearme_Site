import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, REVIEWS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Drawer from '../../components/Drawer.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PostCard from '../../components/cards/PostCard.jsx'
import PropertyCard from '../../components/cards/PropertyCard.jsx'

const STAR = 'M12 3.4l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.4l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7L12 3.4Z'

// Badge "verificato" (stesso shield del proprio profilo, per coerenza visiva).
function VerifiedBadge({ size = 19 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#537EEC" style={{ flex: 'none' }}>
      <path d="M12 2.5 14.2 4.6 17.2 4.3 18 7.2 20.7 8.6 19.8 11.5 21.5 14 19.4 16.1 19.6 19.1 16.7 19.8 15.2 22.4 12.4 21.3 9.7 22.5 8.1 19.9 5.1 19.3 5.2 16.3 3 14.3 4.6 11.7 3.6 8.9 6.2 7.4 6.9 4.4 9.9 4.6 12 2.5Z" />
      <path d="M8.6 12.2l2.3 2.3 4.5-4.7" stroke="#F4F6FA" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// Numeri "profilo" plausibili e STABILI, derivati dal nome (nessun dato reale per gli altri utenti).
function authorStats(name, immobili) {
  const h = [...name].reduce((s, c) => s + c.charCodeAt(0), 0)
  return {
    follower: 180 + (h * 7) % 1900,
    immobili,
    venduti: 4 + (h % 42),
    tempo: (18 + (h % 20)) + 'g',
  }
}

// Profilo pubblico di un altro utente (agente o agenzia), aperto dal feed / suggeriti / commenti.
// Rispecchia il layout del PROPRIO profilo in modalità visitatore: copertina, statistiche e tab
// (Immobili / Post / Recensioni). I dati sono derivati dai campi denormalizzati dell'autore
// (n, role, ini, c, followId|id) e dai contenuti che lo referenziano nel feed.
export default function AuthorProfile() {
  const { d, ui, isDesktop, closeAuthor, follow, openChat, toast } = useApp()
  const a = ui.selAuthor
  const [tab, setTab] = useState('immobili')
  if (!a) return null

  const isAgency = (a.role || '').toLowerCase().includes('agenz')
  const followKey = a.followId || a.id
  const fw = followKey ? !!d.followed[followKey] : false
  const authorPosts = d.posts.filter(p => p.n === a.n && !p.mine)
  const convo = d.convos.find(c => c.n === a.n)

  // Immobili "pubblici" dell'autore = quelli referenziati dai suoi post (unici).
  const propIds = [...new Set(authorPosts.map(p => p.propId).filter(Boolean))]
  const authorProps = propIds.map(id => d.props.find(p => p.id === id)).filter(Boolean)
  const stats = authorStats(a.n, authorProps.length)
  const zone = (a.role || '').split('·')[1]?.trim()

  const contact = () => {
    if (convo) { closeAuthor(); openChat(convo.id) }
    else toast('Richiesta di contatto inviata a ' + a.n)
  }

  const tabs = [['immobili', 'Immobili'], ['post', 'Post'], ['recensioni', 'Recensioni']]
  const phTones = ['blue', 'warm', 'grey', 'blue']

  return (
    <Drawer open onClose={closeAuthor} width={560}>
      {/* Copertina full-bleed + chiudi */}
      <div style={{ height: isDesktop ? 168 : 150, position: 'relative', background: 'linear-gradient(135deg,#DDE5FB,#B9C9F2 55%,#A9BEF0)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.35) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />
        <div onClick={closeAuthor} className="hb" style={{ position: 'absolute', top: 14, left: 14, width: 42, height: 42, borderRadius: '50%', background: 'rgba(24,29,26,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
        </div>
      </div>

      <div style={{ padding: isDesktop ? '0 22px 34px' : '0 20px 40px' }}>
        {/* Avatar sovrapposto alla copertina */}
        <div style={{ marginTop: -42 }}>
          <div style={{ width: 92, height: 92, borderRadius: '50%', background: a.c || '#DDE5FB', border: '4px solid #F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 28, color: '#3A4152', boxShadow: '0 8px 24px rgba(24,29,26,.15)' }}>{a.ini}</div>
        </div>

        {/* Nome + badge, ruolo */}
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 23, letterSpacing: '-.6px' }}>{a.n}</span>
          <VerifiedBadge />
        </div>
        <div style={{ fontSize: 13.5, color: '#666E82', marginTop: 2 }}>{a.role} · su Agente Immo dal 2024</div>

        {/* Bio */}
        <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#3A4152', textWrap: 'pretty' }}>
          {isAgency
            ? `${a.n} è un'agenzia attiva su Agente Immo: segui il profilo per non perderti nuovi incarichi, reel e aggiornamenti dal team.`
            : `${a.n.split(' ')[0]} pubblica incarichi, vendite e consigli di zona sul network. Segui il profilo o scrivi in chat per informazioni.`}
        </div>
        {zone && <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#666E82' }}><Icon d={ICONS.pin} size={14} stroke="#666E82" sw={1.9} />{zone}</div>}

        {/* Statistiche */}
        <div style={{ display: 'flex', marginTop: 14, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '13px 0' }}>
          {[[stats.follower.toLocaleString('it-IT'), 'follower'], [stats.immobili, 'immobili'], [stats.venduti, 'venduti'], [stats.tempo, 'tempo medio']].map(([v, l], i) => (
            <div key={l} style={{ flex: 1, textAlign: 'center', borderLeft: i ? '1px solid #EDF0F7' : 'none' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>{v}</div>
              <div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>{l}</div>
            </div>
          ))}
        </div>

        {/* Follow + Contatta */}
        <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
          <div className="hb" onClick={() => follow(followKey, a.n)} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: fw ? '#fff' : '#537EEC', color: fw ? '#3C5BAA' : '#F4F6FA', border: fw ? '1.5px solid #CBD3E4' : 'none', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>{fw ? 'Segui già' : 'Segui'}</div>
          <div onClick={contact} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>
            <Icon d={ICONS.chat} size={16} stroke="#15181F" sw={1.9} />Contatta
          </div>
        </div>

        {/* Tab */}
        <div style={{ display: 'flex', background: '#E6EAF3', borderRadius: 14, padding: 4, marginTop: 16 }}>
          {tabs.map(([id, t]) => {
            const act = tab === id
            return (
              <div key={id} onClick={() => setTab(id)} style={{ flex: 1, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: act ? '#fff' : 'transparent', color: act ? '#15181F' : '#666E82', boxShadow: act ? '0 3px 10px rgba(24,29,26,.1)' : 'none' }}>{t}</div>
            )
          })}
        </div>

        {tab === 'immobili' && (
          authorProps.length === 0 ? (
            <div style={{ marginTop: 14 }}>
              <EmptyState icon={ICONS.build} title="Nessun immobile pubblico" sub={`Quando ${a.n.split(' ')[0]} pubblicherà un immobile, lo vedrai qui.`} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: isDesktop ? 12 : 10, marginTop: 14 }}>
              {authorProps.map((p, i) => <PropertyCard key={p.id} p={p} tone={phTones[i % phTones.length]} />)}
            </div>
          )
        )}

        {tab === 'post' && (
          authorPosts.length === 0 ? (
            <div style={{ marginTop: 14 }}>
              <EmptyState icon={ICONS.users} title="Nessun post recente" sub={`Quando ${a.n.split(' ')[0]} pubblicherà, lo vedrai qui.`} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? 10 : 9, marginTop: 14 }}>
              {authorPosts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )
        )}

        {tab === 'recensioni' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {REVIEWS.map(r => (
              <div key={r.n} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 17, padding: '14px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: r.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11.5, color: '#3A4152' }}>{r.ini}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{r.n}</div>
                    <div style={{ fontSize: 11, color: '#979EB2' }}>{r.time}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[0, 1, 2, 3, 4].map(i => <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#D99A2B"><path d={STAR} /></svg>)}
                  </div>
                </div>
                <div style={{ marginTop: 10, fontSize: 13, lineHeight: 1.55, color: '#3A4152' }}>{r.t}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Drawer>
  )
}

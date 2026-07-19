import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS, REVIEWS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Avatar from '../../components/Avatar.jsx'
import Placeholder from '../../components/Placeholder.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import Modal from '../../components/Modal.jsx'
import PropertyCard from '../../components/cards/PropertyCard.jsx'
import PostCard from '../../components/cards/PostCard.jsx'

const PRIVATO_BIO = 'Sto cercando casa su Agente Immo: seguo agenti e agenzie, salvo gli immobili che mi piacciono e li contatto per informazioni.'

// Dialog "Modifica profilo": nome + bio/descrizione. Montato solo quando aperto (si reinizializza dai dati correnti).
function EditProfileModal({ open, onClose }) {
  const { d, updateProfile } = useApp()
  const isPrivato = d.session.persona === 'privato'
  const [name, setName] = useState(d.session.name)
  const [bio, setBio] = useState(d.bio || (isPrivato ? PRIVATO_BIO : ''))
  const save = () => {
    if (!name.trim()) return
    updateProfile({ name, bio })
    onClose()
  }
  return (
    <Modal open={open} onClose={onClose} title="Modifica profilo">
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2', padding: '0 2px' }}>Nome e cognome</div>
      <input value={name} onChange={e => setName(e.target.value)} autoFocus style={{ marginTop: 7, width: '100%', boxSizing: 'border-box', minHeight: 46, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '0 14px', fontSize: 14.5, color: '#15181F', outline: 'none', fontFamily: 'inherit' }} />
      <div style={{ marginTop: 14, fontSize: 12, fontWeight: 800, letterSpacing: '.06em', textTransform: 'uppercase', color: '#979EB2', padding: '0 2px' }}>{isPrivato ? 'Descrizione' : 'Bio'}</div>
      <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder={isPrivato ? 'Racconta cosa stai cercando…' : 'Racconta chi sei e come lavori…'} style={{ marginTop: 7, width: '100%', boxSizing: 'border-box', minHeight: 90, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, padding: '11px 14px', fontSize: 14, lineHeight: 1.5, color: '#15181F', outline: 'none', resize: 'none', fontFamily: 'inherit' }} />
      <div onClick={save} className="hb" style={{ marginTop: 16, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 14, fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>Salva</div>
    </Modal>
  )
}

const STAR = 'M12 3.4l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.4l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7L12 3.4Z'

export default function ProfileScreen() {
  const { d, ui, setUi, back, toast, nav, follow, openChat, openAuthor, logout, isDesktop } = useApp()
  const [editOpen, setEditOpen] = useState(false)
  // Il privato ha un profilo minimale (niente statistiche/badge da agente): vede Salvati e Seguiti.
  const isPrivato = d.session.persona === 'privato'
  const pubView = ui.pubView && !isPrivato
  const pubDot = pubView ? '#D99A2B' : '#7598F0'
  const pubLabel = pubView ? 'Vista: visitatore' : 'Vista: proprietario'
  const shareToast = () => toast('Link del profilo copiato')

  // In modalità visitatore i contenuti privati (Salvati) non compaiono: il set di tab è quello
  // che vedono gli altri (Immobili/Post/Recensioni), lo stesso mostrato sui profili pubblici altrui.
  const tabDefs = isPrivato
    ? [['salvati', 'Salvati'], ['seguiti', 'Seguiti']]
    : (pubView ? [['immobili', 'Immobili'], ['post', 'Post'], ['recensioni', 'Recensioni']] : [['immobili', 'Immobili'], ['post', 'Post'], ['salvati', 'Salvati'], ['recensioni', 'Recensioni']])
  // Per il privato l'ultima tab attiva è tra le sue (salvati/seguiti); altrimenti torna a 'salvati'.
  // Da visitatore la tab privata 'salvati' ripiega su 'immobili'.
  const profTab = isPrivato
    ? (['salvati', 'seguiti'].includes(ui.profTab) ? ui.profTab : 'salvati')
    : (pubView && ui.profTab === 'salvati' ? 'immobili' : ui.profTab)
  const profTabs = tabDefs.map(([id, t]) => {
    const a = profTab === id
    return { id, t, bg: a ? '#fff' : 'transparent', col: a ? '#15181F' : '#666E82', sh: a ? '0 3px 10px rgba(24,29,26,.1)' : 'none' }
  })
  const profProps = d.props.slice(0, 4)
  const minePosts = d.posts.filter(p => p.mine)
  const savedPosts = d.posts.filter(p => d.saved[p.id])
  const savedProps = d.props.filter(p => d.savedProps[p.id])
  const phTones = ['blue', 'warm', 'grey', 'blue']

  // Profili (agenti/agenzie) che l'utente segue — dai suggeriti e dagli autori dei post.
  const followedAuthors = (() => {
    const out = []
    const seen = new Set()
    const add = a => { if (a && !seen.has(a.n)) { seen.add(a.n); out.push(a) } }
    d.suggest.forEach(s => { if (d.followed[s.id]) add({ id: s.id, n: s.n, role: s.role, ini: s.ini, c: s.c, followId: s.id }) })
    d.posts.forEach(p => { if (p.followId && d.followed[p.followId]) add({ id: p.followId, n: p.n, role: p.role, ini: p.ini, c: p.c, followId: p.followId }) })
    return out
  })()

  return (
    <div style={{ padding: isDesktop ? '0 0 48px' : '0 0 40px' }}>
      {/* Copertina full-bleed (come nei sorgenti) */}
      <div style={{ height: isDesktop ? 210 : 168, position: 'relative' }}>
        <Placeholder label="Copertina · la tua zona" style={{ position: 'absolute', inset: 0, borderRadius: 0 }} tone="blue" />
        {!isDesktop && (
          <div style={{ position: 'absolute', top: 14, left: 14, right: 14, display: 'flex' }}>
            <div onClick={back} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(24,29,26,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 5.5 8 12l6.5 6.5" /></svg>
            </div>
            <div style={{ flex: 1 }} />
            <div onClick={shareToast} style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(24,29,26,.5)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M12 14.5V3.5M8 7l4-3.5L16 7M5 11.5v8h14v-8" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* Colonna centrata */}
      <div style={{ maxWidth: 760, margin: (isDesktop ? '-44px' : '-38px') + ' auto 0', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px' : '0 20px', position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14 }}>
          <div style={{ width: isDesktop ? 112 : 88, height: isDesktop ? 112 : 88, borderRadius: '50%', background: '#DDE5FB', border: isDesktop ? '5px solid #F4F6FA' : '4px solid #F4F6FA', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: isDesktop ? 32 : 26, color: '#3C5BAA', flex: 'none', boxShadow: '0 8px 24px rgba(24,29,26,.15)' }}>{d.session.ini}</div>
          {!isPrivato && (
            <div onClick={() => setUi({ pubView: !pubView })} style={{ marginBottom: 8, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 7, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 99, padding: '8px 13px', cursor: 'pointer' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: pubDot }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#3A4152' }}>{pubLabel}</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 27 : 23, letterSpacing: isDesktop ? '-.7px' : '-.6px' }}>{d.session.name}</span>
          {!isPrivato && <svg width="19" height="19" viewBox="0 0 24 24" fill="#537EEC"><path d="M12 2.5 14.2 4.6 17.2 4.3 18 7.2 20.7 8.6 19.8 11.5 21.5 14 19.4 16.1 19.6 19.1 16.7 19.8 15.2 22.4 12.4 21.3 9.7 22.5 8.1 19.9 5.1 19.3 5.2 16.3 3 14.3 4.6 11.7 3.6 8.9 6.2 7.4 6.9 4.4 9.9 4.6 12 2.5Z" /><path d="M8.6 12.2l2.3 2.3 4.5-4.7" stroke="#F4F6FA" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
        </div>
        <div style={{ fontSize: 13.5, color: '#666E82', marginTop: 2 }}>{d.session.role} · su Agente Immo dal 2024</div>
        {isPrivato ? (
          <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#666E82', textWrap: 'pretty' }}>{d.bio || PRIVATO_BIO}</div>
        ) : (
          <>
            <div style={{ marginTop: 12, fontSize: 13.5, lineHeight: 1.55, color: '#3A4152', textWrap: 'pretty' }}>{d.bio}</div>
            <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#666E82' }}><Icon d={ICONS.pin} size={14} stroke="#666E82" sw={1.9} />Porta Romana, Lodi, Corvetto</div>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: '#666E82' }}><Icon d={ICONS.biz} size={14} stroke="#666E82" sw={1.8} />Aurora Immobiliare</div>
            <div style={{ display: 'flex', gap: 0, marginTop: 14, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '13px 0' }}>
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>1.240</div><div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>follower</div></div>
              <div style={{ width: 1, background: '#EDF0F7' }} />
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>{d.props.length}</div><div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>immobili</div></div>
              <div style={{ width: 1, background: '#EDF0F7' }} />
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>46</div><div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>venduti</div></div>
              <div style={{ width: 1, background: '#EDF0F7' }} />
              <div style={{ flex: 1, textAlign: 'center' }}><div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17 }}>21g</div><div style={{ fontSize: 10.5, color: '#8A91A6', fontWeight: 600 }}>tempo medio</div></div>
            </div>
          </>
        )}
        <div style={{ display: 'flex', gap: 9, marginTop: 12 }}>
          {pubView ? (
            <>
              <div className="hb" onClick={() => follow('fed', d.session.name.split(' ')[0])} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>{d.followed['fed'] ? 'Segui già' : 'Segui'}</div>
              <div onClick={() => openChat(1)} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Contatta</div>
            </>
          ) : (
            <>
              <div className="hb" onClick={() => setEditOpen(true)} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#537EEC', color: '#F4F6FA', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Modifica profilo</div>
              <div onClick={shareToast} style={{ flex: 1, minHeight: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 14, fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Condividi</div>
            </>
          )}
        </div>

        {/* Tab profilo */}
        <div style={{ display: 'flex', background: '#E6EAF3', borderRadius: 14, padding: 4, marginTop: 16 }}>
          {profTabs.map(t => (
            <div key={t.id} onClick={() => setUi({ profTab: t.id })} style={{ flex: 1, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 11, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: t.bg, color: t.col, boxShadow: t.sh }}>{t.t}</div>
          ))}
        </div>

        {profTab === 'immobili' && (
          <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: isDesktop ? 12 : 10, marginTop: 14 }}>
            {profProps.map((p, i) => <PropertyCard key={p.id} p={p} tone={phTones[i % phTones.length]} />)}
          </div>
        )}

        {profTab === 'post' && (
          minePosts.length === 0 ? (
            <div style={{ marginTop: 14 }}>
              <EmptyState icon={ICONS.pencil} title="Non hai ancora pubblicato post" sub="Racconta qualcosa al network per farti conoscere in zona." cta="Scrivi il primo post" onCta={() => nav('composer')} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? 10 : 9, marginTop: 14 }}>
              {minePosts.map(p => <PostCard key={p.id} post={p} />)}
            </div>
          )
        )}

        {profTab === 'salvati' && (
          (savedProps.length === 0 && savedPosts.length === 0) ? (
            <div style={{ marginTop: 14 }}>
              <EmptyState icon={ICONS.star} title="Nessun preferito" sub="Salva immobili e post per ritrovarli qui." cta="Esplora la piattaforma" onCta={() => nav('network')} />
            </div>
          ) : (
            <>
              {savedProps.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: isDesktop ? 12 : 10, marginTop: 14 }}>
                  {savedProps.map((p, i) => <PropertyCard key={p.id} p={p} tone={phTones[i % phTones.length]} />)}
                </div>
              )}
              {savedPosts.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? 10 : 9, marginTop: 14 }}>
                  {savedPosts.map(p => <PostCard key={p.id} post={p} />)}
                </div>
              )}
            </>
          )
        )}

        {profTab === 'seguiti' && (
          followedAuthors.length === 0 ? (
            <div style={{ marginTop: 14 }}>
              <EmptyState icon={ICONS.users} title="Non segui ancora nessuno" sub="Segui agenti e agenzie per restare aggiornato sui loro immobili e post." cta="Scopri chi seguire" onCta={() => nav('network')} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 14 }}>
              {followedAuthors.map(a => (
                <div key={a.n} onClick={() => openAuthor(a)} className="hsh" style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '12px 14px', cursor: 'pointer' }}>
                  <Avatar ini={a.ini} c={a.c} size={44} fs={13.5} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{a.n}</div>
                    <div style={{ fontSize: 12, color: '#8A91A6' }}>{a.role}</div>
                  </div>
                  <div onClick={e => { e.stopPropagation(); follow(a.followId, a.n) }} style={{ fontSize: 12, fontWeight: 800, color: '#3C5BAA', background: '#fff', border: '1.5px solid #537EEC', borderRadius: 99, padding: '7px 13px', flex: 'none' }}>Segui già</div>
                </div>
              ))}
            </div>
          )
        )}

        {profTab === 'recensioni' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 14 }}>
            {REVIEWS.map(r => (
              <div key={r.n} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 17, padding: isDesktop ? '15px 16px' : '14px 15px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: isDesktop ? 38 : 36, height: isDesktop ? 38 : 36, borderRadius: '50%', background: r.c, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11.5, color: '#3A4152' }}>{r.ini}</div>
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

        {/* Azioni account: Impostazioni (spostate qui dalla sidebar) + uscita. Nascoste in modalità visitatore. */}
        {!pubView && (
          <>
            <div onClick={() => nav('settings')} className="hbg2" style={{ margin: '22px 0 0', minHeight: 52, display: 'flex', alignItems: 'center', gap: 12, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '0 16px', cursor: 'pointer' }}>
              <Icon d={ICONS.gear} size={19} stroke="#3A4152" sw={1.8} />
              <div style={{ flex: 1, fontWeight: 700, fontSize: 14.5, color: '#15181F' }}>Impostazioni</div>
              <Icon d={ICONS.fwd} size={15} stroke="#979EB2" sw={2.2} />
            </div>
            <div onClick={logout} className="hbg2" style={{ margin: '10px 0 0', minHeight: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', border: '1.5px solid #F3D2C9', borderRadius: 15, fontWeight: 700, fontSize: 14.5, color: '#B03B22', cursor: 'pointer' }}>
              <Icon d={ICONS.logout} size={18} stroke="#B03B22" sw={1.9} />Esci dall'account
            </div>
          </>
        )}
      </div>

      {editOpen && <EditProfileModal open onClose={() => setEditOpen(false)} />}
    </div>
  )
}

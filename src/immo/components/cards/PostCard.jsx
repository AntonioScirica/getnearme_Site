import { useState } from 'react'
import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Avatar from '../Avatar.jsx'
import Placeholder from '../Placeholder.jsx'
import Icon from '../Icon.jsx'
import Modal from '../Modal.jsx'

// Path SVG delle azioni del post (dal prototipo)
const P_LIKE = 'M12 20.2S4.3 15.5 2.9 10.9a5.1 5.1 0 0 1 9.1-4.4 5.1 5.1 0 0 1 9.1 4.4C19.7 15.5 12 20.2 12 20.2Z'
const P_COMMENT = 'M21 11.8a8.4 8.4 0 0 1-12.3 7.4L4 20.5l1.3-4.3A8.4 8.4 0 1 1 21 11.8Z'
const P_SAVE = 'M6.5 20.5V4.7a1.2 1.2 0 0 1 1.2-1.2h8.6a1.2 1.2 0 0 1 1.2 1.2v15.8L12 16.6l-5.5 3.9Z'
const P_PLAY = 'M8 5.5v13l10-6.5-10-6.5Z'
const P_SEND = 'M20.5 3.5 10 14M20.5 3.5 14 20.5l-4-6.5-7-4 17.5-6.5Z'

// Input commento con stato locale (svuotato all'invio)
function CommentInput({ postId }) {
  const { d, addComment } = useApp()
  const [txt, setTxt] = useState('')
  const send = () => { if (!txt.trim()) return; addComment(postId, txt); setTxt('') }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginTop: 10 }}>
      <Avatar ini={d.session.ini} c="#DDE5FB" size={32} fs={11.5} col="#3C5BAA" />
      <input
        value={txt}
        onChange={e => setTxt(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') send() }}
        placeholder="Scrivi un commento..."
        style={{ flex: 1, minWidth: 0, background: '#F4F6FA', border: '1px solid #E8EBF4', borderRadius: 99, padding: '9px 14px', fontSize: 13, color: '#15181F', outline: 'none' }}
      />
      <div onClick={send} className="hb" style={{ width: 34, height: 34, borderRadius: '50%', background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none' }}>
        <Icon d={P_SEND} size={15} stroke="#F4F6FA" sw={2} />
      </div>
    </div>
  )
}

// Card post del feed Network (usata anche dal Profilo): tutto via useApp.
export default function PostCard({ post: p }) {
  const { d, ui, setUi, nav, isDesktop, propById, openProp, openAuthor, toggleLike, toggleSave, follow, commentsOf, deletePost } = useApp()
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const pr = p.propId ? propById(p.propId) : null
  const lk = !!d.liked[p.id]
  const sv = !!d.saved[p.id]
  const fw = p.followId ? !!d.followed[p.followId] : false
  const likeN = p.likes + (lk ? 1 : 0) - (p.id === 2 ? 1 : 0)
  const comms = commentsOf(p.id)
  const commN = p.comm + comms.length
  const expanded = !!ui.expandComments[p.id]

  return (
    <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 20, padding: isDesktop ? '16px 18px 12px' : '16px 16px 12px' }}>
      {/* Header autore */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div onClick={() => (p.mine ? nav('profile') : openAuthor(p))} style={{ display: 'flex', alignItems: 'center', gap: isDesktop ? 11 : 10, flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <Avatar ini={p.ini} c={p.c} size={isDesktop ? 44 : 42} fs={13.5} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: isDesktop ? 14.5 : 14 }}>{p.n}</div>
            <div style={{ fontSize: isDesktop ? 12 : 11.5, color: '#8A91A6' }}>{p.role} · {p.time}</div>
          </div>
        </div>
        {!p.mine && p.followId && (
          <div onClick={() => follow(p.followId, p.n)} style={{ fontSize: 12.5, fontWeight: 700, color: fw ? '#8A91A6' : '#537EEC', cursor: 'pointer', padding: '8px 4px' }}>{fw ? 'Segui già' : 'Segui'}</div>
        )}
        {p.mine && (
          <div style={{ position: 'relative', flex: 'none' }}>
            <div onClick={() => setMenuOpen(o => !o)} className="hbg2" style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#8A91A6"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
            </div>
            {menuOpen && (
              <>
                <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: 38, right: 0, zIndex: 41, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 13, boxShadow: '0 14px 34px rgba(24,29,26,.16)', padding: 6, minWidth: 168, animation: 'fadeUp .16s ease both' }}>
                  <div onClick={() => { setMenuOpen(false); setConfirmOpen(true) }} className="hbg2" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 11px', borderRadius: 10, cursor: 'pointer', color: '#B03B22', fontWeight: 700, fontSize: 13.5 }}>
                    <Icon d={ICONS.trash} size={17} stroke="#B03B22" sw={1.9} />Elimina post
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Testo */}
      <div style={{ marginTop: 11, fontSize: 14.5, lineHeight: 1.55, color: '#282D39', textWrap: 'pretty', whiteSpace: 'pre-line' }}>{p.txt}</div>

      {/* Stat pill */}
      {p.stat && (
        <div style={{ marginTop: 12, background: 'linear-gradient(120deg,#537EEC,#3C5BAA)', borderRadius: 16, padding: isDesktop ? '24px 18px' : '20px 18px', textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 24 : 20, letterSpacing: '-.3px', color: '#F4F6FA' }}>{p.stat}</div>
          <div style={{ marginTop: 4, fontSize: isDesktop ? 12 : 11.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: '#BECEF8' }}>Home staging AI + prezzo giusto</div>
        </div>
      )}

      {/* Immobile allegato */}
      {pr && (isDesktop ? (
        <div className="hbd" onClick={() => openProp(pr.id)} style={{ marginTop: 12, border: '1px solid #DFE4EF', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', display: 'flex' }}>
          <Placeholder label="Foto immobile" tone={pr.id % 2 === 0 ? 'warm' : 'blue'} style={{ width: 190, height: 126, flex: 'none', borderRadius: 0 }} />
          <div style={{ padding: '14px 16px', flex: 1 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 17, color: '#3C5BAA' }}>{pr.price}</div>
            <div style={{ fontWeight: 700, fontSize: 14, marginTop: 2 }}>{pr.t}</div>
            <div style={{ fontSize: 12.5, color: '#666E82', marginTop: 2 }}>{pr.zone}</div>
            <div style={{ marginTop: 8, display: 'inline-block', background: '#EAF0FD', color: '#3C5BAA', fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '4px 10px' }}>Vedi annuncio</div>
          </div>
        </div>
      ) : (
        <div onClick={() => openProp(pr.id)} className="hsh" style={{ marginTop: 12, border: '1px solid #DFE4EF', borderRadius: 16, overflow: 'hidden', cursor: 'pointer' }}>
          <div style={{ height: 150 }}><Placeholder label="Foto immobile del post" tone={pr.id % 2 === 0 ? 'warm' : 'blue'} style={{ width: '100%', height: '100%', borderRadius: 0 }} /></div>
          <div style={{ padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13.5 }}>{pr.t}</div>
              <div style={{ fontSize: 12, color: '#666E82' }}>{pr.zone}</div>
            </div>
            <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15, color: '#3C5BAA' }}>{pr.price}</div>
          </div>
        </div>
      ))}

      {/* Reel player fittizio */}
      {p.reel && (
        <div style={{ marginTop: 12, position: 'relative', borderRadius: 16, overflow: 'hidden', height: isDesktop ? 260 : 230, background: '#15181F' }}>
          <Placeholder label="Cover del reel" tone={isDesktop ? 'violet' : 'grey'} style={{ width: '100%', height: '100%', borderRadius: 0 }} />
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: isDesktop ? 60 : 58, height: isDesktop ? 60 : 58, borderRadius: '50%', background: 'rgba(24,29,26,.55)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid rgba(255,255,255,.4)' }}>
              <Icon d={P_PLAY} size={22} fill="#fff" />
            </div>
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(24,29,26,.6)', color: '#fff', fontSize: 10.5, fontWeight: 700, borderRadius: 99, padding: '4px 9px', pointerEvents: 'none' }}>REEL · 0:30</div>
        </div>
      )}

      {/* Azioni */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, paddingTop: 10, borderTop: '1px solid #EDF0F7' }}>
        <div onClick={() => toggleLike(p.id)} className="hbg2" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 12, cursor: 'pointer', minHeight: 28 }}>
          <Icon d={P_LIKE} size={19} fill={lk ? '#E8543F' : 'none'} stroke={lk ? '#E8543F' : '#5B6376'} sw={1.8} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: lk ? '#E8543F' : '#5B6376' }}>{likeN}</span>
        </div>
        <div onClick={() => setUi(prev => ({ expandComments: { ...prev.expandComments, [p.id]: !prev.expandComments[p.id] } }))} className="hbg2" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px', borderRadius: 12, cursor: 'pointer' }}>
          <Icon d={P_COMMENT} size={19} stroke={expanded ? '#537EEC' : '#5B6376'} sw={1.8} />
          <span style={{ fontSize: 12.5, fontWeight: 700, color: expanded ? '#537EEC' : '#5B6376' }}>{commN}</span>
        </div>
        <div style={{ flex: 1 }} />
        <div onClick={() => toggleSave(p.id)} className="hbg2" style={{ padding: '8px 10px', borderRadius: 12, cursor: 'pointer' }}>
          <Icon d={P_SAVE} size={19} fill={sv ? '#537EEC' : 'none'} stroke={sv ? '#537EEC' : '#5B6376'} sw={1.8} />
        </div>
      </div>

      {/* Commenti espandibili */}
      {expanded && (
        <div style={{ marginTop: 4, paddingTop: 10, borderTop: '1px solid #EDF0F7' }}>
          {comms.length === 0 && <div style={{ fontSize: 12.5, color: '#8A91A6', padding: '2px 0 4px' }}>Nessun commento qui: rompi il ghiaccio tu.</div>}
          {comms.map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '6px 0' }}>
              <Avatar ini={c.ini} c="#DDE5FB" size={32} fs={11.5} col="#3C5BAA" />
              <div style={{ flex: 1, minWidth: 0, background: '#F4F6FA', borderRadius: 12, padding: '8px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                  <span style={{ fontWeight: 700, fontSize: 12.5 }}>{c.n}</span>
                  <span style={{ fontSize: 11, color: '#979EB2' }}>{c.h}</span>
                </div>
                <div style={{ fontSize: 13, color: '#282D39', lineHeight: 1.45, marginTop: 1 }}>{c.t}</div>
              </div>
            </div>
          ))}
          <CommentInput postId={p.id} />
        </div>
      )}

      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Eliminare il post?">
        <div style={{ fontSize: 13.5, color: '#666E82', padding: '0 2px', lineHeight: 1.5 }}>Il post verrà rimosso dal feed e dal tuo profilo. L&apos;azione non si può annullare.</div>
        <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
          <div onClick={() => setConfirmOpen(false)} className="hbg2" style={{ flex: 1, minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', border: '1.5px solid #CBD3E4', borderRadius: 13, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Annulla</div>
          <div onClick={() => { setConfirmOpen(false); deletePost(p.id) }} className="hb" style={{ flex: 1, minHeight: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#E8543F', color: '#fff', borderRadius: 13, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Elimina</div>
        </div>
      </Modal>
    </div>
  )
}

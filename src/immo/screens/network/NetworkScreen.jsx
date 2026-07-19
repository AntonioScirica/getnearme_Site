import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import Avatar from '../../components/Avatar.jsx'
import EmptyState from '../../components/EmptyState.jsx'
import PostCard from '../../components/cards/PostCard.jsx'

const FEED_TABS = [['perte', 'Per te'], ['seguiti', 'Seguiti'], ['salvati', 'Salvati']]

// Card "Da seguire" (mobile: strip orizzontale, desktop: colonna destra) — scritta una sola volta.
function SuggestCard({ s, isDesktop }) {
  const { d, follow, openAuthor } = useApp()
  const f = !!d.followed[s.id]
  if (isDesktop) {
    return (
      <div className="hbg2" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 6px', borderRadius: 12 }}>
        <div onClick={() => openAuthor(s)} style={{ display: 'flex', alignItems: 'center', gap: 11, flex: 1, minWidth: 0, cursor: 'pointer' }}>
          <Avatar ini={s.ini} c={s.c} size={40} fs={12.5} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{s.n}</div>
            <div style={{ fontSize: 11, color: '#8A91A6' }}>{s.role}</div>
          </div>
        </div>
        <div onClick={() => follow(s.id, s.n)} style={{ fontSize: 12, fontWeight: 800, color: f ? '#3C5BAA' : '#F4F6FA', background: f ? '#fff' : '#537EEC', border: '1.5px solid #537EEC', borderRadius: 99, padding: '7px 13px', cursor: 'pointer', flex: 'none' }}>{f ? 'Segui già' : 'Segui'}</div>
      </div>
    )
  }
  return (
    <div style={{ flex: 'none', width: 132, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 16, padding: '14px 12px', textAlign: 'center' }}>
      <div onClick={() => openAuthor(s)} style={{ cursor: 'pointer' }}>
        <Avatar ini={s.ini} c={s.c} size={48} fs={14} style={{ margin: '0 auto' }} />
        <div style={{ marginTop: 8, fontWeight: 700, fontSize: 13 }}>{s.n}</div>
        <div style={{ fontSize: 11, color: '#8A91A6', marginTop: 1 }}>{s.role}</div>
      </div>
      <div onClick={() => follow(s.id, s.n)} className="hb" style={{ marginTop: 9, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer', background: f ? '#fff' : '#537EEC', color: f ? '#3C5BAA' : '#F4F6FA', border: '1.5px solid #537EEC' }}>{f ? 'Segui già' : 'Segui'}</div>
    </div>
  )
}

// Composer inline in cima al feed, visibile su tutti i breakpoint.
// Card "civetta": simula il composer (avatar, testo segnaposto, pill azioni) ma non è
// interattiva — un clic in un punto qualsiasi apre la schermata Crea nuovo post.
function InlineComposer({ isDesktop }) {
  const { d, nav } = useApp()

  return (
    <div onClick={() => nav('composer')} className="hsh" style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: isDesktop ? '14px 16px' : '13px 14px', display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
      <Avatar ini={d.session.ini} c="#DDE5FB" size={42} fs={13} col="#3C5BAA" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ minHeight: 54, padding: '8px 0 0', fontSize: 14.5, lineHeight: 1.5, color: '#8A91A6' }}>
          Racconta qualcosa al tuo network: un incarico, una vendita, un consiglio di zona...
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F4F6FA', borderRadius: 99, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#3A4152' }}>
            <Icon d={ICONS.cam} size={14} stroke="#3A4152" sw={1.8} />Foto
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F4F6FA', borderRadius: 99, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#3A4152' }}>
            <Icon d={ICONS.build} size={14} stroke="#3A4152" sw={1.8} />Immobile
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#EFECFF', borderRadius: 99, padding: '7px 12px', fontSize: 12, fontWeight: 700, color: '#4B39C8' }}>
            <Icon d={ICONS.spark} size={13} fill="#6E56F8" />Copy AI
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ background: '#537EEC', color: '#F4F6FA', fontSize: 13, fontWeight: 700, borderRadius: 99, padding: '9px 18px' }}>Pubblica</div>
        </div>
      </div>
    </div>
  )
}

export default function NetworkScreen() {
  const { d, ui, setUi, nav, isDesktop } = useApp()
  const isPrivato = d.session.persona === 'privato'

  const base = ui.feedTab === 'seguiti' ? d.posts.filter(p => p.followId && d.followed[p.followId])
    : ui.feedTab === 'salvati' ? d.posts.filter(p => d.saved[p.id])
    : d.posts
  const q = (ui.feedSearch || '').trim().toLowerCase()
  const posts = q ? base.filter(p => ((p.txt || '') + ' ' + p.n).toLowerCase().includes(q)) : base

  return (
    <div style={{ maxWidth: isDesktop ? 1180 : 620, margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '26px 28px 48px' : '0 0 118px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}

      {/* Titolo + azioni: mobile ha lente + matita, desktop ha titolo + tab per te/seguiti */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: isDesktop ? '0 0 4px' : '8px 20px 2px' }}>
        {/* Network è la landing/home: su mobile l'agente apre il menu dall'avatar (come faceva dalla Home) */}
        {!isDesktop && !isPrivato && (
          <div onClick={() => setUi({ drawer: true })} style={{ width: 44, height: 44, borderRadius: '50%', background: '#DDE5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#3C5BAA', cursor: 'pointer', border: '2px solid #fff', flex: 'none' }}>{d.session.ini}</div>
        )}
        <div style={{ flex: 1, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: isDesktop ? 24 : 24, letterSpacing: '-.6px' }}>Network</div>
        {isDesktop ? (
          FEED_TABS.map(([id, t]) => {
            const a = ui.feedTab === id
            return (
              <div key={id} onClick={() => setUi({ feedTab: id })} style={{ padding: '9px 16px', borderRadius: 99, fontSize: 13, fontWeight: 700, cursor: 'pointer', background: a ? '#15181F' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #15181F' : '1px solid #DFE4EF' }}>{t}</div>
            )
          })
        ) : (
          <>
            <div onClick={() => setUi(prev => ({ searchOpen: !prev.searchOpen, feedSearch: '' }))} className="hbg2" style={{ width: 44, height: 44, borderRadius: '50%', background: ui.searchOpen ? '#15181F' : '#fff', border: ui.searchOpen ? '1px solid #15181F' : '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <Icon d={ICONS.search} size={20} stroke={ui.searchOpen ? '#F4F6FA' : '#15181F'} sw={1.8} />
            </div>
            {isPrivato ? (
              <div onClick={() => setUi({ drawer: true })} style={{ width: 44, height: 44, borderRadius: '50%', background: '#DDE5FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, color: '#3C5BAA', cursor: 'pointer', border: '2px solid #fff' }}>{d.session.ini}</div>
            ) : (
              <div onClick={() => nav('composer')} className="hb" style={{ width: 44, height: 44, borderRadius: '50%', background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Icon d={ICONS.pencil} size={19} stroke="#F4F6FA" sw={1.9} />
              </div>
            )}
          </>
        )}
      </div>

      {!isDesktop && ui.searchOpen && (
        <div style={{ margin: '10px 20px 0', display: 'flex', alignItems: 'center', gap: 10, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 15, padding: '11px 15px' }}>
          <Icon d={ICONS.search} size={18} stroke="#979EB2" sw={1.9} />
          <input
            autoFocus
            value={ui.feedSearch}
            onChange={e => setUi({ feedSearch: e.target.value })}
            placeholder="Cerca post o agenti..."
            style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontSize: 14.5, color: '#15181F' }}
          />
          {ui.feedSearch && <div onClick={() => setUi({ feedSearch: '' })} style={{ fontSize: 12, fontWeight: 700, color: '#8A91A6', cursor: 'pointer' }}>Cancella</div>}
        </div>
      )}

      {!isDesktop && (
        <div style={{ display: 'flex', gap: 8, padding: '12px 20px 4px' }}>
          {FEED_TABS.map(([id, t]) => {
            const a = ui.feedTab === id
            return (
              <div key={id} onClick={() => setUi({ feedTab: id })} className={a ? '' : 'hbg2'} style={{ padding: '9px 16px', borderRadius: 99, fontSize: 13.5, fontWeight: 700, cursor: 'pointer', background: a ? '#15181F' : '#fff', color: a ? '#F4F6FA' : '#485062', border: a ? '1px solid #15181F' : '1px solid #DFE4EF' }}>{t}</div>
            )
          })}
        </div>
      )}

      <div style={{ display: isDesktop ? 'grid' : 'block', gridTemplateColumns: isDesktop ? 'minmax(0,1fr) minmax(260px,340px)' : 'none', gap: 20, marginTop: isDesktop ? 14 : 0, alignItems: 'start' }}>
        <div>
          {/* Composer inline (non per il privato: sola lettura) */}
          {!isPrivato && (
            <div style={{ padding: isDesktop ? 0 : '14px 20px 0' }}>
              <InlineComposer isDesktop={isDesktop} />
            </div>
          )}

          {/* Suggerimenti: strip orizzontale su mobile, colonna dedicata su desktop */}
          {!isDesktop && (
            <div style={{ padding: '16px 0 4px 20px' }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: '#979EB2', paddingBottom: 9 }}>Da seguire nella tua zona</div>
              <div className="no-scrollbar" style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingRight: 20 }}>
                {d.suggest.map(s => <SuggestCard key={s.id} s={s} isDesktop={false} />)}
              </div>
            </div>
          )}

          {/* Feed */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isDesktop ? 14 : 12, padding: isDesktop ? '16px 0 0' : '14px 20px 0' }}>
            {ui.feedTab === 'seguiti' && posts.length === 0 && (
              <EmptyState
                icon={ICONS.users}
                title="Ancora nessun post qui"
                sub="Segui altri agenti per vedere i loro post qui."
                cta="Scopri il feed Per te"
                onCta={() => setUi({ feedTab: 'perte' })}
              />
            )}
            {ui.feedTab === 'perte' && posts.length === 0 && (
              <EmptyState icon={ICONS.search} title="Nessun post trovato" sub="Prova con un altro termine di ricerca." />
            )}
            {ui.feedTab === 'salvati' && posts.length === 0 && (
              <EmptyState
                icon={ICONS.star}
                title="Nessun post salvato"
                sub="Tocca il segnalibro su un post per ritrovarlo qui."
                cta="Sfoglia il feed"
                onCta={() => setUi({ feedTab: 'perte' })}
              />
            )}
            {posts.map(p => <PostCard key={p.id} post={p} />)}
          </div>
        </div>

        {/* Colonna destra "Da seguire" (solo desktop) */}
        {isDesktop && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 0 }}>
            <div style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 20, padding: 16 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15.5, letterSpacing: '-.3px' }}>Da seguire nella tua zona</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 10 }}>
                {d.suggest.map(s => <SuggestCard key={s.id} s={s} isDesktop={true} />)}
              </div>
            </div>
            <div style={{ background: 'linear-gradient(150deg,#16213D,#3C5BAA)', borderRadius: 20, padding: 16 }}>
              <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 15, color: '#F4F6FA', letterSpacing: '-.3px' }}>I post con immobile allegato</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: 'rgba(255,255,255,.75)', lineHeight: 1.5 }}>generano in media <b style={{ color: '#BECEF8' }}>3× più lead</b>. Allega il trilocale al prossimo post.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

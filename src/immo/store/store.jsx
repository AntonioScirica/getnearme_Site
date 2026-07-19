import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { seedData, seedFreshData, seedUi, COPYTEXTS, DEAL_STAGE_META } from '../data/seed.js'
import { supabase } from '@/lib/supabase'

// v3: account editabile (session.phone/zone), notifiche solo-email, immobili con `type`.
// Il bump di chiave fa ripartire dal seed aggiornato le sessioni demo già salvate in localStorage.
const KEY_DATA = 'agente-immo-data-v3'
const KEY_UI = 'agente-immo-ui-v3'

// Etichetta ruolo mostrata (sidebar/drawer/profilo) in base alla persona scelta in registrazione.
const ROLE_LABEL = {
  agente: 'Agente immobiliare · Milano Sud-Est',
  agenzia: 'Agenzia immobiliare · Milano',
  privato: 'Privato · in cerca casa',
}

const Ctx = createContext(null)

function load(key, seed) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return seed()
    const parsed = JSON.parse(raw)
    // merge superficiale col seed: nuove chiavi aggiunte in sviluppo non rompono lo stato salvato
    return { ...seed(), ...parsed }
  } catch {
    return seed()
  }
}

// Reset per-schermata applicati a ogni navigazione (come nel prototipo)
const RESETS = {
  signup: { signupStep: 1 },
  onboarding: { obStep: 1 },
  newprop: { np: null }, // gestito ad hoc in nav()
  staging: { stag: null },
  videoai: { vid: null },
  copyai: { copy: null },
}

// Alias: schermate del vecchio prototipo → schermata unificata + patch UI
const AI_TABS = ['staging', 'photoedit', 'videoai', 'copyai', 'planner']
function aliasScreen(screen) {
  if (AI_TABS.includes(screen)) return { screen: 'aistudio', patch: { aiTab: screen } }
  if (screen === 'propdetail') return { screen: 'properties', patch: { propOpen: true } }
  if (screen === 'leaddetail') return { screen: 'crm', patch: { leadOpen: true } }
  if (screen === 'chat') return { screen: 'messages', patch: { chatPane: true } }
  return { screen, patch: {} }
}

export function AppProvider({ children }) {
  const [d, setD] = useState(() => load(KEY_DATA, seedData))
  const [ui, setUiState] = useState(() => load(KEY_UI, seedUi))
  const [toastMsg, setToastMsg] = useState('')
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 900px)').matches)
  const toastTimer = useRef(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)')
    const fn = e => setIsDesktop(e.matches)
    mq.addEventListener('change', fn)
    return () => mq.removeEventListener('change', fn)
  }, [])

  useEffect(() => { try { localStorage.setItem(KEY_DATA, JSON.stringify(d)) } catch { /* pieno o bloccato: ignora */ } }, [d])
  useEffect(() => { try { localStorage.setItem(KEY_UI, JSON.stringify(ui)) } catch { /* ignora */ } }, [ui])

  // Sessione Supabase reale: al mount (refresh o ritorno da OAuth) se c'e' una
  // sessione valida l'utente entra direttamente, senza ripassare dal login.
  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      const u = data?.session?.user
      if (!alive || !u) return
      const nm = u.user_metadata?.full_name || u.user_metadata?.name || (u.email || '').split('@')[0]
      const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      setD(prev => prev.session.loggedIn
        ? { ...prev, session: { ...prev.session, name: nm, email: u.email, ini } }
        : { ...seedData(), session: { ...seedData().session, loggedIn: true, name: nm, email: u.email, ini } })
      setUiState(prev => (['login', 'signup', 'onboarding'].includes(prev.screen) ? { ...prev, screen: 'network', hist: [] } : prev))
    }).catch(() => { /* offline: resta sul login */ })
    return () => { alive = false }
  }, [])

  const api = useMemo(() => {
    const setData = patch => setD(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
    const setUi = patch => setUiState(prev => ({ ...prev, ...(typeof patch === 'function' ? patch(prev) : patch) }))
    const toast = m => {
      clearTimeout(toastTimer.current)
      setToastMsg(m)
      toastTimer.current = setTimeout(() => setToastMsg(''), 2300)
    }
    const scrollTop = () => { if (scrollRef.current) scrollRef.current.scrollTop = 0 }

    const nav = (rawScreen, extra = {}) => {
      const { screen, patch } = aliasScreen(rawScreen)
      setUiState(prev => {
        const resets = { ...(RESETS[rawScreen] || {}) }
        if (rawScreen === 'newprop') resets.np = seedUi().np
        if (rawScreen === 'staging') resets.stag = seedUi().stag
        if (rawScreen === 'videoai') resets.vid = seedUi().vid
        if (rawScreen === 'copyai') resets.copy = { ...prev.copy, done: false }
        // chatPane:false → entrando in Messaggi dal menu si mostra sempre la lista (non un thread
        // stantìo). openChat/openNotif passano chatPane:true in extra, che prevale su questo reset.
        const closeOverlays = { drawer: false, create: false, notifPop: false, propOpen: false, leadOpen: false, dealOpen: false, authorOpen: false, propPickerOpen: false, chatPane: false, editContact: null, addLeadOpen: false, dealPickerOpen: false, aiArchiveOpen: false }
        return { ...prev, ...resets, ...closeOverlays, screen, hist: [...prev.hist, prev.screen].slice(-30), ...patch, ...extra }
      })
      requestAnimationFrame(scrollTop)
    }
    const back = () => {
      setUiState(prev => {
        const hist = [...prev.hist]
        const p = hist.pop() || 'network'
        return { ...prev, screen: p, hist, drawer: false, create: false }
      })
      requestAnimationFrame(scrollTop)
    }

    const nowH = () => new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

    return {
      setData, setUi, toast, nav, back, scrollRef, nowH,

      // ---- helper di lettura ----
      propById: id => d.props.find(p => p.id === id),
      leadById: id => d.leads.find(l => l.id === id),
      unreadMsgs: () => d.convos.reduce((a, c) => a + c.unread, 0),
      unreadNotifs: () => d.notifs.filter(n => n.unread).length,
      commentsOf: id => d.comments[id] || [],

      // ---- sessione ----
      // Login reale (Supabase). Il resto del dataset resta il seed demo finche'
      // le singole sezioni non vengono collegate ai dati veri.
      login: async (email, pass) => {
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) { toast(error.message === 'Invalid login credentials' ? 'Email o password sbagliate' : error.message); return false }
        const u = authData.user
        const nm = u?.user_metadata?.full_name || u?.user_metadata?.name || (u?.email || email).split('@')[0]
        const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const full = seedData()
        setData({ ...full, session: { ...full.session, loggedIn: true, name: nm, email: u?.email || email, ini } })
        nav('network')
        return true
      },
      // OAuth: redirect a Google via Supabase; al ritorno restoreSession riaggancia.
      loginWithGoogle: async () => {
        await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${window.location.origin}/app` } })
      },
      logout: async () => {
        try { await supabase.auth.signOut() } catch { /* offline: ignora */ }
        setData(prev => ({ session: { ...prev.session, loggedIn: false } }))
        nav('login', { hist: [] })
      },
      // Registrazione: installa il dataset VUOTO (solo contenuti di altri utenti), imposta la
      // persona scelta e instrada il privato direttamente al feed (niente onboarding da agente).
      finishSignup: (name, mail, role) => {
        const fresh = seedFreshData()
        const nm = name || fresh.session.name
        const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const roleLabel = ROLE_LABEL[role] || ROLE_LABEL.agente
        // Zona coerente col ruolo: per agente/agenzia è il segmento dopo "·"; per il privato è la zona di ricerca.
        const zone = role === 'privato' ? 'Milano' : (roleLabel.split(' · ')[1] || 'Milano')
        setData({ ...fresh, session: { ...fresh.session, loggedIn: true, name: nm, email: mail || fresh.session.email, ini, zone, persona: role, role: roleLabel } })
        if (role === 'privato') nav('network')
        else nav('onboarding', { obStep: 1 })
      },

      // ---- navigazione entità (indipendente dal breakpoint: overlay responsive) ----
      openProp: id => setUi({ selProp: id, propOpen: true, leadOpen: false, dealOpen: false }),
      closeProp: () => setUi({ propOpen: false }),
      openLead: id => setUi({ selLead: id, leadOpen: true, propOpen: false, dealOpen: false }),
      closeLead: () => setUi({ leadOpen: false }),
      openDeal: id => setUi({ selDeal: id, dealOpen: true, propOpen: false, leadOpen: false }),
      closeDeal: () => setUi({ dealOpen: false }),
      // selAuthor contiene direttamente l'oggetto autore denormalizzato (n, role, ini, c, followId)
      openAuthor: author => setUi({ selAuthor: author, authorOpen: true }),
      closeAuthor: () => setUi({ authorOpen: false }),
      openChat: id => {
        setData(prev => ({ convos: prev.convos.map(c => c.id === id ? { ...c, unread: 0 } : c) }))
        nav('messages', { selChat: id, chatPane: true })
      },

      // ---- immobili ----
      addProperty: () => {
        const np = ui.np
        const id = d.nextId
        const tipoTitles = { Appartamento: ['Bilocale accogliente', 'Trilocale luminoso', 'Quadrilocale spazioso'], Attico: ['Attico con terrazzo'], Villa: ['Villa con giardino'], Ufficio: ['Ufficio open space'] }
        const baseT = np.tipo === 'Appartamento' ? (np.loc <= 2 ? 'Bilocale luminoso' : np.loc === 3 ? 'Trilocale luminoso' : 'Quadrilocale spazioso') : tipoTitles[np.tipo][0]
        // Il wizard pubblica subito: lo stato dipende dal tipo scelto (default Vendita → "In vendita").
        const isRent = np.type === 'Affitto'
        const prop = {
          id, t: baseT, zone: np.zone || 'Milano', type: np.type || 'Vendita',
          price: isRent ? `€ ${np.price || '1.200'}/mese` : `€ ${np.price || '350.000'}`,
          tag: isRent ? 'In affitto' : 'In vendita', m2: parseInt(np.m2) || 90, loc: np.loc, ba: np.bagni, pi: (np.piano || '3') + '°', cls: np.cls || 'B', views: 0,
          desc: `${baseT} di ${np.m2 || 90} m² in ${np.addr || np.zone}. ${Object.keys(np.extras).filter(k => np.extras[k]).join(', ')}. ${np.ai ? 'Annuncio ottimizzato con Copy AI.' : ''}`,
          mine: true,
        }
        setData(prev => ({ props: [...prev.props, prop], nextId: prev.nextId + 1 }))
        setUi(prev => ({ np: { ...prev.np, createdId: id, step: 5 }, selProp: id }))
        return id
      },
      // Modifica di un immobile esistente: applica il patch e conferma con un toast.
      updateProperty: (id, patch) => {
        setData(prev => ({ props: prev.props.map(p => p.id === id ? { ...p, ...patch } : p) }))
        toast('Immobile aggiornato')
      },
      publishProp: id => {
        const p = d.props.find(x => x.id === id)
        if (p && p.tag === 'Bozza') {
          // Alla pubblicazione lo stato segue il tipo dell'immobile (default Vendita → "In vendita").
          const tag = p.type === 'Affitto' ? 'In affitto' : 'In vendita'
          setData(prev => ({ props: prev.props.map(x => x.id === id ? { ...x, tag } : x) }))
          toast('Annuncio pubblicato: ora è visibile a tutti')
        } else {
          toast('Annuncio aggiornato e condiviso')
        }
      },
      applyCopy: (propId, type) => {
        if (type === 'Annuncio portale') {
          setData(prev => ({ props: prev.props.map(x => x.id === propId ? { ...x, desc: COPYTEXTS['Annuncio portale'] } : x) }))
          toast('Annuncio aggiornato con il testo generato')
        } else if (type === 'Post social') {
          setUi({ postText: COPYTEXTS['Post social'] })
          nav('composer')
          toast('Testo pronto nel composer')
        } else {
          toast('Bozza email pronta da inviare')
        }
      },

      // ---- feed ----
      toggleLike: id => setData(prev => ({ liked: { ...prev.liked, [id]: !prev.liked[id] } })),
      toggleSave: id => {
        const was = !!d.saved[id]
        setData(prev => ({ saved: { ...prev.saved, [id]: !prev.saved[id] } }))
        if (!was) toast('Salvato nei preferiti')
      },
      toggleSaveProp: id => {
        const was = !!d.savedProps[id]
        setData(prev => ({ savedProps: { ...prev.savedProps, [id]: !prev.savedProps[id] } }))
        toast(was ? 'Immobile rimosso dai preferiti' : 'Immobile salvato nei preferiti')
      },
      follow: (id, name) => {
        const was = !!d.followed[id]
        setData(prev => ({ followed: { ...prev.followed, [id]: !prev.followed[id] } }))
        if (!was && name) toast('Ora segui ' + name)
      },
      addComment: (postId, text) => {
        if (!text.trim()) return
        setData(prev => ({ comments: { ...prev.comments, [postId]: [...(prev.comments[postId] || []), { n: prev.session.name, ini: prev.session.ini, t: text.trim(), h: 'adesso' }] } }))
      },
      publishPost: (txt, extra = {}) => {
        if (!txt.trim() && !extra.reel) { toast('Scrivi qualcosa prima di pubblicare'); return false }
        setData(prev => ({
          posts: [{ id: prev.nextId, n: prev.session.name, role: 'Agente · Milano Sud-Est', ini: prev.session.ini, c: '#DDE5FB', time: 'adesso', txt: txt.trim(), likes: 0, comm: 0, mine: true, ...extra }, ...prev.posts],
          nextId: prev.nextId + 1,
        }))
        setUi({ postText: '' })
        nav('network')
        toast(extra.reel ? 'Reel pubblicato sul feed' : 'Post pubblicato sul feed')
        return true
      },
      // Elimina un post dell'utente (mine): via da feed e profilo, ripulendo like/salvati/commenti.
      deletePost: id => {
        setData(prev => {
          const liked = { ...prev.liked }; delete liked[id]
          const saved = { ...prev.saved }; delete saved[id]
          const comments = { ...prev.comments }; delete comments[id]
          return { posts: prev.posts.filter(p => p.id !== id), liked, saved, comments }
        })
        toast('Post eliminato')
      },

      // ---- CRM ----
      setLeadStage: (leadId, stage) => {
        setData(prev => ({
          leads: prev.leads.map(l => l.id === leadId ? { ...l, stage, tl: [...l.tl, { t: 'Spostato in fase ' + stage, d2: 'Aggiornato da te', h: nowH() + ' · oggi', k: 'stage' }] } : l),
        }))
      },
      addLeadNote: (leadId, text) => {
        if (!text.trim()) return
        setData(prev => ({ leads: prev.leads.map(l => l.id === leadId ? { ...l, tl: [...l.tl, { t: 'Nota aggiunta', d2: text.trim(), h: nowH() + ' · oggi', k: 'note' }] } : l) }))
        toast('Nota aggiunta alla timeline')
      },
      scheduleVisit: leadId => {
        const l = d.leads.find(x => x.id === leadId)
        const p = l && d.props.find(x => x.id === l.propId)
        setData(prev => ({
          agenda: [...prev.agenda, { h: '17:00', t: 'Visita · ' + (p ? p.t : 'immobile'), d: 'con ' + (l ? l.n : ''), hbg: '#EAF0FD', hc: '#3C5BAA' }],
          leads: prev.leads.map(x => x.id === leadId ? { ...x, tl: [...x.tl, { t: 'Visita pianificata', d2: 'Domani · 17:00 · ' + (p ? p.zone : ''), h: nowH() + ' · oggi', k: 'cal' }] } : x),
        }))
        toast('Visita aggiunta al calendario')
      },
      createDeal: leadId => {
        const l = d.leads.find(x => x.id === leadId)
        const p = l && d.props.find(x => x.id === l.propId)
        if (d.deals.some(dl => dl.who === l.n)) { nav('crm', { crmTab: 'trattative' }); toast('Trattativa già aperta con ' + l.n); return }
        const { pct, col } = DEAL_STAGE_META.Proposta
        setData(prev => ({
          deals: [...prev.deals, { id: prev.nextId, t: p ? p.t : 'Immobile', who: l.n, val: p ? p.price : '—', stage: 'Proposta', pct, note: 'Trattativa aperta oggi', col }],
          nextId: prev.nextId + 1,
        }))
        nav('crm', { crmTab: 'trattative' })
        toast('Trattativa creata')
      },
      // Avanza/arretra una trattativa nella pipeline commerciale: pct e colore seguono la fase
      // (DEAL_STAGE_META), così seed e trattative create restano coerenti senza dati salvati extra.
      setDealStage: (dealId, stage) => {
        const meta = DEAL_STAGE_META[stage] || DEAL_STAGE_META.Proposta
        setData(prev => ({ deals: prev.deals.map(dl => dl.id === dealId ? { ...dl, stage, pct: meta.pct, col: meta.col } : dl) }))
        toast('Trattativa aggiornata')
      },
      addContact: c => {
        const ini = c.n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const palette = ['#F3D9C8', '#D6E4F0', '#DDE5FB', '#EAD9EC', '#F0E4CE', '#D9E6F2']
        setData(prev => ({ contacts: [...prev.contacts, { ...c, ini, c: palette[prev.contacts.length % palette.length] }].sort((a, b) => a.n.localeCompare(b.n)) }))
        setUi({ addContactOpen: false })
        toast(c.n + ' aggiunto ai contatti')
      },
      // Modifica un contatto esistente (chiave: nome). Ricalcola le iniziali se cambia il nome e
      // riordina la rubrica. Vincolo: i nomi fungono da chiave nei join, quindi devono restare unici.
      updateContact: (name, patch) => {
        const nm = (patch.n && patch.n.trim()) || name
        const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        setData(prev => ({ contacts: prev.contacts.map(c => c.n === name ? { ...c, ...patch, n: nm, ini } : c).sort((a, b) => a.n.localeCompare(b.n)) }))
        setUi({ editContact: null })
        toast('Contatto aggiornato')
      },
      deleteContact: name => {
        setData(prev => ({ contacts: prev.contacts.filter(c => c.n !== name) }))
        setUi({ editContact: null })
        toast('Contatto eliminato')
      },
      // Crea un lead (richiesta in arrivo) e lo aggancia alla rubrica creando il contatto
      // corrispondente se non esiste già (i join Lead/Contatti/Trattative sono per nome).
      addLead: lead => {
        const nm = lead.n.trim()
        const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
        const palette = ['#F3D9C8', '#D6E4F0', '#DDE5FB', '#EAD9EC', '#F0E4CE', '#D9E6F2']
        setData(prev => {
          const c = palette[prev.leads.length % palette.length]
          const newLead = { id: prev.nextId, n: nm, ini, c, propId: lead.propId || null, src: lead.src || 'Agente Immo', time: 'adesso', stage: lead.stage || 'Nuovo', hot: false, ph: lead.ph || '—', mail: lead.mail || '—', msg: lead.msg || 'Lead aggiunto manualmente al CRM.', tl: [] }
          const hasContact = prev.contacts.some(x => x.n === nm)
          const contacts = hasContact ? prev.contacts : [...prev.contacts, { n: nm, ini, c: palette[prev.contacts.length % palette.length], tag: lead.tag || 'Compratore', ph: lead.ph || '—', mail: lead.mail || '—' }].sort((a, b) => a.n.localeCompare(b.n))
          return { leads: [...prev.leads, newLead], contacts, nextId: prev.nextId + 1 }
        })
        setUi({ addLeadOpen: false, addLeadStage: null })
        nav('crm', { crmTab: 'lead' })
        toast(nm + ' aggiunto ai lead')
      },

      // ---- messaggi ----
      sendMessage: (convoId, text) => {
        const t = text.trim()
        if (!t) return
        setData(prev => ({
          threads: { ...prev.threads, [convoId]: [...(prev.threads[convoId] || []), { me: true, t, h: nowH() }] },
          convos: prev.convos.map(c => c.id === convoId ? { ...c, last: t, time: nowH() } : c),
        }))
        setUi({ chatInput: '' })
        // risposta simulata per i lead: il "backend" finto risponde dopo qualche secondo
        const convo = d.convos.find(c => c.id === convoId)
        if (convo && convo.tag === 'Lead') {
          const reply = 'Perfetto, grazie! Le faccio sapere al più presto.'
          setTimeout(() => {
            setD(prev => ({
              ...prev,
              threads: { ...prev.threads, [convoId]: [...(prev.threads[convoId] || []), { me: false, t: reply, h: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }] },
              convos: prev.convos.map(c => c.id === convoId ? { ...c, last: reply, time: 'adesso' } : c),
            }))
          }, 2500)
        }
      },
      draftReply: convoId => {
        const convo = d.convos.find(c => c.id === convoId)
        setUi({ chatInput: convo && convo.tag === 'Lead' ? 'Buongiorno! Sono disponibile giovedì dalle 17 alle 19 per una visita, le va bene?' : 'Perfetto, grazie! Ti aggiorno a breve.' })
        toast('AI: bozza pronta nel campo di testo')
      },

      // ---- notifiche ----
      markNotifsRead: () => { setData(prev => ({ notifs: prev.notifs.map(n => ({ ...n, unread: false })) })); toast('Tutte le notifiche lette') },
      openNotif: n => {
        setData(prev => ({ notifs: prev.notifs.map(x => x.id === n.id ? { ...x, unread: false } : x) }))
        if (n.target.kind === 'lead') nav('crm', { selLead: n.target.id, leadOpen: true })
        else if (n.target.kind === 'chat') { setData(prev => ({ convos: prev.convos.map(c => c.id === n.target.id ? { ...c, unread: 0 } : c) })); nav('messages', { selChat: n.target.id, chatPane: true }) }
        else nav(n.target.id)
      },

      // ---- crediti & AI ----
      spendCredits: (n, label) => {
        if (d.credits < n) { toast('Crediti esauriti: passa a Pro AI'); nav('billing'); return false }
        setData(prev => ({ credits: prev.credits - n }))
        if (label) toast(label)
        return true
      },
      // L'hub mostra solo le prime 6 (slice al render); l'archivio completo le mostra tutte, quindi
      // qui teniamo una cronologia più lunga (cap a 30 per non far crescere lo stato all'infinito).
      addRecent: r => setData(prev => ({ recents: [{ ...r, time: 'adesso' }, ...prev.recents].slice(0, 30) })),

      // ---- planner ----
      schedulePost: (dayIdx, item) => {
        setData(prev => ({ sched: { ...prev.sched, [dayIdx]: [...(prev.sched[dayIdx] || []), item].sort((a, b) => a.h.localeCompare(b.h)) } }))
        setUi({ planAddOpen: false })
        toast('Contenuto programmato')
      },

      // ---- piani & impostazioni ----
      setPlan: name => {
        setData(prev => ({ plan: name, credits: name === 'Pro AI' ? Math.max(prev.credits, 100) : name === 'Agency' ? Math.max(prev.credits, 250) : prev.credits }))
        toast('Piano ' + name + ' attivato')
      },
      toggleSetting: k => setData(prev => ({ setts: { ...prev.setts, [k]: !prev.setts[k] } })),
      // Aggiorna nome/bio e i campi account (telefono, zona). La mail NON è modificabile qui (assistenza).
      // Cambiando la zona, per agente/agenzia si ricompone anche il segmento zona del ruolo mostrato.
      updateProfile: ({ name, bio, phone, zone }) => {
        setData(prev => {
          const nm = ((name ?? prev.session.name).trim()) || prev.session.name
          const ini = nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
          const zn = (zone ?? prev.session.zone ?? '').trim() || prev.session.zone
          const ph = (phone ?? prev.session.phone ?? '').trim() || prev.session.phone
          const roleBase = (prev.session.role || '').split(' · ')[0]
          const role = (prev.session.persona !== 'privato' && zn) ? `${roleBase} · ${zn}` : prev.session.role
          return { session: { ...prev.session, name: nm, ini, phone: ph, zone: zn, role }, bio: bio ?? prev.bio }
        })
        toast('Profilo aggiornato')
      },
      resetDemo: () => {
        localStorage.removeItem(KEY_DATA); localStorage.removeItem(KEY_UI)
        setD(seedData()); setUiState(seedUi())
      },
    }
  }, [d, ui, isDesktop])

  const value = { d, ui, toastMsg, isDesktop, ...api }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useApp() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useApp must be used within AppProvider')
  return v
}

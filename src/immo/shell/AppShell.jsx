import { useApp } from '../store/store.jsx'
import { ICONS } from '../data/seed.js'
import Icon from '../components/Icon.jsx'
import Avatar from '../components/Avatar.jsx'
import Toast from '../components/Toast.jsx'
import Modal from '../components/Modal.jsx'
import EmptyState from '../components/EmptyState.jsx'
import GlobalSearch from './GlobalSearch.jsx'

import LoginScreen from '../screens/auth/LoginScreen.jsx'
import SignupScreen from '../screens/auth/SignupScreen.jsx'
import OnboardingScreen from '../screens/auth/OnboardingScreen.jsx'
import NotificationsScreen from '../screens/home/NotificationsScreen.jsx'
import AgendaScreen from '../screens/home/AgendaScreen.jsx'
import NetworkScreen from '../screens/network/NetworkScreen.jsx'
import ComposerScreen from '../screens/network/ComposerScreen.jsx'
import PropertiesScreen from '../screens/properties/PropertiesScreen.jsx'
import NewPropertyWizard from '../screens/properties/NewPropertyWizard.jsx'
import PropertyDetail from '../screens/properties/PropertyDetail.jsx'
import CrmScreen from '../screens/crm/CrmScreen.jsx'
import LeadDetail from '../screens/crm/LeadDetail.jsx'
import DealDetail from '../screens/crm/DealDetail.jsx'
import AiStudioScreen from '../screens/aistudio/AiStudioScreen.jsx'
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen.jsx'
import MessagesScreen from '../screens/messages/MessagesScreen.jsx'
import ProfileScreen from '../screens/account/ProfileScreen.jsx'
import AuthorProfile from '../screens/account/AuthorProfile.jsx'
import AgencyScreen from '../screens/account/AgencyScreen.jsx'
import SettingsScreen from '../screens/account/SettingsScreen.jsx'
import BillingScreen from '../screens/account/BillingScreen.jsx'

const SCREENS = {
  login: LoginScreen, signup: SignupScreen, onboarding: OnboardingScreen,
  notifications: NotificationsScreen, agenda: AgendaScreen,
  network: NetworkScreen, composer: ComposerScreen,
  properties: PropertiesScreen, newprop: NewPropertyWizard,
  crm: CrmScreen, aistudio: AiStudioScreen, analytics: AnalyticsScreen,
  messages: MessagesScreen, profile: ProfileScreen, agency: AgencyScreen,
  settings: SettingsScreen, billing: BillingScreen,
}

const AUTH_SCREENS = ['login', 'signup', 'onboarding']
const TABBAR_SCREENS = ['network', 'messages', 'properties', 'crm', 'aistudio', 'analytics']

// Schermate accessibili per tipo di account.
// - agente: professionista singolo (niente 'agency'/team)
// - agenzia: agente + 'agency' (team, inviti, analytics di team)
// - privato: sola lettura → feed, immobili in vetrina, messaggi, profilo, notifiche, impostazioni
const AGENT_SCREENS = ['network', 'properties', 'newprop', 'composer', 'crm', 'aistudio', 'analytics', 'messages', 'notifications', 'agenda', 'profile', 'settings', 'billing']
const ACCESS = {
  agente: AGENT_SCREENS,
  agenzia: [...AGENT_SCREENS, 'agency'],
  privato: ['network', 'messages', 'profile', 'notifications', 'settings'],
}
const LANDING = { agente: 'network', agenzia: 'network', privato: 'network' }
// Tab bar mobile dedicata al privato (nessun FAB "Crea", niente sezione Immobili a sé).
const TABBAR_PRIVATO = [
  ['network', 'Network', 'M9 11.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM3.2 20.5c.4-3.2 2.8-5.1 5.8-5.1s5.4 1.9 5.8 5.1M15.5 4.8a2.9 2.9 0 0 1 0 5.7M17.6 15.6c2.1.5 3.4 1.9 3.7 4.2'],
  ['messages', 'Messaggi', 'M21 11.8a8.4 8.4 0 0 1-12.3 7.4L4 20.5l1.3-4.3A8.4 8.4 0 1 1 21 11.8Z'],
  ['profile', 'Profilo', 'M12 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6ZM4.8 20.5c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6'],
]
// Impostazioni NON è qui: si raggiunge dal Profilo (area account). Vedi ProfileScreen.
const SIDEBAR = [
  ['network', 'Network', ICONS.users],
  ['properties', 'Immobili', ICONS.build],
  ['crm', 'CRM', ICONS.funnel],
  ['aistudio', 'AI Studio', ICONS.spark],
  ['analytics', 'Analytics', ICONS.trend],
  ['messages', 'Messaggi', ICONS.chat],
  ['agency', 'Agenzia', ICONS.biz],
]
const TABBAR = [
  ['network', 'Network', ICONS.home],
  ['messages', 'Messaggi', ICONS.chat],
  ['properties', 'Immobili', ICONS.build],
  ['crm', 'CRM', ICONS.funnel],
]

export default function AppShell() {
  const app = useApp()
  const { d, ui, nav, toastMsg, scrollRef, setUi, isDesktop, logout, unreadMsgs, unreadNotifs, markNotifsRead, openNotif } = app

  // Gating per tipo di account: schermate consentite + landing di default.
  const persona = d.session.persona || 'agente'
  const allowed = ACCESS[persona] || ACCESS.agente
  const landing = LANDING[persona] || 'network'
  const isPrivato = persona === 'privato'
  // Sidebar desktop comprimibile: da estesa (238px) a sole icone (76px) con tooltip all'hover.
  const collapsed = !!ui.sidebarCollapsed
  const toggleSidebar = () => setUi({ sidebarCollapsed: !ui.sidebarCollapsed })

  // Resolver: onboarding è transitorio post-signup (utente loggato); altrimenti la schermata
  // deve esistere ED essere consentita, sennò si atterra sulla landing della persona.
  const screen = d.session.loggedIn
    ? (ui.screen === 'onboarding' ? 'onboarding' : (SCREENS[ui.screen] && allowed.includes(ui.screen) ? ui.screen : landing))
    : (AUTH_SCREENS.includes(ui.screen) ? ui.screen : 'login')
  const Screen = SCREENS[screen]
  const tabbarScreens = isPrivato ? ['network', 'messages', 'profile'] : TABBAR_SCREENS
  // Entrando in una conversazione (chat aperta) su mobile la tab bar sparisce, così il thread è a tutto schermo.
  const showTabbar = !isDesktop && tabbarScreens.includes(screen) && !(screen === 'messages' && ui.chatPane)

  // Schermate di autenticazione: nessuna chrome
  if (AUTH_SCREENS.includes(screen)) {
    return (
      <div style={{ height: '100dvh', overflow: 'hidden', background: '#F4F6FA', display: 'flex', flexDirection: 'column' }}>
        <div className="no-scrollbar" style={{ flex: 1, overflowY: 'auto' }} ref={scrollRef}><Screen /></div>
        <Toast msg={toastMsg} bottom={40} />
      </div>
    )
  }

  const nMsgs = unreadMsgs()
  const nNotifs = unreadNotifs()

  // Il privato non crea nulla (sola lettura): nessuna opzione "Crea".
  const createOptions = isPrivato ? [] : [
    { t: 'Immobile', sub: 'Nuovo incarico con foto AI', d: ICONS.build, ibg: '#EAF0FD', ic: '#3C5BAA', on: () => nav('newprop') },
    { t: 'Post', sub: 'Racconta qualcosa al network', d: ICONS.pencil, ibg: '#FBF1DC', ic: '#8A6E24', on: () => nav('composer') },
    { t: 'Lead', sub: 'Nuova richiesta da seguire', d: ICONS.funnel, ibg: '#E4EDF7', ic: '#2E5C8A', on: () => nav('crm', { crmTab: 'lead', addLeadOpen: true }) },
    { t: 'Contatto', sub: 'Aggiungi alla rubrica', d: ICONS.user, ibg: '#EAF0FD', ic: '#3C5BAA', on: () => nav('crm', { crmTab: 'contatti', addContactOpen: true }) },
    { t: 'Progetto AI', sub: 'Staging, video, copy, social', d: ICONS.spark, ibg: '#EFECFF', ic: '#4B39C8', on: () => nav('aistudio', { aiTab: 'hub' }) },
  ]

  const menuItems = [
    [ICONS.user, 'Il mio profilo', 'profile', ''],
    [ICONS.spark, 'AI Studio', 'aistudio', d.credits + ' crediti'],
    [ICONS.trend, 'Analytics', 'analytics', ''],
    [ICONS.biz, 'Agenzia', 'agency', ''],
    [ICONS.chat, 'Messaggi', 'messages', ''],
    [ICONS.bell, 'Notifiche', 'notifications', ''],
    [ICONS.card, 'Piani e fatturazione', 'billing', ''],
    // Impostazioni: raggiungibile dal Profilo (voce dedicata), non da questo menu.
  ].filter(([, , id]) => allowed.includes(id))

  return (
    <div style={{ height: '100dvh', overflow: 'hidden', background: '#F4F6FA', display: 'flex' }}>
      {/* ---- Sidebar (solo ≥900px) — comprimibile a sole icone ---- */}
      {isDesktop && (
        <div style={{ width: collapsed ? 76 : 238, flex: 'none', display: 'flex', flexDirection: 'column', borderRight: '1px solid #E6EAF3', background: '#F4F6FA', transition: 'width .18s ease' }}>
          {/* Header: logo + pulsante comprimi/espandi */}
          <div style={{ display: 'flex', flexDirection: collapsed ? 'column' : 'row', alignItems: 'center', gap: collapsed ? 10 : 11, padding: collapsed ? '18px 0 12px' : '20px 16px 16px' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#FFFFFF', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flex: 'none' }}>
              <img src="/immo/logo-mark.png" alt="Agente Immo" style={{ width: 32, height: 32, objectFit: 'contain' }} />
            </div>
            {!collapsed && <div style={{ flex: 1, fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 16.5, letterSpacing: '-.4px', whiteSpace: 'nowrap' }}>Agente <span style={{ color: '#537EEC' }}>Immo</span></div>}
            <div className={collapsed ? 'hbg navtip' : 'hbg'} onClick={toggleSidebar} style={{ width: 34, height: 34, borderRadius: 10, background: '#fff', border: '1px solid #E6EAF3', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flex: 'none', position: 'relative' }}>
              <Icon d={collapsed ? ICONS.fwd : ICONS.back} size={16} stroke="#5B6376" sw={2.2} />
              {collapsed && <span className="tip">Espandi menu</span>}
            </div>
          </div>

          {/* Voci di navigazione */}
          <div style={{ padding: '6px 12px', display: 'flex', flexDirection: 'column', gap: collapsed ? 6 : 2, overflowY: collapsed ? 'visible' : 'auto' }}>
            {SIDEBAR.filter(([id]) => allowed.includes(id)).map(([id, label, dd]) => {
              const a = id === screen
              const badge = id === 'messages' && nMsgs ? String(nMsgs) : ''
              return (
                <div key={id} className={collapsed ? 'hbg navtip' : 'hbg'} onClick={() => nav(id, id === 'aistudio' ? { aiTab: 'hub' } : {})} title="" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '11px 0' : '10px 12px', justifyContent: collapsed ? 'center' : 'flex-start', borderRadius: 12, cursor: 'pointer', background: a ? '#EAF0FD' : 'transparent', position: 'relative' }}>
                  <div style={{ position: 'relative', display: 'flex', flex: 'none' }}>
                    <Icon d={dd} size={20} stroke={a ? '#3C5BAA' : '#3A4152'} sw={a ? 2 : 1.7} />
                    {collapsed && badge && <span style={{ position: 'absolute', top: -5, right: -7, minWidth: 15, height: 15, borderRadius: 99, background: '#E8543F', color: '#F4F6FA', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px', boxSizing: 'border-box', border: '1.5px solid #F4F6FA' }}>{badge}</span>}
                  </div>
                  {!collapsed && <div style={{ flex: 1, fontSize: 14, fontWeight: a ? 700 : 500, color: a ? '#3C5BAA' : '#3A4152' }}>{label}</div>}
                  {!collapsed && badge && <div style={{ background: a ? '#537EEC' : '#E6EAF3', color: a ? '#F4F6FA' : '#5B6376', fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '2.5px 8px' }}>{badge}</div>}
                  {collapsed && <span className="tip">{label}</span>}
                </div>
              )
            })}
          </div>
          <div style={{ flex: 1 }} />

          {/* Crediti AI */}
          {!isPrivato && (collapsed ? (
            <div className="hb navtip" onClick={() => nav('billing')} style={{ margin: '0 auto 12px', width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(140deg,#2A1F71,#4B39C8)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Icon d={ICONS.star} size={18} fill="#FFD66E" />
              <span className="tip">{d.credits} crediti AI · {d.plan}</span>
            </div>
          ) : (
            <div className="hb" onClick={() => nav('billing')} style={{ margin: 12, background: 'linear-gradient(140deg,#2A1F71,#4B39C8)', borderRadius: 16, padding: 14, cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Icon d={ICONS.star} size={16} fill="#FFD66E" />
                <span style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{d.credits} crediti AI</span>
              </div>
              <div style={{ marginTop: 8, height: 6, borderRadius: 99, background: 'rgba(255,255,255,.18)' }}>
                <div style={{ width: Math.min(100, d.credits) + '%', height: '100%', borderRadius: 99, background: 'linear-gradient(90deg,#C9BEFF,#fff)' }} />
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,.75)', lineHeight: 1.4 }}>
                {d.plan === 'Community' ? 'Piano Community · passa a Pro per 100 crediti/mese' : 'Piano ' + d.plan + ' attivo'}
              </div>
            </div>
          ))}
          {isPrivato && <div style={{ margin: 6 }} />}

          {/* Card profilo */}
          {collapsed ? (
            <div className="hsh navtip" onClick={() => nav('profile')} style={{ margin: '0 auto 14px', width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Avatar ini={d.session.ini} size={40} fs={13} col="#3C5BAA" style={{ fontWeight: 800 }} />
              <span className="tip">{d.session.name}</span>
            </div>
          ) : (
            <div className="hsh" onClick={() => nav('profile')} style={{ margin: '0 12px 14px', display: 'flex', alignItems: 'center', gap: 11, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', border: '1px solid #E6EAF3', background: '#fff' }}>
              <Avatar ini={d.session.ini} size={38} fs={13} col="#3C5BAA" style={{ fontWeight: 800 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.session.name}</div>
                <div style={{ fontSize: 11, color: '#8A91A6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.session.role}</div>
              </div>
              <Icon d={ICONS.fwd} size={15} stroke="#979EB2" sw={2.2} />
            </div>
          )}
        </div>
      )}

      {/* ---- Colonna principale ---- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, position: 'relative' }}>
        {/* Topbar (solo ≥900px) */}
        {isDesktop && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 28px', borderBottom: '1px solid #E6EAF3', background: 'rgba(255,255,255,.9)', backdropFilter: 'blur(10px)', flex: 'none' }}>
            <GlobalSearch />
            <div style={{ flex: 1 }} />
            {createOptions.length > 0 && (
              <div className="hb" onClick={() => setUi({ create: !ui.create, notifPop: false })} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#537EEC', color: '#F4F6FA', borderRadius: 12, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}>
                <Icon d={ICONS.plus} size={15} stroke="#F4F6FA" sw={2.4} />Crea
              </div>
            )}
            <div onClick={() => setUi({ notifPop: !ui.notifPop, create: false })} style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Icon d={ICONS.bell} size={19} />
              {nNotifs > 0 && <div style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: '50%', background: '#E8543F', border: '2px solid #fff' }} />}
            </div>
            <div onClick={() => nav('messages')} style={{ width: 42, height: 42, borderRadius: 12, background: '#fff', border: '1px solid #DFE4EF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}>
              <Icon d={ICONS.chat} size={19} />
              {nMsgs > 0 && <div style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 99, background: '#E8543F', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #F4F6FA' }}>{nMsgs}</div>}
            </div>
          </div>
        )}

        {/* Popover Crea (desktop) */}
        {isDesktop && ui.create && (
          <div style={{ position: 'relative', zIndex: 60 }}>
            <div onClick={() => setUi({ create: false })} style={{ position: 'fixed', inset: 0 }} />
            <div style={{ position: 'absolute', top: 6, right: 124, width: 280, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, boxShadow: '0 24px 60px rgba(24,29,26,.18)', padding: 8, animation: 'fadeUp .18s ease both' }}>
              {createOptions.map(c => (
                <div key={c.t} className="hbg2" onClick={c.on} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 10px', borderRadius: 12, cursor: 'pointer' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 12, background: c.ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={c.d} size={18} stroke={c.ic} /></div>
                  <div style={{ flex: 1 }}><div style={{ fontWeight: 700, fontSize: 13.5 }}>{c.t}</div><div style={{ fontSize: 11.5, color: '#8A91A6' }}>{c.sub}</div></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Popover notifiche (desktop) */}
        {isDesktop && ui.notifPop && (
          <div style={{ position: 'relative', zIndex: 60 }}>
            <div onClick={() => setUi({ notifPop: false })} style={{ position: 'fixed', inset: 0 }} />
            <div style={{ position: 'absolute', top: 6, right: 70, width: 360, background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, boxShadow: '0 24px 60px rgba(24,29,26,.18)', padding: 8, animation: 'fadeUp .18s ease both', maxHeight: 460, overflowY: 'auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '8px 10px 6px' }}>
                <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 800, fontSize: 15 }}>Notifiche</div>
                <div style={{ flex: 1 }} />
                {nNotifs > 0 && <div onClick={markNotifsRead} style={{ fontSize: 12, fontWeight: 700, color: '#537EEC', cursor: 'pointer' }}>Segna lette</div>}
              </div>
              {d.notifs.length === 0
                ? <div style={{ padding: '6px 6px 10px' }}><EmptyState icon={ICONS.bell} title="Nessuna notifica" sub="Ti avviseremo qui per nuovi lead, messaggi e aggiornamenti." /></div>
                : d.notifs.map(n => <NotifRow key={n.id} n={n} onClick={() => { setUi({ notifPop: false }); openNotif(n) }} />)}
            </div>
          </div>
        )}

        {/* Contenuto */}
        <div className={isDesktop ? '' : 'no-scrollbar'} style={{ flex: 1, overflowY: 'auto', minHeight: 0, position: 'relative' }} ref={scrollRef}>
          <Screen />
        </div>

        {/* Tab bar (solo <900px) — privato: 4 tab senza FAB "Crea"; nascosta dentro una chat aperta */}
        {showTabbar && (
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '10px 14px 30px', background: 'linear-gradient(180deg,rgba(255,255,255,0) 0%,#F4F6FA 34%)', pointerEvents: 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(14px)', border: '1px solid #DFE4EF', borderRadius: 26, padding: '8px 10px', boxShadow: '0 12px 34px rgba(24,29,26,.12)', pointerEvents: 'auto' }}>
              {isPrivato ? (
                TABBAR_PRIVATO.map(([id, label, dd]) => <TabBtn key={id} id={id} label={label} d={dd} screen={screen} nav={nav} />)
              ) : (
                <>
                  {TABBAR.slice(0, 2).map(([id, label, dd]) => <TabBtn key={id} id={id} label={label} d={dd} screen={screen} nav={nav} />)}
                  <div className="hb" onClick={() => setUi({ create: true })} style={{ width: 54, height: 54, borderRadius: 19, background: '#537EEC', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 6px', cursor: 'pointer', boxShadow: '0 8px 20px rgba(83,126,236,.35)', flex: 'none' }}>
                    <Icon d={ICONS.plus} size={26} stroke="#F4F6FA" sw={2.2} />
                  </div>
                  {TABBAR.slice(2).map(([id, label, dd]) => <TabBtn key={id} id={id} label={label} d={dd} screen={screen} nav={nav} />)}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Menu Crea (mobile: bottom sheet) */}
      {!isDesktop && (
        <Modal open={ui.create} onClose={() => setUi({ create: false })} title="Cosa vuoi creare?">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {createOptions.map(c => (
              <div key={c.t} className="hbd" onClick={c.on} style={{ background: '#fff', border: '1px solid #DFE4EF', borderRadius: 18, padding: '15px 14px', cursor: 'pointer' }}>
                <div style={{ width: 42, height: 42, borderRadius: 14, background: c.ibg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon d={c.d} size={21} stroke={c.ic} /></div>
                <div style={{ marginTop: 10, fontWeight: 700, fontSize: 14.5 }}>{c.t}</div>
                <div style={{ fontSize: 12, color: '#666E82', marginTop: 2, lineHeight: 1.4 }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Drawer utente (mobile) */}
      {!isDesktop && ui.drawer && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 95 }}>
          <div onClick={() => setUi({ drawer: false })} style={{ position: 'absolute', inset: 0, background: 'rgba(24,29,26,.42)', backdropFilter: 'blur(2px)' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '81%', maxWidth: 360, background: '#F4F6FA', borderRadius: '0 26px 26px 0', boxShadow: '20px 0 60px rgba(24,29,26,.25)', display: 'flex', flexDirection: 'column', animation: 'fadeUp .25s ease both' }}>
            <div style={{ padding: '70px 20px 16px', background: 'linear-gradient(160deg,#537EEC,#3C5BAA)', borderRadius: '0 26px 0 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Avatar ini={d.session.ini} size={52} fs={17} col="#3C5BAA" style={{ fontWeight: 800, border: '2px solid rgba(255,255,255,.5)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque',sans-serif", fontWeight: 700, fontSize: 16.5, color: '#F4F6FA' }}>{d.session.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,.72)' }}>{d.session.role}</div>
                </div>
              </div>
              <div onClick={() => nav('profile')} style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.25)', borderRadius: 12, minHeight: 42, color: '#F4F6FA', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Vedi il tuo profilo pubblico</div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: 12 }}>
              {menuItems.map(([dd, t, id, badge]) => (
                <div key={id} className="hbg" onClick={() => nav(id)} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 12px', borderRadius: 14, cursor: 'pointer', minHeight: 44 }}>
                  <Icon d={dd} size={21} stroke="#3A4152" />
                  <div style={{ flex: 1, fontWeight: 600, fontSize: 14.5, color: '#15181F' }}>{t}</div>
                  {badge && <div style={{ background: '#EFECFF', color: '#4B39C8', fontSize: 10.5, fontWeight: 800, borderRadius: 99, padding: '3px 8px' }}>{badge}</div>}
                </div>
              ))}
              <div style={{ height: 1, background: '#DFE4EF', margin: '10px 12px' }} />
              <div onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 12px', borderRadius: 14, cursor: 'pointer', minHeight: 44 }}>
                <Icon d={ICONS.logout} size={21} stroke="#B03B22" />
                <div style={{ fontWeight: 600, fontSize: 14.5, color: '#B03B22' }}>Esci</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay dettaglio (responsive: drawer ≥900px, schermo pieno sotto) */}
      {ui.propOpen && <PropertyDetail />}
      {ui.leadOpen && <LeadDetail />}
      {ui.dealOpen && <DealDetail />}
      {ui.authorOpen && <AuthorProfile />}

      <Toast msg={toastMsg} bottom={showTabbar ? 112 : 34} />
    </div>
  )
}

function TabBtn({ id, label, d, screen, nav }) {
  const active = id === screen
  const col = active ? '#537EEC' : '#8A91A6'
  return (
    <div onClick={() => nav(id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', cursor: 'pointer', borderRadius: 16, minHeight: 44, justifyContent: 'center' }}>
      <Icon d={d} size={23} stroke={col} sw={active ? 2.1 : 1.8} />
      <div style={{ fontSize: 10, fontWeight: active ? 800 : 600, color: col }}>{label}</div>
    </div>
  )
}

function NotifRow({ n, onClick }) {
  const notifIcon = { lead: [ICONS.funnel, '#EAF0FD', '#3C5BAA'], doc: [ICONS.doc, '#E4EDF7', '#2E5C8A'], net: [ICONS.users, '#FBF1DC', '#8A6E24'], ai: [ICONS.spark, '#EFECFF', '#4B39C8'], cal: [ICONS.cal, '#FDE9E4', '#B03B22'] }
  const [dd, ibg, ic] = notifIcon[n.k]
  return (
    <div className="hbg2" onClick={onClick} style={{ display: 'flex', gap: 11, padding: 10, borderRadius: 12, cursor: 'pointer' }}>
      <div style={{ width: 36, height: 36, borderRadius: 11, background: ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Icon d={dd} size={17} stroke={ic} /></div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
          <span style={{ fontWeight: 700, fontSize: 12.5, flex: 1 }}>{n.t}</span>
          <span style={{ fontSize: 10.5, color: '#979EB2', flex: 'none' }}>{n.time}</span>
        </div>
        <div style={{ fontSize: 12, color: '#666E82', lineHeight: 1.4, marginTop: 1 }}>{n.d2}</div>
      </div>
      {n.unread && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E8543F', flex: 'none', marginTop: 5 }} />}
    </div>
  )
}

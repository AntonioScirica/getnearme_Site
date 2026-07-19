import { useApp } from '../../store/store.jsx'
import { ICONS } from '../../data/seed.js'
import Icon from '../../components/Icon.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import EmptyState from '../../components/EmptyState.jsx'

// Lista notifiche responsive (fusione mobile Notifications)
const NOTIF_ICON = {
  lead: [ICONS.funnel, '#EAF0FD', '#3C5BAA'],
  doc: [ICONS.doc, '#E4EDF7', '#2E5C8A'],
  net: [ICONS.users, '#FBF1DC', '#8A6E24'],
  ai: [ICONS.spark, '#EFECFF', '#4B39C8'],
  cal: [ICONS.cal, '#FDE9E4', '#B03B22'],
}

export default function NotificationsScreen() {
  const { d, isDesktop, openNotif, markNotifsRead } = useApp()

  const markBtn = (
    <div onClick={markNotifsRead} style={{ fontSize: isDesktop ? 12.5 : 13, fontWeight: isDesktop ? 700 : 600, color: '#537EEC', cursor: 'pointer', padding: isDesktop ? 0 : '10px 0' }}>Segna lette</div>
  )

  return (
    <div style={{ maxWidth: isDesktop ? 640 : '100%', margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: isDesktop ? '0 32px 40px' : '0 0 40px' }}>
      {!isDesktop && <div style={{ height: 12 }} />}
      <PageHeader title="Notifiche" right={markBtn} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 9, padding: isDesktop ? '10px 0 0' : '0 20px' }}>
        {d.notifs.map(n => {
          const [dd, ibg, ic] = NOTIF_ICON[n.k] || NOTIF_ICON.net
          return (
            <div key={n.id} className="hbd" onClick={() => openNotif(n)} style={{ display: 'flex', gap: 12, background: n.unread ? '#fff' : 'rgba(255,255,255,.55)', border: '1px solid ' + (n.unread ? '#DFE4EF' : '#E8EBF4'), borderRadius: 16, padding: '13px 14px', cursor: 'pointer' }}>
              <div style={{ width: 40, height: 40, borderRadius: 13, background: ibg, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <Icon d={dd} size={19} stroke={ic} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: 13.5 }}>{n.t}</span>
                  <span style={{ fontSize: 11, color: '#979EB2', flex: 'none' }}>{n.time}</span>
                </div>
                <div style={{ fontSize: 12.5, color: '#666E82', lineHeight: 1.45, marginTop: 2 }}>{n.d2}</div>
              </div>
              {n.unread && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E8543F', flex: 'none', marginTop: 6 }} />}
            </div>
          )
        })}
        {d.notifs.length === 0 && <EmptyState icon={ICONS.bell} title="Nessuna notifica" sub="Ti avviseremo qui per nuovi lead, messaggi e aggiornamenti." />}
      </div>
    </div>
  )
}

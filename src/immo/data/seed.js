// Dati mock condivisi (uniti dai prototipi mobile e desktop).
// Le liste qui sotto sono lo stato iniziale: a runtime vivono nello store e vengono modificate dalle azioni.

export const ICONS = {
  home: 'M3.5 10.5 12 3.5l8.5 7M5.5 9v11.5h13V9',
  users: 'M9 11.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM3.2 20.5c.4-3.2 2.8-5.1 5.8-5.1s5.4 1.9 5.8 5.1M15.5 4.8a2.9 2.9 0 0 1 0 5.7M17.6 15.6c2.1.5 3.4 1.9 3.7 4.2',
  build: 'M5 20.5V4.6a.6.6 0 0 1 .6-.6h8.8a.6.6 0 0 1 .6.6v15.9M15 9.5h3.4a.6.6 0 0 1 .6.6v10.4M3.5 20.5h17M8.2 7.5h2.6M8.2 11h2.6M8.2 14.5h2.6',
  funnel: 'M4.5 5h15l-5.6 6.8v6.4l-3.8 2.3v-8.7L4.5 5Z',
  bell: 'M6.2 9.5a5.8 5.8 0 0 1 11.6 0c0 4.6 1.7 5.8 1.7 5.8H4.5s1.7-1.2 1.7-5.8ZM10.3 18.8a1.9 1.9 0 0 0 3.4 0',
  chat: 'M21 11.8a8.4 8.4 0 0 1-12.3 7.4L4 20.5l1.3-4.3A8.4 8.4 0 1 1 21 11.8Z',
  doc: 'M6 3.5h8L18.5 8v12.5H6V3.5ZM14 3.5V8h4.5M9 12.5h6M9 16h6',
  user: 'M12 11.5a3.8 3.8 0 1 0 0-7.6 3.8 3.8 0 0 0 0 7.6ZM4.8 20.5c.5-3.6 3.3-5.6 7.2-5.6s6.7 2 7.2 5.6',
  spark: 'M12 3.5 13.7 8.8 19 10.5l-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7L12 3.5Z',
  spark2: 'M12 3.5 13.7 8.8 19 10.5l-5.3 1.7L12 17.5l-1.7-5.3L5 10.5l5.3-1.7L12 3.5ZM18.6 15.4l.8 2.4 2.4.8-2.4.8-.8 2.4-.8-2.4-2.4-.8 2.4-.8.8-2.4Z',
  trend: 'M3.5 17 9 11.5l4 4L20.5 8M15.5 8h5v5',
  gear: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7',
  card: 'M3.5 6.5h17v11h-17v-11ZM3.5 10h17',
  pencil: 'M4.5 19.5l.9-3.9L16.2 4.8a2 2 0 0 1 2.9 2.9L8.4 18.6l-3.9.9Z',
  cal: 'M4.5 6.5h15V20h-15V6.5ZM4.5 10.5h15M8.5 4v4M15.5 4v4',
  pin: 'M12 21.5s-7-6.4-7-11a7 7 0 0 1 14 0c0 4.6-7 11-7 11ZM12 12.7a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z',
  vid: 'M3.5 6.5h12.5v11H3.5v-11ZM16 10.5l4.5-2.5v8L16 13.5',
  cam: 'M4 8.5h3.2l1.9-2.5h5.8l1.9 2.5H20a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5V9a.5.5 0 0 1 .5-.5ZM12 17a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8Z',
  biz: 'M8 20.5V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v14.5M4 9h16a.5.5 0 0 1 .5.5v10a.5.5 0 0 1-.5.5H4a.5.5 0 0 1-.5-.5v-10A.5.5 0 0 1 4 9Z',
  search: 'M11 17.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13ZM15.8 15.8 20.5 20.5',
  back: 'M14.5 5.5 8 12l6.5 6.5',
  fwd: 'M9.5 5.5 16 12l-6.5 6.5',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  plus: 'M12 5v14M5 12h14',
  phone: 'M5.5 4h3l1.6 4.1-2 1.6a12.5 12.5 0 0 0 6.2 6.2l1.6-2 4.1 1.6v3a1.9 1.9 0 0 1-2.1 1.9A16.9 16.9 0 0 1 3.6 6.1 1.9 1.9 0 0 1 5.5 4Z',
  logout: 'M9.5 20.5H5a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1h4.5M15.5 16l4-4-4-4M19.5 12h-10',
  attico: 'M4 20.5h16M6 20.5V11l6-4.5 6 4.5v9.5M9.5 20.5v-5h5v5',
  villa: 'M3.5 20.5h17M5 20.5v-8L12 6l7 6.5v8M9.5 20.5v-6h5v6',
  sun: 'M12 16.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9ZM12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19',
  sky: 'M4 15.5a4.5 4.5 0 0 1 .8-8.9 5.5 5.5 0 0 1 10.6-1.1A4.8 4.8 0 0 1 20 14.6M8 18l-1.5 2.5M13 18l-1.5 2.5M18 18l-1.5 2.5',
  persp: 'M7 3.5 5 20.5M17 3.5l2 17M4.5 8h15M3.8 15h16.4',
  trash: 'M4.5 6.5h15M9 6V4.5h6V6M7 6.5l1 14h8l1-14M10.5 10v7M13.5 10v7',
  star: 'M12 3.4l2.5 5.4 5.9.7-4.4 4 1.2 5.8L12 16.4l-5.2 2.9 1.2-5.8-4.4-4 5.9-.7L12 3.4Z',
}

export const TAGSTYLE = { 'In vendita': ['#EAF0FD', '#3C5BAA'], 'In affitto': ['#E4EDF7', '#2E5C8A'], 'Bozza': ['#F4ECD9', '#8A6E24'], 'Venduto': ['#E9E6DF', '#5B6376'] }
export const SRCSTYLE = { 'Agente Immo': ['#EAF0FD', '#3C5BAA'], 'Portale': ['#F4ECD9', '#8A6E24'], 'Sito web': ['#E4EDF7', '#2E5C8A'], 'Passaparola': ['#EFECFF', '#4B39C8'] }
export const STAGES = ['Nuovo', 'Contattato', 'Visita', 'Proposta', 'Chiuso']
export const STAGECOLS = { Nuovo: '#E8543F', Contattato: '#D99A2B', Visita: '#2E5C8A', Proposta: '#537EEC', Chiuso: '#5B6376' }
// Pipeline commerciale di una trattativa (dall'incarico al rogito) + metadati di fase
// (avanzamento % e colore). Unica fonte di verità: usata da CrmScreen, DealDetail e store.
export const DEAL_STAGES = ['Proposta', 'Negoziazione', 'Compromesso', 'Rogito']
export const DEAL_STAGE_META = {
  Proposta: { pct: 20, col: '#2E5C8A' },
  Negoziazione: { pct: 55, col: '#D99A2B' },
  Compromesso: { pct: 75, col: '#6E56F8' },
  Rogito: { pct: 90, col: '#537EEC' },
}
export const CONTACT_TAGSTYLE = { Compratore: ['#EAF0FD', '#3C5BAA'], Investitrice: ['#EFECFF', '#4B39C8'], Inquilino: ['#E4EDF7', '#2E5C8A'], Professionista: ['#F4ECD9', '#8A6E24'], Venditrice: ['#FDE9E4', '#B03B22'] }
export const CONVO_TAGSTYLE = { Lead: ['#EAF0FD', '#3C5BAA'], Team: ['#FBF1DC', '#8A6E24'], Network: ['#EFECFF', '#4B39C8'], Altro: ['#EDF0F7', '#5B6376'] }

export const STYLES = [
  { n: 'Moderno', sub: 'Linee pulite, toni neutri' },
  { n: 'Scandinavo', sub: 'Legno chiaro, luce' },
  { n: 'Industriale', sub: 'Metallo, mattoni a vista' },
  { n: 'Classico', sub: 'Eleganza senza tempo' },
]

export const PLANS = [
  { n: 'Community', pm: 'Gratis', pa: 'Gratis', per: '', sub: 'Per iniziare a esserci', feats: ['Profilo pubblico e feed', 'Immobili illimitati', 'CRM essenziale', 'Chat e network'] },
  { n: 'Pro AI', pm: '€ 29', pa: '€ 24', per: '/mese', sub: 'Per chi vuole più lead', feats: ['100 crediti AI al mese', 'Home Staging e Photo Editing', 'Video AI e Copy AI', 'Social Planner e statistiche'], hot: true },
  { n: 'Agency', pm: '€ 79', pa: '€ 65', per: '/mese', sub: 'Per team e agenzie', feats: ['Tutto di Pro AI', 'Fino a 10 agenti', 'Analytics di team', 'Branding e ruoli agenzia'] },
]

export const TOOLS = [
  { id: 'staging', t: 'Home Staging', sub: 'Arreda le stanze vuote in un tap', cr: '1 credito / foto', d: ICONS.pencil },
  { id: 'photoedit', t: 'Photo Editing', sub: 'Luce, cielo e prospettiva perfetti', cr: '2 crediti / set', d: ICONS.cam },
  { id: 'videoai', t: 'Video AI', sub: 'Reel e tour dalle tue foto', cr: '5 crediti / video', d: ICONS.vid },
  { id: 'copyai', t: 'Copy AI', sub: 'Annunci e post che convertono', cr: 'Illimitato con Pro', d: ICONS.doc },
  { id: 'planner', t: 'Social Planner', sub: 'Programma su Instagram, Facebook e LinkedIn nei momenti giusti', cr: 'Incluso', wide: true, d: ICONS.cal },
]

export const BARS = [{ d: 'L', v: 38 }, { d: 'M', v: 52 }, { d: 'M', v: 44 }, { d: 'G', v: 70 }, { d: 'V', v: 58 }, { d: 'S', v: 92 }, { d: 'D', v: 64 }]
export const SOURCES = [{ n: 'Agente Immo · profilo', v: 46, c: '#537EEC' }, { n: 'Portali esterni', v: 28, c: '#D99A2B' }, { n: 'Sito web', v: 16, c: '#6E56F8' }, { n: 'Passaparola', v: 10, c: '#E8543F' }]

// Analytics — metadati per intervallo (7/30/90 giorni). I numeri "reali" (n° lead, sorgenti,
// immobili più visti, reazioni) sono DERIVATI da `d` nella schermata; qui vive solo la parte
// di traffico che nel mock non ha uno storico reale (serie visite, follower) + le etichette,
// così il selettore d'intervallo cambia davvero i dati mostrati.
export const RANGE_META = {
  '7g': { dateLabel: '11–17 luglio', profileVisits: 1240, profileDelta: '+18%', followers: 34, bars: [38, 52, 44, 70, 58, 92, 64], barLabels: ['L', 'M', 'M', 'G', 'V', 'S', 'D'], peak: 'Il picco di sabato arriva dal reel dell’attico: 612 visualizzazioni.' },
  '30g': { dateLabel: '18 giu – 17 lug', profileVisits: 5180, profileDelta: '+24%', followers: 142, bars: [46, 60, 54, 72, 66, 88, 120], barLabels: ['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'S7'], peak: 'La settimana 7 traina il mese: campagna CityLife e 3 nuovi reel pubblicati.' },
  '90g': { dateLabel: '19 apr – 17 lug', profileVisits: 14760, profileDelta: '+41%', followers: 398, bars: [58, 70, 64, 88, 104, 126, 165], barLabels: ['Apr', '', 'Mag', '', 'Giu', '', 'Lug'], peak: 'Luglio chiude il trimestre in crescita: +41% di visite rispetto ad aprile.' },
}
// Sorgente lead (campo l.src) → etichetta estesa + colore del donut in Analytics.
export const SOURCE_META = {
  'Agente Immo': { label: 'Agente Immo · profilo', c: '#537EEC' },
  'Portale': { label: 'Portali esterni', c: '#D99A2B' },
  'Sito web': { label: 'Sito web', c: '#6E56F8' },
  'Passaparola': { label: 'Passaparola', c: '#E8543F' },
}
export const DAYS = [{ d: 'Lun', n: 20 }, { d: 'Mar', n: 21 }, { d: 'Mer', n: 22 }, { d: 'Gio', n: 23 }, { d: 'Ven', n: 24 }, { d: 'Sab', n: 25 }, { d: 'Dom', n: 26 }]

export const TEAM = [
  { n: 'Federico Rosati', role: 'Titolare · Broker', ini: 'FR', c: '#DDE5FB', kpi: '14 trattative', pct: 88 },
  { n: 'Giulia Ferri', role: 'Agente senior', ini: 'GF', c: '#D9E6F2', kpi: '11 trattative', pct: 74 },
  { n: 'Marco Esposito', role: 'Agente', ini: 'ME', c: '#EAD9D3', kpi: '7 trattative', pct: 52 },
  { n: 'Sara Ricci', role: 'Marketing', ini: 'SR', c: '#F0E4CE', kpi: '23 campagne', pct: 38 },
]

export const REVIEWS = [
  { n: 'Famiglia Ricci', ini: 'FR', c: '#F3D9C8', t: 'Federico ha venduto il nostro villino in due mesi al prezzo pieno. Comunicazione impeccabile, sempre un passo avanti.', time: 'Giugno 2026' },
  { n: 'Elena Greco', ini: 'EG', c: '#DDE5FB', t: 'Professionale e disponibile. Le foto e il video dell’annuncio erano di un altro livello rispetto alla concorrenza.', time: 'Maggio 2026' },
  { n: 'Paolo Verdi', ini: 'PV', c: '#EAD9EC', t: 'Mi ha seguito passo passo nell’acquisto della prima casa. Consigliatissimo.', time: 'Aprile 2026' },
]

// Testi generati da Copy AI per combinazione tipo di testo (il tono cambia solo il toast).
export const COPYTEXTS = {
  'Annuncio portale': 'PORTA ROMANA – Nel cuore del quartiere più vivo di Milano, trilocale di 95 m² al terzo piano con terrazzo di 18 m² esposto a sud.\n\nCucina abitabile, doppi servizi, cantina. Palazzina d’epoca ristrutturata, a 400 m dalla M3 Lodi TIBB.\n\n€ 485.000 – Classe B. Visite da giovedì.',
  'Post social': 'C’è una regola non scritta a Porta Romana: chi arriva, resta. ❤️\n\nNuovo incarico: trilocale con terrazzo al sole, 95 m² da vivere. Il video arriva domani — chi vuole l’anteprima?\n\n#PortaRomana #Milano #CaseConTerrazzo',
  'Email follow-up': 'Gentile Marta,\n\ngrazie per l’interesse per il trilocale di Porta Romana. Come anticipato, giovedì alle 18:00 la aspetto in Via Orti 14.\n\nLe allego la planimetria e la scheda completa. A giovedì!\n\nFederico Rosati',
}

// ---- Stato iniziale persistito ----
export function seedData() {
  return {
    v: 1,
    session: { loggedIn: false, name: 'Federico Rosati', email: 'federico.rosati@gmail.com', ini: 'FR', phone: '+39 340 112 8890', zone: 'Milano Sud-Est', role: 'Agente immobiliare · Milano Sud-Est', persona: 'agente' },
    credits: 42,
    plan: 'Community',
    billCycle: 'mensile',
    // Notifiche: solo via email (canali push/WhatsApp rimossi dalla UI). `vis` = visibilità profilo (agente) / avvisi immobili (privato).
    setts: { mail: true, digest: true, vis: true },
    goals: { lead: true, brand: true },
    bio: 'Aiuto famiglie e investitori a comprare e vendere casa a Milano Sud-Est. 12 anni di esperienza, 46 immobili venduti.',

    nextId: 100,
    props: [
      { id: 1, t: 'Trilocale con terrazzo', zone: 'Porta Romana · Milano', price: '€ 485.000', tag: 'In vendita', type: 'Vendita', m2: 95, loc: 3, ba: 2, pi: '3°', cls: 'B', views: 238, desc: 'Al terzo piano di una palazzina d’epoca ristrutturata, trilocale di 95 m² con terrazzo di 18 m² esposto a sud. Cucina abitabile, doppi servizi, cantina. A 400 m dalla M3 Lodi TIBB.' },
      { id: 2, t: 'Bilocale ristrutturato', zone: 'Navigli · Milano', price: '€ 1.450/mese', tag: 'In affitto', type: 'Affitto', m2: 58, loc: 2, ba: 1, pi: '2°', cls: 'C', views: 412, desc: 'Bilocale appena ristrutturato con affaccio sul Naviglio Grande. Arredato di design, aria condizionata, disponibile da settembre.' },
      { id: 3, t: 'Attico vista skyline', zone: 'Isola · Milano', price: '€ 890.000', tag: 'In vendita', type: 'Vendita', m2: 140, loc: 4, ba: 2, pi: '7°', cls: 'A2', views: 186, desc: 'Ultimo piano con terrazzo di 40 m² e vista sul Bosco Verticale. Doppia esposizione, box doppio, finiture di pregio.' },
      { id: 4, t: 'Quadrilocale nuovo', zone: 'CityLife · Milano', price: '€ 1.250.000', tag: 'Bozza', type: 'Vendita', m2: 165, loc: 4, ba: 3, pi: '5°', cls: 'A4', views: 0, desc: 'Nuova costruzione classe A4, quadrilocale con doppia loggia. Consegna dicembre 2026.' },
      { id: 5, t: 'Bilocale luminoso', zone: 'Trastevere · Roma', price: '€ 398.000', tag: 'In vendita', type: 'Vendita', m2: 62, loc: 2, ba: 1, pi: '1°', cls: 'D', views: 301, desc: 'Nel cuore di Trastevere, bilocale luminoso con soffitti a travi. Perfetto come pied-à-terre o investimento.' },
      { id: 6, t: 'Villino con giardino', zone: 'Monteverde · Roma', price: '€ 720.000', tag: 'Venduto', type: 'Vendita', m2: 180, loc: 5, ba: 3, pi: '—', cls: 'C', views: 520, desc: 'Villino su due livelli con giardino di 200 m². Venduto a giugno 2026 al 98% del prezzo richiesto.' },
    ],
    leads: [
      { id: 1, n: 'Marta Colombo', ini: 'MC', c: '#F3D9C8', propId: 1, src: 'Agente Immo', time: '12 min fa', stage: 'Nuovo', hot: true, ph: '+39 348 224 5511', mail: 'marta.colombo@gmail.com', msg: 'Buongiorno, ho visto il trilocale in Porta Romana e vorrei visitarlo questa settimana. Budget fino a 500K.', tl: [] },
      { id: 2, n: 'Luca Bianchi', ini: 'LB', c: '#D6E4F0', propId: 2, src: 'Portale', time: '1 h fa', stage: 'Contattato', hot: true, ph: '+39 333 871 0244', mail: 'l.bianchi@outlook.it', msg: 'Il canone è trattabile? Sarei interessato da ottobre.', tl: [] },
      { id: 3, n: 'Elena Greco', ini: 'EG', c: '#DDE5FB', propId: 3, src: 'Sito web', time: '3 h fa', stage: 'Visita', hot: false, ph: '+39 340 556 2280', mail: 'elena.greco@studiogreco.it', msg: 'Confermo la visita di sabato per l’attico. Porto anche mio marito.', tl: [] },
      { id: 4, n: 'Paolo Verdi', ini: 'PV', c: '#EAD9EC', propId: 5, src: 'Agente Immo', time: 'Ieri', stage: 'Proposta', hot: false, ph: '+39 329 445 8102', mail: 'paolo.verdi@gmail.com', msg: 'Vi ho inviato la proposta a 385K. Attendo riscontro.', tl: [] },
      { id: 5, n: 'Anna Fontana', ini: 'AF', c: '#F0E4CE', propId: 1, src: 'Passaparola', time: '2 g fa', stage: 'Contattato', hot: false, ph: '+39 347 118 6690', mail: 'anna.fontana@libero.it', msg: 'Mi ha dato il suo contatto la famiglia Ricci. Cerco un trilocale in zona Lodi.', tl: [] },
      { id: 6, n: 'Sofia Marino', ini: 'SM', c: '#D9E6F2', propId: 3, src: 'Sito web', time: '3 g fa', stage: 'Nuovo', hot: false, ph: '+39 335 902 4471', mail: 'sofia.marino@gmail.com', msg: 'L’attico è ancora disponibile? Posso permettermi 850K.', tl: [] },
    ],
    contacts: [
      { n: 'Anna Fontana', ini: 'AF', c: '#F0E4CE', tag: 'Compratore', ph: '+39 347 118 6690', mail: 'anna.fontana@libero.it' },
      { n: 'Elena Greco', ini: 'EG', c: '#DDE5FB', tag: 'Investitrice', ph: '+39 340 556 2280', mail: 'elena.greco@studiogreco.it' },
      { n: 'Luca Bianchi', ini: 'LB', c: '#D6E4F0', tag: 'Inquilino', ph: '+39 333 871 0244', mail: 'l.bianchi@outlook.it' },
      { n: 'Marta Colombo', ini: 'MC', c: '#F3D9C8', tag: 'Compratore', ph: '+39 348 224 5511', mail: 'marta.colombo@gmail.com' },
      { n: 'Notaio Andrea Greco', ini: 'NG', c: '#EAD9EC', tag: 'Professionista', ph: '+39 02 4402 810', mail: 'studio@notaiogreco.it' },
      { n: 'Sofia Marino', ini: 'SM', c: '#D9E6F2', tag: 'Venditrice', ph: '+39 335 902 4471', mail: 'sofia.marino@gmail.com' },
    ],
    deals: [
      { id: 1, t: 'Attico vista skyline', who: 'Elena Greco', val: '€ 865.000', stage: 'Negoziazione', pct: 55, note: 'Controproposta inviata ieri sera', col: '#D99A2B' },
      { id: 2, t: 'Bilocale luminoso', who: 'Paolo Verdi', val: '€ 385.000', stage: 'Proposta', pct: 30, note: 'In attesa di risposta del venditore', col: '#2E5C8A' },
      { id: 3, t: 'Villino con giardino', who: 'Fam. Ricci', val: '€ 712.000', stage: 'Rogito', pct: 90, note: 'Rogito fissato: 28 luglio, Notaio Greco', col: '#537EEC' },
    ],
    posts: [
      { id: 1, n: 'Giulia Ferri', role: 'Agente · Milano Sud', ini: 'GF', c: '#D9E6F2', time: '2 h', txt: 'Nuovo incarico sui Navigli: bilocale ristrutturato con affaccio sul Naviglio Grande. Chi sta cercando in zona?', propId: 2, likes: 24, comm: 0, followId: 'gf' },
      { id: 2, n: 'Marco Esposito', role: 'Agente · Roma Prati', ini: 'ME', c: '#EAD9D3', time: '5 h', txt: 'Venduto in 21 giorni. Il segreto? Home staging AI e un prezzo giusto dal primo giorno. Grazie ai venditori per la fiducia.', stat: 'VENDUTO IN 21 GIORNI', likes: 86, comm: 0, followId: 'me' },
      { id: 3, n: 'Aurora Immobiliare', role: 'Agenzia · Milano', ini: 'AU', c: '#DDE5FB', time: '1 g', txt: 'Il nostro reel del mese: l’attico in Isola raccontato in 30 secondi. Fatto interamente con AI Studio.', reel: true, likes: 132, comm: 0, followId: 'au' },
      { id: 4, n: 'Federico Rosati', role: 'Agente · Milano Sud-Est', ini: 'FR', c: '#DDE5FB', time: '2 g', txt: 'Tre errori che vedo fare a chi vende casa a Milano nel 2026 (e come evitarli). Il primo: le foto fatte col telefono alle 18 di sera...', likes: 64, comm: 12, mine: true },
      { id: 5, n: 'Federico Rosati', role: 'Agente · Milano Sud-Est', ini: 'FR', c: '#DDE5FB', time: '5 g', txt: 'Nuovo incarico in Porta Romana: trilocale con terrazzo esposto a sud. Anteprima video domani sul profilo.', likes: 41, comm: 7, mine: true },
    ],
    liked: { 2: true },
    saved: {},
    savedProps: {},
    followed: {},
    // Commenti iniziali per i post del feed (chiave = id post). Il conteggio in PostCard
    // è comm + numero commenti, quindi i post seminati partono con comm: 0 per coerenza.
    comments: {
      1: [
        { n: 'Marco Esposito', ini: 'ME', t: 'Zona che tira sempre, mandami la scheda che ho una coppia interessata sui Navigli.', h: '1 h' },
        { n: 'Sara Ricci', ini: 'SR', t: 'Affaccio bellissimo 😍 complimenti per l’incarico.', h: '2 h' },
      ],
      2: [
        { n: 'Giulia Ferri', ini: 'GF', t: 'Che numeri! 21 giorni è da record, complimenti davvero.', h: '3 h' },
        { n: 'Aurora Immobiliare', ini: 'AU', t: 'Confermiamo: home staging AI + prezzo giusto cambiano tutto.', h: '4 h' },
        { n: 'Davide Moretti', ini: 'DM', t: 'Bravo Marco, il segreto è crederci dal primo giorno.', h: '4 h' },
      ],
      3: [
        { n: 'Chiara Russo', ini: 'CR', t: 'Il reel è pazzesco, montaggio pulitissimo. Ottimo lavoro.', h: '20 h' },
        { n: 'Giulia Ferri', ini: 'GF', t: 'Quanto ci avete messo a generarlo con AI Studio?', h: '22 h' },
      ],
    },
    suggest: [
      { id: 's1', n: 'Sara Ricci', role: 'Agente · Torino', ini: 'SR', c: '#F0E4CE' },
      { id: 's2', n: 'Davide Moretti', role: 'Agente · Bologna', ini: 'DM', c: '#D6E4F0' },
      { id: 's3', n: 'Chiara Russo', role: 'Home stager · Milano', ini: 'CR', c: '#EAD9EC' },
    ],
    convos: [
      { id: 1, n: 'Marta Colombo', ini: 'MC', c: '#F3D9C8', last: 'Perfetto, giovedì alle 18 va benissimo!', time: '12:40', unread: 2, tag: 'Lead' },
      { id: 2, n: 'Team Aurora', ini: 'AU', c: '#DDE5FB', last: 'Giulia: carico ora le foto del quadrilocale', time: '11:05', unread: 3, tag: 'Team' },
      { id: 3, n: 'Luca Bianchi', ini: 'LB', c: '#D6E4F0', last: 'Il canone è trattabile?', time: '09:18', unread: 0, tag: 'Lead' },
      { id: 4, n: 'Sara Ricci', ini: 'SR', c: '#F0E4CE', last: 'Ti giro il contatto del fotografo', time: 'Ieri', unread: 0, tag: 'Network' },
      { id: 5, n: 'Notaio Greco', ini: 'NG', c: '#EAD9EC', last: 'Documenti ricevuti, tutto ok per il 28', time: 'Ieri', unread: 0, tag: 'Altro' },
    ],
    threads: {
      1: [
        { me: false, t: 'Buongiorno! Ho visto il trilocale in Porta Romana su Agente Immo. È ancora disponibile?', h: '12:31' },
        { me: true, t: 'Buongiorno Marta! Sì, è disponibile. Le va di visitarlo questa settimana?', h: '12:33' },
        { me: false, t: 'Volentieri. Giovedì nel tardo pomeriggio?', h: '12:36' },
        { me: true, prop: 1, h: '12:38' },
        { me: false, t: 'Perfetto, giovedì alle 18 va benissimo!', h: '12:40' },
      ],
      2: [
        { me: false, who: 'Giulia', t: 'Carico ora le foto del quadrilocale CityLife', h: '11:02' },
        { me: false, who: 'Marco', t: 'Ottimo, poi generiamo il reel con AI Studio', h: '11:04' },
        { me: true, t: 'Perfetto. Ricordate il watermark con il logo agenzia', h: '11:05' },
      ],
      3: [{ me: false, t: 'Il canone è trattabile? Sarei interessato da ottobre.', h: '09:18' }],
      4: [{ me: false, t: 'Ti giro il contatto del fotografo di cui ti parlavo', h: 'Ieri' }],
      5: [{ me: false, t: 'Documenti ricevuti, tutto ok per il 28', h: 'Ieri' }],
    },
    notifs: [
      { id: 1, t: 'Nuovo lead da Agente Immo', d2: 'Marta Colombo ha richiesto una visita per il trilocale in Porta Romana', time: '12 min', k: 'lead', unread: true, target: { kind: 'lead', id: 1 } },
      { id: 2, t: 'Documenti dal notaio', d2: 'Notaio Greco ha caricato la bozza dell’atto per il villino Monteverde', time: '1 h', k: 'doc', unread: true, target: { kind: 'chat', id: 5 } },
      { id: 3, t: 'Nuovo follower', d2: 'Sara Ricci (Agente · Torino) ha iniziato a seguirti', time: '3 h', k: 'net', unread: true, target: { kind: 'screen', id: 'network' } },
      { id: 4, t: 'Il tuo post sta volando', d2: '87 reazioni al post “Venduto in 21 giorni” di Marco che hai condiviso', time: 'Ieri', k: 'net', unread: false, target: { kind: 'screen', id: 'network' } },
      { id: 5, t: 'Video AI pronto', d2: 'Il reel dell’attico in Isola è pronto da pubblicare', time: 'Ieri', k: 'ai', unread: false, target: { kind: 'screen', id: 'videoai' } },
      { id: 6, t: 'Promemoria visita', d2: 'Oggi alle 18:00 · Bilocale Navigli con Luca Bianchi', time: 'Ieri', k: 'cal', unread: false, target: { kind: 'screen', id: 'agenda' } },
    ],
    agenda: [
      { h: '15:30', t: 'Visita · Trilocale Porta Romana', d: 'con Marta Colombo', hbg: '#EAF0FD', hc: '#3C5BAA' },
      { h: '18:00', t: 'Visita · Bilocale Navigli', d: 'con Luca Bianchi', hbg: '#FBF1DC', hc: '#8A6E24' },
      { h: '19:15', t: 'Call di follow-up proposta', d: 'Paolo Verdi · Trastevere', hbg: '#E4EDF7', hc: '#2E5C8A' },
    ],
    sched: {
      0: [{ h: '18:00', t: 'Reel · Attico Isola', ch: 'IG' }],
      2: [{ h: '09:30', t: 'Carosello · Trilocale Porta Romana', ch: 'IG' }, { h: '13:00', t: 'Guida: mutuo prima casa 2026', ch: 'LI' }],
      4: [{ h: '17:30', t: 'Storia · cantiere CityLife', ch: 'IG' }, { h: '19:00', t: 'Post · nuova recensione', ch: 'FB' }],
    },
    recents: [
      { t: 'Soggiorno · Staging moderno', sub: 'Trilocale Porta Romana', time: '2 h fa', k: 'staging' },
      { t: 'Reel 30s · Attico Isola', sub: 'Pronto da pubblicare', time: 'Ieri', k: 'video' },
      { t: 'Carosello IG programmato', sub: 'Domani · 09:30', time: 'Ieri', k: 'plan' },
    ],
  }
}

// Account "appena registrato": stessa piattaforma ma vuota.
// Manteniamo i contenuti di ALTRI utenti (post del feed + commenti, agenti suggeriti e gli
// immobili in vetrina — quelli referenziati dai post e sfogliabili dal privato) e azzeriamo
// tutto ciò che è PERSONALE (lead, contatti, trattative, conversazioni, notifiche, agenda,
// planner, creazioni recenti, like/salvati) e la bio/obiettivi.
export function seedFreshData() {
  const base = seedData()
  return {
    ...base,
    bio: '',
    goals: {},
    posts: base.posts.filter(p => !p.mine),
    leads: [],
    contacts: [],
    deals: [],
    liked: {},
    saved: {},
    followed: {},
    convos: [],
    threads: {},
    notifs: [],
    agenda: [],
    sched: {},
    recents: [],
  }
}

// Stato UI iniziale (navigazione, tab, wizard). Persistito anch'esso per riprendere la sessione.
export function seedUi() {
  return {
    screen: 'login', hist: [],
    drawer: false, create: false, notifPop: false, sidebarCollapsed: false,
    feedTab: 'perte', crmTab: 'lead', propChip: 'Tutti', profTab: 'immobili', aiTab: 'hub', planDay: 2,
    selProp: 1, selLead: 1, selChat: 1, selDeal: 1, selAuthor: null, propOpen: false, leadOpen: false, dealOpen: false, authorOpen: false, chatPane: false,
    propPickerOpen: false,
    signupStep: 1, signupRole: 'agente', signupName: 'Federico Rosati', signupMail: 'federico.rosati@gmail.com',
    obStep: 1,
    np: { step: 1, type: 'Vendita', tipo: 'Appartamento', loc: 3, bagni: 2, m2: '95', piano: '3', pianiTot: '5', cls: 'B', spese: '180', addr: 'Via Orti 14, Milano', zone: 'Porta Romana · Milano', price: '485.000', extras: { Terrazzo: true, Ascensore: true, Box: false, Cantina: true, Giardino: false, Arredato: false }, ai: true, createdId: null },
    stag: { step: 1, photo: 1, style: 'Moderno', pct: 56 },
    pe: { luce: true, cielo: false, persp: false, ogg: false },
    vid: { step: 1, prop: 3, tpl: 'Reel Tour', gen: false, done: false },
    copy: { type: 'Annuncio portale', tone: 'Professionale', done: false },
    chatInput: '', postText: '', msgFilter: 'Tutti', feedSearch: '', searchOpen: false,
    pubView: false, expandComments: {},
    addContactOpen: false, planAddOpen: false,
    // CRM: modifica contatto (oggetto contatto o null), creazione lead/trattativa; AI: archivio
    editContact: null, addLeadOpen: false, addLeadStage: null, dealPickerOpen: false, aiArchiveOpen: false,
  }
}

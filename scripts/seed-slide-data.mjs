// Seed slide_data for all PED topics from the editorial plan
const SUPA_URL = "https://ecrnpyksnfyykqwnutwa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcm5weWtzbmZ5eWtxd251dHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4NjEzOSwiZXhwIjoyMDg0NDQ2MTM5fQ.Z2jdXYjoaO4z0knuBiAYc2PaFwiQ25GweaDjty_Tbz0";

const HEADERS = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  "Content-Type": "application/json",
  Prefer: "return=minimal",
};

async function patch(id, slide_data) {
  const r = await fetch(`${SUPA_URL}/rest/v1/content_topics?id=eq.${id}`, {
    method: "PATCH",
    headers: HEADERS,
    body: JSON.stringify({ slide_data }),
  });
  if (!r.ok) console.error(`FAIL ${id}: ${r.status} ${await r.text()}`);
  return r.ok;
}

// ── SLIDE DATA PER TOPIC ──────────────────────────────────────────

const TOPICS = [

// ── Jun 15 ──
{ id: "79a2b80c-61ae-4d46-85e2-455b7a9eba27", // Il mercato casa è ripartito
  d: {
    badge: "Mercato", badgeColor: "amber",
    stat: "767", unit: "mila", delta: "+6,4%",
    statLabel: "Compravendite residenziali in Italia, 2025",
    title: "Il mercato casa è ripartito.", titleHL: "E ora?",
    kicker: "Cosa significa per chi vende",
    insight: "Più compravendite significa più clienti in movimento, ma anche <strong>più annunci in concorrenza tra loro</strong>.<br><br>Il cliente oggi confronta tutto. Vince chi spiega meglio prezzo, zona e potenziale.",
    cardLabel: "Il dato da ricordare",
    cardValue: "+6,4% = più confronto, <span>non più facilità</span>",
    valueTitle: "3 cose da fare", valueHL: "questa settimana",
    actions: [
      { text: "Prepara comparabili aggiornati", sub: "Il cliente confronta. Tu devi avere i dati pronti." },
      { text: "Aggiungi un'analisi di zona", sub: "Servizi, trasporti, contesto: il cliente vuole capire dove vive." },
      { text: "Porta un report all'appuntamento", sub: "Il proprietario percepisce più valore quando vede il tuo lavoro." },
    ],
    ctaKicker: "Trasforma ogni annuncio in",
    ctaTitle: "report, post e analisi", ctaHL: "in pochi clic",
    ctaPill: "MERCATO", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "46796fa3-adf0-41a8-8379-9506ee1d1d3d", // Il lavoro che il proprietario non vede
  d: {
    badge: "Per agenti", badgeColor: "amber",
    kicker: "Il valore che non si vede",
    hook: "Il lavoro che il proprietario", hookHL: "non vede",
    body: "Dietro ogni immobile ci sono attività invisibili: analisi, confronto, selezione foto, descrizioni, materiali per gli appuntamenti.<br><br><strong>GetNearMe trasforma quel lavoro in materiali chiari e presentabili.</strong> Così il cliente capisce cosa stai facendo per lui.",
    ctaPill: "VALORE", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

{ id: "633783e2-e519-4da4-82cf-e7b5fb2ca0a4", // Da annuncio a materiali pronti
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Il flusso GetNearMe",
    hook: "Da annuncio a", hookHL: "materiali pronti",
    body: "Un annuncio contiene già quasi tutto: immagini, prezzo, posizione, caratteristiche.<br><br><strong>Con GetNearMe parti dall'annuncio e generi contenuti pronti</strong> per presentare meglio l'immobile: report, post social, video, home staging e analisi zona.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

// ── Jun 16 ──
{ id: "9c56b020-788f-460f-919e-c182fd11259a", // Roma: il quartiere pesa più di quanto sembra
  d: {
    badge: "Roma", badgeColor: "amber",
    stat: "8.697", unit: "€/m²", delta: "+4,2%",
    statLabel: "Prezzo medio vendita Centro Storico, Roma — Maggio 2026",
    title: "Il quartiere pesa più", titleHL: "di quanto sembra",
    kicker: "Cosa cambia zona per zona",
    insight: "Non basta dire \"appartamento a Roma\". Bisogna raccontare <strong>dove si trova, cosa offre la zona</strong> e perché quel contesto incide sul valore.<br><br>Le zone vanno da 1.909 a 8.697 €/m². Ogni quartiere ha una storia diversa.",
    cardLabel: "Il range di Roma",
    cardValue: "Da 1.909 a <span>8.697 €/m²</span>",
    valueTitle: "Come raccontare", valueHL: "il quartiere",
    actions: [
      { text: "Mostra i servizi della zona", sub: "Trasporti, scuole, aree verdi: il contesto pesa sulla decisione." },
      { text: "Contestualizza il prezzo", sub: "Confronta con zone limitrofe per dare un riferimento chiaro." },
      { text: "Usa l'analisi zona nell'annuncio", sub: "Il cliente vuole capire dove vivrà, non solo cosa compra." },
    ],
    ctaKicker: "Racconta meglio le zone con",
    ctaTitle: "dati, mappa e contesto", ctaHL: "pronti in pochi clic",
    ctaPill: "ROMA", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "ceffe01d-967c-4a91-85c6-72c1b38407c8", // 5 cose che un annuncio dovrebbe spiegare meglio
  d: {
    badge: "Educativo", badgeColor: "blue",
    num: "5", title: "cose che un annuncio dovrebbe", titleHL: "spiegare meglio",
    items: [
      { title: "Perché quel prezzo è coerente", text: "Il cliente cerca conferme. Mostra comparabili e contesto per rendere il prezzo credibile.", tip: "GetNearMe genera comparabili e dati zona automaticamente dall'annuncio." },
      { title: "Cosa offre la zona", text: "Trasporti, scuole, servizi, aree verdi. Il contesto influisce sulla percezione di valore.", tip: "L'analisi zona trasforma questi dati in materiali leggibili." },
      { title: "Quali immobili sono comparabili", text: "Confrontare aiuta il cliente a posizionare l'immobile nel mercato.", tip: "Il report include comparabili della zona in automatico." },
      { title: "Qual è il potenziale degli spazi", text: "Una stanza vuota non si spiega da sola. Serve aiutare il cliente a immaginare.", tip: "L'home staging AI mostra il potenziale visivamente." },
      { title: "Perché merita attenzione", text: "Ogni immobile ha punti di forza unici. L'annuncio deve farli emergere.", tip: "Il report evidenzia i punti di forza in modo chiaro." },
    ],
    ctaKicker: "Trasforma l'annuncio in",
    ctaTitle: "report, analisi zona e staging", ctaHL: "in pochi clic",
    ctaPill: "DEMO", ctaSub: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

{ id: "dc4ee68b-621b-49f3-8ce8-5374f9eaac6b", // Report PDF: non solo un file
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Lo strumento che cambia la conversazione",
    hook: "Report PDF: non solo", hookHL: "un file",
    body: "Un report PDF non serve solo a fare bella figura.<br><br>Serve a <strong>spiegare meglio il prezzo, rendere leggibile il confronto con la zona</strong>, mostrare informazioni utili e dare al proprietario una percezione più chiara del lavoro dell'agenzia.",
    ctaPill: "REPORT", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

// ── Jun 17 ──
{ id: "cbf3f36e-daef-49de-a663-dd78b0992fa5", // 2026: meno corsa, più qualità
  d: {
    badge: "Mercato", badgeColor: "amber",
    kicker: "Previsioni 2026",
    hook: "2026: meno corsa,", hookHL: "più qualità",
    body: "Secondo Nomisma, nel 2026 le compravendite residenziali potrebbero crescere dell'1,8%, intorno a 783.000 transazioni.<br><br><strong>Non è un mercato fermo. È un mercato che richiede più metodo.</strong> Meno tempo operativo, più capacità di presentare bene ogni immobile.",
    ctaPill: "2026", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

{ id: "0182c02b-64e7-469c-87d7-9f0fda90593b", // Home staging AI: quando ha senso usarlo
  d: {
    badge: "Feature", badgeColor: "blue",
    coverTitle: "Home staging AI:", coverHL: "quando ha senso usarlo",
    noText: "Non serve a nascondere difetti", noSub: "Non è un filtro per rendere bello ciò che non lo è. Il cliente se ne accorge.",
    yesText: "Serve quando lo spazio non si spiega da solo", yesSub: "Aiuta a far vedere il potenziale che il cliente fatica a immaginare.",
    casesTitle: "Quando ha senso", casesHL: "usarlo",
    cases: [
      { title: "Immobili vuoti", text: "Una stanza vuota può sembrare più piccola e fredda. Lo staging aiuta a immaginare." },
      { title: "Ambienti datati", text: "Arredi vecchi distraggono dal potenziale reale dello spazio." },
      { title: "Spazi difficili", text: "Open space, mansarde, seminterrati: servono riferimenti visivi per capirli." },
    ],
    ctaKicker: "Direttamente dal tuo annuncio",
    ctaTitle: "Scegli lo stile e vedi il risultato", ctaHL: "in pochi secondi",
    ctaPill: "STAGING", ctaSub: "Ricevi il link per provare GetNearMe sulle tue foto.",
  }},

{ id: "b52cfeb7-31fc-4eac-bd75-b35fb340b200", // Hai contatti con agenzie immobiliari?
  d: {
    badge: "Ambassador", badgeColor: "amber",
    kicker: "Programma ambassador",
    hook: "I tuoi contatti nel settore", hookHL: "valgono più di quanto pensi.",
    body: "Se conosci titolari di agenzie, agenti immobiliari o professionisti del settore, puoi trasformare una relazione in un'opportunità.<br><br><strong>Tu presenti il contatto. Noi gestiamo demo, proposta e attivazione.</strong>",
    ctaPill: "AMBASSADOR", ctaHint: "Ricevi in DM i dettagli del programma",
  }},

// ── Jun 18 ──
{ id: "52351a49-18c4-4cd1-b254-e79ddceb9afb", // Milano: prezzi alti, aspettative alte
  d: {
    badge: "Milano", badgeColor: "blue",
    stat: "11.300", unit: "€/m²", delta: "+3,8%",
    statLabel: "Prezzo medio vendita Centro, Milano — Maggio 2026",
    title: "Prezzi alti,", titleHL: "aspettative alte",
    kicker: "Cosa significa per le agenzie milanesi",
    insight: "A Milano le zone di vendita vanno da 3.223 a 11.300 €/m². <strong>Più il prezzo sale, più devi saperlo spiegare bene.</strong><br><br>La presentazione dell'immobile non è un dettaglio. È parte del modo in cui il valore viene percepito.",
    cardLabel: "Il range di Milano",
    cardValue: "Da 3.223 a <span>11.300 €/m²</span>",
    valueTitle: "Come presentare meglio", valueHL: "in un mercato premium",
    actions: [
      { text: "Contestualizza il prezzo della zona", sub: "Mostra comparabili e range per dare un riferimento." },
      { text: "Cura la presentazione visiva", sub: "Home staging, foto curate, materiali coerenti." },
      { text: "Prepara un report strutturato", sub: "Il cliente milanese si aspetta professionalità nei dettagli." },
    ],
    ctaKicker: "Presenta meglio ogni immobile con",
    ctaTitle: "report, staging e analisi zona", ctaHL: "dal tuo annuncio",
    ctaPill: "MILANO", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "8c10a7a8-a079-4feb-87f0-3661bb8bac3d", // Meno strumenti aperti, più tempo per vendere
  d: {
    badge: "Per agenti", badgeColor: "amber",
    kicker: "Il problema non è il digitale",
    hook: "Meno strumenti aperti,", hookHL: "più tempo per vendere",
    body: "Il problema non è usare strumenti digitali. È usarne troppi, tutti separati: Canva per i post, PowerPoint per le presentazioni, Excel per i dati.<br><br><strong>GetNearMe non aggiunge un altro peso al flusso. Lo semplifica:</strong> parte dall'annuncio e centralizza gli output più utili.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

{ id: "04a13f89-4644-4560-a3f8-13063e4175f2", // Come creare un post social da un annuncio
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Più continuità, meno improvvisazione",
    hook: "Come creare un post social", hookHL: "da un annuncio",
    body: "Se l'annuncio ha già foto, prezzo, zona e caratteristiche, hai già una base.<br><br><strong>GetNearMe aiuta a trasformarla in post social coerenti</strong> e pronti da adattare. Il risultato: più continuità, meno improvvisazione, più ordine.",
    ctaPill: "SOCIAL", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

// ── Jun 19 ──
{ id: "08d67387-0c5a-4575-a2e4-ad43751a584e", // Il dato più utile non è il prezzo. È il confronto.
  d: {
    badge: "Mercato", badgeColor: "amber",
    stat: "450", unit: "mila €", delta: "≠",
    statLabel: "Un prezzo senza contesto è solo un numero",
    title: "Il dato più utile non è il prezzo.", titleHL: "È il confronto.",
    kicker: "Dalla dichiarazione alla spiegazione",
    insight: "Dire \"vale 450.000€\" è una dichiarazione.<br><br>Mostrare <strong>comparabili, andamento della zona e servizi vicini</strong> è una spiegazione.<br><br>Nel mercato di oggi, il cliente vuole capire. L'agente che sa presentare dati semplici diventa più credibile.",
    cardLabel: "La differenza",
    cardValue: "Dichiarazione vs <span>Spiegazione</span>",
    valueTitle: "4 dati da portare", valueHL: "al prossimo appuntamento",
    actions: [
      { text: "Comparabili della zona", sub: "Mostra immobili simili per dare un riferimento di mercato." },
      { text: "Andamento dei prezzi", sub: "Il cliente vuole sapere se è il momento giusto." },
      { text: "Servizi e contesto", sub: "Trasporti, scuole, aree verdi: incidono sulla percezione." },
      { text: "Report sintetico", sub: "Un documento chiaro vale più di mille parole." },
    ],
    ctaKicker: "Trasforma i dati in",
    ctaTitle: "materiali comprensibili", ctaHL: "per i tuoi clienti",
    ctaPill: "DATI", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "407509c7-5f97-443a-bbab-b2c9212b7fe7", // Analisi zona: cosa puoi raccontare oltre le foto
  d: {
    badge: "Feature", badgeColor: "blue",
    coverTitle: "Analisi zona:", coverHL: "cosa puoi raccontare oltre le foto",
    noText: "Non basta una frase generica nella descrizione", noSub: "\"Zona ben servita\" non dice nulla al cliente. Servono dati concreti.",
    yesText: "Racconta trasporti, scuole, servizi e aree verdi", yesSub: "Per alcune case, il contesto è la leva più forte nella presentazione.",
    casesTitle: "Quando l'analisi zona", casesHL: "fa la differenza",
    cases: [
      { title: "Immobili in zone residenziali", text: "Famiglie vogliono sapere cosa c'è intorno: scuole, parchi, supermercati." },
      { title: "Zone in trasformazione", text: "Nuove infrastrutture, progetti urbanistici: il potenziale va raccontato." },
      { title: "Immobili da investimento", text: "Trasporti, università, uffici: il contesto definisce la domanda." },
    ],
    ctaKicker: "Racconta la zona con",
    ctaTitle: "mappa, POI e dati", ctaHL: "in pochi clic",
    ctaPill: "ZONA", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "f97f525d-572e-49e1-bcdd-c3214b67acd2", // Il post perfetto non vende da solo. Ma aiuta.
  d: {
    badge: "Educativo", badgeColor: "blue",
    num: "3", title: "ruoli che un contenuto social", titleHL: "può avere per un'agenzia",
    items: [
      { title: "Far percepire qualità", text: "Un post curato comunica professionalità prima ancora di una telefonata.", tip: "GetNearMe genera post coerenti partendo dall'annuncio." },
      { title: "Ricordare che l'agenzia è attiva", text: "La continuità sui social mantiene viva la presenza nel mercato.", tip: "Pubblica con regolarità senza ripartire ogni volta da zero." },
      { title: "Dare informazioni utili", text: "Dati di zona, trend, consigli: il contenuto utile attrae clienti qualificati.", tip: "I dati di mercato diventano contenuti pronti da condividere." },
    ],
    ctaKicker: "Pubblica meglio con",
    ctaTitle: "meno lavoro manuale e", ctaHL: "più coerenza",
    ctaPill: "DEMO", ctaSub: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

// ── Jun 20 ──
{ id: "64a723a2-942a-4f6c-a8c7-b76b4e9bf2b3", // Roma: Centro Storico a 8.697 €/m²
  d: {
    badge: "Roma", badgeColor: "amber",
    kicker: "Il valore cambia zona per zona",
    hook: "Centro Storico a 8.697 €/m²,", hookHL: "Lunghezza a 1.909",
    body: "A maggio 2026, Roma non è un solo mercato. Il Centro Storico è la zona con il prezzo richiesto più alto. Lunghezza la più bassa.<br><br><strong>Ogni zona ha una storia, una domanda e una percezione diversa.</strong> L'agente deve saperla raccontare.",
    ctaPill: "ROMA", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

{ id: "ec9c585d-336b-48c2-a322-38a640ac0e86", // Da foto vuota a stanza valorizzata
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Il potenziale che il cliente non vede",
    hook: "Da foto vuota a stanza", hookHL: "valorizzata",
    body: "Una stanza vuota può sembrare più piccola, fredda o difficile da immaginare.<br><br><strong>Il prima/dopo con home staging AI serve a dare una lettura possibile dello spazio.</strong> La differenza non è solo estetica: è percezione del potenziale.",
    ctaPill: "STAGING", ctaHint: "Ricevi il link per provare GetNearMe sulle tue foto",
  }},

{ id: "3f2487da-f140-44ac-9029-1439b491df94", // Ambassador in 4 passaggi
  d: {
    coverTitle: "I tuoi contatti nel settore", coverHL: "valgono più di quanto pensi.",
    coverSub: "Il programma ambassador è pensato per chi ha relazioni nel mondo immobiliare.",
    steps: [
      { title: "Segnala il contatto", text: "Conosci un titolare, un agente o un team? Basta una segnalazione.", note: "Tu apri la conversazione, noi facciamo il resto." },
      { title: "Noi facciamo la demo", text: "Il nostro team contatta l'agenzia, organizza la demo e presenta GetNearMe.", note: "Non devi seguire la trattativa." },
      { title: "L'agenzia decide", text: "Nessuna pressione. L'agenzia valuta in autonomia se attivare GetNearMe.", note: "Tu non hai obblighi dopo la segnalazione." },
      { title: "Ricevi il payout", text: "Se l'agenzia diventa cliente, ricevi il compenso previsto dal programma.", note: "" },
    ],
    ctaKicker: "Programma Ambassador",
    ctaTitle: "Una relazione può diventare", ctaHL: "valore",
    ctaPill: "PARTNER", ctaSub: "Ricevi in DM i dettagli del programma ambassador.",
  }},

// ── Jun 21 ──
{ id: "31749376-f940-4aeb-9093-62d36b3c124e", // Più mercato significa anche più rumore
  d: {
    badge: "Mercato", badgeColor: "amber",
    stat: "767", unit: "mila", delta: "+6,4%",
    statLabel: "Compravendite 2025 — Ma anche più concorrenza",
    title: "Più mercato significa anche", titleHL: "più rumore",
    kicker: "Perché differenziarsi diventa necessario",
    insight: "Se il mercato cresce, crescono anche <strong>gli annunci, i contenuti e le alternative</strong> viste dal cliente.<br><br>Essere presenti non basta. Serve spiegare meglio l'immobile, dare più contesto, mostrare più professionalità.",
    cardLabel: "La sfida",
    cardValue: "Essere presenti <span>non basta più</span>",
    valueTitle: "5 modi per", valueHL: "distinguerti",
    actions: [
      { text: "Materiali professionali su ogni annuncio", sub: "Report, analisi zona, staging: non solo foto e prezzo." },
      { text: "Contenuti social coerenti", sub: "Pubblica con regolarità e qualità, non solo quando hai tempo." },
      { text: "Dati di zona leggibili", sub: "Il cliente confronta. Tu devi spiegare meglio di tutti." },
    ],
    ctaKicker: "Differenziati con",
    ctaTitle: "materiali completi e professionali", ctaHL: "su ogni annuncio",
    ctaPill: "RUMORE", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "653b1d4e-4133-4790-8143-143765f41f81", // L'agente resta al centro
  d: {
    badge: "Per agenti", badgeColor: "amber",
    kicker: "Tecnologia al servizio dell'agente",
    hook: "L'agente resta", hookHL: "al centro",
    body: "GetNearMe non sostituisce l'agente.<br><br>Automatizza attività operative, ma <strong>fiducia, ascolto, negoziazione e conoscenza del territorio restano umane</strong>.<br><br>La tecnologia serve a togliere peso dove il lavoro è ripetitivo. Così l'agente può dedicare più tempo alla relazione e alla vendita.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

{ id: "e5dcf853-7796-41cc-afe0-39ccac05b858", // Come si prepara un appuntamento in 10 minuti
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Non è solo velocità. È metodo.",
    hook: "Come si prepara un appuntamento", hookHL: "in 10 minuti",
    body: "Prima di incontrare un proprietario servono tre cose: dati chiari, contesto della zona e materiali presentabili.<br><br><strong>Con GetNearMe puoi partire dall'annuncio e preparare una base più ordinata</strong> per la conversazione. Non è solo velocità. È arrivare con più metodo.",
    ctaPill: "APPUNTAMENTO", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

// ── Jun 22 ──
{ id: "c7546a2f-9a62-48f9-9af0-f283ef5a7e95", // Milano: Centro, Porta Nuova e Arco della Pace
  d: {
    badge: "Milano", badgeColor: "blue",
    stat: "11.300", unit: "€/m²", delta: "Centro",
    statLabel: "Zone premium Milano — Valori simili, target diversi",
    title: "Centro, Porta Nuova e Arco della Pace:", titleHL: "target diversi",
    kicker: "Non basta dire 'zona centrale'",
    insight: "Centro a 11.300, Garibaldi-Porta Nuova a 10.095, Arco della Pace a 10.020 €/m².<br><br><strong>Sono valori simili, ma pubblici, aspettative e narrazioni possono essere diversi.</strong><br><br>Un buon annuncio deve aiutare il cliente a leggere queste differenze.",
    cardLabel: "Il punto",
    cardValue: "Valori simili, <span>target diversi</span>",
    valueTitle: "Come differenziare", valueHL: "le micro-zone",
    actions: [
      { text: "Racconta il target della zona", sub: "Famiglie, professionisti, investitori: ogni zona attrae diversamente." },
      { text: "Mostra servizi specifici", sub: "Locali, uffici, scuole internazionali: il contesto conta." },
      { text: "Contestualizza il prezzo nella zona", sub: "Il confronto locale è più utile del dato cittadino." },
    ],
    ctaKicker: "Racconta le micro-zone con",
    ctaTitle: "dati, mappa e contesto", ctaHL: "dal tuo annuncio",
    ctaPill: "MILANO", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "ec2ae7ea-82c9-4433-bf92-d22b8975a49b", // Il tuo brand dentro ogni materiale
  d: {
    badge: "Feature", badgeColor: "blue",
    coverTitle: "Il tuo brand", coverHL: "dentro ogni materiale",
    noText: "Ogni materiale sembra fatto in un momento diverso", noSub: "Post con uno stile, PDF con un altro, grafiche non coerenti.",
    yesText: "GetNearMe mantiene continuità visiva", yesSub: "Logo, stile, formato e materiali generati dallo stesso flusso. La coerenza aumenta la percezione di professionalità.",
    cases: [
      { title: "Post social brandizzati", text: "Stile coerente su ogni pubblicazione, senza rifare la grafica ogni volta." },
      { title: "Report con il tuo logo", text: "PDF professionali con l'identità dell'agenzia in automatico." },
      { title: "Video con stile uniforme", text: "Cover, animazioni e output visivi sempre allineati al brand." },
    ],
    ctaKicker: "Mantieni il tuo brand su",
    ctaTitle: "ogni materiale generato", ctaHL: "dall'annuncio",
    ctaPill: "DEMO", ctaSub: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

{ id: "02fcac12-cd67-4934-81a0-f4160a7bcb44", // 4 dati da portare a un proprietario
  d: {
    badge: "Educativo", badgeColor: "blue",
    num: "4", title: "dati da portare a un", titleHL: "proprietario",
    items: [
      { title: "Andamento della domanda", text: "Il proprietario vuole sapere se il mercato è attivo nella sua zona.", tip: "GetNearMe include dati di mercato aggiornati nel report." },
      { title: "Immobili comparabili", text: "Mostrare alternative simili aiuta a posizionare il prezzo in modo credibile.", tip: "I comparabili vengono estratti in automatico dall'annuncio." },
      { title: "Servizi e contesto della zona", text: "Trasporti, scuole, aree verdi: influiscono sulla percezione del valore.", tip: "L'analisi zona li mappa e li rende presentabili." },
      { title: "Punti di forza dell'immobile", text: "Ogni immobile ha caratteristiche uniche. Il report le evidenzia.", tip: "Il report sintetizza i punti di forza in modo chiaro." },
    ],
    ctaKicker: "Porta questi dati al prossimo",
    ctaTitle: "appuntamento con un", ctaHL: "report completo",
    ctaPill: "4DATI", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

// ── Jun 23 ──
{ id: "c2836abb-b5cf-496f-bb5d-debae90b42f4", // La velocità è un vantaggio commerciale
  d: {
    badge: "Per agenti", badgeColor: "amber",
    kicker: "Non solo comodità",
    hook: "La velocità è un vantaggio", hookHL: "commerciale",
    body: "Rispondere prima, arrivare preparati, inviare materiali chiari, pubblicare con continuità.<br><br><strong>Nel lavoro immobiliare la velocità non è solo comodità. È vantaggio commerciale.</strong><br><br>GetNearMe riduce i passaggi manuali e aiuta l'agenzia a trasformare un annuncio in materiali pronti.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

{ id: "6bd7590e-cdfc-47bb-968c-9e187e3a11dc", // L'Italia non ha un solo mercato immobiliare
  d: {
    badge: "Mercato", badgeColor: "amber",
    kicker: "Il valore della lettura locale",
    hook: "L'Italia non ha un solo", hookHL: "mercato immobiliare",
    body: "Il dato nazionale è utile, ma non basta. Nel 2025 il mercato residenziale cresce, ma <strong>le dinamiche cambiano per area, città e quartiere</strong>.<br><br>L'agente non deve solo conoscere il mercato. Deve saperlo tradurre in informazioni semplici per il cliente.",
    ctaPill: "LOCAL", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

{ id: "9072e97e-b4f3-4908-bb78-25bfe20d8413", // Come funziona l'analisi zona
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Una feature di valore commerciale",
    hook: "Come funziona", hookHL: "l'analisi zona",
    body: "L'analisi zona è utile quando il cliente deve capire cosa c'è intorno all'immobile.<br><br><strong>Trasporti, scuole, servizi, aree verdi e punti di interesse non sono dettagli.</strong> Possono influire su percezione, scelta e fiducia.<br><br>Con GetNearMe li trasformi in una parte leggibile del materiale di vendita.",
    ctaPill: "ZONA", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

// ── Jun 24 ──
{ id: "a8d31c08-3c13-49ea-907e-899c63b730ab", // Roma EUR: contesto e servizi pesano
  d: {
    badge: "Roma", badgeColor: "amber",
    stat: "5.090", unit: "€/m²", delta: "EUR",
    statLabel: "Vendita residenziale EUR, Torrino, Tintoretto — Maggio 2026",
    title: "Roma EUR: contesto e servizi", titleHL: "pesano",
    kicker: "Il quadrante dove il contesto è tutto",
    insight: "Nel quadrante EUR, Torrino, Tintoretto, i valori di vendita vanno da 3.269 a 5.090 €/m².<br><br><strong>Sono zone dove servizi, uffici, collegamenti e target familiare/professionale incidono molto</strong> nella presentazione. Raccontare il contesto diventa parte della vendita.",
    cardLabel: "Range EUR",
    cardValue: "Da 3.269 a <span>5.090 €/m²</span>",
    valueTitle: "Come raccontare", valueHL: "il contesto EUR",
    actions: [
      { text: "Mappa servizi e uffici", sub: "EUR è zona direzionale: il contesto lavorativo pesa." },
      { text: "Evidenzia i collegamenti", sub: "Metro, bus, strade: il pendolarismo conta." },
      { text: "Racconta il target della zona", sub: "Famiglie e professionisti cercano cose diverse." },
    ],
    ctaKicker: "Racconta il contesto con",
    ctaTitle: "analisi zona e dati", ctaHL: "in pochi clic",
    ctaPill: "EUR", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "f268f208-1772-48e3-b241-648fc04a9396", // Report, video, post: tutto parte dall'annuncio
  d: {
    badge: "Feature", badgeColor: "blue",
    coverTitle: "Report, video, post:", coverHL: "tutto parte dall'annuncio",
    noText: "Rifare tutto più volte con strumenti separati", noSub: "Canva, PowerPoint, Excel, cartelle foto, tool video, PDF a mano.",
    yesText: "Un solo flusso, più output, meno dispersione", yesSub: "L'annuncio è la base. GetNearMe usa quella base per generare materiali diversi ma coerenti.",
    cases: [
      { title: "Report PDF", text: "Dati, zona, comparabili e punti di forza in un documento professionale." },
      { title: "Post social", text: "Contenuti pronti per Instagram e LinkedIn, coerenti con il brand." },
      { title: "Video e staging", text: "Home staging AI e video animati partendo dalle foto dell'annuncio." },
    ],
    ctaKicker: "Un flusso, molti output",
    ctaTitle: "Tutto parte dall'annuncio", ctaHL: "e arrivi prima",
    ctaPill: "FLUSSO", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "7af51f75-0b2a-42fb-ad33-dfcfe62ecec8", // Una relazione può diventare valore
  d: {
    badge: "Ambassador", badgeColor: "amber",
    kicker: "Non devi convincere nessuno",
    hook: "Una relazione può diventare", hookHL: "valore",
    body: "Se conosci agenzie immobiliari, non devi convincerle con una vendita aggressiva.<br><br><strong>Puoi semplicemente presentare uno strumento utile</strong> a un problema reale: creare materiali migliori partendo dagli annunci.<br><br>GetNearMe gestisce demo e attivazione. Tu apri la porta giusta.",
    ctaPill: "REFERRAL", ctaHint: "Ricevi in DM i dettagli del programma",
  }},

// ── Jun 25 ──
{ id: "fc7751cf-48c4-430b-a246-2b40dea627f7", // Prezzi in crescita: opportunità o difficoltà?
  d: {
    badge: "Mercato", badgeColor: "amber",
    stat: "+3,2", unit: "%", delta: "2026",
    statLabel: "Crescita prezzi residenziale — Trend nazionale",
    title: "Prezzi in crescita:", titleHL: "opportunità o difficoltà?",
    kicker: "Il cliente diventa più attento",
    insight: "Quando i prezzi crescono, il cliente diventa più attento. Vuole capire se il prezzo è corretto, cosa offre la zona, quali alternative esistono.<br><br><strong>Per l'agente è una sfida, ma anche un'opportunità:</strong> chi sa spiegare bene il valore si differenzia.",
    cardLabel: "L'opportunità",
    cardValue: "Chi spiega meglio, <span>vince</span>",
    valueTitle: "Come spiegare", valueHL: "il valore",
    actions: [
      { text: "Prepara comparabili aggiornati", sub: "Il cliente confronta. Tu devi avere i riferimenti pronti." },
      { text: "Mostra cosa offre la zona", sub: "Servizi, trasporti, contesto: il prezzo ha sempre un perché." },
      { text: "Presenta materiali chiari", sub: "Un report ben fatto aumenta la credibilità dell'agente." },
    ],
    ctaKicker: "Spiega meglio il valore con",
    ctaTitle: "dati e materiali", ctaHL: "professionali",
    ctaPill: "PREZZI", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "a9232d11-c4d3-4cfc-96a0-64dbcb755329", // Cosa deve contenere un report immobiliare utile
  d: {
    badge: "Educativo", badgeColor: "blue",
    num: "6", title: "elementi per un report", titleHL: "immobiliare utile",
    items: [
      { title: "Dati essenziali dell'immobile", text: "Metratura, vani, stato, classe energetica: le basi devono esserci.", tip: "GetNearMe li estrae dall'annuncio in automatico." },
      { title: "Informazioni sulla zona", text: "Servizi, trasporti, scuole: il contesto influisce sulla decisione.", tip: "L'analisi zona li mappa e li rende leggibili." },
      { title: "Immobili comparabili", text: "Il confronto aiuta il proprietario a capire il posizionamento.", tip: "I comparabili vengono inclusi automaticamente." },
      { title: "Punti di forza", text: "Ogni immobile ha caratteristiche uniche da evidenziare.", tip: "Il report li sintetizza in modo chiaro." },
      { title: "Immagini curate", text: "Le foto devono supportare il racconto, non solo mostrare stanze.", tip: "L'home staging può valorizzare spazi vuoti o datati." },
      { title: "Una lettura sintetica", text: "Il report non sostituisce la conversazione. La rende più solida.", tip: "Il report GetNearMe è progettato per essere usato in appuntamento." },
    ],
    ctaKicker: "Genera report completi",
    ctaTitle: "partendo dall'annuncio", ctaHL: "in pochi clic",
    ctaPill: "REPORT", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "0f9f6509-e5f0-4a3c-93e4-4589c418d9be", // Demo: da annuncio a PDF cliente
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Il valore pratico di GetNearMe",
    hook: "Da annuncio a", hookHL: "PDF cliente",
    body: "Prendi un annuncio, selezioni le informazioni utili, generi un report cliente e ottieni un materiale pronto da usare.<br><br><strong>Non è un documento \"carino\". È uno strumento per spiegare meglio l'immobile.</strong>",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

// ── Jun 26 ──
{ id: "81f698b7-1b60-4090-8521-f146d4515640", // Milano affitti: non solo vendita
  d: {
    badge: "Milano", badgeColor: "blue",
    stat: "31,29", unit: "€/m²", delta: "max",
    statLabel: "Affitto residenziale massimo, Milano — Maggio 2026",
    title: "Milano affitti:", titleHL: "non solo vendita",
    kicker: "Anche le locazioni richiedono qualità",
    insight: "A Milano gli affitti residenziali variano da 15,88 a 31,29 €/m² mese.<br><br><strong>Per chi lavora su locazioni, il contesto e la qualità della presentazione restano cruciali.</strong> Anche se il dato annuo segna una flessione, alcune zone restano forti.",
    cardLabel: "Range affitti Milano",
    cardValue: "Da 15,88 a <span>31,29 €/m² mese</span>",
    valueTitle: "Come presentare", valueHL: "le locazioni",
    actions: [
      { text: "Racconta il contesto della zona", sub: "Trasporti, uffici, università: chi affitta valuta la zona." },
      { text: "Confronta con zone limitrofe", sub: "Il range aiuta l'inquilino a posizionare l'offerta." },
      { text: "Prepara materiali professionali", sub: "Anche per le locazioni, la qualità della presentazione conta." },
    ],
    ctaKicker: "Presenta meglio anche le locazioni con",
    ctaTitle: "report e analisi zona", ctaHL: "dall'annuncio",
    ctaPill: "AFFITTI", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "4b24c292-5d0b-4adc-99f7-6cbab91e1b4f", // Non solo AI: metodo, dati e materiali pronti
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Oltre il buzzword",
    hook: "Non solo AI: metodo, dati e", hookHL: "materiali pronti",
    body: "GetNearMe non nasce per dire \"abbiamo l'AI\".<br><br>Nasce per risolvere un problema concreto: <strong>trasformare il lavoro sull'annuncio in materiali utili, veloci e coerenti.</strong><br><br>L'AI è una parte del processo. Il vero valore è il flusso: meno attività manuali, più chiarezza, più output pronti.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

{ id: "f590952c-c66f-4704-9ff8-b8d77c64c89b", // Da agente operativo ad agente consulenziale
  d: {
    badge: "Educativo", badgeColor: "blue",
    num: "2", title: "modi di lavorare:", titleHL: "operativo vs consulenziale",
    items: [
      { title: "L'agente operativo", text: "Passa ore tra copia-incolla, file, grafiche e strumenti separati. Il tempo va nel lavoro manuale.", tip: "GetNearMe riduce i passaggi operativi partendo dall'annuncio." },
      { title: "L'agente consulenziale", text: "Spiega il prezzo, legge il mercato, guida il cliente, costruisce fiducia. Il tempo va nella relazione.", tip: "Con meno lavoro manuale, puoi dedicare più tempo alla consulenza." },
    ],
    ctaKicker: "Lavora più da consulente e",
    ctaTitle: "meno da", ctaHL: "impaginatore",
    ctaPill: "DEMO", ctaSub: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

// ── Jun 27 ──
{ id: "5f541c88-e1b5-4c41-aa31-603af9094bed", // Il cliente è più informato. L'agente deve esserlo di più.
  d: {
    badge: "Mercato", badgeColor: "amber",
    kicker: "Il trend informativo",
    hook: "Il cliente è più informato.", hookHL: "L'agente deve esserlo di più.",
    body: "Oggi il cliente arriva dopo aver visto decine di annunci, confrontato prezzi e letto informazioni online.<br><br>Questo non rende inutile l'agente. <strong>Lo rende ancora più importante.</strong> Ma l'agente deve arrivare con materiali migliori, dati più chiari e una capacità di lettura superiore.",
    ctaPill: "CLIENTE", ctaHint: "Ricevi il link per provare GetNearMe",
  }},

{ id: "f8cf646f-ebaa-4c00-86ac-e38beacf8856", // Perché è facile proporre GetNearMe a un'agenzia
  d: {
    coverTitle: "Perché è facile proporre", coverHL: "GetNearMe a un'agenzia",
    coverSub: "Ogni agenzia lavora sugli annunci. Ogni agenzia crea materiali. Ogni agenzia perde tempo tra strumenti diversi.",
    steps: [
      { title: "Parti da un problema reale", text: "Non devi vendere una rivoluzione. Devi presentare una soluzione a un problema quotidiano.", note: "Ogni agente conosce il problema." },
      { title: "Mostra il flusso", text: "Da annuncio a report, post, video, staging e analisi zona. Un flusso, molti output.", note: "Il valore si vede in pochi secondi." },
      { title: "Lascia decidere a loro", text: "Noi facciamo la demo. Tu non devi seguire la vendita.", note: "Zero pressione, zero obblighi." },
      { title: "Ricevi il payout", text: "Se l'agenzia diventa cliente, il compenso è tuo.", note: "" },
    ],
    ctaKicker: "Programma Ambassador",
    ctaTitle: "Una presentazione semplice per", ctaHL: "un problema reale",
    ctaPill: "INTRO", ctaSub: "Ricevi in DM il messaggio di presentazione.",
  }},

{ id: "dccc35ea-3407-4b4c-9104-764da6605074", // La demo che vedrai in call
  d: {
    badge: "Feature", badgeColor: "blue",
    kicker: "Cosa succede in una demo",
    hook: "La demo che vedrai", hookHL: "in call",
    body: "In call non mostriamo solo slide.<br><br><strong>Partiamo da un annuncio reale e facciamo vedere cosa può diventare:</strong> report, social, video, analisi zona e materiali da usare con il cliente.<br><br>Così capisci subito se GetNearMe è utile per il tuo modo di lavorare.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

// ── Jun 28 ──
{ id: "193b2a30-34d7-44a6-888b-016057ab2a82", // Roma e Milano: due città, stessa esigenza
  d: {
    badge: "Roma & Milano", badgeColor: "amber",
    stat: "2", unit: "città", delta: "=",
    statLabel: "Due mercati diversi, un'esigenza comune",
    title: "Roma e Milano: due città,", titleHL: "stessa esigenza",
    kicker: "Dinamiche diverse, bisogno comune",
    insight: "Roma chiede capacità di raccontare quartieri e contesto. Milano chiede velocità, precisione e presentazione all'altezza.<br><br><strong>Ma l'esigenza è la stessa: rendere ogni annuncio più chiaro, più ricco e più professionale.</strong>",
    cardLabel: "Il punto",
    cardValue: "Qualità della presentazione <span>per entrambe</span>",
    valueTitle: "La doppia checklist", valueHL: "Roma/Milano",
    actions: [
      { text: "Roma: racconta il quartiere", sub: "Contesto, zona, servizi locali. Il cliente romano vuole capire dove vive." },
      { text: "Milano: cura la presentazione", sub: "Precisione, velocità, materiali all'altezza dei valori premium." },
      { text: "Entrambe: usa dati e report", sub: "Comparabili, analisi zona, staging: il flusso è lo stesso." },
    ],
    ctaKicker: "Presenta meglio in ogni città con",
    ctaTitle: "un flusso unico per", ctaHL: "Roma e Milano",
    ctaPill: "CITTA", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "40a665ff-aaf6-4465-a036-a9dac48ee9ff", // Tutto quello che GetNearMe ti evita di fare a mano
  d: {
    badge: "Feature", badgeColor: "blue",
    coverTitle: "Tutto quello che GetNearMe", coverHL: "ti evita di fare a mano",
    noText: "Ricreare report, copiare dati, adattare contenuti", noSub: "Preparare materiali da zero, cercare info zona, impaginare documenti, coordinare formati.",
    yesText: "Un flusso, meno dispersione, più ordine", yesSub: "Il risultato non è solo risparmiare tempo. È lavorare con più ordine e coerenza.",
    cases: [
      { title: "Report automatici", text: "Dall'annuncio al PDF: dati, zona, comparabili, punti di forza." },
      { title: "Post social pronti", text: "Contenuti coerenti per IG e LinkedIn, senza aprire Canva." },
      { title: "Staging e video", text: "Prima/dopo e video animati dalle foto dell'annuncio, senza altri tool." },
    ],
    ctaKicker: "Risparmia tempo con",
    ctaTitle: "un flusso completo", ctaHL: "dall'annuncio",
    ctaPill: "TEMPO", ctaSub: "Ricevi il link per provare GetNearMe.",
  }},

{ id: "08931c03-33be-4b96-979f-b59f5f196c8a", // Prova a immaginare il tuo prossimo annuncio così
  d: {
    badge: "Per agenti", badgeColor: "amber",
    kicker: "Il senso di GetNearMe",
    hook: "Prova a immaginare il tuo prossimo annuncio", hookHL: "così",
    body: "Non come una scheda isolata.<br><br>Come il punto di partenza di tutto: <strong>report, video, post, analisi zona, home staging, presentazione cliente.</strong><br><br>Questo è il senso di GetNearMe: trasformare ogni annuncio in valore commerciale, senza moltiplicare il lavoro manuale.",
    ctaPill: "DEMO", ctaHint: "Ricevi in DM il link per prenotare una demo gratuita",
  }},

];

// ── RUN ──
async function main() {
  let ok = 0, fail = 0;
  for (const { id, d } of TOPICS) {
    const success = await patch(id, d);
    if (success) ok++; else fail++;
  }
  console.log(`Done: ${ok} updated, ${fail} failed (total: ${TOPICS.length})`);
}
main();

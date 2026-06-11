// Seed 28 ped-tip topics (1/day, Jun 15 – Jul 12)
const SUPA_URL = "https://ecrnpyksnfyykqwnutwa.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjcm5weWtzbmZ5eWtxd251dHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTA4NjEzOSwiZXhwIjoyMDg0NDQ2MTM5fQ.Z2jdXYjoaO4z0knuBiAYc2PaFwiQ25GweaDjty_Tbz0";
const H = { apikey: SUPA_KEY, Authorization: `Bearer ${SUPA_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };

const TIPS = [
  // ── Week 1: Jun 15–21 ──
  { date: "2026-06-15", tipNum: "1", scenario: "Open house",
    title: "Stampa il prima/dopo", titleHL: "per i cartelloni",
    body: `Hai una stanza vuota da mostrare? <strong>Genera il prima/dopo con lo staging AI</strong> e stampalo in A3 da esporre all'open house. Il visitatore vede subito il potenziale.`,
    how: "Apri l'annuncio, vai su AI Foto, scegli lo stile e scarica in alta risoluzione.",
    storyHook: "Open house domani?", storyHookHL: "Prepara i cartelloni.", storySub: "Un tip su come usare lo staging AI.", storyBadge: "TIP" },

  { date: "2026-06-16", tipNum: "2", scenario: "Prima della call",
    title: "Genera il report PDF", titleHL: "in 2 minuti",
    body: `Prima di chiamare il proprietario, <strong>genera un report dall'annuncio.</strong> Arrivi alla call con dati, contesto zona e un materiale da inviare subito dopo.`,
    how: "Apri l'annuncio su Immobiliare/Idealista, clicca Report e personalizza con il tuo logo.",
    storyHook: "Call tra 10 minuti?", storyHookHL: "Preparati.", storySub: "Come generare un report PDF al volo.", storyBadge: "TIP" },

  { date: "2026-06-17", tipNum: "3", scenario: "Post social",
    title: "Da annuncio a post Instagram", titleHL: "in un clic",
    body: `L'annuncio ha già foto, prezzo, zona e metratura. <strong>GetNearMe lo trasforma in un post pronto per Instagram</strong> con template, testi e formato corretto.`,
    how: "Analizza l'annuncio, vai su Social, scegli il template e scarica il post.",
    storyHook: "Pubblicare di più?", storyHookHL: "Senza Canva.", storySub: "Come creare un post partendo dall'annuncio.", storyBadge: "TIP" },

  { date: "2026-06-18", tipNum: "4", scenario: "Appuntamento fisico",
    title: "Mostra l'analisi zona", titleHL: "al cliente",
    body: `Il cliente chiede "com'è il quartiere?". <strong>Apri l'analisi zona e mostra trasporti, scuole, servizi</strong> direttamente dallo smartphone durante l'appuntamento.`,
    how: "Nella scheda dell'immobile, apri Zona e usa la mappa interattiva.",
    storyHook: "Com'è il quartiere?", storyHookHL: "Rispondi con i dati.", storySub: "Come mostrare l'analisi zona durante un appuntamento.", storyBadge: "TIP" },

  { date: "2026-06-19", tipNum: "5", scenario: "Acquisizione",
    title: "Invia il report", titleHL: "prima degli altri",
    body: `Hai visto un nuovo annuncio? <strong>Analizzalo e invia il report al proprietario.</strong> Arrivare per primi con un materiale chiaro fa la differenza in fase di acquisizione.`,
    how: "Analizza l'annuncio, genera il report e invialo via email o WhatsApp.",
    storyHook: "Nuovo annuncio?", storyHookHL: "Arriva per primo.", storySub: "Come usare il report per acquisire prima degli altri.", storyBadge: "TIP" },

  { date: "2026-06-20", tipNum: "6", scenario: "Home staging",
    title: "Prova lo stile nordico", titleHL: "su un bagno",
    body: `Lo staging AI non è solo per soggiorni. <strong>Prova lo stile nordico su un bagno vuoto:</strong> il risultato è pulito, luminoso e aiuta il cliente a immaginarsi nello spazio.`,
    how: "Carica la foto del bagno, seleziona stile Nordic e genera.",
    storyHook: "Staging su un bagno?", storyHookHL: "Funziona.", storySub: "Prova lo stile nordico sugli ambienti più piccoli.", storyBadge: "TIP" },

  { date: "2026-06-21", tipNum: "7", scenario: "Video per i social",
    title: "Crea un video walkthrough", titleHL: "dalle foto",
    body: `Non hai girato un video? <strong>Con il template walkthrough puoi creare un tour virtuale partendo solo dalle foto</strong> dell'annuncio. Pronto per reel e storie.`,
    how: "Vai su AI Video, scegli Walkthrough, seleziona le foto e genera.",
    storyHook: "Niente video dell'immobile?", storyHookHL: "Crealo dalle foto.", storySub: "Come fare un walkthrough senza essere sul posto.", storyBadge: "TIP" },

  // ── Week 2: Jun 22–28 ──
  { date: "2026-06-22", tipNum: "8", scenario: "Proprietario indeciso",
    title: "Mostra il confronto", titleHL: "con la zona",
    body: `Il proprietario pensa che il prezzo sia giusto? <strong>Mostragli il confronto con i valori di zona:</strong> vedere i numeri rende la conversazione più oggettiva.`,
    how: "Apri l'annuncio e leggi il confronto prezzi nella sezione analisi.",
    storyHook: "Il proprietario non si fida?", storyHookHL: "Mostra i dati.", storySub: "Come usare il confronto zona per convincere.", storyBadge: "TIP" },

  { date: "2026-06-23", tipNum: "9", scenario: "Branding",
    title: "Aggiungi il logo", titleHL: "ai tuoi report",
    body: `Report, post e video possono portare <strong>il tuo logo, i tuoi colori e il nome dell'agenzia.</strong> Ogni materiale che invii diventa un pezzo della tua identità.`,
    how: "Vai su Personalizzazione, carica il logo e scegli il colore primario.",
    storyHook: "Il tuo brand ovunque?", storyHookHL: "Personalizza tutto.", storySub: "Come aggiungere il logo ai materiali.", storyBadge: "TIP" },

  { date: "2026-06-24", tipNum: "10", scenario: "Batch editing",
    title: "Staging su 10 foto", titleHL: "in un colpo",
    body: `Hai un immobile con tante stanze vuote? <strong>Carica fino a 30 foto in batch e applica lo stesso stile a tutte.</strong> Risparmi tempo e il risultato è coerente.`,
    how: "Vai su AI Foto, attiva modalità batch, seleziona le foto e lo stile.",
    storyHook: "10 stanze da arredare?", storyHookHL: "Un click.", storySub: "Come usare il batch staging per risparmiare tempo.", storyBadge: "TIP" },

  { date: "2026-06-25", tipNum: "11", scenario: "Negoziazione",
    title: "Condividi i costi stimati", titleHL: "con l'acquirente",
    body: `L'acquirente vuole sapere quanto costa davvero comprare? <strong>GetNearMe stima notaio, tasse e agenzia</strong> in modo trasparente. Condividerli rafforza la fiducia.`,
    how: "Nella scheda immobile, apri Costi Aggiuntivi e condividi il riepilogo.",
    storyHook: "Quanto costa comprare?", storyHookHL: "Mostra tutto.", storySub: "Come usare la stima costi per la trasparenza.", storyBadge: "TIP" },

  { date: "2026-06-26", tipNum: "12", scenario: "Presentazione",
    title: "Personalizza l'ultima pagina", titleHL: "del report",
    body: `Il report ha una pagina finale personalizzabile. <strong>Aggiungi un messaggio per il proprietario,</strong> un titolo dedicato e il tuo contatto. Chiude il report con il tuo tocco.`,
    how: "In Personalizzazione, compila Titolo e Messaggio della pagina finale.",
    storyHook: "Un report impersonale?", storyHookHL: "Chiudilo con il tuo messaggio.", storySub: "Come personalizzare l'ultima pagina del report.", storyBadge: "TIP" },

  { date: "2026-06-27", tipNum: "13", scenario: "Cambio luce",
    title: "Trasforma il giorno", titleHL: "in notte",
    body: `Hai solo foto diurne di un terrazzo o giardino? <strong>Lo staging day/night ricrea l'atmosfera serale</strong> con luci calde e ambientazione notturna. L'effetto è immediato.`,
    how: "Carica la foto diurna, seleziona Day/Night e genera.",
    storyHook: "Solo foto di giorno?", storyHookHL: "Trasformale.", storySub: "Come creare un effetto sera con lo staging AI.", storyBadge: "TIP" },

  { date: "2026-06-28", tipNum: "14", scenario: "Team",
    title: "Invita un collaboratore", titleHL: "nel team",
    body: `Se lavori in agenzia, <strong>ogni collaboratore può usare GetNearMe con il proprio account</strong> sotto lo stesso team. Stessi template, stessi colori, stesso brand.`,
    how: "Vai su Team, aggiungi l'email del collaboratore e invia l'invito.",
    storyHook: "Lavori con un team?", storyHookHL: "Invitali.", storySub: "Come aggiungere collaboratori al team.", storyBadge: "TIP" },

  // ── Week 3: Jun 29 – Jul 5 ──
  { date: "2026-06-29", tipNum: "15", scenario: "Contenuto social",
    title: "Un video con avatar", titleHL: "per presentarti",
    body: `Non vuoi metterci la faccia? <strong>Scegli un avatar AI e registra un video con la tua voce</strong> o un testo scritto. Il video esce professionale e lo pubblichi sui social.`,
    how: "Vai su AI Video, scegli Classic, seleziona un avatar e scrivi il testo.",
    storyHook: "Un video senza metterci la faccia?", storyHookHL: "Si può.", storySub: "Come creare un video con avatar AI.", storyBadge: "TIP" },

  { date: "2026-06-30", tipNum: "16", scenario: "Confronto immobili",
    title: "Compara due annunci", titleHL: "fianco a fianco",
    body: `Il cliente valuta due appartamenti? <strong>Analizza entrambi e mostra il confronto:</strong> metratura, prezzo al metro, servizi zona. Il cliente decide con più chiarezza.`,
    how: "Analizza entrambi gli annunci e apri la sezione Confronto.",
    storyHook: "Due immobili a confronto?", storyHookHL: "Mostra la differenza.", storySub: "Come usare il confronto per aiutare il cliente.", storyBadge: "TIP" },

  { date: "2026-07-01", tipNum: "17", scenario: "Annuncio vecchio",
    title: "Rinnova le foto", titleHL: "con lo staging",
    body: `L'annuncio è online da mesi e le visite calano? <strong>Rigenera le foto con lo staging AI:</strong> nuovo stile, nuova percezione. L'annuncio torna fresco senza nuove riprese.`,
    how: "Apri l'annuncio, vai su AI Foto, scegli uno stile diverso e sostituisci.",
    storyHook: "Annuncio fermo da mesi?", storyHookHL: "Rinnovalo.", storySub: "Come rinfrescare un annuncio con lo staging.", storyBadge: "TIP" },

  { date: "2026-07-02", tipNum: "18", scenario: "WhatsApp al cliente",
    title: "Invia il report", titleHL: "via WhatsApp",
    body: `Il report PDF si scarica e si condivide in un tap. <strong>Dopo l'appuntamento, invialo su WhatsApp:</strong> il cliente lo apre subito e ha tutto sotto mano.`,
    how: "Genera il report, scarica il PDF e condividilo dalla galleria.",
    storyHook: "Il cliente aspetta info?", storyHookHL: "Invia il report.", storySub: "Come condividere il report dopo un appuntamento.", storyBadge: "TIP" },

  { date: "2026-07-03", tipNum: "19", scenario: "Vuoto vs arredato",
    title: "Svuota una stanza", titleHL: "per mostrare lo spazio",
    body: `A volte l'arredamento del proprietario non aiuta. <strong>Lo stile Empty Room rimuove i mobili</strong> e mostra lo spazio architettonico pulito. Utile per immobili datati.`,
    how: "Carica la foto, seleziona Empty Room e genera.",
    storyHook: "L'arredamento distrae?", storyHookHL: "Rimuovilo.", storySub: "Come mostrare lo spazio pulito con Empty Room.", storyBadge: "TIP" },

  { date: "2026-07-04", tipNum: "20", scenario: "Lingua del cliente",
    title: "Cambia lingua", titleHL: "per clienti stranieri",
    body: `Lavori con acquirenti stranieri? <strong>GetNearMe supporta 6 lingue.</strong> Puoi generare report e materiali in inglese, spagnolo, francese, russo o ucraino.`,
    how: "Vai su Impostazioni, cambia lingua e genera i materiali.",
    storyHook: "Cliente straniero?", storyHookHL: "Cambia lingua.", storySub: "Come generare materiali in altre lingue.", storyBadge: "TIP" },

  { date: "2026-07-05", tipNum: "21", scenario: "Video montaggio",
    title: "Carica i tuoi video", titleHL: "e monta in automatico",
    body: `Hai clip girati durante una visita? <strong>Caricali e GetNearMe li monta in automatico</strong> con transizioni, musica e cover slide. Pronto per reel e storie.`,
    how: "Vai su AI Video, scegli Montaggio, carica le clip e genera.",
    storyHook: "Clip sparsi nel telefono?", storyHookHL: "Montali.", storySub: "Come creare un montaggio automatico dai tuoi video.", storyBadge: "TIP" },

  // ── Week 4: Jul 6–12 ──
  { date: "2026-07-06", tipNum: "22", scenario: "Evento in zona",
    title: "Scopri eventi vicini", titleHL: "all'immobile",
    body: `Per Airbnb e affitti brevi, <strong>gli eventi vicini sono un argomento di vendita.</strong> GetNearMe mostra concerti, mostre e attività nella zona dell'immobile.`,
    how: "Nella sezione zona, apri la tab Eventi per vedere cosa succede vicino.",
    storyHook: "Affitti brevi?", storyHookHL: "Mostra gli eventi.", storySub: "Come usare gli eventi per valorizzare un immobile.", storyBadge: "TIP" },

  { date: "2026-07-07", tipNum: "23", scenario: "Bonus giornaliero",
    title: "Apri GetNearMe ogni giorno", titleHL: "per i crediti bonus",
    body: `Ogni giorno che apri GetNearMe accumuli crediti bonus con lo streak. <strong>7 giorni consecutivi e hai un bonus extra.</strong> Costa zero, vale crediti.`,
    how: "Apri l'estensione, clicca il check-in giornaliero e mantieni la serie.",
    storyHook: "Crediti in regalo?", storyHookHL: "Ogni giorno.", storySub: "Come funziona il bonus giornaliero.", storyBadge: "TIP" },

  { date: "2026-07-08", tipNum: "24", scenario: "Sottotitoli video",
    title: "Aggiungi i sottotitoli", titleHL: "al tuo voiceover",
    body: `Hai registrato un audio per un video immobiliare? <strong>Il template Sottotitoli trascrive automaticamente</strong> e aggiunge i sottotitoli al video. Accessibile e professionale.`,
    how: "Vai su AI Video, scegli Sottotitoli, carica l'audio e genera.",
    storyHook: "Video senza sottotitoli?", storyHookHL: "Aggiungili.", storySub: "Come aggiungere sottotitoli automatici ai video.", storyBadge: "TIP" },

  { date: "2026-07-09", tipNum: "25", scenario: "Idealist e Casa.it",
    title: "Funziona anche", titleHL: "su Idealista e Casa.it",
    body: `GetNearMe non è solo per Immobiliare.it. <strong>Funziona anche su Idealista e Casa.it:</strong> stessa analisi, stesso report, stessi materiali. Un'estensione per tutti i portali.`,
    how: "Apri un annuncio su Idealista o Casa.it e clicca l'icona GetNearMe.",
    storyHook: "Solo Immobiliare.it?", storyHookHL: "No, anche altri.", storySub: "Su quali portali funziona GetNearMe.", storyBadge: "TIP" },

  { date: "2026-07-10", tipNum: "26", scenario: "Ristrutturazione",
    title: "Mostra il prima/dopo", titleHL: "di un cantiere",
    body: `Hai un immobile in ristrutturazione? <strong>Il template Construction mostra le fasi del cantiere</strong> in un video: struttura, lavori e risultato finale. Ideale per aggiornare il proprietario.`,
    how: "Vai su AI Video, scegli Construction e carica le foto delle fasi.",
    storyHook: "Cantiere in corso?", storyHookHL: "Documenta le fasi.", storySub: "Come creare un video delle fasi di ristrutturazione.", storyBadge: "TIP" },

  { date: "2026-07-11", tipNum: "27", scenario: "Referral",
    title: "Presenta GetNearMe", titleHL: "a un collega",
    body: `Conosci un agente che potrebbe usarlo? <strong>Invitalo con il tuo link referral e ricevi 150 crediti.</strong> Tu guadagni crediti, il collega scopre uno strumento utile.`,
    how: "Vai su Invita, copia il tuo link e invialo al collega.",
    storyHook: "Conosci altri agenti?", storyHookHL: "Invitali.", storySub: "Come guadagnare crediti invitando colleghi.", storyBadge: "TIP" },

  { date: "2026-07-12", tipNum: "28", scenario: "Riepilogo",
    title: "Un annuncio diventa", titleHL: "tutto il resto",
    body: `Report, post social, video, staging, analisi zona: <strong>tutto parte da un solo annuncio.</strong> Questo è il senso di GetNearMe: meno lavoro manuale, più materiali pronti.`,
    how: "Apri un qualsiasi annuncio e scopri tutto quello che puoi generare.",
    storyHook: "Un annuncio.", storyHookHL: "Tutto il resto.", storySub: "Riepilogo di quello che puoi fare con GetNearMe.", storyBadge: "TIP" },
];

let ok = 0;
for (const t of TIPS) {
  const slide_data = {
    tipNum: t.tipNum,
    scenario: t.scenario,
    title: t.title,
    titleHL: t.titleHL,
    body: t.body,
    how: t.how,
    storyHook: t.storyHook,
    storyHookHL: t.storyHookHL,
    storySub: t.storySub,
    storyBadge: t.storyBadge,
  };

  const row = {
    title: `Tip #${t.tipNum}: ${t.title} ${t.titleHL}`,
    plan_date: t.date,
    rubric: "tip",
    category: "Tip GetNearMe",
    template: "ped-tip",
    status: "proposed",
    slide_data,
  };

  const r = await fetch(`${SUPA_URL}/rest/v1/content_topics`, {
    method: "POST", headers: H, body: JSON.stringify(row),
  });
  if (r.ok) {
    ok++;
  } else {
    const err = await r.text();
    console.error(`FAIL tip #${t.tipNum}: ${r.status} ${err}`);
  }
}
console.log(`Created ${ok}/${TIPS.length} tips`);

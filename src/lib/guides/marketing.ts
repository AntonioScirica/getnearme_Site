import type { Guide } from './types';

// Guide di marketing per l'agente: video marketing, idee per Instagram, planimetria nell'annuncio, presentazione di acquisizione.
// Solo fatti verificabili; costi di terzi solo come stime indicate nel brief (videomaker ~250 €, home staging fisico ~1.500 €, sito ~1.500 €).

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const videoMarketing: Guide = {
  slug: 'video-marketing-immobiliare',
  label: 'Video marketing immobiliare',
  title: `Video marketing immobiliare: guida per agenti e agenzie`,
  description: `Video marketing immobiliare: quali video fare per agenzia e immobili, formati per ogni piattaforma, costi di videomaker, fai da te e AI, come misurarli.`,
  h1: `Video marketing immobiliare: quali video fare, dove pubblicarli, quanto costano e come misurarli`,
  intro: `Il video marketing immobiliare è l'uso dei video per due scopi: vendere gli immobili che hai in incarico e far conoscere te nella tua zona, così i proprietari ti chiamano quando decidono di vendere. Non serve un video perfetto per ogni casa: serve un piano con pochi formati ripetibili, adattati a ogni canale e misurati sui contatti che portano.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'cos-e',
      title: `Cos'è il video marketing immobiliare e a cosa serve`,
      html: `<p>Pubblicare un video ogni tanto non è video marketing. Lo diventa quando ogni video ha un <strong>obiettivo</strong>, un <strong>canale</strong> e un <strong>modo per misurarlo</strong>. Per un <a href="/it/agente-immobiliare">agente immobiliare</a> gli obiettivi sono quasi sempre tre:</p>
<ol>
  <li><strong>Vendere o affittare un immobile</strong>: far arrivare richieste qualificate sull'incarico, con meno visite inutili perché chi chiama ha già capito com'è la casa.</li>
  <li><strong>Acquisire incarichi</strong>: far vedere ai proprietari della zona come presenti le case. Un proprietario che ha visto i tuoi video arriva all'appuntamento con un'idea precisa di cosa farai per lui.</li>
  <li><strong>Costruire il tuo nome</strong>: diventare l'agente che la gente della zona riconosce, perché ti vede spesso e parla di posti che conosce.</li>
</ol>
<p>Questa guida ha un taglio strategico: quali video servono alla tua agenzia, dove metterli e quanto ti costano. Se cerchi consigli pratici solo per Instagram e TikTok, leggi anche la guida ai <a href="/it/video-immobiliari-social">video immobiliari per i social</a> e quella con le idee per i <a href="/it/reel-immobiliari-instagram-tiktok">reel immobiliari</a>.</p>`,
    },
    {
      id: 'video-agenzia-immobiliare',
      title: `Video per agenzia immobiliare: i 5 tipi che servono davvero`,
      html: `<p>Non servono decine di formati. Con cinque tipi di video copri tutti e tre gli obiettivi, e ognuno si può ripetere su ogni nuovo incarico.</p>
<h3>1. Il tour dell'immobile</h3>
<p>È il video classico: si entra in casa e si attraversano le stanze nell'ordine in cui le vedrebbe un visitatore. Serve soprattutto all'acquirente, quindi va messo dove l'acquirente cerca: annuncio sul portale, pagina dell'immobile sul tuo sito, messaggio WhatsApp ai contatti interessati. Regole pratiche: movimenti lenti, luce naturale, niente zoom, una stanza alla volta, durata breve per i social e più completa per il sito.</p>
<h3>2. Prima e dopo</h3>
<p>La stanza vuota o datata che si trasforma in una stanza arredata. È il formato che si capisce più in fretta, per questo funziona sia per vendere (l'acquirente immagina come usare lo spazio) sia per acquisire (il proprietario vede cosa faresti con la sua casa). L'arredo virtuale va dichiarato: trovi le regole nella guida al <a href="/it/virtual-staging-legale">virtual staging legale</a>.</p>
<h3>3. Giorno e notte</h3>
<p>La stessa stanza o la stessa facciata vista di giorno e poi con le luci accese la sera. Funziona per attici, terrazzi, case con vista, giardini: tutto ciò che ha un'atmosfera diversa al tramonto. È un video breve, che ferma chi scorre.</p>
<h3>4. Il video di zona</h3>
<p>Il quartiere raccontato da te: la piazza, la scuola, il mercato, i collegamenti, i posti dove si mangia bene. Non vende una casa in particolare, vende la zona e posiziona te come chi la conosce meglio. È il formato più utile per l'acquisizione, perché parla ai proprietari che vivono lì.</p>
<h3>5. L'agente in camera</h3>
<p>Tu che parli, anche solo per pochi secondi: presenti un nuovo incarico, spieghi un concetto (quanto costa vendere casa, cosa serve per il rogito), commenti il mercato della zona. È il video che fa fidare di più, perché il proprietario vede la persona con cui lavorerà. Non devi diventare un attore: frasi brevi, un tema per video, un luogo riconoscibile alle spalle.</p>`,
    },
    {
      id: 'piano-editoriale',
      title: `Video immobiliari: come organizzare un piano senza perdere tempo`,
      html: `<p>Il problema non è avere idee, è produrre con costanza. Il modo più semplice è legare i video agli eventi che hai già in agenda:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Momento</th><th ${TH}>Video</th><th ${TH}>Dove</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Nuovo incarico</td><td ${TD}>Prima e dopo della stanza principale, tour breve</td><td ${TD}>Social, sito, portale, WhatsApp ai clienti in cerca</td></tr>
    <tr><td ${TD}>Prima settimana online</td><td ${TD}>Agente in camera che presenta la casa, giorno e notte se l'immobile lo permette</td><td ${TD}>Social, storie</td></tr>
    <tr><td ${TD}>Venduto o affittato</td><td ${TD}>Breve video con il cartello o la consegna delle chiavi, senza dati personali</td><td ${TD}>Social, sito</td></tr>
    <tr><td ${TD}>Ogni mese</td><td ${TD}>Video di zona o di mercato</td><td ${TD}>Social, sito, newsletter se ne hai una</td></tr>
    <tr><td ${TD}>Prima di un appuntamento di acquisizione</td><td ${TD}>Prima e dopo di una stanza della casa del proprietario</td><td ${TD}>Solo al proprietario</td></tr>
  </tbody>
</table>
<p>Con questo schema non devi inventare niente: ogni incarico porta con sé almeno due o tre video. Se ne pubblichi uno a settimana con regolarità, ottieni più di quanto ottiene chi fa un video bellissimo ogni tanto e poi si ferma.</p>`,
    },
    {
      id: 'formati-piattaforma',
      title: `Formati video per piattaforma: Instagram, TikTok, YouTube, portali e sito`,
      html: `<p>Lo stesso materiale va adattato al canale. Le piattaforme aggiornano spesso durate massime e specifiche, quindi controlla le indicazioni ufficiali prima di produrre in serie. Queste sono le regole pratiche:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Canale</th><th ${TH}>Formato</th><th ${TH}>Cosa funziona</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Instagram (reel e storie)</strong></td><td ${TD}>Verticale 9:16</td><td ${TD}>Video brevi, gancio nel primo secondo, testo a schermo leggibile senza audio</td></tr>
    <tr><td ${TD}><strong>TikTok</strong></td><td ${TD}>Verticale 9:16</td><td ${TD}>Tono diretto, agente in camera, video di zona e prima e dopo</td></tr>
    <tr><td ${TD}><strong>Facebook</strong></td><td ${TD}>Verticale per i reel, anche quadrato o orizzontale nel feed</td><td ${TD}>Tour e video di zona, utili per un pubblico locale e più adulto</td></tr>
    <tr><td ${TD}><strong>YouTube</strong></td><td ${TD}>Orizzontale 16:9 per i video lunghi, verticale per gli Shorts</td><td ${TD}>Tour completi, video di zona più lunghi, spiegazioni per chi compra o vende</td></tr>
    <tr><td ${TD}><strong>Portali immobiliari</strong></td><td ${TD}>Secondo le regole del portale (file o link)</td><td ${TD}>Tour dell'immobile, chiaro e fedele</td></tr>
    <tr><td ${TD}><strong>Sito dell'agenzia</strong></td><td ${TD}>Orizzontale o verticale nella pagina dell'immobile</td><td ${TD}>Tour e prima e dopo vicino alle foto e ai dati</td></tr>
    <tr><td ${TD}><strong>WhatsApp</strong></td><td ${TD}>Verticale, file leggero</td><td ${TD}>Video breve mandato a chi ha chiesto quel tipo di casa</td></tr>
  </tbody>
</table>
<p>Tre regole valgono ovunque: <strong>sottotitoli o testo a schermo</strong>, perché molti guardano senza audio; <strong>logo piccolo in un angolo</strong>, non un'introduzione con il marchio; <strong>un solo invito finale</strong> (scrivimi, guarda l'annuncio, chiedi una valutazione). Se il video presenta un immobile in vendita con i suoi dati, ricorda classe energetica e indice di prestazione nella didascalia: vedi <a href="/it/ape-annunci-immobiliari">APE negli annunci</a>.</p>`,
    },
    {
      id: 'quanto-costa',
      title: `Quanto costa un video immobiliare: videomaker, fai da te o AI`,
      html: `<p>Le strade sono tre, e non si escludono. Il costo vero non è solo il prezzo, è il <strong>tempo</strong> che serve per avere un video su ogni incarico.</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Videomaker</th><th ${TH}>Fai da te con lo smartphone</th><th ${TH}>Video con AI dalle foto</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Costo</strong></td><td ${TD}>Preventivo a lavoro; come ordine di grandezza, stimiamo circa 250 € a video, ma varia per città, durata e riprese</td><td ${TD}>Nessuna spesa diretta, eventuali accessori (stabilizzatore, microfono) e app di montaggio</td><td ${TD}>Abbonamento mensile allo strumento</td></tr>
    <tr><td ${TD}><strong>Tempo tuo</strong></td><td ${TD}>Basso, ma serve organizzare il sopralluogo con il videomaker</td><td ${TD}>Alto: riprese, montaggio, musica, sottotitoli</td><td ${TD}>Basso: scegli le foto e il tipo di video</td></tr>
    <tr><td ${TD}><strong>Qualità</strong></td><td ${TD}>Alta, riprese professionali</td><td ${TD}>Dipende da te e dalla pratica</td><td ${TD}>Costante, legata alla qualità delle foto</td></tr>
    <tr><td ${TD}><strong>Adatto a</strong></td><td ${TD}>Immobili di pregio, video di presentazione dell'agenzia</td><td ${TD}>Agente in camera, video di zona, storie</td><td ${TD}>Ogni incarico, prima e dopo, giorno e notte, pubblicazione frequente</td></tr>
  </tbody>
</table>
<p>Una combinazione realistica per molte agenzie: videomaker solo per gli immobili dove il valore lo giustifica, smartphone per i video in cui parli tu e per la zona, AI per avere un video su ogni incarico senza montaggio. Con <a href="/it">Agente Immo</a>, per esempio, parti dalle foto dell'immobile e scegli un modello (Prima e dopo, Giorno e notte, Camminata, Con te in video): il video esce con la musica inclusa, pronto da pubblicare, e il piano Starter parte da 19 € al mese.</p>
<p>Per le riprese fai da te, le stesse regole delle foto valgono anche per i video: luce, ordine, linee dritte. Le trovi nella guida alle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a>.</p>`,
    },
    {
      id: 'come-misurare',
      title: `Come misurare i risultati del video marketing immobiliare`,
      html: `<p>Le visualizzazioni fanno piacere ma non pagano la provvigione. Guarda i numeri in quest'ordine, dal più vicino al più lontano dal risultato:</p>
<ol>
  <li><strong>Contatti generati</strong>: messaggi, telefonate, richieste di visita o di valutazione arrivate dopo un video. Chiedi sempre "come ci ha conosciuto?" e annotalo nel tuo <a href="/it/crm-immobiliare">CRM immobiliare</a>.</li>
  <li><strong>Clic e visite al profilo</strong>: quante persone dal video sono andate al tuo profilo, al sito o all'annuncio.</li>
  <li><strong>Salvataggi e condivisioni</strong>: dicono che il video è utile o interessante abbastanza da tenerlo o mandarlo a qualcuno.</li>
  <li><strong>Tempo di visione</strong>: se quasi tutti abbandonano nei primi secondi, il problema è l'inizio, non il resto del video.</li>
  <li><strong>Visualizzazioni</strong>: utili per capire la portata, soprattutto nella tua zona.</li>
</ol>
<p>Due accorgimenti pratici:</p>
<ul>
  <li><strong>Un link per canale</strong>: se mandi le persone al sito, usa link diversi per Instagram, TikTok e WhatsApp, così sai da dove arrivano. Con un <a href="/it/sito-web-agente-immobiliare">sito da agente</a> le richieste arrivano direttamente a te e le puoi contare.</li>
  <li><strong>Confronta incarichi simili</strong>: annunci con video e senza video, nella stessa zona e fascia di prezzo. Dopo qualche mese hai dati tuoi, più utili di qualsiasi statistica generale.</li>
</ul>
<p>Infine, misura l'effetto sull'acquisizione: quanti proprietari all'appuntamento dicono di averti visto nei video. È spesso il ritorno più grande, e quello che sfugge se guardi solo le metriche delle piattaforme.</p>`,
    },
    {
      id: 'errori',
      title: `Errori da evitare nei video per agenzia immobiliare`,
      html: `<ul>
  <li><strong>Introduzioni lunghe con il logo</strong>: chi scorre se ne va prima di vedere la casa.</li>
  <li><strong>Video che mostrano una casa diversa da quella reale</strong>: grandangoli estremi, arredi virtuali non dichiarati, difetti nascosti. La visita delude e la fiducia è persa.</li>
  <li><strong>Persone riconoscibili e dati personali</strong>: proprietari, inquilini, targhe, documenti sul tavolo, foto di famiglia. Chiedi il consenso e controlla ogni inquadratura.</li>
  <li><strong>Musica senza diritti</strong>: usa le librerie musicali delle piattaforme o strumenti con musica inclusa, non brani presi a caso.</li>
  <li><strong>Pubblicare a raffica e poi sparire</strong>: la costanza conta più dell'intensità.</li>
  <li><strong>Non chiedere niente alla fine</strong>: ogni video deve dire a chi guarda cosa fare dopo.</li>
  <li><strong>Non avvisare il proprietario</strong>: deve sapere come viene presentata la sua casa e approvarlo. È anche un buon momento per mostrargli il lavoro che stai facendo.</li>
</ul>`,
    },
  ],
  faq: [
    [`Cos'è il video marketing immobiliare?`, `È l'uso pianificato dei video per vendere gli immobili in incarico e far conoscere l'agente nella sua zona. Ogni video ha un obiettivo, un canale e un modo per misurarne i risultati, di solito i contatti generati.`],
    [`Che video deve fare un'agenzia immobiliare?`, `Cinque tipi coprono quasi tutto: tour dell'immobile, prima e dopo, giorno e notte, video di zona e video con l'agente in camera. Ognuno si ripete su ogni nuovo incarico o ogni mese.`],
    [`Quanto costa un video immobiliare?`, `Dipende dalla strada scelta. Un videomaker lavora a preventivo, con una stima indicativa intorno ai 250 € a video. Il fai da te non ha costi diretti ma richiede tempo. Gli strumenti con AI funzionano in abbonamento: su Agente Immo il piano Starter parte da 19 € al mese.`],
    [`Che formato usare per i video immobiliari?`, `Verticale 9:16 per reel, TikTok, storie e WhatsApp; orizzontale 16:9 per YouTube e spesso per il sito. Per i portali segui le regole del singolo portale.`],
    [`Come capire se i video portano risultati?`, `Conta i contatti arrivati dopo un video, i clic verso sito e annunci, salvataggi e condivisioni. Chiedi sempre a chi ti contatta come ti ha conosciuto e confronta incarichi simili con e senza video.`],
    [`Che differenza c'è con i video per i social?`, `I video per i social sono una parte del video marketing immobiliare. Qui si parla anche di portali, sito, WhatsApp, acquisizione e costi; per i consigli specifici su Instagram e TikTok c'è la guida dedicata ai video immobiliari per i social.`],
  ],
};

export const cosaPubblicareInstagram: Guide = {
  slug: 'cosa-pubblicare-instagram-agente-immobiliare',
  label: 'Cosa pubblicare su Instagram',
  title: `Cosa pubblicare su Instagram: 30 idee per agenti immobiliari`,
  description: `Cosa pubblicare su Instagram da agente immobiliare: 30 idee di post divise per tipo, frequenza, bio, storie e caption pronte da copiare e adattare.`,
  h1: `Cosa pubblicare su Instagram da agente immobiliare: 30 idee di post, bio, storie e caption`,
  intro: `Su Instagram un agente immobiliare dovrebbe pubblicare quattro tipi di contenuti: gli immobili che segue, la zona in cui lavora, consigli utili a chi compra o vende e un po' di sé e del proprio lavoro. Qui trovi 30 idee di post divise per tipo, una frequenza sostenibile, come scrivere la bio, cosa mettere nelle storie e caption pronte da adattare.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'obiettivo',
      title: `Instagram per agenti immobiliari: a cosa serve davvero`,
      html: `<p>Su Instagram quasi nessuno sta cercando casa in quel momento. Le persone scorrono. Per questo il profilo di un agente non serve tanto a vendere il singolo immobile quanto a farti <strong>riconoscere</strong> da chi vive nella tua zona: il giorno in cui decideranno di vendere, chiameranno l'agente che hanno visto più spesso e che sembra conoscere meglio il quartiere.</p>
<p>Ne derivano tre regole:</p>
<ul>
  <li><strong>Parla della tua zona</strong>, non dell'immobiliare in generale. Un post su "come vendere casa" lo pubblicano tutti; un post su "quanto si impiega a vendere un trilocale nel nostro quartiere secondo la mia esperienza" lo puoi pubblicare solo tu.</li>
  <li><strong>Mostra il lavoro</strong>, non lo slogan. Foto prima e dopo, case presentate bene, venduti, consigli concreti.</li>
  <li><strong>Fatti vedere</strong>. Il proprietario affida la casa a una persona, non a un logo.</li>
</ul>
<p>Le idee che seguono sono divise in cinque categorie. Mescolale: un profilo con solo annunci sembra una vetrina, uno con solo consigli sembra un blog.</p>
<p>In sintesi, Instagram serve a un <a href="/it/agente-immobiliare">agente immobiliare</a> per farsi riconoscere nella sua zona prima ancora di presentarsi.</p>`,
    },
    {
      id: 'idee-immobili',
      title: `Idee post agente immobiliare: gli immobili (1-8)`,
      html: `<ol>
  <li><strong>Nuovo incarico</strong>: carosello con le 6-8 foto migliori, prima la più forte. Dati essenziali in caption.</li>
  <li><strong>Prima e dopo</strong>: la stanza vuota e la stessa stanza arredata con l'home staging virtuale, dichiarato come tale.</li>
  <li><strong>Giorno e notte</strong>: il terrazzo o il soggiorno di giorno e con le luci accese la sera.</li>
  <li><strong>Il dettaglio</strong>: una sola cosa che rende speciale la casa, la vista dalla cucina, il soffitto in legno, il giardino.</li>
  <li><strong>"Cosa compri con..."</strong>: cosa trovi in zona con una certa cifra, mostrando immobili che segui tu.</li>
  <li><strong>Tour in un minuto</strong>: reel che attraversa la casa nell'ordine di una visita.</li>
  <li><strong>Venduto</strong>: foto della casa con il cartello, senza dati personali di venditori e acquirenti, con il loro consenso se compaiono.</li>
  <li><strong>Affittato in pochi giorni</strong>: racconta come hai presentato la casa, senza promettere tempi agli altri proprietari.</li>
</ol>
<p>Per le foto e la copertina, vedi la guida su come <a href="/it/migliorare-foto-annuncio-immobiliare">migliorare le foto di un annuncio</a>. Quando arredi una stanza in foto, segui le regole del <a href="/it/virtual-staging-legale">virtual staging legale</a>.</p>`,
    },
    {
      id: 'idee-zona',
      title: `Idee post sulla zona: diventa l'agente del quartiere (9-15)`,
      html: `<ol start="9">
  <li><strong>Il quartiere in 5 posti</strong>: bar, mercato, parco, scuola, fermata. Un carosello o un reel.</li>
  <li><strong>Vivere in via...</strong>: una via o una piazza raccontata da chi ci lavora ogni giorno.</li>
  <li><strong>I servizi a piedi</strong>: cosa raggiungi in pochi minuti da una casa tipo della zona.</li>
  <li><strong>Novità in zona</strong>: un negozio che apre, un cantiere, una nuova linea di trasporto, raccontati in modo neutro.</li>
  <li><strong>Prima e dopo del quartiere</strong>: un palazzo ristrutturato, una piazza rifatta, con foto tue.</li>
  <li><strong>Le attività locali</strong>: un'intervista breve al panettiere o al libraio. Fa conoscere te e loro, e spesso la condividono.</li>
  <li><strong>Il mercato della zona</strong>: cosa vedi nelle trattative (tipologie più richieste, cosa cercano gli acquirenti), basandoti sulla tua esperienza, senza numeri inventati.</li>
</ol>`,
    },
    {
      id: 'idee-consigli',
      title: `Idee post con consigli per chi vende e chi compra (16-23)`,
      html: `<ol start="16">
  <li><strong>I documenti per vendere casa</strong>: planimetria, visura, atto di provenienza, APE. Carosello da salvare.</li>
  <li><strong>Come preparare la casa per le foto</strong>: cinque cose da fare la sera prima.</li>
  <li><strong>Quanto vale la mia casa?</strong>: spiega come si fa una valutazione seria con i comparabili e invita a chiederla. Spunti nella guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione immobile</a>.</li>
  <li><strong>Gli errori di chi vende da privato</strong>, detti con rispetto e senza giudicare.</li>
  <li><strong>Prezzo richiesto e prezzo di vendita</strong>: perché non sono la stessa cosa.</li>
  <li><strong>Cosa guardare in una visita</strong>: checklist per chi compra.</li>
  <li><strong>Le domande da fare all'amministratore</strong>: spese, lavori deliberati, regolamento.</li>
  <li><strong>Glossario in un post</strong>: proposta d'acquisto, compromesso, rogito, caparra, spiegati in modo semplice.</li>
</ol>
<p>Per i temi legali e fiscali resta generico e rimanda al notaio o al professionista: il tuo ruolo è orientare, non dare pareri.</p>`,
    },
    {
      id: 'idee-agente',
      title: `Idee post sull'agente e sul lavoro dietro le quinte (24-30)`,
      html: `<ol start="24">
  <li><strong>Chi sono</strong>: chi sei, da quanto lavori in zona, perché fai questo lavoro. Da fissare in alto sul profilo.</li>
  <li><strong>Una giornata tipo</strong>: sopralluoghi, valutazioni, visite, telefonate.</li>
  <li><strong>Come preparo un incarico</strong>: dalle foto al video al sito, in un reel.</li>
  <li><strong>Recensione di un cliente</strong>: con il suo consenso, meglio se in video o con la sua frase.</li>
  <li><strong>Risposta a una domanda frequente</strong>: "Ma la provvigione quanto è?", con la guida alla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a> come base.</li>
  <li><strong>Il team</strong>: le persone dell'agenzia, ognuna con il suo ruolo.</li>
  <li><strong>Un errore che ho imparato a evitare</strong>: racconto breve e sincero. Crea fiducia più di dieci post perfetti.</li>
</ol>`,
    },
    {
      id: 'frequenza',
      title: `Ogni quanto pubblicare su Instagram da agente immobiliare`,
      html: `<p>Non esiste un numero giusto per tutti. Esiste il numero che riesci a mantenere per mesi. Uno schema sostenibile per un agente che lavora da solo:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Formato</th><th ${TH}>Frequenza indicativa</th><th ${TH}>Contenuto</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Reel</strong></td><td ${TD}>1-2 a settimana</td><td ${TD}>Prima e dopo, giorno e notte, tour, zona, agente in camera</td></tr>
    <tr><td ${TD}><strong>Carosello</strong></td><td ${TD}>1 a settimana</td><td ${TD}>Nuovi incarichi, consigli, documenti, quartiere</td></tr>
    <tr><td ${TD}><strong>Storie</strong></td><td ${TD}>Quasi ogni giorno lavorativo</td><td ${TD}>Dietro le quinte, sondaggi, domande, rimandi ai post</td></tr>
  </tbody>
</table>
<p>Se non hai tempo, riduci la quantità ma non sparire: meglio un reel a settimana per un anno che tre al giorno per un mese. Prepara i contenuti in un momento fisso della settimana e tieni un elenco di idee nel telefono. Per durata, musica e struttura dei video, la guida ai <a href="/it/reel-immobiliari-instagram-tiktok">reel immobiliari per Instagram e TikTok</a> ha 14 idee con gancio e struttura.</p>`,
    },
    {
      id: 'bio',
      title: `Bio Instagram per agente immobiliare: come scriverla`,
      html: `<p>La bio è breve (Instagram concede circa 150 caratteri) e deve dire in pochi secondi chi sei, dove lavori e cosa deve fare chi è interessato. Schema:</p>
<ol>
  <li><strong>Ruolo e zona</strong>: "Agente immobiliare a [quartiere/città]".</li>
  <li><strong>Cosa fai per chi legge</strong>: "Vendo e affitto case in [zona]" oppure "Ti aiuto a vendere casa al giusto prezzo".</li>
  <li><strong>Invito</strong>: "Valutazione gratuita: scrivimi".</li>
  <li><strong>Link</strong>: al tuo sito o alla pagina con gli immobili, non a un elenco di dieci link.</li>
</ol>
<p>Esempi da adattare:</p>
<ul>
  <li><em>Agente immobiliare a Monza centro. Vendo e affitto case nel quartiere dove vivo. Valutazione gratuita: scrivimi in DM.</em></li>
  <li><em>[Nome], [Agenzia]. Case in vendita tra [via X] e [via Y]. Ogni settimana un immobile e un consiglio. Link per gli immobili qui sotto.</em></li>
</ul>
<p>Usa il nome profilo (il campo che compare in grassetto) per inserire ruolo e città, per esempio "Mario Rossi, agente immobiliare Bergamo": aiuta chi ti cerca. Se hai un <a href="/it/sito-web-agente-immobiliare">sito da agente</a>, il link in bio porta le richieste direttamente a te.</p>`,
    },
    {
      id: 'storie',
      title: `Storie Instagram per agenti immobiliari: cosa pubblicare`,
      html: `<p>Le storie restano visibili per 24 ore e le vedono soprattutto le persone che già ti seguono. Sono il posto giusto per contenuti veloci e per parlare con il pubblico:</p>
<ul>
  <li><strong>Sondaggi</strong>: "Cucina aperta o chiusa?", "Prima o dopo?". Facili da fare e fanno rispondere.</li>
  <li><strong>Box domande</strong>: "Cosa vuoi sapere sulla vendita di casa?". Le risposte diventano post.</li>
  <li><strong>Dietro le quinte</strong>: il sopralluogo, la preparazione delle foto, l'attesa dal notaio (senza mostrare persone o documenti).</li>
  <li><strong>Rimandi ai post</strong>: condividi ogni nuovo reel o carosello nelle storie.</li>
  <li><strong>Conto alla rovescia</strong>: per un open house o una nuova casa in arrivo.</li>
</ul>
<p>Raccogli le storie migliori nei <strong>contenuti in evidenza</strong> sul profilo, con titoli semplici: Immobili, Venduti, Zona, Chi sono, Recensioni, Valutazione.</p>`,
    },
    {
      id: 'caption',
      title: `Caption per post immobiliari: 4 esempi da copiare`,
      html: `<p>Una caption funziona se la prima riga fa venire voglia di leggere il resto e se l'ultima dice cosa fare. In mezzo, poche informazioni utili.</p>
<h3>Nuovo incarico</h3>
<p><em>Trilocale con terrazzo a due passi dal parco. 85 mq, terzo piano con ascensore, due camere, cucina abitabile, cantina. Classe energetica [X], indice [valore] kWh/m² anno. Le stanze arredate sono un esempio virtuale: la casa viene venduta vuota. Scrivimi "TERRAZZO" in DM per ricevere la scheda completa.</em></p>
<h3>Prima e dopo</h3>
<p><em>Stessa stanza, stesse pareti, stessa finestra. Cambia solo l'arredo, ed è virtuale. Così chi cerca casa capisce subito come usare lo spazio. Vuoi vedere la tua casa così? Mandami una foto del soggiorno.</em></p>
<h3>Consiglio</h3>
<p><em>Prima di mettere in vendita casa, recupera questi 4 documenti: ti fanno risparmiare settimane. Salva il post e giralo a chi sta pensando di vendere.</em></p>
<h3>Zona</h3>
<p><em>Cinque motivi per cui chi si trasferisce in [quartiere] non se ne va più. Il terzo lo conoscono in pochi. Tu quale aggiungeresti?</em></p>
<p>Ricorda che un post che presenta un immobile in vendita o in affitto è un annuncio: classe energetica e indice vanno indicati anche lì (vedi <a href="/it/ape-annunci-immobiliari">APE negli annunci</a>). Per scrivere i testi degli immobili, prendi spunto dalla guida con le <a href="/it/descrizione-immobile-esempi">descrizioni immobile da copiare</a>. Hashtag: pochi e locali (città, quartiere, tipo di immobile) funzionano meglio di lunghe liste generiche.</p>`,
    },
    {
      id: 'produrre',
      title: `Come produrre i contenuti senza passarci le giornate`,
      html: `<p>Il limite di quasi tutti gli agenti non è la mancanza di idee, è il tempo. Alcune abitudini aiutano:</p>
<ul>
  <li><strong>Un incarico, cinque contenuti</strong>: carosello delle foto, prima e dopo, giorno e notte, reel in cui lo presenti, storia del sopralluogo.</li>
  <li><strong>Riprese a blocchi</strong>: registra tre o quattro video in cui parli nella stessa mattina e pubblicali nelle settimane successive.</li>
  <li><strong>Modelli fissi</strong>: stessa struttura per i nuovi incarichi, stessa grafica per i consigli. Il pubblico ti riconosce e tu fai prima.</li>
  <li><strong>Video dalle foto</strong>: con <a href="/it">Agente Immo</a> arredi una stanza in foto e trasformi le foto in un reel con musica inclusa (Prima e dopo, Giorno e notte, Camminata), senza montaggio.</li>
</ul>
<p>Per una visione più ampia, che comprende anche portali, sito e WhatsApp, leggi la guida al <a href="/it/video-marketing-immobiliare">video marketing immobiliare</a>.</p>`,
    },
  ],
  faq: [
    [`Cosa pubblicare su Instagram da agente immobiliare?`, `Un mix di quattro tipi di contenuti: immobili in incarico (nuovi, prima e dopo, venduti), la zona in cui lavori, consigli per chi vende e chi compra, e contenuti su di te e sul tuo lavoro. Solo annunci rendono il profilo una vetrina che nessuno segue.`],
    [`Quante volte a settimana deve pubblicare un agente immobiliare?`, `Quanto riesci a mantenere nel tempo. Uno schema sostenibile è uno o due reel e un carosello a settimana, più qualche storia nei giorni lavorativi. La costanza conta più della quantità.`],
    [`Cosa scrivere nella bio Instagram di un agente immobiliare?`, `Ruolo e zona, cosa fai per chi legge, un invito (per esempio la valutazione gratuita) e un solo link al tuo sito o agli immobili. Inserisci ruolo e città anche nel nome profilo.`],
    [`Bisogna indicare la classe energetica nei post Instagram?`, `Se il post presenta un immobile in vendita o in affitto con i suoi dati, è un annuncio: classe energetica e indice di prestazione energetica vanno indicati, per esempio in caption.`],
    [`Posso pubblicare foto arredate virtualmente su Instagram?`, `Sì, se dichiari che l'arredo è virtuale e non modifichi struttura, finiture o difetti. Nei post prima e dopo il confronto con la foto reale è già parte del contenuto.`],
    [`Servono gli hashtag per gli agenti immobiliari?`, `Possono aiutare a farsi trovare in zona, ma contano meno del contenuto. Meglio pochi hashtag locali (città, quartiere, tipo di immobile) che lunghe liste generiche.`],
  ],
};

export const planimetriaAnnuncio: Guide = {
  slug: 'planimetria-annuncio-immobiliare',
  label: 'Planimetria nell\'annuncio',
  title: `Planimetria annuncio immobiliare: a colori, 3D, catastale`,
  description: `Planimetria annuncio immobiliare: differenza tra catastale e commerciale, come prepararla a colori, arredata o in 3D online e cosa è corretto mostrare.`,
  h1: `Planimetria nell'annuncio immobiliare: catastale o commerciale, a colori, arredata e 3D`,
  intro: `Nell'annuncio immobiliare conviene pubblicare una planimetria commerciale, cioè un disegno chiaro e leggibile della casa, ricavato dalla planimetria catastale e verificato sullo stato reale. La catastale resta il documento ufficiale da tenere nel fascicolo e da controllare prima di vendere. Qui trovi le differenze, come preparare la planimetria a colori, arredata o in 3D e cosa è corretto mostrare.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'perche',
      title: `Perché la planimetria nell'annuncio immobiliare conta`,
      html: `<p>Le foto mostrano come sono le stanze; la planimetria mostra <strong>come stanno insieme</strong>. Chi cerca casa la usa per rispondere a domande che le foto lasciano aperte: la camera matrimoniale affaccia sulla strada o sul cortile? Il bagno è vicino alla zona notte? Ci sta un tavolo per sei?</p>
<p>Una planimetria chiara nell'annuncio:</p>
<ul>
  <li><strong>filtra le visite</strong>: chi cerca una disposizione diversa lo capisce prima di venire;</li>
  <li><strong>fa durare di più l'attenzione</strong> sull'annuncio, perché chi è interessato torna a guardarla;</li>
  <li><strong>riduce le domande ripetitive</strong> al telefono;</li>
  <li><strong>fa sembrare l'annuncio completo</strong>, cosa che pesa quando l'acquirente confronta più immobili.</li>
</ul>
<p>Nell'ordine delle immagini, la planimetria va di solito dopo le foto principali, non in copertina. Trovi uno schema completo nella guida su <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>
<p>Per un <a href="/it/agente-immobiliare">agente immobiliare</a> è anche un modo di filtrare le visite: chi arriva ha già capito come sono disposte le stanze.</p>`,
    },
    {
      id: 'catastale-commerciale',
      title: `Planimetria catastale e planimetria commerciale: le differenze`,
      html: `<p>Sono due documenti diversi, con scopi diversi. Confonderli è l'errore più comune.</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Planimetria catastale</th><th ${TH}>Planimetria commerciale</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Cos'è</strong></td><td ${TD}>Il disegno dell'unità immobiliare depositato al Catasto (Agenzia delle Entrate)</td><td ${TD}>Un disegno ridisegnato per presentare l'immobile</td></tr>
    <tr><td ${TD}><strong>A cosa serve</strong></td><td ${TD}>Documento ufficiale: identifica l'immobile e va verificato per la compravendita</td><td ${TD}>Comunicazione: far capire la casa a chi cerca</td></tr>
    <tr><td ${TD}><strong>Aspetto</strong></td><td ${TD}>Tecnico, in bianco e nero, spesso poco leggibile, a volte scansionato da vecchi documenti</td><td ${TD}>Pulito, leggibile, anche a colori, arredato o in 3D</td></tr>
    <tr><td ${TD}><strong>Chi la fa</strong></td><td ${TD}>Un tecnico abilitato, che la presenta al Catasto</td><td ${TD}>L'agente, un grafico, un tecnico o uno strumento digitale</td></tr>
    <tr><td ${TD}><strong>Dove va</strong></td><td ${TD}>Nel fascicolo dell'immobile, da mostrare a chi è interessato e al notaio</td><td ${TD}>Nell'annuncio, sul sito, nei post e nelle schede</td></tr>
  </tbody>
</table>
<p>La planimetria catastale si richiede tramite i servizi dell'Agenzia delle Entrate: il proprietario può farlo per le unità di cui è intestatario, mentre i tecnici abilitati usano i loro canali professionali. Inseriscila tra i documenti da raccogliere al momento dell'incarico, insieme a visura, atto di provenienza e APE, come nella guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile in acquisizione</a>.</p>`,
    },
    {
      id: 'conformita',
      title: `Prima di tutto: la planimetria catastale corrisponde alla casa?`,
      html: `<p>Prima di disegnare qualsiasi planimetria per l'annuncio, confronta la catastale con la casa reale durante il sopralluogo. La legge richiede che nell'atto di compravendita ci sia la dichiarazione di conformità dei dati catastali e delle planimetrie allo stato di fatto: se una parete è stata spostata o un ripostiglio è diventato un bagno senza aggiornare il Catasto, il problema va risolto prima del rogito.</p>
<p>Cosa controllare:</p>
<ul>
  <li><strong>tramezzi e aperture</strong>: porte spostate, pareti tolte o aggiunte;</li>
  <li><strong>destinazione dei locali</strong>: un ripostiglio diventato bagno, una veranda chiusa, un sottotetto usato come camera;</li>
  <li><strong>pertinenze</strong>: cantina, box, soffitta indicati correttamente;</li>
  <li><strong>intestazione e dati</strong> coerenti con la visura.</li>
</ul>
<p>Se trovi differenze, non sei tu a doverle risolvere: segnalale al proprietario e consiglia un tecnico (geometra, architetto, ingegnere) per verificare la situazione urbanistica e catastale. Per i casi concreti, il riferimento è il tecnico o il notaio. Il tuo compito è accorgertene presto, perché una difformità scoperta a trattativa avviata la blocca.</p>
<p>Attenzione anche a cosa pubblichi: la planimetria nell'annuncio deve mostrare la casa com'è, non come "dovrebbe essere" sulla carta, e nemmeno una sistemazione non regolare come se lo fosse.</p>`,
    },
    {
      id: 'come-prepararla',
      title: `Come preparare la planimetria per l'annuncio: passo per passo`,
      html: `<ol>
  <li><strong>Parti dalla catastale verificata</strong> o, se la casa è cambiata in modo regolare, dal rilievo aggiornato del tecnico.</li>
  <li><strong>Misura i punti chiave</strong> al sopralluogo con un metro laser: lati delle stanze principali, posizione di porte e finestre. Servono per controllare il disegno, non per sostituire il rilievo di un tecnico.</li>
  <li><strong>Ridisegna in modo pulito</strong>: muri spessi e scuri, porte con il verso di apertura, finestre ben visibili.</li>
  <li><strong>Nomina le stanze</strong>: soggiorno, cucina, camera, bagno, ripostiglio. Se aggiungi le misure, indica che sono indicative.</li>
  <li><strong>Aggiungi l'orientamento</strong>: una freccia del nord aiuta a capire la luce.</li>
  <li><strong>Togli i dati che non servono</strong>: nomi degli intestatari, dati catastali, timbri, intestazioni del documento ufficiale.</li>
  <li><strong>Aggiungi una nota</strong> in basso, per esempio: "Planimetria indicativa, non in scala. Fa fede la documentazione catastale e tecnica".</li>
  <li><strong>Esporta in buona risoluzione</strong>, leggibile anche da telefono, e usa lo stesso file su portale, sito e schede.</li>
</ol>
<p>Se l'immobile ha più livelli (villetta, duplex, mansarda), prepara una planimetria per piano, con il nome del piano ben visibile. Cantina e box possono stare in un'immagine separata.</p>`,
    },
    {
      id: 'colori-arredata-3d',
      title: `Planimetria a colori, arredata e 3D online: quale scegliere`,
      html: `<p>Una volta che il disegno è corretto, puoi scegliere come presentarlo. Le tre versioni non si escludono.</p>
<h3>Planimetria a colori</h3>
<p>Ogni zona ha un colore tenue: zona giorno, zona notte, bagni, spazi esterni. Si legge in un attimo anche su un telefono. Usa colori chiari e coerenti, testo scuro, niente sfumature che coprono i muri.</p>
<h3>Planimetria arredata</h3>
<p>Il disegno dall'alto con letti, divani, tavoli e cucina. Fa capire le proporzioni: dove sta il letto matrimoniale, quanti posti ha il tavolo, se in camera ci sta l'armadio. È utile soprattutto per le case vuote. Gli arredi devono essere in scala: un divano disegnato troppo piccolo fa sembrare la stanza più grande e crea false aspettative.</p>
<h3>Planimetria 3D</h3>
<p>Una vista in prospettiva dall'alto, con pareti, pavimenti e arredi. È la più immediata per chi non sa leggere un disegno tecnico ed è adatta anche ai social. Come per il virtual staging, deve rispettare la casa reale: stessa disposizione, stesse aperture, stessi spazi.</p>
<p>Oggi puoi ottenere queste versioni online senza programmi di disegno. Con <a href="/it">Agente Immo</a> carichi la planimetria nella chat e chiedi la versione a colori o in 3D; prima di pubblicare, controlla sempre che muri, porte e finestre siano gli stessi dell'originale.</p>`,
    },
    {
      id: 'cosa-mostrare',
      title: `Cosa è corretto mostrare nella planimetria di un annuncio`,
      html: `<p>La planimetria è un'informazione sull'immobile, come le foto e i dati. Valgono quindi gli stessi principi di correttezza del <a href="/it/virtual-staging-legale">virtual staging legale</a>: puoi rendere il disegno più chiaro, non puoi cambiare la casa.</p>
<p><strong>Corretto</strong>:</p>
<ul>
  <li>ridisegnare in modo leggibile la disposizione reale;</li>
  <li>colorare le zone, aggiungere arredi in scala, mostrare una vista 3D fedele;</li>
  <li>indicare misure e superfici come indicative, coerenti con quelle dichiarate nell'annuncio;</li>
  <li>mostrare, in un'immagine separata e ben indicata, un'ipotesi di diversa distribuzione ("ipotesi di ristrutturazione, da verificare con un tecnico").</li>
</ul>
<p><strong>Da evitare</strong>:</p>
<ul>
  <li>pareti eliminate o aggiunte rispetto alla realtà;</li>
  <li>locali presentati con una destinazione diversa da quella regolare (un ripostiglio chiamato "camera");</li>
  <li>superfici gonfiate o misure non verificate presentate come certe;</li>
  <li>la planimetria catastale pubblicata così com'è, con dati catastali e intestatari visibili.</li>
</ul>
<p>Il criterio pratico è lo stesso delle foto: chi arriva alla visita deve trovare la casa che ha visto nella planimetria.</p>`,
    },
    {
      id: 'dove-usarla',
      title: `Dove usare la planimetria oltre all'annuncio`,
      html: `<ul>
  <li><strong>Sito dell'agenzia</strong>: nella pagina dell'immobile, vicino alle foto. Vedi la guida al <a href="/it/sito-web-agente-immobiliare">sito web dell'agente immobiliare</a>.</li>
  <li><strong>Scheda o report per il cliente</strong>: stampata in visita o mandata in PDF su WhatsApp a chi chiede informazioni.</li>
  <li><strong>Social</strong>: una planimetria 3D o arredata in un carosello, dopo le foto, risponde alla domanda "com'è distribuita?".</li>
  <li><strong>Acquisizione</strong>: mostrare al proprietario la planimetria a colori o 3D della sua casa è un modo concreto per fargli vedere come la presenterai.</li>
  <li><strong>Trattativa</strong>: con la planimetria arredata davanti, l'acquirente ragiona su spazi e mobili, non su sensazioni.</li>
</ul>`,
    },
    {
      id: 'checklist',
      title: `Checklist planimetria annuncio immobiliare`,
      html: `<ol>
  <li>Hai la planimetria catastale nel fascicolo dell'immobile.</li>
  <li>L'hai confrontata con lo stato reale al sopralluogo.</li>
  <li>Eventuali differenze sono state segnalate al proprietario e a un tecnico.</li>
  <li>La planimetria commerciale riproduce la disposizione reale.</li>
  <li>Stanze nominate correttamente, porte e finestre al posto giusto.</li>
  <li>Misure e superfici indicate come indicative e coerenti con l'annuncio.</li>
  <li>Nessun dato catastale o personale visibile.</li>
  <li>Nota "planimetria indicativa, non in scala" presente.</li>
  <li>Arredi in scala nella versione arredata o 3D.</li>
  <li>Stesso file su portale, sito, schede e social.</li>
</ol>
<p>Completata la planimetria, cura le foto: trovi i consigli nella guida alle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a>.</p>`,
    },
  ],
  faq: [
    [`Che differenza c'è tra planimetria catastale e commerciale?`, `La catastale è il disegno ufficiale depositato al Catasto e serve a identificare l'immobile e a verificarne la conformità. La commerciale è un disegno ridisegnato per presentare la casa nell'annuncio: più leggibile, anche a colori, arredato o in 3D, ma sempre fedele alla realtà.`],
    [`Si può pubblicare la planimetria catastale nell'annuncio?`, `Meglio di no così com'è: è poco leggibile e può contenere dati catastali e degli intestatari. Conviene ridisegnarla in versione commerciale, dopo averla verificata con lo stato reale.`],
    [`Come fare una planimetria a colori o 3D online?`, `Partendo da una planimetria corretta, puoi usare un programma di disegno o uno strumento online. Con Agente Immo carichi la planimetria in chat e chiedi la versione a colori o 3D, poi controlli che muri, porte e finestre corrispondano all'originale.`],
    [`La planimetria dell'annuncio deve essere in scala?`, `Non necessariamente, ma deve essere fedele nella disposizione. Se non è in scala o le misure sono indicative, scrivilo in una nota sul disegno.`],
    [`Cosa fare se la planimetria catastale non corrisponde alla casa?`, `Segnalalo subito al proprietario e consiglia un tecnico abilitato per verificare la situazione catastale e urbanistica. La conformità va sistemata prima del rogito, quindi conviene accorgersene all'acquisizione.`],
    [`Posso mostrare come potrebbe diventare la casa con lavori?`, `Sì, se è chiaro che è un'ipotesi: un'immagine separata con la scritta "ipotesi di ristrutturazione, da verificare con un tecnico", sempre accanto alla planimetria dello stato attuale.`],
  ],
};

export const presentazioneAcquisizione: Guide = {
  slug: 'presentazione-acquisizione-immobile',
  label: 'Presentazione di acquisizione',
  title: `Presentazione acquisizione immobile: struttura e obiezioni`,
  description: `Presentazione acquisizione immobile: come strutturarla, cosa mostrare al proprietario, come rispondere alle obiezioni e proporre l'esclusiva.`,
  h1: `Presentazione di acquisizione dell'immobile: come convincere il proprietario a darti l'incarico`,
  intro: `Una presentazione di acquisizione efficace mostra al proprietario tre cose: quanto vale la sua casa, come la venderai e in quanto tempo, con quali passaggi. Non è un discorso su quanto è brava l'agenzia, è un piano concreto sulla sua casa, con foto arredate, video e pagina sul sito già pronti da fargli vedere. Qui trovi la struttura passo per passo, le risposte alle obiezioni più comuni e come proporre l'esclusiva in modo corretto.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'cosa-e',
      title: `Cos'è la presentazione di acquisizione e quando farla`,
      html: `<p>È il momento in cui, dopo il sopralluogo, ti siedi con il proprietario e gli presenti la tua proposta: valutazione, strategia di vendita e condizioni dell'incarico. Può avvenire nello stesso incontro del sopralluogo o, meglio, in un secondo appuntamento, quando hai avuto il tempo di preparare valutazione e materiali.</p>
<p>Il secondo appuntamento ha due vantaggi: arrivi con un lavoro fatto <strong>sulla sua casa</strong>, non con una brochure generica, e il proprietario capisce che hai dedicato tempo al suo immobile. Se il primo contatto è arrivato da una lettera o da una telefonata, trovi i passaggi precedenti nelle guide sulla <a href="/it/lettera-acquisizione-immobili">lettera di acquisizione</a> e sullo <a href="/it/script-telefonata-proprietari">script per la telefonata ai proprietari</a>. Per la strategia generale, parti da <a href="/it/acquisire-incarichi-immobiliari">come acquisire incarichi immobiliari</a>.</p>
<p>L'acquisizione è il lavoro che decide il reddito di un <a href="/it/agente-immobiliare">agente immobiliare</a>: chi ha più incarichi vende di più.</p>`,
    },
    {
      id: 'struttura',
      title: `Struttura della presentazione al proprietario in 7 passaggi`,
      html: `<ol>
  <li><strong>Ascolto (5 minuti)</strong>: riprendi quello che ti ha detto al sopralluogo. Perché vende, entro quando, cosa lo preoccupa, che cifra ha in mente. <em>"L'ultima volta mi ha detto che vorrebbe vendere entro l'estate perché avete già visto la casa nuova. È ancora così?"</em></li>
  <li><strong>La valutazione</strong>: mercato della zona, comparabili, forbice di prezzo, spiegati riga per riga.</li>
  <li><strong>La strategia di prezzo</strong>: prezzo di pubblicazione deciso insieme e quando rivederlo.</li>
  <li><strong>Il piano marketing</strong>: come presenterai la casa, mostrato con materiali già pronti.</li>
  <li><strong>Tempi e passaggi</strong>: dal giorno della firma al rogito, con chi fa cosa.</li>
  <li><strong>Condizioni</strong>: tipo di incarico, durata, provvigione, cosa è incluso.</li>
  <li><strong>Prossimo passo</strong>: firma, oppure una data precisa per risentirvi.</li>
</ol>
<p>Tieni la presentazione intorno ai 30-45 minuti e lascia spazio alle domande. Il proprietario deve parlare almeno quanto te.</p>`,
    },
    {
      id: 'valutazione',
      title: `La valutazione: il primo argomento per ottenere l'incarico`,
      html: `<p>Il proprietario vuole sapere prima di tutto quanto vale la sua casa. La tua forza non è dare il numero più alto, è dare il numero che sai spiegare:</p>
<ul>
  <li>i <strong>comparabili</strong> venduti o in trattativa in zona, con foto, metratura, piano, stato e tempi;</li>
  <li>il <strong>confronto</strong> tra la sua casa e i comparabili: cosa ha in più e cosa in meno;</li>
  <li>la <strong>forbice di prezzo</strong> realistica e il prezzo di pubblicazione consigliato;</li>
  <li>i <strong>costi di vendita</strong> a suo carico, così non ci sono sorprese.</li>
</ul>
<p>Lascia tutto in un report scritto, stampato e in PDF: resta sul tavolo quando sei andato via e viene mostrato in famiglia. Il metodo completo, con le frasi per presentare la cifra e gestire le aspettative, è nella guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione immobile per l'acquisizione</a>.</p>`,
    },
    {
      id: 'piano-marketing',
      title: `Il piano marketing: foto arredate, video e sito da mostrare`,
      html: `<p>Qui si decide quasi sempre l'incarico. Tutte le agenzie dicono "faremo foto professionali e pubblicheremo ovunque". Tu <strong>mostri</strong> il risultato sulla sua casa. Un piano in una pagina, con accanto i materiali:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Voce</th><th ${TH}>Cosa dici</th><th ${TH}>Cosa mostri</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Foto</strong></td><td ${TD}>Come e quando farai le foto, come preparare la casa</td><td ${TD}>Un annuncio che hai curato tu</td></tr>
    <tr><td ${TD}><strong>Home staging virtuale</strong></td><td ${TD}>Le stanze vuote o datate saranno arredate in foto, dichiarandolo</td><td ${TD}>Il suo soggiorno già arredato, con lo slider prima e dopo</td></tr>
    <tr><td ${TD}><strong>Planimetria</strong></td><td ${TD}>Una planimetria leggibile, a colori o 3D</td><td ${TD}>Un esempio, o la sua se hai già la catastale</td></tr>
    <tr><td ${TD}><strong>Video</strong></td><td ${TD}>Quali video pubblicherai e dove</td><td ${TD}>Un video prima e dopo della sua casa o di un immobile simile</td></tr>
    <tr><td ${TD}><strong>Sito e portali</strong></td><td ${TD}>Su quali portali va l'annuncio e la pagina sul tuo sito</td><td ${TD}>Il tuo sito sul telefono, con gli immobili che segui</td></tr>
    <tr><td ${TD}><strong>Acquirenti</strong></td><td ${TD}>Come contatterai le persone già in cerca</td><td ${TD}>Il messaggio tipo che manderai, senza dati di altri clienti</td></tr>
    <tr><td ${TD}><strong>Aggiornamenti</strong></td><td ${TD}>Ogni quanto lo aggiorni e con quali dati</td><td ${TD}>Un esempio di report periodico</td></tr>
  </tbody>
</table>
<p>Preparare questi materiali per ogni appuntamento sembra lungo, ma con gli strumenti giusti richiede pochi minuti. Con <a href="/it">Agente Immo</a> arredi in foto la stanza principale partendo da una foto del sopralluogo, crei un video prima e dopo con musica inclusa e prepari la scheda immobile con il report PDF da mandargli su WhatsApp dopo l'incontro. Per avere un'idea dei costi alternativi: un home staging fisico è stimato intorno ai 1.500 € a casa e un video da videomaker intorno ai 250 €, stime indicative, utili solo come ordine di grandezza. Vedi anche <a href="/it/home-staging-virtuale">home staging virtuale</a> e <a href="/it/video-marketing-immobiliare">video marketing immobiliare</a>.</p>`,
    },
    {
      id: 'tempi',
      title: `Tempi e passaggi: cosa succede dopo la firma`,
      html: `<p>Il proprietario si fida di più quando sa cosa succederà e quando. Presenta una sequenza semplice, senza promettere date di vendita:</p>
<ol>
  <li><strong>Documenti</strong>: planimetria, visura, atto di provenienza, APE, spese condominiali, eventuali pratiche edilizie. Se manca l'APE, va richiesto subito: vedi <a href="/it/ape-annunci-immobiliari">APE negli annunci</a>.</li>
  <li><strong>Preparazione della casa e foto</strong>: decluttering, scatti, home staging virtuale, planimetria.</li>
  <li><strong>Pubblicazione</strong>: annuncio, sito, social, contatto agli acquirenti già in cerca.</li>
  <li><strong>Visite</strong>: come le gestisci, chi è presente, come filtri i curiosi.</li>
  <li><strong>Aggiornamenti periodici</strong>: visualizzazioni, richieste, visite, riscontri degli acquirenti.</li>
  <li><strong>Revisione</strong>: una data concordata in cui valutate insieme i dati e, se serve, il prezzo.</li>
  <li><strong>Proposta, accettazione, preliminare e rogito</strong>, con il ruolo del notaio.</li>
</ol>
<p>Promettere "vendiamo in 30 giorni" è rischioso e spesso controproducente. Prometti invece ciò che controlli: tempi di pubblicazione, qualità della presentazione, frequenza degli aggiornamenti.</p>`,
    },
    {
      id: 'obiezioni',
      title: `Come convincere un proprietario a dare l'incarico: le obiezioni`,
      html: `<p>Le obiezioni non sono un rifiuto: sono domande a cui il proprietario non ha ancora avuto risposta. Le più frequenti, con una risposta di partenza da adattare:</p>
<h3>"Un'altra agenzia mi ha valutato di più"</h3>
<p><em>"Capisco. Io le ho dato la cifra che posso spiegarle con le vendite della zona. Le chieda su quali vendite si basa la loro: se i dati ci sono, ne parliamo volentieri. Un prezzo alto in partenza che poi va ribassato spesso fa vendere peggio."</em></p>
<h3>"La provvigione è troppo alta"</h3>
<p><em>"Guardiamo cosa c'è dentro: foto, arredo in foto delle stanze, video, pagina sul sito, gestione delle visite e della trattativa fino al rogito. Le mostro cosa farò, poi decide lei se il servizio vale la cifra."</em> Per argomenti e calcoli, vedi la guida alla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>
<h3>"Voglio provare da solo"</h3>
<p><em>"È una scelta legittima. Se vuole, le lascio la valutazione e una lista dei documenti da preparare. Se tra qualche settimana vuole un confronto, mi chiami."</em> Rispetto oggi vale un incarico domani.</p>
<h3>"Voglio darlo a più agenzie"</h3>
<p><em>"Le spiego la differenza tra incarico libero ed esclusiva, con vantaggi e limiti di entrambi, poi scegliamo quello più adatto a lei."</em> (vedi sezione successiva)</p>
<h3>"Ci devo pensare"</h3>
<p><em>"Certo. C'è un punto in particolare su cui ha dubbi? Così le mando le informazioni che le servono."</em> Poi fissa una data: <em>"La risento giovedì pomeriggio, va bene?"</em></p>
<h3>"Non voglio foto arredate, la casa è com'è"</h3>
<p><em>"Giusto: le foto reali ci saranno sempre. L'arredo virtuale è dichiarato e serve solo a far capire come usare gli spazi vuoti. Se preferisce, partiamo senza e lo valutiamo dopo i primi riscontri."</em></p>`,
    },
    {
      id: 'esclusiva',
      title: `Ottenere l'esclusiva: esclusiva o incarico libero, in modo corretto`,
      html: `<p>L'esclusiva va <strong>proposta e spiegata</strong>, non imposta. Il proprietario deve capire cosa firma e perché può convenirgli.</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Incarico in esclusiva</th><th ${TH}>Incarico libero (non esclusivo)</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Come funziona</strong></td><td ${TD}>Un solo agente per un periodo concordato</td><td ${TD}>Più agenzie possono proporre l'immobile</td></tr>
    <tr><td ${TD}><strong>Per il proprietario</strong></td><td ${TD}>Un unico referente, un'unica presentazione e un unico prezzo online, aggiornamenti più chiari</td><td ${TD}>Libertà di scegliere, ma annunci diversi per la stessa casa, a volte con prezzi o foto diversi</td></tr>
    <tr><td ${TD}><strong>Per l'agente</strong></td><td ${TD}>Può investire in foto, video e marketing sapendo di seguire la vendita</td><td ${TD}>Investimento limitato, perché la vendita può chiuderla un altro</td></tr>
    <tr><td ${TD}><strong>Da definire per iscritto</strong></td><td ${TD}>Durata, rinnovo, provvigione, cosa succede se vende da solo, recesso</td><td ${TD}>Provvigione e condizioni per maturarla</td></tr>
  </tbody>
</table>
<p>Come proporla in modo corretto:</p>
<ul>
  <li><strong>Collega l'esclusiva al piano</strong>: <em>"Con l'esclusiva posso investire su foto arredate, video e sito per la sua casa. Con più agenzie, ognuna fa il minimo."</em></li>
  <li><strong>Proponi una durata ragionevole</strong> e motivata dal piano, non la più lunga possibile.</li>
  <li><strong>Spiega le clausole importanti</strong>: durata, eventuale rinnovo, provvigione, eventuali penali e cosa succede se il proprietario trova un acquirente da solo. Niente sorprese scritte in piccolo.</li>
  <li><strong>Usa moduli in regola</strong>: la Legge 39/1989 prevede che i moduli usati dal mediatore siano depositati presso la Camera di Commercio. Clausole squilibrate a danno del consumatore possono essere contestate secondo il Codice del Consumo.</li>
  <li><strong>Ricorda il diritto di recesso</strong>: se l'incarico è firmato con un consumatore fuori dai locali dell'agenzia, per esempio a casa del proprietario, in genere si applicano le regole del Codice del Consumo sui contratti negoziati fuori dai locali commerciali, incluso il recesso. Verifica con la tua associazione di categoria come gestirlo nei tuoi moduli.</li>
  <li><strong>Lascia tempo per leggere</strong>: se il proprietario non è pronto, lascia la bozza e fissa una data.</li>
</ul>
<p>Queste sono indicazioni pratiche, non un parere legale: per i tuoi moduli e i casi particolari rivolgiti alla tua associazione o a un legale.</p>`,
    },
    {
      id: 'checklist',
      title: `Checklist della presentazione di acquisizione`,
      html: `<p>Prima dell'appuntamento, controlla di avere:</p>
<ol>
  <li>Note del sopralluogo: motivi della vendita, tempi, prezzo atteso, dubbi.</li>
  <li>Report di valutazione stampato e in PDF, con comparabili e costi di vendita.</li>
  <li>Almeno una stanza della sua casa arredata in foto, con il confronto prima e dopo.</li>
  <li>Un video di esempio, meglio se della sua casa.</li>
  <li>Il piano marketing in una pagina.</li>
  <li>Il tuo sito pronto da mostrare sul telefono o sul tablet.</li>
  <li>La lista dei documenti da recuperare.</li>
  <li>La bozza di incarico, esclusivo e non, con le clausole che sai spiegare.</li>
  <li>Le risposte alle obiezioni più probabili per quel proprietario.</li>
  <li>Una data per il prossimo contatto, se non firma subito.</li>
</ol>
<p>Dopo l'incontro manda in giornata il report e la foto arredata, con un messaggio breve. Registra tutto nel tuo <a href="/it/crm-immobiliare">CRM immobiliare</a>: anche un incarico perso oggi può tornare tra qualche mese.</p>`,
    },
  ],
  faq: [
    [`Come si struttura una presentazione di acquisizione di un immobile?`, `Ascolto delle esigenze del proprietario, valutazione con comparabili, strategia di prezzo, piano marketing mostrato con materiali pronti, tempi e passaggi fino al rogito, condizioni dell'incarico e prossimo passo concordato.`],
    [`Come convincere un proprietario a dare l'incarico?`, `Mostrando invece di promettere: una valutazione spiegata riga per riga e la sua casa già presentata come la presenteresti, con foto arredate, un video e la pagina sul tuo sito. Poi rispondendo con calma alle obiezioni e fissando sempre il prossimo contatto.`],
    [`Come ottenere l'esclusiva da un proprietario?`, `Collegandola a un piano concreto che solo con l'esclusiva ha senso investire, proponendo una durata ragionevole e spiegando con chiarezza clausole, provvigione e recesso. L'esclusiva va proposta e motivata, non imposta.`],
    [`Meglio incarico in esclusiva o libero?`, `Dipende dal proprietario e dall'immobile. L'esclusiva dà un unico referente, un'unica presentazione e permette all'agente di investire nel marketing; l'incarico libero lascia più libertà al proprietario ma spesso porta annunci diversi per la stessa casa.`],
    [`Il proprietario può recedere dall'incarico firmato a casa sua?`, `Se è un consumatore e l'incarico è firmato fuori dai locali dell'agenzia, in genere si applicano le regole del Codice del Consumo sui contratti negoziati fuori dai locali commerciali, incluso il diritto di recesso. Per i dettagli verifica con la tua associazione di categoria o un legale.`],
    [`Cosa portare all'appuntamento di acquisizione?`, `Report di valutazione, una stanza della casa arredata in foto, un video di esempio, il piano marketing in una pagina, il tuo sito da mostrare, la lista dei documenti e la bozza di incarico.`],
  ],
};

import type { Guide } from './types';

// Guide "semplici" per agenti poco pratici col digitale: WhatsApp Business, Google Maps, recensioni Google,
// vetrina dell'agenzia, ChatGPT. Linguaggio facile, passi numerati, niente gergo non spiegato.
// I passaggi su app di terzi sono verificati sulle guide ufficiali dove possibile e restano generici dove i menu cambiano spesso.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const whatsappBusinessAgenzia: Guide = {
  slug: 'whatsapp-business-agenzia-immobiliare',
  label: 'WhatsApp Business in agenzia',
  title: 'Come usare WhatsApp Business in agenzia immobiliare',
  description: `Come usare WhatsApp Business in agenzia immobiliare, passo passo: installarlo, profilo, messaggio di assenza, risposte rapide, etichette. Facile.`,
  h1: 'Come usare WhatsApp Business in agenzia immobiliare: guida facile, passo passo',
  intro: `WhatsApp Business è una app gratuita, uguale al WhatsApp che usi già, con in più alcuni strumenti pensati per chi lavora: il profilo dell'agenzia, le risposte automatiche quando sei in visita, i messaggi pronti e le etichette per ordinare i clienti. Si installa in dieci minuti e non serve essere esperti. Qui trovi i passaggi uno per uno, con esempi pronti per un'agenzia immobiliare.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'cos-e',
      title: 'WhatsApp Business: cos\'è e come funziona',
      html: `<p>Pensa a WhatsApp Business come al <strong>WhatsApp dell'ufficio</strong>. Le chat, le foto, i vocali e le chiamate funzionano esattamente come nel WhatsApp normale. Cambiano tre cose:</p>
<ul>
  <li><strong>Il profilo</strong>: chi ti scrive vede il nome dell'agenzia, l'indirizzo, gli orari e il sito, come su un biglietto da visita.</li>
  <li><strong>I messaggi automatici</strong>: se sei in visita o in ferie, l'app risponde da sola con un messaggio che scrivi tu una volta.</li>
  <li><strong>L'ordine</strong>: puoi mettere un'etichetta colorata a ogni cliente ("Venditore", "Cerca bilocale", "Visita fissata") e ritrovarli in un attimo.</li>
</ul>
<p>Perché conviene a un <a href="/it/agente-immobiliare">agente immobiliare</a>? Perché oggi molti clienti preferiscono scrivere invece di telefonare. Il proprietario che ha visto il tuo cartello, la coppia che ha visto l'annuncio, il notaio che ti manda un documento: passano quasi tutti da WhatsApp. Se lo usi già col numero personale, sai bene il problema: lavoro e famiglia mescolati, messaggi alle dieci di sera, foto del nipote in mezzo alle planimetrie.</p>
<p><strong>Quanto costa?</strong> L'app WhatsApp Business si scarica e si usa gratis. Esistono servizi a pagamento per grandi aziende che mandano migliaia di messaggi, ma a un'agenzia non servono.</p>`,
    },
    {
      id: 'installare',
      title: 'Come attivare WhatsApp Business: i primi passi',
      html: `<p>Prima di cominciare, decidi <strong>quale numero usare</strong>. Hai due strade:</p>
<ul>
  <li><strong>Un numero solo per il lavoro</strong> (consigliato): una seconda SIM o il numero dell'agenzia. Così la sera puoi staccare.</li>
  <li><strong>Il tuo numero di sempre</strong>: se i clienti ti conoscono già con quello, puoi passarlo a WhatsApp Business. L'app ti propone di portare con te le chat che hai già. Fai comunque prima un backup (una copia di sicurezza) delle chat, dalle impostazioni del WhatsApp normale.</li>
</ul>
<p>Un numero può stare su un solo WhatsApp alla volta: o quello normale, o quello Business. Sullo stesso telefono però puoi tenere tutte e due le app, ognuna con un numero diverso. Molti agenti usano anche il <strong>numero fisso dell'agenzia</strong>: WhatsApp permette di verificarlo con una chiamata al posto dell'SMS, scegliendo l'opzione di chiamata durante l'attivazione.</p>
<p>Ora i passaggi:</p>
<ol>
  <li>Apri il negozio delle app del telefono: <strong>Play Store</strong> se hai un Android, <strong>App Store</strong> se hai un iPhone.</li>
  <li>Cerca <strong>WhatsApp Business</strong>. L'icona è simile a quella di WhatsApp, con una "B" al centro. Controlla che lo sviluppatore sia WhatsApp.</li>
  <li>Tocca <strong>Installa</strong> (o <strong>Ottieni</strong> su iPhone) e poi <strong>Apri</strong>.</li>
  <li>Accetta le condizioni e scrivi il numero che hai scelto.</li>
  <li>Inserisci il codice che ti arriva per SMS o con una chiamata.</li>
  <li>Scrivi il <strong>nome dell'attività</strong>: per esempio "Immobiliare Rossi, Mario Rossi". Il nome della persona aiuta: i clienti cercano te, non solo l'insegna.</li>
  <li>Scegli la <strong>categoria</strong>: cerca "Immobiliare" o la voce più vicina che trovi.</li>
  <li>Metti una <strong>foto</strong>: il logo dell'agenzia oppure una tua foto in primo piano, sorridente e con luce buona.</li>
</ol>
<p>Fatto. Da qui in poi si usa come il WhatsApp di sempre.</p>`,
    },
    {
      id: 'profilo',
      title: 'Il profilo dell\'agenzia su WhatsApp Business',
      html: `<p>Il profilo è la prima cosa che vede chi ti scrive per la prima volta. Compilarlo bene costa cinque minuti e dà subito un'idea seria. Lo trovi nelle <strong>Impostazioni</strong> dell'app, alla voce del profilo dell'attività (su Android le impostazioni si aprono dai tre puntini in alto a destra, su iPhone dall'ingranaggio in basso).</p>
<p>Compila queste voci:</p>
<ol>
  <li><strong>Descrizione</strong>: due righe chiare. Esempio: "Agenzia immobiliare a Montebelluna dal 1999. Vendite e affitti in centro e frazioni. Valutazioni gratuite."</li>
  <li><strong>Indirizzo</strong>: quello dell'ufficio, scritto come su Google.</li>
  <li><strong>Orari</strong>: gli stessi della porta dell'agenzia. Servono anche per il messaggio automatico fuori orario, che vediamo tra poco.</li>
  <li><strong>Email</strong> e <strong>sito</strong>: se hai un sito, mettilo. Se non lo hai, leggi la guida al <a href="/it/sito-web-agente-immobiliare">sito web per agente immobiliare</a>.</li>
</ol>
<p>Usa gli stessi dati ovunque: profilo WhatsApp, scheda su Google, biglietti da visita. Se l'indirizzo o il telefono sono diversi da un posto all'altro, il cliente si confonde. Per la scheda Google trovi i passaggi nella guida su <a href="/it/agenzia-immobiliare-google-maps">come mettere l'agenzia su Google Maps</a>.</p>`,
    },
    {
      id: 'messaggio-automatico',
      title: 'WhatsApp Business: come mettere il messaggio automatico',
      html: `<p>È la funzione che gli agenti apprezzano di più. Ci sono due messaggi automatici, cioè messaggi che l'app manda da sola:</p>
<ul>
  <li><strong>Messaggio di benvenuto</strong>: arriva a chi ti scrive per la prima volta (o dopo tanto tempo).</li>
  <li><strong>Messaggio di assenza</strong>: arriva quando non puoi rispondere, per esempio fuori orario o in ferie.</li>
</ul>
<p>Come impostarli:</p>
<ol>
  <li>Apri WhatsApp Business e vai nelle <strong>Impostazioni</strong>.</li>
  <li>Tocca <strong>Strumenti per l'attività</strong>. Il nome può cambiare leggermente con gli aggiornamenti dell'app, ma la voce è sempre lì.</li>
  <li>Tocca <strong>Messaggio di benvenuto</strong> (oppure <strong>Messaggio di assenza</strong>).</li>
  <li>Accendi l'interruttore.</li>
  <li>Tocca il testo e scrivi il tuo messaggio.</li>
  <li>Per il messaggio di assenza scegli <strong>quando mandarlo</strong>: sempre, in un periodo che decidi tu (utile per le ferie) o fuori dagli orari di apertura.</li>
  <li>Tocca <strong>Salva</strong>.</li>
</ol>
<p><strong>Esempi pronti da copiare</strong>:</p>
<p><em>Benvenuto: "Buongiorno, grazie per aver scritto a Immobiliare Rossi. Sono Mario, le rispondo personalmente il prima possibile. Se mi scrive per un immobile, mi indichi la via o il link dell'annuncio, così la aiuto subito."</em></p>
<p><em>Fuori orario: "Grazie per il messaggio. L'ufficio ora è chiuso, riapre domani alle 9. Le rispondo appena rientro. Per urgenze può chiamare il 333..."</em></p>
<p><em>Ferie: "Sono in ferie fino al 25 agosto. Le rispondo al rientro. Per le visite già fissate la contatterà il mio collaboratore Luca."</em></p>
<p>Ricordati di <strong>spegnere il messaggio di ferie</strong> quando torni: è l'errore più comune.</p>`,
    },
    {
      id: 'risposte-rapide',
      title: 'Risposte rapide: i messaggi pronti per le domande di sempre',
      html: `<p>Quante volte al giorno scrivi l'indirizzo dell'ufficio, i documenti per la vendita, gli orari? Le <strong>risposte rapide</strong> sono messaggi che salvi una volta e richiami con una parola breve, senza riscriverli ogni volta.</p>
<ol>
  <li>Vai in <strong>Impostazioni</strong> e poi <strong>Strumenti per l'attività</strong>.</li>
  <li>Tocca <strong>Risposte rapide</strong> e poi il <strong>+</strong> (o <strong>Aggiungi</strong>).</li>
  <li>Scrivi il messaggio.</li>
  <li>Scegli una parola breve per richiamarlo, per esempio <em>documenti</em>.</li>
  <li>Salva.</li>
  <li>In chat scrivi la barra <strong>/</strong> seguita dalla parola (<em>/documenti</em>) e tocca il messaggio che compare: si inserisce da solo. Puoi ancora modificarlo prima di inviarlo.</li>
</ol>
<p>Cinque risposte rapide utili in agenzia:</p>
<ul>
  <li><strong>/dove</strong>: "L'agenzia è in via Roma 15, accanto alla farmacia. Parcheggio in piazza. Ecco la posizione: [link Google Maps]"</li>
  <li><strong>/documenti</strong>: "Per preparare la vendita mi servono: atto di provenienza, planimetria catastale, visura, APE se ce l'ha già. Se manca qualcosa ci pensiamo insieme."</li>
  <li><strong>/visita</strong>: "Perfetto, le confermo la visita per [giorno] alle [ora] in [via]. Ci vediamo davanti al portone. Per qualsiasi cosa mi scriva qui."</li>
  <li><strong>/valutazione</strong>: "Con piacere. Per una valutazione seria vengo a vedere la casa di persona, ci vogliono circa 30 minuti ed è senza impegno. Quando le farebbe comodo?"</li>
  <li><strong>/grazie</strong>: "Grazie della fiducia. Se le fa piacere lasciare un parere sulla nostra agenzia, qui ci vuole un minuto: [link recensioni]"</li>
</ul>
<p>Per l'ultima, trovi come ottenere il link nella guida su <a href="/it/recensioni-google-agenzia-immobiliare">come chiedere recensioni su Google</a>.</p>`,
    },
    {
      id: 'etichette',
      title: 'Etichette e liste: tenere in ordine clienti e proprietari',
      html: `<p>Le <strong>etichette</strong> sono come i post-it colorati sulle cartelline. Ne metti una a ogni chat e poi, con un tocco, vedi solo i clienti di quel tipo.</p>
<ol>
  <li>In elenco chat, <strong>tieni premuto</strong> il dito su una conversazione finché non si seleziona.</li>
  <li>Tocca l'icona dell'<strong>etichetta</strong> (o i tre puntini e poi <strong>Etichetta chat</strong>).</li>
  <li>Scegli un'etichetta o creane una nuova.</li>
</ol>
<p>Etichette che funzionano in agenzia: <em>Venditore</em>, <em>Acquirente</em>, <em>Affitto</em>, <em>Visita fissata</em>, <em>Proposta in corso</em>, <em>Rogito fatto</em>, <em>Da richiamare</em>. Non esagerare: meglio sei etichette usate sempre che venti usate a metà.</p>
<p><strong>Mandare lo stesso messaggio a più persone</strong>: WhatsApp ha le <strong>liste broadcast</strong>, cioè invii multipli. Scrivi un messaggio una volta e arriva a ciascun contatto come messaggio privato, non in un gruppo. Due regole importanti:</p>
<ul>
  <li>Il messaggio arriva <strong>solo a chi ha salvato il tuo numero</strong> in rubrica.</li>
  <li>Manda messaggi solo a chi ti ha chiesto di essere aggiornato. Un cliente che cerca un trilocale è contento di sapere che ne è arrivato uno; chi non ti ha mai chiesto nulla, no. E non inserire mai clienti in un gruppo senza chiedere: vedrebbero i numeri di tutti gli altri.</li>
</ul>
<p>Le etichette non sostituiscono un vero archivio clienti. Se i contatti diventano tanti, guarda la guida al <a href="/it/crm-immobiliare">CRM immobiliare</a>.</p>`,
    },
    {
      id: 'computer-link',
      title: 'WhatsApp Business sul computer e il link per farti scrivere',
      html: `<p><strong>Sul computer dell'ufficio</strong>: scrivere lunghi messaggi o mandare documenti è più comodo dalla tastiera. Si può collegare WhatsApp Business al computer con WhatsApp Web o con l'app per computer:</p>
<ol>
  <li>Sul computer apri <strong>web.whatsapp.com</strong> (oppure installa l'app WhatsApp per computer).</li>
  <li>Sul telefono, apri WhatsApp Business, vai nelle impostazioni e tocca <strong>Dispositivi collegati</strong>, poi <strong>Collega un dispositivo</strong>.</li>
  <li>Inquadra con il telefono il quadratino nero e bianco (il codice QR) che vedi sullo schermo del computer.</li>
</ol>
<p><strong>Il link per farti scrivere</strong>: puoi creare un link che apre direttamente una chat con te. Il formato è <em>wa.me/</em> seguito dal numero con il prefisso internazionale, senza spazi, senza zeri iniziali del prefisso e senza il segno più: per un cellulare italiano 333 1234567 diventa <em>wa.me/393331234567</em>. Mettilo nella firma delle email, sul sito, nel profilo Facebook. Puoi anche trasformarlo in codice QR e stamparlo sul cartello in vetrina: chi passa lo inquadra e ti scrive. Ne parliamo nella guida sulla <a href="/it/vetrina-agenzia-immobiliare">vetrina dell'agenzia immobiliare</a>.</p>`,
    },
    {
      id: 'mandare-immobili',
      title: 'Come mandare un immobile al cliente su WhatsApp',
      html: `<p>Il momento più importante su WhatsApp è quando mandi una casa a un cliente. Qualche regola semplice:</p>
<ul>
  <li><strong>Prima un messaggio, poi le foto</strong>: "Buongiorno signora Bianchi, è appena arrivato un trilocale in via Verdi, con terrazzo, come cercava lei. Le mando qualche foto."</li>
  <li><strong>Poche foto, le migliori</strong>: cinque o sei, non trenta. Se sono scure o storte, la guida su <a href="/it/foto-immobiliari-smartphone">come fare foto immobiliari con lo smartphone</a> ti aiuta.</li>
  <li><strong>Un riepilogo scritto</strong>: prezzo, metri quadri, piano, spese condominiali, classe energetica.</li>
  <li><strong>Una domanda finale</strong>: "Le andrebbe di vederla giovedì pomeriggio?"</li>
</ul>
<p>Ancora meglio se mandi una <strong>scheda completa</strong> invece di foto sparse. Con <a href="/it">Agente Immo</a> ogni immobile ha la sua scheda con report PDF, e dal tasto "Manda al cliente" la invii su WhatsApp in un passaggio: il cliente riceve tutto ordinato in un solo messaggio.</p>`,
    },
    {
      id: 'errori',
      title: 'Errori da evitare con WhatsApp in agenzia',
      html: `<table ${TABLE}>
  <thead><tr><th ${TH}>Errore</th><th ${TH}>Cosa fare invece</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Usare il numero personale per tutto</td><td ${TD}>Un numero di lavoro con WhatsApp Business, o almeno orari chiari</td></tr>
    <tr><td ${TD}>Vocali di tre minuti</td><td ${TD}>Messaggi scritti brevi; il vocale solo se il cliente lo usa per primo</td></tr>
    <tr><td ${TD}>Rispondere dopo due giorni</td><td ${TD}>Messaggio di benvenuto subito, risposta vera entro la giornata</td></tr>
    <tr><td ${TD}>Gruppi con tanti clienti</td><td ${TD}>Liste broadcast o messaggi singoli</td></tr>
    <tr><td ${TD}>Mandare documenti con dati personali a chiunque</td><td ${TD}>Atti, visure e documenti d'identità solo alle persone coinvolte nella trattativa</td></tr>
    <tr><td ${TD}>Messaggio di ferie mai spento</td><td ${TD}>Usa il periodo con data di fine</td></tr>
  </tbody>
</table>
<p>Non serve imparare tutto in un giorno. Comincia da tre cose: profilo, messaggio di assenza, due risposte rapide. Il resto viene con l'uso.</p>`,
    },
  ],
  faq: [
    [`WhatsApp Business è gratis?`, `Sì, l'app WhatsApp Business si scarica e si usa gratuitamente. Esistono servizi a pagamento per aziende che inviano grandi quantità di messaggi automatici, ma per un'agenzia immobiliare l'app gratuita basta.`],
    [`Posso usare WhatsApp normale e WhatsApp Business sullo stesso telefono?`, `Sì, se usi due numeri diversi: uno per l'app normale e uno per quella Business. Lo stesso numero non può stare su tutte e due le app nello stesso momento.`],
    [`Se passo a WhatsApp Business perdo le chat?`, `Di solito no: quando attivi WhatsApp Business con il numero che usavi già, l'app ti propone di trasferire le chat. Prima fai comunque un backup dalle impostazioni del WhatsApp normale, per sicurezza.`],
    [`Posso usare il numero fisso dell'agenzia?`, `Sì, WhatsApp Business permette di verificare anche un numero fisso: durante l'attivazione scegli di ricevere il codice con una chiamata invece che con l'SMS. Poi l'app la usi sul cellulare come sempre.`],
    [`Come si mette il messaggio automatico su WhatsApp Business?`, `Vai in Impostazioni, poi Strumenti per l'attività, poi Messaggio di assenza. Accendi l'interruttore, scrivi il testo, scegli quando mandarlo (sempre, in un periodo o fuori orario) e salva.`],
    [`Posso mandare lo stesso messaggio a tutti i clienti?`, `Sì, con le liste broadcast: ogni persona lo riceve come messaggio privato. Arriva solo a chi ha salvato il tuo numero, e va mandato solo a chi ti ha chiesto di essere aggiornato.`],
  ],
};

export const agenziaGoogleMaps: Guide = {
  slug: 'agenzia-immobiliare-google-maps',
  label: 'Agenzia su Google Maps',
  title: 'Come mettere l\'agenzia su Google Maps, passo passo',
  description: `Come mettere l'agenzia immobiliare su Google Maps, passo passo: creare la scheda gratis, verificarla, foto, orari e recensioni per farti trovare in zona.`,
  h1: 'Come mettere l\'agenzia immobiliare su Google Maps: guida passo passo',
  intro: `Per mettere l'agenzia su Google Maps serve creare la scheda gratuita di Google, che si chiama Profilo dell'attività su Google (prima si chiamava Google My Business). Si fa dal sito business.google.com, in una ventina di minuti, poi Google chiede di verificare che l'agenzia sia davvero tua. Da quel momento chi cerca "agenzia immobiliare" nella tua zona ti trova sulla mappa, con telefono, orari e recensioni.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'perche',
      title: 'Perché mettere l\'agenzia immobiliare su Google Maps',
      html: `<p>Pensa a quante volte senti un cliente dire "vi ho cercati su Google". Oggi chi deve vendere casa spesso fa così: prende il telefono e scrive "agenzia immobiliare" più il nome del paese, oppure "agenzia immobiliare vicino a me". Google mostra in alto una piccola mappa con tre o quattro agenzie. Quelle sono le schede Google.</p>
<p>Avere la scheda significa:</p>
<ul>
  <li><strong>Farti trovare</strong> da chi non conosce ancora l'agenzia, anche se sei in zona da 25 anni.</li>
  <li><strong>Essere chiamato con un tocco</strong>: dalla scheda il cliente telefona, apre la strada con il navigatore o visita il tuo sito.</li>
  <li><strong>Mostrare le recensioni</strong>: il passaparola che hai sempre avuto, scritto e visibile a tutti.</li>
</ul>
<p>Ed è <strong>gratis</strong>. Non serve un sito, non serve essere esperti. A volte la scheda esiste già, creata da Google o da un cliente: in quel caso non va rifatta, va <strong>rivendicata</strong>, cioè dichiarata tua. Vediamo come.</p>
<p>Per un <a href="/it/agente-immobiliare">agente immobiliare</a> che lavora su una zona precisa, la scheda è spesso il primo posto in cui un proprietario lo trova.</p>`,
    },
    {
      id: 'controlla',
      title: 'Prima di tutto: controlla se la tua agenzia è già su Google',
      html: `<ol>
  <li>Apri Google sul telefono o sul computer.</li>
  <li>Scrivi il nome della tua agenzia e il paese, per esempio "Immobiliare Rossi Castelfranco".</li>
  <li>Guarda a destra (sul computer) o in alto (sul telefono): se compare un riquadro con il nome, la mappa e l'indirizzo, la scheda esiste già.</li>
  <li>Se c'è, cerca la scritta <strong>Rivendica questa attività</strong> o <strong>Sei il proprietario di questa attività?</strong> e toccala. Poi segui gli stessi passi di verifica che trovi più sotto.</li>
  <li>Se non c'è nulla, passa al prossimo paragrafo e creala da zero.</li>
</ol>
<p>Ti serve un <strong>account Google</strong>, cioè un indirizzo Gmail. Se non lo hai, puoi crearlo durante la procedura. Consiglio pratico: usa un indirizzo dell'agenzia, non quello personale, e segna la password in un posto sicuro. Se un domani entra un collaboratore, puoi aggiungerlo come gestore della scheda senza dargli la tua password.</p>`,
    },
    {
      id: 'creare-scheda',
      title: 'Come aggiungere l\'attività su Google Maps: i passaggi',
      html: `<p>Le schermate cambiano ogni tanto, ma i passaggi sono sempre questi:</p>
<ol>
  <li>Apri il sito <strong>business.google.com</strong> e tocca il pulsante per aggiungere la tua attività (la guida di Google indica l'indirizzo business.google.com/add).</li>
  <li>Accedi con il tuo account Google.</li>
  <li>Scrivi il <strong>nome dell'agenzia</strong> esattamente come è scritto sull'insegna. Non aggiungere parole tipo "la migliore agenzia di Treviso": Google vuole il nome vero, e il nome dell'insegna ti servirà anche per la verifica.</li>
  <li>Scegli la <strong>categoria</strong>: scrivi "Agenzia immobiliare" e selezionala dall'elenco.</li>
  <li>Indica che hai una <strong>sede che i clienti possono visitare</strong> e scrivi l'indirizzo dell'ufficio. Controlla che la puntina sulla mappa sia proprio sul tuo portone.</li>
  <li>Se lavori anche fuori dall'ufficio, aggiungi le <strong>zone in cui lavori</strong>: il tuo paese e quelli vicini.</li>
  <li>Inserisci il <strong>numero di telefono</strong> e, se lo hai, il <strong>sito</strong>.</li>
  <li>Scegli come <strong>verificare</strong> l'attività (vedi il paragrafo successivo).</li>
</ol>
<p><strong>Lavori senza ufficio, da casa?</strong> Puoi comunque avere la scheda: in quel caso indichi che vai tu dai clienti, scegli le zone servite e l'indirizzo di casa non compare sulla mappa.</p>
<p>Aggiungere o rivendicare la scheda è gratuito. Diffida di chi ti telefona dicendo di essere "Google" e chiede soldi per tenere attiva la scheda: Google non chiede pagamenti per questo.</p>`,
    },
    {
      id: 'verifica',
      title: 'Verificare la scheda Google: come funziona il video',
      html: `<p>Prima di mostrare la scheda a tutti, Google vuole essere sicuro che l'agenzia esista e che sia tua. Il metodo lo propone Google, in base al tipo di attività e alla zona: non sempre lo puoi scegliere. Oggi il più comune è il <strong>video</strong>.</p>
<p>Per la verifica con video, secondo la guida ufficiale di Google ti serve mostrare in un'unica ripresa, senza tagli:</p>
<ol>
  <li><strong>Dove sei</strong>: la strada, i negozi vicini, il numero civico. Inizia da fuori.</li>
  <li><strong>L'insegna</strong> con il nome dell'agenzia, uguale a quello che hai scritto nella scheda.</li>
  <li><strong>Che l'agenzia è tua</strong>: qualcosa a cui accede solo chi ci lavora. Per esempio apri la porta dell'ufficio con le tue chiavi, entra, mostra la scrivania, il computer acceso con il gestionale, l'archivio delle pratiche.</li>
</ol>
<p>Consigli pratici:</p>
<ul>
  <li>Fallo di giorno, con buona luce, tenendo il telefono fermo.</li>
  <li>Non serve un video lungo: basta che si vedano bene i tre punti.</li>
  <li>Se Google propone una <strong>videochiamata in diretta</strong>, va fatta durante gli orari di apertura, in agenzia.</li>
</ul>
<p>Dopo l'invio, Google controlla. Di solito ci vuole qualche giorno. Se la verifica non va a buon fine, riprova seguendo le indicazioni che ti mostra, oppure contatta l'assistenza dalla scheda stessa.</p>`,
    },
    {
      id: 'completare',
      title: 'Come completare la scheda Google dell\'agenzia',
      html: `<p>Una scheda vuota serve a poco. Una scheda completa fa telefonare. Ecco cosa compilare, dalla pagina della tua scheda (quando sei collegato con il tuo account, cercando il nome dell'agenzia su Google compaiono i pulsanti per modificarla):</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Cosa</th><th ${TH}>Come farlo bene</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Orari</td><td ${TD}>Gli stessi della porta. Aggiorna gli orari speciali per ferie e festività</td></tr>
    <tr><td ${TD}>Descrizione</td><td ${TD}>Chi sei, da quanto, dove lavori, cosa fai: "Agenzia di famiglia a Castelfranco dal 1998. Vendite e affitti in centro e nelle frazioni. Valutazioni gratuite."</td></tr>
    <tr><td ${TD}>Foto della facciata</td><td ${TD}>L'ingresso con l'insegna, di giorno, così il cliente la riconosce</td></tr>
    <tr><td ${TD}>Foto dell'interno</td><td ${TD}>L'ufficio in ordine, la vetrina</td></tr>
    <tr><td ${TD}>Foto delle persone</td><td ${TD}>Tu e i collaboratori. Le persone si fidano delle facce</td></tr>
    <tr><td ${TD}>Servizi</td><td ${TD}>Compravendita, affitti, valutazioni, consulenza</td></tr>
    <tr><td ${TD}>Sito o link</td><td ${TD}>Il tuo sito, o la pagina con i tuoi immobili</td></tr>
  </tbody>
</table>
<p>Usa gli stessi nome, indirizzo e telefono su scheda Google, sito, WhatsApp e biglietti da visita. Se hai appena configurato <a href="/it/whatsapp-business-agenzia-immobiliare">WhatsApp Business</a>, copia gli stessi dati.</p>
<p>E il sito? Se non ce l'hai, la scheda funziona lo stesso. Se vuoi un posto dove mandare chi ti trova, con <a href="/it">Agente Immo</a> (piani Plus e Pro) hai un sito da agente già pronto: scegli un modello, ogni immobile che carichi va online con la sua pagina e le richieste arrivano a te. Basta poi metterne l'indirizzo nella scheda Google. Più dettagli nella guida al <a href="/it/sito-web-agente-immobiliare">sito web per agente immobiliare</a>.</p>`,
    },
    {
      id: 'tenere-viva',
      title: 'Farsi trovare su Google Maps: tenere viva la scheda',
      html: `<p>La scheda non è un cartello da appendere e dimenticare. Google mostra più volentieri le attività curate e con recensioni vere. Bastano dieci minuti a settimana:</p>
<ol>
  <li><strong>Rispondi alle recensioni</strong>, sia quelle belle sia quelle brutte. Come farlo lo spieghiamo nella guida su <a href="/it/recensioni-google-agenzia-immobiliare">come chiedere e gestire le recensioni Google</a>.</li>
  <li><strong>Aggiungi foto nuove</strong> ogni tanto: la vetrina rinnovata, il cartello "venduto", una giornata in agenzia.</li>
  <li><strong>Pubblica un aggiornamento</strong> quando c'è una novità: un immobile appena arrivato, una casa venduta, un orario cambiato. La scheda permette di pubblicare brevi post con foto.</li>
  <li><strong>Rispondi alle domande</strong> che i clienti fanno sulla scheda, se te ne arrivano.</li>
  <li><strong>Controlla i dati</strong> una volta al mese: a volte Google o gli utenti propongono modifiche, per esempio un orario sbagliato. Se ricevi un avviso, controlla subito.</li>
</ol>
<p>Per le foto dell'agenzia e degli immobili non serve un fotografo: con il telefono e qualche accorgimento vengono bene. Leggi <a href="/it/foto-immobiliari-smartphone">come fare foto immobiliari con lo smartphone</a>.</p>`,
    },
    {
      id: 'errori',
      title: 'Errori comuni con la scheda Google di un\'agenzia',
      html: `<ul>
  <li><strong>Nome con parole in più</strong> ("Immobiliare Rossi case in vendita Treviso economiche"): Google può sospendere la scheda. Metti il nome dell'insegna e basta.</li>
  <li><strong>Due schede per la stessa agenzia</strong>: se ne trovi una doppia, segnalala invece di tenerle entrambe.</li>
  <li><strong>Scheda creata dal nipote con la sua email</strong>: il giorno che lui cambia città, tu non riesci più a entrare. La scheda deve essere legata a un account dell'agenzia, con te come proprietario.</li>
  <li><strong>Orari sbagliati</strong>: il cliente arriva, trova chiuso, e non torna.</li>
  <li><strong>Recensioni comprate o scritte dagli amici</strong>: Google le vieta e può toglierle. Meglio poche ma vere.</li>
</ul>
<p>Non serve fare tutto oggi. Se riesci, crea e verifica la scheda questa settimana; foto e descrizione la prossima. Il resto viene da sé.</p>`,
    },
  ],
  faq: [
    [`Quanto costa mettere l'agenzia su Google Maps?`, `Niente. Creare, rivendicare e gestire il Profilo dell'attività su Google è gratuito. Google offre anche pubblicità a pagamento, ma è una cosa separata e facoltativa.`],
    [`Cos'è Google My Business?`, `È il vecchio nome della scheda gratuita di Google per le attività. Oggi si chiama Profilo dell'attività su Google (in inglese Google Business Profile). È la scheda che compare su Google e su Google Maps con indirizzo, orari e recensioni.`],
    [`La mia agenzia è già su Google ma non l'ho messa io: cosa faccio?`, `Cerca il nome dell'agenzia su Google, apri la scheda e tocca "Rivendica questa attività" o "Sei il proprietario di questa attività?". Poi segui i passaggi di verifica. Non crearne una nuova, perché avresti due schede.`],
    [`Quanto tempo ci vuole per comparire su Google Maps?`, `Dopo la verifica di solito servono alcuni giorni. Comparire in alto nelle ricerche richiede più tempo e dipende da quanto la scheda è completa, dalla vicinanza di chi cerca e dalle recensioni.`],
    [`Posso avere la scheda Google se lavoro da casa?`, `Sì. Indichi che vai tu dai clienti e scegli le zone in cui lavori: la scheda compare senza mostrare l'indirizzo di casa.`],
    [`Come si verifica la scheda con il video?`, `Google chiede un video senza tagli che mostri la zona, l'insegna con il nome dell'agenzia e qualcosa che prova che ci lavori, per esempio mentre apri la porta con le chiavi ed entri nell'ufficio. Il metodo di verifica lo propone Google in base alla tua attività.`],
  ],
};

export const recensioniGoogleAgenzia: Guide = {
  slug: 'recensioni-google-agenzia-immobiliare',
  label: 'Recensioni Google per agenzie',
  title: 'Come chiedere recensioni su Google: guida per agenzie',
  description: `Come chiedere recensioni su Google per l'agenzia immobiliare: il link da mandare, messaggi WhatsApp pronti e come rispondere alle recensioni negative.`,
  h1: 'Come chiedere recensioni su Google per l\'agenzia immobiliare, e come rispondere',
  intro: `Il modo più semplice per avere recensioni su Google è chiederle, al momento giusto, con un link diretto. Lo prendi dalla scheda Google dell'agenzia e lo mandi su WhatsApp al cliente contento, di solito dopo il rogito o la firma del contratto d'affitto. Qui trovi i passaggi per ottenere il link, i messaggi pronti da copiare e come rispondere anche alle recensioni negative senza perdere la calma.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'perche',
      title: 'Perché le recensioni Google contano per un\'agenzia immobiliare',
      html: `<p>Una volta bastava il passaparola: "Vai da Rossi, è una persona seria". Oggi il passaparola c'è ancora, ma passa anche da Google. Il figlio del proprietario che deve vendere la casa della mamma cerca le agenzie della zona e guarda le stelline. Fra due agenzie che non conosce, chiama quella con più recensioni vere e recenti.</p>
<p>Le recensioni servono a tre cose:</p>
<ul>
  <li><strong>Fiducia</strong>: un proprietario ti affida la cosa più preziosa che ha. Leggere che altri si sono trovati bene lo tranquillizza.</li>
  <li><strong>Visibilità</strong>: le recensioni sono uno degli elementi che Google considera per le ricerche locali, insieme a quanto la scheda è completa e alla vicinanza.</li>
  <li><strong>Argomento all'appuntamento</strong>: durante l'acquisizione puoi dire "guardi cosa scrivono i clienti", invece di dire "siamo bravi".</li>
</ul>
<p>Per avere recensioni serve prima la scheda Google. Se non ce l'hai ancora, parti dalla guida su <a href="/it/agenzia-immobiliare-google-maps">come mettere l'agenzia su Google Maps</a>.</p>
<p>Per un <a href="/it/agente-immobiliare">agente immobiliare</a> sono la versione scritta del passaparola: il motivo per cui un proprietario che non ti conosce ti chiama.</p>`,
    },
    {
      id: 'link',
      title: 'Come avere il link per le recensioni Google',
      html: `<p>Il segreto è non dire al cliente "cercaci su Google e lascia una recensione": troppi passaggi, non lo farà. Mandagli invece un <strong>link diretto</strong> che apre subito la finestra con le stelline.</p>
<ol>
  <li>Apri Google sul telefono o sul computer, collegato con l'account dell'agenzia.</li>
  <li>Cerca il nome della tua agenzia: compare la tua scheda con i pulsanti di gestione.</li>
  <li>Tocca <strong>Leggi recensioni</strong>.</li>
  <li>Tocca <strong>Ottieni altre recensioni</strong> (la voce può cambiare leggermente nel tempo, ma è sempre vicina alle recensioni).</li>
  <li>Copia il <strong>link</strong> oppure scarica il <strong>codice QR</strong>, cioè il quadratino da inquadrare con la fotocamera del telefono.</li>
</ol>
<p>Dove usarli:</p>
<ul>
  <li>Il <strong>link</strong> nei messaggi WhatsApp e nelle email.</li>
  <li>Il <strong>codice QR</strong> stampato su un cartoncino sulla scrivania, nella cartellina che consegni al rogito, sul retro del biglietto da visita.</li>
</ul>
<p>Salva il link come risposta rapida su WhatsApp Business, così lo mandi in due tocchi. Come si fa lo trovi nella guida su <a href="/it/whatsapp-business-agenzia-immobiliare">come usare WhatsApp Business in agenzia</a>.</p>`,
    },
    {
      id: 'quando',
      title: 'Quando chiedere una recensione al cliente',
      html: `<p>Il momento giusto è quando il cliente è <strong>contento e ti sta ringraziando</strong>. In agenzia questi momenti sono chiari:</p>
<ul>
  <li><strong>Dopo il rogito</strong>, quando acquirente e venditore escono dallo studio del notaio.</li>
  <li><strong>Alla consegna delle chiavi</strong>, per chi compra.</li>
  <li><strong>Dopo la firma del contratto d'affitto</strong>, sia con il proprietario sia con l'inquilino.</li>
  <li><strong>Quando il cliente ti fa un complimento</strong>: "Grazie, senza di lei non ce l'avremmo fatta". È il momento perfetto.</li>
</ul>
<p>Chiedi a voce, guardando la persona, e poi manda il link lo stesso giorno: "Le mando ora il link, così non deve cercare nulla". Se aspetti una settimana, l'entusiasmo è passato.</p>
<p>Non dimenticare <strong>i venditori</strong>. Sono le recensioni più utili, perché le legge proprio chi deve affidarti una casa. Un venditore che racconta come hai seguito la vendita vale più di qualsiasi pubblicità per <a href="/it/acquisire-incarichi-immobiliari">acquisire nuovi incarichi</a>.</p>`,
    },
    {
      id: 'messaggi',
      title: 'Messaggio WhatsApp per chiedere una recensione: esempi pronti',
      html: `<p>Copia, cambia i nomi e mandali. Brevi, gentili, con il link in fondo.</p>
<p><strong>Dopo il rogito, al venditore</strong></p>
<p><em>"Buongiorno signor Bianchi, è stato un piacere seguire con lei la vendita della casa di via Manzoni. Se si è trovato bene, mi farebbe un grande favore lasciando due righe su Google: aiutano altre famiglie che devono vendere a scegliere con tranquillità. Ci vuole un minuto: [link]. Grazie ancora, Mario"</em></p>
<p><strong>Dopo il rogito, all'acquirente</strong></p>
<p><em>"Buongiorno Giulia e Marco, congratulazioni per la vostra nuova casa! Se vi siete trovati bene con noi, mi fate un piacere a scriverlo qui: [link]. E per qualsiasi cosa nei prossimi mesi, io ci sono."</em></p>
<p><strong>Dopo un affitto</strong></p>
<p><em>"Buonasera signora Ferri, contratto firmato e chiavi consegnate. Se è soddisfatta di come abbiamo seguito tutto, le chiedo un piccolo favore: una recensione su Google, qui [link]. Grazie!"</em></p>
<p><strong>Promemoria gentile (una volta sola, dopo qualche giorno)</strong></p>
<p><em>"Buongiorno, le riscrivo solo per lasciarle di nuovo il link per la recensione, nel caso le fosse sfuggito: [link]. Nessun problema se non ha tempo. Buona giornata!"</em></p>
<p>Un solo promemoria, mai di più. Insistere rovina il buon ricordo che il cliente ha di te.</p>`,
    },
    {
      id: 'regole',
      title: 'Cosa non fare: le regole di Google sulle recensioni',
      html: `<p>Le regole di Google sono chiare e conviene rispettarle, perché le recensioni false possono essere rimosse e la scheda può avere problemi.</p>
<ul>
  <li><strong>Niente regali in cambio</strong>: Google vieta di offrire sconti, buoni, omaggi o soldi per ottenere una recensione (o per farne togliere una negativa). Anche il cesto di Natale va benissimo, ma non legato alla recensione.</li>
  <li><strong>Niente recensioni scritte da te</strong>, dai collaboratori o dai parenti.</li>
  <li><strong>Niente recensioni comprate</strong> da servizi che le vendono.</li>
  <li><strong>Non chiedere solo ai clienti contenti di sicuro</strong> con frasi tipo "solo se mi dà 5 stelle": chiedi un parere sincero.</li>
</ul>
<p>Per lasciare una recensione il cliente deve avere un account Google. Molti ce l'hanno senza saperlo: se usa un telefono Android o la posta Gmail, è già dentro. Se ti dice "non ci riesco", aiutalo con calma, ma non scriverla tu al posto suo dal suo telefono.</p>`,
    },
    {
      id: 'rispondere',
      title: 'Come rispondere alle recensioni su Google',
      html: `<p>Rispondere a tutte le recensioni fa vedere che dietro l'agenzia ci sono persone. Per rispondere la scheda deve essere verificata. I passaggi:</p>
<ol>
  <li>Cerca su Google il nome della tua agenzia, collegato con l'account dell'agenzia.</li>
  <li>Tocca <strong>Leggi recensioni</strong>.</li>
  <li>Sotto la recensione tocca <strong>Rispondi</strong>.</li>
  <li>Scrivi la risposta e tocca di nuovo <strong>Rispondi</strong>.</li>
</ol>
<p>La risposta compare a nome dell'agenzia e il cliente riceve un avviso. Puoi sempre modificarla o cancellarla.</p>
<p><strong>Risposta a una recensione positiva</strong>: breve, personale, mai copia e incolla uguale per tutti.</p>
<p><em>"Grazie signor Bianchi, è stato un piacere seguire la vendita della casa di sua mamma. Le auguriamo il meglio, e se avrà bisogno sa dove trovarci. Mario"</em></p>`,
    },
    {
      id: 'negative',
      title: 'Come rispondere alle recensioni negative su Google: esempi',
      html: `<p>Una recensione negativa fa male, soprattutto dopo anni di lavoro onesto. Ma chi legge non guarda solo la critica: guarda <strong>come rispondi</strong>. Una risposta calma e gentile può convincere più di dieci recensioni positive.</p>
<p>Cinque regole:</p>
<ol>
  <li><strong>Aspetta un giorno</strong> prima di rispondere. Mai a caldo.</li>
  <li><strong>Ringrazia</strong> per il parere, anche se ti sembra ingiusto.</li>
  <li><strong>Non entrare nei dettagli</strong> della trattativa e non scrivere dati personali, cifre o nomi di altre persone.</li>
  <li><strong>Proponi di parlarne</strong> a voce, in agenzia o al telefono.</li>
  <li><strong>Resta breve</strong>: tre o quattro righe.</li>
</ol>
<p><strong>Esempio, cliente scontento dei tempi</strong></p>
<p><em>"Gentile signora, grazie per il suo parere. Ci dispiace che i tempi della vendita le siano sembrati lunghi: capiamo quanto sia faticoso aspettare. Ci farebbe piacere parlarne di persona, può chiamarmi in agenzia quando vuole. Mario Rossi"</em></p>
<p><strong>Esempio, persona che non è mai stata vostra cliente</strong></p>
<p><em>"Buongiorno, non troviamo il suo nome tra i nostri clienti e non riusciamo a capire a quale situazione si riferisca. Se vuole, ci contatti in agenzia: saremo felici di chiarire."</em></p>
<p>Se una recensione è <strong>offensiva, falsa o non c'entra nulla</strong> con l'agenzia, puoi segnalarla a Google dalla scheda, con l'opzione per segnalare la recensione. Google la valuta secondo le sue regole: non sempre la toglie, quindi rispondi comunque con educazione.</p>`,
    },
    {
      id: 'abitudine',
      title: 'Come avere più recensioni su Google, ogni mese',
      html: `<p>Le recensioni arrivano quando chiederle diventa un'abitudine, come preparare la cartellina per il notaio. Una piccola routine:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Quando</th><th ${TH}>Cosa fare</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Il giorno del rogito o della firma</td><td ${TD}>Chiedi a voce e manda il link su WhatsApp</td></tr>
    <tr><td ${TD}>Dopo qualche giorno</td><td ${TD}>Un solo promemoria gentile, se non l'ha ancora fatto</td></tr>
    <tr><td ${TD}>Quando arriva la recensione</td><td ${TD}>Rispondi entro un paio di giorni</td></tr>
    <tr><td ${TD}>Una volta al mese</td><td ${TD}>Rileggi le recensioni e rispondi a quelle rimaste</td></tr>
  </tbody>
</table>
<p>Le recensioni migliori raccontano qualcosa di concreto: "ci ha aiutato a sistemare i documenti", "ha venduto in poche settimane", "le foto della casa erano bellissime". Dai ai clienti qualcosa da raccontare. Per esempio, se al proprietario fai vedere la sua stanza vuota arredata in foto con <a href="/it">Agente Immo</a>, con lo slider prima e dopo, è una di quelle cose che si ricorda e che spesso scrive. Per le basi leggi la guida all'<a href="/it/home-staging-virtuale">home staging virtuale</a>.</p>`,
    },
  ],
  faq: [
    [`Come faccio a chiedere una recensione su Google a un cliente?`, `Prendi il link diretto dalla tua scheda Google (Leggi recensioni, poi Ottieni altre recensioni) e mandalo su WhatsApp o per email con un messaggio breve e gentile, il giorno del rogito o della firma.`],
    [`Posso offrire un omaggio in cambio di una recensione?`, `No. Le regole di Google vietano di offrire sconti, regali o soldi in cambio di recensioni. Puoi fare un regalo ai clienti, ma non legato alla recensione.`],
    [`Come rispondo a una recensione negativa?`, `Aspetta un giorno, ringrazia, non entrare nei dettagli della trattativa, proponi di parlarne di persona e resta breve. Chi legge giudica soprattutto il tono della tua risposta.`],
    [`Si può cancellare una recensione negativa su Google?`, `Tu non puoi cancellarla. Se è offensiva, falsa o non riguarda la tua agenzia puoi segnalarla a Google dalla scheda: Google la valuta secondo le sue regole e decide se rimuoverla.`],
    [`Il cliente dice che non riesce a lasciare la recensione: perché?`, `Per lasciare una recensione serve un account Google. Se usa un telefono Android o Gmail ce l'ha già. Aiutalo ad accedere, ma non scrivere tu la recensione al posto suo.`],
    [`Quante recensioni servono a un'agenzia immobiliare?`, `Non c'è un numero giusto. Contano recensioni vere, recenti e con qualche dettaglio concreto. Meglio poche ma vere, chieste con costanza dopo ogni trattativa conclusa.`],
  ],
};

export const vetrinaAgenziaImmobiliare: Guide = {
  slug: 'vetrina-agenzia-immobiliare',
  label: 'Vetrina dell\'agenzia immobiliare',
  title: 'Vetrina agenzia immobiliare: conviene ancora? Come farla',
  description: `Vetrina agenzia immobiliare: conviene ancora nel 2026? Come organizzarla, cartelli, monitor, QR code per farti scrivere e gli errori da evitare.`,
  h1: 'Vetrina agenzia immobiliare: conviene ancora e come farla funzionare oggi',
  intro: `Sì, la vetrina dell'agenzia immobiliare conviene ancora, se è curata e aggiornata. Oggi chi cerca casa guarda soprattutto online, ma la vetrina lavora su un'altra persona: il proprietario del quartiere che passa ogni giorno e un giorno deciderà di vendere. Qui trovi come organizzarla, cartelli o monitor, come collegarla al telefono con un codice QR e gli errori da evitare.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'conviene',
      title: 'Conviene ancora la vetrina in agenzia?',
      html: `<p>Molti colleghi se lo chiedono: "Se tutti guardano gli annunci sul telefono, a cosa serve la vetrina?" La risposta onesta è che la vetrina <strong>non serve più tanto a vendere le case esposte</strong>. Chi cerca un trilocale lo cerca sui portali. Ma la vetrina fa altre tre cose che il telefono non fa:</p>
<ul>
  <li><strong>Ti fa conoscere ai proprietari della zona</strong>. La signora che va al mercato e passa davanti all'agenzia ogni sabato, il giorno che deve vendere la casa della madre si ricorda di te. È acquisizione, non vendita.</li>
  <li><strong>Dice che sei vivo</strong>. Una vetrina piena di case nuove e di cartelli "venduto" dice: qui si lavora. Una vetrina con fogli ingialliti dice il contrario.</li>
  <li><strong>Fa entrare chi preferisce il contatto di persona</strong>: chi non usa internet, chi vuole guardarti in faccia prima di fidarsi.</li>
</ul>
<p>Quindi la domanda giusta non è "vetrina sì o no", ma "<strong>la mia vetrina lavora o è solo arredamento?</strong>". Se hai un ufficio su strada, la vetrina c'è già e la paghi già con l'affitto: tanto vale farla lavorare. Se invece lavori senza ufficio, puoi farne a meno e concentrarti su scheda Google e online.</p>
<p>Una vetrina che lavora mostra anche chi sei: per un <a href="/it/agente-immobiliare">agente immobiliare</a> di quartiere è una pubblicità che i proprietari della zona vedono ogni giorno.</p>`,
    },
    {
      id: 'cosa-mettere',
      title: 'Cosa mettere nella vetrina dell\'agenzia immobiliare',
      html: `<p>Pensa alla vetrina come a un giornale del quartiere, con poche notizie ben scelte:</p>
<ol>
  <li><strong>Le case migliori, non tutte</strong>: meglio otto immobili ben presentati che trenta fogli attaccati uno sull'altro.</li>
  <li><strong>I "venduto" e gli "affittato"</strong>: sono la prova che lavori. Lascia il cartello sopra la foto per qualche settimana.</li>
  <li><strong>Un invito per i proprietari</strong>: "Vuoi sapere quanto vale la tua casa? Valutazione gratuita, entra o scrivici". È il cartello più importante di tutti.</li>
  <li><strong>Chi sei</strong>: una foto tua e dei collaboratori, con nome. "Mario, in agenzia dal 1999". Le persone si fidano delle facce.</li>
  <li><strong>Come contattarti quando sei chiuso</strong>: telefono e codice QR per WhatsApp, ben visibili.</li>
</ol>
<p>Per il cartello della valutazione, la guida su <a href="/it/valutazione-immobile-acquisizione">come usare la valutazione per acquisire immobili</a> ti dà le idee giuste su cosa promettere e cosa no.</p>`,
    },
    {
      id: 'cartelli',
      title: 'Cartelli vetrina agenzia immobiliare: come farli',
      html: `<p>Ogni scheda in vetrina deve farsi leggere <strong>da due metri di distanza, in tre secondi</strong>. Chi passa non si ferma a leggere un romanzo. Regole semplici:</p>
<ul>
  <li><strong>Una foto grande e luminosa</strong>, la migliore della casa. Non sei foto piccole.</li>
  <li><strong>Poche informazioni, scritte grandi</strong>: zona, tipo (trilocale, villetta), metri quadri, prezzo. Una riga con la cosa più bella: "terrazzo vista colline", "giardino privato".</li>
  <li><strong>La classe energetica</strong>: anche in vetrina, come in tutti gli annunci di vendita e affitto, vanno indicati i dati energetici. Trovi cosa scrivere nella guida su <a href="/it/ape-annunci-immobiliari">APE negli annunci immobiliari</a>.</li>
  <li><strong>Un riferimento</strong> (codice o nome) per chiedere informazioni.</li>
  <li><strong>Stesso modello per tutte le schede</strong>: stesso formato, stessi colori, stesso carattere. La vetrina sembra subito ordinata.</li>
</ul>
<p>Formato: la maggior parte delle agenzie usa fogli A4 o A3 in espositori trasparenti appesi o appoggiati. Le schede le prepari dal computer con il tuo gestionale o con un modello di testo, e le stampi in agenzia o in copisteria. Se la foto viene male stampata, il problema di solito è la foto di partenza: leggi <a href="/it/migliorare-foto-annuncio-immobiliare">come migliorare le foto di un annuncio</a>.</p>
<p><strong>Le case vuote</strong> sono le più difficili da rendere in vetrina: una stanza spoglia, stampata, non dice niente. Qui aiuta una foto arredata in modo virtuale, con la foto vera accanto e la scritta "arredo virtuale". Con <a href="/it">Agente Immo</a> carichi la foto, scrivi "arredala in stile moderno" e in poco tempo hai la versione arredata da stampare vicino all'originale.</p>`,
    },
    {
      id: 'monitor',
      title: 'Monitor in vetrina per agenzia immobiliare: serve?',
      html: `<p>Molte agenzie hanno messo uno schermo in vetrina, al posto o accanto ai cartelli. Pro e contro:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Cartelli stampati</th><th ${TH}>Monitor</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Costo iniziale</strong></td><td ${TD}>Basso: stampa ed espositori</td><td ${TD}>Più alto: schermo adatto alla vetrina e installazione</td></tr>
    <tr><td ${TD}><strong>Aggiornare</strong></td><td ${TD}>Ristampi e cambi a mano</td><td ${TD}>Cambi le immagini dal computer o da una chiavetta</td></tr>
    <tr><td ${TD}><strong>Di notte</strong></td><td ${TD}>Serve una buona luce</td><td ${TD}>Si vede bene, ma consuma corrente se resta acceso</td></tr>
    <tr><td ${TD}><strong>Quanti immobili</strong></td><td ${TD}>Quelli che entrano nello spazio</td><td ${TD}>Molti, a rotazione</td></tr>
    <tr><td ${TD}><strong>Video</strong></td><td ${TD}>No</td><td ${TD}>Sì: attirano l'occhio di chi passa</td></tr>
  </tbody>
</table>
<p>Se scegli il monitor, tre consigli:</p>
<ol>
  <li>Scegli uno schermo pensato per stare in vetrina: deve essere luminoso abbastanza da vedersi anche con il sole sul vetro. Fatti consigliare da un negozio di elettronica o da un installatore.</li>
  <li>Ogni immagine deve restare ferma almeno qualche secondo: chi passa deve fare in tempo a leggere il prezzo.</li>
  <li>Imposta l'accensione e lo spegnimento automatici, così non resta acceso tutta la notte se non vuoi.</li>
</ol>
<p><strong>Cosa far girare sul monitor</strong>: oltre alle foto, i video brevi funzionano molto bene, soprattutto i "prima e dopo" in cui una stanza vuota si arreda. Con Agente Immo li crei dalle foto, con la musica inclusa e senza montaggio: gli stessi video che pubblichi sui social puoi farli girare in vetrina. Per le idee leggi la guida sui <a href="/it/video-immobiliari-social">video immobiliari per i social</a>.</p>
<p><strong>Un'informazione pratica</strong>: insegne, cartelli e schermi visibili dalla strada possono essere soggetti a tributi comunali (il canone unico, che dal 2021 ha preso il posto della vecchia imposta sulla pubblicità). Le regole cambiano da Comune a Comune: prima di installare un monitor chiedi all'ufficio tributi o al tuo commercialista.</p>`,
    },
    {
      id: 'qr-code',
      title: 'Il codice QR in vetrina: farti scrivere anche quando sei chiuso',
      html: `<p>La sera e la domenica la gente passeggia e guarda le vetrine, ma l'agenzia è chiusa. Il <strong>codice QR</strong>, quel quadratino a puntini che si inquadra con la fotocamera del telefono, permette a chi passa di scriverti subito.</p>
<p>Come farlo, passo passo:</p>
<ol>
  <li>Prepara il link della tua chat WhatsApp: <em>wa.me/</em> seguito dal numero con il 39 davanti, senza spazi (per esempio <em>wa.me/393331234567</em>). I dettagli sono nella guida su <a href="/it/whatsapp-business-agenzia-immobiliare">WhatsApp Business in agenzia</a>.</li>
  <li>Cerca su Google "generatore QR code gratis": ci sono molti siti che lo fanno. Incolla il link e scarica l'immagine.</li>
  <li><strong>Provalo</strong> con il tuo telefono prima di stamparlo: deve aprirsi la chat con il tuo numero.</li>
  <li>Stampalo grande, almeno come un palmo di mano, su un cartello con scritto: "Agenzia chiusa? Inquadra e scrivici su WhatsApp, ti rispondiamo noi".</li>
  <li>Attaccalo all'altezza degli occhi, vicino alla porta.</li>
</ol>
<p>Puoi fare un secondo codice QR che porta alla tua scheda Google o al tuo sito, dove ci sono tutti gli immobili. Così la vetrina mostra le case migliori, e il resto si guarda dal telefono.</p>
<p>Collegalo al <strong>messaggio di benvenuto</strong> di WhatsApp Business: chi ti scrive di sera riceve subito una risposta gentile e sa che lo richiamerai.</p>`,
    },
    {
      id: 'manutenzione',
      title: 'Vetrina agenzia: ogni quanto cambiarla',
      html: `<p>Una vetrina ferma è peggio di una vetrina vuota. Una piccola routine:</p>
<ul>
  <li><strong>Ogni settimana</strong>: togli le case vendute (o mettici sopra "venduto"), aggiungi le nuove, controlla che i prezzi siano aggiornati.</li>
  <li><strong>Ogni settimana</strong>: pulisci il vetro, dentro e fuori. Sembra banale, ma una vetrina sporca dice "trascuratezza".</li>
  <li><strong>Ogni mese</strong>: cambia la disposizione. Chi passa ogni giorno smette di guardare ciò che non cambia mai.</li>
  <li><strong>Ogni stagione</strong>: rinnova il cartello per i proprietari (valutazione gratuita) con una frase nuova.</li>
</ul>
<p>Controlla anche le <strong>luci</strong>: una vetrina illuminata la sera viene vista da chi passeggia dopo cena, che spesso è proprio chi ha il tempo di guardare.</p>`,
    },
    {
      id: 'errori',
      title: 'Errori da evitare nella vetrina dell\'agenzia',
      html: `<ul>
  <li><strong>Fogli scoloriti dal sole</strong>: le foto stampate sbiadiscono in poche settimane se battute dal sole. Ristampa.</li>
  <li><strong>Case vendute da mesi</strong> lasciate come se fossero disponibili: il cliente chiama, scopre che non c'è più e pensa male.</li>
  <li><strong>Troppa roba</strong>: trenta schede attaccate fanno sembrare la vetrina un muro di carta.</li>
  <li><strong>Prezzi scritti a mano e corretti</strong> con la penna: danno l'idea della svendita.</li>
  <li><strong>Nessun contatto visibile</strong> per quando sei chiuso.</li>
  <li><strong>Foto arredate virtualmente senza dirlo</strong>: scrivi sempre "arredo virtuale" e metti la foto reale accanto. Le regole sono nella guida sul <a href="/it/virtual-staging-legale">virtual staging legale</a>.</li>
</ul>
<p>La vetrina non sostituisce l'online, e l'online non sostituisce la vetrina. Insieme si aiutano: chi ti vede in vetrina ti cerca su Google, chi ti trova su Google passa a vedere l'agenzia.</p>`,
    },
  ],
  faq: [
    [`Conviene ancora avere la vetrina in agenzia immobiliare?`, `Se hai già un ufficio su strada, sì: la vetrina ti fa conoscere dai proprietari del quartiere e mostra che l'agenzia lavora. Serve più per acquisire incarichi che per vendere le case esposte. Va però tenuta curata e aggiornata.`],
    [`Quanti immobili mettere in vetrina?`, `Dipende dallo spazio, ma meglio pochi e ben presentati che tanti fogli attaccati. Una foto grande per immobile, poche informazioni scritte grandi, e qualche cartello "venduto" come prova del lavoro fatto.`],
    [`Serve indicare la classe energetica in vetrina?`, `Sì. Gli annunci di vendita e affitto, compresi quelli esposti in vetrina, devono riportare i dati sulla prestazione energetica dell'immobile. Trovi i dettagli nella guida sull'APE negli annunci.`],
    [`Meglio cartelli o monitor in vetrina?`, `I cartelli costano poco e funzionano se curati. Il monitor costa di più ma si aggiorna dal computer, mostra più immobili e anche video. Molte agenzie usano tutti e due. Prima di installare un monitor informati in Comune sui tributi per le esposizioni pubblicitarie.`],
    [`Come faccio un codice QR per la vetrina?`, `Prepari il link della tua chat WhatsApp (wa.me/ seguito dal numero con il 39 davanti), lo incolli in un generatore di codici QR gratuito, scarichi l'immagine, la provi con il telefono e la stampi grande vicino alla porta.`],
    [`Ogni quanto va cambiata la vetrina?`, `Gli immobili vanno aggiornati ogni settimana, la disposizione almeno una volta al mese. Il vetro va tenuto pulito e i fogli scoloriti ristampati.`],
  ],
};

export const chatgptAgentiImmobiliari: Guide = {
  slug: 'chatgpt-agenti-immobiliari',
  label: 'ChatGPT per agenti immobiliari',
  title: 'ChatGPT per agenti immobiliari: come usarlo, passo passo',
  description: `ChatGPT per agenti immobiliari spiegato semplice: cos'è, come iniziare gratis, 10 richieste pronte per annunci, lettere e messaggi, cosa non chiedergli.`,
  h1: 'ChatGPT per agenti immobiliari: cos\'è e come usarlo, spiegato semplice',
  intro: `ChatGPT è un programma di intelligenza artificiale a cui scrivi una domanda, come in una chat, e che ti risponde con un testo. Per un agente immobiliare è utile soprattutto per scrivere: annunci, lettere ai proprietari, messaggi ai clienti, risposte alle recensioni. Si usa gratis dal sito chatgpt.com o dall'app sul telefono, non serve essere esperti. Qui trovi come iniziare e le richieste pronte da copiare.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'cos-e',
      title: 'Cos\'è ChatGPT e come funziona, in parole semplici',
      html: `<p>Immagina un collaboratore giovane, velocissimo a scrivere, che ha letto moltissimi testi ma <strong>non conosce la tua zona, i tuoi clienti e le tue case</strong>. Gli dai le informazioni giuste e ti prepara una bozza in pochi secondi. Poi tu la rileggi, correggi e decidi se usarla.</p>
<p>Questo è ChatGPT. Funziona così:</p>
<ol>
  <li>Scrivi una richiesta in italiano normale, come la scriveresti a una persona.</li>
  <li>ChatGPT risponde con un testo.</li>
  <li>Se non ti piace, gli dici cosa cambiare: "più corto", "più formale", "togli le parole difficili". E lui riscrive.</li>
</ol>
<p>Due cose da sapere subito:</p>
<ul>
  <li><strong>Può sbagliare</strong>. A volte scrive cose inventate con grande sicurezza: metri quadri, leggi, prezzi. Tutto quello che riguarda numeri, norme e dati dell'immobile va controllato da te.</li>
  <li><strong>Non sostituisce l'agente</strong>. Non conosce il proprietario, non fa la visita, non sente l'odore di umidità in cantina. Ti fa risparmiare tempo sulla scrittura, il resto resta tuo.</li>
</ul>
<p>ChatGPT è solo uno dei modi in cui l'intelligenza artificiale entra nel lavoro dell'agente. Per una visione più ampia leggi la guida sull'<a href="/it/intelligenza-artificiale-agenti-immobiliari">intelligenza artificiale per agenti immobiliari</a>.</p>
<p>In altre parole, ChatGPT scrive, ma il lavoro dell'<a href="/it/agente-immobiliare">agente immobiliare</a> (valutare, far vedere, trattare) resta tuo.</p>`,
    },
    {
      id: 'iniziare',
      title: 'Come usare ChatGPT: i primi passi',
      html: `<p><strong>Dal computer</strong>:</p>
<ol>
  <li>Apri il browser (il programma che usi per internet: Chrome, Safari, Edge).</li>
  <li>Scrivi nella barra in alto <strong>chatgpt.com</strong> e premi Invio. Controlla bene l'indirizzo: esistono siti che imitano ChatGPT.</li>
  <li>Vedi una casella in basso con scritto qualcosa come "Chiedi qualsiasi cosa". Clicca lì e scrivi la tua richiesta.</li>
  <li>Premi Invio e aspetta qualche secondo la risposta.</li>
</ol>
<p><strong>Dal telefono</strong>:</p>
<ol>
  <li>Apri <strong>Play Store</strong> (Android) o <strong>App Store</strong> (iPhone).</li>
  <li>Cerca <strong>ChatGPT</strong> e scegli l'app ufficiale, il cui sviluppatore è OpenAI.</li>
  <li>Installala e aprila.</li>
  <li>Scrivi la domanda nella casella in basso. Se preferisci, tocca il microfono e <strong>parla</strong>: il telefono trasforma la voce in testo.</li>
</ol>
<p><strong>Serve un account?</strong> Sul sito puoi fare qualche prova anche senza. Creando un account gratuito (con la tua email) le conversazioni restano salvate e puoi ritrovarle. Esistono anche abbonamenti a pagamento con più funzioni: per iniziare la versione gratuita basta. Funzioni e limiti cambiano spesso, quindi controlla sul sito cosa è incluso.</p>`,
    },
    {
      id: 'come-chiedere',
      title: 'Come scrivere una richiesta a ChatGPT che funziona',
      html: `<p>La regola d'oro: <strong>più dettagli dai, migliore è la risposta</strong>. "Scrivi un annuncio" dà un testo generico. Una richiesta completa dà un testo che puoi usare quasi subito.</p>
<p>Una buona richiesta ha quattro parti:</p>
<ol>
  <li><strong>Chi sei</strong>: "Sono un agente immobiliare di un paese in provincia di Treviso."</li>
  <li><strong>Cosa ti serve</strong>: "Scrivi la descrizione per un annuncio."</li>
  <li><strong>I dati veri</strong>: "Trilocale di 85 metri quadri, secondo piano senza ascensore, terrazzo di 12 metri, cucina abitabile, garage, classe energetica E, vicino alla scuola."</li>
  <li><strong>Come lo vuoi</strong>: "Massimo 120 parole, tono semplice, niente parole esagerate come 'esclusivo' o 'da sogno'."</li>
</ol>
<p>Se la risposta non va bene, <strong>non ricominciare da capo</strong>: rispondi nella stessa chat. "Più corto." "Metti all'inizio il terrazzo." "Togli la frase sul quartiere, non è vera." ChatGPT ricorda quello che vi siete detti nella stessa conversazione.</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Richiesta debole</th><th ${TH}>Richiesta che funziona</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Scrivi un annuncio per una casa</td><td ${TD}>Scrivi un annuncio di 120 parole per un trilocale di 85 mq, secondo piano senza ascensore, terrazzo 12 mq, garage, classe E, a 200 metri dalla scuola. Tono semplice, niente esagerazioni.</td></tr>
    <tr><td ${TD}>Scrivi una lettera per i proprietari</td><td ${TD}>Scrivi una lettera di mezza pagina ai proprietari di via Garibaldi. Ho appena venduto un appartamento nel loro palazzo. Offro una valutazione gratuita. Tono cordiale, dai del lei, firma Mario Rossi.</td></tr>
  </tbody>
</table>`,
    },
    {
      id: 'richieste-pronte',
      title: 'ChatGPT per agenzia immobiliare: 10 richieste pronte',
      html: `<p>Copia, sostituisci le parti tra parentesi quadre con i tuoi dati veri, incolla in ChatGPT.</p>
<ol>
  <li><strong>Annuncio</strong>: "Sono un agente immobiliare. Scrivi la descrizione di un annuncio per [tipo di immobile, metri, piano, stanze, punti di forza, classe energetica]. Massimo 150 parole, tono semplice e onesto, niente aggettivi esagerati."</li>
  <li><strong>Titolo dell'annuncio</strong>: "Dammi 5 titoli brevi, massimo 60 caratteri, per questo annuncio: [incolla la descrizione]."</li>
  <li><strong>Lettera ai proprietari</strong>: "Scrivi una lettera di mezza pagina per i proprietari di [via o quartiere]. Offro una valutazione gratuita e senza impegno. Dai del lei, tono cordiale, firma [nome e agenzia]."</li>
  <li><strong>Messaggio WhatsApp a un acquirente</strong>: "Scrivi un messaggio WhatsApp breve per avvisare un cliente che cerca [cosa cerca] che è arrivato [immobile]. Chiudi proponendo una visita."</li>
  <li><strong>Risposta a un proprietario che vuole vendere da solo</strong>: "Un proprietario mi ha detto che vuole vendere da privato per non pagare la provvigione. Scrivimi 3 risposte gentili e rispettose che posso dire a voce, senza criticarlo."</li>
  <li><strong>Risposta a una recensione negativa</strong>: "Scrivi una risposta breve, calma ed educata a questa recensione: [incolla il testo]. Non entrare nei dettagli e proponi di parlarne di persona."</li>
  <li><strong>Post per Facebook</strong>: "Scrivi un post per la pagina Facebook dell'agenzia per annunciare che abbiamo venduto [tipo di casa] in [zona]. Tono semplice, ringrazia il venditore senza fare nomi, massimo 60 parole."</li>
  <li><strong>Email più chiara</strong>: "Riscrivi questa email in modo più chiaro e cortese, senza cambiare il senso: [incolla la tua email]."</li>
  <li><strong>Spiegare una cosa al cliente</strong>: "Spiega in parole semplici, in 5 righe, a un cliente anziano cos'è la proposta d'acquisto e perché si versa una caparra." (Poi controlla che sia corretto.)</li>
  <li><strong>Traduzione</strong>: "Traduci in inglese questa descrizione per un cliente straniero: [incolla il testo]."</li>
</ol>
<p>Altri esempi di testo per annunci li trovi in <a href="/it/descrizione-immobile-esempi">descrizione immobile: esempi</a>, e un metodo completo in <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>`,
    },
    {
      id: 'cosa-non-fare',
      title: 'Cosa non chiedere mai a ChatGPT (e cosa non scrivergli)',
      html: `<p><strong>Non scrivere dati personali dei clienti.</strong> Nome e cognome, codice fiscale, indirizzo di casa, situazione familiare, documenti, numeri di telefono. Quello che scrivi passa su server esterni. Se devi far scrivere una lettera a un cliente, scrivi "il signor X" e poi aggiungi il nome tu, nel tuo programma di scrittura.</p>
<p><strong>Non fidarti per leggi, tasse e numeri.</strong> ChatGPT può dare risposte sbagliate su imposte, agevolazioni prima casa, obblighi di legge, prezzi al metro quadro. Per queste cose senti il notaio, il commercialista, la tua associazione di categoria.</p>
<p><strong>Non fargli fare la valutazione.</strong> Non conosce le compravendite reali della tua zona né lo stato della casa. La valutazione resta tua: vedi la guida sulla <a href="/it/valutazione-immobile-acquisizione">valutazione per acquisire immobili</a>.</p>
<p><strong>Non pubblicare senza rileggere.</strong> Controlla sempre che nel testo non ci siano cose false: un "ampio giardino" che non esiste, un "recentemente ristrutturato" mai detto da te. L'annuncio è firmato dalla tua agenzia, la responsabilità è tua.</p>
<p><strong>Togli le frasi "da robot".</strong> I testi di ChatGPT a volte sono pieni di parole tipo "incantevole", "esclusivo", "immerso nel verde". Chiedigli di toglierle, o toglile tu: un annuncio che sembra scritto da una persona vera ispira più fiducia.</p>`,
    },
    {
      id: 'foto-video',
      title: 'ChatGPT e le foto delle case: cosa usare invece',
      html: `<p>ChatGPT nasce per i testi. Alcune versioni sanno anche lavorare con le immagini, ma per le foto di un annuncio servono garanzie precise: la stanza deve restare quella vera, con le stesse finestre, porte e pavimenti, e devi poter mostrare la foto originale accanto a quella modificata.</p>
<p>Per questo, per foto e video conviene uno strumento fatto apposta per gli agenti. Con <a href="/it">Agente Immo</a> funziona come una chat, in italiano: carichi la foto della stanza e scrivi cosa vuoi, "arredala in stile moderno", "svuota la stanza", "pareti bianche". Vedi il risultato con lo slider prima e dopo. Dalle stesse foto crei anche video per i social con la musica, senza montaggio. Puoi provarlo gratis con una foto e un video.</p>
<p>Prima di pubblicare foto arredate, leggi le regole nella guida sul <a href="/it/virtual-staging-legale">virtual staging legale</a>.</p>`,
    },
    {
      id: 'routine',
      title: 'Come iniziare a usare ChatGPT in agenzia, una settimana alla volta',
      html: `<p>Non serve cambiare tutto. Prova così:</p>
<ul>
  <li><strong>Settimana 1</strong>: usa ChatGPT solo per riscrivere in modo più chiaro un'email o un messaggio che hai già scritto tu.</li>
  <li><strong>Settimana 2</strong>: fagli preparare la bozza di un annuncio, dandogli tutti i dati veri. Confrontala con quella che avresti scritto tu.</li>
  <li><strong>Settimana 3</strong>: preparagli la lettera per i proprietari della zona. Correggila e stampala.</li>
  <li><strong>Settimana 4</strong>: salva in un file le richieste che hanno funzionato meglio, così le riusi ogni volta cambiando solo i dati.</li>
</ul>
<p>Se in agenzia hai un collaboratore giovane, chiedigli di sedersi accanto a te la prima volta. Dieci minuti insieme valgono più di qualsiasi corso. E ricorda: il valore lo metti tu, con la conoscenza della zona e delle persone. ChatGPT ti dà solo più tempo per farlo.</p>`,
    },
  ],
  faq: [
    [`ChatGPT è gratis?`, `Sì, esiste una versione gratuita che si usa dal sito chatgpt.com o dall'app ufficiale. Ci sono anche abbonamenti a pagamento con più funzioni. Funzioni e limiti cambiano spesso, quindi verifica sul sito cosa è incluso.`],
    [`Serve saper usare il computer per usare ChatGPT?`, `No. Se sai scrivere un messaggio su WhatsApp, sai usare ChatGPT: scrivi una domanda e ricevi una risposta. Dall'app sul telefono puoi anche parlare con il microfono invece di scrivere.`],
    [`ChatGPT può scrivere gli annunci immobiliari al posto mio?`, `Può preparare una buona bozza se gli dai tutti i dati veri dell'immobile. Poi va riletta e corretta da te: può inventare dettagli o usare parole esagerate, e l'annuncio resta sotto la tua responsabilità.`],
    [`È sicuro mettere i dati dei clienti su ChatGPT?`, `Meglio di no. Non scrivere nomi, codici fiscali, indirizzi o documenti dei clienti. Usa nomi generici come "il signor X" e aggiungi i dati veri dopo, nel tuo programma.`],
    [`ChatGPT può fare la valutazione di una casa?`, `No. Non conosce le compravendite reali della tua zona né lo stato dell'immobile, e può dare cifre sbagliate. La valutazione resta un lavoro dell'agente.`],
    [`ChatGPT può arredare le foto delle case?`, `ChatGPT nasce per i testi. Per arredare o svuotare le foto di un annuncio mantenendo la stanza identica conviene uno strumento pensato per gli agenti immobiliari, sempre dichiarando l'arredo virtuale e mostrando anche la foto originale.`],
  ],
};

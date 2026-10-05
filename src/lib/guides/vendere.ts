import type { Guide } from './types';

// Guide sul vendere: casa che non si vende, annuncio senza contatti, esempi di home staging, arredare foto con AI.
// Punto di vista dell'agente. Niente statistiche, percentuali o dati inventati: dove non c'è certezza si resta generici.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const casaCheNonSiVende: Guide = {
  slug: 'casa-che-non-si-vende',
  label: 'Casa che non si vende',
  title: `Casa che non si vende: cause e piano d'azione per agenti`,
  description: `Casa che non si vende: le cause vere (prezzo, foto, annuncio, stanze vuote, documenti), come fare la diagnosi e un piano per riposizionare l'immobile.`,
  h1: `Casa che non si vende: perché succede e come riposizionare l'immobile`,
  intro: `Una casa che non si vende ha quasi sempre una causa precisa: prezzo fuori mercato, foto che non fermano chi scorre, annuncio debole, stanze vuote o datate, documenti non pronti. La soluzione non è aspettare né abbassare il prezzo alla cieca: è capire dove si blocca il percorso dell'acquirente e intervenire lì, con un piano condiviso con il proprietario.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'perche-non-si-vende',
      title: 'Perché una casa non si vende: le cause più comuni',
      html: `<p>Quando un immobile resta online per mesi senza proposte, il problema raramente è "il mercato". Più spesso è una combinazione di fattori che dipendono da come la casa è prezzata e presentata. Le cause da controllare sono sempre le stesse:</p>
<ul>
  <li><strong>Prezzo</strong>: è la causa più frequente. Un prezzo fissato sulle aspettative del proprietario, sull'ultimo annuncio visto in zona o su quanto ha speso per ristrutturare, invece che sulle compravendite reali.</li>
  <li><strong>Foto</strong>: scure, storte, piene di oggetti personali, poche, o con una copertina sbagliata. Sul portale la foto è il primo filtro: se non ferma chi scorre, il resto non viene nemmeno letto.</li>
  <li><strong>Annuncio</strong>: titolo generico, descrizione vaga, dati mancanti (piano, ascensore, spese condominiali, classe energetica). Chi cerca casa confronta, e un annuncio incompleto perde il confronto.</li>
  <li><strong>Stanze vuote o datate</strong>: una stanza vuota sembra più piccola e fredda, una con mobili vecchi fa pensare a lavori costosi. In entrambi i casi l'acquirente fatica a immaginarsi lì.</li>
  <li><strong>Documenti</strong>: difformità catastali o urbanistiche, APE mancante o scaduto, successioni non chiuse, ipoteche da cancellare. Rallentano o fanno saltare le trattative quando emergono tardi.</li>
  <li><strong>Tempi e disponibilità</strong>: visite difficili da fissare, proprietario sempre presente che interviene, casa occupata in modo disordinato, chiavi non disponibili.</li>
  <li><strong>Caratteristiche oggettive</strong>: piano alto senza ascensore, esposizione, rumore, zona. Non si cambiano, ma vanno dichiarate e pesate nel prezzo.</li>
</ul>
<p>Le prime quattro cause dipendono quasi interamente da te e dal proprietario. Per questo vanno controllate prima di pensare a qualsiasi ribasso.</p>
<p>Qui conta l'esperienza: riconoscere in fretta la causa giusta è una delle competenze che distinguono un <a href="/it/agente-immobiliare">agente immobiliare</a> bravo da uno che si limita ad abbassare il prezzo.</p>`,
    },
    {
      id: 'diagnosi',
      title: 'Casa che non si riesce a vendere: come fare la diagnosi',
      html: `<p>Per capire dove si blocca la vendita, guarda il percorso dell'acquirente in quattro passaggi. Ogni passaggio ha un dato che puoi leggere da solo, nelle statistiche del portale o nei tuoi appunti:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Cosa succede</th><th ${TH}>Dove sta probabilmente il problema</th><th ${TH}>Primo intervento</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Poche visualizzazioni dell'annuncio</td><td ${TD}>Prezzo fuori dai filtri di ricerca, foto di copertina debole, titolo generico</td><td ${TD}>Cambia copertina e titolo, verifica in quali fasce di prezzo compare l'annuncio</td></tr>
    <tr><td ${TD}>Visualizzazioni ma pochi contatti</td><td ${TD}>Foto, descrizione, dati mancanti, rapporto prezzo e presentazione</td><td ${TD}>Rifai la galleria, completa i dati, riscrivi la descrizione</td></tr>
    <tr><td ${TD}>Contatti ma poche visite</td><td ${TD}>Risposte lente, informazioni che emergono al telefono (spese, piano, lavori), disponibilità per le visite</td><td ${TD}>Rispondi in giornata, metti nell'annuncio quello che oggi spieghi al telefono</td></tr>
    <tr><td ${TD}>Visite ma nessuna proposta</td><td ${TD}>Prezzo, stato della casa alla visita, aspettative create dalle foto</td><td ${TD}>Raccogli i feedback, prepara la casa, ragiona sul prezzo con dati</td></tr>
  </tbody>
</table>
<p>Il punto chiave: <strong>non tutti i problemi si risolvono con il prezzo</strong>. Se l'annuncio non viene nemmeno aperto, un ribasso del 5% può non cambiare nulla, mentre una nuova copertina sì. Se invece le visite ci sono e le proposte no, quasi sempre il prezzo o lo stato della casa sono il nodo.</p>
<p>Dopo ogni visita annota tre cose: cosa è piaciuto, cosa ha frenato, a che cifra il visitatore la considererebbe. Dopo cinque o sei visite hai un quadro che nessuna opinione può contestare, ed è la base per parlarne con il proprietario.</p>`,
    },
    {
      id: 'prezzo',
      title: 'Prezzo: come capire se è fuori mercato',
      html: `<p>Il prezzo richiesto va confrontato con le <strong>compravendite reali</strong> della zona, non con gli annunci. Gli annunci dicono quanto chiedono gli altri proprietari, non quanto vengono pagate le case. Per rifare il punto:</p>
<ul>
  <li><strong>Riprendi la valutazione iniziale</strong> e controlla se nel frattempo sono cambiati i comparabili: nuove vendite, nuovi annunci concorrenti, ribassi di immobili simili.</li>
  <li><strong>Guarda la concorrenza diretta</strong>: gli immobili che un acquirente vede insieme al tuo, con la stessa ricerca sul portale. Se a parità di prezzo offrono di più (box, terrazzo, ristrutturazione), il tuo perde.</li>
  <li><strong>Controlla le soglie di ricerca</strong>: chi cerca imposta spesso un prezzo massimo a cifra tonda. Un immobile poco sopra una soglia può sparire dalle ricerche di chi sarebbe interessato.</li>
  <li><strong>Usa i feedback delle visite</strong>: se più visitatori indicano spontaneamente una cifra simile, è un'informazione preziosa.</li>
</ul>
<p>Per impostare il metodo di valutazione da presentare al proprietario, trovi una traccia completa nella guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile in fase di acquisizione</a>.</p>`,
    },
    {
      id: 'presentazione',
      title: 'Foto, annuncio e stanze vuote: rifare la presentazione',
      html: `<p>Prima di toccare il prezzo, rifai la presentazione. È l'intervento che costa meno al proprietario e spesso quello con l'effetto più rapido.</p>
<ol>
  <li><strong>Nuove foto</strong>: casa riordinata, luce naturale, verticali dritte, una foto per ogni ambiente principale. Trovi la procedura nella guida alle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a> e in quella su <a href="/it/migliorare-foto-annuncio-immobiliare">come migliorare le foto di un annuncio</a>.</li>
  <li><strong>Nuova copertina</strong>: la stanza più luminosa e ampia, o l'esterno se è il punto di forza. Mai il bagno, mai un corridoio.</li>
  <li><strong>Stanze vuote arredate in foto</strong>: con l'<a href="/it/home-staging-virtuale">home staging virtuale</a> puoi mostrare come si usa ogni ambiente, sempre dichiarando l'arredo virtuale e pubblicando anche la foto reale. Per gli esempi stanza per stanza vedi <a href="/it/home-staging-esempi">home staging: esempi prima e dopo</a>.</li>
  <li><strong>Titolo e descrizione riscritti</strong>: zona, tipologia e punto di forza nel titolo, tutti i dati che oggi spieghi al telefono nella descrizione. Segui la guida su <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</li>
  <li><strong>Un video breve</strong> per i social e per chi ti chiede informazioni su WhatsApp.</li>
</ol>
<p>Se l'annuncio riceve poche chiamate, prima di tutto il resto leggi la guida dedicata all'<a href="/it/annuncio-immobiliare-senza-contatti">annuncio immobiliare senza contatti</a>: trovi i controlli da fare uno per uno.</p>`,
    },
    {
      id: 'piano-azione',
      title: `Immobile invenduto, cosa fare: piano d'azione in 30 giorni`,
      html: `<p>Un piano scritto, con date e responsabilità, trasforma una situazione frustrante in un lavoro ordinato. Ecco una traccia da adattare:</p>
<p><strong>Settimana 1: diagnosi</strong></p>
<ul>
  <li>Raccogli i dati del portale (visualizzazioni, contatti, salvataggi) e i feedback delle visite.</li>
  <li>Aggiorna i comparabili e la concorrenza diretta.</li>
  <li>Verifica i documenti: APE valido, conformità catastale e urbanistica, eventuali vincoli o ipoteche. Se manca qualcosa, avvia subito le pratiche con il tecnico.</li>
</ul>
<p><strong>Settimana 2: nuova presentazione</strong></p>
<ul>
  <li>Prepara la casa con il proprietario: decluttering, piccole riparazioni, pulizia.</li>
  <li>Nuove foto, stanze vuote o datate arredate virtualmente e dichiarate, nuova copertina.</li>
  <li>Nuovo titolo e nuova descrizione, dati completi, <a href="/it/ape-annunci-immobiliari">classe energetica indicata correttamente</a>.</li>
</ul>
<p><strong>Settimana 3: rilancio</strong></p>
<ul>
  <li>Ripubblica l'annuncio aggiornato su portali e sito.</li>
  <li>Contatta i potenziali acquirenti del tuo archivio che cercavano qualcosa di simile, con le nuove foto.</li>
  <li>Pubblica un reel o un video prima e dopo sui social.</li>
</ul>
<p><strong>Settimana 4: verifica e decisione</strong></p>
<ul>
  <li>Confronta i numeri con quelli di prima.</li>
  <li>Se i contatti sono cresciuti ma le proposte no, il nodo è il prezzo: è il momento di proporre una revisione con i dati in mano.</li>
  <li>Se i numeri non si muovono, rivedi prezzo e posizionamento insieme.</li>
</ul>`,
    },
    {
      id: 'proprietario',
      title: 'Come parlarne con il proprietario',
      html: `<p>È la parte più delicata. Il proprietario vede la casa ferma e tende a dare la colpa al mercato o all'agente. Tu sai che spesso il nodo è il prezzo. Il modo per uscirne è <strong>parlare di dati, non di opinioni</strong>.</p>
<ul>
  <li><strong>Anticipa l'incontro</strong>: non aspettare che chiami lui. Proponi tu un aggiornamento, con data e orario.</li>
  <li><strong>Porta un resoconto scritto</strong>: quanti contatti, quante visite, cosa hanno detto i visitatori, cosa hanno fatto gli immobili concorrenti.</li>
  <li><strong>Separa le responsabilità</strong>: "La presentazione è compito mio e la rifaccio da zero. Il prezzo lo decidiamo insieme."</li>
  <li><strong>Proponi prima gli interventi che non costano a lui</strong>: nuove foto, home staging virtuale, nuovo annuncio. Mostragli una sua stanza arredata in foto: rende concreto il lavoro.</li>
  <li><strong>Concorda una soglia</strong>: "Se in tre settimane con la nuova presentazione i contatti non crescono, rivediamo il prezzo." Così il ribasso, se serve, è una decisione presa insieme prima, non una resa.</li>
</ul>
<p>Una frase che puoi adattare: <em>"In questi due mesi la casa è stata vista online da molte persone, ma pochi hanno chiesto di visitarla e chi l'ha visitata ha trovato il prezzo alto rispetto a [immobile simile]. Prima di parlare di prezzo voglio rifare foto e annuncio, a mie spese. Diamoci tre settimane e poi guardiamo i numeri insieme."</em></p>
<p>Questa conversazione è più facile se il prezzo è stato impostato bene fin dall'inizio: ne parliamo nella guida su <a href="/it/acquisire-incarichi-immobiliari">come acquisire incarichi immobiliari</a>.</p>`,
    },
    {
      id: 'prevenire',
      title: 'Come evitare che succeda al prossimo incarico',
      html: `<p>Molte case invendute nascono già al momento dell'incarico. Qualche abitudine riduce il rischio:</p>
<ul>
  <li><strong>Non accettare incarichi a qualsiasi prezzo</strong>: un incarico fuori mercato ti costa tempo e reputazione, anche con gli acquirenti che vedono l'annuncio fermo da mesi.</li>
  <li><strong>Controlla i documenti prima di pubblicare</strong>, non quando arriva la proposta.</li>
  <li><strong>Presenta la casa al meglio dal primo giorno</strong>: i primi giorni online sono quelli in cui l'annuncio raccoglie più attenzione. Pubblicare con foto mediocri e "migliorarle dopo" significa sprecarli.</li>
  <li><strong>Concorda subito un calendario di verifiche</strong> con il proprietario, per esempio dopo 3 e dopo 6 settimane, con i dati del portale.</li>
</ul>
<p>Strumenti come <a href="/it">Agente Immo</a> ti aiutano nella parte di presentazione: arredi in foto le stanze vuote, crei il video per i social e mandi al proprietario una scheda con report PDF anche su WhatsApp, così vede il lavoro che stai facendo sulla sua casa.</p>`,
    },
  ],
  faq: [
    ['Perché una casa non si vende?', 'Le cause più comuni sono prezzo fuori mercato, foto poco curate, annuncio incompleto, stanze vuote o datate che non aiutano l\'acquirente a immaginarsi lì, documenti non in ordine e visite difficili da organizzare. Spesso sono più cause insieme.'],
    ['Quanto tempo deve passare prima di preoccuparsi?', 'Non c\'è una soglia valida ovunque: dipende da zona, tipologia e mercato. Conviene fissare con il proprietario delle verifiche periodiche, per esempio dopo qualche settimana, e guardare l\'andamento di visualizzazioni, contatti e visite invece di aspettare.'],
    ['Abbassare il prezzo è sempre la soluzione?', 'No. Se l\'annuncio riceve poche visualizzazioni o pochi contatti, il problema può essere la presentazione e un ribasso potrebbe non bastare. Se invece le visite ci sono e le proposte no, il prezzo è spesso il nodo.'],
    ['Conviene ritirare l\'annuncio e ripubblicarlo?', 'Ripubblicare lo stesso annuncio identico serve a poco. Ha senso rilanciarlo dopo averlo davvero rifatto: nuove foto, nuova copertina, nuovo testo, dati completi. Verifica anche le regole del portale sulla ripubblicazione.'],
    ['Come dico al proprietario che il prezzo è troppo alto?', 'Con i dati: contatti, visite, feedback dei visitatori, compravendite e immobili concorrenti. Proponi prima di rifare la presentazione a tue spese e concorda una soglia oltre la quale rivedere il prezzo insieme.'],
    ['L\'home staging virtuale aiuta a vendere una casa ferma?', 'Può aiutare la parte di presentazione, soprattutto con stanze vuote o arredate in modo datato, perché rende le foto più leggibili. Va sempre dichiarato e affiancato alla foto reale, e non risolve un prezzo fuori mercato.'],
  ],
};

export const annuncioSenzaContatti: Guide = {
  slug: 'annuncio-immobiliare-senza-contatti',
  label: 'Annuncio senza contatti',
  title: `Annuncio immobiliare senza contatti: perché e cosa fare`,
  description: `Annuncio immobiliare senza contatti? I controlli da fare su foto, titolo, prezzo, descrizione, rinnovo e social per far tornare a squillare il telefono.`,
  h1: `Annuncio immobiliare senza contatti: perché nessuno chiama e come rimediare`,
  intro: `Se un annuncio immobiliare non riceve contatti, il problema è quasi sempre in uno di questi punti: la prima foto non ferma chi scorre, il titolo non dice nulla, il prezzo è fuori dai filtri di ricerca o la descrizione lascia troppe domande. Parti dalla foto di copertina, poi controlla il resto nell'ordine di questa guida.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'perche-nessuna-chiamata',
      title: 'Annuncio casa, nessuna chiamata: perché succede',
      html: `<p>Chi cerca casa su un portale fa tre cose in pochi secondi: imposta i filtri, scorre la lista guardando le foto, apre solo gli annunci che lo convincono. Poi, se l'annuncio risponde alle sue domande, contatta. Un annuncio senza contatti si è fermato in uno di questi passaggi:</p>
<ol>
  <li><strong>Non compare</strong>: prezzo, metratura o caratteristiche lo escludono dai filtri più usati, o la tipologia è inserita in modo sbagliato.</li>
  <li><strong>Compare ma non viene aperto</strong>: copertina debole, titolo generico, prezzo che sembra alto rispetto a quello che si vede.</li>
  <li><strong>Viene aperto ma nessuno contatta</strong>: galleria povera, descrizione vaga, dati mancanti, dubbi che l'acquirente risolve scartando l'annuncio invece di chiamare.</li>
</ol>
<p>Le statistiche del portale (visualizzazioni in lista, aperture, contatti, salvataggi) ti dicono in quale passaggio si perde l'acquirente. Se il problema è più ampio e la casa è ferma da tempo, leggi anche la guida sulla <a href="/it/casa-che-non-si-vende">casa che non si vende</a>.</p>
<p>Rendere visibile un immobile è uno dei compiti principali di un <a href="/it/agente-immobiliare">agente immobiliare</a>, ed è quello che il proprietario controlla di più: se l'annuncio non riceve chiamate, è il primo a chiederti perché.</p>`,
    },
    {
      id: 'foto',
      title: 'Prima controlla le foto: la copertina decide tutto',
      html: `<p>Nella lista dei risultati la foto è l'elemento più grande e il primo che si guarda. Se la copertina non convince, il titolo e il prezzo vengono letti a malapena. Controlla:</p>
<ul>
  <li><strong>La copertina</strong>: deve essere la stanza più luminosa e ampia, scattata in orizzontale, con le verticali dritte. Va bene anche l'esterno, se è il punto di forza (giardino, terrazzo, facciata curata).</li>
  <li><strong>La luce</strong>: foto scure o con le finestre bruciate sono il difetto più comune. Scatta di giorno, luci accese, tende aperte.</li>
  <li><strong>Il disordine</strong>: oggetti personali, panni stesi, auto nel cortile. Ogni oggetto in più distrae dallo spazio.</li>
  <li><strong>Il numero e l'ordine</strong>: almeno una foto per ogni ambiente, in un ordine che segue la visita. Poche foto fanno pensare che ci sia qualcosa da nascondere.</li>
  <li><strong>Le stanze vuote</strong>: in foto sembrano più piccole e non fanno capire come usarle. Arredale virtualmente, dichiarandolo, e pubblica anche la foto reale (vedi <a href="/it/virtual-staging-legale">virtual staging legale</a>).</li>
</ul>
<p>Un test semplice: cerca il tuo annuncio sul portale con i filtri di un acquirente tipo e guarda la lista da telefono. Se la tua copertina è la meno invitante della schermata, hai trovato il primo problema. Per rifarle, segui la guida alle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a> e quella su <a href="/it/migliorare-foto-annuncio-immobiliare">come migliorare le foto di un annuncio</a>.</p>`,
    },
    {
      id: 'titolo',
      title: 'Titolo dell\'annuncio: dire subito cosa offri',
      html: `<p>Il titolo deve far capire in un colpo d'occhio <strong>zona, tipologia e punto di forza</strong>. "Splendido appartamento" non dice nulla, perché lo scrivono tutti. Confronta:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Titolo debole</th><th ${TH}>Titolo efficace</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Splendido appartamento in ottima zona</td><td ${TD}>Trilocale con terrazzo abitabile, zona Stazione</td></tr>
    <tr><td ${TD}>Occasione imperdibile!!!</td><td ${TD}>Bilocale ristrutturato, ultimo piano con ascensore</td></tr>
    <tr><td ${TD}>Villa con giardino</td><td ${TD}>Villa a schiera con giardino privato e box doppio</td></tr>
    <tr><td ${TD}>Appartamento da vedere</td><td ${TD}>Quadrilocale luminoso, doppia esposizione, vicino scuole</td></tr>
  </tbody>
</table>
<p>Evita maiuscole, punti esclamativi e aggettivi vuoti. Metti il dato più concreto che distingue la casa dalle altre nella stessa ricerca. Trovi la formula completa nella guida su <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>`,
    },
    {
      id: 'prezzo',
      title: 'Prezzo: filtri di ricerca e confronto con la concorrenza',
      html: `<p>Il prezzo influenza i contatti in due modi.</p>
<ul>
  <li><strong>I filtri</strong>: chi cerca imposta quasi sempre un prezzo massimo, spesso a cifra tonda. Un immobile poco sopra una soglia esce dalle ricerche di chi ha impostato quella soglia. Valuta con il proprietario se il prezzo richiesto ha senso rispetto alle fasce di ricerca più naturali per quella tipologia.</li>
  <li><strong>Il confronto</strong>: l'acquirente vede il tuo annuncio accanto ad altri simili. Se a parità di prezzo gli altri mostrano più metri, un box o una ristrutturazione, il tuo viene scartato senza essere aperto.</li>
</ul>
<p>Fai l'esercizio dell'acquirente: cerca con i suoi filtri e metti in fila i cinque annunci più simili al tuo. Se il tuo è il più caro e il meno curato, nessuno chiamerà. Per ragionare sul prezzo con dati veri, usa la traccia della guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile</a>.</p>`,
    },
    {
      id: 'descrizione',
      title: 'Descrizione e dati: rispondere prima che chiedano',
      html: `<p>Chi apre l'annuncio ha delle domande. Se il testo non risponde, molti non chiamano per chiedere: passano all'annuncio successivo. Controlla che ci siano sempre:</p>
<ul>
  <li>metratura, numero di locali, bagni, piano e presenza dell'ascensore;</li>
  <li>esposizione, riscaldamento, stato dell'immobile;</li>
  <li>spese condominiali indicative;</li>
  <li>box, cantina, posto auto, spazi esterni;</li>
  <li>classe energetica e indice di prestazione energetica, come previsto (vedi <a href="/it/ape-annunci-immobiliari">APE negli annunci</a>);</li>
  <li>servizi vicini: scuole, mezzi, negozi;</li>
  <li>disponibilità: libero subito, al rogito, occupato.</li>
</ul>
<p>Apri la descrizione con il punto di forza, non con "Proponiamo in vendita". Se ti serve un modello, trovi testi pronti per diverse tipologie in <a href="/it/descrizione-immobile-esempi">descrizione immobile: esempi</a>. Un consiglio pratico: annota le domande che ti fanno al telefono per quell'immobile e aggiungi le risposte nell'annuncio.</p>`,
    },
    {
      id: 'pubblicazione-rinnovo',
      title: 'Orari di pubblicazione e rinnovo dell\'annuncio',
      html: `<p>Sui portali gli annunci nuovi o aggiornati tendono a ricevere più attenzione nei primi giorni, anche perché molti acquirenti ricevono avvisi sulle nuove pubblicazioni che corrispondono alle loro ricerche salvate. Qualche accorgimento:</p>
<ul>
  <li><strong>Pubblica quando l'annuncio è completo</strong>: foto definitive, testo rivisto, dati compilati. Pubblicare un annuncio a metà e completarlo dopo significa sprecare i giorni migliori.</li>
  <li><strong>Scegli tu il momento</strong>: non esiste un orario valido per tutti. Guarda nelle statistiche dei tuoi annunci in quali giorni e fasce orarie arrivano più contatti, e pubblica o aggiorna poco prima.</li>
  <li><strong>Rinnovo e ripubblicazione</strong>: ogni portale ha regole proprie su come vengono ordinati gli annunci e su servizi di visibilità o rinnovo, spesso a pagamento. Verifica le condizioni del tuo contratto prima di usarli, e non ripubblicare lo stesso annuncio identico come se fosse nuovo.</li>
  <li><strong>Aggiorna davvero</strong>: un rinnovo ha senso quando qualcosa è cambiato (nuove foto, nuova copertina, nuovo prezzo). Così chi aveva già visto l'annuncio ha un motivo per riaprirlo.</li>
</ul>`,
    },
    {
      id: 'social-e-altri-canali',
      title: 'Social, sito e contatti diretti: non solo portali',
      html: `<p>Un annuncio che non riceve contatti sul portale può trovarli altrove, se lo porti dove sono le persone:</p>
<ul>
  <li><strong>Social</strong>: un reel con le stanze prima e dopo l'arredo, una camminata nella casa, un video in cui presenti tu l'immobile. Trovi idee pronte nella guida ai <a href="/it/reel-immobiliari-instagram-tiktok">reel immobiliari per Instagram e TikTok</a> e in quella sui <a href="/it/video-immobiliari-social">video immobiliari per i social</a>.</li>
  <li><strong>Il tuo sito</strong>: una pagina per ogni immobile, dove le richieste arrivano a te e non a un portale. Vedi la guida al <a href="/it/sito-web-agente-immobiliare">sito web dell'agente immobiliare</a>.</li>
  <li><strong>Il tuo archivio</strong>: richiama le persone che cercavano qualcosa di simile e manda loro foto e scheda su WhatsApp. Un <a href="/it/crm-immobiliare">CRM immobiliare</a> ti aiuta a trovarle in un minuto.</li>
</ul>
<p>Con <a href="/it">Agente Immo</a> puoi creare dai tuoi scatti un video per i social con musica inclusa, senza montaggio, e mandare la scheda dell'immobile al cliente su WhatsApp. Sui piani Plus e Pro ogni immobile caricato va online anche sul tuo sito con la sua pagina.</p>`,
    },
    {
      id: 'checklist',
      title: 'Checklist: annuncio senza contatti in 12 controlli',
      html: `<ol>
  <li>L'annuncio compare cercando con i filtri di un acquirente tipo.</li>
  <li>Tipologia, metratura e locali sono inseriti correttamente nei campi del portale.</li>
  <li>La copertina è la foto più luminosa e ampia, orizzontale, verticali dritte.</li>
  <li>C'è almeno una foto per ogni ambiente, in ordine di visita.</li>
  <li>Le stanze vuote sono arredate virtualmente, dichiarate, con la foto reale accanto.</li>
  <li>Il titolo contiene zona, tipologia e punto di forza.</li>
  <li>Il prezzo regge il confronto con i cinque annunci più simili.</li>
  <li>La descrizione apre con il punto di forza e contiene tutti i dati principali.</li>
  <li>Classe energetica e indice sono indicati.</li>
  <li>Rispondi ai contatti in giornata, anche su WhatsApp.</li>
  <li>L'annuncio è stato rilanciato dopo un aggiornamento vero, non solo ripubblicato.</li>
  <li>L'immobile è presente anche su social, sito e nel tuo archivio clienti.</li>
</ol>
<p>Se dopo questi controlli i contatti non arrivano, il problema è quasi sempre il prezzo: parlane con il proprietario usando i dati, come spiegato nella guida sulla <a href="/it/casa-che-non-si-vende">casa che non si vende</a>.</p>`,
    },
  ],
  faq: [
    ['Perché il mio annuncio immobiliare non riceve contatti?', 'Di solito per uno di questi motivi: l\'annuncio non compare nelle ricerche per prezzo o caratteristiche, la foto di copertina non invita ad aprirlo, il titolo è generico, oppure la descrizione lascia troppe domande senza risposta. Le statistiche del portale aiutano a capire in quale passaggio si perde l\'acquirente.'],
    ['Qual è la prima cosa da cambiare?', 'La foto di copertina. È l\'elemento più visibile nella lista dei risultati e decide se l\'annuncio viene aperto. Poi titolo, galleria e descrizione.'],
    ['Esiste un orario migliore per pubblicare un annuncio?', 'Non c\'è un orario valido per tutti. Guarda nelle statistiche dei tuoi annunci quando arrivano più contatti e pubblica o aggiorna poco prima. Più dell\'orario conta pubblicare l\'annuncio già completo.'],
    ['Conviene rinnovare o ripubblicare l\'annuncio?', 'Ha senso dopo un aggiornamento reale, come nuove foto, nuova copertina o nuovo prezzo. Ogni portale ha regole e servizi propri su rinnovo e visibilità: verifica le condizioni del tuo contratto.'],
    ['Le stanze vuote fanno perdere contatti?', 'In foto una stanza vuota sembra più piccola e non fa capire come usarla, quindi rende meno. Puoi arredarla virtualmente, dichiarandolo e pubblicando anche la foto reale.'],
    ['I social possono portare contatti per un singolo immobile?', 'Sì, soprattutto con video brevi come un prima e dopo o una camminata nella casa. Funzionano meglio se rimandano a una pagina dell\'immobile dove il contatto arriva direttamente a te.'],
  ],
};

export const homeStagingEsempi: Guide = {
  slug: 'home-staging-esempi',
  label: 'Home staging: esempi',
  title: `Home staging esempi: prima e dopo stanza per stanza`,
  description: `Home staging esempi per ogni stanza: soggiorno, camera, cucina, bagno, esterni e stanza vuota. Cosa cambiare, che stile scegliere, fisico o virtuale.`,
  h1: `Home staging esempi: prima e dopo stanza per stanza, con cosa cambiare`,
  intro: `Un buon home staging non trasforma la casa: toglie quello che distrae, aggiunge pochi elementi che fanno capire come usare ogni spazio e sceglie uno stile adatto a chi comprerà. Qui trovi esempi concreti per soggiorno, camera, cucina, bagno, esterni e stanza vuota, con cosa cambiare prima e dopo e quando farlo dal vivo o in foto.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'principi',
      title: 'Home staging prima e dopo: i principi che valgono ovunque',
      html: `<p>Prima degli esempi, quattro regole che valgono in ogni stanza:</p>
<ul>
  <li><strong>Togliere prima di aggiungere</strong>: oggetti personali, foto di famiglia, calamite sul frigo, mobili in eccesso. Spesso il "dopo" migliore nasce più da quello che esce che da quello che entra.</li>
  <li><strong>Una funzione chiara per ogni stanza</strong>: la stanza che oggi è ripostiglio deve mostrarsi come studio o cameretta, non come "stanza in più".</li>
  <li><strong>Luce</strong>: tende aperte, lampadine funzionanti e dello stesso colore, superfici libere che riflettono la luce.</li>
  <li><strong>Neutralità con un tocco di calore</strong>: colori chiari e tranquilli, più qualche elemento vivo (una pianta, un plaid, dei cuscini) che renda la casa abitabile e non da catalogo.</li>
</ul>
<p>Questi principi valgono sia per l'home staging fisico sia per quello virtuale. La differenza è dove si vede il risultato: nel fisico anche alla visita, nel virtuale solo nelle foto. Per le basi, parti dalla <a href="/it/home-staging-virtuale">guida all'home staging virtuale</a>.</p>
<p>Per un <a href="/it/agente-immobiliare">agente immobiliare</a> questi esempi servono due volte: per l'annuncio e per l'appuntamento di acquisizione, quando mostri al proprietario come presenterai la sua casa.</p>`,
    },
    {
      id: 'soggiorno',
      title: 'Esempio soggiorno: da salotto pieno a spazio leggibile',
      html: `<p><strong>Prima</strong>: divano ad angolo grande, due poltrone, mobile TV a parete con vetrinetta, tavolino pieno di riviste, tappeto scuro, tende pesanti. La stanza sembra piccola e buia.</p>
<p><strong>Cosa cambiare</strong>:</p>
<ul>
  <li>togliere una poltrona e la vetrinetta, liberare il tavolino;</li>
  <li>aprire o sostituire le tende con tessuti chiari e leggeri;</li>
  <li>tappeto chiaro che delimita la zona conversazione;</li>
  <li>due o tre cuscini e una pianta come unici elementi decorativi;</li>
  <li>se c'è spazio, un piccolo tavolo da pranzo vicino alla finestra per mostrare che il soggiorno ospita anche i pasti.</li>
</ul>
<p><strong>Dopo</strong>: il pavimento si vede di più, la luce arriva fino in fondo, chi guarda capisce dove si siede, dove mangia e dove passa. In foto il soggiorno è spesso la copertina dell'annuncio, quindi vale la pena curarlo più di tutti.</p>`,
    },
    {
      id: 'camera',
      title: 'Esempio camera da letto: riposo, ordine, misure credibili',
      html: `<p><strong>Prima</strong>: letto con copriletto a fantasia, comodini pieni, vestiti sulla sedia, armadio con ante aperte, foto personali alle pareti.</p>
<p><strong>Cosa cambiare</strong>:</p>
<ul>
  <li>biancheria da letto chiara e tesa, due cuscini e un plaid ai piedi;</li>
  <li>comodini con una lampada e al massimo un libro;</li>
  <li>nessun vestito in vista, ante chiuse, sedia libera o rimossa;</li>
  <li>pareti con un solo quadro neutro sopra il letto.</li>
</ul>
<p><strong>Camera vuota o cameretta</strong>: mostrare un letto matrimoniale dove ci sta davvero, oppure un letto singolo con scrivania se la stanza è piccola. Le misure devono essere credibili: un letto sottodimensionato che fa sembrare la stanza più grande è scorretto, e alla visita si nota subito.</p>`,
    },
    {
      id: 'cucina',
      title: 'Esempio cucina: piani liberi e materiali che non si toccano',
      html: `<p><strong>Prima</strong>: piani di lavoro pieni di elettrodomestici, barattoli, scolapiatti, calamite e biglietti sul frigo, tavolo con tovaglia cerata.</p>
<p><strong>Cosa cambiare</strong>:</p>
<ul>
  <li>piani quasi vuoti: lasciare al massimo un tagliere, una pianta aromatica, una ciotola di frutta;</li>
  <li>frigo libero, lavello vuoto, strofinacci in ordine;</li>
  <li>tavolo apparecchiato in modo semplice, o sgombro con due sedie;</li>
  <li>luci sotto pensile accese, se ci sono.</li>
</ul>
<p><strong>Cosa non cambiare</strong>: nel virtuale la cucina in muratura, i mobili fissi, il piano di lavoro e il pavimento restano quelli veri. Cambiarli in foto significa mostrare una ristrutturazione che non c'è. Se la cucina è datata, l'home staging serve a mostrarla pulita e luminosa; un'eventuale ipotesi di rifacimento va presentata a parte, come tale (vedi <a href="/it/virtual-staging-legale">virtual staging legale</a>).</p>`,
    },
    {
      id: 'bagno',
      title: 'Esempio bagno: pulizia, asciugamani, niente prodotti in vista',
      html: `<p><strong>Prima</strong>: flaconi sul bordo della vasca, spazzolini, tappetino consumato, asciugamani spaiati, coperchio del WC alzato.</p>
<p><strong>Cosa cambiare</strong>:</p>
<ul>
  <li>togliere ogni prodotto personale;</li>
  <li>asciugamani bianchi o chiari, piegati, dello stesso set;</li>
  <li>un dispenser di sapone neutro e una piccola pianta;</li>
  <li>coperchio abbassato, specchio e rubinetti lucidi, luce accesa.</li>
</ul>
<p>Il bagno è la stanza dove l'home staging virtuale serve meno: piastrelle, sanitari e box doccia sono fissi e non vanno toccati. Qui conta soprattutto la preparazione fisica prima delle foto, che costa solo un'ora di lavoro.</p>`,
    },
    {
      id: 'esterni',
      title: 'Esempio esterni: balcone, terrazzo, giardino',
      html: `<p><strong>Prima</strong>: balcone usato come ripostiglio, stendino aperto, vasi secchi, terrazzo vuoto, giardino con prato incolto.</p>
<p><strong>Cosa cambiare</strong>:</p>
<ul>
  <li><strong>balcone</strong>: via stendino e oggetti, un tavolino con due sedie e qualche pianta verde;</li>
  <li><strong>terrazzo</strong>: un tavolo da pranzo all'aperto o un salotto esterno, per far capire che è uno spazio da vivere e non solo metri quadrati;</li>
  <li><strong>giardino</strong>: prato tagliato, siepi in ordine, una zona con tavolo o sdraio.</li>
</ul>
<p>Negli esterni il virtuale funziona bene per l'arredo (tavoli, sedie, ombrellone), non per la vegetazione o la vista: un prato secco non diventa verde in foto, e il palazzo di fronte resta dov'è.</p>`,
    },
    {
      id: 'stanza-vuota',
      title: 'Esempio stanza vuota: dare una funzione allo spazio',
      html: `<p>La stanza vuota è il caso in cui l'home staging fa più differenza, perché in foto uno spazio senza mobili sembra più piccolo e chi guarda non capisce né le proporzioni né l'uso.</p>
<p><strong>Prima</strong>: pareti bianche, pavimento, una finestra. Nessun riferimento.</p>
<p><strong>Dopo</strong>, a seconda della stanza e di chi cerca:</p>
<ul>
  <li><strong>seconda camera piccola</strong>: cameretta con letto singolo e scrivania, oppure studio con scrivania, libreria e poltroncina;</li>
  <li><strong>soggiorno vuoto</strong>: divano, tavolino, tappeto e tavolo da pranzo, per mostrare dove si mangia e dove si sta;</li>
  <li><strong>open space</strong>: zone ben distinte con tappeti e illuminazione, così chi guarda capisce come dividere lo spazio.</li>
</ul>
<p>Puoi anche mostrare la stessa stanza in due versioni, per esempio cameretta e studio, per far capire la flessibilità. In questo caso è quasi sempre più pratico il virtuale, che costa poco e si fa in pochi minuti. Sul sito di <a href="/it">Agente Immo</a> trovi alcune foto prima e dopo che mostrano come cambia una stanza arredata in foto.</p>`,
    },
    {
      id: 'stile',
      title: 'Che stile scegliere per tipo di casa e acquirente',
      html: `<p>Lo stile non si sceglie in base ai gusti dell'agente o del proprietario, ma a chi comprerà quella casa. Qualche esempio:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Immobile</th><th ${TH}>Acquirente probabile</th><th ${TH}>Stile consigliato</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Monolocale o bilocale in città</td><td ${TD}>Giovani, single, coppie, investitori per affitto</td><td ${TD}>Moderno essenziale, mobili compatti e multifunzione</td></tr>
    <tr><td ${TD}>Trilocale in quartiere residenziale</td><td ${TD}>Famiglie giovani</td><td ${TD}>Contemporaneo caldo, legno chiaro, cameretta ben visibile</td></tr>
    <tr><td ${TD}>Appartamento d'epoca</td><td ${TD}>Chi cerca carattere e soffitti alti</td><td ${TD}>Classico rivisitato, pochi pezzi che valorizzano pavimenti e modanature</td></tr>
    <tr><td ${TD}>Casa in campagna o rustico</td><td ${TD}>Famiglie, seconda casa</td><td ${TD}>Rustico moderno, materiali naturali, toni caldi</td></tr>
    <tr><td ${TD}>Casa al mare</td><td ${TD}>Seconda casa, affitto breve</td><td ${TD}>Leggero, colori chiari, fibre naturali</td></tr>
    <tr><td ${TD}>Immobile di pregio</td><td ${TD}>Acquirenti esigenti</td><td ${TD}>Elegante e sobrio, pochi pezzi di qualità</td></tr>
  </tbody>
</table>
<p>In ogni caso, meglio un arredo realistico e comune, simile a quello che l'acquirente potrebbe davvero mettere, che uno da rivista: un bilocale da sistemare arredato come una suite crea aspettative che la visita smentisce.</p>`,
    },
    {
      id: 'errori',
      title: 'Errori da evitare negli esempi di home staging',
      html: `<ul>
  <li><strong>Troppi oggetti</strong>: l'home staging non è arredare di più, è arredare meglio. Ogni pezzo in più toglie spazio visivo.</li>
  <li><strong>Stile fuori contesto</strong>: un arredo di lusso in un monolocale da ristrutturare crea un contrasto che alla visita delude.</li>
  <li><strong>Stili diversi da una stanza all'altra</strong>: la casa deve sembrare una sola, con un filo coerente di colori e materiali.</li>
  <li><strong>Nascondere i difetti</strong>: un mobile messo davanti a una macchia di umidità, in foto o dal vivo, è un problema di correttezza, non di estetica.</li>
  <li><strong>Dimenticare la foto reale</strong>: nel virtuale, la stanza arredata va sempre affiancata allo scatto originale.</li>
</ul>
<p>Un buon modo per verificare il risultato è guardare il prima e dopo insieme al proprietario: se riconosce la sua casa, ma la vede più ordinata e luminosa, il lavoro è fatto bene.</p>`,
    },
    {
      id: 'fisico-virtuale',
      title: 'Home staging fisico o virtuale: quale usare in questi esempi',
      html: `<p>Riassumendo gli esempi:</p>
<ul>
  <li><strong>Preparazione fisica sempre</strong>: decluttering, pulizia, luce, biancheria, bagno e cucina in ordine. Non costa quasi nulla e migliora sia le foto sia le visite.</li>
  <li><strong>Virtuale</strong> per stanze vuote, arredi datati, ambienti da mostrare in più versioni, e per avere foto pronte subito. Va sempre dichiarato, con la foto reale accanto.</li>
  <li><strong>Fisico completo</strong> per immobili dove la visita pesa molto, case vuote di fascia alta, proprietari disposti a sostenere la spesa.</li>
</ul>
<p>Per un confronto dei costi tra le due strade leggi la guida su <a href="/it/home-staging-costo">quanto costa l'home staging</a>. Se vuoi arredare una foto da solo, trovi i passaggi pratici in <a href="/it/arredare-foto-con-ai">arredare una foto con l'AI</a>. E se la casa è ferma da tempo, l'home staging è uno dei passi del piano descritto nella guida sulla <a href="/it/casa-che-non-si-vende">casa che non si vende</a>.</p>`,
    },
  ],
  faq: [
    ['Cosa si fa concretamente in un home staging?', 'Si tolgono oggetti personali e mobili superflui, si pulisce e si cura la luce, si aggiungono pochi elementi che fanno capire la funzione di ogni stanza e si sceglie uno stile adatto all\'acquirente probabile. Nel virtuale la stessa logica si applica solo alle foto.'],
    ['Quale stanza conviene curare per prima?', 'Il soggiorno, perché spesso è la foto di copertina dell\'annuncio, e le stanze vuote, che in foto rendono peggio di tutte.'],
    ['Che stile usare per l\'home staging?', 'Quello di chi probabilmente comprerà: moderno essenziale per bilocali in città, contemporaneo caldo per famiglie, classico rivisitato per case d\'epoca. Meglio un arredo realistico che uno da rivista.'],
    ['Si può fare home staging virtuale di bagno e cucina?', 'Si possono riordinare e aggiungere complementi, ma piastrelle, sanitari, mobili fissi e piani di lavoro devono restare quelli veri. Cambiarli in foto significherebbe mostrare una ristrutturazione che non c\'è.'],
    ['Dove trovo esempi di home staging prima e dopo?', 'Puoi partire dagli esempi stanza per stanza di questa guida. Sul sito di Agente Immo trovi anche alcune foto prima e dopo di stanze arredate con l\'AI.'],
    ['Devo dichiarare l\'home staging virtuale nell\'annuncio?', 'Sì, è buona pratica: una scritta sulla foto, una riga nel testo e la foto reale accanto. Trovi i dettagli nella guida al virtual staging legale.'],
  ],
};

export const arredareFotoConAi: Guide = {
  slug: 'arredare-foto-con-ai',
  label: 'Arredare foto con AI',
  title: `Arredare foto con AI: guida pratica per agenti immobiliari`,
  description: `Arredare foto con AI: come funziona, come scattare la foto giusta, stili, prompt pronti in italiano, limiti e come usarla negli annunci in modo corretto.`,
  h1: `Arredare foto con AI: come arredare una stanza online partendo da una foto`,
  intro: `Per arredare una foto con l'AI carichi lo scatto della stanza in uno strumento di home staging virtuale, scrivi cosa vuoi (per esempio "arredala in stile moderno") e in pochi secondi ottieni la stessa stanza arredata. Il risultato dipende soprattutto da due cose: una foto di partenza ben fatta e una richiesta chiara. Qui trovi come fare entrambe e come usare l'immagine negli annunci.`,
  published: '2026-10-02',
  updated: '2026-10-02',
  sections: [
    {
      id: 'come-funziona',
      title: 'Come funziona arredare una foto con l\'intelligenza artificiale',
      html: `<p>Gli strumenti di arredo con AI usano modelli che generano immagini partendo da una foto e da un'indicazione scritta. Il modello riconosce pareti, pavimento, finestre e prospettiva, e aggiunge mobili coerenti con lo spazio, con la luce e con lo stile richiesto.</p>
<p>Il flusso tipico è questo:</p>
<ol>
  <li><strong>Carichi la foto</strong> della stanza, vuota o arredata.</li>
  <li><strong>Scrivi o scegli cosa vuoi</strong>: arredare, svuotare, cambiare stile, modificare un dettaglio.</li>
  <li><strong>Ottieni il risultato</strong> e lo confronti con l'originale, spesso con uno slider prima e dopo.</li>
  <li><strong>Correggi</strong> con una nuova richiesta, se qualcosa non ti convince, o rigeneri.</li>
</ol>
<p>Rispetto all'home staging virtuale fatto a mano da un grafico, la differenza principale è il tempo: secondi invece di ore o giorni, e la possibilità di provare più versioni. Per il quadro generale vedi la guida all'<a href="/it/home-staging-virtuale">home staging virtuale</a> e quella sull'<a href="/it/intelligenza-artificiale-agenti-immobiliari">intelligenza artificiale per agenti immobiliari</a>.</p>
<p>Per un <a href="/it/agente-immobiliare">agente immobiliare</a> il vantaggio pratico è poter presentare ogni immobile allo stesso livello, anche quelli per cui un home stager non sarebbe mai stato pagato.</p>`,
    },
    {
      id: 'scattare-la-foto',
      title: 'Come scattare la foto perché l\'AI la arredi bene',
      html: `<p>L'AI lavora su quello che vede. Una foto storta, scura o tagliata male produce un arredo storto, scuro o fuori scala. Prima di scattare:</p>
<ul>
  <li><strong>Luce naturale</strong>: scatta di giorno, tende aperte, luci accese. Evita il controluce pieno verso la finestra.</li>
  <li><strong>Orizzontale e verticali dritte</strong>: telefono in orizzontale, all'altezza del petto, parallelo alle pareti. Linee storte confondono la prospettiva.</li>
  <li><strong>Inquadra il pavimento</strong>: l'AI deve vedere dove appoggiare i mobili. Una foto con poco pavimento dà arredi sospesi o tagliati.</li>
  <li><strong>Dall'angolo, non dal centro</strong>: uno scatto da un angolo della stanza mostra due o tre pareti e dà profondità.</li>
  <li><strong>Grandangolo moderato</strong>: il grandangolo del telefono va bene, ma senza esagerare: distorce le proporzioni e i mobili sembrano fuori misura.</li>
  <li><strong>Stanza pulita</strong>: se la stanza è arredata e vuoi sostituire i mobili, puoi chiedere all'AI di svuotarla, ma un ambiente già in ordine dà risultati più puliti.</li>
</ul>
<p>Trovi la procedura completa, stanza per stanza, nella guida alle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a>.</p>`,
    },
    {
      id: 'stili',
      title: 'Arredare una stanza online da foto: gli stili più usati',
      html: `<p>Lo stile va scelto in base a chi comprerà o affitterà, non ai gusti personali. Gli stili più utili per gli annunci:</p>
<ul>
  <li><strong>Moderno</strong>: linee semplici, colori neutri, pochi oggetti. Va bene quasi ovunque ed è la scelta più sicura.</li>
  <li><strong>Scandinavo</strong>: legno chiaro, bianco, tessuti naturali. Ottimo per case luminose e famiglie giovani.</li>
  <li><strong>Contemporaneo caldo</strong>: moderno ma con toni terra, legno e tessuti morbidi. Rende accoglienti le stanze fredde.</li>
  <li><strong>Classico rivisitato</strong>: per appartamenti d'epoca, valorizza pavimenti e soffitti senza appesantire.</li>
  <li><strong>Rustico moderno</strong>: per case di campagna, casali, mansarde con travi.</li>
  <li><strong>Industriale</strong>: per loft e open space con materiali a vista, da usare con misura.</li>
</ul>
<p>Qualunque stile scegli, l'arredo deve sembrare quello di una vera casa italiana in vendita: mobili comuni e credibili, non da catalogo di lusso. Per esempi di stile in base al tipo di immobile, vedi <a href="/it/home-staging-esempi">home staging: esempi prima e dopo</a>.</p>`,
    },
    {
      id: 'prompt',
      title: 'Cosa chiedere all\'AI: esempi di richieste in italiano',
      html: `<p>Una buona richiesta è breve e specifica: <strong>cosa fare, in che stile, con quali vincoli</strong>. Ecco esempi da copiare e adattare:</p>
<p><strong>Arredare una stanza vuota</strong></p>
<ul>
  <li><em>"Arreda questo soggiorno in stile moderno, con divano grigio chiaro, tavolino in legno e tappeto. Lascia invariati pavimento, pareti e finestre."</em></li>
  <li><em>"Trasforma questa stanza in una camera matrimoniale con letto, due comodini e armadio. Stile scandinavo."</em></li>
  <li><em>"Arreda questa piccola stanza come studio con scrivania, sedia e libreria."</em></li>
</ul>
<p><strong>Svuotare o sostituire</strong></p>
<ul>
  <li><em>"Svuota la stanza, togli tutti i mobili e gli oggetti."</em></li>
  <li><em>"Togli gli scatoloni e i vestiti, lascia i mobili."</em></li>
  <li><em>"Sostituisci i mobili con un arredo moderno e luminoso."</em></li>
</ul>
<p><strong>Cambiare un dettaglio</strong></p>
<ul>
  <li><em>"Metti un tappeto chiaro sotto il tavolo."</em></li>
  <li><em>"Aggiungi una pianta vicino alla finestra."</em></li>
  <li><em>"Rendi il divano più piccolo, è fuori scala."</em></li>
  <li><em>"Pareti bianche."</em> (solo se la tinteggiatura è prevista davvero, o se lo presenti come proposta: vedi la sezione sulla correttezza)</li>
</ul>
<p><strong>Esterni</strong></p>
<ul>
  <li><em>"Arreda il terrazzo con un tavolo da pranzo per sei persone e qualche pianta."</em></li>
  <li><em>"Sul balcone metti un tavolino con due sedie."</em></li>
</ul>
<p>Se il risultato non va, non riscrivere tutto: chiedi una correzione alla volta. "Il letto è troppo grande", "togli il quadro", "più luce" funzionano meglio di una nuova richiesta lunga.</p>`,
    },
    {
      id: 'limiti',
      title: 'Limiti dell\'arredo con AI e come controllarli',
      html: `<p>L'AI è veloce, ma non è infallibile. Prima di pubblicare controlla sempre:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Problema possibile</th><th ${TH}>Cosa controllare</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Struttura alterata</td><td ${TD}>Porte, finestre, prese, termosifoni e pareti sono identici all'originale</td></tr>
    <tr><td ${TD}>Mobili fuori scala</td><td ${TD}>Un letto matrimoniale ha misure da matrimoniale, il divano entra davvero nello spazio</td></tr>
    <tr><td ${TD}>Finiture cambiate</td><td ${TD}>Pavimento, infissi, cucina fissa e bagno non sono stati modificati</td></tr>
    <tr><td ${TD}>Arredi davanti a porte o finestre</td><td ${TD}>Il percorso nella stanza ha senso, nessun mobile blocca un passaggio</td></tr>
    <tr><td ${TD}>Dettagli strani</td><td ${TD}>Gambe dei mobili, ombre, riflessi negli specchi, oggetti fusi tra loro</td></tr>
    <tr><td ${TD}>Stile irrealistico</td><td ${TD}>L'arredo è credibile per quella casa e quella fascia di prezzo</td></tr>
  </tbody>
</table>
<p>Se un dettaglio non va, chiedi una correzione o rigenera. Se la struttura è stata cambiata, scarta l'immagine: non va pubblicata. Ricorda anche che l'arredo virtuale migliora la foto, non la visita: la casa resta com'è, e chi la visita deve trovare quello che si aspetta.</p>`,
    },
    {
      id: 'correttezza',
      title: 'Foto arredate con AI negli annunci: come usarle correttamente',
      html: `<p>Arredare una foto è corretto se chi la guarda capisce che l'arredo non c'è e se la casa che vede è la stessa che troverà alla visita. Tre regole pratiche:</p>
<ol>
  <li><strong>Aggiungi o togli solo elementi mobili</strong>: mobili, complementi, oggetti. Mai struttura, finiture, vista o difetti.</li>
  <li><strong>Dichiaralo</strong>: una scritta "Arredo virtuale" sulla foto e una riga nel testo dell'annuncio.</li>
  <li><strong>Pubblica anche la foto reale</strong> della stessa stanza, idealmente subito dopo.</li>
</ol>
<p>Le modifiche che toccano l'immobile, come pareti di un altro colore o pavimento diverso, si possono mostrare solo come proposta, separata e indicata come tale. Trovi tutti i dettagli e una checklist nella guida al <a href="/it/virtual-staging-legale">virtual staging legale</a>. Informa sempre anche il proprietario su quali foto sono arredate.</p>`,
    },
    {
      id: 'flusso-annuncio',
      title: 'Dalla foto all\'annuncio: un flusso di lavoro in 6 passaggi',
      html: `<p>Per non perdere tempo su ogni incarico, conviene seguire sempre lo stesso ordine:</p>
<ol>
  <li><strong>Scatta tutte le stanze</strong> con le regole viste sopra, anche quelle che non pensi di arredare: ti servono comunque come foto reali.</li>
  <li><strong>Scegli le stanze da arredare</strong>: di solito quelle vuote, quelle con arredi molto datati e il soggiorno, se sarà la copertina. Bagno e cucina raramente ne hanno bisogno.</li>
  <li><strong>Decidi uno stile unico</strong> per tutta la casa, in base all'acquirente probabile. Stili diversi da una stanza all'altra confondono.</li>
  <li><strong>Genera, controlla, correggi</strong>: usa la tabella dei limiti come lista di controllo per ogni immagine.</li>
  <li><strong>Prepara la galleria</strong>: foto arredata con la scritta "Arredo virtuale", subito dopo la foto reale della stessa stanza.</li>
  <li><strong>Riusa le immagini</strong>: le coppie prima e dopo sono ottime per un reel o un post, e per mostrare il lavoro al proprietario.</li>
</ol>
<p>Due errori frequenti da evitare: arredare ogni stanza, compresi corridoi e ripostigli, che appesantisce la galleria senza aggiungere informazioni, e pubblicare solo le foto arredate, che crea aspettative sbagliate. Se l'annuncio è già online e non riceve chiamate, l'arredo virtuale è uno dei controlli suggeriti nella guida all'<a href="/it/annuncio-immobiliare-senza-contatti">annuncio immobiliare senza contatti</a>.</p>`,
    },
    {
      id: 'agente-immo',
      title: 'Arredare foto con AI su Agente Immo',
      html: `<p>Su <a href="/it">Agente Immo</a> l'arredo avviene in una chat di home staging: carichi la foto, scrivi cosa vuoi ("arredala in stile moderno", "svuota la stanza", "pareti bianche") e l'AI arreda, svuota, cambia stile o modifica un dettaglio. Il risultato si confronta con l'originale con uno slider prima e dopo. Puoi anche lavorare sulle planimetrie, a colori o in 3D.</p>
<p>Dalle foto arredate puoi poi creare video per i social con musica inclusa e senza montaggio, per esempio con il modello Prima e dopo. Il piano Starter parte da 19 € al mese, e puoi <a href="/it#prova">provare gratis</a> con una foto e un video.</p>
<p>Le foto arredate funzionano anche in fase di acquisizione: mostrare al proprietario una sua stanza già arredata in foto rende concreto come presenterai la casa. Ne parliamo nella guida su come <a href="/it/acquisire-incarichi-immobiliari">acquisire incarichi immobiliari</a>.</p>`,
    },
  ],
  faq: [
    ['Come si arreda una foto con l\'intelligenza artificiale?', 'Carichi la foto della stanza in uno strumento di home staging virtuale, scrivi cosa vuoi, per esempio arredarla in stile moderno, e l\'AI genera la stessa stanza arredata. Poi controlli il risultato e chiedi eventuali correzioni.'],
    ['Che foto serve per arredare una stanza con l\'AI?', 'Una foto orizzontale, luminosa, con le verticali dritte, scattata da un angolo della stanza e con il pavimento ben visibile. Più la foto è pulita, più il risultato è credibile.'],
    ['Cosa scrivo all\'AI per arredare una stanza?', 'Una richiesta breve con cosa fare, lo stile e i vincoli. Per esempio: arreda questo soggiorno in stile moderno con divano chiaro e tappeto, lascia invariati pavimento e finestre.'],
    ['L\'AI può svuotare una stanza arredata?', 'Sì, molti strumenti permettono di togliere mobili e oggetti dalla foto. Anche in questo caso va indicato nell\'annuncio, perché alla visita la casa sarà com\'è.'],
    ['Posso usare le foto arredate con AI negli annunci?', 'Sì, se l\'arredo è dichiarato, la struttura e le finiture non sono cambiate e pubblichi anche la foto reale. Trovi i dettagli nella guida al virtual staging legale.'],
    ['Quali sono i limiti dell\'arredo con AI?', 'Può sbagliare le proporzioni, alterare dettagli come porte o finestre o produrre oggetti strani. Per questo ogni immagine va controllata prima di pubblicarla e scartata se modifica la struttura.'],
  ],
};

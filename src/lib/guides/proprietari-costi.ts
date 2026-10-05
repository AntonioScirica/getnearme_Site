import type { Guide } from './types';

// Guide per proprietari che vendono casa: costi del venditore, documenti necessari, plusvalenza.
// Niente cifre, aliquote o leggi inventate: dove non c'è certezza si resta generici e si rimanda a notaio e commercialista.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const quantoCostaVendere: Guide = {
  slug: 'quanto-costa-vendere-casa',
  label: 'Quanto costa vendere casa',
  title: 'Quanto costa vendere casa: tutte le spese del venditore',
  description: `Quanto costa vendere casa con agenzia, dal notaio, prima dei 5 anni o se è ereditata: le spese voce per voce, chi paga cosa e una checklist pratica.`,
  h1: 'Quanto costa vendere casa: le spese di chi vende, voce per voce',
  intro: `Vendere casa costa meno di quanto molti pensano, perché il notaio di solito lo paga chi compra. Le spese principali del venditore sono la provvigione dell'agenzia (se ne usi una), l'APE, eventuali regolarizzazioni dei documenti e, se c'è un mutuo, la sua estinzione. Qui trovi ogni voce spiegata in modo semplice, con una tabella finale su chi paga cosa.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'in-breve',
      title: 'Quanto costa vendere casa: le spese in breve',
      html: `<p>Prima di entrare nel dettaglio, ecco le voci che possono riguardarti come venditore. Non tutte capitano a tutti: dipende dalla tua casa e dalla tua situazione.</p>
<ul>
  <li><strong>Agenzia immobiliare</strong>: la provvigione, solo se ti affidi a un agente.</li>
  <li><strong>APE</strong>: l'attestato sulla classe energetica della casa, obbligatorio per vendere.</li>
  <li><strong>Regolarizzazioni</strong>: se la casa reale non corrisponde a quella registrata al catasto o in Comune.</li>
  <li><strong>Mutuo</strong>: la chiusura del mutuo residuo e la cancellazione dell'ipoteca.</li>
  <li><strong>Plusvalenza</strong>: un'imposta sul guadagno, solo in alcuni casi se vendi entro 5 anni.</li>
  <li><strong>Spese condominiali</strong>: quelle fino al giorno della vendita.</li>
  <li><strong>Trasloco</strong> e piccole spese pratiche.</li>
</ul>
<p>Prima ancora dei costi, però, conviene sapere quanto puoi chiedere. Se non hai un'idea del prezzo, fai una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a>: ti aiuta a capire quanto resterà davvero in tasca dopo le spese.</p>`,
    },
    {
      id: 'agenzia',
      title: 'Quanto costa vendere casa con agenzia: la provvigione',
      html: `<p>La <strong>provvigione</strong> è il compenso dell'agenzia immobiliare. Si paga quando la vendita va in porto, di solito al momento del compromesso o del rogito, secondo quanto scritto nell'incarico.</p>
<p>Un punto importante: <strong>non esiste una tariffa fissa stabilita dalla legge</strong>. La provvigione è libera e si concorda con l'agente. Spesso si sente parlare di una percentuale tra il 2 e il 4% del prezzo, più IVA, ma è solo un ordine di grandezza: va concordata e scritta nell'incarico, nero su bianco.</p>
<p>Quando firmi l'incarico (il contratto con cui affidi la vendita all'agenzia), controlla:</p>
<ul>
  <li>la percentuale o la cifra fissa, e se è IVA inclusa o esclusa;</li>
  <li>quando matura la provvigione: alla proposta accettata, al compromesso o al rogito;</li>
  <li>la durata dell'incarico e se è in esclusiva;</li>
  <li>se ci sono altre spese a tuo carico, per esempio pubblicità o foto.</li>
</ul>
<p>Vendere senza agenzia è perfettamente legale e ti fa risparmiare la provvigione, ma tutto il lavoro resta a te: annunci, visite, trattativa, controllo dei documenti. Ne parliamo nella guida su <a href="/it/vendere-casa-senza-agenzia">come vendere casa senza agenzia</a>. Se vuoi capire meglio come funzionano le percentuali, c'è anche una guida dedicata alla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>`,
    },
    {
      id: 'ape',
      title: 'APE: un costo che hai quasi sempre',
      html: `<p>L'<strong>APE</strong> (Attestato di Prestazione Energetica) è il documento che indica la classe energetica della casa, da A4 (la migliore) a G (la peggiore). È <strong>obbligatorio per vendere</strong>: va allegato all'atto di vendita e la classe va indicata anche negli annunci.</p>
<p>Lo prepara un <strong>tecnico abilitato</strong> (geometra, ingegnere, architetto o altro professionista abilitato), che viene a vedere la casa e l'impianto di riscaldamento. Il costo non è fisso: dipende dal tecnico, dalla zona e dalla casa. Chiedi un preventivo a uno o due professionisti.</p>
<p>L'APE dura <strong>10 anni</strong>, ma può decadere prima se non sono stati fatti i controlli obbligatori sull'impianto termico. Se ne hai già uno, verifica la data e chiedi a un tecnico se è ancora valido: potresti risparmiare questa spesa.</p>`,
    },
    {
      id: 'regolarizzazioni',
      title: 'Regolarizzazioni catastali e urbanistiche',
      html: `<p>È la voce più imprevedibile, e per questo conviene scoprirla presto. Due parole da conoscere:</p>
<ul>
  <li><strong>Conformità catastale</strong>: la casa deve corrispondere alla <strong>planimetria catastale</strong>, cioè il disegno della casa depositato al catasto. Se hai spostato una parete o aperto una porta e il disegno è rimasto quello vecchio, va aggiornato. Dal 2010 la conformità catastale va dichiarata nell'atto di vendita.</li>
  <li><strong>Conformità urbanistica</strong>: la casa deve corrispondere a quanto autorizzato dal Comune con i titoli edilizi (licenze, permessi, pratiche dei lavori). Se in passato sono stati fatti lavori senza la pratica giusta, può servire una sanatoria.</li>
</ul>
<p>In entrambi i casi serve un <strong>tecnico</strong> (di solito un geometra). Il costo è <strong>variabile</strong>: un semplice aggiornamento della planimetria è una cosa, una pratica in Comune con eventuali sanzioni è tutt'altra. L'unico modo serio per saperlo è far controllare i documenti a un tecnico e chiedere un preventivo.</p>
<p>Il consiglio pratico: fai questo controllo <strong>prima</strong> di mettere in vendita. Scoprire un problema dopo il compromesso significa ritardi, tensioni con l'acquirente e a volte uno sconto sul prezzo. Per l'elenco completo delle carte da preparare, leggi la guida sui <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>.</p>`,
    },
    {
      id: 'mutuo',
      title: 'Casa con mutuo: estinzione e cancellazione dell\'ipoteca',
      html: `<p>Puoi vendere una casa su cui stai ancora pagando il mutuo. Di solito il debito residuo si chiude il giorno del rogito, usando una parte dei soldi pagati dall'acquirente.</p>
<p>Ecco i passaggi e i costi possibili:</p>
<ul>
  <li><strong>Conteggio estintivo</strong>: chiedi alla banca quanto devi esattamente per chiudere il mutuo a una certa data. È la cifra da cui partire.</li>
  <li><strong>Penale di estinzione anticipata</strong>: per i mutui per l'acquisto della prima casa fatti da persone fisiche dal 2007 in poi, la legge ha eliminato la penale. Per mutui più vecchi o di tipo diverso, controlla il tuo contratto o chiedi alla banca.</li>
  <li><strong>Cancellazione dell'ipoteca</strong>: l'ipoteca è la garanzia che la banca ha sulla casa. Quando estingui il mutuo, esiste la <strong>cancellazione automatica e gratuita</strong> fatta dalla banca (la cosiddetta procedura "Bersani"). In alcuni casi si sceglie invece la cancellazione con atto del notaio, che ha un costo: chiedi al notaio quale strada è adatta a te.</li>
</ul>
<p>Avvisa subito la banca e il notaio che vuoi vendere: coordinare banca, notaio e acquirente richiede tempo.</p>`,
    },
    {
      id: 'notaio',
      title: 'Quanto costa vendere casa dal notaio: chi paga',
      html: `<p>Il <strong>rogito</strong> è l'atto di vendita vero e proprio, firmato davanti al notaio: è il momento in cui la casa passa all'acquirente. Per prassi, le spese del notaio per il rogito e le imposte sull'acquisto <strong>le paga di solito l'acquirente</strong>, che di norma sceglie anche il notaio.</p>
<p>Come venditore puoi però avere qualche costo legato al notaio:</p>
<ul>
  <li>l'eventuale cancellazione dell'ipoteca con atto notarile, se non usi quella automatica della banca;</li>
  <li>l'imposta sulla plusvalenza, se ti riguarda e scegli di pagarla tramite il notaio (vedi sotto);</li>
  <li>eventuali atti preparatori, per esempio legati a una successione non completata.</li>
</ul>
<p>Prima del rogito c'è spesso il <strong>compromesso</strong> (contratto preliminare), in cui tu e l'acquirente vi impegnate a vendere e comprare a un certo prezzo. Va registrato all'Agenzia delle Entrate entro 20 giorni; i costi di registrazione si dividono come concordato. Per qualsiasi dubbio, verifica con il notaio chi paga cosa nel tuo caso.</p>`,
    },
    {
      id: 'prima-dei-5-anni',
      title: 'Vendere casa prima dei 5 anni: la plusvalenza',
      html: `<p>La <strong>plusvalenza</strong> è il guadagno che fai vendendo la casa a un prezzo più alto di quello che l'hai pagata. In certi casi è tassata, ma <strong>solo se vendi entro 5 anni</strong> dall'acquisto o dalla costruzione.</p>
<p>Anche entro i 5 anni, in molti casi non si paga: per esempio se la casa è stata per la maggior parte del tempo la tua abitazione principale o quella dei tuoi familiari. Se l'imposta è dovuta, si può pagare un'imposta sostitutiva del 26% tramite il notaio al rogito, oppure in dichiarazione dei redditi.</p>
<p>Le regole hanno parecchie eccezioni: le trovi spiegate nella guida sulla <a href="/it/plusvalenza-vendita-casa">plusvalenza sulla vendita della casa</a>. Il consiglio è uno: se vendi entro 5 anni, parlane con il commercialista o il CAF prima di firmare il compromesso.</p>`,
    },
    {
      id: 'casa-ereditata',
      title: 'Quanto costa vendere una casa ereditata',
      html: `<p>Una casa ricevuta in eredità ha alcune voci in più, ma anche una buona notizia: per gli immobili ricevuti in successione <strong>la plusvalenza non si paga</strong>.</p>
<p>Le spese tipiche, se non sono già state fatte, sono:</p>
<ul>
  <li><strong>Dichiarazione di successione</strong>: la comunicazione all'Agenzia delle Entrate di cosa lascia la persona scomparsa. Puoi farla da solo, con un CAF o con un professionista, che ha un suo compenso.</li>
  <li><strong>Imposte di successione e di trascrizione</strong>: dipendono dal grado di parentela e dal valore. Fatti fare il calcolo da chi prepara la dichiarazione.</li>
  <li><strong>Voltura catastale</strong>: il passaggio dell'intestazione al catasto dal defunto agli eredi.</li>
  <li><strong>Accettazione dell'eredità</strong>: il notaio verificherà che risulti. Se manca, può servire un atto apposito.</li>
</ul>
<p>Se gli eredi sono più di uno, tutti devono essere d'accordo e firmare. Mettere d'accordo fratelli e parenti sul prezzo è più facile con un numero oggettivo davanti: una <a href="/it/quanto-vale-la-mia-casa">stima gratuita del valore della casa</a> basata sulle quotazioni ufficiali della zona è un buon punto di partenza comune.</p>`,
    },
    {
      id: 'altre-spese',
      title: 'Spese condominiali, trasloco e altre spese',
      html: `<p>Restano alcune voci piccole ma da mettere in conto:</p>
<ul>
  <li><strong>Spese condominiali</strong>: le spese ordinarie fino al giorno del rogito sono di solito a tuo carico. Chiedi all'amministratore una situazione aggiornata dei pagamenti. Per eventuali <strong>lavori straordinari</strong> già decisi dall'assemblea, chi paga va chiarito per iscritto nel compromesso: è un punto che crea spesso discussioni.</li>
  <li><strong>Utenze</strong>: luce, gas, acqua, internet. Vanno chiuse o volturate all'acquirente, con l'ultima bolletta a tuo carico.</li>
  <li><strong>Trasloco</strong>: dipende da quanta roba hai, dalla distanza e dal piano. Chiedi due o tre preventivi.</li>
  <li><strong>Sgombero e pulizie</strong>: se la casa va consegnata vuota, come accade spesso.</li>
  <li><strong>Piccoli lavori prima della vendita</strong>: una mano di bianco, un rubinetto sistemato. Sono facoltativi, ma possono aiutare. Ne parliamo in <a href="/it/cosa-fare-prima-di-vendere-casa">cosa fare prima di vendere casa</a>.</li>
</ul>`,
    },
    {
      id: 'tabella',
      title: 'Chi paga cosa: tabella riepilogo',
      html: `<p>Una sintesi delle voci principali. Gli importi non sono indicati perché cambiano molto da caso a caso: per ognuna chiedi un preventivo.</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Voce</th><th ${TH}>Chi paga di solito</th><th ${TH}>Quanto</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Provvigione agenzia</strong></td><td ${TD}>Venditore (e di solito anche l'acquirente, per la sua parte)</td><td ${TD}>Libera, da concordare per iscritto nell'incarico</td></tr>
    <tr><td ${TD}><strong>APE</strong></td><td ${TD}>Venditore</td><td ${TD}>Variabile, chiedi un preventivo a un tecnico</td></tr>
    <tr><td ${TD}><strong>Regolarizzazioni catastali o urbanistiche</strong></td><td ${TD}>Venditore</td><td ${TD}>Variabile, da nulla a importante: serve il parere di un tecnico</td></tr>
    <tr><td ${TD}><strong>Estinzione mutuo</strong></td><td ${TD}>Venditore</td><td ${TD}>Il debito residuo indicato dalla banca nel conteggio estintivo</td></tr>
    <tr><td ${TD}><strong>Cancellazione ipoteca</strong></td><td ${TD}>Venditore</td><td ${TD}>Gratuita con la procedura automatica della banca; con atto notarile ha un costo</td></tr>
    <tr><td ${TD}><strong>Notaio del rogito e imposte d'acquisto</strong></td><td ${TD}>Acquirente</td><td ${TD}>Non a tuo carico, salvo accordi diversi</td></tr>
    <tr><td ${TD}><strong>Plusvalenza</strong></td><td ${TD}>Venditore, solo in alcuni casi entro 5 anni</td><td ${TD}>Dipende dal guadagno: chiedi al commercialista</td></tr>
    <tr><td ${TD}><strong>Spese condominiali fino al rogito</strong></td><td ${TD}>Venditore</td><td ${TD}>Chiedi la situazione all'amministratore</td></tr>
    <tr><td ${TD}><strong>Trasloco e sgombero</strong></td><td ${TD}>Venditore</td><td ${TD}>Variabile, chiedi un preventivo</td></tr>
  </tbody>
</table></div>`,
    },
    {
      id: 'checklist',
      title: 'Checklist: i costi da verificare prima di vendere',
      html: `<ol>
  <li>Hai un'idea realistica del prezzo, per esempio con una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita</a> o confrontando i <a href="/it/prezzi-case">prezzi delle case nella tua città</a>.</li>
  <li>Se usi un'agenzia, la provvigione è scritta nell'incarico, con IVA e momento del pagamento.</li>
  <li>Hai un APE valido, o un preventivo per farlo.</li>
  <li>Un tecnico ha controllato che la casa corrisponda alla planimetria catastale e ai titoli edilizi.</li>
  <li>Se c'è un mutuo, hai chiesto alla banca il conteggio estintivo e come cancellare l'ipoteca.</li>
  <li>Se hai comprato da meno di 5 anni, hai parlato con il commercialista della plusvalenza.</li>
  <li>Se la casa è ereditata, successione, voltura e accettazione dell'eredità sono a posto.</li>
  <li>Hai chiesto all'amministratore la situazione delle spese e dei lavori condominiali.</li>
  <li>Hai messo in conto trasloco, sgombero e chiusura delle utenze.</li>
  <li>Hai fatto il conto finale: prezzo atteso meno tutte le spese, meno l'eventuale mutuo residuo.</li>
</ol>
<p>Fare questo conto prima ti evita sorprese e ti aiuta a decidere con calma anche <a href="/it/quando-conviene-vendere-casa">quando conviene vendere</a>.</p>`,
    },
  ],
  faq: [
    ['Quanto costa vendere casa in totale?', `Non c'è una cifra valida per tutti. Le voci principali del venditore sono provvigione dell'agenzia (se la usi), APE, eventuali regolarizzazioni, estinzione del mutuo e, in alcuni casi, la plusvalenza. Il notaio del rogito di solito lo paga l'acquirente.`],
    ['Chi paga il notaio quando si vende casa?', `Per prassi lo paga l'acquirente, che di norma lo sceglie. Il venditore può avere costi notarili solo per alcune operazioni, come la cancellazione dell'ipoteca con atto notarile. Verifica con il notaio nel tuo caso.`],
    ['Quanto prende un\'agenzia per vendere casa?', `La provvigione è libera, non c'è una tariffa di legge. Spesso si sente parlare di una percentuale tra il 2 e il 4% più IVA, ma va concordata e scritta nell'incarico prima di iniziare.`],
    ['Se vendo casa prima dei 5 anni pago le tasse?', `Solo in alcuni casi. Se la casa è stata per la maggior parte del tempo abitazione principale tua o dei tuoi familiari, o se l'hai ricevuta in successione, la plusvalenza non si paga. Negli altri casi chiedi al commercialista prima del compromesso.`],
    ['Quanto costa vendere una casa ereditata?', `Oltre alle spese normali di vendita, servono dichiarazione di successione, voltura catastale e accettazione dell'eredità, se non sono già state fatte. La buona notizia è che sugli immobili ricevuti in successione la plusvalenza non si paga.`],
    ['Devo pagare per cancellare l\'ipoteca?', `Se estingui il mutuo, la banca può fare la cancellazione automatica, che è gratuita. La cancellazione con atto del notaio invece ha un costo. Chiedi a banca e notaio quale strada usare.`],
  ],
};

export const documentiVendereCasa: Guide = {
  slug: 'documenti-per-vendere-casa',
  label: 'Documenti per vendere casa',
  title: 'Documenti per vendere casa: elenco completo e dove trovarli',
  description: `Documenti per vendere casa nel 2026: cosa sono, dove si chiedono e quando servono, anche tra privati o per una casa ereditata. Con checklist stampabile.`,
  h1: 'Documenti per vendere casa: cosa serve, dove si prende e quando',
  intro: `Per vendere casa servono soprattutto l'atto con cui l'hai avuta, visura e planimetria catastale aggiornate, i documenti edilizi del Comune, l'APE e i documenti del condominio. Alcuni li hai già in un cassetto, altri vanno chiesti a un tecnico o all'amministratore. Qui trovi ogni documento spiegato in parole semplici, con una tabella e una checklist da stampare.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'quando-servono',
      title: 'Quando servono i documenti: incarico, compromesso, rogito',
      html: `<p>I documenti non servono tutti nello stesso momento. Ci sono tre tappe:</p>
<ol>
  <li><strong>Incarico</strong>: è il contratto con cui affidi la vendita a un'agenzia. Un agente serio ti chiede già qui i documenti principali, per controllare che sia tutto in regola prima di pubblicare l'annuncio.</li>
  <li><strong>Compromesso</strong> (contratto preliminare): l'accordo scritto in cui tu e l'acquirente vi impegnate a vendere e comprare a un certo prezzo, di solito con una caparra. Va registrato all'Agenzia delle Entrate entro 20 giorni. A questo punto chi compra (e la sua banca, se fa un mutuo) vuole vedere le carte.</li>
  <li><strong>Rogito</strong>: l'atto di vendita firmato davanti al notaio, con cui la casa passa all'acquirente. Il notaio controlla tutto e alcuni documenti, come l'APE, vanno allegati all'atto.</li>
</ol>
<p>Il consiglio più utile di tutta la guida: <strong>raccogli i documenti prima di mettere in vendita</strong>. Se c'è un problema, lo scopri quando hai ancora tempo per risolverlo, e non dopo aver incassato una caparra. Per sapere da quale prezzo partire, puoi intanto fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a>.</p>`,
    },
    {
      id: 'provenienza',
      title: 'Atto di provenienza',
      html: `<p>È il documento che dimostra <strong>come sei diventato proprietario</strong>. Può essere:</p>
<ul>
  <li>il <strong>rogito d'acquisto</strong>, se hai comprato la casa;</li>
  <li>l'<strong>atto di donazione</strong>, se te l'hanno regalata;</li>
  <li>la <strong>dichiarazione di successione</strong>, se l'hai ereditata (più altri documenti, vedi sotto).</li>
</ul>
<p><strong>Dove si prende</strong>: di solito ne hai una copia a casa. Se non la trovi, puoi chiederla al notaio che ha fatto l'atto. <strong>Chi lo usa</strong>: il notaio del rogito, che ricostruisce la storia della proprietà.</p>`,
    },
    {
      id: 'catasto',
      title: 'Visura e planimetria catastale',
      html: `<p>Il <strong>catasto</strong> è l'archivio pubblico degli immobili, gestito dall'Agenzia delle Entrate.</p>
<ul>
  <li><strong>Visura catastale</strong>: una scheda con i dati della casa (indirizzo, foglio, particella, subalterno, categoria, rendita) e i nomi dei proprietari.</li>
  <li><strong>Planimetria catastale</strong>: il disegno della casa depositato al catasto, con stanze, porte e finestre.</li>
</ul>
<p><strong>Dove si prendono</strong>: online dai servizi dell'Agenzia delle Entrate con SPID, oppure tramite un tecnico o agli sportelli. <strong>Perché contano</strong>: dal 2010 nell'atto di vendita va dichiarato che la casa corrisponde alla planimetria (<strong>conformità catastale</strong>). Se hai spostato una parete o chiuso una porta e il disegno è vecchio, un tecnico deve aggiornarlo prima del rogito.</p>
<p>Controlla anche che nella visura risultino i proprietari giusti. Se c'è ancora il nome di un genitore scomparso, probabilmente manca la voltura dopo la successione.</p>`,
    },
    {
      id: 'urbanistica',
      title: 'Titoli edilizi, conformità urbanistica e agibilità',
      html: `<p>Qui entra in gioco il <strong>Comune</strong>. I <strong>titoli edilizi</strong> sono le autorizzazioni con cui la casa è stata costruita e poi modificata: licenza o permesso di costruire, e le pratiche dei lavori fatti negli anni (ristrutturazioni, spostamento di pareti, nuovi bagni).</p>
<p>La <strong>conformità urbanistica</strong> significa che la casa com'è oggi corrisponde a quanto autorizzato. Se in passato sono stati fatti lavori senza pratica, può servire una regolarizzazione, a volte con una sanzione.</p>
<p>Il <strong>certificato di agibilità</strong> attesta che la casa ha i requisiti per essere abitata. Non tutte le case ce l'hanno, soprattutto quelle più vecchie: se c'è, va consegnato.</p>
<p><strong>Dove si prendono</strong>: all'ufficio tecnico del Comune, con una richiesta di accesso agli atti. <strong>Chi lo fa</strong>: di solito un geometra o un altro tecnico, che recupera le pratiche, le confronta con la casa reale e ti dice se è tutto in regola. È il controllo più importante e quello che richiede più tempo: muoviti per primo su questo.</p>`,
    },
    {
      id: 'ape',
      title: 'APE, l\'attestato energetico',
      html: `<p>L'<strong>APE</strong> (Attestato di Prestazione Energetica) indica quanto consuma la casa, con una classe da A4 a G. È <strong>obbligatorio per vendere</strong>: la classe va scritta negli annunci e l'attestato va allegato all'atto.</p>
<p><strong>Chi lo fa</strong>: un tecnico abilitato, che visita la casa. <strong>Quanto dura</strong>: 10 anni, ma decade prima se non sono stati fatti i controlli obbligatori sulla caldaia o sull'impianto termico. Se ne hai uno, chiedi a un tecnico se è ancora valido. Serve già per l'annuncio, quindi va fatto subito.</p>`,
    },
    {
      id: 'condominio',
      title: 'Documenti del condominio',
      html: `<p>Se la casa è in un condominio, chiedi all'<strong>amministratore</strong>:</p>
<ul>
  <li>la situazione dei pagamenti, per dimostrare che sei in regola con le spese;</li>
  <li>il <strong>regolamento di condominio</strong>;</li>
  <li>le ultime <strong>delibere</strong> dell'assemblea e i bilanci;</li>
  <li>informazioni su eventuali <strong>lavori straordinari</strong> già decisi o in corso, e su chi li pagherà.</li>
</ul>
<p>L'acquirente li vorrà vedere prima del compromesso, soprattutto i lavori in arrivo: chi paga va scritto chiaramente nel contratto.</p>`,
    },
    {
      id: 'impianti',
      title: 'Documenti degli impianti',
      html: `<p>Se li hai, prepara anche:</p>
<ul>
  <li>il <strong>libretto dell'impianto</strong> di riscaldamento, con i controlli fatti;</li>
  <li>le <strong>dichiarazioni di conformità</strong> degli impianti (elettrico, gas, idraulico), rilasciate dall'installatore quando ha fatto i lavori.</li>
</ul>
<p>Non sempre esistono, specie per impianti vecchi. Se mancano, il notaio ti spiegherà come gestire la cosa nell'atto. Averli, però, rassicura chi compra.</p>`,
    },
    {
      id: 'personali',
      title: 'Documenti personali, comunione e separazione dei beni',
      html: `<p>Al notaio servono documento d'identità e codice fiscale di <strong>tutti i proprietari</strong>, e informazioni sullo <strong>stato civile</strong> e sul <strong>regime patrimoniale</strong>, cioè come sono divisi i beni tra coniugi.</p>
<ul>
  <li><strong>Comunione dei beni</strong>: se hai comprato la casa da sposato in comunione, la casa è anche di tuo marito o di tua moglie, anche se il nome sull'atto è solo il tuo. Di regola devono firmare entrambi.</li>
  <li><strong>Separazione dei beni</strong>: se la casa è intestata solo a te, firmi tu.</li>
  <li><strong>Separazione o divorzio</strong>: tieni a portata di mano gli atti, perché possono contenere accordi sulla casa.</li>
</ul>
<p>Nel dubbio, il notaio verifica tutto con un estratto dell'atto di matrimonio, che si chiede in Comune.</p>`,
    },
    {
      id: 'mutuo',
      title: 'Casa con mutuo in corso',
      html: `<p>Se stai ancora pagando il mutuo, chiedi alla banca il <strong>conteggio estintivo</strong>: la cifra esatta da versare per chiudere il debito a una certa data. Di solito il mutuo si chiude il giorno del rogito con parte dei soldi dell'acquirente, e poi va cancellata l'ipoteca, la garanzia della banca sulla casa. Banca, notaio e acquirente devono coordinarsi: avvisa la banca appena decidi di vendere. Sui costi di questa parte trovi i dettagli in <a href="/it/quanto-costa-vendere-casa">quanto costa vendere casa</a>.</p>`,
    },
    {
      id: 'casa-ereditata',
      title: 'Documenti per vendere una casa ereditata',
      html: `<p>Una casa ereditata si può vendere, ma prima la parte "burocratica" dell'eredità deve essere completa. Servono:</p>
<ul>
  <li><strong>Dichiarazione di successione</strong>: la comunicazione all'Agenzia delle Entrate di cosa lascia la persona scomparsa e a chi. Si presenta online, con un CAF o con un professionista.</li>
  <li><strong>Accettazione dell'eredità</strong>: è il passo con cui diventi erede a tutti gli effetti. Può essere <strong>espressa</strong> (con un atto scritto, di solito dal notaio) o <strong>tacita</strong> (quando ti comporti da erede, per esempio vendendo la casa). Il notaio controllerà che risulti nei registri e, se manca, ti dirà come sistemarla.</li>
  <li><strong>Voltura catastale</strong>: il cambio di intestazione al catasto, dal defunto agli eredi. Spesso viene fatta insieme alla dichiarazione di successione: verifica nella visura che i nomi siano aggiornati.</li>
  <li><strong>Certificato di morte</strong> e documenti di tutti gli eredi.</li>
</ul>
<p>Se gli eredi sono più di uno, firmano tutti. Prima di partire, conviene mettersi d'accordo sul prezzo: un riferimento comune come una <a href="/it/quanto-vale-la-mia-casa">stima gratuita del valore</a> basata sulle quotazioni della zona aiuta a evitare discussioni. Una buona notizia: sugli immobili ricevuti in successione la plusvalenza non si paga, come spiegato nella guida sulla <a href="/it/plusvalenza-vendita-casa">plusvalenza</a>.</p>`,
    },
    {
      id: 'privati-o-agenzia',
      title: 'Documenti per vendere casa tra privati o con agenzia',
      html: `<p>I documenti sono <strong>gli stessi</strong> in entrambi i casi: li chiede la legge e li controlla il notaio, non l'agenzia. Cambia solo chi ti aiuta a raccoglierli.</p>
<ul>
  <li><strong>Con agenzia</strong>: un buon agente ti dice cosa manca, a volte coinvolge un tecnico di fiducia e prepara il compromesso.</li>
  <li><strong>Tra privati</strong>: è perfettamente legale, ma la raccolta è tutta tua. Ti conviene coinvolgere un tecnico per catasto e Comune e chiedere al notaio di controllare le carte già prima del compromesso. Leggi anche <a href="/it/vendere-casa-senza-agenzia">come vendere casa senza agenzia</a>.</li>
</ul>`,
    },
    {
      id: 'tabella',
      title: 'Tabella: documento, dove si richiede, quando serve',
      html: `<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Documento</th><th ${TH}>Dove si richiede</th><th ${TH}>Quando serve</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Atto di provenienza</strong></td><td ${TD}>A casa tua o dal notaio che ha fatto l'atto</td><td ${TD}>Incarico, compromesso, rogito</td></tr>
    <tr><td ${TD}><strong>Visura catastale</strong></td><td ${TD}>Agenzia delle Entrate (online con SPID) o tramite tecnico</td><td ${TD}>Incarico, compromesso, rogito</td></tr>
    <tr><td ${TD}><strong>Planimetria catastale</strong></td><td ${TD}>Agenzia delle Entrate (online con SPID) o tramite tecnico</td><td ${TD}>Incarico, compromesso, rogito</td></tr>
    <tr><td ${TD}><strong>Titoli edilizi e conformità urbanistica</strong></td><td ${TD}>Ufficio tecnico del Comune, di solito tramite tecnico</td><td ${TD}>Prima del compromesso, verificati al rogito</td></tr>
    <tr><td ${TD}><strong>Certificato di agibilità</strong> (se c'è)</td><td ${TD}>Comune</td><td ${TD}>Compromesso, rogito</td></tr>
    <tr><td ${TD}><strong>APE</strong></td><td ${TD}>Tecnico abilitato</td><td ${TD}>Annuncio, compromesso, allegato al rogito</td></tr>
    <tr><td ${TD}><strong>Documenti condominiali</strong></td><td ${TD}>Amministratore di condominio</td><td ${TD}>Prima del compromesso</td></tr>
    <tr><td ${TD}><strong>Libretto e conformità impianti</strong></td><td ${TD}>A casa tua o dall'installatore</td><td ${TD}>Rogito</td></tr>
    <tr><td ${TD}><strong>Documenti personali e regime patrimoniale</strong></td><td ${TD}>A casa tua; estratto di matrimonio in Comune</td><td ${TD}>Compromesso, rogito</td></tr>
    <tr><td ${TD}><strong>Conteggio estintivo del mutuo</strong></td><td ${TD}>La tua banca</td><td ${TD}>Prima del rogito</td></tr>
    <tr><td ${TD}><strong>Successione, accettazione, voltura</strong> (casa ereditata)</td><td ${TD}>Agenzia delle Entrate, notaio, CAF o professionista</td><td ${TD}>Prima di mettere in vendita</td></tr>
  </tbody>
</table></div>`,
    },
    {
      id: 'checklist',
      title: 'Checklist stampabile dei documenti per vendere casa',
      html: `<ol>
  <li>Atto di provenienza (rogito d'acquisto, donazione o successione).</li>
  <li>Visura catastale aggiornata, con i proprietari giusti.</li>
  <li>Planimetria catastale uguale alla casa di oggi.</li>
  <li>Titoli edilizi recuperati in Comune e controllati da un tecnico.</li>
  <li>Certificato di agibilità, se esiste.</li>
  <li>APE valido.</li>
  <li>Documenti del condominio: pagamenti, regolamento, delibere, lavori straordinari.</li>
  <li>Libretto della caldaia e dichiarazioni di conformità degli impianti, se ci sono.</li>
  <li>Documenti d'identità e codice fiscale di tutti i proprietari.</li>
  <li>Informazioni su stato civile e regime patrimoniale.</li>
  <li>Conteggio estintivo del mutuo, se c'è.</li>
  <li>Per una casa ereditata: dichiarazione di successione, accettazione dell'eredità, voltura.</li>
</ol>
<p>Con le carte in ordine sei pronto a fissare un prezzo. Puoi confrontare i <a href="/it/prezzi-case">prezzi delle case nella tua città</a> e fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita</a>. Per gli altri passi, vedi la pagina <a href="/it/vendere-casa">vendere casa</a>.</p>`,
    },
  ],
  faq: [
    ['Quali documenti servono per vendere casa?', `Atto di provenienza, visura e planimetria catastale aggiornate, titoli edilizi e conformità urbanistica, APE, certificato di agibilità se c'è, documenti del condominio e degli impianti, documenti personali e, se c'è un mutuo, il conteggio estintivo della banca.`],
    ['Quali documenti servono per vendere casa tra privati?', `Gli stessi di una vendita con agenzia: li richiede la legge e li controlla il notaio. Tra privati la raccolta è a carico tuo, quindi conviene farsi aiutare da un tecnico per catasto e Comune.`],
    ['Quali documenti servono per vendere una casa ereditata?', `Oltre ai documenti normali servono la dichiarazione di successione, l'accettazione dell'eredità (espressa o tacita) e la voltura catastale agli eredi. Se gli eredi sono più di uno, tutti devono firmare.`],
    ['Posso vendere casa senza APE?', `No. L'APE è obbligatorio per vendere: la classe energetica va indicata negli annunci e l'attestato va allegato all'atto di vendita. Lo prepara un tecnico abilitato e dura 10 anni, salvo decadenza.`],
    ['Cosa succede se la planimetria non corrisponde alla casa?', `Va aggiornata da un tecnico prima del rogito, perché nell'atto va dichiarata la conformità catastale. Se le differenze riguardano lavori fatti senza pratica in Comune, può servire anche una regolarizzazione urbanistica.`],
    ['Se sono in comunione dei beni devo far firmare anche mio marito o mia moglie?', `Di regola sì, se la casa è stata comprata durante il matrimonio in comunione dei beni, anche se sull'atto compare solo il tuo nome. Il notaio verifica il regime con l'estratto dell'atto di matrimonio.`],
  ],
};

export const plusvalenzaVenditaCasa: Guide = {
  slug: 'plusvalenza-vendita-casa',
  label: 'Plusvalenza vendita casa',
  title: 'Plusvalenza vendita casa: quando si paga e come calcolarla',
  description: `Plusvalenza vendita casa: quando si paga se vendi prima dei 5 anni, quando no, casa ereditata o donata, come si calcola e cosa chiedere al notaio.`,
  h1: 'Plusvalenza sulla vendita della casa: quando si paga, quando no e come si calcola',
  intro: `La plusvalenza è il guadagno che fai vendendo una casa a più di quanto l'hai pagata. Si paga solo se vendi entro 5 anni dall'acquisto o dalla costruzione, e anche in quel caso spesso non è dovuta: per esempio se è stata la tua abitazione principale o se l'hai ereditata. Questa guida spiega le regole di base; per il tuo caso concreto chiedi sempre al notaio o al commercialista.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'cos-e',
      title: 'Cos\'è la plusvalenza sulla vendita di una casa',
      html: `<p>In parole semplici: se compri una casa a un prezzo e la rivendi a un prezzo più alto, la differenza è un guadagno. Per il fisco questo guadagno si chiama <strong>plusvalenza</strong> e, in alcuni casi, va tassato.</p>
<p>La buona notizia è che per la maggior parte delle persone che vendono la casa in cui vivono, o che la tengono da molti anni, la plusvalenza <strong>non si paga</strong>. Le regole servono soprattutto a tassare chi compra e rivende in poco tempo.</p>
<p>Una premessa importante: questa guida parla di <strong>case</strong> possedute da privati. Terreni edificabili, immobili di imprese e situazioni particolari hanno regole diverse. E le regole fiscali possono cambiare: prima di firmare, verifica sempre con il notaio o con il tuo commercialista o CAF.</p>`,
    },
    {
      id: 'cinque-anni',
      title: 'Plusvalenza se vendi prima dei 5 anni e dopo 5 anni',
      html: `<p>La regola chiave è il tempo:</p>
<ul>
  <li><strong>Vendi dopo 5 anni</strong> dall'acquisto o dalla costruzione: la plusvalenza sulla casa <strong>non è tassata</strong>.</li>
  <li><strong>Vendi entro 5 anni</strong>: la plusvalenza <strong>può essere tassata</strong>, salvo le eccezioni della sezione successiva.</li>
</ul>
<p>I 5 anni si contano di solito dalla data del rogito d'acquisto, o dalla fine della costruzione se l'hai costruita tu, fino alla data del rogito di vendita. Conta l'atto definitivo, non il compromesso. Se sei vicino alla scadenza, anche poche settimane possono fare la differenza: parlane con il notaio prima di fissare la data.</p>
<p>Un esempio: se hai comprato a marzo 2022 e vendi a settembre 2026, sono passati meno di 5 anni. Se vendi ad aprile 2027, sono passati più di 5 anni. Le date esatte vanno comunque verificate con il notaio.</p>`,
    },
    {
      id: 'quando-non-si-paga',
      title: 'Quando la plusvalenza non si paga',
      html: `<p>Anche se vendi entro 5 anni, in questi casi la plusvalenza sulla casa <strong>non è tassata</strong>:</p>
<ul>
  <li><strong>Abitazione principale</strong>: se per la maggior parte del tempo tra l'acquisto e la vendita la casa è stata l'abitazione principale tua o dei tuoi familiari. Per esempio, se l'hai comprata 4 anni fa e ci hai vissuto per 3 anni, rientri in questo caso.</li>
  <li><strong>Casa ricevuta in successione</strong>: se l'hai ereditata, la plusvalenza non si paga, qualunque sia il momento della vendita.</li>
  <li><strong>Vendita dopo 5 anni</strong>: come visto sopra.</li>
  <li><strong>Nessun guadagno</strong>: se vendi allo stesso prezzo o a meno di quanto hai speso, non c'è plusvalenza da tassare.</li>
</ul>
<p>Cosa significa esattamente "abitazione principale" e "familiari" ai fini fiscali, e come si dimostra (per esempio con la residenza), è un punto da chiarire con il commercialista. Non dare nulla per scontato se la tua situazione non è lineare.</p>`,
    },
    {
      id: 'calcolo',
      title: 'Come si calcola la plusvalenza: esempio numerico',
      html: `<p>Il calcolo di base è semplice:</p>
<p><strong>Plusvalenza = prezzo di vendita meno prezzo di acquisto meno costi inerenti documentati</strong></p>
<p>I "costi inerenti" sono le spese legate alla casa che puoi dimostrare con fatture o atti: per esempio quelle sostenute per comprarla o per alcuni lavori. Quali spese contano davvero, e quali no, va verificato con il commercialista.</p>
<p>Facciamo un esempio <strong>del tutto ipotetico</strong>, con numeri tondi:</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Voce</th><th ${TH}>Importo (esempio)</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Prezzo di vendita</td><td ${TD}>240.000 €</td></tr>
    <tr><td ${TD}>Prezzo di acquisto (3 anni prima)</td><td ${TD}>200.000 €</td></tr>
    <tr><td ${TD}>Costi inerenti documentati (esempio)</td><td ${TD}>15.000 €</td></tr>
    <tr><td ${TD}><strong>Plusvalenza</strong></td><td ${TD}><strong>25.000 €</strong></td></tr>
    <tr><td ${TD}>Imposta sostitutiva del 26% (se scelta)</td><td ${TD}>6.500 €</td></tr>
  </tbody>
</table></div>
<p>In questo esempio la casa <strong>non</strong> è stata abitazione principale e non è ereditata, altrimenti l'imposta non sarebbe dovuta. È solo un esempio per capire il meccanismo: il calcolo reale del tuo caso lo fanno il notaio o il commercialista.</p>
<p>Per stimare il primo numero, il prezzo di vendita, puoi partire da una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a>: ti dà un intervallo realistico basato sulle quotazioni della zona, utile per capire se e quanta plusvalenza potresti avere.</p>`,
    },
    {
      id: 'tassazione',
      title: 'Tassazione della plusvalenza: imposta sostitutiva o IRPEF',
      html: `<p>Se la plusvalenza è dovuta, hai di solito due strade:</p>
<ol>
  <li><strong>Imposta sostitutiva del 26%</strong>: la chiedi al notaio al momento del rogito. Il notaio calcola l'imposta sulla plusvalenza, la trattiene e la versa per te. Il vantaggio è la semplicità: chiudi la questione il giorno della vendita.</li>
  <li><strong>Tassazione ordinaria IRPEF</strong>: la plusvalenza si inserisce nella dichiarazione dei redditi e viene tassata insieme agli altri redditi, con le aliquote IRPEF.</li>
</ol>
<p>Quale conviene dipende dai tuoi redditi complessivi e dalla tua situazione: è una scelta da fare <strong>con il commercialista o con il CAF</strong>, prima del rogito. Se scegli l'imposta sostitutiva, dillo al notaio per tempo, così prepara i conteggi.</p>`,
    },
    {
      id: 'ereditata',
      title: 'Plusvalenza su una casa ereditata',
      html: `<p>Per gli immobili ricevuti <strong>in successione</strong>, la plusvalenza non si paga. È uno dei casi più chiari: puoi vendere la casa dei genitori anche poco tempo dopo averla ereditata senza questa imposta.</p>
<p>Restano però le altre carte da sistemare prima della vendita: dichiarazione di successione, accettazione dell'eredità e voltura catastale. Le trovi spiegate nella guida sui <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>.</p>`,
    },
    {
      id: 'donazione',
      title: 'Plusvalenza su una casa ricevuta in donazione',
      html: `<p>La donazione è diversa dalla successione. Per una casa ricevuta in donazione, secondo la regola consolidata, i <strong>5 anni si contano dall'acquisto fatto da chi te l'ha donata</strong>, non dalla data della donazione.</p>
<p>Un esempio ipotetico: tua madre ha comprato la casa 10 anni fa e te l'ha donata l'anno scorso. Se la vendi oggi, dal suo acquisto sono passati più di 5 anni. Se invece l'aveva comprata da poco prima di donartela, il discorso cambia.</p>
<p>Le donazioni hanno spesso anche altri aspetti da valutare prima di vendere, non solo fiscali. Su questo punto in particolare, <strong>chiedi sempre al notaio</strong> prima di firmare un compromesso.</p>`,
    },
    {
      id: 'superbonus',
      title: 'Plusvalenza e Superbonus',
      html: `<p>Se sulla casa sono stati fatti lavori con il <strong>Superbonus</strong>, fai attenzione: dal 2024 esistono <strong>regole specifiche</strong> sulla plusvalenza per chi ha fatto lavori con il Superbonus e poi vende.</p>
<p>Non riassumiamo qui queste regole, perché dipendono da molti dettagli del tuo caso. Il consiglio è uno solo: <strong>chiedi al commercialista prima di fissare la data del rogito</strong>, portando la documentazione dei lavori.</p>`,
    },
    {
      id: 'errori',
      title: 'Plusvalenza: gli errori più comuni di chi vende',
      html: `<p>Alcuni errori capitano spesso e si evitano con poco:</p>
<ul>
  <li><strong>Contare i 5 anni dal compromesso</strong>: conta la data del rogito, sia per l'acquisto sia per la vendita.</li>
  <li><strong>Pensarci dopo aver firmato</strong>: il compromesso fissa prezzo e date. Se la plusvalenza cambia i tuoi conti, è meglio saperlo prima.</li>
  <li><strong>Non conservare le fatture</strong>: i costi che non puoi documentare, di solito, non si possono considerare nel calcolo.</li>
  <li><strong>Dare per scontata l'esclusione per abitazione principale</strong>: se ci hai vissuto solo per una parte del periodo, o se la residenza era altrove, fai controllare il tuo caso.</li>
  <li><strong>Confondere donazione e successione</strong>: hanno regole diverse, come visto sopra.</li>
  <li><strong>Sbagliare la stima del prezzo</strong>: se non sai quanto vale davvero la casa, non puoi sapere se ci sarà un guadagno. Una <a href="/it/quanto-vale-la-mia-casa">stima gratuita del valore</a>, basata sulle quotazioni ufficiali della zona e sulle caratteristiche della casa, ti dà un primo intervallo su cui ragionare con il commercialista.</li>
</ul>`,
    },
    {
      id: 'cosa-fare',
      title: 'Cosa fare prima di fissare il rogito: checklist',
      html: `<ol>
  <li>Trova la data del tuo rogito d'acquisto (o della costruzione, o dell'acquisto del donante) e conta se sono passati 5 anni alla data prevista per la vendita.</li>
  <li>Verifica se la casa è stata per la maggior parte del tempo abitazione principale tua o dei tuoi familiari.</li>
  <li>Se l'hai ereditata, ricorda che la plusvalenza non si paga, ma sistema successione e voltura.</li>
  <li>Raccogli fatture e atti delle spese sostenute per la casa.</li>
  <li>Se ci sono stati lavori con il Superbonus, parlane con il commercialista prima di tutto.</li>
  <li>Stima il prezzo di vendita con una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita</a> o guardando i <a href="/it/prezzi-case">prezzi delle case nella tua città</a>.</li>
  <li>Fai fare il calcolo a commercialista o CAF e scegli tra imposta sostitutiva e IRPEF.</li>
  <li>Se scegli l'imposta sostitutiva, comunicalo al notaio con anticipo.</li>
</ol>
<p>La plusvalenza è solo una delle voci da considerare. Per il quadro completo leggi <a href="/it/quanto-costa-vendere-casa">quanto costa vendere casa</a> e, se stai valutando i tempi, <a href="/it/quando-conviene-vendere-casa">quando conviene vendere casa</a>.</p>`,
    },
  ],
  faq: [
    ['Quando si paga la plusvalenza sulla vendita di una casa?', `Solo se vendi entro 5 anni dall'acquisto o dalla costruzione e non rientri nelle esclusioni, come l'abitazione principale per la maggior parte del periodo o la casa ricevuta in successione. Verifica sempre il tuo caso con il commercialista.`],
    ['Se vendo casa dopo 5 anni pago la plusvalenza?', `No, per una casa posseduta da un privato la plusvalenza non è tassata se vendi dopo 5 anni dall'acquisto o dalla costruzione. I 5 anni si contano fino al rogito di vendita, non al compromesso.`],
    ['Sulla casa ereditata si paga la plusvalenza?', `No, per gli immobili ricevuti in successione la plusvalenza non si paga, anche se vendi poco dopo. Restano da sistemare successione, accettazione dell'eredità e voltura catastale.`],
    ['Come si calcola la plusvalenza?', `In linea generale: prezzo di vendita meno prezzo di acquisto meno costi inerenti documentati. Quali costi si possono considerare va verificato con il commercialista.`],
    ['Quanto si paga di plusvalenza?', `Se è dovuta, puoi chiedere al notaio l'imposta sostitutiva del 26% sulla plusvalenza al rogito, oppure tassarla in dichiarazione con l'IRPEF. La scelta migliore dipende dai tuoi redditi: chiedi al commercialista o al CAF.`],
    ['Per una casa ricevuta in donazione da quando contano i 5 anni?', `Secondo la regola consolidata, dall'acquisto fatto da chi ti ha donato la casa, non dalla data della donazione. Visto che le donazioni hanno anche altri aspetti, chiedi sempre al notaio prima di vendere.`],
    ['Ho fatto lavori con il Superbonus: cambia qualcosa?', `Sì, dal 2024 ci sono regole specifiche sulla plusvalenza per chi ha fatto lavori con il Superbonus. Chiedi al commercialista prima di fissare la data del rogito.`],
  ],
};

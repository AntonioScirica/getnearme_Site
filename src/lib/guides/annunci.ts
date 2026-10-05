import type { Guide } from './types';

// Guide pratiche sugli annunci: testo, descrizioni, foto, reel.
// Niente numeri inventati: solo pratica del mestiere e regole certe.

export const scrivereAnnuncio: Guide = {
  slug: 'come-scrivere-annuncio-immobiliare',
  label: 'Come scrivere un annuncio',
  title: `Come scrivere un annuncio immobiliare: 10 esempi`,
  description: `Come scrivere un annuncio immobiliare che riceve contatti: formula del titolo con 10 esempi, struttura della descrizione, dati essenziali e checklist.`,
  h1: `Come scrivere un annuncio immobiliare efficace: titolo, descrizione, dati e foto`,
  intro: `Un annuncio immobiliare efficace mette subito zona, tipologia e punto di forza nel titolo, apre la galleria con la foto migliore e dà nella descrizione tutti i dati che il compratore usa per decidere se chiamarti. Qui trovi la formula, gli esempi e la checklist da usare prima di pubblicare.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'struttura-annuncio',
      title: `Com'è fatto un annuncio immobiliare efficace`,
      html: `<p>Chi cerca casa sui portali immobiliari scorre decine di risultati in pochi minuti. Ogni annuncio ha pochi secondi per convincerlo ad aprire la scheda, e poi qualche decina di secondi per convincerlo a scriverti. Per questo un annuncio che funziona ha sempre le stesse parti, nello stesso ordine di importanza:</p>
<ol>
  <li><strong>Foto di copertina</strong>: è la prima cosa che si vede nell'elenco dei risultati, prima ancora del prezzo.</li>
  <li><strong>Titolo</strong>: dice dove, cosa e perché proprio questa casa.</li>
  <li><strong>Prezzo e dati principali</strong>: metri quadri, locali, bagni, piano. Sono i campi strutturati del portale, compilali tutti.</li>
  <li><strong>Descrizione</strong>: racconta la casa nell'ordine in cui la visiteresti e risponde alle domande prima che arrivino.</li>
  <li><strong>Galleria completa e planimetria</strong>: permettono di capire la distribuzione degli spazi senza telefonare.</li>
</ol>
<p>L'errore più comune è trattare l'annuncio come una formalità: titolo generico, tre righe di descrizione, foto in ordine casuale. Il risultato sono meno contatti e, soprattutto, contatti meno qualificati: persone che chiamano per chiedere informazioni che avresti potuto scrivere, o che scoprono in visita che la casa non fa per loro.</p>
<p>Un buon annuncio lavora al contrario: <strong>filtra</strong>. Chi ti contatta ha già visto piano, spese, classe energetica e stato dell'immobile, e ti chiama perché è interessato davvero. Meno visite inutili, più visite che portano a una proposta.</p>
<p>Un annuncio così fa lavorare meglio anche te: ogni visita inutile in meno è tempo che un <a href="/it/agente-immobiliare">agente immobiliare</a> può passare ad acquisire incarichi.</p>`,
    },
    {
      id: 'titolo-annuncio',
      title: `Titolo dell'annuncio immobiliare: la formula e 10 esempi`,
      html: `<p>Il titolo deve stare in circa <strong>60 caratteri</strong>, perché nell'elenco dei risultati e nelle anteprime condivise viene spesso tagliato. La formula che funziona quasi sempre è:</p>
<p><strong>Zona + tipologia + punto di forza principale</strong></p>
<p>La zona va per prima perché è il criterio con cui le persone cercano. La tipologia dice subito se è pertinente. Il punto di forza è l'unica cosa che distingue la casa dalle altre dieci nella stessa pagina: un terrazzo, il piano alto, il box, la ristrutturazione recente. Un solo punto di forza, non tre.</p>
<h3>Esempi di titoli</h3>
<ul>
  <li>Porta Venezia, bilocale ristrutturato con balcone</li>
  <li>San Salvario, trilocale luminoso al 4° piano con ascensore</li>
  <li>Vomero, attico con terrazzo abitabile vista golfo</li>
  <li>Monteverde, quadrilocale con doppio box e cantina</li>
  <li>Centro storico, casa indipendente da ristrutturare con cortile</li>
  <li>Fronte mare, trilocale con giardino privato</li>
  <li>Zona università, monolocale arredato in affitto</li>
  <li>Collina, villetta a schiera con giardino su tre lati</li>
  <li>Stazione a 5 minuti, bilocale in classe A con posto auto</li>
  <li>Borgo Panigale, trilocale con cucina abitabile e due bagni</li>
</ul>
<h3>Cosa non mettere nel titolo</h3>
<ul>
  <li>Aggettivi vuoti: "splendido", "occasione", "imperdibile".</li>
  <li>MAIUSCOLE e punti esclamativi: sembrano pubblicità, non informazione.</li>
  <li>Il prezzo, se il portale lo mostra già accanto al titolo: sprechi spazio.</li>
  <li>Sigle interne come "rif. 123" o abbreviazioni che capisci solo tu.</li>
</ul>
<p>Se non sai quale punto di forza scegliere, chiediti: cosa ha detto il proprietario quando gli hai chiesto perché ha comprato questa casa? Spesso è la risposta giusta.</p>`,
    },
    {
      id: 'struttura-descrizione',
      title: `Come strutturare la descrizione dell'annuncio`,
      html: `<p>La descrizione non è un tema da scrivere ogni volta da zero. Usa una struttura fissa, così nessun annuncio esce con informazioni mancanti:</p>
<ol>
  <li><strong>Apertura (1-2 frasi)</strong>: tipologia, zona precisa e il punto di forza del titolo, detto meglio. Molti portali mostrano solo le prime righe prima del "leggi tutto".</li>
  <li><strong>Il contesto</strong>: via o microzona, servizi a piedi (scuole, negozi, fermate), come si arriva. Concreto: "fermata del tram sotto casa" vale più di "zona ben servita".</li>
  <li><strong>Il palazzo</strong>: epoca, stato, ascensore, portineria, piano.</li>
  <li><strong>La casa, stanza per stanza</strong>: nell'ordine della visita, dall'ingresso alla zona notte. Metri, esposizione, cosa si vede dalle finestre.</li>
  <li><strong>Dotazioni e stato</strong>: impianti, riscaldamento, infissi, pavimenti, lavori recenti.</li>
  <li><strong>Pertinenze</strong>: cantina, box, posto auto, soffitta, giardino.</li>
  <li><strong>Dati economici</strong>: spese condominiali, eventuali lavori deliberati, disponibilità (libero subito, al rogito, a una data).</li>
  <li><strong>Chiusura</strong>: come organizzare la visita.</li>
</ol>
<p>Per la lunghezza non esiste un numero giusto: deve bastare a rispondere alle domande che i clienti ti farebbero al telefono. Un monolocale richiede meno testo di una villa, ma entrambi devono essere completi.</p>
<p>Scrivi frasi brevi e paragrafi corti: molte persone leggono dal telefono. Se ti servono modelli già pronti per tipologia, trovi esempi da copiare nella guida sulla <a href="/it/descrizione-immobile-esempi">descrizione dell'immobile</a>.</p>`,
    },
    {
      id: 'dati-da-inserire',
      title: `I dati che i compratori usano per filtrare gli annunci`,
      html: `<p>Sui portali immobiliari molte persone non leggono, filtrano. Se un campo è vuoto, il tuo annuncio può sparire proprio dalle ricerche giuste. Compila sempre i campi strutturati e ripeti i dati chiave nel testo:</p>
<ul>
  <li><strong>Superficie</strong>: indica se è commerciale o calpestabile, per evitare discussioni in visita.</li>
  <li><strong>Locali e bagni</strong>, con la presenza di cucina abitabile o angolo cottura.</li>
  <li><strong>Piano</strong> e <strong>ascensore</strong>: per famiglie con bambini piccoli e persone anziane sono spesso criteri di esclusione.</li>
  <li><strong>Riscaldamento</strong>: autonomo o centralizzato, tipo di impianto e di alimentazione.</li>
  <li><strong>Classe energetica</strong>: negli annunci di vendita e affitto vanno indicati classe e indice di prestazione energetica. Approfondisci nella guida su <a href="/it/ape-annunci-immobiliari">APE e annunci immobiliari</a>.</li>
  <li><strong>Spese condominiali</strong>: meglio indicarle chiaramente, con cosa includono.</li>
  <li><strong>Stato dell'immobile</strong>: nuovo, ristrutturato, buono, da ristrutturare.</li>
  <li><strong>Esterni</strong>: balcone, terrazzo, giardino, con i metri se rilevanti.</li>
  <li><strong>Pertinenze</strong>: box, posto auto, cantina.</li>
  <li><strong>Anno di costruzione</strong> e tipo di edificio.</li>
  <li><strong>Disponibilità</strong>: libero, occupato, locato.</li>
</ul>
<p>Un consiglio pratico: prepara una scheda di raccolta dati da compilare durante il sopralluogo di acquisizione, con esattamente questi campi. Ti evita di richiamare il proprietario per chiedere le spese o il tipo di caldaia, e ti fa pubblicare prima. Se stai impostando anche la valutazione, la guida sulla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile in acquisizione</a> ti aiuta a raccogliere tutto in un'unica visita.</p>`,
    },
    {
      id: 'parole-da-evitare',
      title: `Parole e frasi da evitare in un annuncio immobiliare`,
      html: `<p>Alcune parole sono così usate che il lettore le salta, altre fanno pensare al contrario di quello che vuoi dire. Ecco le più comuni e cosa scrivere al loro posto.</p>
<ul>
  <li><strong>"Luminoso"</strong> senza spiegazione: scrivi l'esposizione e cosa c'è davanti. "Doppia esposizione est e ovest, nessun palazzo di fronte" è una prova, "luminoso" è un'opinione.</li>
  <li><strong>"Ottima posizione"</strong>: di' cosa c'è vicino e a quanti minuti a piedi.</li>
  <li><strong>"Occasione", "affare", "imperdibile"</strong>: fanno pensare a un problema nascosto.</li>
  <li><strong>"Grazioso", "caratteristico"</strong>: spesso letti come "piccolo" e "vecchio". Se è piccolo, valorizza come sono sfruttati gli spazi.</li>
  <li><strong>"Da vedere"</strong>: vale per ogni casa. Scrivi perché va vista.</li>
  <li><strong>"Possibilità di..."</strong> senza verifica: se scrivi che si può ricavare una camera o fare un soppalco, assicurati che sia fattibile. Altrimenti crei aspettative che il tecnico smentirà.</li>
  <li><strong>Gergo e sigle</strong>: "p.r.", "risc. aut.", "c.a.": scrivi per esteso, è più leggibile e i motori di ricerca lo capiscono meglio.</li>
</ul>
<p>Evita anche ciò che può risultare discriminatorio, come preferenze su chi può affittare, e le affermazioni che non puoi dimostrare, per esempio sulla regolarità urbanistica o sul rendimento di un investimento. Nel dubbio, descrivi fatti verificabili: misure, dotazioni, distanze, documenti disponibili.</p>
<p>Un test veloce: rileggi ogni aggettivo e chiediti se il cliente, in visita, potrebbe contestarlo. Se sì, sostituiscilo con un dato.</p>`,
    },
    {
      id: 'ordine-foto',
      title: `In che ordine mettere le foto dell'annuncio`,
      html: `<p>Le foto sono la parte dell'annuncio che viene guardata di più. Anche l'ordine conta: deve permettere di capire la casa come se la si stesse visitando.</p>
<ol>
  <li><strong>Copertina</strong>: la stanza più bella, di solito il soggiorno o l'esterno se è il punto di forza (terrazzo, giardino, vista). Deve essere coerente con il titolo.</li>
  <li><strong>Zona giorno</strong>: soggiorno da più angolazioni, poi cucina.</li>
  <li><strong>Zona notte</strong>: camera principale, poi le altre camere.</li>
  <li><strong>Bagni</strong>.</li>
  <li><strong>Esterni privati</strong>: balconi, terrazzo, giardino.</li>
  <li><strong>Parti comuni e facciata</strong>: ingresso del palazzo, scale, cortile.</li>
  <li><strong>Pertinenze</strong>: box, cantina.</li>
  <li><strong>Planimetria</strong>, sempre, anche semplificata.</li>
</ol>
<p>Elimina le foto doppie e quelle che non aggiungono informazioni: tre foto quasi uguali dello stesso bagno stancano. Meglio poche foto ben fatte che tante foto mediocri.</p>
<p>Se la casa è vuota o arredata in modo datato, la copertina può essere una versione con arredo virtuale, a patto di <strong>dichiararla</strong> e di pubblicare anche la foto originale. Come farlo correttamente è spiegato nella guida sul <a href="/it/virtual-staging-legale">virtual staging e le sue regole</a>, mentre per scattare meglio le foto parti dalla guida sulle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a>.</p>`,
    },
    {
      id: 'checklist-pubblicazione',
      title: `Checklist prima di pubblicare l'annuncio`,
      html: `<p>Copia questa lista e usala per ogni immobile. Bastano cinque minuti e ti evita gli errori che costano contatti.</p>
<h3>Testo</h3>
<ul>
  <li>Il titolo inizia con la zona e sta in circa 60 caratteri.</li>
  <li>Le prime due righe della descrizione contengono tipologia, zona e punto di forza.</li>
  <li>Nessun aggettivo che non puoi dimostrare.</li>
  <li>Spese condominiali, riscaldamento, piano e ascensore sono scritti.</li>
  <li>Classe energetica e indice di prestazione energetica sono presenti.</li>
  <li>Disponibilità dell'immobile indicata.</li>
  <li>Nessun errore di battitura in via, metri e prezzo.</li>
</ul>
<h3>Foto</h3>
<ul>
  <li>Copertina scelta con cura, orizzontale, dritta e luminosa.</li>
  <li>Ordine della visita rispettato.</li>
  <li>Nessuna persona, targa o documento riconoscibile.</li>
  <li>Foto ritoccate o arredate virtualmente dichiarate, con l'originale presente.</li>
  <li>Planimetria caricata.</li>
</ul>
<h3>Dati del portale</h3>
<ul>
  <li>Tutti i campi strutturati compilati, anche quelli facoltativi.</li>
  <li>Posizione sulla mappa corretta, o approssimata se il proprietario lo chiede.</li>
  <li>Prezzo coerente con quello concordato nell'incarico.</li>
</ul>
<h3>Dopo la pubblicazione</h3>
<ul>
  <li>Apri l'annuncio dal telefono e controlla come appaiono titolo e copertina.</li>
  <li>Dopo una o due settimane guarda visualizzazioni e contatti: se le visualizzazioni sono basse lavora su copertina e titolo, se sono alte ma i contatti pochi lavora su descrizione, prezzo e foto interne.</li>
</ul>`,
    },
    {
      id: 'miglioralo',
      title: `Come controllare un annuncio già online e ottenere le correzioni`,
      html: `<p>Molti annunci sono già pubblicati da settimane e nessuno li rilegge più. Rivederli è uno dei modi più rapidi per ottenere più contatti senza nuovi incarichi. Puoi farlo a mano con la checklist qui sopra, un annuncio alla volta, oppure farti aiutare da uno strumento.</p>
<p>In <a href="/it">Agente Immo</a>, per esempio, c'è la funzione <strong>Miglioralo</strong>: incolli il link di un annuncio esistente, la piattaforma importa testo e foto, assegna un <strong>punteggio</strong> e ti indica cosa correggere. Tipicamente segnala:</p>
<ul>
  <li>titoli troppo lunghi o senza zona;</li>
  <li>dati mancanti nella descrizione, come spese o riscaldamento;</li>
  <li>parole generiche da sostituire con fatti;</li>
  <li>foto scure, storte o stanze vuote che potrebbero essere arredate virtualmente.</li>
</ul>
<p>Da lì puoi farti riscrivere titolo e descrizione dall'AI e sistemare le foto nello stesso posto. Il testo proposto va sempre riletto: l'AI non sa che il vicino di pianerottolo è una persona tranquilla o che al tramonto il sole entra in soggiorno. Quelle informazioni le aggiungi tu, e sono spesso le più convincenti.</p>
<p>Lo stesso controllo è utile anche in <strong>acquisizione</strong>: se un proprietario ha la casa in vendita da solo o con un'altra agenzia, mostrargli cosa non funziona nel suo annuncio è un argomento concreto. Trovi altri spunti nella guida su come <a href="/it/acquisire-incarichi-immobiliari">acquisire incarichi immobiliari</a>.</p>`,
    },
  ],
  faq: [
    [`Quanto deve essere lungo un annuncio immobiliare?`, `Abbastanza da rispondere alle domande che un cliente farebbe al telefono: zona, stanze, piano, spese, riscaldamento, stato e disponibilità. Un monolocale richiede meno testo di una villa, ma nessuno dei due deve lasciare fuori dati essenziali.`],
    [`Come si scrive il titolo di un annuncio immobiliare?`, `Usa la formula zona, tipologia e un punto di forza, in circa 60 caratteri. Per esempio: "San Salvario, trilocale luminoso al 4° piano con ascensore". Evita aggettivi vuoti, maiuscole e punti esclamativi.`],
    [`Bisogna indicare la classe energetica nell'annuncio?`, `Sì, negli annunci commerciali di vendita e di affitto vanno indicati la classe energetica e l'indice di prestazione energetica dell'immobile. Per questo serve avere l'APE prima di pubblicare.`],
    [`Conviene mettere il prezzo nell'annuncio?`, `Sui portali immobiliari il prezzo è di solito un campo richiesto, e gli annunci senza prezzo vengono esclusi da molte ricerche filtrate. Indicarlo porta contatti più qualificati.`],
    [`Qual è la foto migliore da usare come copertina?`, `La stanza più bella e luminosa, di solito il soggiorno, oppure l'esterno se è il vero punto di forza. Deve essere coerente con il titolo, dritta e orizzontale.`],
    [`Posso usare l'intelligenza artificiale per scrivere un annuncio?`, `Sì, è utile per avere una prima versione completa e ben strutturata. Va però sempre riletta e corretta: i dati devono essere verificati e i dettagli che conosci solo tu, come il vicinato o la luce, li aggiungi a mano.`],
  ],
};

export const descrizioneEsempi: Guide = {
  slug: 'descrizione-immobile-esempi',
  label: 'Descrizione immobile: esempi',
  title: `Descrizione immobile: esempi pronti da copiare`,
  description: `Descrizione immobile, esempi pronti da copiare per 7 tipologie: bilocale, trilocale, attico, villetta, da ristrutturare, affitto e casa al mare.`,
  h1: `Descrizione immobile: esempi da copiare per ogni tipologia di casa`,
  intro: `Qui trovi modelli di descrizione immobiliare pronti da copiare per sette tipologie di casa, con i campi da completare tra [parentesi quadre] e i consigli su cosa mettere per primo, che tono usare e quanto scrivere.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'come-descrivere',
      title: `Come descrivere una casa in vendita: cosa mettere per primo`,
      html: `<p>Prima di copiare un modello, tre regole che valgono per tutte le tipologie.</p>
<h3>1. Le prime righe decidono</h3>
<p>Molti portali mostrano solo l'inizio della descrizione. Nella prima frase metti <strong>tipologia, zona precisa e il motivo principale per sceglierla</strong>. Non iniziare con "Proponiamo in vendita" o "In zona tranquilla": sono parole che non dicono nulla.</p>
<h3>2. Il tono giusto</h3>
<p>Professionale ma diretto, come parleresti a un cliente durante la visita. Frasi brevi, verbi concreti, niente superlativi. Il tono cambia leggermente per tipologia: più pratico per un bilocale da investimento, più evocativo per una casa al mare o un immobile di pregio, ma sempre basato su fatti.</p>
<h3>3. La lunghezza</h3>
<p>Non c'è una lunghezza ideale uguale per tutti. La descrizione è abbastanza lunga quando contiene tutto quello che un cliente ti chiederebbe prima di fissare una visita: stanze, piano, esposizione, riscaldamento, spese, stato, pertinenze, disponibilità. Tutto il resto è di troppo.</p>
<h3>Come usare i modelli</h3>
<ul>
  <li>Sostituisci ogni campo tra <strong>[parentesi quadre]</strong> con il dato reale.</li>
  <li>Cancella le frasi che non si applicano: un modello non va riempito a forza.</li>
  <li>Aggiungi almeno un dettaglio che conosci solo tu per averla visitata.</li>
  <li>Rileggi dal telefono prima di pubblicare.</li>
</ul>
<p>Per titolo, foto e checklist finale, parti dalla guida su <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>
<p>I modelli fanno risparmiare tempo, ma il dettaglio vero lo conosce solo l'<a href="/it/agente-immobiliare">agente immobiliare</a> che ha visto la casa: è quello che rende credibile la descrizione.</p>`,
    },
    {
      id: 'esempio-bilocale',
      title: `Esempio di descrizione per un bilocale in città`,
      html: `<p>Chi cerca un bilocale in città è spesso un single, una coppia giovane o un investitore. Cerca praticità: trasporti, spese contenute, stato dell'immobile. Metti in evidenza i collegamenti e se la casa è pronta da abitare o da affittare.</p>
<p><strong>Modello da copiare</strong></p>
<p>[Zona], bilocale di [metri] mq al [piano] piano [con/senza] ascensore, a [minuti] minuti a piedi da [metro/stazione/fermata].</p>
<p>L'appartamento si trova in un palazzo [epoca/stato del palazzo] ed è composto da ingresso, soggiorno con [angolo cottura/cucina separata], camera matrimoniale e bagno con [doccia/vasca e finestra]. Le finestre sono esposte a [esposizione] e affacciano su [via/cortile interno/giardino].</p>
<p>La casa è stata [ristrutturata nel anno/mantenuta in buono stato]: [pavimenti, infissi, impianti]. Riscaldamento [autonomo/centralizzato] con [tipo impianto]. Completano la proprietà [balcone/cantina/posto bici].</p>
<p>Nelle vicinanze: [supermercato, università, uffici, parco], tutto raggiungibile a piedi.</p>
<p>Spese condominiali: [importo] al mese, comprensive di [voci]. Classe energetica [classe], indice di prestazione energetica [valore]. Disponibilità: [libero subito/al rogito/data].</p>
<p>Per una visita o per ricevere la planimetria, contattaci.</p>
<h3>Consigli per il bilocale</h3>
<ul>
  <li>Se è adatto all'affitto, dillo, ma senza promettere rendimenti.</li>
  <li>Se è piccolo, descrivi come sono sfruttati gli spazi: armadi a muro, soppalco, lavanderia.</li>
  <li>Il silenzio conta molto: specifica se la camera affaccia su cortile.</li>
</ul>`,
    },
    {
      id: 'esempio-trilocale',
      title: `Esempio di descrizione per un trilocale familiare`,
      html: `<p>Il trilocale familiare si vende a chi ha bambini o li avrà. Le domande sono sempre le stesse: scuole, spazio per giocare, seconda camera, bagni, parcheggio. Rispondi prima che te le facciano.</p>
<p><strong>Modello da copiare</strong></p>
<p>[Zona], trilocale di [metri] mq con [punto di forza: due bagni/cucina abitabile/terrazzo], a [minuti] minuti a piedi da [scuola/parco].</p>
<p>Al [piano] piano di un [tipo di palazzo] [con ascensore], l'appartamento si apre su un ingresso che separa la zona giorno dalla zona notte. Il soggiorno di circa [metri] mq è esposto a [esposizione] e dà accesso a [balcone/terrazzo]. La cucina è [abitabile/a vista] con [finestra/dispensa].</p>
<p>La zona notte comprende una camera matrimoniale, una seconda camera [doppia/singola] adatta come cameretta o studio, e [uno/due] bagni, [uno con vasca e uno con doccia].</p>
<p>Riscaldamento [autonomo/centralizzato], infissi [tipo], [aria condizionata]. Completano la proprietà [cantina/box/posto auto].</p>
<p>In zona: [scuola materna ed elementare, parco giochi, supermercato, fermata autobus] entro [distanza].</p>
<p>Spese condominiali [importo] al mese. Classe energetica [classe], indice di prestazione energetica [valore]. Disponibilità: [data].</p>
<h3>Consigli per il trilocale</h3>
<ul>
  <li>Indica sempre i metri della seconda camera: "cameretta" può voler dire molte cose.</li>
  <li>Nomina le scuole della zona per tipo, non per nome se non sei certo dei bacini.</li>
  <li>Box o posto auto vanno anche nel titolo, se ci sono.</li>
</ul>`,
    },
    {
      id: 'esempio-attico-lusso',
      title: `Esempio di descrizione per un attico o immobile di pregio`,
      html: `<p>Per un attico o un immobile di pregio il cliente cerca un'esperienza, ma vuole anche precisione: materiali, privacy, sicurezza, servizi. Il tono può essere più evocativo, però ogni frase deve restare verificabile. Meno aggettivi, più dettagli.</p>
<p><strong>Modello da copiare</strong></p>
<p>[Zona], attico di [metri] mq con terrazzo di [metri] mq e vista su [panorama], all'ultimo piano di [palazzo d'epoca/edificio recente].</p>
<p>Si accede da [ascensore diretto/pianerottolo riservato] a un ampio ingresso che introduce al salone di [metri] mq, con [numero] finestre esposte a [esposizione] e uscita sul terrazzo. La cucina [abitabile/con isola] è arredata con [materiali/elettrodomestici].</p>
<p>La zona notte comprende [numero] camere, tra cui una suite padronale con [cabina armadio/bagno privato con doccia e vasca], e [numero] bagni in totale.</p>
<p>Finiture: [pavimenti, serramenti, domotica, impianto di climatizzazione]. Riscaldamento [tipo]. Il terrazzo è [attrezzato/con pergola/con impianto di irrigazione] e utilizzabile [per cene all'aperto/come solarium].</p>
<p>Il palazzo offre [portineria/videosorveglianza/giardino condominiale]. Completano la proprietà [box doppio/cantina/posto auto].</p>
<p>Spese condominiali [importo] al mese. Classe energetica [classe], indice di prestazione energetica [valore]. Visite su appuntamento.</p>
<h3>Consigli per l'immobile di pregio</h3>
<ul>
  <li>La vista va descritta con precisione: cosa si vede e da quali stanze.</li>
  <li>Non pubblicare dettagli che compromettono la sicurezza, come sistemi di allarme o l'indirizzo esatto, se il proprietario non vuole.</li>
  <li>Foto e video devono essere all'altezza del testo: per questo segmento conviene investire di più nella presentazione.</li>
</ul>`,
    },
    {
      id: 'esempio-villetta',
      title: `Esempio di descrizione per una villa o villetta`,
      html: `<p>Chi cerca una villetta vuole spazio, indipendenza e verde, ma si preoccupa di gestione e costi: giardino da mantenere, riscaldamento, distanza dai servizi. Una buona descrizione racconta i piani uno per uno e chiarisce subito tipologia (singola, bifamiliare, a schiera).</p>
<p><strong>Modello da copiare</strong></p>
<p>[Località/zona], villetta [indipendente/a schiera/bifamiliare] di [metri] mq su [numero] livelli, con giardino privato di [metri] mq e [box/posto auto].</p>
<p><strong>Piano terra</strong>: ingresso, soggiorno di [metri] mq con [camino/portafinestra sul giardino], cucina [abitabile/a vista], bagno di servizio.</p>
<p><strong>Primo piano</strong>: [numero] camere da letto, [numero] bagni, [balcone].</p>
<p><strong>[Piano seminterrato/mansarda]</strong>: [taverna/lavanderia/locale hobby/cantina], [altezza e utilizzo consentito se verificato].</p>
<p>Il giardino circonda la casa su [numero] lati ed è [piantumato/con prato/con irrigazione]. Riscaldamento [tipo], [pannelli solari/fotovoltaico/pompa di calore se presenti]. Infissi [tipo].</p>
<p>La casa si trova a [minuti] in auto da [centro/stazione/casello] e a [distanza] da [scuole/negozi].</p>
<p>Classe energetica [classe], indice di prestazione energetica [valore]. [Spese condominiali o di gestione se presenti]. Disponibilità: [data].</p>
<h3>Consigli per la villetta</h3>
<ul>
  <li>Specifica sempre la destinazione dei locali seminterrati e della mansarda: se sono accessori, non chiamarli camere.</li>
  <li>Indica i tempi di spostamento reali, non le distanze in linea d'aria.</li>
  <li>Se il giardino è il punto di forza, mettilo in copertina.</li>
</ul>`,
    },
    {
      id: 'esempio-da-ristrutturare',
      title: `Esempio di descrizione per una casa da ristrutturare`,
      html: `<p>La casa da ristrutturare è l'annuncio dove l'onestà paga di più. Chi la cerca sa cosa sta comprando e vuole capire il potenziale: metri, luce, distribuzione, possibilità di modifica. Nascondere lo stato porta solo visite deluse.</p>
<p><strong>Modello da copiare</strong></p>
<p>[Zona], [tipologia] di [metri] mq da ristrutturare, [punto di forza: doppia esposizione/soffitti alti/piano alto], ideale per chi vuole progettare la casa su misura.</p>
<p>L'immobile si trova al [piano] piano di [tipo di palazzo] [con/senza ascensore] ed è attualmente composto da [elenco locali]. Le finestre sono esposte a [esposizione] e i soffitti sono alti circa [altezza] m.</p>
<p>Lo stato attuale richiede [rifacimento impianti/bagni/pavimenti/infissi]. Si conservano [elementi di pregio: pavimenti originali, travi, porte d'epoca].</p>
<p>La pianta [regolare/con muri portanti in posizione] permette diverse soluzioni di distribuzione, da verificare con un tecnico di fiducia. Planimetria disponibile su richiesta.</p>
<p>Completano la proprietà [cantina/soffitta/box]. Spese condominiali [importo]. Classe energetica [classe], indice di prestazione energetica [valore]. Libero [subito/al rogito].</p>
<h3>Consigli per la casa da ristrutturare</h3>
<ul>
  <li>Non scrivere che "si può fare" un intervento se non è stato verificato. Meglio "da verificare con un tecnico".</li>
  <li>Aiuta il cliente a immaginare: accanto alle foto reali puoi pubblicare una proposta di arredo o ristrutturazione virtuale, dichiarata come tale. Vedi la guida sul <a href="/it/virtual-staging-legale">virtual staging legale</a>.</li>
  <li>Se hai un preventivo indicativo di un'impresa, puoi citarlo come tale, con la fonte.</li>
</ul>`,
    },
    {
      id: 'esempio-affitto',
      title: `Esempio di descrizione per un appartamento in affitto`,
      html: `<p>Negli annunci di affitto le domande cambiano: arredamento, tipo di contratto, spese incluse, durata, requisiti richiesti. Più chiaro sei, meno tempo perdi con richieste non compatibili.</p>
<p><strong>Modello da copiare</strong></p>
<p>[Zona], [tipologia] [arredato/non arredato] di [metri] mq in affitto, a [minuti] minuti da [metro/università/uffici].</p>
<p>L'appartamento, al [piano] piano [con/senza] ascensore, è composto da [elenco locali]. [Arredato con: cucina completa di elettrodomestici, letto matrimoniale, armadi, divano, lavatrice].</p>
<p>Riscaldamento [autonomo/centralizzato], [aria condizionata]. [Connessione internet disponibile/predisposizione].</p>
<p><strong>Condizioni</strong>: contratto [tipo di contratto, da concordare con il proprietario], canone [importo] al mese, spese condominiali [importo] [incluse/escluse]. Deposito cauzionale [numero mensilità]. Disponibile da [data].</p>
<p>Classe energetica [classe], indice di prestazione energetica [valore].</p>
<p>Per richiedere una visita, scrivi indicando [numero di persone, occupazione, durata desiderata].</p>
<h3>Consigli per l'affitto</h3>
<ul>
  <li>Descrivi cosa c'è nell'arredamento: "arredato" da solo non basta.</li>
  <li>Chiarisci cosa è incluso nel canone: spese, utenze, pulizie.</li>
  <li>Chiedi informazioni utili alla selezione, ma evita qualsiasi preferenza discriminatoria su chi può affittare.</li>
  <li>Per un affitto rapido, pubblica foto aggiornate: gli inquilini confrontano molto e rapidamente.</li>
</ul>`,
    },
    {
      id: 'esempio-casa-al-mare',
      title: `Esempio di descrizione per una casa al mare`,
      html: `<p>La casa al mare è spesso una seconda casa o un investimento per affitti stagionali. Il cliente vuole sapere quanto dista dalla spiaggia, se c'è spazio esterno, dove si parcheggia e quanto costa tenerla. Il tono può essere più evocativo, ma i dati pratici non devono mancare.</p>
<p><strong>Modello da copiare</strong></p>
<p>[Località], [tipologia] a [metri/minuti a piedi] dalla spiaggia, con [terrazzo vista mare/giardino/patio] e [posto auto].</p>
<p>L'immobile si trova in [residence/palazzina/villa] [con piscina condominiale/giardino comune] ed è composto da [elenco locali], per un totale di [numero] posti letto.</p>
<p>Lo spazio esterno di [metri] mq è [coperto/attrezzato con doccia esterna] e affaccia su [mare/pineta/giardino]. La casa viene venduta [arredata/non arredata].</p>
<p>Dotazioni: [aria condizionata, zanzariere, lavatrice, ripostiglio per attrezzatura da spiaggia]. Riscaldamento [tipo, se utilizzabile anche d'inverno].</p>
<p>Nelle vicinanze: [stabilimenti, negozi, ristoranti, farmacia], [aperti tutto l'anno o solo in stagione].</p>
<p>Spese condominiali [importo annuo], comprensive di [voci]. Classe energetica [classe], indice di prestazione energetica [valore].</p>
<h3>Consigli per la casa al mare</h3>
<ul>
  <li>Distanza dal mare in metri o minuti reali, mai "a due passi".</li>
  <li>Specifica se il posto auto è assegnato: in estate fa la differenza.</li>
  <li>Se nomini l'affitto stagionale, non indicare rendimenti che non puoi documentare.</li>
</ul>`,
    },
    {
      id: 'descrizione-con-ai',
      title: `Far scrivere la descrizione all'intelligenza artificiale`,
      html: `<p>I modelli sopra si compilano in pochi minuti, ma se gestisci molti immobili puoi partire da una bozza generata dall'AI. Il principio è lo stesso: l'AI costruisce la struttura, tu verifichi i dati e aggiungi ciò che hai visto in visita.</p>
<p>In <a href="/it">Agente Immo</a>, quando inserisci un immobile o importi un annuncio da un link, l'AI può <strong>scrivere o riscrivere titolo e descrizione</strong> a partire dai dati dell'immobile: tipologia, metri, locali, piano, dotazioni. Puoi chiedere una versione più breve, più adatta all'affitto o con un tono diverso, e poi correggerla a mano.</p>
<p>Per ottenere un buon risultato, con qualsiasi strumento:</p>
<ul>
  <li><strong>Dai dati completi</strong>: l'AI non può inventare le spese o il tipo di riscaldamento, e non deve farlo.</li>
  <li><strong>Controlla ogni numero</strong>: metri, piano, classe energetica.</li>
  <li><strong>Togli i superlativi</strong> che l'AI tende ad aggiungere.</li>
  <li><strong>Aggiungi un dettaglio personale</strong>: la luce del mattino in cucina, il silenzio del cortile, il fornaio sotto casa.</li>
</ul>
<p>Per un panorama più ampio su dove l'AI è davvero utile nel lavoro quotidiano, leggi la guida sull'<a href="/it/intelligenza-artificiale-agenti-immobiliari">intelligenza artificiale per agenti immobiliari</a>.</p>`,
    },
  ],
  faq: [
    [`Come si scrive una buona descrizione di un immobile?`, `Inizia con tipologia, zona e punto di forza, poi descrivi contesto, palazzo, stanze nell'ordine della visita, dotazioni, pertinenze e dati economici. Usa fatti verificabili al posto degli aggettivi.`],
    [`Cosa scrivere nella prima frase della descrizione?`, `Tipologia, zona precisa e il motivo principale per sceglierla, per esempio un terrazzo o la vicinanza alla metro. Molti portali mostrano solo le prime righe, quindi lì va l'informazione più importante.`],
    [`Quanto deve essere lunga la descrizione di una casa?`, `Quanto serve per rispondere alle domande che un cliente farebbe prima di visitarla. Un bilocale richiede meno testo di una villa, ma in entrambi i casi non devono mancare piano, spese, riscaldamento, classe energetica e disponibilità.`],
    [`Si può copiare la descrizione di un altro annuncio?`, `No, oltre a essere poco professionale rischi di riportare dati sbagliati. Usa un modello come struttura e compilalo con i dati reali del tuo immobile.`],
    [`Come descrivere una casa da ristrutturare senza scoraggiare?`, `Sii chiaro sullo stato e valorizza il potenziale: metri, luce, altezze, elementi da conservare. Puoi affiancare alle foto reali una proposta di arredo virtuale, dichiarata come tale.`],
    [`L'AI può scrivere la descrizione di un immobile?`, `Sì, può preparare una bozza completa partendo dai dati dell'immobile. Va sempre riletta: controlla i numeri, togli i superlativi e aggiungi i dettagli che conosci per averla visitata.`],
  ],
};

export const fotoSmartphone: Guide = {
  slug: 'foto-immobiliari-smartphone',
  label: 'Foto immobiliari con lo smartphone',
  title: `Foto immobiliari con lo smartphone: guida per agenti`,
  description: `Foto immobiliari con lo smartphone: come preparare la casa, scegliere luce e inquadratura, usare grandangolo e HDR, quante foto fare ed errori da evitare.`,
  h1: `Foto immobiliari con lo smartphone: come fotografare una casa per venderla`,
  intro: `Con uno smartphone recente si possono fare foto immobiliari ottime, se si curano quattro cose: casa preparata, luce giusta, telefono all'altezza corretta e linee verticali dritte. Ecco come farlo stanza per stanza, con gli errori da evitare.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'preparare-casa',
      title: `Come preparare la casa prima delle foto`,
      html: `<p>La differenza tra una foto mediocre e una buona si fa prima di scattare. Dieci minuti di preparazione valgono più di qualsiasi ritocco. Concorda con il proprietario una data e mandagli prima questa lista.</p>
<h3>Checklist di preparazione</h3>
<ul>
  <li><strong>Superfici libere</strong>: piani cucina, tavoli, comodini e mensole il più possibile sgombri.</li>
  <li><strong>Bagno</strong>: via flaconi, spazzolini, asciugamani usati. Tavoletta del WC abbassata.</li>
  <li><strong>Letti rifatti</strong> con biancheria chiara e cuscini in ordine.</li>
  <li><strong>Oggetti personali</strong>: foto di famiglia, documenti, calendari e disegni dei bambini tolti dalla vista.</li>
  <li><strong>Cavi e caricabatterie</strong> nascosti.</li>
  <li><strong>Tende aperte</strong>, tapparelle alzate, finestre pulite.</li>
  <li><strong>Tutte le luci accese</strong>, con lampadine dello stesso colore se possibile.</li>
  <li><strong>Animali, ciotole e cucce</strong> fuori dall'inquadratura.</li>
  <li><strong>Esterni</strong>: balconi sgombri, prato tagliato, bidoni lontani.</li>
</ul>
<p>Non serve rendere la casa impersonale, ma ordinata: chi guarda deve potersi immaginare lì dentro. Se la casa è piena di mobili, spostane qualcuno fuori dall'inquadratura per dare respiro alla stanza.</p>
<p>Se l'immobile è vuoto o arredato in modo molto datato, puoi comunque fotografarlo bene e valutare dopo un arredo virtuale. Ne parliamo più avanti.</p>
<p>Preparare la casa è un lavoro da fare insieme al proprietario: spiegargli perché conta fa parte del mestiere di <a href="/it/agente-immobiliare">agente immobiliare</a> tanto quanto scattare le foto.</p>`,
    },
    {
      id: 'luce-orario',
      title: `Luce e orario: quando fotografare una casa`,
      html: `<p>La luce è l'ingrediente principale di una foto immobiliare. Il momento giusto dipende dall'esposizione della casa, quindi chiedi al proprietario quando entra più sole e usa la bussola del telefono durante il sopralluogo.</p>
<ul>
  <li><strong>Interni</strong>: scegli le ore in cui la luce naturale è abbondante ma non entra sole diretto violento sul pavimento, che crea macchie bruciate e ombre nette. Una giornata luminosa ma velata spesso dà i risultati più uniformi.</li>
  <li><strong>Esterni e facciata</strong>: fotografali quando il sole illumina il lato che ti interessa, non quando lo hai alle spalle dell'edificio.</li>
  <li><strong>Terrazzi con vista</strong>: valuta il tardo pomeriggio, quando la luce è più calda.</li>
  <li><strong>Foto al crepuscolo</strong>: con luci interne accese e cielo ancora blu rendono molto per ville e attici, ma richiedono un telefono stabile.</li>
</ul>
<h3>Luci artificiali</h3>
<p>Accendi tutte le luci anche di giorno: riempiono gli angoli bui. Il problema è il colore: lampadine calde e fredde mescolate danno dominanti diverse nella stessa foto. Se puoi, uniforma, oppure spegni quelle che stonano.</p>
<p>Evita il flash del telefono: appiattisce la stanza e crea riflessi su vetri e superfici lucide.</p>
<p>Se sei costretto a fotografare in un giorno grigio o in un orario sbagliato, non arrenderti: molte correzioni si possono fare dopo. Vedi la guida su come <a href="/it/migliorare-foto-annuncio-immobiliare">migliorare le foto di un annuncio immobiliare</a>.</p>`,
    },
    {
      id: 'altezza-inquadratura',
      title: `Altezza, angolo e verticali dritte`,
      html: `<p>La maggior parte delle foto immobiliari fatte con il telefono ha lo stesso difetto: pareti che cadono verso l'interno o verso l'esterno. Succede quando inclini il telefono in alto o in basso. Ecco come evitarlo.</p>
<h3>Altezza del telefono</h3>
<p>Tieni il telefono all'incirca all'<strong>altezza del petto</strong>, più bassa rispetto all'altezza degli occhi. In questo modo i mobili si vedono nelle giuste proporzioni e il pavimento non domina l'immagine. In cucine e bagni puoi alzarti leggermente per mostrare i piani di lavoro.</p>
<h3>Telefono perfettamente verticale</h3>
<p>Attiva la <strong>griglia</strong> nelle impostazioni della fotocamera e allinea le linee verticali di porte, finestre e spigoli con le linee della griglia. Il telefono deve essere dritto, né inclinato verso il soffitto né verso il pavimento. Alcuni telefoni mostrano anche un indicatore di livello: usalo.</p>
<h3>Angolo di ripresa</h3>
<ul>
  <li>Scatta da un <strong>angolo della stanza</strong>, verso l'angolo opposto: mostri due o tre pareti e dai profondità.</li>
  <li>Posizionati sulla soglia per le stanze piccole.</li>
  <li>Fai anche uno scatto frontale su una parete, se c'è un elemento importante (camino, vetrata, cucina).</li>
  <li>Evita di tagliare a metà mobili o finestre sui bordi.</li>
</ul>
<h3>Orizzontale, sempre</h3>
<p>Per i portali scatta in <strong>orizzontale</strong>. Le foto verticali vengono ritagliate o mostrate con bande laterali. Il verticale ha senso solo per i contenuti social, che puoi girare separatamente.</p>
<p>Un treppiede leggero o un piccolo supporto aiuta molto a mantenere altezza e verticali costanti in tutte le stanze.</p>`,
    },
    {
      id: 'grandangolo-hdr',
      title: `Grandangolo, HDR e impostazioni del telefono`,
      html: `<p>Non servono app particolari: le funzioni della fotocamera di serie bastano, se le usi bene.</p>
<h3>Grandangolo, con misura</h3>
<p>Quasi tutti gli smartphone hanno un obiettivo grandangolare (spesso indicato come 0,5x). È utile nelle stanze piccole per mostrare più spazio, ma deforma i bordi e allunga gli ambienti. Usalo quando serve davvero, ad esempio in bagni e camere piccole, e preferisci l'obiettivo principale quando la stanza è abbastanza grande. L'obiettivo è mostrare lo spazio com'è, non farlo sembrare più grande: il cliente in visita se ne accorgerebbe.</p>
<h3>HDR</h3>
<p>L'<strong>HDR</strong> combina più esposizioni per mostrare sia l'interno della stanza sia quello che c'è fuori dalla finestra. Per le foto immobiliari è quasi sempre utile: lascialo attivo o in automatico. Tieni il telefono fermo durante lo scatto, perché l'HDR unisce più immagini.</p>
<h3>Altre impostazioni</h3>
<ul>
  <li><strong>Pulisci l'obiettivo</strong> prima di iniziare: un'impronta basta a rendere tutto lattiginoso.</li>
  <li><strong>Esposizione</strong>: tocca lo schermo su una zona di media luminosità e, se serve, abbassa o alza leggermente l'esposizione.</li>
  <li><strong>Niente zoom digitale</strong>: perde qualità. Avvicinati invece.</li>
  <li><strong>Niente filtri</strong>: i colori devono essere realistici.</li>
  <li><strong>Massima risoluzione</strong> e formato standard, senza ritagli quadrati.</li>
  <li><strong>Modalità ritratto</strong> disattivata: sfoca lo sfondo, e nelle foto di interni lo sfondo è la casa.</li>
</ul>`,
    },
    {
      id: 'quante-foto',
      title: `Quali stanze fotografare, quante foto e quale copertina`,
      html: `<p>Il numero giusto di foto dipende dalla casa: un monolocale richiede meno scatti di una villa con giardino. La regola è che <strong>ogni ambiente abbia almeno una foto chiara</strong> e che quelli importanti ne abbiano più di una da angolazioni diverse.</p>
<h3>Lista degli scatti</h3>
<ul>
  <li><strong>Soggiorno</strong>: due o tre angolazioni.</li>
  <li><strong>Cucina</strong>: una d'insieme, una del piano di lavoro se merita.</li>
  <li><strong>Camere</strong>: una o due per camera, con letto e finestra visibili.</li>
  <li><strong>Bagni</strong>: almeno una per bagno.</li>
  <li><strong>Ingresso e corridoio</strong>: solo se aiutano a capire la distribuzione.</li>
  <li><strong>Esterni privati</strong>: balcone, terrazzo, giardino, con la vista se c'è.</li>
  <li><strong>Facciata e parti comuni</strong>.</li>
  <li><strong>Pertinenze</strong>: box, cantina.</li>
  <li><strong>Dettagli di pregio</strong>: pavimenti, soffitti decorati, camino. Pochi e mirati.</li>
</ul>
<p>Scatta più foto di quelle che pubblicherai e scegli dopo. In fase di pubblicazione elimina doppioni e scatti deboli.</p>
<h3>Ordine e copertina</h3>
<p>Pubblica le foto nell'ordine della visita: zona giorno, zona notte, bagni, esterni, parti comuni, planimetria. La <strong>copertina</strong> è la foto più importante: scegli la stanza più luminosa e rappresentativa, o l'esterno se è il vero punto di forza. Deve essere orizzontale, dritta e coerente con il titolo dell'annuncio. Trovi più dettagli nella guida su <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>`,
    },
    {
      id: 'errori-comuni',
      title: `Gli errori più comuni nelle foto immobiliari`,
      html: `<p>Prima di caricare, scorri la galleria e cerca questi problemi. Sono i più frequenti e quasi tutti evitabili.</p>
<ol>
  <li><strong>Verticali storte</strong>: pareti che cadono, porte inclinate. Si correggono in parte dopo, ma è meglio evitarle in scatto.</li>
  <li><strong>Finestre bianche bruciate</strong> e stanze scure: attiva l'HDR ed evita il controluce diretto.</li>
  <li><strong>Il fotografo riflesso</strong> in specchi, vetri, forni e televisori spenti. Cambia angolazione o usa il timer.</li>
  <li><strong>Foto del WC in primo piano</strong>: inquadra il bagno dalla porta, mostrando lavabo e doccia.</li>
  <li><strong>Disordine</strong>: un solo asciugamano per terra rovina una foto altrimenti buona.</li>
  <li><strong>Grandangolo esagerato</strong>: stanze che sembrano corridoi, mobili deformati ai bordi.</li>
  <li><strong>Foto verticali</strong> sui portali.</li>
  <li><strong>Troppe foto uguali</strong> della stessa stanza.</li>
  <li><strong>Colori sbagliati</strong>: dominanti gialle o blu per luci miste.</li>
  <li><strong>Persone, targhe, documenti</strong> visibili: vanno tolti per privacy.</li>
  <li><strong>Foto vecchie</strong>: stagione diversa o arredi ormai spostati. Il cliente se ne accorge in visita.</li>
</ol>
<p>Se ne trovi più di due nella stessa foto, di solito conviene rifarla piuttosto che ritoccarla.</p>`,
    },
    {
      id: 'ritocco',
      title: `Ritoccare le foto dopo lo scatto`,
      html: `<p>Un ritocco leggero migliora molto il risultato e si fa anche dall'editor del telefono. L'obiettivo è una foto <strong>fedele ma al suo meglio</strong>, non una foto diversa dalla realtà.</p>
<h3>Correzioni consentite e utili</h3>
<ul>
  <li><strong>Raddrizzare</strong>: correggi orizzonte e verticali con lo strumento prospettiva.</li>
  <li><strong>Esposizione e ombre</strong>: schiarisci le zone buie senza bruciare le finestre.</li>
  <li><strong>Bilanciamento del bianco</strong>: pareti bianche devono restare bianche, non gialle o blu.</li>
  <li><strong>Ritaglio</strong>: elimina bordi inutili mantenendo il formato orizzontale.</li>
  <li><strong>Piccola pulizia</strong>: un cavo, una macchia sul muro, un oggetto dimenticato.</li>
</ul>
<h3>Cosa non fare</h3>
<ul>
  <li>Saturazione esagerata, cieli finti innaturali, filtri.</li>
  <li>Togliere difetti che fanno parte dell'immobile: crepe, macchie di umidità, un palazzo davanti alla finestra, un traliccio.</li>
  <li>Modificare elementi strutturali, finestre o dimensioni degli ambienti.</li>
</ul>
<p>Mantieni lo stesso stile di ritocco su tutte le foto dello stesso annuncio: la galleria deve sembrare coerente. Se vuoi applicare le stesse correzioni a molte foto, conviene uno strumento che lavori in serie.</p>
<p>Tutto quello che va oltre il ritocco, come arredare una stanza vuota, trasformarla o cambiarle aspetto, rientra nel virtual staging e va dichiarato. Ne parliamo nella prossima sezione.</p>`,
    },
    {
      id: 'staging-ai',
      title: `Quando l'home staging con l'AI aiuta davvero`,
      html: `<p>Anche con foto perfette, alcune stanze non convincono: la casa vuota sembra più piccola e fredda, l'arredo datato distrae, la stanza da ristrutturare spaventa. In questi casi l'<strong>home staging virtuale</strong> può aiutare chi guarda a immaginare gli spazi.</p>
<h3>Quando conviene</h3>
<ul>
  <li><strong>Casa vuota</strong>: aggiungere arredi fa capire proporzioni e funzione delle stanze.</li>
  <li><strong>Arredo molto datato o personale</strong>: una versione ridisegnata aiuta a vedere oltre.</li>
  <li><strong>Stanza dalla funzione incerta</strong>: mostrare la seconda camera come studio o cameretta.</li>
  <li><strong>Da ristrutturare</strong>: una proposta di come potrebbe diventare, da accompagnare alle foto reali.</li>
</ul>
<h3>Quando non serve</h3>
<p>Se la casa è già arredata bene e ordinata, basta fotografarla bene. Lo staging non deve diventare un modo per nascondere lo stato reale.</p>
<h3>Le regole da rispettare</h3>
<p>Le foto con arredo virtuale vanno <strong>dichiarate</strong> nell'annuncio e affiancate alle foto originali, senza modificare muri, finestre, pavimenti o difetti. Trovi i dettagli nella guida sul <a href="/it/virtual-staging-legale">virtual staging legale</a> e una panoramica completa nella guida sull'<a href="/it/home-staging-virtuale">home staging virtuale</a>.</p>
<p>Con <a href="/it#prova">Agente Immo puoi provare gratis</a> su una tua foto: la carichi in chat, chiedi di arredarla, svuotarla o cambiarle stile, e vedi il risultato. Parti sempre da una foto ben scattata: l'AI lavora meglio se l'originale è luminoso e dritto.</p>`,
    },
  ],
  faq: [
    [`Si possono fare foto immobiliari professionali con lo smartphone?`, `Sì, con uno smartphone recente si ottengono ottimi risultati se la casa è preparata, la luce è buona, il telefono è all'altezza del petto e le verticali sono dritte. Per immobili di pregio può comunque valere la pena un fotografo.`],
    [`A che altezza tenere il telefono per fotografare una stanza?`, `Circa all'altezza del petto, tenendolo perfettamente verticale. Così i mobili restano proporzionati e le pareti non cadono.`],
    [`Meglio usare il grandangolo per le foto della casa?`, `Il grandangolo è utile nelle stanze piccole, ma deforma i bordi e può far sembrare gli ambienti più grandi di quanto sono. Usalo con misura e preferisci l'obiettivo principale quando lo spazio lo permette.`],
    [`Qual è l'ora migliore per fotografare una casa?`, `Dipende dall'esposizione. Per gli interni scegli ore con molta luce naturale ma senza sole diretto violento; per la facciata, quando il sole illumina il lato da fotografare.`],
    [`Quante foto servono per un annuncio immobiliare?`, `Non c'è un numero fisso: ogni ambiente deve avere almeno una foto chiara e le stanze principali più angolazioni. Una villa richiede più foto di un monolocale.`],
    [`Le foto con arredo virtuale vanno dichiarate?`, `Sì. Vanno indicate chiaramente come tali e affiancate alle foto originali, senza alterare elementi strutturali o nascondere difetti.`],
  ],
};

export const migliorareFoto: Guide = {
  slug: 'migliorare-foto-annuncio-immobiliare',
  label: 'Migliorare le foto dell\'annuncio',
  title: `Migliorare le foto di un annuncio immobiliare (anche vuote)`,
  description: `Migliorare le foto di un annuncio immobiliare già scattate: luce, verticali, disordine, cielo, stanze vuote e staging virtuale, con le regole da seguire.`,
  h1: `Come migliorare le foto di un annuncio immobiliare già pubblicato`,
  intro: `Per migliorare le foto di un annuncio immobiliare parti dalle correzioni tecniche (luce, colori, verticali), poi togli il disordine e solo dopo valuta interventi come l'arredo virtuale, sempre dichiarati. Ecco come farlo, in che ordine e cosa è consentito.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'da-dove-partire',
      title: `Da dove partire: valutare le foto che hai`,
      html: `<p>Prima di ritoccare, guarda le foto con gli occhi di chi cerca casa. Aprile dal telefono, nell'elenco dei risultati del portale, accanto agli annunci concorrenti della stessa zona. La tua copertina si nota o si perde?</p>
<p>Poi dividi le foto in tre gruppi:</p>
<ol>
  <li><strong>Buone</strong>: luminose, dritte, ordinate. Al massimo un ritocco leggero.</li>
  <li><strong>Recuperabili</strong>: scure, storte, con qualche oggetto di troppo o un cielo grigio. Si sistemano con le correzioni descritte sotto.</li>
  <li><strong>Da rifare</strong>: mosse, sfocate, con il fotografo riflesso, con disordine diffuso o scattate in verticale. Nessun ritocco le salva davvero: meglio tornare in casa.</li>
</ol>
<p>Se le foto da rifare sono tante, vale la pena organizzare un nuovo sopralluogo con la casa preparata. La guida sulle <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a> spiega come.</p>
<h3>Quali foto sistemare per prime</h3>
<p>Concentrati sulla <strong>copertina</strong> e sulle prime quattro o cinque immagini: sono quelle che vengono guardate di più. Una copertina migliorata può cambiare le visualizzazioni dell'annuncio più di dieci foto interne ritoccate.</p>
<p>Un modo rapido per avere una diagnosi è far analizzare l'annuncio: in <a href="/it">Agente Immo</a> la funzione Miglioralo importa l'annuncio dal link e indica, tra le altre cose, quali foto sono scure, storte o ritraggono stanze vuote.</p>
<p>Foto curate sono anche il biglietto da visita di un <a href="/it/agente-immobiliare">agente immobiliare</a>: il proprietario che sceglie a chi affidare casa guarda come sono presentati gli altri tuoi immobili.</p>`,
    },
    {
      id: 'esposizione-colori',
      title: `Correggere esposizione, luce e colori`,
      html: `<p>La correzione più utile e meno rischiosa è quella della luce. Le foto immobiliari fatte in fretta sono quasi sempre troppo scure, con finestre bianche e angoli neri.</p>
<h3>Passaggi, nell'ordine</h3>
<ol>
  <li><strong>Esposizione generale</strong>: alza finché la stanza sembra luminosa come dal vivo, non di più.</li>
  <li><strong>Luci alte</strong>: abbassale per recuperare dettaglio nelle finestre e nelle pareti chiare.</li>
  <li><strong>Ombre</strong>: alzale per schiarire angoli e sotto i mobili.</li>
  <li><strong>Bilanciamento del bianco</strong>: le pareti bianche devono tornare bianche. Le dominanti gialle vengono da lampadine calde, quelle blu dalla luce del cielo in ombra.</li>
  <li><strong>Contrasto e nitidezza</strong>: pochi punti, per dare corpo all'immagine.</li>
</ol>
<h3>Errori da evitare</h3>
<ul>
  <li>Saturazione alta: il legno diventa arancione, il prato fluorescente.</li>
  <li>Effetto HDR esagerato, con aloni intorno a finestre e mobili.</li>
  <li>Stili diversi tra le foto dello stesso annuncio.</li>
</ul>
<p>Se devi sistemare molte foto, applica le stesse regolazioni alle foto della stessa stanza o scattate nello stesso momento: risparmi tempo e ottieni una galleria coerente. Queste correzioni non cambiano il contenuto della foto e non richiedono di essere dichiarate: stai solo facendo vedere la casa come appare davvero.</p>`,
    },
    {
      id: 'raddrizzare',
      title: `Raddrizzare verticali e prospettiva`,
      html: `<p>Pareti che cadono e orizzonti storti fanno sembrare una foto amatoriale anche quando la luce è buona. Per fortuna si correggono facilmente.</p>
<h3>Come fare</h3>
<ol>
  <li>Apri lo strumento <strong>ritaglio e prospettiva</strong> dell'editor.</li>
  <li>Correggi prima la <strong>rotazione</strong>, usando come riferimento una linea che deve essere orizzontale, come il bordo di un tavolo o il battiscopa, oppure uno spigolo verticale.</li>
  <li>Poi correggi la <strong>prospettiva verticale</strong> finché gli spigoli delle pareti, le porte e le finestre sono paralleli ai bordi della foto.</li>
  <li><strong>Ritaglia</strong> per eliminare i bordi vuoti che la correzione crea, mantenendo il formato orizzontale.</li>
</ol>
<h3>Limiti</h3>
<p>Ogni correzione di prospettiva taglia una parte dell'immagine. Se la foto era molto inclinata, potresti perdere parte del soffitto o del pavimento, o una porzione di mobile. Se il ritaglio toglie informazioni importanti, la foto va rifatta.</p>
<p>Il grandangolo spinto crea anche distorsioni ai bordi: mobili stirati, stanze che sembrano corridoi. Alcuni editor hanno la correzione dell'obiettivo, che le riduce. Se il risultato continua a sembrare innaturale, preferisci un'altra foto della stessa stanza.</p>
<p>Anche questa è una correzione tecnica che non altera il contenuto, quindi non richiede dichiarazioni.</p>`,
    },
    {
      id: 'disordine-cielo',
      title: `Togliere il disordine e sostituire il cielo`,
      html: `<p>Qui si passa dalla correzione tecnica alla modifica del contenuto. Ci sono interventi accettabili e altri che non lo sono, e la differenza sta in una domanda: <strong>quello che tolgo o cambio fa parte dell'immobile?</strong></p>
<h3>Rimozione degli oggetti</h3>
<p>Gli strumenti di rimozione con l'AI permettono di cancellare oggetti in pochi secondi. È ragionevole togliere:</p>
<ul>
  <li>oggetti personali e temporanei: flaconi, giocattoli, vestiti, cavi, bidoni;</li>
  <li>persone, auto e targhe riconoscibili;</li>
  <li>un riflesso del fotografo in uno specchio.</li>
</ul>
<p>Non è corretto togliere: crepe, macchie di umidità, impianti a vista, un palazzo davanti alla finestra, pali, tralicci, un cantiere vicino. Sono informazioni sull'immobile e il compratore ha diritto di vederle.</p>
<h3>Sostituzione del cielo</h3>
<p>Un cielo grigio rende tristi facciate, giardini e terrazzi. Sostituirlo con un cielo sereno è una pratica diffusa ed è in genere accettata, purché il risultato sia realistico: luce e ombre della scena devono essere coerenti con il nuovo cielo. Evita tramonti drammatici su foto scattate a mezzogiorno.</p>
<p>Se l'intervento cambia in modo evidente la percezione della casa o dell'ambiente, è buona pratica segnalarlo nell'annuncio. Nel dubbio, dichiara: non costa nulla e protegge te e il proprietario.</p>`,
    },
    {
      id: 'stanze-vuote-staging',
      title: `Stanze vuote e arredo datato: il virtual staging`,
      html: `<p>Le stanze vuote sono tra le foto meno efficaci: sembrano più piccole, fredde e difficili da immaginare. L'arredo molto datato o personale ha un effetto simile, perché chi guarda vede i mobili e non la casa.</p>
<p>Il <strong>virtual staging</strong> aggiunge o sostituisce l'arredamento in una foto esistente. Con gli strumenti AI di oggi si può:</p>
<ul>
  <li><strong>arredare</strong> una stanza vuota in uno stile coerente con il target;</li>
  <li><strong>svuotare</strong> una stanza piena di mobili, per mostrarne gli spazi;</li>
  <li><strong>cambiare stile</strong> all'arredo esistente;</li>
  <li><strong>mostrare una funzione</strong> diversa, per esempio la seconda camera come studio.</li>
</ul>
<h3>Come ottenere un risultato credibile</h3>
<ul>
  <li>Parti da una foto già corretta in luce e verticali.</li>
  <li>Scegli arredi proporzionati alla stanza reale: un divano enorme in un soggiorno piccolo crea aspettative sbagliate.</li>
  <li>Usa uno stile sobrio e realistico, simile a quello di una casa vera, non da rivista.</li>
  <li>Controlla che muri, finestre, porte, pavimenti e impianti restino identici.</li>
</ul>
<p>In <a href="/it">Agente Immo</a> lo fai in una chat: carichi la foto e chiedi di arredarla, svuotarla, cambiarle stile o ricavarne una planimetria. Puoi <a href="/it#prova">provarlo gratis su una tua foto</a> prima di decidere. Per costi e alternative, leggi anche la guida sul <a href="/it/home-staging-costo">costo dell'home staging</a>.</p>`,
    },
    {
      id: 'giorno-notte',
      title: `Da giorno a notte e altre trasformazioni`,
      html: `<p>Oltre all'arredo, l'AI permette trasformazioni più creative. Sono utili soprattutto per la <strong>copertina</strong> e per i <strong>social</strong>, dove l'obiettivo è fermare chi scorre.</p>
<h3>Trasformazioni possibili</h3>
<ul>
  <li><strong>Da giorno a notte</strong>: la facciata o il giardino con luci accese e cielo serale. Molto efficace per ville, attici e case con giardino.</li>
  <li><strong>Prima e dopo</strong>: la stanza vuota o datata accanto alla versione arredata, in un'unica immagine o in un video.</li>
  <li><strong>Stagioni</strong>: un giardino fotografato in inverno reso con il verde della bella stagione. Da usare con molta cautela, perché cambia la percezione dell'immobile.</li>
</ul>
<h3>Come usarle correttamente</h3>
<p>Queste immagini sono <strong>rappresentazioni</strong>, non fotografie della realtà. Vanno sempre:</p>
<ul>
  <li>dichiarate nella didascalia o nella descrizione;</li>
  <li>affiancate alla foto originale;</li>
  <li>coerenti con l'immobile: la versione notturna non deve mostrare luci o giardini che non esistono.</li>
</ul>
<p>Un buon uso è mettere la versione trasformata come copertina o nei post social e la foto reale subito dopo. Chi guarda capisce il potenziale e vede subito lo stato attuale. Se vuoi trasformarle in video, la guida sui <a href="/it/reel-immobiliari-instagram-tiktok">reel immobiliari</a> propone formati come il prima e dopo e il giorno e notte.</p>`,
    },
    {
      id: 'cosa-e-consentito',
      title: `Cosa è consentito e cosa va dichiarato`,
      html: `<p>Le foto di un annuncio devono permettere al compratore di farsi un'idea corretta dell'immobile. Più l'intervento cambia il contenuto, più serve trasparenza. Uno schema pratico:</p>
<h3>Correzioni tecniche: non serve dichiarare</h3>
<ul>
  <li>Luce, esposizione, colori, bilanciamento del bianco.</li>
  <li>Raddrizzamento e prospettiva.</li>
  <li>Ritaglio.</li>
</ul>
<h3>Piccole pulizie: in genere accettate</h3>
<ul>
  <li>Rimozione di oggetti personali e temporanei.</li>
  <li>Oscuramento di persone, targhe e dati personali.</li>
</ul>
<h3>Modifiche del contenuto: da dichiarare</h3>
<ul>
  <li>Arredo virtuale, svuotamento, cambio di stile.</li>
  <li>Trasformazioni giorno e notte, stagioni, proposte di ristrutturazione.</li>
  <li>Sostituzione del cielo, quando cambia in modo significativo la percezione.</li>
</ul>
<h3>Da non fare mai</h3>
<ul>
  <li>Rimuovere difetti dell'immobile o elementi del contesto (umidità, crepe, edifici, infrastrutture).</li>
  <li>Modificare muri, finestre, altezze, dimensioni o viste.</li>
  <li>Pubblicare solo la versione modificata senza l'originale.</li>
</ul>
<p>Per dichiarare basta una formula chiara, per esempio nella didascalia della foto o in fondo alla descrizione: "Alcune immagini presentano un arredo virtuale a scopo illustrativo. Le foto originali sono incluse nella galleria." Approfondisci nella guida sul <a href="/it/virtual-staging-legale">virtual staging legale</a>.</p>`,
    },
    {
      id: 'flusso-di-lavoro',
      title: `Un flusso di lavoro per sistemare le foto in poco tempo`,
      html: `<p>Per non trasformare il ritocco in una serata persa, usa sempre la stessa sequenza. Vale per un annuncio nuovo e per uno già online che non sta funzionando.</p>
<ol>
  <li><strong>Seleziona</strong>: scegli le foto da pubblicare ed elimina doppioni e scatti da rifare.</li>
  <li><strong>Correggi la tecnica</strong>: luce, colori, verticali, ritaglio. Applica le stesse regolazioni a gruppi di foto simili.</li>
  <li><strong>Pulisci</strong>: togli oggetti personali, persone, targhe.</li>
  <li><strong>Scegli le stanze da valorizzare</strong>: di solito soggiorno e camera principale se sono vuote o datate, più eventuali esterni con cielo grigio.</li>
  <li><strong>Crea le versioni arredate o trasformate</strong>, controllando che la struttura resti identica.</li>
  <li><strong>Componi la galleria</strong>: copertina (anche arredata, se dichiarata), poi l'ordine della visita, con ogni foto modificata seguita dalla sua versione originale.</li>
  <li><strong>Aggiorna il testo</strong>: aggiungi la dichiarazione sulle immagini modificate e, se serve, rivedi titolo e descrizione.</li>
  <li><strong>Riutilizza</strong>: le stesse immagini diventano post, reel e pagina dell'immobile sul tuo sito.</li>
</ol>
<p>Dopo una o due settimane confronta visualizzazioni e contatti con il periodo precedente. Se sono aumentate le visualizzazioni ma non i contatti, il problema è probabilmente altrove: prezzo, descrizione o dati mancanti. In quel caso riparti dalla guida su <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>`,
    },
  ],
  faq: [
    [`Come si migliorano le foto di un annuncio immobiliare?`, `Prima correggi luce, colori e verticali, poi togli oggetti personali e disordine. Solo dopo valuta interventi come arredo virtuale o cambio del cielo, dichiarandoli e affiancandoli alle foto originali.`],
    [`È legale modificare le foto di una casa in vendita?`, `Le correzioni tecniche come luce e prospettiva sono normali. Le modifiche del contenuto, come l'arredo virtuale, sono accettate se dichiarate e se non nascondono difetti né alterano la struttura dell'immobile.`],
    [`Si può cambiare il cielo nelle foto immobiliari?`, `È una pratica diffusa, purché il risultato sia realistico e coerente con luci e ombre. Se cambia in modo significativo la percezione dell'immobile, è meglio segnalarlo.`],
    [`Come rendere professionali le foto fatte con il telefono?`, `Correggi esposizione, bilanciamento del bianco e verticali, ritaglia in formato orizzontale e mantieni lo stesso stile su tutta la galleria. Se le foto sono mosse o molto storte, conviene rifarle.`],
    [`Si possono arredare virtualmente le foto di una stanza vuota?`, `Sì, con il virtual staging. Va dichiarato nell'annuncio, la foto originale deve restare nella galleria e muri, finestre e pavimenti non devono essere modificati.`],
    [`Quali foto conviene migliorare per prime?`, `La copertina e le prime quattro o cinque immagini, perché sono quelle che vengono guardate di più e decidono se l'annuncio viene aperto.`],
  ],
};

export const reelImmobiliari: Guide = {
  slug: 'reel-immobiliari-instagram-tiktok',
  label: 'Reel immobiliari',
  title: `Reel immobiliari: 14 idee per Instagram e TikTok`,
  description: `Reel immobiliari: 14 idee con gancio e struttura per Instagram e TikTok, più durata, sottotitoli, musica, frequenza e come riutilizzare ogni video.`,
  h1: `Reel immobiliari: idee, struttura e consigli per Instagram e TikTok`,
  intro: `Un reel immobiliare funziona quando cattura nei primi secondi con un gancio visivo o una frase, mostra una cosa sola e finisce con un invito chiaro. Qui trovi 14 idee pronte, con gancio e struttura, e le regole pratiche su durata, testi, musica e frequenza.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'struttura-reel',
      title: `La struttura di un reel immobiliare che funziona`,
      html: `<p>Instagram e TikTok mostrano i video a persone che non ti seguono, ma decidono in pochi istanti se tenerli sullo schermo. Per questo quasi tutti i reel efficaci seguono la stessa struttura in tre parti.</p>
<ol>
  <li><strong>Gancio (primi secondi)</strong>: un'immagine sorprendente o una frase scritta che crea curiosità. "Questa stanza era così" funziona meglio di un logo o di "Nuova proposta in vendita".</li>
  <li><strong>Sviluppo</strong>: una sola idea, mostrata con ritmo. Un prima e dopo, un percorso nella casa, tre errori da evitare.</li>
  <li><strong>Chiusura</strong>: il risultato finale e un invito semplice: "Scrivimi CASA per i dettagli", "Salva il video", "Link in bio".</li>
</ol>
<h3>Cosa distingue un reel da un annuncio</h3>
<p>Un annuncio informa, un reel intrattiene o insegna. Chi scorre non sta cercando casa in quel momento: devi dargli un motivo per guardare fino in fondo. I dati (metri, prezzo, piano) vanno nella didascalia, non nei primi secondi.</p>
<h3>Formato</h3>
<ul>
  <li>Verticale 9:16, a schermo intero.</li>
  <li>Testi e volti lontani dai bordi, dove l'interfaccia dell'app copre il video.</li>
  <li>Buona luce e movimenti lenti: il telefono che traballa stanca.</li>
</ul>
<p>Se stai costruendo da zero la tua presenza video, leggi anche la guida sui <a href="/it/video-immobiliari-social">video immobiliari per i social</a>.</p>
<p>Un reel ben fatto non vende solo la casa: fa conoscere l'<a href="/it/agente-immobiliare">agente immobiliare</a> che c'è dietro, ed è così che arrivano i prossimi incarichi.</p>`,
    },
    {
      id: 'idee-immobili',
      title: `Idee per reel immobiliari sugli immobili (1-7)`,
      html: `<p>Idee che partono da un immobile che hai in vendita o in affitto. Per ognuna: gancio e struttura.</p>
<ol>
  <li><strong>Prima e dopo</strong>. Gancio: la stanza vuota o datata, con scritto "Guarda cosa diventa". Struttura: foto originale, passaggio alla versione arredata, dettagli, testo finale "Arredo virtuale a scopo illustrativo".</li>
  <li><strong>Il tour in 20 secondi</strong>. Gancio: la vista più bella della casa. Struttura: ingresso, soggiorno, cucina, camera, terrazzo, un'inquadratura per stanza, con il nome della stanza in sovrimpressione.</li>
  <li><strong>Indovina il prezzo</strong>. Gancio: "Quanto costa questa casa a [zona]?". Struttura: le stanze migliori, pausa, prezzo rivelato alla fine. Stimola i commenti.</li>
  <li><strong>Il dettaglio che non ti aspetti</strong>. Gancio: "Questo appartamento nasconde una cosa". Struttura: stanze normali, poi il terrazzo, il soppalco, la cantina di vini.</li>
  <li><strong>Giorno e notte</strong>. Gancio: la facciata di giorno. Struttura: transizione lenta alla versione serale con luci accese, perfetto per ville e attici.</li>
  <li><strong>Dal cantiere alla casa</strong>. Gancio: il cantiere o la stanza al grezzo. Struttura: il progetto o la versione finita, per immobili in costruzione o da ristrutturare.</li>
  <li><strong>Cosa compri con [cifra] a [zona]</strong>. Gancio: la cifra scritta grande. Struttura: due o tre immobili a confronto, con un dettaglio per ciascuno.</li>
</ol>
<p>Quando usi immagini arredate virtualmente o trasformate, scrivilo nel video o nella didascalia: vale sui social come negli annunci.</p>`,
    },
    {
      id: 'idee-agente',
      title: `Idee per video TikTok e Instagram dell'agente immobiliare (8-14)`,
      html: `<p>Questi reel non parlano di un immobile, ma di te e della tua zona. Sono quelli che costruiscono fiducia e portano proprietari, non solo compratori.</p>
<ol start="8">
  <li><strong>Tre errori che fanno i proprietari quando vendono</strong>. Gancio: "Se vendi casa, non fare questo". Struttura: tre errori con un esempio visivo per ciascuno, chiusura con "Scrivimi se vuoi una valutazione".</li>
  <li><strong>La zona in 30 secondi</strong>. Gancio: "Perché tutti cercano casa a [zona]". Struttura: il parco, la via dei negozi, la fermata, il bar di riferimento.</li>
  <li><strong>Un giorno da agente immobiliare</strong>. Gancio: l'orario della sveglia o la prima chiamata. Struttura: sopralluogo, foto, visita, firma, con clip brevi.</li>
  <li><strong>Domanda del cliente</strong>. Gancio: la domanda scritta, per esempio "Chi paga la provvigione?". Struttura: risposta in 20 secondi parlando in camera. Spunti nella guida sulla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</li>
  <li><strong>Venduto</strong>. Gancio: il cartello o le chiavi. Struttura: la casa, il tempo impiegato, un ringraziamento, con il consenso dei clienti se compaiono.</li>
  <li><strong>Come preparo una casa per le foto</strong>. Gancio: la stanza in disordine. Struttura: cosa sposto, cosa accendo, la foto finale.</li>
  <li><strong>Mito o verità</strong>. Gancio: "Serve l'APE per pubblicare un annuncio?". Struttura: risposta corretta e breve, con un esempio. Verifica sempre le norme che citi e rimanda alla guida su <a href="/it/ape-annunci-immobiliari">APE e annunci</a>.</li>
  <li><strong>Tu dentro la casa</strong>. Gancio: il tuo volto che saluta davanti all'immobile. Struttura: presenti la casa in prima persona, tre punti di forza, invito al contatto.</li>
</ol>
<p>Alterna le due famiglie di idee: gli immobili portano visualizzazioni, i contenuti sull'agente portano fiducia e incarichi. Per l'acquisizione, vedi anche la guida su come <a href="/it/acquisire-incarichi-immobiliari">acquisire incarichi immobiliari</a>.</p>`,
    },
    {
      id: 'durata',
      title: `Quanto deve durare un reel immobiliare`,
      html: `<p>Non esiste una durata perfetta valida per tutti. Conta una cosa sola: che il video sia <strong>lungo quanto serve e non un secondo di più</strong>. Le piattaforme premiano i video guardati fino in fondo e riguardati, e un video breve ha più probabilità di esserlo.</p>
<h3>Indicazioni pratiche per formato</h3>
<ul>
  <li><strong>Trasformazioni</strong> (prima e dopo, giorno e notte, cantiere): brevi, spesso intorno ai 10 secondi. La sorpresa è una sola e non va diluita.</li>
  <li><strong>Tour</strong>: da 15 a 30 secondi. Se la casa è grande, mostra le stanze migliori e rimanda all'annuncio per il resto.</li>
  <li><strong>Consigli e risposte</strong>: fino a 30-60 secondi, se parli in camera e il contenuto è utile.</li>
  <li><strong>Racconti</strong> (una giornata, una vendita): possono essere più lunghi, ma ogni clip deve durare pochi secondi.</li>
</ul>
<h3>Come accorciare</h3>
<ul>
  <li>Taglia l'inizio: niente logo, niente "Ciao a tutti", si parte dal gancio.</li>
  <li>Una inquadratura per idea, senza ripetizioni.</li>
  <li>Togli le pause nel parlato.</li>
  <li>Chiudi appena hai dato il risultato.</li>
</ul>
<p>Guarda le statistiche dei tuoi video: la curva di permanenza ti dice in quale secondo le persone abbandonano. È lì che va tagliato o cambiato qualcosa.</p>`,
    },
    {
      id: 'testi-sottotitoli',
      title: `Testi, sottotitoli e didascalie`,
      html: `<p>Molte persone guardano i reel senza audio. Se il messaggio è affidato solo alla voce o alla musica, lo perdono. Per questo testo a schermo e sottotitoli non sono un dettaglio.</p>
<h3>Testo a schermo</h3>
<ul>
  <li>Il gancio scritto nei primi secondi, in poche parole e ben leggibile.</li>
  <li>Una frase per inquadratura, al massimo.</li>
  <li>Caratteri grandi, con contrasto sufficiente sullo sfondo.</li>
  <li>Posizione centrale, lontano dai bordi coperti dall'interfaccia.</li>
</ul>
<h3>Sottotitoli</h3>
<p>Se parli in camera, aggiungi sempre i sottotitoli. Le app li generano automaticamente: rileggili, perché nomi di vie, zone e cifre vengono spesso trascritti male.</p>
<h3>Didascalia</h3>
<p>La didascalia è il posto per le informazioni. Una struttura semplice:</p>
<ol>
  <li>Prima riga che riprende il gancio o aggiunge curiosità.</li>
  <li>I dati essenziali: zona, tipologia, metri, punto di forza.</li>
  <li>La dichiarazione se ci sono immagini arredate o trasformate virtualmente.</li>
  <li>Invito all'azione: "Scrivimi in DM", "Link in bio".</li>
  <li>Pochi hashtag pertinenti: città, zona, tipologia.</li>
</ol>
<p>Scrivi come parli: la didascalia di un reel non è la descrizione del portale. Per quella, usa i modelli della guida sulla <a href="/it/descrizione-immobile-esempi">descrizione dell'immobile</a>.</p>`,
    },
    {
      id: 'musica',
      title: `Musica nei video immobiliari: cosa usare`,
      html: `<p>La musica dà ritmo e atmosfera, ma su un profilo professionale va scelta con attenzione.</p>
<h3>Diritti d'autore</h3>
<p>I profili aziendali o professionali possono avere accesso limitato ai brani commerciali nella libreria delle app, proprio per ragioni di licenza. Usare brani protetti fuori da quanto consentito può portare al silenziamento del video o ad altre limitazioni. Le strade sicure sono:</p>
<ul>
  <li>la libreria di brani disponibile per il tuo tipo di account nell'app;</li>
  <li>musica royalty free con licenza che copra l'uso commerciale;</li>
  <li>i suoni originali, come la tua voce o l'ambiente.</li>
</ul>
<h3>Come sceglierla</h3>
<ul>
  <li><strong>Coerente con l'immobile</strong>: più calma per una villa o una casa al mare, più ritmata per un bilocale in città o un prima e dopo.</li>
  <li><strong>A tempo</strong>: fai coincidere i cambi di inquadratura con i battiti. È uno degli accorgimenti che fanno sembrare un video curato.</li>
  <li><strong>Volume basso sotto la voce</strong>: se parli, la musica deve accompagnare, non coprire.</li>
</ul>
<h3>Suoni di tendenza</h3>
<p>Usare un audio di tendenza può aiutare la diffusione, ma solo se è adatto al tono professionale e se è disponibile per il tuo account. Un suono divertente su una casa di lusso rischia di stonare. Meglio un audio neutro ben montato che un audio virale fuori luogo.</p>`,
    },
    {
      id: 'frequenza',
      title: `Quanti reel pubblicare e quando`,
      html: `<p>La costanza conta più della quantità. Un ritmo che riesci a mantenere per mesi vale più di una settimana con un video al giorno seguita da un mese di silenzio.</p>
<h3>Come impostare il ritmo</h3>
<ul>
  <li>Parti da un obiettivo sostenibile, per esempio due o tre reel a settimana, e aumenta solo se riesci a mantenerlo.</li>
  <li>Prepara i video in blocco: un pomeriggio al mese per girare, un'ora a settimana per montare e programmare.</li>
  <li>Tieni un calendario con le idee già decise: il tempo si perde soprattutto a pensare cosa pubblicare.</li>
</ul>
<h3>Un esempio di settimana</h3>
<ul>
  <li><strong>Lunedì</strong>: un consiglio per proprietari o compratori.</li>
  <li><strong>Mercoledì</strong>: un immobile, con tour o prima e dopo.</li>
  <li><strong>Venerdì</strong>: la zona, un venduto o un dietro le quinte.</li>
</ul>
<h3>Orari</h3>
<p>L'orario migliore dipende dal tuo pubblico. Le statistiche del profilo mostrano quando i tuoi follower sono più attivi: parti da lì e prova orari diversi per qualche settimana, confrontando i risultati.</p>
<h3>Cosa misurare</h3>
<p>Più dei like, guarda la <strong>permanenza</strong> (quanto del video viene visto), i <strong>salvataggi</strong>, le <strong>condivisioni</strong> e soprattutto i <strong>messaggi</strong> ricevuti. Sono questi ultimi a portare appuntamenti.</p>`,
    },
    {
      id: 'riutilizzare',
      title: `Come riutilizzare ogni video su più canali`,
      html: `<p>Un reel ben fatto non va pubblicato una volta sola. Con poco lavoro diventa contenuto per molti canali.</p>
<h3>Un video, molti usi</h3>
<ul>
  <li><strong>Instagram e TikTok</strong>: lo stesso video, adattando didascalia e hashtag alla piattaforma.</li>
  <li><strong>Storie</strong>: una versione breve con un adesivo link o una domanda.</li>
  <li><strong>Altri social</strong> che supportano video verticali brevi.</li>
  <li><strong>WhatsApp</strong>: da mandare ai clienti in cerca di quella tipologia, o come stato.</li>
  <li><strong>Annuncio sul portale</strong>, se il portale permette di caricare video.</li>
  <li><strong>Il tuo sito</strong>: nella pagina dell'immobile. Vedi la guida sul <a href="/it/sito-web-agente-immobiliare">sito web dell'agente immobiliare</a>.</li>
  <li><strong>Acquisizione</strong>: da mostrare ai proprietari come esempio di come presenteresti la loro casa.</li>
</ul>
<h3>Da un video, altri contenuti</h3>
<ul>
  <li>I fotogrammi migliori diventano un carosello.</li>
  <li>Il prima e dopo diventa un post con due immagini.</li>
  <li>Un consiglio parlato diventa un testo per la newsletter o un post scritto.</li>
</ul>
<h3>Ripubblicare</h3>
<p>Un video che ha funzionato bene si può riproporre dopo qualche mese, con un gancio diverso o un nuovo montaggio. Il tuo pubblico cambia e molti non l'avranno visto.</p>
<p>Tieni un archivio ordinato per immobile e per tipo di video: ti fa risparmiare tempo quando ti serve un esempio in acquisizione.</p>`,
    },
    {
      id: 'video-ai',
      title: `Creare reel immobiliari con l'AI partendo dalle foto`,
      html: `<p>Il limite di molti agenti non sono le idee ma il tempo: girare, montare, aggiungere testi. Oggi una parte di questi video si può creare partendo dalle <strong>foto</strong> dell'immobile, senza riprese.</p>
<p>In <a href="/it">Agente Immo</a> ci sono modelli di video pensati per i social immobiliari, tra cui:</p>
<ul>
  <li><strong>Prima e dopo</strong>: la stanza originale che si trasforma nella versione arredata.</li>
  <li><strong>Cantiere</strong> e <strong>Volo nel cantiere</strong>: dal grezzo alla casa finita.</li>
  <li><strong>Giorno e notte</strong>: la facciata o il giardino che passa alla sera.</li>
  <li><strong>Camminata</strong>: un movimento dentro la stanza, come un breve tour.</li>
  <li><strong>Giro col drone</strong>: carichi una foto fatta col drone e il video gira piano attorno alla casa, alla stessa quota.</li>
  <li><strong>Stagioni</strong>: il giardino o il terrazzo che passa all'estate, alla primavera fiorita o sotto la neve.</li>
  <li><strong>Con te in video</strong>: tu che presenti l'immobile.</li>
</ul>
<p>Scegli la foto e il modello, e ottieni un video verticale pronto da pubblicare. Puoi <a href="/it#prova">provarlo gratis</a> con una tua foto: la prova comprende un video.</p>
<h3>Regole valide con qualsiasi strumento</h3>
<ul>
  <li>Parti da foto luminose e dritte: il video eredita i difetti dell'originale.</li>
  <li>Dichiara nella didascalia quando il video mostra arredi o trasformazioni virtuali.</li>
  <li>Alterna video generati e video girati da te: il volto dell'agente resta insostituibile per costruire fiducia.</li>
</ul>
<p>Per un quadro più ampio sugli strumenti, leggi la guida sull'<a href="/it/intelligenza-artificiale-agenti-immobiliari">intelligenza artificiale per agenti immobiliari</a>.</p>`,
    },
  ],
  faq: [
    [`Cosa pubblicare su Instagram come agente immobiliare?`, `Alterna contenuti sugli immobili (tour, prima e dopo, giorno e notte) e contenuti su di te e sulla zona (consigli, risposte alle domande, venduti, dietro le quinte). I primi portano visualizzazioni, i secondi fiducia e incarichi.`],
    [`Quanto deve durare un reel immobiliare?`, `Quanto serve e non di più. Le trasformazioni funzionano bene intorno ai 10 secondi, i tour tra 15 e 30, i consigli parlati possono arrivare a un minuto se il contenuto è utile.`],
    [`Che musica usare nei video immobiliari?`, `Brani della libreria disponibile per il tuo tipo di account o musica royalty free con licenza per uso commerciale. Scegli un ritmo coerente con l'immobile e tieni il volume basso se parli.`],
    [`Ogni quanto pubblicare reel immobiliari?`, `Con un ritmo che riesci a mantenere nel tempo, per esempio due o tre a settimana. La costanza per mesi conta più di una settimana intensa seguita dal silenzio.`],
    [`Serve mettere i sottotitoli ai reel?`, `Sì, se parli in camera. Molte persone guardano senza audio, e i sottotitoli permettono di capire il messaggio. Rileggi sempre quelli automatici, soprattutto nomi e cifre.`],
    [`Si possono fare video immobiliari senza girare?`, `Sì, con strumenti AI che creano video verticali partendo dalle foto, come prima e dopo o giorno e notte. Le trasformazioni virtuali vanno dichiarate nella didascalia.`],
    [`Come trovare idee per video TikTok da agente immobiliare?`, `Parti dalle domande che ti fanno clienti e proprietari: ognuna è un video. Aggiungi i formati sugli immobili, la tua zona e le giornate di lavoro, e tieni un calendario con le idee già decise.`],
  ],
};

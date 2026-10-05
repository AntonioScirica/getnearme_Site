import type { Guide } from './types';

// Guide per proprietari che vendono casa: come valutare una casa, quotazioni OMI, superficie commerciale.
// Niente statistiche o cifre inventate: gli esempi numerici sono dichiarati come esempi, i coefficienti come prassi indicativa.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const comeValutareCasa: Guide = {
  slug: 'come-valutare-una-casa',
  label: 'Come valutare una casa',
  title: 'Come valutare una casa: metodo passo passo con esempio',
  description: `Come valutare una casa da vendere anche da soli: superficie commerciale, quotazioni OMI, annunci simili e correzioni, con un esempio di calcolo completo.`,
  h1: 'Come valutare una casa da vendere: il metodo passo passo',
  intro: `Per valutare una casa calcoli la superficie commerciale, la moltiplichi per il prezzo al metro quadro della zona (partendo dalle quotazioni OMI dell'Agenzia delle Entrate) e correggi il risultato per piano, stato, extra e classe energetica. Poi confronti il numero con gli annunci di case simili vicino a te. In questa guida trovi ogni passo spiegato e un esempio di calcolo completo.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'da-dove-partire',
      title: 'Come valutare una casa da vendere: da dove partire',
      html: `<p>Valutare una casa significa trovare il prezzo a cui, con buona probabilità, un acquirente reale la comprerebbe oggi. Non è il prezzo che hai pagato tu, non è quanto hai speso nei lavori e non è il prezzo che vorresti ottenere. È una stima, quindi un <strong>intervallo</strong>: un minimo e un massimo, con un valore centrale.</p>
<p>Puoi arrivarci anche da solo, con un po' di pazienza. Ti servono quattro cose:</p>
<ol>
  <li><strong>La superficie commerciale</strong> della casa, cioè i metri quadri che si usano per i prezzi di vendita.</li>
  <li><strong>Il prezzo al metro quadro della zona</strong>, partendo dalle quotazioni OMI, i valori pubblicati gratis dall'Agenzia delle Entrate.</li>
  <li><strong>Gli annunci di case simili</strong> nella tua zona, da leggere con attenzione.</li>
  <li><strong>Le correzioni</strong> per quello che rende la tua casa migliore o peggiore della media: piano, ascensore, stato, box, terrazzo, classe energetica.</li>
</ol>
<p>Se vuoi un primo numero in pochi minuti, puoi fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a> online: segue proprio questo metodo. Ma capire i passaggi ti aiuta a leggere qualsiasi stima, anche quella di un'agenzia.</p>`,
    },
    {
      id: 'superficie-commerciale',
      title: 'Passo 1: calcola la superficie commerciale',
      html: `<p>La <strong>superficie commerciale</strong> è la misura usata per vendere una casa. Comprende i locali interni con i muri, più una parte delle superfici accessorie come balconi, terrazzi e cantina, calcolate con un coefficiente ridotto perché valgono meno di una stanza.</p>
<p>Non va confusa con la <strong>superficie calpestabile</strong>, cioè lo spazio interno su cui cammini, senza muri. La calpestabile è sempre più piccola della commerciale. Se confronti il prezzo al metro quadro della tua casa calcolato sulla calpestabile con prezzi riferiti alla commerciale, otterrai un valore sbagliato.</p>
<p>In pratica, per un appartamento si fa così:</p>
<ul>
  <li>prendi la superficie interna e aggiungi i muri: quelli interni e perimetrali per intero, quelli in comune con i vicini a metà;</li>
  <li>aggiungi i balconi e i terrazzi con una percentuale ridotta;</li>
  <li>aggiungi cantina, soffitta ed eventuale giardino con percentuali ancora più basse.</li>
</ul>
<p>Le percentuali non sono fissate da una legge per la compravendita: esistono criteri di riferimento e prassi di mercato. Trovi tutto spiegato, con una tabella di esempio, nella guida alla <a href="/it/superficie-commerciale">superficie commerciale e a come si calcola</a>. Un buon punto di partenza è la <strong>planimetria catastale</strong>, il disegno della casa depositato al Catasto, e la <strong>visura catastale</strong>, il documento che riassume i dati catastali: nelle visure recenti trovi spesso indicata anche la superficie catastale.</p>`,
    },
    {
      id: 'quotazioni-omi',
      title: 'Passo 2: le quotazioni OMI della zona (Agenzia delle Entrate)',
      html: `<p>L'<strong>OMI</strong>, Osservatorio del Mercato Immobiliare, è un servizio dell'Agenzia delle Entrate. Divide ogni comune in zone omogenee e, ogni semestre, pubblica per ogni zona un <strong>valore minimo e un valore massimo in euro al metro quadro</strong> per i vari tipi di abitazione, sia per la vendita sia per l'affitto.</p>
<p>Per usarle:</p>
<ol>
  <li>Trova la <strong>zona OMI</strong> in cui si trova la tua casa, sulla mappa del servizio "Quotazioni immobiliari" dell'Agenzia delle Entrate. È gratis.</li>
  <li>Scegli la <strong>tipologia</strong> giusta: per un normale appartamento di solito "abitazioni civili", per case più modeste "abitazioni di tipo economico", per immobili di pregio "abitazioni signorili", per le case indipendenti "ville e villini".</li>
  <li>Guarda lo <strong>stato conservativo</strong> (normale, ottimo, scadente) e annota il minimo e il massimo.</li>
</ol>
<p>Le quotazioni OMI non sono il prezzo della tua casa: sono un intervallo di riferimento per un immobile "medio" di quella zona. Ti dicono in che campo stai giocando. Per capire bene come leggerle leggi la guida alle <a href="/it/quotazioni-omi">quotazioni OMI</a>. Se vivi in una grande città, puoi farti un'idea dei valori anche dalle pagine dei <a href="/it/prezzi-case">prezzi delle case per città</a>, per esempio i prezzi delle case a <a href="/it/prezzi-case/roma">Roma</a>, <a href="/it/prezzi-case/milano">Milano</a>, <a href="/it/prezzi-case/napoli">Napoli</a>, <a href="/it/prezzi-case/torino">Torino</a> e <a href="/it/prezzi-case/palermo">Palermo</a>.</p>`,
    },
    {
      id: 'annunci-simili',
      title: 'Passo 3: confronta gli annunci simili (prezzo richiesto e prezzo di vendita)',
      html: `<p>Il secondo controllo sono gli annunci sui portali. Cerca case <strong>davvero simili</strong> alla tua: stessa zona, anzi stesse vie se possibile, metratura vicina, stesso tipo di palazzo, stato simile. Annota per ognuna il prezzo e i metri quadri, e calcola il prezzo al metro quadro.</p>
<p>Attenzione a una cosa importante: <strong>il prezzo dell'annuncio è il prezzo richiesto, non il prezzo di vendita</strong>. Tra quello che il venditore chiede e quello che l'acquirente paga c'è quasi sempre una trattativa. Alcuni annunci, poi, sono fuori mercato e restano online per mesi proprio perché troppo cari.</p>
<p>Qualche consiglio pratico:</p>
<ul>
  <li><strong>Guarda da quanto tempo è online</strong> un annuncio. Se un appartamento simile al tuo è pubblicato da molti mesi o ha già abbassato il prezzo, probabilmente quel prezzo era troppo alto.</li>
  <li><strong>Controlla i metri quadri dichiarati</strong>. Alcuni annunci indicano la superficie commerciale, altri la calpestabile, altri non lo dicono. Se un prezzo al metro quadro ti sembra strano, il motivo è spesso questo.</li>
  <li><strong>Escludi i casi estremi</strong>: la casa ristrutturata con terrazzo panoramico e quella da rifare completamente non ti dicono molto su una casa normale.</li>
  <li><strong>Raccogline almeno cinque o sei</strong>, così una singola stranezza non sposta troppo la media.</li>
</ul>
<p>I prezzi delle vendite effettivamente concluse non si trovano annuncio per annuncio sui portali. Un agente che lavora nella tua zona di solito li conosce, ed è uno dei motivi per cui una sua valutazione può essere più precisa della tua.</p>`,
    },
    {
      id: 'correzioni',
      title: 'Passo 4: le correzioni per piano, stato, extra e classe energetica',
      html: `<p>Due case di 80 m² nella stessa via possono valere cifre molto diverse. Per questo, partendo dal prezzo al metro quadro della zona, si applicano delle <strong>correzioni in percentuale</strong>: in più per quello che rende la casa migliore della media, in meno per quello che la rende peggiore.</p>
<p>Le correzioni non sono fissate da nessuna regola, ogni valutatore usa le sue. Per darti un riferimento concreto, ecco alcune di quelle che usa il calcolatore gratuito di Agente Immo, sommate tra loro e limitate in ogni caso tra -35% e +35%:</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Caratteristica</th><th ${TH}>Correzione usata nel calcolatore</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Piano terra</td><td ${TD}>-8%</td></tr>
    <tr><td ${TD}>Piano rialzato</td><td ${TD}>-5%</td></tr>
    <tr><td ${TD}>Piano alto senza ascensore</td><td ${TD}>-8%</td></tr>
    <tr><td ${TD}>Ultimo piano con ascensore / senza ascensore</td><td ${TD}>+3% / -10%</td></tr>
    <tr><td ${TD}>Attico</td><td ${TD}>+8%</td></tr>
    <tr><td ${TD}>Da ristrutturare</td><td ${TD}>-15%</td></tr>
    <tr><td ${TD}>Ristrutturata da poco / nuova</td><td ${TD}>+8% / +15%</td></tr>
    <tr><td ${TD}>Box / posto auto</td><td ${TD}>+5% / +2%</td></tr>
    <tr><td ${TD}>Terrazzo / balcone</td><td ${TD}>+4% / +2%</td></tr>
    <tr><td ${TD}>Giardino privato</td><td ${TD}>+5%</td></tr>
    <tr><td ${TD}>Classe energetica A o B / E, F o G</td><td ${TD}>+5% / -4%</td></tr>
    <tr><td ${TD}>Sotto i 50 m² / appartamento sopra i 150 m²</td><td ${TD}>+5% / -5%</td></tr>
  </tbody>
</table></div>
<p>La <strong>classe energetica</strong> è quella indicata nell'<strong>APE</strong>, l'Attestato di Prestazione Energetica: un documento redatto da un tecnico abilitato che serve comunque per vendere, perché va allegato all'atto. Se non ce l'hai, ti conviene farlo prima di mettere in vendita: la classe va indicata anche negli annunci.</p>
<p>Un consiglio: sii onesto con te stesso. È naturale pensare che la propria casa valga più della media. Ma se la cucina ha vent'anni e il bagno è da rifare, l'acquirente lo vedrà e farà i suoi conti.</p>`,
    },
    {
      id: 'esempio-calcolo',
      title: 'Esempio di calcolo completo: come valutare una casa da soli',
      html: `<p>Mettiamo insieme i passi con un esempio. I numeri sono inventati ma plausibili, servono solo a mostrarti il metodo.</p>
<p>Ad esempio, la tua casa è un appartamento al terzo piano con ascensore, in un palazzo di sei piani, in stato normale. Ha 85 m² interni con i muri, un balcone di 8 m² e una cantina di 6 m². Classe energetica F. Non ha box.</p>
<p><strong>1. Superficie commerciale.</strong> Usando coefficienti di uso comune (balcone al 30%, cantina al 25%): 85 + 2,4 + 1,5 = circa <strong>89 m²</strong>.</p>
<p><strong>2. Quotazioni OMI.</strong> Supponiamo che la zona OMI indichi, per abitazioni civili in stato normale, un minimo di 2.000 €/m² e un massimo di 2.600 €/m². Il valore centrale è 2.300 €/m².</p>
<p><strong>3. Correzioni.</strong> Il terzo piano con ascensore è un piano "normale", nessuna correzione. Il balcone vale +2%, la classe F -4%. Totale: -2%.</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Voce</th><th ${TH}>Minimo</th><th ${TH}>Centrale</th><th ${TH}>Massimo</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Prezzo OMI al m²</td><td ${TD}>2.000 €</td><td ${TD}>2.300 €</td><td ${TD}>2.600 €</td></tr>
    <tr><td ${TD}>Correzione -2%</td><td ${TD}>1.960 €</td><td ${TD}>2.254 €</td><td ${TD}>2.548 €</td></tr>
    <tr><td ${TD}>× 89 m² commerciali</td><td ${TD}>174.440 €</td><td ${TD}>200.606 €</td><td ${TD}>226.772 €</td></tr>
    <tr><td ${TD}><strong>Valore arrotondato</strong></td><td ${TD}><strong>circa 175.000 €</strong></td><td ${TD}><strong>circa 200.000 €</strong></td><td ${TD}><strong>circa 227.000 €</strong></td></tr>
  </tbody>
</table></div>
<p><strong>4. Controllo con gli annunci.</strong> Ora guardi i portali. Se trovi appartamenti simili nella tua via proposti tra 2.400 e 2.700 €/m², ricorda che sono prezzi richiesti: dopo la trattativa il prezzo finale sarà più basso. Il tuo intervallo è coerente. Se invece gli annunci simili stanno tutti sopra i 3.000 €/m², qualcosa non torna: forse la zona OMI è ampia e comprende vie diverse dalla tua, oppure stai confrontando case diverse. In questi casi vale la pena chiedere un parere a chi conosce la zona.</p>
<p>Alla fine hai un <strong>intervallo realistico</strong>, non un numero magico. Il prezzo da mettere nell'annuncio si sceglie dentro o poco sopra questo intervallo, tenendo conto di quanto in fretta vuoi vendere.</p>`,
    },
    {
      id: 'online-gratis',
      title: 'Come valutare una casa online e gratis',
      html: `<p>Se non hai voglia di fare tutti i conti a mano, puoi usare un calcolatore online. Quello di <a href="/it/quanto-vale-la-mia-casa">Quanto vale la mia casa</a> è gratis e non serve creare un account. Funziona così:</p>
<ol>
  <li>scrivi l'indirizzo della casa;</li>
  <li>rispondi a poche domande: tipo di casa, metri quadri, locali, bagni, piano, ascensore, stato, finiture, extra come box, balcone, terrazzo, giardino o cantina, classe energetica;</li>
  <li>il calcolo parte dalle quotazioni OMI della zona in cui cade l'indirizzo e applica le correzioni che hai visto sopra;</li>
  <li>ricevi per email, di solito entro un minuto, il valore minimo, massimo e centrale, con i calcoli spiegati.</li>
</ol>
<p>Un agente della zona ti contatta solo se spunti l'apposita casella: altrimenti ricevi solo la stima. Ricorda però che si tratta di una <strong>stima indicativa</strong>, non di una perizia: nessun calcolatore vede la luce che entra dalle finestre, la vista o lo stato reale del bagno.</p>`,
    },
    {
      id: 'agente-o-perito',
      title: 'Quando chiedere una valutazione a un agente o una perizia a un tecnico',
      html: `<p>La stima fatta da te o online è un ottimo punto di partenza. In alcuni casi però conviene andare oltre.</p>
<p><strong>La valutazione di un agente immobiliare</strong> è utile quando hai deciso di vendere davvero. Un agente che lavora nella tua zona vede la casa dal vivo, conosce le vendite concluse di recente e sa quanto tempo restano sul mercato le case simili. Spesso la valutazione è gratuita, perché l'agente spera di ricevere l'incarico. Chiedine più d'una e diffida di chi ti propone un prezzo molto più alto degli altri: a volte è un modo per ottenere l'incarico, poi il prezzo viene abbassato.</p>
<p><strong>La perizia di un tecnico</strong> (geometra, architetto, ingegnere o perito iscritto all'albo) è una valutazione scritta e motivata, a pagamento. Serve quando il valore deve reggere davanti ad altri: una divisione tra eredi, una separazione, una causa, una richiesta del giudice. La banca, invece, fa fare la sua perizia quando l'acquirente chiede un mutuo.</p>
<p>Un tecnico è utile anche per controllare la <strong>conformità urbanistica e catastale</strong>, cioè che la casa reale corrisponda ai progetti approvati in Comune e alla planimetria catastale. Se ci sono differenze, vanno sistemate prima del rogito, l'atto di vendita firmato dal notaio. Trovi l'elenco completo nella guida ai <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>.</p>`,
    },
    {
      id: 'errori',
      title: 'Gli errori più comuni quando valuti la tua casa',
      html: `<ul>
  <li><strong>Partire da quanto hai pagato</strong> o da quanto hai speso nei lavori. All'acquirente interessa la casa di oggi, non la tua storia.</li>
  <li><strong>Usare i metri sbagliati</strong>: calpestabile al posto della commerciale, o viceversa.</li>
  <li><strong>Prendere l'annuncio più caro come riferimento</strong>. Spesso è proprio quello che non si vende.</li>
  <li><strong>Sopravvalutare gli extra</strong>. Un balcone o una cantina aggiungono valore, ma poco rispetto alla casa.</li>
  <li><strong>Dimenticare i difetti</strong>: umidità, impianti vecchi, spese condominiali alte, lavori straordinari già deliberati.</li>
  <li><strong>Partire troppo alti "tanto poi si tratta"</strong>. Una casa troppo cara riceve poche visite e rischia di dover essere ribassata più avanti.</li>
</ul>
<p>Se stai ancora decidendo se vendere, leggi anche <a href="/it/quando-conviene-vendere-casa">quando conviene vendere casa</a>. E quando hai un numero in mano, puoi sempre confrontarlo con una <a href="/it/quanto-vale-la-mia-casa">stima gratuita online</a>.</p>`,
    },
  ],
  faq: [
    [`Come si valuta una casa da soli?`, `Calcoli la superficie commerciale, cerchi le quotazioni OMI della zona sul sito dell'Agenzia delle Entrate, moltiplichi i metri quadri per il prezzo al metro quadro e correggi per piano, stato, extra e classe energetica. Poi confronti il risultato con gli annunci di case simili, ricordando che sono prezzi richiesti e non di vendita.`],
    [`Come valutare una casa online gratis?`, `Puoi usare un calcolatore gratuito come Quanto vale la mia casa su agenteimmo.me: inserisci l'indirizzo e le caratteristiche principali e ricevi per email una stima con minimo, massimo e valore centrale, di solito entro un minuto. È una stima indicativa, non una perizia.`],
    [`L'Agenzia delle Entrate dice quanto vale la mia casa?`, `No, non per la singola casa. Pubblica le quotazioni OMI, cioè un intervallo di prezzi al metro quadro per zona e tipo di abitazione, aggiornato ogni semestre. È un riferimento utile da cui partire, che poi va corretto per le caratteristiche della tua casa.`],
    [`Il valore catastale è il valore della casa?`, `No. Il valore catastale si usa per calcolare alcune imposte e di solito è molto diverso dal prezzo di mercato. Per sapere quanto potresti vendere la casa devi guardare il mercato, non la rendita catastale.`],
    [`Quanto è affidabile una valutazione online?`, `Dà un ordine di grandezza corretto se i dati inseriti sono giusti, ma non vede la casa: luce, vista, rumore, stato reale di bagni e impianti possono spostare il prezzo. Usala come primo riferimento e, se decidi di vendere, falla controllare da chi conosce la zona.`],
    [`Quando serve una perizia giurata?`, `Quando il valore deve avere valore ufficiale, ad esempio in una divisione ereditaria, una separazione o un procedimento davanti al giudice. Per decidere il prezzo di vendita di solito basta una buona valutazione di mercato. Per i casi specifici chiedi al tuo notaio o a un tecnico.`],
  ],
};

export const quotazioniOmi: Guide = {
  slug: 'quotazioni-omi',
  label: 'Quotazioni OMI',
  title: 'Quotazioni OMI: cosa sono e come leggerle per la tua casa',
  description: `Quotazioni OMI dell'Agenzia delle Entrate: cosa sono, come consultarle gratis con la mappa GEOPOI e come usarle per stimare la tua casa, con un esempio.`,
  h1: 'Quotazioni OMI: cosa sono, come consultarle e come usarle per stimare casa',
  intro: `Le quotazioni OMI sono i valori minimi e massimi al metro quadro che l'Agenzia delle Entrate pubblica ogni semestre per ogni zona di ogni comune, divisi per tipo di immobile. Si consultano gratis sul sito dell'Agenzia, con una mappa. Non sono il prezzo della tua casa, ma sono il punto di partenza più solido per stimarlo.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'cosa-sono',
      title: 'Cosa sono le quotazioni OMI dell\'Agenzia delle Entrate',
      html: `<p><strong>OMI</strong> sta per <strong>Osservatorio del Mercato Immobiliare</strong>, un servizio dell'Agenzia delle Entrate. Il suo compito è raccogliere ed elaborare informazioni sul mercato delle case e degli altri immobili, e renderle pubbliche.</p>
<p>Le <strong>quotazioni OMI</strong> sono il risultato più conosciuto di questo lavoro. Per ogni comune italiano, diviso in zone, l'OMI pubblica:</p>
<ul>
  <li>un <strong>valore minimo e un valore massimo di compravendita</strong>, in euro al metro quadro;</li>
  <li>un <strong>valore minimo e un valore massimo di locazione</strong>, in euro al metro quadro al mese;</li>
  <li>per ogni <strong>tipologia</strong> di immobile presente nella zona (abitazioni, box, negozi, uffici e altri);</li>
  <li>per lo <strong>stato conservativo</strong> più diffuso in quella zona.</li>
</ul>
<p>I valori vengono aggiornati <strong>ogni semestre</strong>. Nel momento in cui scriviamo, l'ultimo semestre che usiamo nei nostri dati è il secondo semestre 2025.</p>
<p>Per un proprietario che pensa di vendere, le quotazioni OMI hanno due grandi pregi: sono <strong>gratuite</strong> e sono <strong>indipendenti</strong>, cioè non dipendono da chi vuole vendere o comprare. Per questo sono la base di molti metodi di stima, compreso il calcolatore per sapere <a href="/it/quanto-vale-la-mia-casa">quanto vale la tua casa</a>.</p>`,
    },
    {
      id: 'zone-fasce',
      title: 'Zone OMI e fasce: centrale, semicentrale, periferica',
      html: `<p>Ogni comune è diviso in <strong>zone OMI</strong>: aree in cui le case hanno, in media, caratteristiche e prezzi simili. Un piccolo comune può avere poche zone, una grande città ne ha decine.</p>
<p>Le zone sono raggruppate in <strong>fasce</strong>, indicate con una lettera:</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Fascia</th><th ${TH}>Significato</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>B</strong></td><td ${TD}>Centrale</td></tr>
    <tr><td ${TD}><strong>C</strong></td><td ${TD}>Semicentrale</td></tr>
    <tr><td ${TD}><strong>D</strong></td><td ${TD}>Periferica</td></tr>
    <tr><td ${TD}><strong>E</strong></td><td ${TD}>Suburbana</td></tr>
    <tr><td ${TD}><strong>R</strong></td><td ${TD}>Extraurbana o rurale</td></tr>
  </tbody>
</table></div>
<p>Ogni zona ha poi un codice (ad esempio B1, C3, D12) e un nome che di solito richiama le vie o i quartieri che comprende. Quando cerchi la tua casa, la cosa più importante è <strong>trovare la zona giusta</strong>: case a poche centinaia di metri di distanza possono cadere in zone diverse, con valori diversi.</p>
<p>Ricorda che una zona è un'area ampia. Dentro la stessa zona ci possono essere vie più richieste e vie meno richieste: la quotazione OMI le mette insieme in un unico intervallo.</p>`,
    },
    {
      id: 'tipologie-stato',
      title: 'Tipologie e stato conservativo: quale riga leggere',
      html: `<p>Dentro ogni zona, l'OMI pubblica una riga per ogni <strong>tipologia</strong> di immobile. Per le case le più comuni sono:</p>
<ul>
  <li><strong>Abitazioni civili</strong>: il normale appartamento in condominio, con finiture nella media. È la riga che interessa alla maggior parte dei proprietari.</li>
  <li><strong>Abitazioni di tipo economico</strong>: case più modeste per costruzione e finiture, spesso in edilizia popolare.</li>
  <li><strong>Abitazioni signorili</strong>: immobili di pregio per palazzo, finiture e posizione.</li>
  <li><strong>Ville e villini</strong>: case indipendenti o semi indipendenti, con giardino.</li>
  <li><strong>Box e posti auto</strong>: quotati a parte.</li>
</ul>
<p>Non tutte le tipologie sono presenti in ogni zona: se nella tua zona non ci sono ville, quella riga semplicemente non c'è.</p>
<p>Accanto alla tipologia trovi lo <strong>stato conservativo</strong>, cioè le condizioni dell'immobile: <strong>normale</strong>, <strong>ottimo</strong> o <strong>scadente</strong>. Di solito l'OMI indica lo stato più diffuso nella zona. Se la tua casa è in condizioni molto migliori o molto peggiori della media, dovrai correggere il valore di conseguenza.</p>`,
    },
    {
      id: 'come-leggerle',
      title: 'Come leggere le quotazioni OMI: minimo, massimo e superficie lorda',
      html: `<p>Una riga delle quotazioni OMI, semplificata, si presenta più o meno così. I numeri sono un esempio:</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Tipologia</th><th ${TH}>Stato</th><th ${TH}>Compravendita min (€/m²)</th><th ${TH}>Compravendita max (€/m²)</th><th ${TH}>Locazione min (€/m² mese)</th><th ${TH}>Locazione max (€/m² mese)</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Abitazioni civili</td><td ${TD}>Normale</td><td ${TD}>1.900</td><td ${TD}>2.500</td><td ${TD}>7,5</td><td ${TD}>9,8</td></tr>
  </tbody>
</table></div>
<p>Come leggerla:</p>
<ul>
  <li><strong>Minimo e massimo</strong> delimitano l'intervallo in cui si collocano, secondo l'OMI, i valori di un'abitazione civile in stato normale in quella zona. Una casa nella media sta verso il centro, una casa migliore verso il massimo, una peggiore verso il minimo.</li>
  <li><strong>I valori sono al metro quadro di superficie lorda</strong>, cioè comprensiva dei muri. Per questo vanno moltiplicati per la superficie commerciale della casa, non per quella calpestabile. Se non sai come calcolarla, leggi la guida alla <a href="/it/superficie-commerciale">superficie commerciale</a>.</li>
  <li><strong>La locazione è al mese</strong>: nell'esempio, un appartamento di 80 m² avrebbe un affitto di riferimento tra circa 600 e 780 € al mese.</li>
</ul>`,
    },
    {
      id: 'consultarle-gratis',
      title: 'Come consultare le quotazioni OMI gratis (mappa GEOPOI)',
      html: `<p>Le quotazioni OMI si consultano <strong>gratis</strong> sul sito dell'Agenzia delle Entrate. I passaggi, in linea generale, sono questi:</p>
<ol>
  <li>Vai sul sito dell'Agenzia delle Entrate e cerca il servizio <strong>"Quotazioni immobiliari"</strong>, nell'area dedicata all'Osservatorio del Mercato Immobiliare.</li>
  <li>Scegli la consultazione su mappa, chiamata <strong>GEOPOI</strong>: è una cartina interattiva con le zone OMI disegnate sopra.</li>
  <li>Cerca il tuo <strong>comune</strong> e poi il tuo <strong>indirizzo</strong>, oppure muovi la mappa fino alla tua via.</li>
  <li>Clicca sulla zona in cui cade la casa: vedrai il codice e il nome della zona.</li>
  <li>Scegli il <strong>semestre</strong> (di solito il più recente) e apri le quotazioni della zona.</li>
  <li>Leggi la riga della <strong>tipologia</strong> giusta e annota minimo e massimo di compravendita.</li>
</ol>
<p>L'aspetto delle pagine può cambiare nel tempo, ma il servizio resta quello: comune, zona, semestre, tipologia. Se la tua casa è vicina al confine tra due zone, guarda entrambe: ti aiuta a capire quanto può variare il valore.</p>
<p>Se non vuoi cercare la zona a mano, il calcolatore <a href="/it/quanto-vale-la-mia-casa">Quanto vale la mia casa</a> lo fa per te: partendo dall'indirizzo trova la zona OMI in cui cade e ne usa minimo e massimo.</p>`,
    },
    {
      id: 'stimare-casa',
      title: 'Come usare le quotazioni OMI per stimare la tua casa: esempio',
      html: `<p>Vediamo un esempio con numeri inventati ma plausibili. Ad esempio, hai un appartamento di <strong>75 m² commerciali</strong> al secondo piano con ascensore, in stato normale, con un balcone e un box. La zona OMI, per abitazioni civili in stato normale, indica <strong>1.900-2.500 €/m²</strong>.</p>
<p><strong>Passo 1: il valore di partenza.</strong> Moltiplichi i metri quadri per minimo e massimo:</p>
<ul>
  <li>75 × 1.900 = 142.500 €</li>
  <li>75 × 2.500 = 187.500 €</li>
  <li>valore centrale: 75 × 2.200 = 165.000 €</li>
</ul>
<p><strong>Passo 2: le correzioni.</strong> Ora tieni conto di quello che distingue la tua casa dalla media. Ad esempio, il calcolatore di Agente Immo usa +5% per il box e +2% per il balcone; il secondo piano con ascensore non ha correzioni. Totale: +7%.</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Minimo</th><th ${TH}>Centrale</th><th ${TH}>Massimo</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Valore OMI × 75 m²</td><td ${TD}>142.500 €</td><td ${TD}>165.000 €</td><td ${TD}>187.500 €</td></tr>
    <tr><td ${TD}>Con correzione +7%</td><td ${TD}>152.475 €</td><td ${TD}>176.550 €</td><td ${TD}>200.625 €</td></tr>
    <tr><td ${TD}><strong>Arrotondato</strong></td><td ${TD}><strong>circa 152.000 €</strong></td><td ${TD}><strong>circa 177.000 €</strong></td><td ${TD}><strong>circa 200.000 €</strong></td></tr>
  </tbody>
</table></div>
<p><strong>Passo 3: il confronto.</strong> Infine confronti questo intervallo con gli annunci di case simili nella tua zona. Il metodo completo, con tutti i passaggi, è nella guida su <a href="/it/come-valutare-una-casa">come valutare una casa</a>.</p>`,
    },
    {
      id: 'limiti',
      title: 'I limiti delle quotazioni OMI',
      html: `<p>Le quotazioni OMI sono utili, ma vanno usate sapendo cosa <strong>non</strong> dicono.</p>
<ul>
  <li><strong>Non sono il prezzo della singola casa.</strong> Sono un intervallo per un immobile tipo in una zona. La tua casa può stare dentro l'intervallo, ma in casi particolari anche sopra o sotto.</li>
  <li><strong>Le zone sono ampie.</strong> Mettono insieme vie e palazzi diversi. Un attico con vista e un piano terra su una strada trafficata della stessa zona hanno la stessa quotazione di partenza.</li>
  <li><strong>Si aggiornano ogni semestre.</strong> Quando le consulti, si riferiscono a un periodo già passato. Se il mercato della tua zona si muove in fretta, i valori possono essere un po' indietro.</li>
  <li><strong>Non conoscono le caratteristiche della tua casa</strong>: piano, luce, vista, stato di bagni e impianti, box, terrazzo, classe energetica. Per questo servono le correzioni.</li>
  <li><strong>In alcune zone ci sono poche compravendite</strong>, quindi i valori possono essere meno rappresentativi.</li>
</ul>
<p>In sintesi: usa l'OMI come <strong>punto di partenza</strong>, non come risposta finale.</p>`,
    },
    {
      id: 'omi-vs-annunci',
      title: 'Differenza tra quotazioni OMI e prezzi degli annunci',
      html: `<p>Spesso chi confronta l'OMI con i portali resta sorpreso: i prezzi degli annunci sembrano più alti. Ci sono diversi motivi.</p>
<ul>
  <li><strong>Gli annunci sono prezzi richiesti</strong>, non prezzi pagati. Dopo la trattativa il prezzo finale di solito scende.</li>
  <li><strong>Gli annunci troppo cari restano online più a lungo</strong>, quindi sono sovrarappresentati: li vedi di più proprio perché non si vendono.</li>
  <li><strong>I metri quadri degli annunci non sono sempre gli stessi</strong>: alcuni indicano la commerciale, altri la calpestabile, e il prezzo al metro quadro cambia di conseguenza.</li>
  <li><strong>L'OMI si riferisce al semestre passato</strong>, gli annunci al mercato di oggi.</li>
</ul>
<p>Il modo giusto di usarli è insieme: l'OMI ti dà un riferimento stabile e indipendente, gli annunci ti dicono contro chi ti troverai in concorrenza quando metterai in vendita.</p>`,
    },
    {
      id: 'citta',
      title: 'Quotazioni OMI e prezzi delle case nelle grandi città',
      html: `<p>Nelle grandi città le differenze tra una zona e l'altra possono essere molto forti. Per farti un'idea dei valori quartiere per quartiere puoi partire dalle nostre pagine sui prezzi delle case, costruite sulle quotazioni OMI:</p>
<ul>
  <li><a href="/it/prezzi-case/milano">Prezzi delle case a Milano</a></li>
  <li><a href="/it/prezzi-case/roma">Prezzi delle case a Roma</a></li>
  <li><a href="/it/prezzi-case/torino">Prezzi delle case a Torino</a></li>
  <li><a href="/it/prezzi-case/napoli">Prezzi delle case a Napoli</a></li>
  <li><a href="/it/prezzi-case/bologna">Prezzi delle case a Bologna</a></li>
  <li><a href="/it/prezzi-case/firenze">Prezzi delle case a Firenze</a></li>
</ul>
<p>Trovi l'elenco completo nella pagina dei <a href="/it/prezzi-case">prezzi delle case per città</a>. Per la tua casa specifica, invece, il modo più rapido è una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita a partire dal tuo indirizzo</a>.</p>`,
    },
  ],
  faq: [
    [`Cosa sono le quotazioni OMI?`, `Sono i valori minimi e massimi al metro quadro, per la vendita e per l'affitto, che l'Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate pubblica ogni semestre per ogni zona di ogni comune e per ogni tipo di immobile.`],
    [`Dove si consultano le quotazioni OMI?`, `Sul sito dell'Agenzia delle Entrate, nel servizio Quotazioni immobiliari. Con la mappa GEOPOI trovi la zona in cui si trova la casa e leggi i valori per tipologia. La consultazione è gratuita.`],
    [`Le quotazioni OMI si riferiscono alla superficie lorda o netta?`, `Di solito alla superficie lorda, cioè comprensiva dei muri. Per questo vanno moltiplicate per la superficie commerciale della casa e non per quella calpestabile.`],
    [`Ogni quanto vengono aggiornate le quotazioni OMI?`, `Ogni semestre. Quando le consulti, quindi, si riferiscono a un periodo già trascorso: se il mercato della zona sta cambiando in fretta, tienine conto.`],
    [`Perché i prezzi degli annunci sono più alti delle quotazioni OMI?`, `Perché gli annunci mostrano il prezzo richiesto, prima della trattativa, e perché le case troppo care restano online più a lungo. Inoltre non tutti gli annunci usano la stessa misura dei metri quadri.`],
    [`Che tipologia devo scegliere per il mio appartamento?`, `Per un normale appartamento in condominio di solito si usa abitazioni civili. Per case modeste abitazioni di tipo economico, per immobili di pregio abitazioni signorili, per case indipendenti ville e villini.`],
    [`Le quotazioni OMI bastano per decidere il prezzo di vendita?`, `No. Sono il punto di partenza: vanno corrette per le caratteristiche della casa e confrontate con gli annunci simili. Se stai per vendere, un parere di chi conosce la zona aiuta a scegliere il prezzo giusto.`],
  ],
};

export const superficieCommerciale: Guide = {
  slug: 'superficie-commerciale',
  label: 'Superficie commerciale',
  title: 'Superficie commerciale: come si calcola, con esempio',
  description: `Superficie commerciale di un appartamento: come si calcola con muri, balconi, cantina e giardino, differenza con calpestabile e catastale, con esempio.`,
  h1: 'Superficie commerciale: come si calcola per un appartamento',
  intro: `La superficie commerciale è la misura usata per vendere una casa: comprende i locali interni con i muri, più balconi, terrazzi, cantina e giardino calcolati con una percentuale ridotta. Non esiste una formula unica imposta dalla legge per la compravendita, ma ci sono criteri di riferimento usati da tutti. Qui trovi come applicarli, con un esempio completo.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'cosa-e',
      title: 'Cos\'è la superficie commerciale e a cosa serve',
      html: `<p>Quando leggi "appartamento di 90 m²" in un annuncio, nella maggior parte dei casi quei 90 metri sono la <strong>superficie commerciale</strong>. È la misura che si usa per confrontare case diverse e per calcolare il prezzo al metro quadro.</p>
<p>Serve per una ragione semplice: una casa non è fatta solo di stanze. Ha muri, un balcone, magari una cantina o un giardino. Tutti questi spazi hanno un valore, ma non lo stesso valore di una camera. La superficie commerciale li mette insieme in un unico numero, dando a ciascuno un <strong>peso</strong> diverso.</p>
<p>Ti serve conoscerla per tre motivi:</p>
<ul>
  <li>per <strong>stimare il valore</strong> della tua casa, perché le quotazioni OMI e i prezzi al metro quadro di mercato si riferiscono a superfici lorde;</li>
  <li>per <strong>scrivere l'annuncio</strong> in modo corretto e confrontabile con gli altri;</li>
  <li>per <strong>non farti confondere</strong> quando un acquirente o un agente parlano di metri quadri diversi dai tuoi.</li>
</ul>
<p>Se vuoi sapere subito quanto può valere la tua casa, puoi fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita</a> inserendo i metri quadri che calcolerai con questa guida.</p>`,
    },
    {
      id: 'tre-superfici',
      title: 'Superficie calpestabile, commerciale e catastale: le differenze',
      html: `<p>Per la stessa casa esistono almeno tre misure diverse, ed è normale che non coincidano.</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Superficie</th><th ${TH}>Cosa comprende</th><th ${TH}>Dove la trovi</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Calpestabile</strong> (o netta)</td><td ${TD}>Solo lo spazio interno su cui cammini, senza muri, pilastri e spazi esterni</td><td ${TD}>La misuri tu, stanza per stanza, oppure la ricavi da un rilievo</td></tr>
    <tr><td ${TD}><strong>Commerciale</strong></td><td ${TD}>Locali interni con i muri, più balconi, terrazzi, cantina, soffitta e giardino con coefficienti ridotti</td><td ${TD}>Negli annunci e nelle valutazioni; la calcoli con i criteri di questa guida</td></tr>
    <tr><td ${TD}><strong>Catastale</strong></td><td ${TD}>Calcolata con i criteri fissati per il Catasto, simili a quelli della commerciale</td><td ${TD}>Nella visura catastale, nelle visure più recenti</td></tr>
  </tbody>
</table></div>
<p>La <strong>calpestabile</strong> è sempre la più piccola, perché non conta i muri. La <strong>commerciale</strong> e la <strong>catastale</strong> sono di solito vicine tra loro, ma non sempre identiche, perché seguono criteri non del tutto uguali e arrotondamenti diversi.</p>
<p>Il punto importante è non mescolarle: se dividi il prezzo di una casa per la calpestabile e lo confronti con prezzi calcolati sulla commerciale, ti sembrerà di avere una casa più cara (o più economica) di quanto sia.</p>`,
    },
    {
      id: 'riferimenti',
      title: 'Come si calcola la superficie commerciale: i criteri di riferimento',
      html: `<p>Per la compravendita tra privati <strong>non esiste una legge che imponga una formula unica</strong> per la superficie commerciale. Nella pratica si usano alcuni riferimenti:</p>
<ul>
  <li><strong>Il DPR 138/1998, allegato C</strong>: stabilisce i criteri per calcolare la <strong>superficie catastale</strong>. Molti tecnici e operatori lo usano come base anche per la superficie commerciale, perché è un criterio pubblico e uguale per tutti.</li>
  <li><strong>La norma UNI 10750</strong> e le <strong>linee guida di mercato</strong> usate da agenti, periti e banche: sono riferimenti tecnici diffusi nella prassi, non obblighi di legge.</li>
</ul>
<p>Il risultato è che i <strong>coefficienti</strong>, cioè le percentuali con cui si contano balconi, cantine e giardini, possono cambiare un po' da un professionista all'altro e da una zona all'altra. Quelli che trovi qui sotto sono <strong>valori indicativi di uso comune</strong>, utili per farti un'idea. Per una misura precisa, ad esempio in una perizia, rivolgiti a un tecnico.</p>`,
    },
    {
      id: 'coefficienti',
      title: 'Muri, balconi, cantina e giardino: i coefficienti indicativi',
      html: `<p>Ecco come si contano, secondo la prassi più diffusa, le diverse parti di un appartamento. Ricorda: sono valori indicativi e variabili, non percentuali fissate dalla legge.</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Parte della casa</th><th ${TH}>Come si conta di solito (indicativo)</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Locali interni (stanze, cucina, bagni, corridoi)</td><td ${TD}>100%</td></tr>
    <tr><td ${TD}>Muri interni e muri perimetrali esterni</td><td ${TD}>100%, fino a uno spessore di 50 cm</td></tr>
    <tr><td ${TD}>Muri in comune con altre unità o con le parti comuni</td><td ${TD}>50%</td></tr>
    <tr><td ${TD}>Balconi e terrazzi comunicanti con la casa</td><td ${TD}>Spesso tra il 25% e il 35% fino a una certa superficie, meno per la parte eccedente</td></tr>
    <tr><td ${TD}>Cantine e soffitte non comunicanti</td><td ${TD}>Spesso tra il 20% e il 25%</td></tr>
    <tr><td ${TD}>Giardino di un appartamento</td><td ${TD}>Spesso 10% fino a 25 m², poi 2% per la parte che eccede</td></tr>
    <tr><td ${TD}>Box auto</td><td ${TD}>Spesso valutato a parte, con un prezzo proprio, invece che in metri quadri</td></tr>
  </tbody>
</table></div>
<p>Qualche spiegazione in più:</p>
<ul>
  <li><strong>Muri</strong>: i muri interni e quelli esterni della casa sono tuoi, quindi si contano per intero. Il muro che separa il tuo appartamento da quello del vicino o dal vano scale è in comune, quindi se ne conta metà.</li>
  <li><strong>Balconi e terrazzi</strong>: "comunicanti" significa che ci accedi direttamente da casa. Un terrazzo molto grande non vale come una stanza in più: per questo oltre una certa misura la percentuale si abbassa.</li>
  <li><strong>Cantina e soffitta</strong>: se non sono collegate direttamente alla casa valgono meno. Se una soffitta è collegata e abitabile, il discorso cambia, ma attenzione: deve risultare regolare dal punto di vista urbanistico.</li>
  <li><strong>Giardino</strong>: per un appartamento al piano terra il giardino privato è un plus, ma conta poco in metri quadri. Per le case indipendenti e le ville i criteri possono essere diversi.</li>
</ul>`,
    },
    {
      id: 'esempio',
      title: 'Esempio di calcolo della superficie commerciale di un appartamento',
      html: `<p>Ecco un esempio completo, con misure inventate ma plausibili. Ad esempio, il tuo appartamento ha:</p>
<ul>
  <li>78 m² di superficie interna calpestabile;</li>
  <li>7 m² di muri interni e perimetrali;</li>
  <li>4 m² di muri in comune con il vicino e con il vano scale;</li>
  <li>un balcone di 10 m²;</li>
  <li>una cantina non comunicante di 8 m².</li>
</ul>
<p>Usiamo coefficienti indicativi di uso comune: balcone al 30%, cantina al 25%.</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}>Voce</th><th ${TH}>Misura</th><th ${TH}>Coefficiente</th><th ${TH}>Superficie commerciale</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Superficie interna calpestabile</td><td ${TD}>78 m²</td><td ${TD}>100%</td><td ${TD}>78,0 m²</td></tr>
    <tr><td ${TD}>Muri interni e perimetrali</td><td ${TD}>7 m²</td><td ${TD}>100%</td><td ${TD}>7,0 m²</td></tr>
    <tr><td ${TD}>Muri in comune</td><td ${TD}>4 m²</td><td ${TD}>50%</td><td ${TD}>2,0 m²</td></tr>
    <tr><td ${TD}>Balcone</td><td ${TD}>10 m²</td><td ${TD}>30%</td><td ${TD}>3,0 m²</td></tr>
    <tr><td ${TD}>Cantina non comunicante</td><td ${TD}>8 m²</td><td ${TD}>25%</td><td ${TD}>2,0 m²</td></tr>
    <tr><td ${TD}><strong>Totale</strong></td><td ${TD}></td><td ${TD}></td><td ${TD}><strong>92,0 m²</strong></td></tr>
  </tbody>
</table></div>
<p>Come vedi, una casa che "a occhio" sembra di 78 metri ha una superficie commerciale di circa 92 m². Nessuno ti sta imbrogliando: sono due misure diverse della stessa casa. L'importante è sapere sempre di quale si sta parlando.</p>
<p>Se non sai quanto sono spessi i muri, una strada pratica è misurare l'ingombro esterno della casa sulla planimetria in scala, oppure chiedere a un geometra. Anche la <strong>superficie catastale</strong> indicata nella visura può aiutarti come controllo: se è molto diversa dal tuo risultato, ricontrolla i conti.</p>`,
    },
    {
      id: 'prezzo-metro-quadro',
      title: 'Prezzo al metro quadro: come si calcola il valore della casa',
      html: `<p>Una volta che hai la superficie commerciale, il calcolo del valore di partenza è semplice:</p>
<p><strong>valore = prezzo al metro quadro della zona × superficie commerciale</strong></p>
<p>Continuando l'esempio: se il prezzo al metro quadro di riferimento nella tua zona, ad esempio preso dalle quotazioni OMI, è tra 2.100 e 2.700 €/m², il valore di partenza della casa è:</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Minimo</th><th ${TH}>Centrale</th><th ${TH}>Massimo</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Prezzo al m²</td><td ${TD}>2.100 €</td><td ${TD}>2.400 €</td><td ${TD}>2.700 €</td></tr>
    <tr><td ${TD}>× 92 m² commerciali</td><td ${TD}>193.200 €</td><td ${TD}>220.800 €</td><td ${TD}>248.400 €</td></tr>
  </tbody>
</table></div>
<p>Al contrario, se vuoi sapere il <strong>prezzo al metro quadro</strong> di un annuncio, dividi il prezzo per la superficie: 220.000 € diviso 92 m² fa circa 2.391 €/m². Controlla sempre che i metri dell'annuncio siano commerciali, altrimenti il confronto non regge.</p>
<p>Questo è solo il punto di partenza: poi vanno considerati piano, ascensore, stato, box, classe energetica e gli altri elementi che rendono la casa diversa dalla media. Se non vuoi fare i conti a mano, il calcolatore per sapere <a href="/it/quanto-vale-la-mia-casa">quanto vale la tua casa</a> applica queste correzioni partendo dal tuo indirizzo. Il metodo completo è nella guida su <a href="/it/come-valutare-una-casa">come valutare una casa</a>, mentre per capire da dove vengono i prezzi al metro quadro di zona leggi la guida alle <a href="/it/quotazioni-omi">quotazioni OMI</a>.</p>
<p>Per farti un'idea dei prezzi al metro quadro nella tua città, zona per zona, guarda le quotazioni OMI raccolte per <a href="/it/prezzi-case/roma">Roma</a>, <a href="/it/prezzi-case/milano">Milano</a>, <a href="/it/prezzi-case/bologna">Bologna</a> e <a href="/it/prezzi-case/firenze">Firenze</a>, o cerca la tua nell'<a href="/it/prezzi-case">elenco dei prezzi delle case per città</a>.</p>`,
    },
    {
      id: 'errori',
      title: 'Errori da evitare quando calcoli la superficie commerciale',
      html: `<ul>
  <li><strong>Contare balconi e cantina al 100%.</strong> È l'errore più comune: gonfia i metri e porta a un prezzo che gli acquirenti non accetteranno.</li>
  <li><strong>Usare la calpestabile come se fosse la commerciale</strong>, o il contrario, quando confronti prezzi al metro quadro.</li>
  <li><strong>Contare spazi non regolari</strong>: una veranda chiusa senza permessi, un sottotetto reso abitabile senza titolo edilizio. Prima di metterli nei metri, verifica con un tecnico che siano in regola: la <strong>conformità urbanistica</strong>, cioè la corrispondenza tra la casa e i progetti approvati in Comune, conta anche al momento del rogito.</li>
  <li><strong>Fidarsi solo dei metri "di famiglia"</strong>. Il numero che si è sempre detto in casa spesso non ha una fonte precisa. Parti dalla planimetria e dalla visura.</li>
  <li><strong>Dimenticare che i coefficienti variano.</strong> Se l'agente o il perito usano percentuali un po' diverse dalle tue, non è per forza un errore: chiedi quali criteri hanno usato.</li>
</ul>
<p>Prima di mettere in vendita, controlla di avere in ordine anche planimetria, visura e gli altri <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>. E quando hai i tuoi metri quadri, inseriscili nel calcolatore per una <a href="/it/quanto-vale-la-mia-casa">stima gratuita della tua casa</a>.</p>`,
    },
  ],
  faq: [
    [`Come si calcola la superficie commerciale di un appartamento?`, `Si sommano la superficie interna, i muri interni e perimetrali per intero e i muri in comune a metà, poi si aggiungono balconi, terrazzi, cantina, soffitta e giardino con percentuali ridotte. Le percentuali non sono fissate dalla legge: si usano coefficienti di prassi, che possono variare.`],
    [`Che differenza c'è tra superficie calpestabile e commerciale?`, `La calpestabile è solo lo spazio interno su cui cammini, senza muri. La commerciale comprende anche i muri e, in parte, le superfici accessorie come balconi e cantina. Per questo la commerciale è sempre più grande.`],
    [`La superficie catastale è uguale a quella commerciale?`, `Sono simili ma non sempre identiche. La catastale segue i criteri del DPR 138/1998, la commerciale segue la prassi di mercato, che spesso si ispira agli stessi criteri. La catastale la trovi nella visura catastale.`],
    [`Come si conta il balcone nella superficie commerciale?`, `Di solito con una percentuale ridotta: per balconi e terrazzi comunicanti si usano spesso valori tra il 25% e il 35% fino a una certa superficie, meno per la parte eccedente. È prassi, non una regola di legge.`],
    [`La cantina rientra nella superficie commerciale?`, `Sì, ma con un peso basso. Per cantine e soffitte non comunicanti con la casa si usano spesso coefficienti tra il 20% e il 25%. Il box auto invece viene spesso valutato a parte.`],
    [`Come si calcola il prezzo al metro quadro?`, `Dividi il prezzo della casa per la sua superficie commerciale. Per stimare il valore fai il contrario: moltiplichi la superficie commerciale per il prezzo al metro quadro della zona, poi correggi per le caratteristiche della casa.`],
  ],
};

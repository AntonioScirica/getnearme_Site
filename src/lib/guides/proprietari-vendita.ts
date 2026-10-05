import type { Guide } from './types';

// Guide per PROPRIETARI che vendono casa: vendere velocemente, vendere senza agenzia, quando conviene vendere,
// cosa fare prima di vendere. Niente statistiche, tempi medi, leggi o cifre inventate:
// dove non c'è certezza si resta generici e si rimanda a notaio, tecnico, banca o commercialista.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const vendereCasaVelocemente: Guide = {
  slug: 'come-vendere-casa-velocemente',
  label: 'Vendere casa velocemente',
  title: 'Come vendere casa velocemente: piano in 10 passi',
  description: `Come vendere casa velocemente, anche senza agenzia: prezzo giusto, documenti pronti, foto curate e un piano in 10 passi per non restare mesi in attesa.`,
  h1: 'Come vendere casa velocemente, anche senza agenzia',
  intro: `Per vendere casa velocemente servono soprattutto tre cose: un prezzo giusto fin dal primo giorno, i documenti già pronti e una casa presentata bene, in foto e dal vivo. Il resto conta, ma viene dopo. In questa guida trovi cosa fare, in che ordine, e un piano in 10 passi da seguire con o senza agenzia.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'perche-resta-invenduta',
      title: 'Perché una casa resta invenduta (e come evitarlo)',
      html: `<p>Prima di pensare a come accelerare, conviene capire cosa rallenta. Una casa che resta in vendita a lungo di solito ha uno o più di questi problemi:</p>
<ul>
  <li><strong>Prezzo troppo alto</strong> rispetto a case simili nella stessa zona.</li>
  <li><strong>Documenti non in ordine</strong>, che fanno saltare o rimandare la firma quando un acquirente c'è già.</li>
  <li><strong>Foto e annuncio poco curati</strong>, che non fanno venire voglia di visitarla.</li>
  <li><strong>Visite difficili</strong>: orari stretti, casa in disordine, proprietario che non si trova.</li>
  <li><strong>Trattativa lenta</strong>: proposte lasciate senza risposta per giorni.</li>
</ul>
<p>La buona notizia è che quasi tutti questi punti dipendono da te. Non puoi cambiare il mercato della tua zona, ma puoi decidere il prezzo, preparare le carte, sistemare la casa e rispondere in fretta. Chi vuole vendere velocemente lavora su tutti questi fronti insieme, prima ancora di pubblicare l'annuncio.</p>
<p>Se la tua casa è già online da tempo e non arrivano visite, leggi anche <a href="/it/casa-che-non-si-vende">cosa fare se la casa non si vende</a>.</p>`,
    },
    {
      id: 'prezzo-giusto',
      title: 'Il prezzo giusto dall\'inizio: la regola più importante',
      html: `<p>Molti proprietari partono alti "tanto poi si tratta". È comprensibile, ma è il modo più sicuro per allungare i tempi. Ecco perché:</p>
<ul>
  <li><strong>Chi cerca casa confronta.</strong> Sui portali vede la tua casa accanto a quelle simili della zona. Se la tua costa di più senza un motivo evidente, la salta e non ti chiama nemmeno.</li>
  <li><strong>I primi giorni contano.</strong> Quando un annuncio è nuovo, lo notano tutti quelli che stanno già cercando in quella zona. Se il prezzo li scoraggia, quell'occasione passa e non torna.</li>
  <li><strong>Gli abbassamenti si notano.</strong> Una casa che scende di prezzo più volte fa pensare che ci sia qualcosa che non va, e chi compra prova a chiedere ancora meno.</li>
  <li><strong>La banca dell'acquirente fa la sua perizia.</strong> Se chi compra ha bisogno di un mutuo, la banca fa valutare la casa da un perito. Un prezzo molto sopra il valore stimato può complicare il finanziamento.</li>
</ul>
<p>Per partire dal prezzo giusto ti servono due punti di riferimento. Il primo sono le <strong>quotazioni OMI</strong>: l'OMI è l'Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate, che ogni semestre pubblica per ogni zona di ogni comune un valore minimo e massimo al metro quadro. Non è il prezzo della tua casa, ma un intervallo di riferimento (trovi tutto nella guida sulle <a href="/it/quotazioni-omi">quotazioni OMI</a>). Il secondo sono gli annunci di case davvero simili alla tua, nella stessa via o nelle vie vicine.</p>
<p>Un modo semplice per cominciare è fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a>: inserisci l'indirizzo, rispondi a poche domande su metri quadri, piano, stato ed extra, e ricevi per email un valore minimo, massimo e centrale con i calcoli spiegati. È una stima indicativa, non una perizia, ma ti dà una base solida da cui ragionare. Per approfondire il metodo, leggi <a href="/it/come-valutare-una-casa">come valutare una casa</a>.</p>`,
    },
    {
      id: 'documenti-pronti',
      title: 'Documenti pronti prima di pubblicare l\'annuncio',
      html: `<p>Capita spesso: l'acquirente c'è, il prezzo è concordato, e poi passano settimane perché manca un documento o la planimetria non corrisponde alla casa. Per vendere velocemente, le carte vanno preparate <strong>prima</strong> di mettere la casa in vendita.</p>
<p>I documenti principali sono:</p>
<ul>
  <li><strong>Atto di provenienza</strong>: il documento che dimostra come sei diventato proprietario, cioè il rogito d'acquisto (l'atto firmato dal notaio), la dichiarazione di successione o l'atto di donazione.</li>
  <li><strong>Visura e planimetria catastale</strong>: la visura è la scheda del Catasto con i dati della casa; la planimetria catastale è il disegno della casa depositato al Catasto. Devono corrispondere a com'è la casa oggi.</li>
  <li><strong>Titoli edilizi e conformità urbanistica</strong>: i permessi con cui la casa è stata costruita o modificata. "Conformità urbanistica" significa che la casa reale corrisponde a quanto autorizzato dal Comune.</li>
  <li><strong>APE</strong>, l'Attestato di Prestazione Energetica: indica la classe energetica della casa, è obbligatorio per vendere e la classe va scritta nell'annuncio.</li>
  <li><strong>Documenti del condominio</strong>: spese, regolamento, ultime delibere ed eventuali lavori straordinari decisi o in corso.</li>
  <li><strong>Mutuo residuo</strong>, se ce l'hai: chiedi alla banca il conteggio di quanto resta da pagare per chiuderlo.</li>
</ul>
<p>L'elenco completo, con chi rilascia cosa, è nella guida ai <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>. Se qualcosa non torna, ad esempio una parete spostata e mai comunicata al Catasto, chiama subito un tecnico (geometra, architetto o ingegnere): sistemarlo prima costa meno stress che sistemarlo con l'acquirente che aspetta.</p>`,
    },
    {
      id: 'casa-e-foto',
      title: 'Casa preparata e foto buone: la prima visita si fa online',
      html: `<p>Oggi quasi tutti gli acquirenti vedono la tua casa prima in foto, sul telefono. Se le foto non convincono, la visita non arriva. Preparare la casa non significa ristrutturarla: significa farla sembrare ordinata, luminosa e pronta da abitare.</p>
<ul>
  <li><strong>Togli il superfluo</strong>: soprammobili, foto di famiglia, vestiti, scatoloni. Meno oggetti fanno sembrare le stanze più grandi.</li>
  <li><strong>Pulisci a fondo</strong>: vetri, bagni, cucina, fughe. Sono le cose che si notano di più.</li>
  <li><strong>Sistema i piccoli difetti</strong>: una lampadina bruciata, una maniglia rotta, un rubinetto che gocciola, una parete segnata da ritinteggiare.</li>
  <li><strong>Apri tutto</strong>: tende, tapparelle, porte interne. La luce naturale è la migliore alleata.</li>
</ul>
<p>Per le foto: scatta di giorno, con il telefono in orizzontale, tenuto dritto all'altezza del petto, dagli angoli delle stanze. Fotografa ogni ambiente, compresi bagno, balcone ed eventuale cantina o box. Se la casa è vuota o arredata in modo datato, l'arredamento virtuale può aiutare chi guarda a immaginare gli spazi: deve però essere sempre dichiarato, accanto alla foto reale. Trovi tutti i dettagli in <a href="/it/cosa-fare-prima-di-vendere-casa">cosa fare prima di vendere casa</a>.</p>`,
    },
    {
      id: 'annuncio-completo',
      title: 'Un annuncio completo che risponde alle domande',
      html: `<p>Ogni domanda a cui l'annuncio non risponde è una telefonata in più, o un acquirente che passa oltre. Un buon annuncio contiene:</p>
<ul>
  <li><strong>Prezzo</strong> chiaro.</li>
  <li><strong>Metri quadri</strong>: meglio indicare la superficie commerciale, cioè la misura che si usa per i prezzi, che comprende i muri e una parte di balconi, cantine e altri spazi accessori. Se non sai come si calcola, leggi la guida sulla <a href="/it/superficie-commerciale">superficie commerciale</a>.</li>
  <li><strong>Locali, bagni, piano, ascensore</strong>, esposizione, riscaldamento.</li>
  <li><strong>Classe energetica</strong> dall'APE.</li>
  <li><strong>Spese condominiali</strong> indicative al mese o all'anno.</li>
  <li><strong>Extra</strong>: box, posto auto, cantina, balcone, terrazzo, giardino.</li>
  <li><strong>Zona e servizi vicini</strong>: scuole, mezzi, negozi, parchi.</li>
  <li><strong>Planimetria</strong>, anche semplice, per far capire come sono disposte le stanze.</li>
</ul>
<p>Scrivi in modo semplice e onesto. Se la casa va rinfrescata, dillo: chi viene a vederla sa già cosa aspettarsi e non perde tempo, e tu nemmeno.</p>`,
    },
    {
      id: 'visite-e-proposte',
      title: 'Visite e proposte: disponibilità e risposte rapide',
      html: `<p>Una casa difficile da visitare si vende più lentamente. Se vuoi vendere in fretta:</p>
<ul>
  <li><strong>Rendi la casa visitabile spesso</strong>, anche la sera e il sabato, quando chi lavora può muoversi.</li>
  <li><strong>Raggruppa le visite</strong> in fasce orarie: meno disagio per te, e gli acquirenti vedono che la casa interessa ad altri.</li>
  <li><strong>Tieni la casa pronta</strong>: ordinata, arieggiata, con le luci accese.</li>
  <li><strong>Prepara le risposte</strong> alle domande tipiche: spese, lavori fatti, età della caldaia, vicini, tempi per liberare la casa.</li>
</ul>
<p>Quando arriva una <strong>proposta d'acquisto</strong>, cioè l'offerta scritta e firmata con cui l'acquirente dice quanto vuole pagare e a quali condizioni, rispondi in tempi brevi. Leggi bene il prezzo, la caparra, la data prevista per il compromesso (il contratto preliminare, con cui vi impegnate a vendere e comprare) e quella per il rogito, e le eventuali condizioni, come l'ottenimento del mutuo. Attenzione: una proposta che accetti per iscritto può diventare vincolante anche per te. Nel dubbio, falla leggere al notaio prima di firmare.</p>
<p>Se l'offerta è più bassa di quanto speravi, puoi fare una controproposta. Valuta però l'offerta per intero, non solo il prezzo: un acquirente che ha già il mutuo approvato e accetta i tuoi tempi può valere più di uno che offre un po' di più ma con molte condizioni.</p>`,
    },
    {
      id: 'scelta-agenzia',
      title: 'Vendere casa velocemente con o senza agenzia',
      html: `<p>Si può vendere velocemente in entrambi i modi. La differenza è chi fa il lavoro. Un'agenzia seria si occupa di prezzo, foto, annunci, visite, trattativa e controllo dei documenti, e ha già una lista di persone che cercano casa in zona. In cambio chiede una provvigione, cioè un compenso che non ha una tariffa fissa per legge: si concorda per iscritto. Trovi i dettagli nella guida sulla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>
<p>Se scegli un'agenzia, per non perdere tempo:</p>
<ul>
  <li><strong>Diffida di chi promette il prezzo più alto</strong> solo per avere l'incarico: rischi di ritrovarti con una casa ferma e un prezzo da abbassare dopo mesi.</li>
  <li><strong>Chiedi su cosa si basa la valutazione</strong>: case simili vendute, quotazioni OMI, caratteristiche della tua casa.</li>
  <li><strong>Leggi bene l'incarico</strong>: durata, esclusiva o no, provvigione, cosa succede se trovi tu un acquirente.</li>
</ul>
<p>Se invece vuoi fare da solo, la guida su come <a href="/it/vendere-casa-senza-agenzia">vendere casa senza agenzia</a> spiega passo passo cosa fare e quali rischi evitare. Per avere chiari tutti i costi, compresi quelli che restano anche senza agenzia, leggi <a href="/it/quanto-costa-vendere-casa">quanto costa vendere casa</a>.</p>`,
    },
    {
      id: 'piano-10-passi',
      title: 'Piano in 10 passi per vendere casa velocemente',
      html: `<ol>
  <li><strong>Stima il valore</strong>: fai una <a href="/it/quanto-vale-la-mia-casa">stima gratuita del valore della tua casa</a> e confrontala con gli annunci di case simili nella zona.</li>
  <li><strong>Decidi il prezzo di partenza</strong>: realistico, con un piccolo margine per la trattativa, non un prezzo "da sogno".</li>
  <li><strong>Raccogli i documenti</strong>: atto di provenienza, visura, planimetria, APE, documenti del condominio, conteggio del mutuo.</li>
  <li><strong>Controlla le conformità</strong> catastale e urbanistica con un tecnico, se hai fatto lavori o hai dubbi.</li>
  <li><strong>Prepara la casa</strong>: ordine, pulizia, piccole riparazioni.</li>
  <li><strong>Fai foto buone</strong>: di giorno, in orizzontale, tutte le stanze, più la planimetria.</li>
  <li><strong>Scrivi un annuncio completo</strong> e pubblicalo dove cercano gli acquirenti della tua zona.</li>
  <li><strong>Organizza le visite</strong> con orari ampi, anche serali e nel fine settimana.</li>
  <li><strong>Rispondi in fretta alle proposte</strong>, valutando prezzo, tempi e condizioni insieme.</li>
  <li><strong>Prepara compromesso e rogito</strong>: concorda le date con l'acquirente e il notaio e tieni pronti i documenti.</li>
</ol>
<p>Se dopo qualche settimana con un annuncio curato non arrivano visite, il segnale di solito riguarda il prezzo o le foto. Ripeti la <a href="/it/quanto-vale-la-mia-casa">valutazione della casa</a> e confrontati di nuovo con gli annunci simili prima di decidere se correggere.</p>`,
    },
  ],
  faq: [
    [`Qual è il modo più veloce per vendere casa?`, `Partire da un prezzo in linea con case simili della zona, avere i documenti già pronti e presentare bene la casa in foto e alle visite. Un prezzo troppo alto è la causa più comune di una vendita che si allunga.`],
    [`Si può vendere casa velocemente senza agenzia?`, `Sì, se hai tempo per gestire annunci, telefonate e visite e se prepari bene documenti e prezzo. Per i passaggi legali, come compromesso e rogito, ti appoggi comunque al notaio.`],
    [`Conviene partire con un prezzo alto e poi abbassarlo?`, `Di solito no. Gli acquirenti confrontano gli annunci e saltano quelli fuori mercato, e i ribassi ripetuti fanno pensare che la casa abbia qualche problema. Meglio un prezzo realistico con un piccolo margine di trattativa.`],
    [`Quali documenti devo avere pronti per non perdere tempo?`, `Atto di provenienza, visura e planimetria catastale aggiornate, titoli edilizi, APE, documenti del condominio ed eventuale conteggio del mutuo residuo. Se hai fatto lavori, fai controllare a un tecnico che tutto sia in regola.`],
    [`Devo accettare la prima proposta che arriva?`, `Non per forza, ma valutala bene e rispondi in tempi brevi. Guarda prezzo, caparra, tempi e condizioni, come la necessità del mutuo. Una proposta accettata per iscritto può diventare vincolante: nel dubbio falla leggere al notaio.`],
    [`Come capisco se il prezzo della mia casa è giusto?`, `Confronta le quotazioni OMI della tua zona e gli annunci di case simili vicine. Puoi anche fare una valutazione gratuita online: è una stima indicativa, non una perizia, ma ti dà un intervallo realistico da cui partire.`],
  ],
};

export const vendereSenzaAgenzia: Guide = {
  slug: 'vendere-casa-senza-agenzia',
  label: 'Vendere casa senza agenzia',
  title: 'Vendere casa senza agenzia: rischi, documenti, consigli',
  description: `Vendere casa senza agenzia è legale e può farti risparmiare la provvigione: cosa devi fare, i documenti, i rischi concreti e quando conviene davvero.`,
  h1: 'Vendere casa senza agenzia: cosa fare, rischi e quando conviene',
  intro: `Sì, vendere casa senza agenzia è del tutto legale: due privati possono accordarsi direttamente, e il notaio resta comunque necessario per il rogito. Conviene se hai tempo, pazienza e voglia di seguire ogni passaggio, dal prezzo alla trattativa. Qui trovi cosa devi fare tu, i rischi concreti e come evitarli.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'e-legale',
      title: 'Vendere casa da privato a privato è legale?',
      html: `<p>Sì. In Italia non c'è nessun obbligo di passare da un'agenzia immobiliare per vendere casa. Puoi trovare l'acquirente da solo, trattare il prezzo e arrivare alla firma.</p>
<p>Quello che non puoi saltare è il <strong>notaio</strong>: il rogito, cioè l'atto finale di compravendita con cui la casa passa all'acquirente, va firmato davanti a un notaio. Il notaio controlla che la casa sia davvero tua, che non ci siano ipoteche o pignoramenti non dichiarati, che i documenti siano in regola, e registra l'atto. Per prassi lo sceglie e lo paga di solito l'acquirente, ma è un professionista imparziale che tutela entrambe le parti.</p>
<p>Vendere senza agenzia significa quindi fare tu il lavoro che di solito fa l'agente: stimare il prezzo, preparare l'annuncio, rispondere ai contatti, accompagnare le visite, gestire proposta e compromesso. Vediamolo passo per passo.</p>`,
    },
    {
      id: 'cosa-fare',
      title: 'Cosa devi fare tu: i passaggi uno per uno',
      html: `<p><strong>1. Stabilire il prezzo.</strong> È il passaggio più delicato, perché senza un professionista rischi di sbagliare in alto (la casa resta ferma) o in basso (perdi soldi). Parti dalle <a href="/it/quotazioni-omi">quotazioni OMI</a>, i valori minimi e massimi al metro quadro che l'Agenzia delle Entrate pubblica ogni semestre per ogni zona, e confrontali con gli annunci di case simili vicine. Puoi anche fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a> online: ricevi per email un intervallo con i calcoli spiegati. È una stima indicativa, non una perizia.</p>
<p><strong>2. Preparare casa e foto.</strong> Ordine, pulizia, luce naturale, foto in orizzontale di tutte le stanze. Un annuncio da privato con foto curate non ha nulla da invidiare a quello di un'agenzia.</p>
<p><strong>3. Scrivere l'annuncio.</strong> Prezzo, metri quadri (meglio la <a href="/it/superficie-commerciale">superficie commerciale</a>), locali, piano, ascensore, spese condominiali, classe energetica, extra, planimetria. Scrivi "privato vende" in modo chiaro: molti acquirenti lo cercano apposta.</p>
<p><strong>4. Pubblicarlo.</strong> I principali portali immobiliari hanno di solito una sezione dedicata ai privati, con condizioni diverse da portale a portale: alcune opzioni sono gratuite, altre a pagamento, quindi leggi le condizioni prima di scegliere. Puoi aggiungere siti di annunci generalisti, gruppi della tua zona sui social, un cartello "vendesi" ben visibile e il passaparola tra vicini e conoscenti.</p>
<p><strong>5. Gestire contatti e visite.</strong> Rispondi in fretta, fai qualche domanda al telefono prima di fissare la visita (zona di interesse, budget, se serve il mutuo) e organizza le visite in fasce orarie.</p>
<p><strong>6. Ricevere una proposta d'acquisto scritta.</strong> Non accordarti solo a voce: chiedi una proposta firmata, con prezzo, caparra, tempi e condizioni.</p>
<p><strong>7. Firmare il compromesso.</strong> È il contratto preliminare con cui tu ti impegni a vendere e l'acquirente a comprare, a un prezzo e entro una data stabiliti. Va registrato all'Agenzia delle Entrate entro 20 giorni dalla firma; in alternativa può essere fatto dal notaio e trascritto, cosa che tutela di più l'acquirente.</p>
<p><strong>8. Incassare la caparra.</strong> Al compromesso di solito l'acquirente versa una caparra confirmatoria. Funziona così: se l'acquirente si ritira senza un valido motivo, tu tieni la caparra; se ti ritiri tu, devi restituirgli il doppio.</p>
<p><strong>9. Arrivare al rogito.</strong> Insieme all'acquirente e al notaio fissi la data, prepari i documenti e, se hai un mutuo, ti coordini con la banca per chiuderlo con i soldi della vendita.</p>`,
    },
    {
      id: 'documenti',
      title: 'Documenti per vendere casa senza agenzia',
      html: `<p>Senza agenzia, controllare i documenti spetta a te. Prepara per tempo:</p>
<ul>
  <li><strong>Atto di provenienza</strong>: il rogito con cui hai comprato, la dichiarazione di successione o l'atto di donazione.</li>
  <li><strong>Visura e planimetria catastale</strong> aggiornate: la scheda e il disegno della casa al Catasto. Devono corrispondere allo stato reale, perché la conformità catastale va dichiarata nell'atto.</li>
  <li><strong>Titoli edilizi e conformità urbanistica</strong>: la casa deve corrispondere ai permessi rilasciati dal Comune.</li>
  <li><strong>APE</strong> (Attestato di Prestazione Energetica), redatto da un tecnico abilitato: è obbligatorio e va allegato all'atto.</li>
  <li><strong>Certificato di agibilità</strong>, se c'è.</li>
  <li><strong>Documenti del condominio</strong>: spese, regolamento, delibere, eventuali lavori straordinari.</li>
  <li><strong>Dichiarazioni di conformità degli impianti</strong> e libretto della caldaia, se li hai.</li>
  <li><strong>Documento d'identità</strong> e informazioni su stato civile e regime patrimoniale (comunione o separazione dei beni).</li>
  <li><strong>Conteggio estintivo del mutuo</strong>, se ne hai uno in corso.</li>
</ul>
<p>Trovi la spiegazione di ciascuno nella guida ai <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>.</p>`,
    },
    {
      id: 'sicurezza-visite',
      title: 'Visite in sicurezza quando vendi da privato',
      html: `<p>Aprire casa a sconosciuti richiede qualche attenzione in più, soprattutto se vivi da solo o sei una persona anziana:</p>
<ul>
  <li><strong>Chiedi nome, cognome e numero di telefono</strong> prima della visita, e richiama tu per confermare.</li>
  <li><strong>Non essere mai solo</strong>: fatti accompagnare da un familiare o da un amico.</li>
  <li><strong>Metti via oggetti di valore</strong>, documenti, medicine e chiavi.</li>
  <li><strong>Accompagna sempre</strong> le persone in ogni stanza, senza lasciarle girare da sole.</li>
  <li><strong>Non dare le chiavi</strong> a nessuno prima del rogito.</li>
  <li><strong>Diffida di richieste strane</strong>: chi vuole pagare subito con modalità insolite, chi chiede anticipi o documenti personali, chi ha troppa fretta.</li>
</ul>`,
    },
    {
      id: 'rischi',
      title: 'Vendere casa senza agenzia: i rischi concreti e come evitarli',
      html: `<ul>
  <li><strong>Prezzo sbagliato.</strong> Troppo alto e la casa resta ferma, troppo basso e perdi denaro. <em>Come evitarlo</em>: parti da dati (OMI, annunci simili, una stima) e non solo dalla cifra che ti serve.</li>
  <li><strong>Documenti non in regola.</strong> Una difformità scoperta al momento del rogito può far saltare tutto o farlo slittare. <em>Come evitarlo</em>: fai controllare catasto e conformità urbanistica da un tecnico prima di pubblicare l'annuncio.</li>
  <li><strong>Accordi solo a voce.</strong> Una stretta di mano non ti tutela. <em>Come evitarlo</em>: pretendi sempre una proposta scritta e firmata, e un compromesso scritto con prezzo, caparra e date.</li>
  <li><strong>Compromesso scritto male.</strong> Un modulo trovato online può non adattarsi al tuo caso. <em>Come evitarlo</em>: fallo preparare o almeno rileggere dal notaio.</li>
  <li><strong>Acquirente senza mutuo.</strong> Se chi compra non ottiene il finanziamento, la vendita salta dopo settimane di attesa. <em>Come evitarlo</em>: chiedi se ha già una pre delibera della banca e concorda per iscritto cosa succede se il mutuo non arriva.</li>
  <li><strong>Pagamenti non tracciabili.</strong> <em>Come evitarlo</em>: caparra e saldo solo con bonifico o assegno circolare, verificati prima di firmare.</li>
  <li><strong>Tempo e stress.</strong> Telefonate, perditempo, visite a vuoto. <em>Come evitarlo</em>: filtra i contatti al telefono e concentra le visite in pochi momenti della settimana.</li>
</ul>
<p>Quasi tutti questi rischi si riducono con due abitudini: decidere il prezzo partendo dai dati e mettere tutto per iscritto. Per il primo punto, una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della casa</a> ti dà un intervallo con minimo, massimo e valore centrale, e ti aiuta anche a rispondere con calma quando un acquirente prova a scendere molto con il prezzo.</p>`,
    },
    {
      id: 'confronto',
      title: 'Vendere con agenzia o da solo: il confronto',
      html: `<p>Un confronto qualitativo, da adattare alla tua situazione:</p>
<div style="overflow-x:auto"><table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Con agenzia</th><th ${TH}>Da solo</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Tempo tuo</strong></td><td ${TD}>Poco: l'agente gestisce contatti e visite</td><td ${TD}>Molto: telefonate, visite, trattativa sono tue</td></tr>
    <tr><td ${TD}><strong>Costi</strong></td><td ${TD}>Provvigione concordata per iscritto, più i costi che restano in ogni caso (APE, eventuali regolarizzazioni)</td><td ${TD}>Niente provvigione; restano APE, eventuali regolarizzazioni, annunci a pagamento se li scegli, consulenze</td></tr>
    <tr><td ${TD}><strong>Prezzo</strong></td><td ${TD}>Valutazione dell'agente, da verificare</td><td ${TD}>Lo stimi tu, con OMI, annunci simili e una stima online</td></tr>
    <tr><td ${TD}><strong>Competenze</strong></td><td ${TD}>Trattativa e controllo documenti affidati a un professionista</td><td ${TD}>Devi informarti e appoggiarti a notaio e tecnico</td></tr>
    <tr><td ${TD}><strong>Acquirenti</strong></td><td ${TD}>Annunci più la lista di clienti dell'agenzia</td><td ${TD}>Solo i tuoi annunci e il passaparola</td></tr>
    <tr><td ${TD}><strong>Controllo</strong></td><td ${TD}>Deleghi, ma devi fidarti</td><td ${TD}>Decidi tutto tu, in ogni momento</td></tr>
  </tbody>
</table></div>
<p>Su quanto si paga in ciascun caso trovi i dettagli in <a href="/it/quanto-costa-vendere-casa">quanto costa vendere casa</a>. Sulla provvigione: non esiste una tariffa fissa di legge. Spesso si sente parlare di una percentuale tra il 2 e il 4% più IVA, ma è libera e va concordata per iscritto.</p>`,
    },
    {
      id: 'via-di-mezzo',
      title: 'La via di mezzo: incarico senza esclusiva o consulenze a pagamento',
      html: `<p>Non devi per forza scegliere tra tutto o niente. Ci sono soluzioni intermedie:</p>
<ul>
  <li><strong>Incarico senza esclusiva.</strong> Affidi la vendita a una o più agenzie ma resti libero di vendere anche da solo. Se trovi tu l'acquirente, di regola non paghi provvigione all'agenzia, ma tutto dipende da cosa c'è scritto nell'incarico: leggilo bene prima di firmare.</li>
  <li><strong>Consulenza del notaio.</strong> Puoi vendere da solo e pagare il notaio per preparare o rileggere proposta e compromesso. È una spesa contenuta rispetto al rischio di un contratto scritto male. Chiedi un preventivo prima.</li>
  <li><strong>Verifica di un tecnico.</strong> Un geometra, un architetto o un ingegnere può controllare la conformità catastale e urbanistica, redigere l'APE e sistemare eventuali difformità prima che diventino un problema.</li>
</ul>
<p>Così tieni il controllo della vendita e affidi ai professionisti solo le parti dove un errore costa caro.</p>`,
    },
    {
      id: 'conviene',
      title: 'Vendere casa senza agenzia conviene?',
      html: `<p>Conviene soprattutto se:</p>
<ul>
  <li>hai <strong>tempo</strong> per rispondere a telefonate e accompagnare le visite;</li>
  <li>la casa è <strong>facile da vendere</strong>: in una zona richiesta, con documenti in ordine;</li>
  <li>hai già un <strong>acquirente</strong> in vista, ad esempio un vicino, un parente o un inquilino;</li>
  <li>sei disposto a <strong>pagare un notaio o un tecnico</strong> per le parti delicate.</li>
</ul>
<p>Conviene meno se vivi lontano dalla casa, hai poco tempo, la situazione è complicata (eredi da mettere d'accordo, difformità da sanare, mutuo da gestire) o non ti senti a tuo agio a trattare sul prezzo.</p>
<p>In ogni caso, il primo passo è lo stesso: capire quanto vale la casa. Fai una <a href="/it/quanto-vale-la-mia-casa">stima gratuita di quanto vale la tua casa</a> e confrontala con i prezzi della tua città, ad esempio su <a href="/it/prezzi-case">prezzi delle case</a>. Per accelerare i tempi, leggi anche <a href="/it/come-vendere-casa-velocemente">come vendere casa velocemente</a>.</p>`,
    },
  ],
  faq: [
    [`È legale vendere casa senza agenzia?`, `Sì, è del tutto legale vendere casa tra privati. Non c'è obbligo di passare da un'agenzia. Serve però sempre il notaio per il rogito, cioè l'atto finale di compravendita.`],
    [`Quanto si risparmia vendendo casa da privato?`, `Si risparmia la provvigione dell'agenzia, che è libera e va concordata caso per caso. Restano gli altri costi, come APE, eventuali regolarizzazioni, annunci a pagamento se li scegli e le consulenze di notaio o tecnico.`],
    [`Chi prepara il compromesso se vendo senza agenzia?`, `Può essere scritto dalle parti, ma è consigliabile farlo preparare o almeno rileggere da un notaio. Il compromesso va registrato all'Agenzia delle Entrate entro 20 giorni dalla firma.`],
    [`Come funziona la caparra confirmatoria?`, `La versa l'acquirente, di solito al compromesso. Se l'acquirente si ritira senza un valido motivo, il venditore la trattiene; se è il venditore a ritirarsi, deve restituire il doppio.`],
    [`Chi paga il notaio quando si vende tra privati?`, `Per prassi lo paga di solito l'acquirente, che spesso lo sceglie. Il venditore può avere altri costi, ad esempio per la cancellazione dell'ipoteca, le regolarizzazioni o l'APE.`],
    [`Quali rischi corro vendendo da solo?`, `I principali sono sbagliare il prezzo, scoprire tardi documenti non in regola, accordarsi solo a voce e firmare un compromesso scritto male. Si evitano con una stima basata sui dati, un controllo tecnico preventivo e l'aiuto del notaio.`],
    [`Posso dare l'incarico a un'agenzia e cercare anche da solo?`, `Sì, con un incarico senza esclusiva. Cosa succede se trovi tu l'acquirente dipende da cosa è scritto nell'incarico: leggilo bene prima di firmare.`],
  ],
};

export const quandoConvieneVendere: Guide = {
  slug: 'quando-conviene-vendere-casa',
  label: 'Quando conviene vendere casa',
  title: 'Quando conviene vendere casa: mutuo, tasse e momento',
  description: `Quando conviene vendere casa: fattori personali, regola dei 5 anni, mutuo in corso, mercato della tua zona e stagione, con una checklist per decidere.`,
  h1: 'Quando conviene vendere casa: come scegliere il momento giusto',
  intro: `Conviene vendere casa quando hai un motivo chiaro per farlo, quando le tasse non ti penalizzano (attenzione alla regola dei 5 anni) e quando hai un'idea realistica del prezzo che puoi ottenere nella tua zona. Il "momento perfetto" del mercato nessuno lo conosce in anticipo: conta di più il tuo momento. Ecco i fattori da valutare, uno per uno.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'fattori-personali',
      title: 'Il momento giusto per vendere casa parte da te',
      html: `<p>La domanda "quando conviene vendere casa?" ha una risposta diversa per ognuno. Prima del mercato, guarda la tua situazione:</p>
<ul>
  <li><strong>Hai bisogno di vendere?</strong> Un trasferimento di lavoro, una separazione, una famiglia che cresce o si riduce, scale diventate troppo faticose. Se il bisogno è reale, aspettare il momento ideale del mercato spesso costa più di quanto rende.</li>
  <li><strong>La casa ti costa più di quanto ti serve?</strong> Spese condominiali, tasse, manutenzione di una casa vuota o troppo grande. Ogni anno di attesa ha un costo.</li>
  <li><strong>Ti servono i soldi per un altro progetto?</strong> Comprare un'altra casa, aiutare un figlio, avere una riserva.</li>
  <li><strong>La casa ha bisogno di lavori importanti?</strong> Tetto, facciata, impianti. A volte conviene vendere prima che arrivino, a volte conviene sapere già quanto costeranno per trattare meglio.</li>
</ul>
<p>Se hai una ragione solida, il momento giusto è quello in cui sei pronto: documenti in ordine, prezzo chiaro, casa presentabile.</p>
<p>Se invece non hai un bisogno preciso e stai solo valutando, parti dai numeri. Ad esempio, se la tua casa ti costa ogni anno qualche migliaio di euro tra condominio, tasse e manutenzione senza che tu la usi, conviene confrontare questa spesa con quello che potresti ricavare vendendola oggi. Per avere un'idea del ricavo, fai una <a href="/it/quanto-vale-la-mia-casa">stima gratuita del valore della casa</a>: ricevi per email un valore minimo, massimo e centrale, con i calcoli spiegati. È una stima indicativa, non una perizia, ma basta per capire se vale la pena approfondire.</p>`,
    },
    {
      id: 'vendo-prima-o-compro-prima',
      title: 'Cambio casa: vendo prima o compro prima?',
      html: `<p>È uno dei dubbi più comuni per chi cambia casa. Entrambe le strade hanno pro e contro:</p>
<ul>
  <li><strong>Vendere prima</strong>: sai esattamente quanto hai a disposizione e non rischi di avere due case insieme. Il rischio è dover lasciare casa prima di aver trovato quella nuova. Si può gestire concordando con l'acquirente un rogito un po' più lontano, o un periodo in cui puoi restare in casa dopo la vendita, sempre messo per iscritto.</li>
  <li><strong>Comprare prima</strong>: trovi con calma la casa nuova e ti trasferisci senza fretta. Il rischio è dover pagare la nuova casa prima di aver venduto la vecchia, magari con un mutuo ponte o con due mutui insieme, e trovarti a dover accettare un'offerta bassa per fretta.</li>
  <li><strong>Insieme</strong>: si può legare l'acquisto alla vendita, ad esempio con una proposta d'acquisto condizionata alla vendita della tua casa. Non tutti i venditori la accettano, e va scritta con attenzione.</li>
</ul>
<p>Nel dubbio, il primo passo è sapere quanto vale la casa che hai. Una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a> ti dà un intervallo realistico per fare i conti del cambio casa prima di impegnarti.</p>
<p>Se scegli di comprare prima, parla con la banca: ti spiegherà se e come può finanziarti in attesa della vendita, e a quali condizioni.</p>`,
    },
    {
      id: 'fattori-fiscali',
      title: 'Vendere casa prima dei 5 anni: la plusvalenza',
      html: `<p>Il fattore fiscale più importante è la <strong>regola dei 5 anni</strong>. Se vendi una casa entro 5 anni dall'acquisto o dalla costruzione e la vendi a un prezzo più alto di quello pagato, il guadagno (la plusvalenza) può essere tassato.</p>
<p>In sintesi:</p>
<ul>
  <li>La plusvalenza si calcola, in modo semplificato, come prezzo di vendita meno prezzo di acquisto e costi documentati legati alla casa.</li>
  <li><strong>Non è tassata</strong> se, per la maggior parte del periodo tra acquisto e vendita, la casa è stata l'abitazione principale tua o dei tuoi familiari.</li>
  <li><strong>Non è tassata</strong> se la casa l'hai ricevuta in eredità.</li>
  <li>Se è tassata, puoi chiedere al notaio, al momento del rogito, di applicare un'imposta sostitutiva del 26%; in alternativa la dichiari nella tassazione ordinaria.</li>
  <li>Per le case ricevute in donazione e per quelle con lavori Superbonus esistono regole specifiche: chiedi al tuo commercialista o al CAF.</li>
</ul>
<p>Se sei vicino ai 5 anni e la casa non è la tua abitazione principale, aspettare qualche mese può fare differenza. Fai sempre verificare il tuo caso dal notaio o dal commercialista. Trovi tutto spiegato nella guida sulla <a href="/it/plusvalenza-vendita-casa">plusvalenza nella vendita della casa</a>.</p>`,
    },
    {
      id: 'mutuo-in-corso',
      title: 'Vendere casa con il mutuo in corso',
      html: `<p>Vendere casa con il mutuo non ancora pagato è possibile e molto comune. La casa è "ipotecata", cioè la banca ha un diritto sulla casa a garanzia del prestito. Ci sono tre strade principali:</p>
<ul>
  <li><strong>Estinzione del mutuo.</strong> È la soluzione più frequente: con i soldi della vendita chiudi il mutuo. Chiedi alla banca il conteggio estintivo, cioè quanto devi pagare per chiuderlo a una certa data. Di solito al rogito il notaio coordina il pagamento in modo che il debito venga saldato con il prezzo della vendita. Quando il mutuo è estinto, la banca fa cancellare l'ipoteca con una procedura automatica e gratuita. Controlla nel contratto se ci sono penali per l'estinzione anticipata.</li>
  <li><strong>Portabilità.</strong> Con questa parola di solito si intende la surroga, cioè spostare il mutuo in un'altra banca: serve se tieni la casa, non se la vendi. Alcune banche, invece, permettono di trasferire il mutuo sulla nuova casa che compri, cambiando l'immobile dato in garanzia: chiedi alla tua banca se lo prevede e a quali condizioni.</li>
  <li><strong>Accollo.</strong> L'acquirente si prende il tuo mutuo e continua a pagarlo al posto tuo, e la cifra viene scalata dal prezzo. Di solito serve il consenso della banca, e se la banca non ti libera espressamente potresti restare obbligato anche tu. Verifica sempre con banca e notaio.</li>
</ul>
<p>Prima di mettere in vendita, chiedi alla banca il debito residuo: ti serve per capire quanto ti resterà davvero in tasca dopo la vendita. Per tutti gli altri costi, leggi <a href="/it/quanto-costa-vendere-casa">quanto costa vendere casa</a>.</p>`,
    },
    {
      id: 'mercato-locale',
      title: 'Come capire l\'andamento del mercato nella tua zona',
      html: `<p>Nessuno sa con certezza se i prezzi saliranno o scenderanno l'anno prossimo, e diffida di chi te lo garantisce. Puoi però farti un'idea di come si sta muovendo la tua zona, con strumenti gratuiti:</p>
<ul>
  <li><strong>Confronta i semestri OMI.</strong> L'OMI, l'Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate, divide ogni comune in zone e pubblica ogni semestre un valore minimo e massimo al metro quadro per tipo di casa. Guarda i valori della tua zona negli ultimi semestri: sono saliti, scesi o rimasti fermi? Non sono i prezzi reali delle singole vendite, ma un buon riferimento. La guida sulle <a href="/it/quotazioni-omi">quotazioni OMI</a> spiega come leggerli.</li>
  <li><strong>Guarda quanto restano online gli annunci simili.</strong> Segui per qualche settimana le case simili alla tua nella stessa zona: spariscono presto o restano lì a lungo? I prezzi vengono abbassati? È un segnale concreto di quanto sono richieste.</li>
  <li><strong>Guarda i prezzi della tua città.</strong> Nelle pagine dei <a href="/it/prezzi-case">prezzi delle case per città</a> trovi i valori di riferimento, ad esempio per <a href="/it/prezzi-case/milano">Milano</a>, <a href="/it/prezzi-case/roma">Roma</a> o <a href="/it/prezzi-case/torino">Torino</a>.</li>
  <li><strong>Parla con chi conosce la zona.</strong> Un agente della zona, il notaio, i vicini che hanno venduto di recente.</li>
</ul>
<p>Se la tua zona è stabile e hai un buon motivo per vendere, aspettare un rialzo che nessuno può promettere raramente è una strategia. Meglio preparare bene la vendita.</p>
<p>Ricorda anche che il mercato non è uguale per tutte le case. Nella stessa zona, un appartamento luminoso con ascensore e uno al piano terra senza sbocchi possono avere tempi di vendita molto diversi. Per questo, più che chiederti se "il mercato" va bene, chiediti se case come la tua, con le sue caratteristiche, oggi si vendono e a che prezzo.</p>`,
    },
    {
      id: 'stagione',
      title: 'Qual è la stagione migliore per vendere casa?',
      html: `<p>Si sente spesso dire che ci sono mesi migliori di altri. In realtà la stagione conta meno di prezzo, documenti e presentazione, e cambia da zona a zona: in una città universitaria, in una località di villeggiatura o in un piccolo paese i ritmi sono diversi.</p>
<p>Qualche considerazione di buon senso:</p>
<ul>
  <li><strong>Luce e foto</strong>: con giornate lunghe e luminose è più facile fare foto belle e mostrare la casa al meglio anche di sera.</li>
  <li><strong>Periodi di vacanza</strong>: nei giorni di festa e nelle settimane di ferie molte persone sono via, e organizzare visite e firme può essere più lento.</li>
  <li><strong>Esigenze di chi compra</strong>: chi ha figli spesso preferisce trasferirsi senza interrompere l'anno scolastico.</li>
  <li><strong>Esterni</strong>: un giardino o un terrazzo si apprezzano di più quando si possono vivere.</li>
</ul>
<p>Il consiglio pratico: non rimandare per aspettare la stagione giusta. Usa il tempo per preparare la casa e i documenti, e pubblica l'annuncio quando tutto è pronto.</p>`,
    },
    {
      id: 'checklist',
      title: 'Checklist: sei pronto a vendere casa?',
      html: `<p>Rispondi sì o no a queste domande. Più sì hai, più è il momento giusto:</p>
<ol>
  <li>Ho un motivo chiaro per vendere e so cosa farò dopo.</li>
  <li>So se vendo prima o compro prima, e ho un piano per i tempi del trasloco.</li>
  <li>Ho verificato la regola dei 5 anni e l'eventuale plusvalenza con il notaio o il commercialista.</li>
  <li>So quanto mi resta da pagare sul mutuo e ho chiesto alla banca come chiuderlo.</li>
  <li>Ho un'idea realistica del valore: ho fatto una <a href="/it/quanto-vale-la-mia-casa">stima gratuita della mia casa</a> e l'ho confrontata con OMI e annunci simili.</li>
  <li>Ho i documenti principali: atto di provenienza, visura, planimetria, APE, documenti del condominio.</li>
  <li>La planimetria catastale corrisponde a com'è la casa oggi.</li>
  <li>La casa è presentabile, o so quali piccoli lavori fare prima.</li>
  <li>Ho deciso se vendere da solo o con un'agenzia.</li>
  <li>Ho calcolato quanto mi resterà al netto di tutti i costi della vendita.</li>
</ol>
<p>Se hai risposto sì a quasi tutte, sei pronto. Il passo successivo è leggere <a href="/it/cosa-fare-prima-di-vendere-casa">cosa fare prima di vendere casa</a> per preparare la casa nel modo giusto.</p>`,
    },
  ],
  faq: [
    [`Quando conviene vendere casa?`, `Quando hai un motivo chiaro, le tasse non ti penalizzano e conosci il valore realistico della casa nella tua zona. Il momento perfetto del mercato non si può prevedere: conta di più essere pronti con prezzo e documenti.`],
    [`Se vendo casa prima di 5 anni pago le tasse?`, `Puoi dover pagare le tasse sulla plusvalenza, cioè sul guadagno. Non le paghi se la casa è stata per la maggior parte del periodo abitazione principale tua o dei familiari, o se l'hai ricevuta in eredità. Fai verificare il tuo caso dal notaio o dal commercialista.`],
    [`Posso vendere casa se ho ancora il mutuo?`, `Sì. Di solito il mutuo si chiude con i soldi della vendita al momento del rogito, e l'ipoteca viene poi cancellata con una procedura automatica e gratuita. In alternativa l'acquirente può accollarsi il mutuo, di solito con il consenso della banca.`],
    [`Conviene vendere prima o comprare prima?`, `Vendere prima ti dà certezza sul budget ma rischi di dover lasciare casa presto. Comprare prima ti dà tempo ma rischi di avere due case insieme. Molto dipende dai tuoi risparmi e da cosa ti offre la banca.`],
    [`Qual è il periodo migliore dell'anno per vendere casa?`, `Non esiste un mese giusto per tutti: dipende dalla zona e dal tipo di casa. Conta di più presentare la casa bene, con un prezzo realistico. Evita solo, se puoi, di pubblicare l'annuncio in pieno periodo di ferie.`],
    [`Come capisco se i prezzi nella mia zona salgono o scendono?`, `Confronta le quotazioni OMI della tua zona negli ultimi semestri e osserva quanto restano online gli annunci di case simili. Nessuno può prevedere con certezza i prezzi futuri.`],
  ],
};

export const cosaFarePrimaDiVendere: Guide = {
  slug: 'cosa-fare-prima-di-vendere-casa',
  label: 'Cosa fare prima di vendere casa',
  title: 'Cosa fare prima di vendere casa: verifiche e checklist',
  description: `Cosa fare prima di vendere casa: verifiche su catasto, conformità e APE, stima del valore, lavori utili, home staging, foto e checklist stanza per stanza.`,
  h1: 'Cosa fare prima di vendere casa: tutto quello che devi verificare',
  intro: `Prima di vendere casa devi fare tre cose: verificare che i documenti siano in regola (catasto, conformità urbanistica, APE), capire quanto vale davvero la casa e prepararla per foto e visite. Farlo prima di pubblicare l'annuncio ti evita sorprese al rogito e ti aiuta a vendere meglio. Qui trovi cosa controllare e una checklist stanza per stanza.`,
  published: '2026-10-05',
  updated: '2026-10-05',
  audience: 'proprietari',
  sections: [
    {
      id: 'verifiche-documentali',
      title: 'Cosa verificare prima di vendere casa: i documenti',
      html: `<p>Le verifiche sui documenti sono la parte meno visibile, ma la più importante. Un problema scoperto all'ultimo momento può far slittare o saltare la vendita.</p>
<h3>Conformità catastale</h3>
<p>Il Catasto è l'archivio pubblico degli immobili. Per ogni casa ci sono la <strong>visura catastale</strong> (la scheda con dati, categoria e rendita) e la <strong>planimetria catastale</strong> (il disegno della casa). Nell'atto di vendita va dichiarato che la planimetria corrisponde allo stato reale della casa. Se hai spostato una parete, chiuso una porta, trasformato un ripostiglio in bagno o chiuso un balcone a veranda, la planimetria potrebbe non corrispondere più. In quel caso un tecnico (geometra, architetto o ingegnere) può aggiornarla con una pratica al Catasto. Puoi chiedere visura e planimetria all'Agenzia delle Entrate, anche online, o farle scaricare dal tuo tecnico.</p>
<h3>Conformità urbanistica</h3>
<p>È una cosa diversa dal catasto: significa che la casa reale corrisponde ai permessi edilizi rilasciati dal Comune nel tempo (licenze, concessioni, permessi di costruire, comunicazioni di lavori). Per verificarla un tecnico chiede di solito l'accesso agli atti in Comune e confronta i progetti con la casa. Alcune piccole difformità si possono sanare con una pratica, altre più gravi possono creare problemi seri alla vendita. Per questo conviene saperlo prima, non al rogito.</p>
<h3>APE</h3>
<p>L'<strong>APE</strong>, Attestato di Prestazione Energetica, indica quanta energia consuma la casa, con una classe da A (la migliore) a G. È obbligatorio per vendere, va allegato all'atto e la classe va scritta nell'annuncio. Lo redige un tecnico abilitato, dura 10 anni (a patto che siano stati fatti i controlli previsti sull'impianto di riscaldamento) e il costo varia: chiedi un preventivo. Se ne hai già uno, controlla che sia ancora valido. Per capire come si legge, vedi anche <a href="/it/ape-annunci-immobiliari">l'APE negli annunci</a>.</p>
<h3>Gli altri documenti</h3>
<p>Atto di provenienza, documenti del condominio, certificato di agibilità se c'è, dichiarazioni di conformità degli impianti, conteggio del mutuo residuo. L'elenco completo è nella guida ai <a href="/it/documenti-per-vendere-casa">documenti per vendere casa</a>.</p>`,
    },
    {
      id: 'stima-valore',
      title: 'Stimare il valore prima di mettere in vendita',
      html: `<p>Prima di fare qualsiasi lavoro o di scegliere un'agenzia, devi sapere quanto vale la tua casa. Ti serve per decidere il prezzo, per capire se un lavoro ha senso e per valutare le proposte delle agenzie.</p>
<p>I punti di partenza sono:</p>
<ul>
  <li><strong>Le quotazioni OMI</strong>: l'Osservatorio del Mercato Immobiliare dell'Agenzia delle Entrate pubblica ogni semestre, per ogni zona del comune, un valore minimo e massimo al metro quadro. Sono un intervallo di riferimento, non il prezzo della singola casa. Trovi la spiegazione nella guida sulle <a href="/it/quotazioni-omi">quotazioni OMI</a>.</li>
  <li><strong>I metri quadri giusti</strong>: per i prezzi si usa la superficie commerciale, che comprende i muri e una parte di balconi, terrazzi e cantine. Vedi la guida sulla <a href="/it/superficie-commerciale">superficie commerciale</a>.</li>
  <li><strong>Gli annunci simili</strong> nella tua zona, per tipo, dimensione e stato.</li>
</ul>
<p>Il modo più rapido per mettere insieme questi elementi è fare una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a>: scrivi l'indirizzo, indichi metri quadri, piano, stato, finiture ed extra come box o terrazzo, e ricevi per email un valore minimo, massimo e centrale con i calcoli spiegati. È una stima indicativa, non una perizia. Per il metodo completo, leggi <a href="/it/come-valutare-una-casa">come valutare una casa</a>.</p>`,
    },
    {
      id: 'lavori',
      title: 'Lavori prima di vendere casa: cosa conviene e cosa no',
      html: `<p>Non tutti i lavori fatti prima di vendere si recuperano nel prezzo. Una regola semplice: <strong>conviene sistemare ciò che fa una brutta prima impressione, non rifare ciò che l'acquirente vorrà comunque scegliere da sé.</strong></p>
<p><strong>Lavori che di solito conviene fare</strong> (piccoli, rapidi, poco costosi):</p>
<ul>
  <li>Ritinteggiare pareti macchiate, scrostate o di colori molto forti, con tinte chiare e neutre.</li>
  <li>Riparare ciò che è rotto: maniglie, rubinetti che gocciolano, prese, interruttori, tapparelle bloccate.</li>
  <li>Sostituire lampadine bruciate e mettere luci uguali e chiare nella stessa stanza.</li>
  <li>Rifare il silicone di vasca, doccia e lavandino, pulire o rinfrescare le fughe.</li>
  <li>Risolvere piccole infiltrazioni o macchie di umidità, capendone la causa (e dichiarandola se c'è stato un problema).</li>
  <li>Fare la manutenzione della caldaia e avere il libretto in ordine.</li>
</ul>
<p><strong>Lavori che di solito non conviene fare</strong> solo per vendere:</p>
<ul>
  <li>Rifare cucina o bagno completi: costano molto e l'acquirente potrebbe volerli diversi.</li>
  <li>Cambiare i pavimenti in tutta la casa.</li>
  <li>Spostare pareti o cambiare la distribuzione degli spazi.</li>
  <li>Grandi lavori di impianti, a meno che non siano necessari per sicurezza o per poter vendere.</li>
</ul>
<p>Se la casa è da ristrutturare, spesso è meglio venderla così, a un prezzo che ne tenga conto, e magari far vedere come potrebbe diventare. Prima di spendere, confronta il costo dei lavori con la tua stima del valore.</p>
<p>Un esempio per ragionare: se pensi di rifare il bagno, chiedi un preventivo e poi chiediti se, con il bagno nuovo, la casa passerebbe davvero in una categoria diversa agli occhi di chi compra. Con una <a href="/it/quanto-vale-la-mia-casa">valutazione gratuita della tua casa</a> puoi vedere come cambia la stima a seconda dello stato della casa, ad esempio da ristrutturare oppure ristrutturata da poco: ti dà un ordine di grandezza da confrontare con il preventivo, prima di decidere. Ricorda che lavori fatti in fretta per vendere, se eseguiti male, si notano alla visita e fanno nascere dubbi su tutto il resto.</p>`,
    },
    {
      id: 'pulizia-decluttering',
      title: 'Pulizia e decluttering: la preparazione che costa meno',
      html: `<p>"Decluttering" significa liberare la casa dagli oggetti in eccesso. È la cosa più efficace che puoi fare prima di vendere, e quasi non costa nulla:</p>
<ul>
  <li><strong>Togli almeno metà degli oggetti</strong> a vista: soprammobili, riviste, calamite sul frigo, giochi, scarpe.</li>
  <li><strong>Svuota in parte armadi e mensole</strong>: chi visita li apre, e spazi pieni sembrano piccoli.</li>
  <li><strong>Togli le foto di famiglia</strong> e gli oggetti molto personali: l'acquirente deve immaginarsi lì, non sentirsi ospite.</li>
  <li><strong>Porta via mobili in eccesso</strong>: una stanza con meno mobili sembra più grande.</li>
  <li><strong>Pulisci a fondo</strong>: vetri, bagni, cucina, battiscopa, termosifoni. Considera un'impresa di pulizie per una volta.</li>
  <li><strong>Elimina gli odori</strong>: arieggia, svuota la spazzatura, attenzione ad animali e fumo.</li>
</ul>
<p>Puoi portare l'eccesso in cantina, da un parente o in un box: l'importante è che non si veda durante foto e visite.</p>
<p>Un consiglio pratico: considera il decluttering come l'inizio del trasloco. Tutto quello che togli adesso è qualcosa che non dovrai imballare dopo. Dividi gli oggetti in tre gruppi, da tenere, da regalare o vendere, da buttare, e procedi una stanza alla volta, partendo da quella che si vede per prima in foto, di solito il soggiorno.</p>`,
    },
    {
      id: 'home-staging',
      title: 'Home staging fisico e virtuale',
      html: `<p>L'home staging è la preparazione della casa per farla sembrare accogliente e facile da immaginare abitata. Può essere:</p>
<ul>
  <li><strong>Fisico</strong>: si sistema la casa dal vivo, a volte con l'aiuto di un professionista, aggiungendo pochi complementi (cuscini, tappeti, piante, lampade, biancheria chiara) o noleggiando arredi se la casa è vuota. Migliora sia le foto sia le visite, ma ha un costo e richiede organizzazione.</li>
  <li><strong>Virtuale</strong>: si arredano le stanze solo in foto, con un programma o con l'intelligenza artificiale. È utile soprattutto per case vuote o con arredi molto datati, per aiutare chi guarda a capire come usare gli spazi. Alla visita però la casa resta com'è: l'arredo virtuale va sempre dichiarato con una scritta sulla foto, pubblicando anche la foto reale.</li>
</ul>
<p>Per capire come funziona quello virtuale e quando ha senso, leggi la guida all'<a href="/it/home-staging-virtuale">home staging virtuale</a>. In ogni caso, nessun allestimento sostituisce ordine e pulizia: partono sempre prima quelli.</p>`,
    },
    {
      id: 'foto',
      title: 'Foto per vendere casa: luce, ordine, inquadrature',
      html: `<p>Le foto sono la prima visita. Bastano poche regole per farle bene anche con il telefono:</p>
<ul>
  <li><strong>Luce naturale</strong>: scatta di giorno, con tende e tapparelle aperte e luci interne accese. Evita le ore in cui il sole entra diretto e crea macchie fortissime.</li>
  <li><strong>Ordine</strong>: ogni stanza fotografata come se dovesse arrivare un ospite. Togli asciugamani, prodotti sul lavandino, cavi, bidoni.</li>
  <li><strong>Telefono in orizzontale</strong>: i portali mostrano le foto in orizzontale, e così si vede più stanza.</li>
  <li><strong>Telefono dritto</strong>, all'altezza del petto, per non avere pareti storte.</li>
  <li><strong>Dagli angoli</strong> della stanza, per far vedere la profondità, senza esagerare con il grandangolo che deforma.</li>
  <li><strong>Tutte le stanze</strong>, compresi bagno, balconi, cantina, box e la vista dalle finestre se è bella.</li>
  <li><strong>Una foto dell'esterno</strong>: facciata, ingresso, giardino o parti comuni.</li>
</ul>
<p>Aggiungi una planimetria semplice: aiuta tantissimo a capire la casa. Scegli come prima foto la più luminosa e ampia, di solito il soggiorno.</p>`,
    },
    {
      id: 'checklist-stanze',
      title: 'Checklist prima di vendere casa, stanza per stanza',
      html: `<p><strong>Ingresso</strong></p>
<ul>
  <li>Porta pulita, campanello e citofono funzionanti, zerbino nuovo.</li>
  <li>Niente scarpe, giacche e ombrelli a vista.</li>
</ul>
<p><strong>Soggiorno</strong></p>
<ul>
  <li>Meno mobili e oggetti, tende aperte, pareti chiare.</li>
  <li>Luci tutte funzionanti, cavi nascosti.</li>
</ul>
<p><strong>Cucina</strong></p>
<ul>
  <li>Piani di lavoro liberi, elettrodomestici puliti, forno e frigo compresi.</li>
  <li>Rubinetto e ante sistemati, niente odori.</li>
</ul>
<p><strong>Bagno</strong></p>
<ul>
  <li>Sanitari, piastrelle e fughe pulite, silicone nuovo se annerito.</li>
  <li>Asciugamani chiari e ordinati, prodotti personali via dalla vista.</li>
</ul>
<p><strong>Camere da letto</strong></p>
<ul>
  <li>Letti fatti con biancheria chiara, comodini sgombri.</li>
  <li>Armadi in parte svuotati, niente vestiti su sedie.</li>
</ul>
<p><strong>Balconi, terrazzi e giardino</strong></p>
<ul>
  <li>Puliti, senza oggetti accatastati, piante curate.</li>
  <li>Se c'è spazio, un tavolino e due sedie per far capire come si usano.</li>
</ul>
<p><strong>Cantina, box e soffitta</strong></p>
<ul>
  <li>Ordinati e accessibili, con luce funzionante.</li>
</ul>
<p><strong>Documenti</strong></p>
<ul>
  <li>Visura e planimetria aggiornate, conformità urbanistica verificata, APE valido.</li>
  <li>Documenti del condominio e conteggio del mutuo pronti.</li>
  <li>Una <a href="/it/quanto-vale-la-mia-casa">stima del valore della casa</a> da cui partire per il prezzo.</li>
</ul>
<p>Quando hai spuntato tutto, sei pronto a pubblicare. Per i passi successivi leggi <a href="/it/come-vendere-casa-velocemente">come vendere casa velocemente</a>.</p>`,
    },
  ],
  faq: [
    [`Cosa bisogna fare prima di vendere casa?`, `Verificare i documenti (conformità catastale e urbanistica, APE, atto di provenienza), stimare il valore della casa e prepararla per foto e visite con pulizia, ordine e piccole riparazioni.`],
    [`Cosa succede se la planimetria catastale non corrisponde?`, `Va aggiornata prima del rogito, perché nell'atto deve essere dichiarata la conformità catastale. Se ne occupa un tecnico, come un geometra, con una pratica al Catasto.`],
    [`L'APE è obbligatorio per vendere casa?`, `Sì. Va allegato all'atto di vendita e la classe energetica va indicata negli annunci. Lo redige un tecnico abilitato e dura 10 anni, a patto che siano stati fatti i controlli previsti sull'impianto di riscaldamento.`],
    [`Conviene ristrutturare prima di vendere casa?`, `Di solito no per i grandi lavori, come cucina, bagno o pavimenti, perché l'acquirente potrebbe volerli diversi. Conviene invece fare piccoli interventi: ritinteggiare, riparare ciò che è rotto, sistemare bagno e luci.`],
    [`Cos'è il decluttering?`, `È liberare la casa dagli oggetti in eccesso prima di foto e visite: soprammobili, foto personali, mobili superflui. Fa sembrare le stanze più grandi e aiuta chi visita a immaginarsi nella casa.`],
    [`Posso usare l'home staging virtuale per vendere casa?`, `Sì, è utile soprattutto per case vuote o con arredi datati. Va sempre dichiarato con una scritta sulla foto, pubblicando anche la foto reale, perché alla visita la casa resta com'è.`],
  ],
};

export type ChapterSection = {
  title: string;
  content: string;
};

export type Chapter = {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  icon: string;
  sections: ChapterSection[];
  checklist: string[];
};

export const CHAPTERS: Chapter[] = [
  {
    slug: "come-cercare-casa",
    title: "Come cercare casa",
    seoTitle: "Come cercare casa in Italia: guida completa 2026",
    seoDescription:
      "Scopri come cercare casa in Italia: budget, pre-delibera mutuo, criteri di ricerca, canali e cosa verificare durante le visite.",
    icon: "Search",
    sections: [
      {
        title: "Valutare il budget reale",
        content: `<p>Il primo passo per cercare casa non è sfogliare annunci, ma capire quanto puoi davvero spendere. Il prezzo dell'immobile è solo una parte del costo totale: devi aggiungere un <strong>10-15% di spese accessorie</strong> tra imposte, notaio, agenzia, perizia e istruttoria mutuo.</p>
<p>Esempio pratico: se il tuo budget complessivo è 200.000 euro, il prezzo massimo dell'immobile dovrebbe essere circa 170.000-180.000 euro, lasciando 20.000-30.000 euro per le spese.</p>
<table>
  <thead>
    <tr><th>Voce</th><th>Costo indicativo</th></tr>
  </thead>
  <tbody>
    <tr><td>Imposte acquisto</td><td>2-10% del prezzo</td></tr>
    <tr><td>Notaio</td><td>2.000-5.000 euro</td></tr>
    <tr><td>Agenzia</td><td>2-5% + IVA</td></tr>
    <tr><td>Perizia bancaria</td><td>200-400 euro</td></tr>
    <tr><td>Istruttoria mutuo</td><td>0,2-0,5% del mutuo</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Pre-delibera del mutuo",
        content: `<p>Prima di iniziare a visitare case, richiedi una <strong>pre-delibera di mutuo</strong> alla tua banca. Non è un obbligo, ma ti offre due vantaggi fondamentali: sai esattamente quanto la banca è disposta a prestarti e, al momento della proposta, il venditore ti prenderà più sul serio.</p>
<p>La pre-delibera si ottiene in <strong>7-15 giorni lavorativi</strong> e richiede:</p>
<ul>
  <li>Documento d'identità e codice fiscale</li>
  <li>Ultime due buste paga (dipendenti) o ultimi due modelli Unico (autonomi)</li>
  <li>CUD o 730 dell'ultimo anno</li>
  <li>Estratto conto degli ultimi 3-6 mesi</li>
  <li>Eventuali finanziamenti in corso</li>
</ul>
<p>La pre-delibera ha validità di <strong>6 mesi</strong> e non è vincolante: puoi decidere di non procedere senza alcun costo.</p>`,
      },
      {
        title: "Definire le priorità",
        content: `<p>Prima di partire con le visite, fai una lista chiara delle tue priorità dividendole in <strong>irrinunciabili</strong> e <strong>desiderabili</strong>. Questo ti eviterà di perdere tempo su immobili inadatti.</p>
<p>Criteri da valutare:</p>
<ul>
  <li><strong>Zona:</strong> vicinanza a lavoro, scuole, trasporti, servizi</li>
  <li><strong>Metratura:</strong> superficie commerciale vs calpestabile (differenza tipica 10-15%)</li>
  <li><strong>Piano:</strong> piano terra (giardino, umidità), intermedio (comodo), ultimo (luce, caldo estivo)</li>
  <li><strong>Stato:</strong> da ristrutturare (prezzo basso, costi extra 500-1.200 euro/mq), abitabile, ristrutturato</li>
  <li><strong>Ascensore:</strong> essenziale dal terzo piano in su, soprattutto per rivendibilità</li>
  <li><strong>Box auto:</strong> singolo, doppio, posto auto, passo carrabile</li>
  <li><strong>Esposizione:</strong> sud/sud-ovest è ideale per luce naturale</li>
  <li><strong>Classe energetica:</strong> A/B costi bassi, G/F interventi costosi in vista</li>
</ul>`,
      },
      {
        title: "Canali di ricerca",
        content: `<p>Non limitarti a un solo canale. Più fonti esplori, più possibilità hai di trovare l'immobile giusto al prezzo giusto.</p>
<ul>
  <li><strong>Portali online:</strong> Immobiliare.it, Idealista, Casa.it, Subito.it. Con GetNearMe puoi analizzare ogni annuncio direttamente dal portale</li>
  <li><strong>Agenzie immobiliari:</strong> conoscono il mercato locale, spesso hanno immobili in esclusiva non pubblicati online</li>
  <li><strong>Aste giudiziarie:</strong> prezzi inferiori al mercato (20-40% in meno), ma tempi lunghi, burocrazia complessa e nessuna garanzia sullo stato dell'immobile</li>
  <li><strong>Passaparola:</strong> fai sapere a parenti, amici e colleghi che cerchi casa. Molte vendite avvengono prima della pubblicazione online</li>
  <li><strong>Costruttori:</strong> cantieri nuovi, possibilità di personalizzazione, IVA al 4% (prima casa) anziché imposta di registro</li>
</ul>`,
      },
      {
        title: "Cosa verificare durante le visite",
        content: `<p>Una visita attenta può farti risparmiare migliaia di euro. Ecco cosa controllare in ogni immobile:</p>
<ul>
  <li><strong>Umidità:</strong> macchie sui muri (soprattutto angoli bassi), odore di muffa, condensa sui vetri</li>
  <li><strong>Crepe:</strong> crepe orizzontali o diagonali possono indicare problemi strutturali. Crepe verticali sottili sono spesso da assestamento</li>
  <li><strong>Impianti:</strong> chiedi l'anno di rifacimento di impianto elettrico, idraulico e riscaldamento. Impianti ante 1990 probabilmente da rifare (5.000-15.000 euro)</li>
  <li><strong>Esposizione:</strong> visita a ore diverse per capire la luce naturale. Finestre a nord = poca luce diretta</li>
  <li><strong>Parti comuni:</strong> stato del condominio, ascensore, facciata, tetto. Lavori straordinari deliberati = spese extra</li>
  <li><strong>APE (Attestato Prestazione Energetica):</strong> classe G/F significa bollette alte e obbligo di interventi futuri (Direttiva UE Case Green)</li>
  <li><strong>Rumore:</strong> verifica isolamento acustico, traffico, vicini. Visita in orari diversi</li>
</ul>`,
      },
    ],
    checklist: [
      "Ho calcolato il budget totale (prezzo + 10-15% spese)",
      "Ho richiesto la pre-delibera di mutuo",
      "Ho definito le priorità irrinunciabili vs desiderabili",
      "Ho attivato le ricerche su almeno 2 portali",
      "Ho preparato una lista di controllo per le visite",
    ],
  },
  {
    slug: "proposta-acquisto",
    title: "La proposta d'acquisto",
    seoTitle: "Proposta d'acquisto casa: guida e clausole 2026",
    seoDescription:
      "Come funziona la proposta d'acquisto immobiliare: contenuto, clausola sospensiva, caparra confirmatoria e penitenziale. Guida completa.",
    icon: "FileSignature",
    sections: [
      {
        title: "Cos'è la proposta d'acquisto",
        content: `<p>La proposta d'acquisto è un'<strong>offerta formale scritta</strong> con cui l'acquirente comunica al venditore la volontà di comprare l'immobile a determinate condizioni. È un documento giuridicamente vincolante.</p>
<p>Attenzione al meccanismo: la proposta <strong>vincola solo l'acquirente</strong> dal momento della firma. Il venditore diventa vincolato solo quando <strong>accetta formalmente</strong> la proposta e l'accettazione viene comunicata all'acquirente. Fino a quel momento, il venditore è libero di rifiutare o valutare altre offerte.</p>
<p>Una volta che il venditore accetta, la proposta diventa un contratto a tutti gli effetti e obbliga entrambe le parti.</p>`,
      },
      {
        title: "Contenuto della proposta",
        content: `<p>Una proposta d'acquisto ben scritta deve contenere tutti gli elementi essenziali per evitare ambiguità e problemi futuri:</p>
<ul>
  <li><strong>Dati delle parti:</strong> nome, cognome, codice fiscale, residenza di acquirente e venditore</li>
  <li><strong>Dati catastali:</strong> foglio, particella, subalterno, categoria catastale dell'immobile</li>
  <li><strong>Prezzo offerto:</strong> importo complessivo in cifre e lettere</li>
  <li><strong>Modalità di pagamento:</strong> caparra alla proposta, eventuale acconto al compromesso, saldo al rogito, mutuo</li>
  <li><strong>Termine di accettazione:</strong> 7-15 giorni entro cui il venditore deve accettare o rifiutare</li>
  <li><strong>Data prevista del rogito:</strong> generalmente 60-120 giorni dall'accettazione</li>
  <li><strong>Clausole sospensive:</strong> condizioni al cui verificarsi la proposta diventa efficace (es. ottenimento mutuo)</li>
  <li><strong>Assegno di caparra:</strong> allegato alla proposta, intestato al venditore, incassabile solo dopo l'accettazione</li>
</ul>`,
      },
      {
        title: "La clausola sospensiva per il mutuo",
        content: `<p>Se hai bisogno di un mutuo per acquistare, la clausola sospensiva è <strong>fondamentale</strong>. Senza di essa, se la banca rifiuta il mutuo perdi la caparra.</p>
<p>La clausola sospensiva subordina l'efficacia della proposta all'ottenimento del mutuo entro una certa data. Se la banca rifiuta il finanziamento, la proposta decade automaticamente e la caparra viene restituita integralmente.</p>
<p>Come formularla correttamente:</p>
<ul>
  <li>Specificare l'importo minimo del mutuo necessario</li>
  <li>Indicare un termine realistico (45-60 giorni dall'accettazione)</li>
  <li>Prevedere che il rifiuto va comunicato con documentazione della banca</li>
  <li>Stabilire che la caparra è depositata presso l'agenzia (non al venditore) fino al verificarsi della condizione</li>
</ul>
<p>Alcuni venditori e agenzie cercano di evitare questa clausola. Non cedere: è il tuo principale strumento di tutela.</p>`,
      },
      {
        title: "Caparra confirmatoria e penitenziale",
        content: `<p>La caparra è la somma versata dall'acquirente al momento della proposta o del compromesso. Esistono due tipi con conseguenze molto diverse:</p>
<h3>Caparra confirmatoria (art. 1385 c.c.)</h3>
<p>È la forma più comune e più tutelante. Funziona così:</p>
<ul>
  <li>Se l'<strong>acquirente si ritira</strong>: perde la caparra versata</li>
  <li>Se il <strong>venditore si ritira</strong>: deve restituire il doppio della caparra</li>
  <li>La parte non inadempiente può anche chiedere l'<strong>esecuzione forzata del contratto</strong> (art. 2932 c.c.) oppure il <strong>risarcimento dei danni</strong> se superiori alla caparra</li>
</ul>
<h3>Caparra penitenziale (art. 1386 c.c.)</h3>
<p>Funziona come "prezzo del recesso":</p>
<ul>
  <li>Chi si ritira perde la caparra (acquirente) o restituisce il doppio (venditore)</li>
  <li><strong>Non è possibile</strong> chiedere l'esecuzione forzata né il risarcimento danni ulteriore</li>
  <li>È quindi meno tutelante per la parte adempiente</li>
</ul>
<h3>Importo tipico</h3>
<p>La caparra è generalmente pari al <strong>5-10% del prezzo</strong> di acquisto. Non esiste un importo obbligatorio per legge, ma importi troppo bassi riducono la tutela e importi troppo alti aumentano il rischio per l'acquirente.</p>`,
      },
    ],
    checklist: [
      "Ho preparato la proposta scritta con tutti i dati necessari",
      "Ho inserito la clausola sospensiva per il mutuo",
      "Ho definito tipo e importo della caparra",
      "Ho fissato un termine di accettazione (7-15 giorni)",
      "Ho indicato la data prevista del rogito",
    ],
  },
  {
    slug: "compromesso",
    title: "Il compromesso (preliminare)",
    seoTitle: "Compromesso casa: guida al preliminare di vendita",
    seoDescription:
      "Contratto preliminare di compravendita: differenze con la proposta, registrazione, trascrizione, imposte. Tutto quello che devi sapere.",
    icon: "Handshake",
    sections: [
      {
        title: "Cos'è il compromesso",
        content: `<p>Il compromesso, o <strong>contratto preliminare di compravendita</strong>, è un contratto bilaterale con cui venditore e acquirente si obbligano reciprocamente a stipulare il rogito notarile entro una data concordata. Ha pieno valore legale.</p>
<p>A differenza della proposta d'acquisto (che è unilaterale fino all'accettazione), il compromesso nasce già come accordo di entrambe le parti e contiene tutti i dettagli della futura vendita.</p>
<p>Il suo fondamento giuridico è l'<strong>art. 2932 del Codice Civile</strong>: se una delle parti si rifiuta di stipulare il rogito, l'altra può ottenere una sentenza che produce gli stessi effetti del contratto non concluso (esecuzione in forma specifica).</p>`,
      },
      {
        title: "Differenze con la proposta d'acquisto",
        content: `<table>
  <thead>
    <tr><th>Aspetto</th><th>Proposta d'acquisto</th><th>Compromesso</th></tr>
  </thead>
  <tbody>
    <tr><td>Natura</td><td>Dichiarazione unilaterale</td><td>Contratto bilaterale</td></tr>
    <tr><td>Vincolatività</td><td>Solo acquirente (fino all'accettazione)</td><td>Entrambe le parti da subito</td></tr>
    <tr><td>Contenuto</td><td>Elementi essenziali</td><td>Dettaglio completo (termini, penali, planimetrie)</td></tr>
    <tr><td>Registrazione</td><td>Obbligatoria se accettata</td><td>Sempre obbligatoria</td></tr>
    <tr><td>Trascrizione</td><td>Non prevista</td><td>Facoltativa ma consigliata</td></tr>
  </tbody>
</table>
<p>In molti casi, quando la proposta d'acquisto viene accettata e contiene tutti i dettagli necessari, funziona già come preliminare. Tuttavia, è buona prassi stipulare un compromesso separato, soprattutto per compravendite complesse.</p>`,
      },
      {
        title: "Registrazione obbligatoria",
        content: `<p>Il compromesso va <strong>registrato presso l'Agenzia delle Entrate</strong> entro:</p>
<ul>
  <li><strong>20 giorni</strong> dalla firma se redatto come scrittura privata</li>
  <li><strong>30 giorni</strong> dalla firma se redatto dal notaio (atto pubblico o scrittura privata autenticata)</li>
</ul>
<p>La registrazione è un obbligo fiscale. Se non viene effettuata, si applicano sanzioni dal 120% al 240% dell'imposta dovuta.</p>
<h3>Imposte di registrazione</h3>
<table>
  <thead>
    <tr><th>Voce</th><th>Importo</th></tr>
  </thead>
  <tbody>
    <tr><td>Imposta di registro sulla caparra confirmatoria</td><td>0,50% della caparra</td></tr>
    <tr><td>Imposta di registro su acconti prezzo</td><td>3% dell'acconto</td></tr>
    <tr><td>Imposta di bollo</td><td>16 euro ogni 4 facciate (o 100 righe)</td></tr>
  </tbody>
</table>
<p>Le imposte versate al compromesso vengono <strong>detratte</strong> da quelle dovute al rogito, quindi non si pagano due volte.</p>`,
      },
      {
        title: "Trascrizione: facoltativa ma consigliata",
        content: `<p>La <strong>trascrizione</strong> del compromesso nei Registri Immobiliari è facoltativa, richiede un atto notarile e costa circa 500-1.000 euro in più. Perché farla?</p>
<p>La trascrizione ti protegge da:</p>
<ul>
  <li><strong>Doppia vendita:</strong> il venditore vende a un terzo dopo aver firmato il compromesso con te. Con la trascrizione, il tuo diritto prevale</li>
  <li><strong>Ipoteche successive:</strong> se dopo il compromesso il venditore contrae debiti e l'immobile viene ipotecato, la trascrizione ti protegge</li>
  <li><strong>Pignoramenti:</strong> creditori del venditore non possono aggredire l'immobile se il compromesso è trascritto</li>
</ul>
<p>La trascrizione ha effetto per <strong>3 anni</strong> dalla data concordata per il rogito (e comunque non oltre 1 anno dalla scadenza). È particolarmente consigliata quando il rogito è previsto a distanza di mesi o quando l'importo dell'affare è elevato.</p>`,
      },
    ],
    checklist: [
      "Ho firmato il compromesso con tutti i dettagli",
      "Ho registrato il compromesso all'Agenzia delle Entrate",
      "Ho valutato la trascrizione nei Registri Immobiliari",
      "Ho pagato le imposte di registrazione (bollo + registro)",
    ],
  },
  {
    slug: "documenti-acquirente",
    title: "Documenti dell'acquirente",
    seoTitle: "Documenti acquirente per comprare casa in Italia",
    seoDescription:
      "Tutti i documenti che servono all'acquirente per comprare casa: carta d'identità, stato civile, codice fiscale, convenzioni matrimoniali e dove ottenerli.",
    icon: "UserCheck",
    sections: [
      {
        title: "Documenti obbligatori per la compravendita",
        content: `<p>Per firmare la proposta, il compromesso e il rogito notarile devi avere questi documenti:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Note</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Carta d'identità</strong> (in corso di validità)</td><td>Comune di residenza</td><td>Entrambi i coniugi se in comunione dei beni. Il notaio ne richiede una copia per l'atto</td></tr>
    <tr><td><strong>Codice fiscale</strong> / tessera sanitaria</td><td>Agenzia delle Entrate</td><td>Necessario per il calcolo delle imposte e la registrazione degli atti</td></tr>
    <tr><td><strong>Certificato di stato civile</strong></td><td>Comune di residenza</td><td>Indica se sei celibe/nubile, coniugato, vedovo o divorziato. Il notaio lo verifica per determinare il regime patrimoniale</td></tr>
    <tr><td><strong>Estratto per riassunto dell'atto di matrimonio</strong></td><td>Comune dove è stato celebrato il matrimonio</td><td>Solo se coniugati. Serve per verificare il regime patrimoniale (comunione o separazione dei beni)</td></tr>
    <tr><td><strong>Convenzioni matrimoniali</strong></td><td>Notaio che le ha stipulate</td><td>Solo se hai scelto la separazione dei beni o un regime diverso da quello legale</td></tr>
    <tr><td><strong>Permesso di soggiorno</strong></td><td>Questura</td><td>Solo per cittadini extra-UE. Deve essere in corso di validità al momento del rogito</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Regime patrimoniale: perché è importante",
        content: `<p>Il regime patrimoniale del matrimonio determina chi risulterà proprietario dell'immobile:</p>
<ul>
  <li><strong>Comunione dei beni</strong> (regime legale): l'immobile acquistato durante il matrimonio diventa automaticamente proprietà di entrambi i coniugi al 50%, anche se firma e paga uno solo. Entrambi devono essere presenti al rogito</li>
  <li><strong>Separazione dei beni</strong>: l'immobile è intestato solo a chi lo acquista. L'altro coniuge non deve presenziare al rogito, ma il notaio verificherà comunque le convenzioni matrimoniali</li>
</ul>
<p><strong>Consiglio pratico:</strong> se sei coniugato in comunione dei beni e vuoi intestare l'immobile solo a te, il coniuge dovrà comunque firmare al rogito per autorizzare l'acquisto esclusivo.</p>`,
      },
      {
        title: "Documenti aggiuntivi per casi particolari",
        content: `<p>In alcune situazioni servono documenti extra:</p>
<table>
  <thead>
    <tr><th>Situazione</th><th>Documento aggiuntivo</th><th>Dove ottenerlo</th></tr>
  </thead>
  <tbody>
    <tr><td>Acquisto tramite società</td><td>Visura camerale + delibera CdA/assemblea</td><td>Camera di Commercio</td></tr>
    <tr><td>Acquisto con delega</td><td>Procura notarile speciale</td><td>Notaio</td></tr>
    <tr><td>Separazione/divorzio in corso</td><td>Sentenza di separazione/divorzio + omologazione</td><td>Tribunale</td></tr>
    <tr><td>Acquisto per figlio minore</td><td>Autorizzazione del Giudice Tutelare</td><td>Tribunale</td></tr>
    <tr><td>Under 36 con agevolazioni</td><td>ISEE in corso di validità (sotto 40.000€)</td><td>CAF o INPS online</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Tempistiche e consigli",
        content: `<p>Prepara i documenti con anticipo per evitare ritardi:</p>
<ul>
  <li><strong>Carta d'identità:</strong> se scaduta, il rinnovo richiede 1-3 settimane (prenotazione al Comune)</li>
  <li><strong>Certificato di stato civile:</strong> richiedibile online in molti Comuni, rilascio in 2-5 giorni</li>
  <li><strong>Estratto atto di matrimonio:</strong> se il matrimonio è stato celebrato in un Comune diverso da quello di residenza, calcola 1-2 settimane</li>
  <li><strong>ISEE:</strong> per il Fondo Consap under 36, richiedi l'ISEE corrente al CAF almeno 2 settimane prima della domanda di mutuo</li>
</ul>
<p><strong>Suggerimento:</strong> crea una cartella (fisica o digitale) con tutti i documenti organizzati. Ne avrai bisogno in più momenti: proposta, compromesso, banca e rogito.</p>`,
      },
    ],
    checklist: [
      "Ho la carta d'identità in corso di validità",
      "Ho il codice fiscale / tessera sanitaria",
      "Ho il certificato di stato civile",
      "Ho l'estratto atto di matrimonio (se coniugato)",
      "Ho le convenzioni matrimoniali (se in separazione dei beni)",
      "Ho creato una cartella con tutti i documenti organizzati",
    ],
  },
  {
    slug: "documenti-venditore",
    title: "Documenti del venditore",
    seoTitle: "Documenti del venditore per vendere casa: cosa verificare",
    seoDescription:
      "Checklist completa dei documenti che il venditore deve fornire: visura catastale, APE, titoli edilizi, conformità urbanistica e cosa controllare.",
    icon: "FileSearch",
    sections: [
      {
        title: "Documenti sulla proprietà",
        content: `<p>Questi documenti provano che il venditore è il legittimo proprietario e che l'immobile è libero da vincoli:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Cosa verificare</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Atto di provenienza</strong></td><td>Notaio che ha stipulato l'ultimo passaggio</td><td>Come il venditore è diventato proprietario: acquisto, donazione, successione, assegnazione. <strong>Attenzione alle donazioni:</strong> gli eredi legittimari possono impugnare entro 20 anni</td></tr>
    <tr><td><strong>Visura catastale</strong></td><td>Agenzia delle Entrate (online su sister.agenziaentrate.gov.it o sportello)</td><td>Intestazione corretta al venditore, rendita catastale (serve per calcolare le imposte), categoria catastale, consistenza (vani o mq)</td></tr>
    <tr><td><strong>Visura ipotecaria</strong></td><td>Conservatoria dei Registri Immobiliari / Agenzia delle Entrate online</td><td>Assenza di ipoteche (anche residue da mutui estinti), pignoramenti, sequestri, trascrizioni pregiudizievoli. Se c'è un'ipoteca da mutuo, deve essere cancellata al rogito</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Documenti catastali e urbanistici",
        content: `<p>Questi sono i documenti più critici. La conformità catastale e urbanistica è obbligatoria per il rogito:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Cosa verificare</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Planimetria catastale</strong></td><td>Agenzia delle Entrate (online o sportello)</td><td>Deve corrispondere <strong>esattamente</strong> allo stato reale dell'immobile. Se non corrisponde, il rogito non si può stipulare (D.L. 78/2010). Costo aggiornamento (DOCFA): 300-600€</td></tr>
    <tr><td><strong>Titoli edilizi</strong></td><td>Comune, Ufficio Tecnico / Archivio Edilizio</td><td>Licenza edilizia, concessione, permesso di costruire, DIA, SCIA, CILA, eventuali condoni. Lo stato attuale deve corrispondere ai titoli. <strong>Questa è la verifica più importante:</strong> la conformità catastale NON garantisce la conformità urbanistica</td></tr>
    <tr><td><strong>Certificato di agibilità</strong> (ex abitabilità)</td><td>Comune, Sportello Unico per l'Edilizia</td><td>Attesta che l'immobile rispetta sicurezza, igiene, salubrità e risparmio energetico. Per immobili molto vecchi potrebbe non esistere</td></tr>
    <tr><td><strong>CDU</strong> (Certificato Destinazione Urbanistica)</td><td>Comune</td><td>Obbligatorio solo per terreni o immobili con area pertinenziale superiore a 5.000 mq</td></tr>
  </tbody>
</table>
<p><strong>Consiglio fondamentale:</strong> incarica un geometra o tecnico abilitato per verificare la conformità urbanistica PRIMA del compromesso. Costa 300-800€ ma può salvarti da problemi molto più costosi.</p>`,
      },
      {
        title: "Certificazioni e attestati",
        content: `<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Cosa verificare</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>APE</strong> (Attestato Prestazione Energetica)</td><td>Tecnico certificatore abilitato (geometra, ingegnere, architetto iscritto)</td><td>Classe energetica da A4 (massima efficienza) a G (minima). Validità 10 anni. Obbligatorio per legge in ogni compravendita. Costo: 150-300€</td></tr>
    <tr><td><strong>Certificazione conformità impianti</strong></td><td>Installatore/tecnico che ha realizzato o certificato l'impianto</td><td>Dichiarazione di conformità per impianto elettrico, idraulico e gas (D.M. 37/2008). Se mancano, la responsabilità passa all'acquirente dopo l'acquisto</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Documenti condominiali",
        content: `<p>Se l'immobile è in condominio, richiedi questi documenti all'amministratore:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Cosa verificare</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Regolamento condominiale</strong></td><td>Vincoli d'uso (divieto attività professionali, animali domestici, B&B), criteri di ripartizione spese, limitazioni alle modifiche</td></tr>
    <tr><td><strong>Dichiarazione dell'amministratore</strong></td><td>Regolarità nei pagamenti delle spese condominiali, delibere di lavori straordinari approvati o previsti, stato del fondo cassa, eventuali cause in corso</td></tr>
    <tr><td><strong>Verbali ultime assemblee</strong></td><td>Lavori straordinari deliberati (rifacimento facciata, tetto, ascensore), contenziosi, situazione morosità condominiale</td></tr>
  </tbody>
</table>
<p><strong>Attenzione:</strong> le spese condominiali dell'anno in corso e dell'anno precedente sono solidalmente a carico dell'acquirente (art. 63 disp. att. c.c.). Se il venditore ha arretrati, potresti doverli pagare tu.</p>`,
      },
    ],
    checklist: [
      "Ho verificato l'atto di provenienza del venditore",
      "Ho controllato la visura catastale (intestazione corretta)",
      "Ho fatto la visura ipotecaria (no ipoteche/pignoramenti)",
      "Ho verificato la conformità della planimetria catastale",
      "Ho fatto controllare la conformità urbanistica da un tecnico",
      "Ho l'APE (Attestato Prestazione Energetica)",
      "Ho la dichiarazione dell'amministratore di condominio",
      "Ho letto i verbali delle ultime assemblee condominiali",
    ],
  },
  {
    slug: "documenti-mutuo",
    title: "Documenti per il mutuo",
    seoTitle: "Documenti per il mutuo casa: lista completa per la banca",
    seoDescription:
      "Tutti i documenti richiesti dalla banca per il mutuo: dipendenti, autonomi, liberi professionisti. Lista completa con tempistiche e consigli.",
    icon: "FileStack",
    sections: [
      {
        title: "Documenti personali",
        content: `<p>La banca richiede questi documenti a tutti i richiedenti, indipendentemente dalla professione:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Note</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Carta d'identità</strong> in corso di validità</td><td>Comune</td><td>Di tutti i richiedenti e eventuali garanti</td></tr>
    <tr><td><strong>Codice fiscale</strong> / tessera sanitaria</td><td>Agenzia delle Entrate</td><td></td></tr>
    <tr><td><strong>Certificato di residenza</strong></td><td>Comune o autocertificazione</td><td></td></tr>
    <tr><td><strong>Certificato di stato civile</strong></td><td>Comune o autocertificazione</td><td>Se coniugati: estratto atto di matrimonio con annotazioni</td></tr>
    <tr><td><strong>Sentenza di separazione/divorzio</strong></td><td>Tribunale</td><td>Solo se applicabile, con omologazione</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Documenti reddituali per lavoratori dipendenti",
        content: `<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Dettagli</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Ultime 2-3 buste paga</strong></td><td>Datore di lavoro / portale aziendale</td><td>Alcune banche ne richiedono 3, soprattutto se il reddito è variabile (straordinari, provvigioni)</td></tr>
    <tr><td><strong>CU</strong> (Certificazione Unica)</td><td>Datore di lavoro</td><td>Dell'ultimo anno. Sostituisce il vecchio CUD</td></tr>
    <tr><td><strong>Dichiarazione dei redditi</strong> (730 o Modello Redditi)</td><td>CAF o commercialista</td><td>Degli ultimi 2 anni, con ricevuta di presentazione</td></tr>
    <tr><td><strong>Contratto di lavoro</strong></td><td>Datore di lavoro</td><td>Particolarmente importante se a tempo determinato: la banca valuterà la data di scadenza e le possibilità di rinnovo</td></tr>
    <tr><td><strong>Dichiarazione del datore di lavoro</strong></td><td>Ufficio HR</td><td>Alcune banche la richiedono per confermare anzianità di servizio, tipo di contratto e assenza di procedimenti disciplinari</td></tr>
    <tr><td><strong>Estratto conto bancario</strong></td><td>Home banking</td><td>Ultimi 3-6 mesi. La banca verifica la capacità di risparmio e l'assenza di situazioni critiche (conti in rosso, finanziamenti non dichiarati)</td></tr>
  </tbody>
</table>
<p><strong>Consiglio:</strong> se hai un contratto a tempo determinato, la banca potrebbe richiedere un garante (fideiussore). Preparalo in anticipo.</p>`,
      },
      {
        title: "Documenti reddituali per autonomi e liberi professionisti",
        content: `<p>Per lavoratori autonomi e liberi professionisti la banca richiede più documentazione, perché il reddito non è fisso:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Dove ottenerlo</th><th>Dettagli</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Modello Redditi PF</strong> (ex Unico)</td><td>Commercialista</td><td>Degli ultimi 2-3 anni con ricevuta di presentazione telematica. La banca calcola la media dei redditi</td></tr>
    <tr><td><strong>Modello F24</strong> versamenti</td><td>Commercialista / Agenzia Entrate</td><td>Conferma il pagamento effettivo delle imposte dichiarate</td></tr>
    <tr><td><strong>Iscrizione Camera di Commercio</strong></td><td>Camera di Commercio (visura camerale)</td><td>Per imprenditori individuali e società. Deve essere attuale</td></tr>
    <tr><td><strong>Iscrizione albo professionale</strong></td><td>Ordine professionale</td><td>Per liberi professionisti (avvocati, ingegneri, medici, commercialisti, ecc.)</td></tr>
    <tr><td><strong>Bilanci societari</strong></td><td>Commercialista</td><td>Ultimi 2-3 anni. Solo per titolari di società (SRL, SAS, SNC)</td></tr>
    <tr><td><strong>Estratti conto bancari</strong></td><td>Home banking</td><td>Ultimi 6-12 mesi (sia conti personali che professionali). La banca verifica il flusso di cassa reale</td></tr>
  </tbody>
</table>
<p><strong>Attenzione:</strong> molti autonomi dichiarano un reddito basso per pagare meno tasse, ma questo riduce l'importo massimo del mutuo ottenibile. La banca si basa sul reddito dichiarato, non sul fatturato.</p>`,
      },
      {
        title: "Documenti sull'immobile (richiesti dalla banca)",
        content: `<p>La banca ha bisogno anche di documentazione sull'immobile per la perizia e l'istruttoria:</p>
<table>
  <thead>
    <tr><th>Documento</th><th>Note</th></tr>
  </thead>
  <tbody>
    <tr><td><strong>Compromesso o proposta accettata</strong></td><td>Deve indicare il prezzo pattuito e le condizioni di pagamento</td></tr>
    <tr><td><strong>Planimetria catastale</strong></td><td>Il perito la confronterà con lo stato reale durante il sopralluogo</td></tr>
    <tr><td><strong>Visura catastale aggiornata</strong></td><td>Per verificare intestazione, rendita e categoria</td></tr>
    <tr><td><strong>Atto di provenienza</strong></td><td>Come il venditore ha acquisito la proprietà</td></tr>
    <tr><td><strong>APE</strong></td><td>La classe energetica può influire sulle condizioni del mutuo (tassi agevolati per classi alte, "mutui green")</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Tempistiche e consigli pratici",
        content: `<p>Prepara tutto prima di andare in banca per velocizzare l'istruttoria:</p>
<ul>
  <li><strong>Raccogli i documenti reddituali 1-2 settimane prima</strong> della richiesta formale di mutuo</li>
  <li><strong>Scarica gli estratti conto</strong> in formato PDF dall'home banking, la banca li accetta così</li>
  <li><strong>Richiedi la CU al datore di lavoro</strong> se non l'hai ancora ricevuta (viene rilasciata entro il 16 marzo di ogni anno)</li>
  <li><strong>Se hai finanziamenti in corso</strong> (auto, prestiti personali), porta i piani di ammortamento. La banca ne terrà conto nel calcolo del rapporto rata/reddito</li>
  <li><strong>Verifica la tua posizione CRIF:</strong> la banca consulterà le centrali rischi. Se hai ritardi nei pagamenti, meglio saperlo prima</li>
  <li><strong>ISEE per agevolazioni under 36:</strong> richiedi l'ISEE corrente al CAF almeno 2 settimane prima. Deve essere inferiore a 40.000€ per accedere al Fondo Consap</li>
</ul>`,
      },
    ],
    checklist: [
      "Ho raccolto documenti personali (identità, codice fiscale, stato civile)",
      "Ho preparato i documenti reddituali (buste paga o Modello Redditi)",
      "Ho scaricato gli estratti conto degli ultimi mesi",
      "Ho verificato la mia posizione CRIF",
      "Ho portato i documenti sull'immobile alla banca",
      "Ho richiesto l'ISEE se under 36 (per Fondo Consap)",
    ],
  },
  {
    slug: "mutuo",
    title: "Il mutuo",
    seoTitle: "Mutuo prima casa Italia: fasi, documenti e Consap",
    seoDescription:
      "Guida completa al mutuo casa: fasi dall'istruttoria al rogito, documenti, LTV, Fondo Garanzia Consap, imposta sostitutiva e assicurazione.",
    icon: "Landmark",
    sections: [
      {
        title: "Le fasi del mutuo",
        content: `<p>Il percorso del mutuo si articola in fasi precise, ciascuna con tempistiche definite:</p>
<table>
  <thead>
    <tr><th>Fase</th><th>Descrizione</th><th>Tempi</th></tr>
  </thead>
  <tbody>
    <tr><td>1. Pre-delibera</td><td>La banca valuta la tua capacità di rimborso e indica l'importo massimo erogabile</td><td>7-15 giorni</td></tr>
    <tr><td>2. Istruttoria</td><td>Raccolta documenti completa, verifica reddituale e creditizia (CRIF/banche dati)</td><td>15-30 giorni</td></tr>
    <tr><td>3. Perizia</td><td>Un perito incaricato dalla banca valuta l'immobile e ne certifica il valore</td><td>7-15 giorni</td></tr>
    <tr><td>4. Delibera</td><td>La banca approva formalmente il mutuo con importo, tasso e condizioni definitive</td><td>5-10 giorni</td></tr>
    <tr><td>5. Stipula</td><td>Firma dell'atto di mutuo dal notaio, contestualmente al rogito di compravendita</td><td>10-15 giorni dalla delibera</td></tr>
  </tbody>
</table>
<p><strong>Tempo totale:</strong> dai 45 ai 90 giorni dalla prima richiesta alla stipula. Tienine conto quando concordi la data del rogito nel compromesso.</p>`,
      },
      {
        title: "Parametri chiave del mutuo",
        content: `<p>Ogni banca applica criteri standard per decidere se e quanto prestarti:</p>
<ul>
  <li><strong>LTV (Loan To Value):</strong> rapporto tra mutuo e valore dell'immobile. Il massimo standard è l'<strong>80%</strong>. Per ottenere un mutuo al 100% serve la garanzia Consap</li>
  <li><strong>Rapporto rata/reddito:</strong> la rata mensile non deve superare il <strong>30-35%</strong> del reddito netto familiare</li>
  <li><strong>Durata:</strong> da 10 a 30 anni. Durate più lunghe riducono la rata ma aumentano significativamente gli interessi totali</li>
  <li><strong>Tasso fisso vs variabile:</strong> il fisso garantisce rata costante per tutta la durata. Il variabile segue l'Euribor e può salire o scendere</li>
  <li><strong>TAEG:</strong> il Tasso Annuo Effettivo Globale include tutti i costi (interessi, spese istruttoria, perizia, assicurazione obbligatoria). È il numero da confrontare tra diverse offerte</li>
</ul>`,
      },
      {
        title: "Fondo Garanzia Prima Casa (Consap)",
        content: `<p>Il <strong>Fondo di Garanzia per la Prima Casa</strong>, gestito da Consap, è uno strumento statale che facilita l'accesso al mutuo, soprattutto per i giovani. Il fondo è stato prorogato fino al <strong>31 dicembre 2027</strong>.</p>
<h3>Come funziona</h3>
<p>Lo Stato garantisce una parte del mutuo al posto tuo, riducendo il rischio per la banca. La garanzia è del:</p>
<ul>
  <li><strong>50%</strong> della quota capitale per tutti i richiedenti</li>
  <li><strong>80%</strong> della quota capitale per le categorie prioritarie con ISEE fino a 40.000 euro</li>
</ul>
<h3>Categorie prioritarie</h3>
<ul>
  <li>Giovani under 36</li>
  <li>Giovani coppie (almeno un componente sotto i 36 anni)</li>
  <li>Famiglie monogenitoriali con figli minori</li>
  <li>Conduttori di alloggi IACP (case popolari)</li>
</ul>
<h3>Requisiti</h3>
<ul>
  <li>ISEE non superiore a 40.000 euro annui (per la garanzia all'80%)</li>
  <li>Mutuo non superiore a 250.000 euro</li>
  <li>L'immobile non deve essere di lusso (categorie A1, A8, A9)</li>
  <li>Non essere proprietario di altri immobili a uso abitativo</li>
</ul>`,
      },
      {
        title: "Imposta sostitutiva e assicurazione",
        content: `<p>Oltre al costo del mutuo stesso, ci sono due voci obbligatorie da considerare:</p>
<h3>Imposta sostitutiva</h3>
<p>Si paga una tantum al momento della stipula del mutuo:</p>
<ul>
  <li><strong>0,25%</strong> dell'importo del mutuo per l'acquisto della <strong>prima casa</strong></li>
  <li><strong>2%</strong> dell'importo del mutuo per la <strong>seconda casa</strong></li>
</ul>
<p>Esempio: su un mutuo di 150.000 euro per la prima casa, l'imposta sostitutiva è di 375 euro.</p>
<h3>Assicurazione incendio e scoppio</h3>
<p>L'assicurazione <strong>incendio e scoppio</strong> sull'immobile è <strong>obbligatoria</strong> per legge quando si accende un mutuo. Copre i danni all'immobile da incendio, fulmine, esplosione e scoppio.</p>
<p>Puoi sottoscriverla con la compagnia proposta dalla banca oppure con una polizza esterna (spesso più conveniente). La banca non può obbligarti a scegliere la loro polizza.</p>
<p>Altre assicurazioni (vita, perdita impiego) possono essere proposte ma <strong>non sono obbligatorie</strong>.</p>`,
      },
    ],
    checklist: [
      "Ho ottenuto la pre-delibera di mutuo",
      "Ho completato l'istruttoria con tutti i documenti",
      "Il perito ha effettuato la valutazione dell'immobile",
      "Ho ricevuto la delibera formale dalla banca",
      "Ho confrontato il TAEG tra diverse offerte",
      "Ho valutato il Fondo Garanzia Consap (se applicabile)",
      "Ho sottoscritto l'assicurazione incendio e scoppio",
    ],
  },
  {
    slug: "rogito-notarile",
    title: "Il rogito notarile",
    seoTitle: "Rogito notarile: cosa succede e quanto costa",
    seoDescription:
      "Come funziona il rogito notarile: atto pubblico, ruolo del notaio, firme, pagamento, consegna chiavi. Costi indicativi e consigli pratici.",
    icon: "Scale",
    sections: [
      {
        title: "Cos'è il rogito",
        content: `<p>Il rogito (o atto di compravendita) è l'<strong>atto pubblico</strong> stipulato dal notaio con cui la proprietà dell'immobile passa definitivamente dal venditore all'acquirente. È il momento in cui diventi proprietario a tutti gli effetti.</p>
<p>Il rogito ha <strong>valore di prova legale</strong> fino a querela di falso, il che significa che quanto scritto nell'atto si presume vero e può essere contestato solo in sede penale.</p>`,
      },
      {
        title: "Cosa succede durante il rogito",
        content: `<p>Il giorno del rogito, presso lo studio del notaio, avvengono diversi passaggi in sequenza:</p>
<ul>
  <li><strong>Verifica identità:</strong> il notaio controlla i documenti di tutte le parti presenti</li>
  <li><strong>Lettura dell'atto:</strong> il notaio legge integralmente l'atto di compravendita ad alta voce. Questa lettura è obbligatoria per legge</li>
  <li><strong>Firme:</strong> acquirente, venditore (e eventuali garanti/procuratori) firmano l'atto</li>
  <li><strong>Pagamento del saldo:</strong> l'acquirente consegna l'assegno circolare o la conferma del bonifico per il saldo del prezzo</li>
  <li><strong>Stipula mutuo contestuale:</strong> se previsto, si firma anche l'atto di mutuo con il funzionario della banca presente</li>
  <li><strong>Pagamento imposte:</strong> il notaio raccoglie le imposte dovute, che verserà per tuo conto</li>
  <li><strong>Consegna chiavi:</strong> il venditore consegna tutte le chiavi dell'immobile</li>
  <li><strong>Registrazione e trascrizione:</strong> il notaio provvede alla registrazione (entro 30 giorni) e alla trascrizione nei Registri Immobiliari</li>
</ul>`,
      },
      {
        title: "La scelta del notaio",
        content: `<p>La scelta del notaio <strong>spetta all'acquirente</strong>, che è anche chi paga l'onorario. Il venditore non può imporre il proprio notaio.</p>
<p>Consigli per la scelta:</p>
<ul>
  <li>Chiedi preventivi a 2-3 notai: le tariffe non sono fisse e possono variare anche del 30-40%</li>
  <li>Verifica la specializzazione in diritto immobiliare</li>
  <li>Assicurati che il notaio sia disponibile per la data prevista del rogito</li>
  <li>Un buon notaio è anche un consulente: spiega le clausole, segnala rischi, propone soluzioni</li>
</ul>`,
      },
      {
        title: "Il ruolo del notaio",
        content: `<p>Il notaio non è un semplice "certificatore di firme". Ha funzioni fondamentali per la tutela dell'acquirente:</p>
<ul>
  <li><strong>Verifica della proprietà:</strong> accerta che il venditore sia effettivamente il proprietario legittimo</li>
  <li><strong>Controllo ipoteche:</strong> verifica che l'immobile sia libero da ipoteche, pignoramenti e altri gravami</li>
  <li><strong>Conformità catastale:</strong> accerta che la planimetria catastale corrisponda allo stato reale dell'immobile (obbligatorio dal 2010)</li>
  <li><strong>Legalità dell'atto:</strong> garantisce che il contratto rispetti tutte le norme di legge</li>
  <li><strong>Raccolta imposte:</strong> incassa le imposte di registro, ipotecaria e catastale e le versa allo Stato</li>
  <li><strong>Trascrizione:</strong> trascrive l'atto nei Registri Immobiliari, rendendo opponibile l'acquisto a terzi</li>
</ul>`,
      },
      {
        title: "Costi del notaio",
        content: `<p>L'onorario del notaio varia in base al valore dell'immobile, alla complessità dell'atto e alla zona. Ecco le fasce indicative (onorario + spese, escluse imposte):</p>
<table>
  <thead>
    <tr><th>Valore immobile</th><th>Costo notaio indicativo</th></tr>
  </thead>
  <tbody>
    <tr><td>Fino a 100.000 euro</td><td>2.000-3.000 euro</td></tr>
    <tr><td>100.000-200.000 euro</td><td>3.000-4.000 euro</td></tr>
    <tr><td>200.000-300.000 euro</td><td>3.500-5.000 euro</td></tr>
    <tr><td>Oltre 300.000 euro</td><td>5.000+ euro</td></tr>
  </tbody>
</table>
<p>Se acquisti con mutuo, il notaio redige anche l'atto di mutuo: il costo complessivo aumenta di circa 500-1.500 euro.</p>`,
      },
    ],
    checklist: [
      "Ho scelto il notaio e chiesto il preventivo",
      "Ho verificato che il notaio sia disponibile per la data del rogito",
      "Ho preparato l'assegno circolare per il saldo",
      "Ho confermato la presenza del funzionario bancario (se mutuo)",
      "Ho ricevuto le chiavi dell'immobile",
    ],
  },
  {
    slug: "costi-e-tasse",
    title: "Costi e tasse",
    seoTitle: "Costi e tasse acquisto casa Italia: calcolo completo",
    seoDescription:
      "Imposte, notaio, agenzia, mutuo: tutti i costi per comprare casa in Italia. Calcolo prezzo-valore, agevolazioni prima casa, IVA e registro.",
    icon: "Calculator",
    sections: [
      {
        title: "Imposte acquisto da privato",
        content: `<p>Quando acquisti da un privato (o da un'impresa che vende un immobile costruito da più di 5 anni senza opzione IVA), si applicano le seguenti imposte:</p>
<table>
  <thead>
    <tr><th>Imposta</th><th>Prima casa</th><th>Seconda casa</th></tr>
  </thead>
  <tbody>
    <tr><td>Imposta di registro</td><td>2% (minimo 1.000 euro)</td><td>9% (minimo 1.000 euro)</td></tr>
    <tr><td>Imposta ipotecaria</td><td>50 euro (fissa)</td><td>50 euro (fissa)</td></tr>
    <tr><td>Imposta catastale</td><td>50 euro (fissa)</td><td>50 euro (fissa)</td></tr>
  </tbody>
</table>
<p>Per la prima casa, l'imposta di registro al 2% si calcola sul <strong>valore catastale</strong> (sistema prezzo-valore), non sul prezzo dichiarato in atto. Questo è quasi sempre vantaggioso.</p>`,
      },
      {
        title: "Imposte acquisto da impresa",
        content: `<p>Quando acquisti da un'impresa costruttrice (entro 5 anni dalla costruzione/ristrutturazione, oppure con opzione IVA), si applicano:</p>
<table>
  <thead>
    <tr><th>Imposta</th><th>Prima casa</th><th>Seconda casa</th></tr>
  </thead>
  <tbody>
    <tr><td>IVA</td><td>4%</td><td>10%</td></tr>
    <tr><td>Imposta di registro</td><td>200 euro (fissa)</td><td>200 euro (fissa)</td></tr>
    <tr><td>Imposta ipotecaria</td><td>200 euro (fissa)</td><td>200 euro (fissa)</td></tr>
    <tr><td>Imposta catastale</td><td>200 euro (fissa)</td><td>200 euro (fissa)</td></tr>
  </tbody>
</table>
<p>Attenzione: l'IVA si calcola sul <strong>prezzo di vendita dichiarato</strong>, non sul valore catastale. Questo rende l'acquisto da impresa generalmente più costoso in termini fiscali.</p>`,
      },
      {
        title: "Il sistema prezzo-valore",
        content: `<p>Il sistema prezzo-valore consente di calcolare le imposte sulla base del <strong>valore catastale</strong> anziché sul prezzo di vendita. Si applica solo agli acquisti da privato di immobili a uso abitativo.</p>
<h3>Come si calcola il valore catastale</h3>
<p>Il valore catastale si ottiene moltiplicando la rendita catastale rivalutata per un coefficiente:</p>
<ul>
  <li><strong>Prima casa:</strong> rendita catastale x 1,05 x 110 = rendita x <strong>115,5</strong></li>
  <li><strong>Seconda casa:</strong> rendita catastale x 1,05 x 120 = rendita x <strong>126</strong></li>
</ul>
<h3>Esempio pratico</h3>
<p>Immobile con rendita catastale di 800 euro, acquistato come prima casa a 180.000 euro:</p>
<ul>
  <li>Valore catastale: 800 x 115,5 = 92.400 euro</li>
  <li>Imposta di registro: 92.400 x 2% = 1.848 euro</li>
  <li>Imposte ipotecaria + catastale: 50 + 50 = 100 euro</li>
  <li><strong>Totale imposte: 1.948 euro</strong> (anziché 3.600 euro calcolando il 2% su 180.000)</li>
</ul>`,
      },
      {
        title: "Tutte le altre spese",
        content: `<p>Oltre alle imposte, ecco tutte le spese da mettere in conto:</p>
<table>
  <thead>
    <tr><th>Voce</th><th>Costo indicativo</th><th>Note</th></tr>
  </thead>
  <tbody>
    <tr><td>Notaio (atto + mutuo)</td><td>2.000-5.000 euro</td><td>A carico dell'acquirente</td></tr>
    <tr><td>Agenzia immobiliare</td><td>2-5% + IVA 22%</td><td>Sia acquirente che venditore pagano</td></tr>
    <tr><td>Perizia bancaria</td><td>200-400 euro</td><td>Richiesta dalla banca per il mutuo</td></tr>
    <tr><td>Istruttoria mutuo</td><td>0,2-0,5% del mutuo</td><td>Commissione bancaria una tantum</td></tr>
    <tr><td>Imposta sostitutiva mutuo</td><td>0,25% (1a casa) / 2% (2a casa)</td><td>Sull'importo del mutuo erogato</td></tr>
    <tr><td>Assicurazione incendio/scoppio</td><td>Variabile</td><td>Obbligatoria con il mutuo</td></tr>
    <tr><td>Geometra (verifica urbanistica)</td><td>300-800 euro</td><td>Fortemente consigliato prima del compromesso</td></tr>
    <tr><td>APE</td><td>150-300 euro</td><td>A carico del venditore, ma se manca...</td></tr>
    <tr><td>DOCFA (variazione catastale)</td><td>300-600 euro</td><td>Solo se necessario per difformità catastali</td></tr>
  </tbody>
</table>`,
      },
      {
        title: "Agevolazioni prima casa",
        content: `<p>Le agevolazioni prima casa riducono significativamente il carico fiscale. Per accedervi, devi rispettare <strong>tutti</strong> i seguenti requisiti:</p>
<ul>
  <li><strong>L'immobile non deve essere di lusso:</strong> escluse le categorie catastali A1 (abitazioni signorili), A8 (ville), A9 (castelli e palazzi)</li>
  <li><strong>Residenza:</strong> devi trasferire la residenza nel Comune dell'immobile entro <strong>18 mesi</strong> dal rogito</li>
  <li><strong>Non possedere altro immobile nello stesso Comune:</strong> non devi essere titolare (neppure in quote) di un altro immobile acquistato con agevolazioni prima casa nello stesso Comune</li>
  <li><strong>Vendita della precedente prima casa:</strong> se hai già usufruito delle agevolazioni per un altro immobile, devi venderlo entro <strong>2 anni</strong> dal nuovo acquisto</li>
</ul>
<p>Se non rispetti questi requisiti (es. non trasferisci la residenza entro 18 mesi), l'Agenzia delle Entrate recupera la differenza d'imposta più una sanzione del 30% e gli interessi.</p>`,
      },
    ],
    checklist: [
      "Ho calcolato le imposte (registro o IVA)",
      "Ho verificato se posso usare il sistema prezzo-valore",
      "Ho sommato tutte le spese accessorie (notaio, agenzia, perizia)",
      "Ho verificato i requisiti per le agevolazioni prima casa",
      "Ho calcolato il costo totale reale dell'acquisto",
    ],
  },
  {
    slug: "errori-da-evitare",
    title: "Errori da evitare",
    seoTitle: "Errori acquisto casa: 8 trappole da evitare",
    seoDescription:
      "Gli errori più gravi nell'acquisto di casa: abusi edilizi, donazioni, ipoteche, difformità catastali, spese condominiali. Come proteggerti.",
    icon: "ShieldAlert",
    sections: [
      {
        title: "Abusi edilizi",
        content: `<p>Anche una semplice <strong>parete spostata</strong> rispetto ai titoli edilizi originali è un abuso. Le conseguenze sono gravi:</p>
<ul>
  <li>L'immobile diventa <strong>invendibile</strong> (il notaio non può rogitare)</li>
  <li>Non è possibile ottenere il mutuo (la banca rifiuta la perizia)</li>
  <li>Blocca futuri interventi edilizi (ristrutturazione, ampliamento, Superbonus)</li>
  <li>L'acquirente diventa responsabile dell'abuso</li>
</ul>
<p><strong>Soluzione:</strong> incarica un geometra o un tecnico abilitato per verificare la <strong>conformità urbanistica e catastale</strong> dell'immobile PRIMA di firmare il compromesso. Il costo (300-800 euro) è irrisorio rispetto ai problemi che previeni.</p>
<p>Se emergono abusi sanabili, la sanatoria ha costi e tempi variabili (da 1.000 a 5.000+ euro, da 2 a 12 mesi). Se l'abuso non è sanabile, non comprare.</p>`,
      },
      {
        title: "Ipoteche e pignoramenti",
        content: `<p>Un immobile può avere <strong>ipoteche</strong> (volontarie, come quelle bancarie, o giudiziali) e <strong>pignoramenti</strong> che l'acquirente potrebbe ereditare.</p>
<p>Come proteggerti:</p>
<ul>
  <li>Richiedi una <strong>visura ipotecaria aggiornata</strong> presso la Conservatoria dei Registri Immobiliari (puoi farla anche online)</li>
  <li>Verifica che eventuali ipoteche bancarie vengano <strong>cancellate al rogito</strong> (il notaio se ne occupa)</li>
  <li>Se ci sono ipoteche giudiziali (per debiti del venditore), pretendi la cancellazione prima del rogito</li>
  <li>In caso di pignoramenti in corso, non procedere all'acquisto</li>
</ul>`,
      },
      {
        title: "Donazioni nella catena di proprietà",
        content: `<p>La donazione è uno dei problemi più insidiosi nel mercato immobiliare italiano. Se l'immobile (o un immobile precedente nella catena) proviene da una <strong>donazione</strong>, ci sono rischi concreti.</p>
<h3>Il problema</h3>
<p>Gli eredi legittimari del donante possono impugnare la donazione con l'<strong>azione di riduzione</strong> entro <strong>20 anni</strong> dalla trascrizione della donazione (o 10 anni dalla morte del donante). Se l'azione ha successo, l'immobile torna nell'asse ereditario e l'acquirente lo perde.</p>
<h3>Conseguenze pratiche</h3>
<ul>
  <li>Le banche spesso <strong>rifiutano il mutuo</strong> su immobili provenienti da donazione recente</li>
  <li>L'acquirente rischia di perdere l'immobile anche anni dopo l'acquisto</li>
</ul>
<h3>Soluzioni possibili</h3>
<ul>
  <li><strong>Polizza assicurativa specifica:</strong> copre il rischio di impugnazione della donazione (costo 1-3% del valore)</li>
  <li><strong>Rinuncia degli eredi:</strong> tutti i legittimari rinunciano formalmente all'azione di riduzione (atto notarile)</li>
  <li><strong>Attendere 20 anni:</strong> dalla trascrizione della donazione, il diritto si prescrive</li>
  <li><strong>Risoluzione consensuale:</strong> il donante e il donatario risolvono la donazione e poi il donante vende direttamente</li>
</ul>`,
      },
      {
        title: "Difformità catastali",
        content: `<p>Dal 2010, la <strong>planimetria catastale deve corrispondere allo stato di fatto</strong> dell'immobile. Se non corrisponde, il notaio non può rogitare.</p>
<p>Difformità comuni:</p>
<ul>
  <li>Tramezzi spostati o rimossi</li>
  <li>Bagno aggiunto</li>
  <li>Terrazza chiusa</li>
  <li>Diversa distribuzione degli ambienti</li>
</ul>
<p><strong>Soluzione:</strong> se la difformità è urbanisticamente legittima (ha un titolo edilizio), basta un aggiornamento catastale tramite procedura <strong>DOCFA</strong>, da affidare a un geometra o architetto. Costo: 300-600 euro, tempi: 1-4 settimane.</p>
<p>Se la difformità non ha titolo edilizio, si tratta di un abuso e va prima sanata (se possibile).</p>`,
      },
      {
        title: "Spese condominiali arretrate",
        content: `<p>L'art. 63 delle disposizioni di attuazione del Codice Civile stabilisce che l'acquirente è <strong>solidalmente responsabile</strong> con il venditore per le spese condominiali dell'anno in corso e dell'anno precedente all'acquisto.</p>
<p>In pratica: se il venditore non ha pagato le spese condominiali degli ultimi due anni, il condominio può chiederle a te.</p>
<p>Come proteggerti:</p>
<ul>
  <li>Richiedi la <strong>dichiarazione dell'amministratore</strong> che attesti la regolarità dei pagamenti</li>
  <li>Verifica l'importo delle spese ordinarie mensili</li>
  <li>Controlla se esiste un <strong>fondo cassa</strong> e a quanto ammonta</li>
  <li>Inserisci nel compromesso una clausola che obbliga il venditore a consegnare la dichiarazione dell'amministratore aggiornata al rogito</li>
</ul>`,
      },
      {
        title: "Lavori straordinari deliberati",
        content: `<p>Le delibere di lavori straordinari (rifacimento facciata, tetto, ascensore, cappotto termico) possono comportare costi di decine di migliaia di euro.</p>
<p>La regola generale: il costo dei lavori straordinari <strong>grava su chi è proprietario al momento della delibera</strong>. Ma attenzione: le clausole contrattuali possono modificare questa regola.</p>
<p>Cosa verificare:</p>
<ul>
  <li>Chiedi all'amministratore i <strong>verbali delle assemblee</strong> degli ultimi 2-3 anni</li>
  <li>Verifica se sono stati deliberati lavori non ancora eseguiti o in corso</li>
  <li>Controlla se il condominio ha debiti in essere (con fornitori, per lavori pregressi)</li>
  <li>Inserisci nel compromesso una clausola che mette a carico del venditore tutti i lavori deliberati prima del rogito</li>
</ul>`,
      },
      {
        title: "Vincoli e servitù",
        content: `<p>L'immobile potrebbe essere gravato da <strong>servitù</strong> o <strong>vincoli</strong> che ne limitano l'uso:</p>
<ul>
  <li><strong>Servitù di passaggio:</strong> il vicino ha diritto di passare attraverso la tua proprietà</li>
  <li><strong>Servitù di veduta:</strong> limitazioni alla possibilità di costruire o modificare finestre/balconi</li>
  <li><strong>Servitù di acquedotto:</strong> tubature che attraversano la proprietà</li>
  <li><strong>Vincoli paesaggistici:</strong> limiti alle modifiche esterne in zone tutelate</li>
  <li><strong>Vincoli archeologici:</strong> restrizioni in aree di interesse archeologico</li>
</ul>
<p>Dove trovarli: nella <strong>visura ipotecaria</strong>, nell'<strong>atto di provenienza</strong> e nel <strong>regolamento condominiale</strong> (per le servitù reciproche tra condomini).</p>`,
      },
      {
        title: "Classe energetica bassa",
        content: `<p>Un immobile in classe energetica G o F comporta <strong>bollette elevate</strong> e, soprattutto, la necessità di interventi di riqualificazione energetica in vista della <strong>Direttiva UE "Case Green"</strong>.</p>
<p>La Direttiva prevede che gli edifici residenziali raggiungano la classe E entro il 2030 e la classe D entro il 2033. L'Italia dovrà recepire la direttiva e stabilire le modalità, ma il trend è chiaro.</p>
<p>Costi tipici di riqualificazione:</p>
<ul>
  <li><strong>Cappotto termico:</strong> 40-80 euro/mq di superficie da isolare</li>
  <li><strong>Sostituzione infissi:</strong> 300-800 euro per infisso</li>
  <li><strong>Caldaia a condensazione:</strong> 2.000-4.000 euro</li>
  <li><strong>Pompa di calore:</strong> 5.000-12.000 euro</li>
  <li><strong>Fotovoltaico:</strong> 5.000-10.000 euro (3-6 kWp)</li>
</ul>
<p>Quando valuti un immobile in classe bassa, calcola il costo di riqualificazione nel prezzo totale. Un immobile a 150.000 euro in classe G con 30.000 euro di lavori necessari costa in realtà 180.000 euro.</p>`,
      },
    ],
    checklist: [
      "Ho verificato la conformità urbanistica con un tecnico",
      "Ho controllato la visura ipotecaria (no ipoteche/pignoramenti)",
      "Ho verificato che l'immobile non provenga da donazione",
      "Ho controllato la corrispondenza planimetria-stato reale",
      "Ho verificato le spese condominiali arretrate",
      "Ho letto i verbali assemblee per lavori straordinari",
      "Ho controllato vincoli e servitù nell'atto di provenienza",
      "Ho valutato i costi di riqualificazione energetica",
    ],
  },
];

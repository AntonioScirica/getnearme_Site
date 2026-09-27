// Guide satellite della pagina pilastro "agente immobiliare": ognuna risponde a una ricerca precisa
// e rimanda alla guida principale. Stesse regole: niente cifre inventate, norme citate solo se certe.
import type { Guide } from './types';

export const comeDiventare: Guide = {
  slug: 'come-diventare-agente-immobiliare',
  label: 'Come diventare agente immobiliare',
  title: 'Come diventare agente immobiliare nel 2026: requisiti, corso, esame',
  description: 'Come diventare agente immobiliare in Italia passo per passo: requisiti, corso regionale, esame alla Camera di Commercio, iscrizione, polizza e primi mesi di lavoro.',
  h1: 'Come diventare agente immobiliare: requisiti, corso, esame e primi passi',
  intro: 'Il percorso per diventare agente immobiliare in Italia, dal diploma al primo incarico: cosa serve, in che ordine, e cosa conviene preparare prima di iniziare.',
  updated: '2026-09-27',
  sections: [
    {
      id: 'requisiti',
      title: 'I requisiti per diventare agente immobiliare',
      html: `<p>Per esercitare l'attività di agente immobiliare (mediatore, secondo la <strong>Legge 39/1989</strong>) servono:</p>
<ul>
  <li><strong>maggiore età</strong> e godimento dei diritti civili;</li>
  <li>cittadinanza italiana o di un Paese UE, oppure un permesso di soggiorno valido;</li>
  <li><strong>diploma di scuola secondaria di secondo grado</strong> (la maturità: la laurea non è richiesta);</li>
  <li>assenza delle condanne e delle misure che la legge considera ostative;</li>
  <li>il superamento del <strong>corso abilitante</strong> e dell'<strong>esame</strong>.</li>
</ul>`,
    },
    {
      id: 'corso',
      title: 'Il corso abilitante',
      html: `<p>Il corso di formazione è organizzato da enti riconosciuti dalla <strong>Regione</strong>, che ne fissa durata, programma e frequenza minima. Per questo durata e costo cambiano da regione a regione, e molti enti offrono anche la formula online.</p>
<p>Gli argomenti tipici sono: diritto civile e commerciale, contratti, diritto tributario, estimo e valutazione degli immobili, urbanistica, catasto, legislazione sulla mediazione. Prima di iscriverti controlla che l'ente compaia nell'elenco dei corsi autorizzati della tua Regione: un attestato non riconosciuto non ti ammette all'esame.</p>`,
    },
    {
      id: 'esame',
      title: 'L\'esame alla Camera di Commercio',
      html: `<p>Finito il corso, si sostiene l'<strong>esame di abilitazione</strong> presso la Camera di Commercio, di solito con una <strong>prova scritta</strong> e una <strong>prova orale</strong> sulle materie del corso. Le sessioni e le modalità di iscrizione sono pubblicate sul sito della Camera di Commercio della tua provincia.</p>
<p>Per prepararti conviene esercitarti proprio sui casi pratici: calcolo delle imposte di compravendita, contenuto di un incarico e di una proposta d'acquisto, provvigione, verifiche urbanistiche e catastali.</p>`,
    },
    {
      id: 'iscrizione',
      title: 'Iscrizione, SCIA e polizza',
      html: `<p>Dal 2010 il vecchio "ruolo degli agenti d'affari in mediazione" è stato soppresso (<strong>D.Lgs. 59/2010</strong>). Oggi:</p>
<ul>
  <li>se <strong>apri un'attività tua</strong>, presenti la SCIA e vieni iscritto al Registro delle Imprese;</li>
  <li>se <strong>lavori per un'agenzia</strong>, l'agenzia ti fa iscrivere al REA come persona che svolge l'attività per suo conto.</li>
</ul>
<p>Serve inoltre una <strong>polizza di responsabilità civile professionale</strong>, obbligatoria per esercitare. Verifica anche le <strong>incompatibilità</strong> previste dalla legge (per esempio con il pubblico impiego): le regole sono state modificate nel tempo, e la Camera di Commercio ti indica quelle in vigore.</p>`,
    },
    {
      id: 'primi-passi',
      title: 'I primi mesi: agenzia, franchising o in proprio',
      html: `<p>Una volta abilitato hai tre strade: entrare in un'<strong>agenzia</strong> come collaboratore, entrare in una rete in <strong>franchising</strong>, oppure partire <strong>in proprio</strong>. Per chi inizia, un'agenzia avviata è spesso il modo più rapido per imparare trattative, documenti e acquisizione.</p>
<p>In ogni caso, il lavoro dei primi mesi è lo stesso: <strong>farti conoscere in una zona</strong> e costruire il tuo portafoglio di incarichi. Aiutano molto:</p>
<ul>
  <li>un <strong>sito personale</strong> con il tuo nome, da mandare ai proprietari;</li>
  <li>una presenza costante sui <strong>social</strong>, con gli immobili della zona;</li>
  <li>immobili presentati al meglio, con <strong>foto arredate e video</strong>, anche quando non hai budget per fotografi e home stager.</li>
</ul>
<p>Per approfondire il mestiere, leggi la <a href="/it/agente-immobiliare">guida completa all'agente immobiliare</a>.</p>`,
    },
  ],
  faq: [
    ['Quanto ci vuole per diventare agente immobiliare?', 'Dipende dalla durata del corso stabilita dalla tua Regione e dalla data della prima sessione d\'esame disponibile alla Camera di Commercio. In genere si parla di alcuni mesi.'],
    ['Si può fare il corso per agente immobiliare online?', 'Sì, molte Regioni ammettono corsi a distanza, purché l\'ente sia autorizzato. Controlla sempre l\'elenco ufficiale della tua Regione.'],
    ['Serve la partita IVA per fare l\'agente immobiliare?', 'Se lavori in proprio sì, con l\'iscrizione al Registro delle Imprese. Se collabori con un\'agenzia, la forma del rapporto dipende dal contratto: chiedilo al tuo commercialista.'],
    ['Si può fare l\'agente immobiliare senza esame?', 'No. Senza abilitazione non si può fare mediazione immobiliare, e il mediatore non abilitato non ha diritto alla provvigione.'],
  ],
};

export const provvigione: Guide = {
  slug: 'provvigione-agente-immobiliare',
  label: 'Provvigione dell\'agente immobiliare',
  title: 'Provvigione agente immobiliare: quanto è, quando si paga, chi la paga',
  description: 'La provvigione dell\'agente immobiliare spiegata semplice: quanto vale di solito, quando matura secondo il Codice civile, chi la paga, IVA ed esempi di calcolo.',
  h1: 'Provvigione dell\'agente immobiliare: quanto è, quando matura e chi la paga',
  intro: 'Come funziona il compenso dell\'agente immobiliare: percentuali più comuni, il momento in cui la provvigione è dovuta, cosa succede se l\'affare salta e come si calcola.',
  updated: '2026-09-27',
  sections: [
    {
      id: 'quanto',
      title: 'Quanto è la provvigione di un agente immobiliare',
      html: `<p>In Italia la provvigione <strong>non è fissata per legge</strong>: si concorda con l'incarico e con la proposta d'acquisto. In mancanza di accordo si fa riferimento agli usi (le Camere di Commercio raccolgono quelli della provincia) e, in ultima istanza, il giudice la determina secondo equità (art. 1755 c.c.).</p>
<p>Nella pratica, per le compravendite si vedono spesso valori tra il <strong>2% e il 4% del prezzo, più IVA</strong>, per ciascuna parte. Molte agenzie applicano anche un <strong>minimo</strong> per gli immobili di valore basso. Per le locazioni si usa di solito una quota del canone annuo o una mensilità.</p>`,
    },
    {
      id: 'quando',
      title: 'Quando matura la provvigione',
      html: `<p>Secondo l'art. 1755 del Codice civile il mediatore ha diritto alla provvigione se <strong>l'affare è concluso per effetto del suo intervento</strong>. "Concluso" significa che le parti sono vincolate: nella maggior parte dei casi basta l'<strong>accettazione della proposta d'acquisto</strong> comunicata al proponente, o la firma del <strong>preliminare</strong>. Non serve aspettare il rogito.</p>
<p>Per questo è importante che proposta e incarico dicano chiaramente <strong>quanto</strong> e <strong>quando</strong> si paga: molte agenzie chiedono il saldo all'accettazione, altre al preliminare.</p>`,
    },
    {
      id: 'chi',
      title: 'Chi paga la provvigione',
      html: `<p>Salvo patti diversi, la provvigione è dovuta da <strong>entrambe le parti</strong> che hanno concluso l'affare, venditore e acquirente (o locatore e conduttore). Le parti possono però accordarsi diversamente, per esempio con la provvigione tutta a carico del venditore.</p>
<p>Se venditore e acquirente, dopo essere stati messi in contatto dall'agente, concludono l'affare da soli, la provvigione in genere <strong>resta dovuta</strong>: conta il fatto che l'incontro sia avvenuto grazie al mediatore.</p>`,
    },
    {
      id: 'calcolo',
      title: 'Esempio di calcolo',
      html: `<p>Casa venduta a <strong>250.000 euro</strong>, provvigione concordata del <strong>3% + IVA</strong> per parte:</p>
<ul>
  <li>provvigione per parte: 250.000 × 3% = <strong>7.500 euro</strong>;</li>
  <li>IVA al 22%: 1.650 euro, totale per parte <strong>9.150 euro</strong>;</li>
  <li>incasso lordo dell'agenzia dalle due parti: <strong>15.000 euro più IVA</strong>.</li>
</ul>
<p>Se l'agente è un collaboratore, a lui spetta la quota concordata con l'agenzia. L'acquirente, nel rogito, deve dichiarare l'agenzia e la provvigione pagata, e sulla prima casa può detrarne una parte nei limiti previsti dalla normativa fiscale.</p>`,
    },
    {
      id: 'valore',
      title: 'Come far sentire la provvigione "giusta"',
      html: `<p>Il proprietario accetta volentieri una provvigione quando vede <strong>cosa ottiene in cambio</strong>. Presentarsi con un piano concreto (foto arredate, un video, la pagina dell'immobile sul tuo sito, una strategia sui social) rende la trattativa sul compenso molto più semplice di una promessa generica.</p>
<p>Per tutto il resto del mestiere, leggi la <a href="/it/agente-immobiliare">guida completa all'agente immobiliare</a>.</p>`,
    },
  ],
  faq: [
    ['La provvigione dell\'agente immobiliare è obbligatoria?', 'Se l\'affare si conclude grazie all\'intervento di un mediatore abilitato, sì: è un diritto previsto dal Codice civile. L\'importo però si concorda.'],
    ['Se la vendita salta dopo la proposta accettata, si paga l\'agenzia?', 'In genere sì, perché la provvigione matura con la conclusione dell\'affare, cioè con l\'accettazione della proposta. Molto dipende da cosa prevedono i documenti firmati.'],
    ['La provvigione include l\'IVA?', 'Di solito le percentuali si intendono più IVA. Controlla sempre come è scritto nell\'incarico o nella proposta.'],
    ['Si può trattare la provvigione?', 'Sì, è libera e si concorda tra le parti. Spesso si tratta insieme alla durata e all\'esclusiva dell\'incarico.'],
  ],
};

export const software: Guide = {
  slug: 'software-agenti-immobiliari',
  label: 'Software per agenti immobiliari',
  title: 'Software per agenti immobiliari: quali servono davvero nel 2026',
  description: 'I software per agenti immobiliari che servono davvero: gestionale, portali, sito personale, foto e home staging virtuale, video e social. Cosa scegliere e perché.',
  h1: 'Software per agenti immobiliari: quali servono davvero',
  intro: 'Gestionale, portali, sito, foto, video, social: gli strumenti digitali che un agente immobiliare usa ogni giorno, a cosa servono e come sceglierli senza pagare doppio.',
  updated: '2026-09-27',
  sections: [
    {
      id: 'perche',
      title: 'Perché gli strumenti contano',
      html: `<p>Il valore di un agente immobiliare sta nelle relazioni e nelle trattative. Gli strumenti digitali servono a due cose: <strong>liberare tempo</strong> da passare con proprietari e acquirenti, e <strong>presentare meglio</strong> gli immobili e te stesso. Un buon insieme di software fa entrambe.</p>`,
    },
    {
      id: 'gestionale',
      title: 'Gestionale immobiliare',
      html: `<p>È l'archivio dell'agenzia: immobili, clienti, richieste, appuntamenti, richiami. Il gestionale di solito pubblica anche gli annunci sui portali. Conta che sia facile da usare anche dal telefono e che permetta di <strong>esportare i dati</strong>, per non restare legato a un solo fornitore.</p>`,
    },
    {
      id: 'sito',
      title: 'Sito personale o di agenzia',
      html: `<p>Sui portali l'acquirente sceglie la casa, non l'agente. Il sito è il posto dove ci sei solo tu: lo mandi ai clienti, lo metti in firma e soprattutto lo mostri ai proprietari quando ti giochi un incarico. Deve essere <strong>sempre aggiornato</strong> con i tuoi immobili, veloce da telefono e trovabile su Google per la tua zona. Un sito che aggiorni a mano ogni volta, di solito, dopo qualche mese resta vecchio.</p>`,
    },
    {
      id: 'foto',
      title: 'Foto e home staging virtuale',
      html: `<p>La prima foto decide se un annuncio viene aperto. Gli strumenti di <strong>home staging virtuale</strong> arredano le stanze vuote o datate lasciando com'è la stanza (muri, finestre, pavimento): chi guarda capisce subito come vivrebbe quella casa. Per correttezza è buona regola indicare nell'annuncio che l'arredamento è virtuale.</p>`,
    },
    {
      id: 'video',
      title: 'Video e social',
      html: `<p>I video trattengono l'attenzione molto più delle foto, e sui social sono il modo migliore per farti conoscere nella tua zona. Oggi si possono creare dalle foto che hai già, senza riprese: l'importante è pubblicare <strong>con costanza</strong>, un immobile alla volta.</p>`,
    },
    {
      id: 'scegliere',
      title: 'Come scegliere senza pagare doppio',
      html: `<ul>
  <li><strong>Parti dal problema</strong>: incarichi, visibilità o tempo? Scegli prima lo strumento che lo risolve.</li>
  <li><strong>Evita doppioni</strong>: un fotografo, un home stager, un videomaker e una web agency per ogni immobile costano molto più di un abbonamento che fa tutto.</li>
  <li><strong>Prova prima di pagare</strong>: su un immobile vero, con le tue foto.</li>
  <li><strong>Guarda il risultato, non l'elenco delle funzioni</strong>: conta quello che vede il cliente.</li>
</ul>
<p><strong>Agente Immo</strong> copre foto arredate con l'AI, video per i social e il tuo sito già pronto, per ogni immobile: <a href="/it">scopri come ti aiuta a vincere più incarichi</a>. Per tutto il resto del mestiere c'è la <a href="/it/agente-immobiliare">guida all'agente immobiliare</a>.</p>`,
    },
  ],
  faq: [
    ['Qual è il miglior software per agenti immobiliari?', 'Dipende da cosa ti manca. Per archivio e portali serve un gestionale; per vincere incarichi e vendere prima contano soprattutto la presentazione degli immobili (foto, video) e un sito tuo.'],
    ['Un agente immobiliare ha bisogno di un sito se usa già i portali?', 'Sì: sui portali sei uno dei tanti, sul tuo sito sei l\'unico. È il biglietto da visita per i proprietari e porta contatti diretti.'],
    ['L\'home staging virtuale funziona davvero?', 'Aiuta chi guarda l\'annuncio a immaginare la casa abitata, soprattutto per stanze vuote o datate. Va indicato che l\'arredamento è virtuale.'],
  ],
};

export const homeStaging: Guide = {
  slug: 'home-staging-virtuale',
  label: 'Home staging virtuale',
  title: 'Home staging virtuale: cos\'è, quando usarlo e come farlo bene',
  description: 'Home staging virtuale per agenti immobiliari: cos\'è, differenze con quello fisico, quando conviene, regole di correttezza negli annunci ed errori da evitare.',
  h1: 'Home staging virtuale: cos\'è e come usarlo per vendere prima',
  intro: 'Arredare le stanze in foto invece che dal vivo: quando ha senso, cosa cambia rispetto all\'home staging tradizionale e come usarlo negli annunci senza ingannare nessuno.',
  updated: '2026-09-27',
  sections: [
    {
      id: 'cose',
      title: 'Cos\'è l\'home staging virtuale',
      html: `<p>L'<strong>home staging virtuale</strong> è l'arredamento di una stanza fatto sulla foto, non dal vivo: si parte dallo scatto della stanza vuota (o arredata male) e si aggiungono mobili, luci e complementi realistici. Oggi con l'intelligenza artificiale bastano pochi secondi per una foto, lasciando com'erano muri, finestre, pavimento e prospettiva.</p>`,
    },
    {
      id: 'perche',
      title: 'Perché aiuta a vendere',
      html: `<p>Una stanza vuota sembra <strong>più piccola e più fredda</strong> di quello che è, e chi scorre un portale non riesce a immaginarla abitata. Arredata, comunica subito dimensioni, funzione e atmosfera. In più il proprietario vede che l'agente si sta impegnando per la sua casa, cosa che conta molto quando si decide a chi affidare l'incarico.</p>`,
    },
    {
      id: 'confronto',
      title: 'Virtuale o fisico: le differenze',
      html: `<ul>
  <li><strong>Costi</strong>: l'home staging fisico richiede mobili, trasporto, allestimento e spesso un noleggio mensile; quello virtuale no.</li>
  <li><strong>Tempi</strong>: il fisico va organizzato e montato; il virtuale si fa in pochi minuti, anche prima di pubblicare.</li>
  <li><strong>Visita</strong>: con il fisico la casa è arredata anche dal vivo; con il virtuale no, quindi va detto chiaramente.</li>
  <li><strong>Flessibilità</strong>: con il virtuale puoi mostrare più stili per la stessa stanza.</li>
</ul>`,
    },
    {
      id: 'correttezza',
      title: 'Come usarlo in modo corretto',
      html: `<p>La regola d'oro: l'home staging virtuale <strong>aggiunge arredi, non cambia la casa</strong>. Non si nascondono difetti, non si allargano stanze, non si cambia la vista dalle finestre. E negli annunci è buona pratica:</p>
<ul>
  <li>indicare che l'arredamento è <strong>virtuale</strong> (nella foto o nella didascalia);</li>
  <li>pubblicare anche la <strong>foto originale</strong> della stanza;</li>
  <li>scegliere uno stile <strong>realistico</strong> e adatto all'immobile, non da rivista.</li>
</ul>`,
    },
    {
      id: 'errori',
      title: 'Errori da evitare',
      html: `<ul>
  <li>Mobili fuori scala che fanno sembrare la stanza più grande di com'è.</li>
  <li>Stili di lusso in un bilocale da ristrutturare: crea aspettative che la visita delude.</li>
  <li>Luce diversa tra una foto e l'altra della stessa casa.</li>
  <li>Arredare stanze che non ne hanno bisogno: le più utili sono soggiorno, camera principale e stanze vuote.</li>
</ul>
<p>Con <a href="/it">Agente Immo</a> arredi una stanza scegliendo lo stile o scrivendo cosa vuoi in italiano. Per capire come si inserisce nel lavoro dell'agente, leggi la <a href="/it/agente-immobiliare">guida all'agente immobiliare</a>.</p>`,
    },
  ],
  faq: [
    ['L\'home staging virtuale è legale negli annunci?', 'Sì, a patto di non ingannare: si aggiungono arredi senza modificare la casa, e va indicato che l\'arredamento è virtuale.'],
    ['Quali stanze conviene arredare virtualmente?', 'Soprattutto soggiorno, camera principale e stanze vuote o con arredi datati, che in foto rendono peggio.'],
    ['Serve un fotografo per l\'home staging virtuale?', 'Aiuta avere foto luminose e dritte, ma molti strumenti funzionano bene anche con buone foto da smartphone.'],
  ],
};

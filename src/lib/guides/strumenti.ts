// Guide sugli strumenti di lavoro dell'agente: gestionale, CRM, sito web.
// Stesse regole delle altre guide: niente cifre inventate, niente marchi di terzi, prodotto come opzione.
import type { Guide } from './types';

export const gestionale: Guide = {
  slug: 'gestionale-immobiliare',
  label: 'Gestionale immobiliare',
  title: `Gestionale immobiliare: funzioni, costi e come sceglierlo`,
  description: `Gestionale immobiliare: cosa deve fare, le funzioni indispensabili, una checklist per scegliere il migliore per la tua agenzia e gli errori da evitare.`,
  h1: `Gestionale immobiliare: cosa deve fare e come scegliere quello giusto`,
  intro: `Un gestionale immobiliare è il software che tiene insieme immobili, clienti, pubblicazione sui portali, documenti e agenda dell'agenzia. Qui trovi le funzioni che contano davvero, una checklist per sceglierlo e come valutarne il costo.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'cos-e-un-gestionale-immobiliare',
      title: `Cos'è un gestionale immobiliare e a cosa serve`,
      html: `<p>Un <strong>gestionale immobiliare</strong> è il programma in cui un'agenzia (o un agente che lavora da solo) registra tutto quello che riguarda il lavoro quotidiano: gli immobili in portafoglio, i proprietari, gli acquirenti e gli inquilini, gli appuntamenti, le trattative e i documenti.</p>
<p>Il suo compito principale è evitare che le informazioni restino sparse tra fogli Excel, rubrica del telefono, chat e cartelle sul computer. Quando un cliente chiama, devi sapere in pochi secondi chi è, cosa cerca, quali immobili ha già visto e cosa gli hai promesso.</p>
<p>In pratica un buon gestionale ti permette di:</p>
<ul>
  <li><strong>caricare un immobile una volta sola</strong> e pubblicarlo su più portali e sul tuo sito;</li>
  <li><strong>abbinare richieste e immobili</strong>: chi cerca un trilocale in zona X riceve le proposte giuste;</li>
  <li><strong>ricordarti le scadenze</strong>: richiami, incarichi in scadenza, visite, rinnovi;</li>
  <li><strong>vedere a che punto è ogni trattativa</strong> e quanto vale il portafoglio;</li>
  <li><strong>lavorare in squadra</strong> senza pestarsi i piedi sugli stessi clienti.</li>
</ul>
<p>La differenza con un <a href="/it/crm-immobiliare">CRM immobiliare</a> è di confini: il CRM si concentra sui contatti e sul loro percorso fino al rogito, il gestionale copre anche immobili, pubblicazione e documenti. Molti prodotti fanno entrambe le cose, e spesso le due parole vengono usate come sinonimi.</p>
<p>Che tu sia un <a href="/it/agente-immobiliare">agente immobiliare</a> che lavora da solo o un'agenzia con più collaboratori, il gestionale è lo strumento su cui passerai più ore: per questo conviene sceglierlo con calma.</p>`,
    },
    {
      id: 'funzioni-indispensabili',
      title: `Le funzioni indispensabili di un gestionale per agenzie immobiliari`,
      html: `<p>Prima di guardare le funzioni "in più", verifica che ci siano queste. Sono quelle che userai ogni giorno.</p>
<h3>Immobili</h3>
<ul>
  <li>scheda completa: dati catastali, superfici, classe energetica, spese, stato dell'incarico e scadenza;</li>
  <li>foto, planimetrie e video ordinabili, con la possibilità di scegliere la copertina;</li>
  <li>storico dei prezzi e delle modifiche.</li>
</ul>
<h3>Clienti e contatti</h3>
<ul>
  <li>anagrafica unica per proprietari, acquirenti e inquilini, senza doppioni;</li>
  <li>richieste di ricerca salvate (zona, budget, metri, caratteristiche) e abbinamento automatico con gli immobili;</li>
  <li>storico delle interazioni: chiamate, email, visite, proposte.</li>
</ul>
<h3>Pubblicazione multi-portale</h3>
<ul>
  <li>invio degli annunci ai portali principali e al sito, con aggiornamento automatico quando cambi prezzo o foto;</li>
  <li>raccolta delle richieste in arrivo dai portali direttamente nella scheda contatto.</li>
</ul>
<h3>Documenti, agenda e report</h3>
<ul>
  <li>modelli per incarico, proposta, scheda visita, con i dati compilati in automatico;</li>
  <li>agenda condivisa con promemoria e visite collegate all'immobile;</li>
  <li>report semplici: incarichi attivi, visite per immobile, provenienza dei contatti, trattative aperte.</li>
</ul>
<p>Se manca una di queste cose, finirai per tenere un secondo strumento a parte, che è esattamente quello che il gestionale dovrebbe evitare.</p>`,
    },
    {
      id: 'come-scegliere-checklist',
      title: `Come scegliere il miglior gestionale immobiliare: la checklist`,
      html: `<p>Il "miglior gestionale immobiliare" non esiste in assoluto: esiste quello adatto a come lavori tu. Usa questa checklist durante le prove gratuite o le demo.</p>
<ol>
  <li><strong>Portali supportati</strong>: pubblica davvero su tutti quelli che usi? Gli aggiornamenti di prezzo e foto arrivano in automatico?</li>
  <li><strong>Importazione dei dati</strong>: puoi portare dentro immobili e contatti che hai già (da Excel o dal vecchio software) senza ricopiarli a mano?</li>
  <li><strong>Esportazione</strong>: se un giorno cambi, puoi riprenderti i tuoi dati in un formato leggibile?</li>
  <li><strong>Uso da telefono</strong>: puoi aprire una scheda, registrare una visita o fotografare un immobile mentre sei fuori?</li>
  <li><strong>Velocità di inserimento</strong>: quanto ci metti a caricare un immobile completo? Provalo con un immobile vero, non con i dati della demo.</li>
  <li><strong>Utenti e permessi</strong>: puoi decidere chi vede cosa, se lavori con collaboratori?</li>
  <li><strong>Assistenza</strong>: in che lingua, con che orari, con che tempi di risposta?</li>
  <li><strong>Contratto</strong>: durata minima, preavviso di disdetta, costi di attivazione o di migrazione.</li>
  <li><strong>Privacy</strong>: dove sono conservati i dati, chi è il responsabile del trattamento, come si gestiscono le richieste di cancellazione.</li>
</ol>
<p>Un consiglio pratico: durante la prova, usa il gestionale per una settimana vera, con un paio di immobili e i contatti reali. I limiti emergono in fretta quando lo usi sotto pressione, non quando guardi una presentazione.</p>`,
    },
    {
      id: 'quanto-costa',
      title: `Quanto costa un gestionale immobiliare e da cosa dipende il prezzo`,
      html: `<p>I gestionali immobiliari si pagano quasi sempre in <strong>abbonamento</strong>, mensile o annuale. Il prezzo cambia molto tra un prodotto e l'altro, e per confrontarli davvero devi capire cosa c'è dentro la cifra. Le voci che fanno variare il costo sono:</p>
<ul>
  <li><strong>numero di utenti</strong>: molti prodotti fanno pagare per ogni agente o postazione;</li>
  <li><strong>numero di portali</strong> collegati e di annunci pubblicabili;</li>
  <li><strong>moduli aggiuntivi</strong>: sito web, invio email e SMS, firma elettronica, report avanzati;</li>
  <li><strong>costi una tantum</strong>: attivazione, formazione, migrazione dei dati dal vecchio sistema;</li>
  <li><strong>durata del contratto</strong>: l'annuale di solito costa meno al mese, ma ti vincola.</li>
</ul>
<p>Ricorda che al gestionale si sommano spesso i costi dei <strong>portali</strong> stessi, che sono un'altra spesa e non dipendono dal software.</p>
<p>Per un confronto onesto, chiedi a ogni fornitore un preventivo scritto sulla tua situazione reale: quanti utenti, quali portali, quali moduli. Poi calcola il <strong>costo annuo totale</strong>, compresi gli extra, e confrontalo con il tempo che ti fa risparmiare. Un software che costa di più ma ti evita due ore di lavoro doppio alla settimana può essere la scelta più economica.</p>
<p>Diffida delle offerte che sembrano convenienti ma mettono a pagamento proprio le funzioni indispensabili elencate sopra.</p>`,
    },
    {
      id: 'errori-da-evitare',
      title: `Gli errori più comuni nella scelta e nell'uso del gestionale`,
      html: `<p>Molte agenzie pagano un gestionale e lo usano a metà. Gli errori ricorrenti sono questi:</p>
<ul>
  <li><strong>Scegliere per il numero di funzioni</strong>. Un software che fa tutto ma è lento da usare finisce abbandonato. Meglio meno funzioni, usate davvero.</li>
  <li><strong>Non migrare i dati</strong>. Se i contatti vecchi restano nel foglio Excel, avrai due archivi e nessuno dei due completo.</li>
  <li><strong>Non definire regole comuni</strong>. In un team, se ognuno scrive le note a modo suo, le ricerche non funzionano. Decidete insieme come chiamare le zone, le tipologie, gli stati della trattativa.</li>
  <li><strong>Inserire gli immobili di corsa</strong>. Schede incomplete, foto scure, descrizioni copiate: il gestionale pubblica ovunque, quindi pubblica ovunque anche gli errori.</li>
  <li><strong>Ignorare i promemoria</strong>. Il valore del gestionale sta nei richiami fatti al momento giusto. Se li rimandi sempre, è solo una rubrica costosa.</li>
  <li><strong>Firmare contratti lunghi senza prova</strong>. Prima di vincolarti per un anno, usa il software su casi veri.</li>
  <li><strong>Dimenticare l'uscita</strong>. Controlla subito come esportare i dati: è la tua assicurazione se il prodotto non ti soddisfa più.</li>
</ul>
<p>Una regola semplice per il team: <strong>se non è nel gestionale, non è successo</strong>. Visita, telefonata, proposta: tutto va registrato, anche con due righe.</p>`,
    },
    {
      id: 'strumenti-ai',
      title: `Dove si inseriscono gli strumenti di intelligenza artificiale`,
      html: `<p>Il gestionale organizza le informazioni, ma raramente aiuta a <strong>produrre i contenuti</strong> dell'annuncio: foto migliori, video per i social, testi chiari. Qui entrano gli strumenti di <a href="/it/intelligenza-artificiale-agenti-immobiliari">intelligenza artificiale per agenti immobiliari</a>, che lavorano a monte del gestionale.</p>
<p>Gli usi più concreti oggi sono:</p>
<ul>
  <li><strong>foto</strong>: arredare stanze vuote, svuotare stanze piene, cambiare stile, sistemare luce e colori. Vedi la guida al <a href="/it/home-staging-virtuale">home staging virtuale</a>;</li>
  <li><strong>video</strong>: trasformare le foto in brevi reel verticali per Instagram e TikTok, anche senza girare nulla;</li>
  <li><strong>testi</strong>: riscrivere titolo e descrizione in modo più chiaro, partendo dai dati reali dell'immobile;</li>
  <li><strong>controllo dell'annuncio</strong>: capire cosa manca o cosa penalizza un annuncio già online.</li>
</ul>
<p>Il flusso tipico è: prepari foto, video e testo con lo strumento AI, poi li carichi nel gestionale che li pubblica sui portali. <a href="/it">Agente Immo</a> è una delle opzioni per questa parte: in una chat arredi o svuoti le foto, crei il video "Prima e dopo", importi un annuncio da un link per vederne punteggio e correzioni, e riscrivi titolo e descrizione. Puoi <a href="/it#prova">provarlo gratis su una tua foto</a> prima di decidere.</p>
<p>Una regola da non dimenticare: le foto modificate vanno sempre dichiarate come tali nell'annuncio. Approfondisci nella guida sul <a href="/it/virtual-staging-legale">virtual staging e le regole da rispettare</a>.</p>`,
    },
    {
      id: 'agente-singolo-o-team',
      title: `Gestionale per agente singolo o per piccolo team: cosa cambia`,
      html: `<p>Le esigenze di chi lavora da solo e di un'agenzia con più collaboratori sono diverse, e conviene scegliere di conseguenza.</p>
<h3>Agente singolo</h3>
<ul>
  <li>serve soprattutto <strong>velocità</strong>: inserire un immobile e un contatto in pochi minuti, anche da telefono;</li>
  <li>contano pubblicazione sui portali, promemoria e una buona presenza online (un <a href="/it/sito-web-agente-immobiliare">sito personale</a> con i tuoi immobili);</li>
  <li>i moduli per gestire squadre, provvigioni tra collaboratori e permessi sono spesso soldi spesi per niente.</li>
</ul>
<h3>Piccolo team (2-10 persone)</h3>
<ul>
  <li><strong>permessi e assegnazioni</strong>: chi segue quale cliente e quale immobile, senza conflitti;</li>
  <li><strong>agenda condivisa</strong> e visibilità sulle visite di tutti;</li>
  <li><strong>report per il titolare</strong>: incarichi acquisiti, visite, trattative per collaboratore;</li>
  <li>regole comuni di inserimento, altrimenti i dati diventano inutilizzabili.</li>
</ul>
<p>In entrambi i casi, pensa a dove sarai tra due anni. Se prevedi di assumere collaboratori, scegli un prodotto che cresce con te senza obbligarti a cambiare e rifare la migrazione. Se invece lavori da solo e vuoi restarlo, uno strumento semplice e usato ogni giorno vale più di una piattaforma completa usata poco. Per un quadro più ampio degli strumenti disponibili, leggi la guida ai <a href="/it/software-agenti-immobiliari">software per agenti immobiliari</a>.</p>`,
    },
  ],
  faq: [
    [`Qual è il miglior gestionale immobiliare?`, `Dipende da come lavori: numero di utenti, portali usati, bisogno di uso da telefono e di moduli come il sito. Il migliore è quello che il tuo team usa davvero ogni giorno. Provane due o tre con immobili e contatti reali prima di scegliere.`],
    [`Quanto costa un gestionale per agenzia immobiliare?`, `Si paga quasi sempre in abbonamento e il prezzo varia in base a utenti, portali collegati, moduli aggiuntivi e costi di attivazione. Chiedi un preventivo scritto sulla tua situazione e confronta il costo annuo totale, extra compresi.`],
    [`Che differenza c'è tra gestionale e CRM immobiliare?`, `Il CRM si concentra sui contatti e sul percorso di vendita, il gestionale copre anche immobili, pubblicazione sui portali e documenti. Molti software fanno entrambe le cose, quindi conta più la lista delle funzioni che il nome.`],
    [`Un agente che lavora da solo ha bisogno di un gestionale?`, `Se gestisce pochi immobili può partire con strumenti semplici, ma appena crescono contatti e portali un gestionale evita dimenticanze e lavoro doppio. Per chi lavora da solo contano soprattutto velocità, uso da telefono e pubblicazione automatica.`],
    [`Posso cambiare gestionale senza perdere i dati?`, `Sì, se il software attuale permette di esportare immobili e contatti in un formato leggibile. Verificalo prima di firmare qualsiasi contratto e chiedi al nuovo fornitore se si occupa della migrazione e a quale costo.`],
    [`Il gestionale crea anche foto e video per gli annunci?`, `Di solito no: archivia e pubblica i contenuti che carichi. Per arredare le foto, creare video per i social o riscrivere le descrizioni si usano strumenti di intelligenza artificiale dedicati, e poi si carica il risultato nel gestionale.`],
  ],
}

export const crm: Guide = {
  slug: 'crm-immobiliare',
  label: 'CRM immobiliare',
  title: `CRM immobiliare: come gestire contatti e lead in agenzia`,
  description: `CRM immobiliare per agenti: da dove arrivano i lead, le fasi dal primo contatto al rogito, regole di follow-up, automazioni e basi GDPR da rispettare.`,
  h1: `CRM immobiliare: gestire contatti e lead dal primo messaggio al rogito`,
  intro: `Un CRM immobiliare serve a non perdere nessun contatto: registra chi ti scrive, a che punto è e quando va richiamato. Qui trovi le fasi della pipeline, le regole di follow-up e come usarlo nel rispetto del GDPR.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'cos-e-un-crm-immobiliare',
      title: `Cos'è un CRM immobiliare e perché serve a un agente`,
      html: `<p>CRM sta per <em>Customer Relationship Management</em>: gestione delle relazioni con i clienti. Per un <a href="/it/agente-immobiliare">agente immobiliare</a> significa avere in un unico posto <strong>tutti i contatti</strong> (proprietari, acquirenti, inquilini, notai, tecnici) con la loro storia: quando ti hanno scritto, cosa cercano, cosa si è detto, qual è il prossimo passo.</p>
<p>Il problema che risolve è semplice: nel lavoro immobiliare i tempi sono lunghi. Un proprietario che oggi "ci sta pensando" può essere pronto a vendere tra sei mesi. Un acquirente che non ha trovato niente questo mese può essere perfetto per l'immobile che acquisisci il prossimo. Senza un sistema, questi contatti si perdono nella rubrica e nelle chat.</p>
<p>Un CRM immobiliare ben usato ti permette di:</p>
<ul>
  <li><strong>rispondere in fretta</strong> ai nuovi contatti, che è spesso ciò che decide chi prende il cliente;</li>
  <li><strong>richiamare al momento giusto</strong>, con promemoria automatici;</li>
  <li><strong>abbinare</strong> le richieste degli acquirenti ai nuovi immobili;</li>
  <li><strong>capire da dove arrivano</strong> i clienti che poi firmano, per investire dove rende;</li>
  <li>trasformare i contatti passati in <strong>nuovi incarichi</strong>, perché chi ha comprato conosce chi vende.</li>
</ul>
<p>Se ti serve anche la gestione di immobili, portali e documenti, guarda la guida al <a href="/it/gestionale-immobiliare">gestionale immobiliare</a>: molti prodotti uniscono le due cose.</p>`,
    },
    {
      id: 'fonti-dei-lead',
      title: `Da dove arrivano i lead di un'agenzia immobiliare`,
      html: `<p>Il primo lavoro del CRM è registrare <strong>la provenienza</strong> di ogni contatto. Solo così, dopo qualche mese, capisci quali canali portano clienti veri e quali solo curiosi. Le fonti tipiche sono:</p>
<ul>
  <li><strong>portali immobiliari</strong>: richieste su annunci specifici, di solito acquirenti o inquilini;</li>
  <li><strong>sito personale o di agenzia</strong>: moduli di contatto, richieste di valutazione, messaggi WhatsApp;</li>
  <li><strong>social</strong>: messaggi privati e commenti sotto post e reel;</li>
  <li><strong>passaparola e clienti passati</strong>: spesso i contatti più qualificati;</li>
  <li><strong>vetrina e cartelli "vendesi"</strong>: telefonate di chi passa in zona;</li>
  <li><strong>attività di acquisizione</strong>: <a href="/it/lettera-acquisizione-immobili">lettere ai proprietari</a>, telefonate, porta a porta, eventi di quartiere;</li>
  <li><strong>collaborazioni</strong>: altri professionisti, amministratori di condominio, tecnici.</li>
</ul>
<p>Nel CRM crea un campo "fonte" con un elenco fisso di valori, uguale per tutti. Se ognuno scrive la fonte a parole sue ("portale", "da internet", "annuncio web"), i report non funzionano.</p>
<p>Distingui anche il <strong>tipo di contatto</strong>: un proprietario che vuole vendere e un acquirente che cerca casa seguono percorsi diversi e vanno in pipeline separate. Il proprietario è il contatto più prezioso, perché porta l'incarico: trattalo con la massima priorità.</p>`,
    },
    {
      id: 'pipeline-fasi',
      title: `Le fasi della pipeline: dal primo contatto al rogito`,
      html: `<p>La pipeline è la sequenza di fasi che un contatto attraversa. Definirla in modo chiaro ti dice in ogni momento quante trattative hai e dove si bloccano. Un esempio per chi vende, che puoi adattare:</p>
<h3>Pipeline proprietari (acquisizione)</h3>
<ol>
  <li><strong>Nuovo contatto</strong>: ha scritto o risposto, ancora da sentire.</li>
  <li><strong>Primo colloquio fatto</strong>: conosci motivazione e tempi.</li>
  <li><strong>Sopralluogo fissato</strong> o fatto.</li>
  <li><strong>Valutazione presentata</strong>: vedi la guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione per l'acquisizione</a>.</li>
  <li><strong>Incarico firmato</strong>.</li>
  <li><strong>In vendita</strong>: annuncio online, visite in corso.</li>
  <li><strong>Proposta accettata</strong>, poi <strong>preliminare</strong>, poi <strong>rogito</strong>.</li>
</ol>
<h3>Pipeline acquirenti</h3>
<ol>
  <li><strong>Nuova richiesta</strong>.</li>
  <li><strong>Qualificato</strong>: budget, zona, tempi, eventuale mutuo e casa da vendere.</li>
  <li><strong>Visite in corso</strong>.</li>
  <li><strong>Proposta fatta</strong>, poi <strong>accettata</strong>.</li>
  <li><strong>Preliminare</strong> e <strong>rogito</strong>.</li>
</ol>
<p>Aggiungi sempre una fase <strong>"in pausa"</strong> o "non ora", con una data di richiamo, e una fase <strong>"perso"</strong> con il motivo. I contatti in pausa sono una miniera per il futuro; i motivi di perdita ti dicono cosa migliorare. Tieni poche fasi, con nomi che tutto il team interpreta allo stesso modo.</p>`,
    },
    {
      id: 'regole-follow-up',
      title: `Regole di follow-up: quando e come richiamare i contatti`,
      html: `<p>Il CRM funziona solo se ogni contatto ha sempre un <strong>prossimo passo con una data</strong>. Queste regole sono un buon punto di partenza, da adattare al tuo ritmo:</p>
<ul>
  <li><strong>Nuovo contatto</strong>: rispondi il prima possibile, idealmente nella stessa giornata. Chi ti ha scritto sta probabilmente scrivendo anche ad altri.</li>
  <li><strong>Dopo una visita</strong>: senti l'acquirente entro un giorno o due, finché l'immobile è fresco nella memoria.</li>
  <li><strong>Proprietario "ci penso"</strong>: fissa subito il richiamo, e quando richiami porta qualcosa di nuovo (una vendita in zona, un'idea per presentare la casa).</li>
  <li><strong>Acquirente senza immobili adatti</strong>: richiamalo quando entra un immobile compatibile, non a intervalli casuali.</li>
  <li><strong>Clienti chiusi</strong>: un contatto dopo il rogito e poi con cadenza regolare. Sono la fonte migliore di passaparola.</li>
</ul>
<h3>Una traccia per il richiamo del proprietario</h3>
<p><em>"Buongiorno [nome], sono [tuo nome]. Ci eravamo sentiti a [mese] per la sua casa in [via]. Le scrivo perché in zona si è appena venduto un immobile simile e ho pensato le interessasse saperlo. Ha ancora in programma di vendere?"</em></p>
<p>Registra nel CRM l'esito di ogni richiamo, anche solo "non risponde", e imposta subito il successivo. Per altre tracce pronte vedi lo <a href="/it/script-telefonata-proprietari">script per la telefonata ai proprietari</a>.</p>`,
    },
    {
      id: 'automazioni',
      title: `Automazioni utili in un CRM per agenti immobiliari`,
      html: `<p>Le automazioni servono a togliere lavoro ripetitivo, non a sostituire il rapporto personale. Quelle che fanno risparmiare più tempo:</p>
<ul>
  <li><strong>ingresso automatico dei lead</strong>: le richieste da portali e sito entrano da sole nel CRM, con fonte e immobile già compilati;</li>
  <li><strong>risposta di cortesia immediata</strong>: una conferma di ricezione che dice quando verrai ricontattato (poi però richiami davvero);</li>
  <li><strong>promemoria</strong> legati alla fase: dopo la visita, dopo l'invio della valutazione, prima della scadenza dell'incarico;</li>
  <li><strong>abbinamento</strong>: quando inserisci un nuovo immobile, il CRM ti mostra gli acquirenti con una ricerca compatibile;</li>
  <li><strong>assegnazione</strong> dei nuovi contatti ai collaboratori secondo regole chiare (zona, tipo di immobile, turni);</li>
  <li><strong>report periodici</strong>: contatti per fonte, trattative per fase, contatti senza prossimo passo.</li>
</ul>
<h3>Cosa non automatizzare</h3>
<ul>
  <li>i messaggi a proprietari che stai cercando di acquisire: devono essere personali;</li>
  <li>invii massivi a contatti che non hanno dato il consenso a ricevere comunicazioni commerciali;</li>
  <li>sequenze di email troppo fitte, che fanno sembrare l'agenzia un call center.</li>
</ul>
<p>Parti con due o tre automazioni, verifica che funzionino e poi aggiungi il resto. Un sistema troppo complesso all'inizio di solito viene abbandonato.</p>`,
    },
    {
      id: 'gdpr-dati-clienti',
      title: `GDPR e dati dei clienti: le basi da rispettare`,
      html: `<p>Un CRM contiene dati personali, quindi rientra nel <strong>Regolamento europeo sulla protezione dei dati (GDPR)</strong>. Queste sono le basi generali; per la tua situazione specifica rivolgiti a un consulente privacy.</p>
<ul>
  <li><strong>Informativa</strong>: chi ti lascia i suoi dati (dal sito, in agenzia, al telefono) deve sapere chi li tratta, per quali scopi, per quanto tempo e quali diritti ha.</li>
  <li><strong>Base giuridica</strong>: per rispondere a una richiesta o gestire un incarico il trattamento è legato al servizio richiesto; per inviare comunicazioni commerciali o newsletter serve in genere un <strong>consenso specifico</strong>, separato e facoltativo.</li>
  <li><strong>Minimizzazione</strong>: raccogli solo i dati che ti servono davvero.</li>
  <li><strong>Conservazione</strong>: stabilisci per quanto tempo tieni i dati e cancella o anonimizza quelli che non servono più.</li>
  <li><strong>Diritti degli interessati</strong>: accesso, rettifica, cancellazione, opposizione. Devi poter rispondere, e il CRM deve permetterti di trovare ed eliminare un contatto.</li>
  <li><strong>Sicurezza</strong>: accessi personali con password, permessi per ruolo, niente file di contatti che girano su chiavette o chat.</li>
  <li><strong>Fornitori</strong>: il fornitore del CRM tratta i dati per tuo conto, quindi serve un accordo sul trattamento dei dati (di solito lo fornisce lui).</li>
</ul>
<p>Attenzione anche alle <strong>liste comprate</strong> o ai numeri presi da elenchi: contattare persone senza una base giuridica valida è un rischio concreto.</p>`,
    },
    {
      id: 'sito-e-modulo-contatto',
      title: `Come un sito personale con modulo di contatto alimenta il CRM`,
      html: `<p>I portali portano richieste su singoli annunci, ma sono contatti "condivisi": lo stesso acquirente scrive a più agenzie. Un <a href="/it/sito-web-agente-immobiliare">sito web personale</a> porta invece contatti che cercano <strong>te</strong>: proprietari che hanno visto il tuo nome su un cartello, persone arrivate da un tuo reel, clienti di clienti.</p>
<p>Perché il sito alimenti davvero il CRM servono tre cose:</p>
<ol>
  <li><strong>Un modulo di contatto semplice</strong>: nome, email o telefono, messaggio. Ogni campo in più riduce le richieste.</li>
  <li><strong>Il riferimento all'immobile</strong>: se il contatto parte dalla pagina di un immobile, la richiesta deve dire quale. Ti risparmia una domanda e ti fa rispondere meglio.</li>
  <li><strong>Un percorso chiaro dopo l'invio</strong>: la richiesta arriva a te (via email o direttamente nel CRM), tu la registri con fonte "sito" e fissi subito il prossimo passo.</li>
</ol>
<p>Aggiungi sul sito una pagina per i proprietari ("Vuoi vendere? Ti preparo una valutazione") con il suo modulo: sono i contatti che portano incarichi.</p>
<p>Con <a href="/it">Agente Immo</a>, nei piani Plus e Pro, il sito personale mostra i tuoi immobili e ha un modulo di contatto: ogni richiesta ti arriva via email con i dati della persona e il link all'immobile da cui è partita, pronta da registrare nel tuo CRM.</p>`,
    },
  ],
  faq: [
    [`Cos'è un CRM immobiliare?`, `È un software che raccoglie tutti i contatti dell'agente (proprietari, acquirenti, inquilini) con la loro storia e il prossimo passo da fare. Serve a rispondere in fretta, richiamare al momento giusto e non perdere clienti nel tempo.`],
    [`Qual è la differenza tra CRM e gestionale immobiliare?`, `Il CRM è centrato sui contatti e sulle trattative, il gestionale include anche immobili, pubblicazione sui portali e documenti. Molti prodotti sul mercato uniscono le due funzioni.`],
    [`Posso usare un CRM generico invece di uno immobiliare?`, `Sì, per la parte contatti e pipeline può bastare. Ti mancheranno però funzioni specifiche come l'abbinamento tra richieste e immobili e la pubblicazione sui portali, che dovrai gestire altrove.`],
    [`Quanto spesso devo richiamare un proprietario che non ha ancora deciso?`, `Non c'è una frequenza giusta per tutti: dipende dai tempi che ti ha indicato. L'importante è fissare sempre una data di richiamo e portare ogni volta un motivo concreto, come una vendita in zona o un'idea per la sua casa.`],
    [`Serve il consenso per salvare i contatti nel CRM?`, `Per gestire una richiesta o un incarico il trattamento è legato al servizio che il cliente ti chiede, ma devi fornire l'informativa. Per invii commerciali e newsletter serve in genere un consenso specifico. Per casi particolari chiedi a un consulente privacy.`],
    [`Come faccio ad avere più lead diretti e meno dipendenza dai portali?`, `Lavora sui canali dove ti cercano per nome: un sito personale con modulo di contatto, i social con contenuti sulla tua zona, il passaparola dei clienti passati. Registra sempre la fonte nel CRM per capire cosa funziona.`],
  ],
}

export const sitoWeb: Guide = {
  slug: 'sito-web-agente-immobiliare',
  label: 'Sito web agente immobiliare',
  title: `Sito web agente immobiliare: pagine, SEO locale e costi`,
  description: `Sito web per agente immobiliare: perché serve oltre ai portali, le pagine indispensabili, come farsi trovare su Google in zona, quanto costa e come farlo.`,
  h1: `Sito web per agente immobiliare: come farlo e farti trovare in zona`,
  intro: `Un sito web da agente immobiliare è il posto dove proprietari e acquirenti trovano te, non solo l'annuncio: le tue proposte, la tua zona e un modo semplice per contattarti. Qui vedi quali pagine servono, come farti trovare su Google e cosa determina il costo.`,
  published: '2026-09-30',
  updated: '2026-09-30',
  sections: [
    {
      id: 'perche-un-sito-oltre-ai-portali',
      title: `Perché un sito personale se ci sono già i portali`,
      html: `<p>I portali servono a far vedere gli immobili a chi cerca casa. Ma sul portale il protagonista è l'immobile, non tu: accanto al tuo annuncio ci sono quelli di tutte le altre agenzie. Un <strong>sito personale</strong> fa un lavoro diverso.</p>
<ul>
  <li><strong>Convince i proprietari</strong>. Chi deve affidarti la casa cerca il tuo nome prima dell'appuntamento. Trovare un sito curato, con immobili presentati bene, gli dice come verrà presentata la sua casa. Vedi la guida su come <a href="/it/acquisire-incarichi-immobiliari">acquisire incarichi immobiliari</a>.</li>
  <li><strong>Porta contatti diretti</strong>. Chi ti scrive dal tuo sito cerca te, non sta mandando lo stesso messaggio a dieci agenzie.</li>
  <li><strong>È tuo</strong>. Le regole, la grafica e i contatti non dipendono da un portale. Se cambi agenzia o strategia, il tuo nome resta.</li>
  <li><strong>Dà una destinazione ai social</strong>. Reel e post portano traffico: senza sito, quel traffico non ha dove andare se non in un messaggio privato.</li>
  <li><strong>Raccoglie tutto in un link</strong>. Da mettere nella firma email, nel profilo Instagram, su WhatsApp, sui biglietti da visita.</li>
</ul>
<p>Il sito non sostituisce i portali: li affianca. Il portale porta la domanda sull'immobile, il sito costruisce la fiducia nell'agente.</p>
<p>In breve: il portale vende l'immobile, il sito vende l'<a href="/it/agente-immobiliare">agente immobiliare</a>. Ed è l'agente che il proprietario sceglie quando affida la casa.</p>`,
    },
    {
      id: 'pagine-indispensabili',
      title: `Le pagine indispensabili di un sito per agenti immobiliari`,
      html: `<p>Un sito da agente non deve essere grande. Deve avere poche pagine chiare, ognuna con uno scopo.</p>
<ol>
  <li><strong>Home</strong>: chi sei, in che zona lavori, i tuoi immobili migliori e un pulsante per contattarti, tutto visibile senza scorrere troppo.</li>
  <li><strong>Immobili</strong>: l'elenco completo, con foto, prezzo, zona e metri. Filtri semplici se sono tanti.</li>
  <li><strong>Pagina del singolo immobile</strong>: foto, descrizione, caratteristiche, mappa della zona e modulo di contatto.</li>
  <li><strong>Chi sono</strong>: foto vera, esperienza, zona, il tuo modo di lavorare. È la pagina che leggono i proprietari.</li>
  <li><strong>Vendi casa</strong>: rivolta ai proprietari, con cosa fai per vendere (foto, video, promozione) e un modulo per chiedere una valutazione.</li>
  <li><strong>Contatti</strong>: telefono, email, WhatsApp, indirizzo dell'ufficio se ne hai uno, orari.</li>
</ol>
<p>Da aggiungere quando il sito funziona:</p>
<ul>
  <li><strong>pagine di zona</strong> (una per quartiere o comune in cui lavori);</li>
  <li><strong>recensioni</strong> di clienti reali, con il loro permesso;</li>
  <li><strong>immobili venduti</strong>, che mostrano ai proprietari i risultati ottenuti.</li>
</ul>
<p>Non dimenticare le pagine obbligatorie: <strong>informativa privacy</strong>, eventuale <strong>cookie policy</strong> e i dati identificativi della tua attività, come partita IVA, che vanno indicati sul sito.</p>`,
    },
    {
      id: 'seo-locale-google',
      title: `Come farsi trovare su Google in zona: SEO locale e Google Business Profile`,
      html: `<p>Nessun agente deve competere con i portali su "case in vendita Milano". Il terreno giusto è la <strong>ricerca locale</strong>: il tuo nome, la tua zona, le ricerche dei proprietari.</p>
<h3>Google Business Profile</h3>
<ul>
  <li>crea o rivendica la scheda con nome, categoria, indirizzo (o area servita se lavori senza ufficio aperto al pubblico), telefono e link al sito;</li>
  <li>aggiungi foto vere tue e dell'ufficio;</li>
  <li>chiedi le <strong>recensioni</strong> ai clienti soddisfatti dopo il rogito e rispondi a tutte;</li>
  <li>pubblica aggiornamenti: nuovi immobili, vendite concluse.</li>
</ul>
<h3>Pagine di zona</h3>
<p>Una pagina per ogni quartiere o comune in cui lavori, con contenuto vero: com'è la zona, che tipo di immobili ci sono, servizi, trasporti, per chi è adatta, e gli immobili che hai lì. Titoli come <em>"Agente immobiliare a [quartiere]: vendere e comprare casa in zona"</em> rispondono proprio a ciò che cercano i proprietari. Evita pagine fotocopia con solo il nome del quartiere cambiato: non servono a nessuno.</p>
<h3>Le basi tecniche</h3>
<ul>
  <li>ogni pagina con un titolo e una descrizione propri;</li>
  <li>sito veloce e comodo da telefono;</li>
  <li>nome, indirizzo e telefono identici su sito, scheda Google e profili social;</li>
  <li>immagini leggere e con un testo alternativo descrittivo.</li>
</ul>
<p>Sono risultati che arrivano nel tempo: conta la costanza più della perfezione iniziale.</p>`,
    },
    {
      id: 'pagina-immobile',
      title: `La pagina dell'immobile: cosa deve contenere`,
      html: `<p>La pagina del singolo immobile è quella che riceve più visite, soprattutto da social e WhatsApp. Deve convincere a chiedere una visita.</p>
<ul>
  <li><strong>Foto grandi e ordinate</strong>: prima la migliore, poi un percorso logico della casa. Luce naturale, stanze in ordine. Vedi la guida per <a href="/it/migliorare-foto-annuncio-immobiliare">migliorare le foto dell'annuncio</a>.</li>
  <li><strong>Dati chiave subito visibili</strong>: prezzo, metri, locali, bagni, piano, classe energetica.</li>
  <li><strong>Descrizione chiara</strong>, con i punti di forza reali e le informazioni che l'acquirente cerca. Ecco <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</li>
  <li><strong>Mappa della zona</strong>, anche indicativa se il proprietario non vuole l'indirizzo preciso.</li>
  <li><strong>Planimetria</strong> se disponibile.</li>
  <li><strong>Video</strong> breve, lo stesso che pubblichi sui social.</li>
  <li><strong>Modulo di contatto e WhatsApp</strong> vicino alle foto e in fondo alla pagina.</li>
</ul>
<p>Se usi foto arredate virtualmente, indicalo chiaramente e mostra anche lo stato reale della stanza. È una questione di correttezza verso chi visita, approfondita nella guida sul <a href="/it/virtual-staging-legale">virtual staging legale</a>.</p>
<p>Uno strumento come <a href="/it">Agente Immo</a> può aiutarti a preparare questi contenuti: arredi o svuoti le stanze, crei un video "Prima e dopo" dalle foto e riscrivi titolo e descrizione. Puoi <a href="/it#prova">provarlo gratis su una tua foto</a>.</p>`,
    },
    {
      id: 'modulo-contatto-whatsapp',
      title: `Modulo di contatto e WhatsApp: come trasformare le visite in richieste`,
      html: `<p>Un sito con tante visite e poche richieste ha quasi sempre un problema di contatto: troppo nascosto, troppo lungo o troppo generico.</p>
<h3>Il modulo</h3>
<ul>
  <li><strong>pochi campi</strong>: nome, email o telefono, messaggio. Il resto lo chiedi quando rispondi;</li>
  <li><strong>messaggio già impostato</strong> sulla pagina dell'immobile, per esempio <em>"Vorrei ricevere informazioni o fissare una visita per questo immobile"</em>;</li>
  <li><strong>informativa privacy</strong> collegata e, se vuoi mandare comunicazioni commerciali, una casella di consenso separata e non pre-selezionata;</li>
  <li><strong>conferma chiara</strong> dopo l'invio, con i tempi di risposta.</li>
</ul>
<h3>WhatsApp</h3>
<p>Molti clienti preferiscono scrivere su WhatsApp. Un pulsante con un messaggio precompilato che cita l'immobile abbassa ancora la soglia: <em>"Buongiorno, ho visto sul suo sito il trilocale in via [via] e vorrei qualche informazione."</em></p>
<h3>Dopo la richiesta</h3>
<p>La velocità di risposta conta più della grafica. Ogni richiesta va registrata con la fonte "sito" nel tuo <a href="/it/crm-immobiliare">CRM immobiliare</a>, con il prossimo passo e una data. Controlla che le email del modulo non finiscano nello spam: fai una prova ogni tanto.</p>
<p>Per i proprietari, metti un modulo dedicato nella pagina "Vendi casa": chi chiede una valutazione è il contatto più prezioso che il sito possa portarti.</p>`,
    },
    {
      id: 'quanto-costa-sito',
      title: `Quanto costa un sito per agente immobiliare e da cosa dipende`,
      html: `<p>Non esiste un prezzo unico: il costo di un sito dipende da come lo fai e da cosa ci metti dentro. Le strade principali sono tre.</p>
<h3>Agenzia web o sviluppatore su misura</h3>
<p>Grafica personalizzata e funzioni su richiesta. Il costo dipende da numero di pagine, integrazioni (per esempio il collegamento al gestionale), testi e foto inclusi, tempi. Poi ci sono i costi annuali: dominio, hosting, manutenzione e aggiornamenti. Conviene se hai esigenze particolari o un'agenzia con un marchio da costruire.</p>
<h3>Costruttori di siti generici con template</h3>
<p>Spesa più bassa e controllo diretto, ma il lavoro è tuo: scegliere il template, scrivere le pagine, caricare e aggiornare ogni immobile a mano. Il rischio tipico è un sito fatto bene all'inizio e poi mai aggiornato.</p>
<h3>Siti inclusi in strumenti per agenti</h3>
<p>Alcuni gestionali e piattaforme per agenti includono un sito già pronto, collegato agli immobili che gestisci lì. Meno libertà grafica, ma gli immobili si aggiornano da soli.</p>
<h3>Le domande da fare prima di scegliere</h3>
<ul>
  <li>chi aggiorna gli immobili, e quanto tempo richiede?</li>
  <li>il dominio è intestato a te?</li>
  <li>quali sono i costi ricorrenti ogni anno, non solo quello iniziale?</li>
  <li>il sito è comodo da telefono e veloce?</li>
  <li>se smetti di pagare, cosa succede ai contenuti?</li>
</ul>
<p>Per un agente singolo, il criterio più importante è di solito uno: <strong>un sito che resta aggiornato senza lavoro extra</strong>.</p>`,
    },
    {
      id: 'sito-agente-immo',
      title: `Come funziona il sito personale di Agente Immo`,
      html: `<p><a href="/it">Agente Immo</a> include un sito personale per l'agente nei piani <strong>Plus</strong> (49 € al mese) e <strong>Pro</strong> (59 € al mese con pagamento annuale, 69 € al mese con pagamento trimestrale). Il piano Starter comprende foto e video ma non il sito.</p>
<p>Come funziona:</p>
<ol>
  <li><strong>Scegli un modello pronto</strong>: non serve saper fare siti né scrivere codice.</li>
  <li><strong>I tuoi immobili compaiono in automatico</strong>: quelli che gestisci nella sezione immobili, con la mappa, le foto (anche quelle arredate o migliorate con l'AI) e le descrizioni.</li>
  <li><strong>Il sito ha un indirizzo tuo</strong>, del tipo <em>agenteimmo.me/it/a/tuonome</em>, da mettere nel profilo Instagram, nella firma email e su WhatsApp.</li>
  <li><strong>Il modulo di contatto</strong> ti manda ogni richiesta via email, con i dati della persona e il link all'immobile da cui è partita.</li>
</ol>
<p>È pensato per chi vuole un sito sempre allineato ai propri immobili senza gestirlo a parte. Se invece ti serve un dominio personalizzato con un marchio d'agenzia, pagine molto particolari o l'integrazione con un gestionale specifico, un sito su misura può essere più adatto: le due soluzioni possono anche convivere.</p>
<p>Nello stesso posto prepari i contenuti degli immobili: foto arredate o svuotate, video per i social, testi riscritti e il controllo "Miglioralo" di un annuncio esistente. Puoi iniziare dalla <a href="/it#prova">prova gratuita</a> con una foto e un video.</p>`,
    },
  ],
  faq: [
    [`Un agente immobiliare ha bisogno di un sito web?`, `Non è obbligatorio, ma aiuta molto: i proprietari cercano il tuo nome prima di affidarti la casa, e un sito curato con i tuoi immobili ti rende riconoscibile. Porta inoltre contatti diretti, che non stanno scrivendo contemporaneamente a dieci agenzie.`],
    [`Quanto costa un sito per agente immobiliare?`, `Dipende dalla strada: un sito su misura costa di più e ha costi annuali di hosting e manutenzione, un costruttore di siti costa meno ma richiede il tuo tempo, alcune piattaforme per agenti lo includono nell'abbonamento. Confronta sempre i costi ricorrenti, non solo quello iniziale.`],
    [`Quali pagine deve avere il sito di un agente immobiliare?`, `Home, elenco immobili, pagina di ogni immobile, chi sono, una pagina per chi vuole vendere e i contatti. Poi pagine di zona e recensioni, più informativa privacy e dati dell'attività.`],
    [`Come fa un agente a farsi trovare su Google nella sua zona?`, `Con una scheda Google Business Profile completa e piena di recensioni vere, pagine dedicate ai quartieri in cui lavora con contenuti utili, e dati di contatto identici ovunque. Non conviene competere con i portali sulle ricerche generiche.`],
    [`Meglio il sito dell'agenzia o un sito personale?`, `Se lavori in un'agenzia, il sito dell'agenzia resta il riferimento; un sito personale serve a costruire il tuo nome, soprattutto se lavori molto sui social o in proprio. Verifica sempre con l'agenzia le regole sull'uso di immobili e marchio.`],
    [`Posso mettere foto arredate virtualmente sul mio sito?`, `Sì, a patto di indicare chiaramente che sono elaborazioni e di mostrare anche lo stato reale dell'immobile. Chi visita il sito non deve essere indotto a pensare che la casa sia arredata così.`],
  ],
}

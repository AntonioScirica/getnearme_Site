import type { Guide } from './types';

// Guide su portali, canali di contatto e gestionali: costi dei portali per agenzie, contatti senza portali,
// gestionale gratuito, alternative a Getrix e Miogest.
// Prezzi e fatti di terzi verificati su fonti ufficiali a ottobre 2026; dove il listino non è pubblico si dice "su preventivo".
// Concorrenti solo con fatti verificabili e neutri, niente giudizi.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const costoPortaliAgenzie: Guide = {
  slug: 'costo-immobiliare-it-agenzie',
  label: 'Costo dei portali per agenzie',
  title: `Immobiliare.it costo agenzia: abbonamenti e portali`,
  description: `Immobiliare.it costo agenzia: come funzionano gli abbonamenti, anche su Idealista e Casa.it, cosa chiedere prima di firmare e come calcolare il ritorno.`,
  h1: `Immobiliare.it costo agenzia: come funzionano gli abbonamenti ai portali immobiliari`,
  intro: `Per le agenzie, Immobiliare.it, Idealista e Casa.it non pubblicano un listino unico: il costo dell'abbonamento si definisce su preventivo e dipende soprattutto da quanti annunci pubblichi, dalla visibilità extra e dai servizi aggiunti. Qui trovi come è fatto un abbonamento, cosa chiedere prima di firmare e come capire se ti conviene, con i numeri della tua agenzia.`,
  updated: '2026-10-02',
  sections: [
    {
      id: 'come-funzionano-i-costi',
      title: `Immobiliare.it costo agenzia: come funzionano i prezzi`,
      html: `<p>La prima cosa da sapere è che <strong>non esiste un listino pubblico per le agenzie</strong>. A ottobre 2026 né Immobiliare.it né Idealista né Casa.it pubblicano sul proprio sito i prezzi degli abbonamenti per professionisti: si compila un modulo o si parla con un commerciale, che propone un pacchetto e un prezzo. Le cifre che circolano nei forum di settore sono testimonianze di singoli agenti, spesso vecchie di anni e legate a una zona precisa: utili per farsi un'idea, non per decidere.</p>
<p>Il prezzo che ti verrà proposto dipende in genere da alcune variabili, che conviene conoscere per poterle discutere una per una:</p>
<ul>
  <li><strong>Numero di annunci</strong> che puoi tenere online contemporaneamente, spesso diviso tra vendita e affitto.</li>
  <li><strong>Visibilità extra</strong>: annunci in evidenza, in vetrina, in cima ai risultati, per un certo periodo o per un certo numero di immobili.</li>
  <li><strong>Zona</strong>: molti agenti riferiscono che i prezzi cambiano da un'area all'altra, perché cambia la concorrenza tra agenzie e il traffico sul portale.</li>
  <li><strong>Servizi aggiuntivi</strong>: profilo agenzia evidenziato, strumenti per l'acquisizione, valutazioni, tour virtuali, gestionale.</li>
  <li><strong>Durata e condizioni del contratto</strong>: annuale o pluriennale, rinnovo automatico, periodo di preavviso per disdire.</li>
</ul>
<p>Per un privato il discorso è diverso: in genere può pubblicare gratis un numero limitato di annunci e pagare solo le opzioni di visibilità. Per esempio, secondo le FAQ ufficiali di Casa.it (consultate a ottobre 2026), chiunque può pubblicare gratuitamente fino a 6 annunci di vendita o affitto. Le condizioni per privati però non dicono nulla su quanto pagherai tu come agenzia.</p>`,
    },
    {
      id: 'confronto-portali',
      title: `Immobiliare.it, Idealista e Casa.it: cosa sapere prima del preventivo`,
      html: `<p>I tre portali più usati in Italia appartengono a due gruppi. Saperlo ti aiuta a capire quali servizi sono collegati tra loro e cosa chiedere in fase di trattativa. Ecco un quadro di fatti verificabili, aggiornato a ottobre 2026:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Immobiliare.it</th><th ${TH}>Idealista</th><th ${TH}>Casa.it</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Gruppo</strong></td><td ${TD}>Immobiliare.it</td><td ${TD}>idealista</td><td ${TD}>idealista (Casa.it è entrata nel gruppo nel 2020)</td></tr>
    <tr><td ${TD}><strong>Listino agenzie pubblico</strong></td><td ${TD}>No, su preventivo</td><td ${TD}>No, su preventivo</td><td ${TD}>No, su preventivo</td></tr>
    <tr><td ${TD}><strong>Gestionale dello stesso gruppo</strong></td><td ${TD}>Getrix</td><td ${TD}>Miogest e Gestim, acquisiti nel 2020</td><td ${TD}>Come Idealista</td></tr>
    <tr><td ${TD}><strong>Cosa chiedere in più</strong></td><td ${TD}>Cosa è incluso di Getrix e dei servizi collegati</td><td ${TD}>Se il contratto include anche la pubblicazione su Casa.it</td><td ${TD}>Se serve un contratto separato da quello Idealista</td></tr>
  </tbody>
</table>
<p>Due conseguenze pratiche:</p>
<ul>
  <li><strong>Chiedi sempre cosa è incluso nel pacchetto di gruppo</strong>: gestionale, pubblicazione su più portali dello stesso gruppo, strumenti di valutazione. Due preventivi con la stessa cifra possono contenere cose molto diverse.</li>
  <li><strong>Verifica come pubblicherai</strong>: con il gestionale del portale, con un gestionale esterno che invia gli annunci (multinvio), o a mano. Se usi già un gestionale, chiedi per iscritto se è compatibile con il portale e con quali limiti. Per capire le differenze tra gli strumenti, leggi la guida alle <a href="/it/alternative-getrix-miogest">alternative a Getrix e Miogest</a>.</li>
</ul>`,
    },
    {
      id: 'costo-abbonamento',
      title: `Costo abbonamento Immobiliare.it e altri portali: le voci del preventivo`,
      html: `<p>Quando ricevi una proposta, scomponila. Un preventivo serio dovrebbe permetterti di vedere chiaramente queste voci:</p>
<ol>
  <li><strong>Canone base</strong>: cosa paghi ogni mese o ogni anno, IVA esclusa o inclusa.</li>
  <li><strong>Numero di annunci inclusi</strong>, separati tra vendita e affitto, e cosa succede se li superi.</li>
  <li><strong>Visibilità inclusa</strong>: quanti annunci in evidenza o in vetrina, per quanto tempo, e se puoi spostarli da un immobile all'altro.</li>
  <li><strong>Costo della visibilità extra</strong> per singolo annuncio, se vorrai comprarla dopo.</li>
  <li><strong>Servizi inclusi</strong>: gestionale, strumenti di acquisizione, report di valutazione, tour virtuali, profilo agenzia.</li>
  <li><strong>Durata, rinnovo e disdetta</strong>: se il contratto si rinnova da solo, con quanto preavviso puoi disdire e se il prezzo del rinnovo è bloccato.</li>
  <li><strong>Promozioni di ingresso</strong>: se il primo anno è scontato, quanto costerà dal secondo.</li>
</ol>
<h3>Immobiliare.it costo annuncio: si paga a immobile?</h3>
<p>Per le agenzie, di solito non si paga il singolo annuncio base: si paga un pacchetto che consente di tenere online un certo numero di annunci. Si paga invece a parte, o si consuma dal pacchetto, la <strong>visibilità extra</strong> su singoli immobili. Per sapere quanto costa nel tuo caso un annuncio in evidenza, chiedilo esplicitamente nel preventivo: è la voce che più spesso fa crescere la spesa nel corso dell'anno.</p>
<p>Un consiglio: chiedi lo stesso tipo di preventivo, con lo stesso numero di annunci, a tutti i portali che stai valutando. Solo così il confronto è sui numeri e non sulle sensazioni.</p>`,
    },
    {
      id: 'prima-di-sottoscrivere',
      title: `Cosa sapere prima di sottoscrivere un abbonamento ai portali`,
      html: `<p>Prima di firmare, fatti queste domande e porta le risposte per iscritto:</p>
<ul>
  <li><strong>Quanti immobili avrò davvero online?</strong> Conta gli incarichi attivi e quelli che prevedi di acquisire nei prossimi mesi. Pagare 50 annunci per tenerne online 15 è uno spreco, restare sotto la soglia ti costringe a scegliere quali immobili nascondere.</li>
  <li><strong>Dove cercano i miei acquirenti?</strong> Chiedi ai clienti che hai seguito nell'ultimo anno da dove sono arrivati. Se il tuo gestionale o <a href="/it/crm-immobiliare">CRM immobiliare</a> registra la fonte di ogni contatto, hai già la risposta.</li>
  <li><strong>Posso provare prima?</strong> Alcuni agenti riferiscono di aver ottenuto periodi di prova o condizioni d'ingresso: chiedilo, non costa nulla.</li>
  <li><strong>Posso uscire?</strong> Leggi la clausola di rinnovo automatico e il preavviso di disdetta. Segna la data in agenda il giorno stesso della firma.</li>
  <li><strong>Chi possiede i contatti?</strong> Le richieste arrivano a te, ma passano dal portale: verifica come vengono trattati i dati e cosa resta a te se smetti di pubblicare.</li>
  <li><strong>Sono pronto a usarlo bene?</strong> Un abbonamento con annunci dalle foto buie e testi copiati rende meno di quanto potrebbe. Prima di aumentare la spesa, sistema la qualità degli annunci.</li>
</ul>`,
    },
    {
      id: 'valutare-il-ritorno',
      title: `Come valutare il ritorno di un portale immobiliare`,
      html: `<p>Il portale giusto non è quello più economico né quello più famoso: è quello che, nella tua zona e per i tuoi immobili, ti porta <strong>contatti utili a un costo sostenibile</strong>. Per capirlo bastano tre numeri, da raccogliere per almeno tre mesi:</p>
<ol>
  <li><strong>Costo mensile</strong> del portale, comprese le visibilità extra.</li>
  <li><strong>Contatti ricevuti</strong> dal portale nel mese.</li>
  <li><strong>Contatti utili</strong>: persone con cui hai fatto almeno una visita, o proprietari che ti hanno chiesto una valutazione.</li>
</ol>
<p>Con questi dati calcoli due indicatori semplici: il <strong>costo per contatto</strong> (costo mensile diviso contatti ricevuti) e il <strong>costo per contatto utile</strong> (costo mensile diviso contatti utili). Il secondo è quello che conta. Usa una tabella come questa, una riga per canale:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Canale</th><th ${TH}>Costo mese</th><th ${TH}>Contatti</th><th ${TH}>Contatti utili</th><th ${TH}>Costo per contatto utile</th><th ${TH}>Incarichi o vendite</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Portale A</td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td></tr>
    <tr><td ${TD}>Portale B</td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td></tr>
    <tr><td ${TD}>Sito personale</td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td></tr>
    <tr><td ${TD}>Social e passaparola</td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td><td ${TD}></td></tr>
  </tbody>
</table>
<p>Ricorda anche il ritorno indiretto: un portale porta acquirenti, ma porta anche <strong>proprietari</strong> che vedono i tuoi annunci e ti chiamano per vendere. Se una parte dei tuoi incarichi nasce così, mettilo nel conto. Per ragionare sul valore di ogni incarico, vedi la guida alla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>
<p>Dopo tre mesi la decisione è più semplice: aumenti dove il costo per contatto utile è basso, riduci o rinegozi dove è alto, e sposti budget su canali che lavorano solo per te, come il <a href="/it/ricevere-contatti-senza-portali">sito e gli altri canali diretti</a>.</p>`,
    },
    {
      id: 'migliorare-la-resa',
      title: `Come far rendere di più l'abbonamento che già paghi`,
      html: `<p>Prima di comprare visibilità extra, lavora su quello che decide se un annuncio viene aperto e se genera una chiamata:</p>
<ul>
  <li><strong>Foto di copertina</strong>: luminosa, dritta, con la stanza più bella. È la prima cosa che si vede nella lista dei risultati. Trovi come fare nella guida per <a href="/it/migliorare-foto-annuncio-immobiliare">migliorare le foto di un annuncio</a>.</li>
  <li><strong>Stanze vuote o datate</strong>: mostrale anche arredate in foto, dichiarandolo, accanto all'originale. Leggi le regole nella guida al <a href="/it/virtual-staging-legale">virtual staging legale</a>.</li>
  <li><strong>Titolo e descrizione</strong>: specifici, con i punti di forza veri in alto. Vedi <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</li>
  <li><strong>Dati completi</strong>: classe energetica, spese, piano, planimetria. Un annuncio incompleto riceve domande invece di visite.</li>
  <li><strong>Risposte rapide</strong>: un contatto richiamato dopo due giorni spesso ha già fissato una visita con un'altra agenzia.</li>
</ul>
<p>Con <a href="/it">Agente Immo</a> puoi arredare o svuotare in foto una stanza scrivendo cosa vuoi in una chat, e trasformare le stesse foto in un video per i social con la musica già inclusa. Costa da 19 € al mese, meno di quanto spesso si spende per mettere in evidenza un solo annuncio: prima di aumentare il budget sul portale, vale la pena provare a migliorare quello che pubblichi.</p>`,
    },
  ],
  faq: [
    [`Quanto costa Immobiliare.it per un'agenzia?`, `Immobiliare.it non pubblica un listino per le agenzie: il prezzo si definisce su preventivo e dipende da numero di annunci, visibilità extra, servizi inclusi e zona. Le cifre che si leggono nei forum sono testimonianze vecchie e locali: chiedi un'offerta scritta e confrontala con gli altri portali a parità di annunci.`],
    [`Immobiliare.it costo annuncio: si paga per ogni immobile?`, `Per le agenzie di solito si paga un pacchetto che include un certo numero di annunci online. La visibilità extra sui singoli immobili, come evidenza o vetrina, si paga a parte o si consuma dal pacchetto. Chiedi nel preventivo il costo esatto di ogni opzione.`],
    [`Idealista e Casa.it fanno parte dello stesso gruppo?`, `Sì, Casa.it è entrata nel gruppo idealista nel 2020 e mantiene il proprio marchio. Se valuti entrambi, chiedi al commerciale se un unico contratto copre la pubblicazione su tutti e due e cosa include.`],
    [`Come capire se un portale immobiliare conviene?`, `Per almeno tre mesi registra costo mensile, contatti ricevuti e contatti utili, cioè quelli che portano a una visita o a una valutazione. Dividi il costo per i contatti utili: il portale con il costo per contatto utile più basso è quello che rende di più nella tua zona.`],
    [`Si può avere un periodo di prova sui portali per agenzie?`, `Non c'è una regola pubblica, ma alcuni agenti riferiscono di aver ottenuto prove o condizioni di ingresso. Chiedilo sempre in fase di preventivo, insieme al prezzo che pagherai dopo la promozione.`],
    [`Conviene stare su tutti i portali?`, `Dipende da budget, numero di incarichi e zona. Molte agenzie partono da uno o due portali, misurano i risultati e poi decidono. Affiancare canali diretti, come sito personale e profilo Google, riduce la dipendenza da un solo portale.`],
  ],
};

export const contattiSenzaPortali: Guide = {
  slug: 'ricevere-contatti-senza-portali',
  label: 'Contatti senza portali',
  title: `Alternative ai portali immobiliari: ricevere contatti`,
  description: `Alternative ai portali immobiliari: sito personale, Google Business Profile, social, passaparola, cartelli e newsletter per ricevere contatti diretti.`,
  h1: `Alternative ai portali immobiliari: come ricevere contatti senza dipendere solo dai portali`,
  intro: `Per ricevere contatti immobiliari senza portali servono canali che lavorano a tuo nome: un sito personale con i tuoi immobili, il profilo Google della tua attività, i social, il passaparola, cartelli e vetrina, una newsletter. Nessuno sostituisce da solo un portale, ma insieme riducono la dipendenza e portano richieste che arrivano solo a te. Qui trovi come usarli e come combinarli con i portali.`,
  updated: '2026-10-02',
  sections: [
    {
      id: 'perche-canali-diretti',
      title: `Perché cercare alternative ai portali immobiliari`,
      html: `<p>I portali restano il posto dove la maggior parte degli acquirenti comincia a cercare casa, e rinunciarvi del tutto raramente ha senso. Il problema è affidarsi <strong>solo</strong> a loro:</p>
<ul>
  <li><strong>Il costo cresce con te</strong>: più incarichi hai, più annunci e visibilità devi comprare. Su come funzionano gli abbonamenti, vedi la guida al <a href="/it/costo-immobiliare-it-agenzie">costo dei portali per le agenzie</a>.</li>
  <li><strong>Sei uno tra tanti</strong>: il tuo immobile compare accanto a quelli di altre agenzie, e l'acquirente ricorda il portale più del tuo nome.</li>
  <li><strong>Le regole le decide qualcun altro</strong>: prezzi, visibilità, condizioni di pubblicazione possono cambiare a ogni rinnovo.</li>
  <li><strong>I portali portano soprattutto acquirenti</strong>: gli incarichi, cioè i proprietari, nascono spesso da fiducia e conoscenza locale, che si costruiscono altrove.</li>
</ul>
<p>L'obiettivo realistico non è abbandonare i portali, ma <strong>avere una quota crescente di contatti diretti</strong>: persone che ti cercano per nome, che arrivano dal tuo sito, che ti scrivono dopo aver visto un tuo video. Sono i contatti più economici e spesso i più fedeli.</p>`,
    },
    {
      id: 'sito-personale',
      title: `Sito personale: le richieste immobiliari che arrivano solo a te`,
      html: `<p>Il sito è il centro di tutti gli altri canali: il profilo Google, i social, i cartelli e il passaparola portano lì. Per un agente immobiliare un sito utile ha poche cose, ma fatte bene:</p>
<ul>
  <li><strong>Tutti i tuoi immobili</strong>, ognuno con una pagina propria, foto, dati completi e un modo semplice per chiedere informazioni.</li>
  <li><strong>Chi sei</strong>: foto vera, zona in cui lavori, come lavori, recensioni.</li>
  <li><strong>Un modulo e un contatto WhatsApp</strong>, con risposta rapida.</li>
  <li><strong>Una pagina per i proprietari</strong>: \"Vuoi vendere? Ti preparo una valutazione gratuita\".</li>
  <li><strong>Aggiornamento automatico</strong>: se devi ricaricare a mano ogni immobile, prima o poi il sito resterà indietro rispetto ai portali.</li>
</ul>
<p>Un sito non porta traffico da solo il primo giorno: lo porti tu, mettendo il link ovunque (profilo Google, social, firma email, cartelli, schede immobile). Con il tempo le pagine degli immobili e della tua zona possono comparire anche su Google.</p>
<p>Su <a href="/it">Agente Immo</a>, con i piani Plus e Pro, hai un sito da agente con 10 modelli, il tuo nome e il tuo link: ogni immobile che carichi va online da solo con la sua pagina e i dati strutturati per Google, e le richieste arrivano a te, non a un portale. Per tutti i dettagli su cosa mettere in un sito, leggi la guida al <a href="/it/sito-web-agente-immobiliare">sito web dell'agente immobiliare</a>.</p>`,
    },
    {
      id: 'google-business-profile',
      title: `Google Business Profile: farti trovare da chi cerca un'agenzia in zona`,
      html: `<p>Il profilo dell'attività su Google (Google Business Profile) è gratuito ed è quello che compare su Google Maps e nella ricerca quando qualcuno scrive \"agenzia immobiliare\" seguito dal nome del quartiere. Per molti proprietari è il primo contatto con te.</p>
<p>Cosa curare:</p>
<ol>
  <li><strong>Dati corretti e coerenti</strong>: nome, indirizzo, telefono, orari e link al sito identici a quelli del sito e dei social.</li>
  <li><strong>Categoria giusta</strong> e una descrizione che dica in quali zone lavori.</li>
  <li><strong>Foto vere</strong>: ufficio, vetrina, squadra, immobili venduti o in vendita.</li>
  <li><strong>Recensioni</strong>: chiedile dopo ogni rogito o contratto firmato, con un link diretto. Rispondi a tutte, anche a quelle critiche, con calma e senza dati personali del cliente.</li>
  <li><strong>Aggiornamenti</strong>: pubblica i nuovi immobili e le vendite chiuse, rispettando la riservatezza dei clienti.</li>
</ol>
<p>Per un agente che lavora da casa senza ufficio aperto al pubblico, le regole di Google prevedono impostazioni specifiche per le attività che servono i clienti presso il loro indirizzo: controllale nella guida ufficiale prima di creare il profilo.</p>`,
    },
    {
      id: 'social',
      title: `Social: video e contenuti che portano contatti diretti`,
      html: `<p>Sui social nessuno cerca casa come su un portale, ma molte persone ti notano lì e si ricordano di te quando devono vendere o comprare. Funzionano soprattutto:</p>
<ul>
  <li><strong>Video brevi degli immobili</strong>: un prima e dopo della stanza vuota arredata, una camminata dentro casa, la vista dal balcone. Trovi idee e formati nella guida ai <a href="/it/reel-immobiliari-instagram-tiktok">reel immobiliari per Instagram e TikTok</a>.</li>
  <li><strong>Te in video</strong>: chi sei, come lavori, cosa succede in zona. La fiducia passa dalla faccia.</li>
  <li><strong>Vendite chiuse</strong>: \"venduto\" con una foto e due righe sul lavoro fatto, sempre con il consenso del cliente.</li>
  <li><strong>Consigli utili</strong>: documenti per vendere, come si prepara una casa alle visite, cosa controllare prima di una proposta.</li>
</ul>
<p>La regola è la costanza: meglio due contenuti a settimana per un anno che venti in un mese e poi silenzio. Metti sempre il link al tuo sito o a WhatsApp nel profilo. Ricorda che, se il post presenta un immobile con i suoi dati, valgono le stesse regole di un annuncio, compresa la classe energetica (vedi <a href="/it/ape-annunci-immobiliari">APE negli annunci</a>).</p>
<p>Il collo di bottiglia è quasi sempre il tempo di montaggio. Agente Immo crea video per i social direttamente dalle foto dell'immobile, con musica inclusa e senza montaggio, con modelli come Prima e dopo, Giorno e notte, Camminata o Con te in video. Approfondisci nella guida ai <a href="/it/video-immobiliari-social">video immobiliari per i social</a>.</p>`,
    },
    {
      id: 'passaparola-cartelli',
      title: `Passaparola, recensioni, cartelli e vetrina`,
      html: `<h3>Passaparola e clienti passati</h3>
<p>I clienti soddisfatti sono la fonte di contatti più economica che hai, ma solo se ti ricordano. Qualche abitudine semplice:</p>
<ul>
  <li>dopo il rogito, chiedi una recensione e se conosce qualcuno che sta pensando di vendere;</li>
  <li>tieni il contatto nel tempo, con il suo consenso: un messaggio per l'anniversario dell'acquisto, un aggiornamento sui prezzi della zona;</li>
  <li>coltiva i rapporti locali: amministratori di condominio, artigiani, professionisti della zona. Ognuno conosce persone che stanno per vendere o comprare.</li>
</ul>
<h3>Cartelli e vetrina</h3>
<p>Il cartello sul balcone o sul portone lavora 24 ore su 24 nella via dove abitano altri potenziali venditori. Rendilo utile:</p>
<ul>
  <li><strong>Un QR code</strong> che porta alla pagina dell'immobile sul tuo sito, non a un portale.</li>
  <li><strong>Il tuo nome e un numero diretto</strong>, ben leggibili da lontano.</li>
  <li><strong>\"Venduto\"</strong> dopo la vendita, se il proprietario è d'accordo: è la prova più forte che lavori in quella via.</li>
</ul>
<p>In vetrina vale lo stesso: schede chiare, classe energetica indicata, un QR verso il sito. E per farti conoscere dai proprietari della zona, una lettera ben scritta funziona ancora: trovi i modelli nella guida alla <a href="/it/lettera-acquisizione-immobili">lettera di acquisizione</a>.</p>`,
    },
    {
      id: 'newsletter',
      title: `Newsletter e messaggi: restare in contatto con chi cerca casa`,
      html: `<p>Molte richieste non diventano subito una visita: la persona cerca, aspetta il mutuo, guarda per mesi. Una newsletter o una lista di aggiornamenti ti permette di restare presente senza telefonare.</p>
<ul>
  <li><strong>Chiedi il consenso</strong> in modo esplicito e separato, e fornisci l'informativa privacy prevista dal Regolamento UE 2016/679. Niente liste comprate, niente indirizzi presi altrove.</li>
  <li><strong>Segmenta in modo semplice</strong>: chi compra, chi affitta, chi vende, per zona.</li>
  <li><strong>Manda solo cose utili</strong>: nuovi immobili in linea con la richiesta, un aggiornamento sui prezzi della zona, un consiglio pratico.</li>
  <li><strong>Frequenza costante e sostenibile</strong>, per esempio una volta al mese, e la possibilità di cancellarsi con un clic.</li>
</ul>
<p>Per gli immobili singoli funziona bene anche un messaggio diretto: una scheda dell'immobile con foto e dati, mandata su WhatsApp a chi ha una richiesta compatibile. Per tenere traccia di chi ha ricevuto cosa, ti serve un <a href="/it/crm-immobiliare">CRM immobiliare</a>, anche semplice.</p>`,
    },
    {
      id: 'combinare-con-portali',
      title: `Come combinare i canali diretti con i portali`,
      html: `<p>Ogni canale ha un ruolo diverso. Pensali come un sistema, non come alternative una all'altra:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Canale</th><th ${TH}>Porta soprattutto</th><th ${TH}>Tempi</th><th ${TH}>Costo</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Portali</td><td ${TD}>Acquirenti e inquilini in cerca attiva</td><td ${TD}>Immediati</td><td ${TD}>Abbonamento su preventivo</td></tr>
    <tr><td ${TD}>Sito personale</td><td ${TD}>Contatti diretti, credibilità verso i proprietari</td><td ${TD}>Crescono nel tempo</td><td ${TD}>Basso, se si aggiorna da solo</td></tr>
    <tr><td ${TD}>Google Business Profile</td><td ${TD}>Proprietari che cercano un'agenzia in zona</td><td ${TD}>Medi, legati alle recensioni</td><td ${TD}>Gratuito</td></tr>
    <tr><td ${TD}>Social</td><td ${TD}>Notorietà, fiducia, contatti futuri</td><td ${TD}>Lunghi, richiedono costanza</td><td ${TD}>Tempo, o uno strumento per i video</td></tr>
    <tr><td ${TD}>Passaparola</td><td ${TD}>Incarichi e clienti già fiduciosi</td><td ${TD}>Lunghi</td><td ${TD}>Solo tempo</td></tr>
    <tr><td ${TD}>Cartelli e vetrina</td><td ${TD}>Contatti di zona, proprietari vicini</td><td ${TD}>Immediati</td><td ${TD}>Basso</td></tr>
    <tr><td ${TD}>Newsletter</td><td ${TD}>Riattivare contatti già raccolti</td><td ${TD}>Medi</td><td ${TD}>Basso</td></tr>
  </tbody>
</table>
<p>Un modo pratico di metterli insieme:</p>
<ol>
  <li><strong>Pubblica ogni immobile sul tuo sito</strong> prima o insieme ai portali, e usa il link del sito su social, cartelli e messaggi.</li>
  <li><strong>Nell'annuncio sui portali</strong> mostra il tuo nome e la tua foto: chi ti nota lì deve poterti ritrovare cercandoti.</li>
  <li><strong>Registra la fonte di ogni contatto</strong>: dopo qualche mese saprai quali canali rendono e potrai spostare budget.</li>
  <li><strong>Ogni immobile diventa più contenuti</strong>: annuncio, pagina sul sito, video, post, cartello con QR, messaggio a chi ha richieste compatibili.</li>
</ol>
<p>Così il portale resta una fonte importante, ma non l'unica, e ogni anno una parte maggiore dei tuoi contatti arriva a te per nome. Per gli strumenti che servono a gestire tutto questo, vedi la guida ai <a href="/it/software-agenti-immobiliari">software per agenti immobiliari</a>.</p>`,
    },
  ],
  faq: [
    [`Si possono vendere immobili senza i portali?`, `Sì, ma per la maggior parte delle agenzie i portali restano una fonte importante di acquirenti. La strada più realistica è affiancare canali diretti, come sito personale, profilo Google, social e passaparola, in modo da ridurre la dipendenza e aumentare i contatti che arrivano solo a te.`],
    [`Qual è la migliore alternativa ai portali immobiliari?`, `Non ce n'è una sola: il sito personale è il centro, perché raccoglie le richieste a tuo nome, e gli altri canali (Google Business Profile, social, cartelli, passaparola) portano persone lì. Insieme funzionano meglio di ciascuno da solo.`],
    [`Il profilo Google è utile a un agente immobiliare?`, `Sì. È gratuito e compare su Google Maps e nelle ricerche locali, che è dove molti proprietari cercano un'agenzia in zona. Dati coerenti, foto vere e recensioni dei clienti sono gli elementi che contano di più.`],
    [`Quanto tempo ci vuole perché il sito porti contatti?`, `Dipende da quanto lo promuovi. All'inizio il traffico arriva soprattutto dai link che metti tu su social, cartelli, profilo Google e messaggi. Con il tempo le pagine degli immobili e della zona possono comparire anche nelle ricerche su Google.`],
    [`Posso mandare una newsletter ai miei contatti?`, `Sì, se hai il loro consenso esplicito per quel tipo di comunicazione e hai fornito l'informativa privacy. Non usare liste comprate o indirizzi raccolti per altri scopi, e permetti sempre di cancellarsi con un clic.`],
    [`Come capire da dove arrivano i miei contatti?`, `Chiedilo a ogni nuovo contatto e registralo nel CRM o nel gestionale, insieme all'esito. Dopo qualche mese puoi confrontare i canali per numero di contatti utili e incarichi, e decidere dove investire.`],
  ],
};

export const gestionaleGratuito: Guide = {
  slug: 'gestionale-immobiliare-gratuito',
  label: 'Gestionale immobiliare gratuito',
  title: `Gestionale immobiliare gratuito: cosa esiste davvero`,
  description: `Gestionale immobiliare gratuito: versioni free, prove gratuite e licenze senza canone, con i limiti reali, quando conviene pagare e una checklist.`,
  h1: `Gestionale immobiliare gratuito: cosa esiste davvero, limiti e quando conviene pagare`,
  intro: `Un gestionale immobiliare gratuito esiste, ma quasi sempre con una condizione: una prova a tempo, un piano free con limiti, una licenza gratuita legata ad altri acquisti o un software gratis che si ripaga con servizi a parte. Qui trovi le formule che esistono davvero, alcuni esempi verificati a ottobre 2026, i limiti da controllare e quando conviene passare a un piano a pagamento.`,
  updated: '2026-10-02',
  sections: [
    {
      id: 'cosa-vuol-dire-gratis',
      title: `Gestionale immobiliare gratuito: cosa vuol dire \"gratis\"`,
      html: `<p>Quando un software immobiliare si presenta come gratuito, può voler dire cose molto diverse. Prima di registrarti, capisci in quale caso sei:</p>
<ul>
  <li><strong>Prova gratuita</strong>: tutto incluso per un periodo limitato, poi si paga. È il caso più frequente. Serve a valutare, non a lavorare gratis.</li>
  <li><strong>Piano free permanente</strong>: gratuito senza scadenza, ma con limiti su utenti, contatti, immobili o funzioni.</li>
  <li><strong>Software gratuito con servizi a pagamento</strong>: il gestionale non costa, il fornitore guadagna con servizi aggiuntivi (visure, marketing, pubblicità).</li>
  <li><strong>Licenza gratuita a condizioni</strong>: gratis se acquisti un altro prodotto o se accetti certe condizioni.</li>
  <li><strong>Incluso in un altro abbonamento</strong>: il gestionale è compreso, o scontato, dentro un pacchetto più ampio, per esempio con un portale.</li>
  <li><strong>Open source</strong>: il software è libero, ma devi installarlo, ospitarlo e mantenerlo tu o un tecnico. Il costo si sposta su server, configurazione e tempo.</li>
</ul>
<p>Nessuna di queste formule è sbagliata. Il punto è sapere in anticipo <strong>cosa succede quando l'agenzia cresce</strong> o quando la condizione gratuita finisce. Se devi ancora capire cosa deve fare un gestionale, parti dalla guida al <a href="/it/gestionale-immobiliare">gestionale immobiliare</a>.</p>`,
    },
    {
      id: 'cosa-esiste',
      title: `Gestionale immobiliare free: esempi verificati`,
      html: `<p>Ecco alcuni esempi delle diverse formule, con le condizioni dichiarate sui siti ufficiali a ottobre 2026. Le offerte cambiano spesso: <strong>verifica sempre sul sito del produttore</strong> prima di decidere. Gli esempi servono a capire le formule, non sono una classifica.</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Prodotto</th><th ${TH}>Formula</th><th ${TH}>Cosa dichiara il produttore</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Realgest</strong></td><td ${TD}>Software gratuito con servizi a pagamento</td><td ${TD}>Gestionale fornito gratuitamente ai clienti, senza scadenza. Offre a parte servizi a pagamento come visure, web marketing e pubblicità.</td></tr>
    <tr><td ${TD}><strong>DataDomus</strong> (Riksoft)</td><td ${TD}>Licenza gratuita a condizioni, demo, licenza perpetua</td><td ${TD}>Software per Windows che lavora in locale. Licenza gratuita per una postazione, a condizioni indicate sul sito; demo scaricabile con limiti su immobili e movimenti; licenza a pagamento indicata in 99 € per postazione.</td></tr>
    <tr><td ${TD}><strong>HubSpot CRM</strong></td><td ${TD}>Piano free permanente</td><td ${TD}>CRM generico, non specifico per il settore immobiliare. Il piano gratuito è senza scadenza, con limiti dichiarati di 2 utenti e 1.000 contatti.</td></tr>
    <tr><td ${TD}><strong>Miogest</strong></td><td ${TD}>Prova gratuita</td><td ${TD}>Prova di 30 giorni senza vincoli, poi abbonamento annuale indicato in 499 € + IVA all'anno.</td></tr>
    <tr><td ${TD}><strong>Getrix</strong></td><td ${TD}>Prova gratuita su richiesta</td><td ${TD}>Gestionale di Immobiliare.it. Prova gratuita richiedibile con un modulo; prezzo non pubblicato, su preventivo.</td></tr>
  </tbody>
</table>
<p>Un esempio di quanto le condizioni cambino: immGest proponeva una versione gratuita per piccole agenzie, ma a ottobre 2026 il suo sito indica che <strong>la versione free non è più disponibile</strong>. Per questo, quando scegli uno strumento gratuito, chiediti anche cosa faresti se domani diventasse a pagamento.</p>
<p>Esistono anche CRM generici open source, da installare su un server proprio: sono gratuiti come licenza, ma richiedono competenze tecniche, manutenzione e un adattamento al lavoro di agenzia (immobili, richieste, incroci, pubblicazione sui portali) che di solito non c'è di serie.</p>`,
    },
    {
      id: 'limiti',
      title: `I limiti tipici dei gestionali gratuiti`,
      html: `<p>Un gestionale gratis può bastare per iniziare. Ma controlla questi punti, perché sono quelli che di solito fanno la differenza tra un piano free e uno a pagamento:</p>
<ul>
  <li><strong>Numero di utenti</strong>: spesso uno o due. Se entra un collaboratore, devi passare di piano.</li>
  <li><strong>Numero di contatti o immobili</strong>: arrivi al limite proprio quando l'attività va bene.</li>
  <li><strong>Pubblicazione sui portali</strong>: è la funzione più importante per un'agenzia e quella più spesso limitata o assente nei CRM generici.</li>
  <li><strong>Incroci tra richieste e immobili</strong>: nei CRM generici non esistono, vanno simulati con filtri e campi personalizzati.</li>
  <li><strong>Assistenza</strong>: nei piani gratuiti è spesso solo via documentazione o assente.</li>
  <li><strong>Postazioni e dispositivi</strong>: un software installato su un solo computer non ti segue in visita sul telefono.</li>
  <li><strong>Backup ed esportazione</strong>: se i dati sono solo sul tuo PC, il backup è responsabilità tua. Se sono online, verifica di poterli esportare.</li>
  <li><strong>Marchio del fornitore</strong> su moduli, email o schede inviate ai clienti.</li>
</ul>`,
    },
    {
      id: 'dati-e-privacy',
      title: `Gestionale gratuito e dati dei clienti: cosa controllare`,
      html: `<p>In un gestionale metti nomi, telefoni, indirizzi, situazioni familiari ed economiche dei tuoi clienti. Gratis o a pagamento, sono <strong>dati personali</strong> di cui sei responsabile come agenzia, secondo il Regolamento UE 2016/679 (GDPR).</p>
<p>Prima di caricare i contatti, verifica:</p>
<ol>
  <li><strong>Dove sono conservati i dati</strong>: sul tuo computer, su server in Europa o altrove.</li>
  <li><strong>Se il fornitore offre un accordo sul trattamento dei dati</strong>: quando un servizio esterno tratta dati per tuo conto, il GDPR (art. 28) prevede un contratto che lo regoli.</li>
  <li><strong>Come esporti tutto</strong>: contatti, immobili, note, documenti, in un formato leggibile come CSV o Excel. Provalo durante la prova, non quando devi cambiare.</li>
  <li><strong>Cosa succede ai dati se smetti di usarlo</strong> o se il piano gratuito viene chiuso.</li>
  <li><strong>Chi può accedere</strong>: utenti, password, permessi diversi per collaboratori.</li>
</ol>
<p>Se hai dubbi sul tuo caso, confrontati con un consulente privacy o con la tua associazione di categoria.</p>`,
    },
    {
      id: 'quando-pagare',
      title: `Quando conviene passare a un gestionale a pagamento`,
      html: `<p>Il gratuito ha senso finché ti fa risparmiare più tempo di quanto te ne fa perdere. Di solito conviene pagare quando si verifica almeno una di queste situazioni:</p>
<ul>
  <li><strong>Pubblichi su più portali</strong> e ricaricare a mano gli stessi immobili ti porta via ore ogni settimana.</li>
  <li><strong>Lavori con altre persone</strong> e servono più utenti, permessi e un'agenda condivisa.</li>
  <li><strong>Hai molte richieste attive</strong> e ti serve l'incrocio automatico con gli immobili.</li>
  <li><strong>Hai perso un contatto o un richiamo</strong> perché il sistema non ti ha avvisato.</li>
  <li><strong>Ti serve assistenza</strong> rapida quando qualcosa non funziona.</li>
</ul>
<p>Per fare il conto, stima le ore al mese che il gestionale ti fa risparmiare e confrontale con il canone. Spesso basta un incarico in più all'anno, nato da un richiamo che non hai dimenticato, per ripagare un abbonamento. Per una panoramica degli strumenti, vedi la guida ai <a href="/it/software-agenti-immobiliari">software per agenti immobiliari</a>, e per il confronto tra due gestionali molto diffusi la guida alle <a href="/it/alternative-getrix-miogest">alternative a Getrix e Miogest</a>.</p>`,
    },
    {
      id: 'gestionale-e-marketing',
      title: `Il gestionale non fa tutto: foto, video e sito`,
      html: `<p>Anche il miglior gestionale, gratuito o no, organizza il lavoro ma non crea la presentazione dell'immobile. Le foto restano quelle che hai scattato, i video vanno fatti a parte, e il sito dipende da cosa offre il fornitore.</p>
<p>Per questo molti agenti affiancano al gestionale uno strumento dedicato alla presentazione. Per esempio <a href="/it">Agente Immo</a>, da 19 € al mese, permette di arredare o svuotare una stanza in foto con una chat, creare video per i social dalle foto con la musica inclusa, e con i piani Plus e Pro avere un sito da agente dove ogni immobile va online da solo. La prova gratuita comprende 1 foto e 1 video, così puoi valutarlo su un tuo incarico prima di pagare.</p>
<p>Per migliorare le foto anche senza strumenti, parti dalle basi: <a href="/it/foto-immobiliari-smartphone">foto immobiliari con lo smartphone</a>.</p>`,
    },
    {
      id: 'checklist',
      title: `Checklist: scegliere un gestionale immobiliare gratuito`,
      html: `<p>Prima di caricare il tuo portafoglio, controlla:</p>
<ol>
  <li>Hai capito quale formula è: prova, piano free, licenza a condizioni, gratis con servizi a pagamento, open source.</li>
  <li>Conosci i limiti su utenti, contatti, immobili e funzioni.</li>
  <li>Sai cosa costerà quando supererai quei limiti, o quando finirà la prova.</li>
  <li>La pubblicazione sui portali che usi è supportata, e lo hai verificato con un annuncio di prova.</li>
  <li>Puoi usarlo dal telefono durante le visite.</li>
  <li>Hai provato a esportare tutti i dati in CSV o Excel.</li>
  <li>Sai dove sono conservati i dati e se c'è un accordo sul trattamento.</li>
  <li>Sai chi ti aiuta se qualcosa non funziona.</li>
  <li>Hai letto le condizioni d'uso, comprese quelle su modifica o chiusura del piano gratuito.</li>
  <li>Hai annotato in agenda la data di fine prova, per decidere con calma e non per inerzia.</li>
</ol>`,
    },
  ],
  faq: [
    [`Esiste un gestionale immobiliare gratuito?`, `Sì, ma quasi sempre con una condizione: un piano free con limiti, una licenza gratuita legata ad altri acquisti, un software gratis che si ripaga con servizi a parte, o una prova a tempo. Leggi le condizioni sul sito del produttore e verifica cosa succede quando superi i limiti.`],
    [`Che differenza c'è tra prova gratuita e versione free?`, `La prova gratuita dà accesso completo per un periodo limitato, poi si paga. La versione free è gratuita senza scadenza ma con limiti su utenti, contatti o funzioni. La prima serve a valutare, la seconda può bastare per iniziare.`],
    [`Un CRM gratuito generico va bene per un'agenzia immobiliare?`, `Può andare bene per gestire contatti e appuntamenti, ma di solito non ha funzioni specifiche come schede immobile, incroci tra richieste e immobili e pubblicazione sui portali. Se pubblichi su più portali, un gestionale immobiliare ti fa risparmiare più tempo.`],
    [`I gestionali gratuiti pubblicano sui portali?`, `Dipende dal prodotto e dal portale. È la prima cosa da verificare, con un annuncio di prova, perché è la funzione che fa risparmiare più tempo a un'agenzia.`],
    [`I dati dei clienti sono al sicuro in un gestionale gratuito?`, `Dipende dal fornitore, non dal prezzo. Verifica dove sono conservati i dati, se c'è un accordo sul trattamento previsto dal GDPR, come fare il backup e come esportare tutto se cambi strumento.`],
    [`Quando conviene pagare un gestionale immobiliare?`, `Quando pubblichi su più portali, lavori con collaboratori, hai molte richieste da incrociare o ti accorgi di perdere contatti e richiami. In questi casi il tempo risparmiato vale di solito più del canone.`],
  ],
};

export const alternativeGetrixMiogest: Guide = {
  slug: 'alternative-getrix-miogest',
  label: 'Alternative a Getrix e Miogest',
  title: `Alternative a Getrix e Miogest: come scegliere`,
  description: `Alternative a Getrix e Miogest: cosa fanno secondo le fonti ufficiali, differenze, altri tipi di strumenti e come scegliere quello giusto per te.`,
  h1: `Alternative a Getrix e Miogest: confronto tra gestionali e strumenti per agenti immobiliari`,
  intro: `Getrix e Miogest sono due gestionali immobiliari molto diffusi in Italia: Getrix fa parte del gruppo Immobiliare.it, Miogest del gruppo idealista. Le alternative non sono solo altri gestionali: esistono anche CRM generici e strumenti dedicati a marketing e presentazione dell'immobile, che fanno un lavoro diverso. Qui trovi cosa fa ciascuno secondo le fonti ufficiali e come scegliere in base a come lavori.`,
  updated: '2026-10-02',
  sections: [
    {
      id: 'cosa-sono',
      title: `Gestionale immobiliare Getrix e Miogest: cosa sono`,
      html: `<p>Entrambi sono <strong>gestionali immobiliari</strong>: software in cui un'agenzia gestisce immobili, clienti, richieste, agenda e pubblicazione degli annunci. Le informazioni che seguono vengono dai siti ufficiali dei due prodotti, consultati a ottobre 2026.</p>
<h3>Getrix</h3>
<p>Getrix è il gestionale di <strong>Immobiliare.it</strong>, pensato per agenzie e costruttori, disponibile online e con app per smartphone e tablet. Tra le funzioni dichiarate: agenda, contatti, immobili e progetti, immagini e video, acquisizione di annunci privati, gestione delle richieste e incroci con gli immobili, valutazione immobiliare, cartello vetrina, invio degli annunci a più portali, virtual tour 360, software per planimetrie, campagne pubblicitarie, email marketing, sito per l'agenzia e un sistema di collaborazione tra agenzie. Il prezzo non è pubblicato: si richiede una prova gratuita compilando un modulo e si viene ricontattati.</p>
<h3>Miogest</h3>
<p>Miogest è un gestionale online nato a Como nel 2009, dal 2020 parte del <strong>gruppo idealista</strong>. Tra le funzioni dichiarate: gestione di clienti, incarichi, richieste e lead, agenda sincronizzata con Google Calendar, messaggi via SMS, email e WhatsApp, esportazione sui portali, sincronizzazione delle richieste da Idealista e Casa.it, multiutente e multiufficio, automazioni con ChatGPT come opzione a pagamento. Il prezzo è pubblico: 499 € + IVA all'anno, con una prova gratuita di 30 giorni.</p>
<p>Per le funzioni che in generale un gestionale deve avere, vedi la guida al <a href="/it/gestionale-immobiliare">gestionale immobiliare</a>.</p>`,
    },
    {
      id: 'getrix-o-miogest',
      title: `Getrix o Miogest: le differenze verificabili`,
      html: `<p>Senza entrare in giudizi, che dipendono da come lavori, ecco le differenze che puoi verificare da solo sui siti ufficiali (dati di ottobre 2026, controlla sempre la versione aggiornata):</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Getrix</th><th ${TH}>Miogest</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Gruppo</strong></td><td ${TD}>Immobiliare.it</td><td ${TD}>idealista (dal 2020)</td></tr>
    <tr><td ${TD}><strong>Prezzo</strong></td><td ${TD}>Non pubblicato, su preventivo</td><td ${TD}>499 € + IVA all'anno, pagamento annuale</td></tr>
    <tr><td ${TD}><strong>Prova</strong></td><td ${TD}>Prova gratuita su richiesta tramite modulo</td><td ${TD}>30 giorni gratuiti, senza vincoli</td></tr>
    <tr><td ${TD}><strong>Portali</strong></td><td ${TD}>Legame diretto con Immobiliare.it, invio a più portali</td><td ${TD}>Esportazione sui portali, sincronizzazione richieste da Idealista e Casa.it</td></tr>
    <tr><td ${TD}><strong>Funzioni dichiarate in più</strong></td><td ${TD}>Valutazione immobiliare, virtual tour, planimetrie, sito agenzia, collaborazione tra agenzie</td><td ${TD}>Agenda con Google Calendar, WhatsApp e SMS, automazioni ChatGPT (opzione a pagamento)</td></tr>
    <tr><td ${TD}><strong>Dispositivi</strong></td><td ${TD}>Online, app per iPhone, iPad e Android</td><td ${TD}>Online, versione mobile responsive</td></tr>
  </tbody>
</table>
<p>La domanda più importante, nella pratica, è <strong>su quali portali pubblichi</strong> e come i due gestionali si integrano con quei portali oggi. Le integrazioni tra prodotti di gruppi diversi possono cambiare nel tempo: prima di scegliere, chiedi per iscritto a entrambi i fornitori come funziona la pubblicazione sui portali che usi, e provala con un annuncio vero durante la prova. Per il lato costi dei portali, vedi la guida al <a href="/it/costo-immobiliare-it-agenzie">costo di Immobiliare.it e degli altri portali per le agenzie</a>.</p>`,
    },
    {
      id: 'altre-alternative',
      title: `Alternative a Getrix: gli altri tipi di strumenti`,
      html: `<p>Quando si cercano alternative a Getrix o a Miogest, si finisce spesso a confrontare prodotti che fanno cose diverse. Conviene distinguere tre famiglie:</p>
<h3>1. Altri gestionali immobiliari</h3>
<p>In Italia esistono diversi gestionali per agenzie, online o installati sul computer, con prezzi e formule differenti: abbonamenti annuali, licenze perpetue, software gratuiti con servizi a pagamento. Alcuni sono legati a un gruppo di portali, altri sono indipendenti. Per le formule gratuite o a basso costo, con esempi verificati, leggi la guida al <a href="/it/gestionale-immobiliare-gratuito">gestionale immobiliare gratuito</a>.</p>
<h3>2. CRM generici</h3>
<p>Software per gestire contatti e trattative in qualunque settore. Sono flessibili e spesso hanno piani gratuiti, ma non nascono per gli immobili: niente schede immobile complete, niente incroci tra richieste e immobili, niente pubblicazione sui portali di serie. Possono andare bene per chi lavora soprattutto su relazioni e pochi immobili. Approfondisci nella guida al <a href="/it/crm-immobiliare">CRM immobiliare</a>.</p>
<h3>3. Strumenti per marketing e presentazione dell'immobile</h3>
<p>Software che non gestiscono l'agenzia, ma creano quello che il cliente vede: foto migliorate o arredate, video per i social, siti personali, schede da mandare ai clienti. <strong>Non sostituiscono il gestionale</strong>: lo affiancano. Spesso sono la parte che manca, perché i gestionali sono nati per organizzare il lavoro, non per produrre contenuti.</p>`,
    },
    {
      id: 'gestionale-vs-marketing',
      title: `Gestionale tradizionale e strumenti di presentazione: chi fa cosa`,
      html: `<p>Per evitare di pagare due volte la stessa cosa, o di aspettarti da uno strumento quello che non fa, guarda la divisione dei compiti:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}>Attività</th><th ${TH}>Gestionale</th><th ${TH}>Strumento di presentazione</th></tr></thead>
  <tbody>
    <tr><td ${TD}>Anagrafica clienti, richieste, incroci</td><td ${TD}>Sì, è il suo compito</td><td ${TD}>No</td></tr>
    <tr><td ${TD}>Agenda, appuntamenti, promemoria</td><td ${TD}>Sì</td><td ${TD}>No</td></tr>
    <tr><td ${TD}>Pubblicazione su più portali</td><td ${TD}>Sì, con le integrazioni disponibili</td><td ${TD}>Di solito no</td></tr>
    <tr><td ${TD}>Documenti, incarichi, scadenze</td><td ${TD}>Sì</td><td ${TD}>No</td></tr>
    <tr><td ${TD}>Foto arredate o svuotate</td><td ${TD}>Di solito no</td><td ${TD}>Sì</td></tr>
    <tr><td ${TD}>Video per i social dalle foto</td><td ${TD}>Di solito no</td><td ${TD}>Sì</td></tr>
    <tr><td ${TD}>Sito personale con gli immobili</td><td ${TD}>Alcuni lo offrono</td><td ${TD}>Alcuni lo offrono</td></tr>
    <tr><td ${TD}>Scheda o report da mandare al cliente</td><td ${TD}>Spesso</td><td ${TD}>Spesso</td></tr>
  </tbody>
</table>
<p>In pratica: il gestionale è la base dati e l'organizzazione dell'agenzia, lo strumento di presentazione è la vetrina. Se oggi il tuo collo di bottiglia è il tempo speso a ricaricare annunci e richiamare clienti, ti serve un gestionale migliore. Se il collo di bottiglia sono foto che non attirano, video che non hai tempo di montare e un sito che non hai, ti serve uno strumento di presentazione.</p>`,
    },
    {
      id: 'agente-immo-complementare',
      title: `Dove si colloca Agente Immo`,
      html: `<p><a href="/it">Agente Immo</a> non è un gestionale e non sostituisce Getrix, Miogest o altri: è uno strumento per la presentazione dell'immobile, da usare accanto al gestionale che hai già. Cosa fa:</p>
<ul>
  <li><strong>Foto</strong>: carichi la foto e scrivi in una chat cosa vuoi (\"arredala in stile moderno\", \"svuota la stanza\", \"pareti bianche\"); l'AI arreda, svuota o cambia stile, con uno slider prima e dopo. Funziona anche sulle planimetrie, a colori o in 3D.</li>
  <li><strong>Video per i social</strong> dalle foto, con musica inclusa e senza montaggio, con modelli come Prima e dopo, Giorno e notte, Camminata, Cantiere e Con te in video.</li>
  <li><strong>Sito da agente</strong> (piani Plus e Pro): 10 modelli, il tuo nome e il tuo link, ogni immobile caricato va online da solo con la sua pagina e i dati strutturati per Google.</li>
  <li><strong>Scheda immobile</strong> con report PDF da mandare ai clienti, anche su WhatsApp.</li>
</ul>
<p>Si parte da 19 € al mese con il piano Starter, e c'è una prova gratuita con 1 foto e 1 video. Le foto arredate vanno sempre dichiarate negli annunci: vedi la guida al <a href="/it/virtual-staging-legale">virtual staging legale</a>. Per una panoramica di tutti gli strumenti, leggi la guida ai <a href="/it/software-agenti-immobiliari">software per agenti immobiliari</a>.</p>`,
    },
    {
      id: 'come-scegliere',
      title: `Come scegliere tra Getrix, Miogest e le alternative`,
      html: `<p>Più che chiederti quale prodotto è migliore in assoluto, rispondi a queste domande, in quest'ordine:</p>
<ol>
  <li><strong>Su quali portali pubblico, e quanto conta ciascuno per me?</strong> La compatibilità con i portali che ti portano più contatti viene prima di tutto.</li>
  <li><strong>Quante persone useranno il software?</strong> Utenti, uffici, permessi.</li>
  <li><strong>Quanto posso spendere ogni anno, tutto compreso?</strong> Canone, opzioni, eventuali servizi collegati ai portali.</li>
  <li><strong>Lavoro molto dal telefono?</strong> Prova l'app o la versione mobile durante una visita vera.</li>
  <li><strong>Cosa mi manca davvero oggi?</strong> Organizzazione (gestionale) o presentazione (foto, video, sito)?</li>
  <li><strong>Posso uscire?</strong> Esportazione dei dati, durata del contratto, disdetta.</li>
</ol>
<p>Poi usa le prove gratuite con metodo: carica 5 immobili veri e 10 contatti, pubblica un annuncio su un portale, fissa un appuntamento, prova un incrocio e un'esportazione. In una settimana sai più che da qualunque recensione. Se cambi gestionale, pianifica il passaggio dei dati prima della scadenza del contratto attuale, e chiedi al nuovo fornitore se aiuta nell'importazione.</p>`,
    },
  ],
  faq: [
    [`Qual è la differenza tra Getrix e Miogest?`, `Getrix è il gestionale del gruppo Immobiliare.it, con prezzo su preventivo e prova gratuita su richiesta. Miogest fa parte del gruppo idealista dal 2020, ha un prezzo pubblico di 499 € + IVA all'anno e una prova di 30 giorni (dati di ottobre 2026). Le funzioni dichiarate sono in parte simili: la scelta dipende soprattutto dai portali che usi e da come lavori.`],
    [`Getrix o Miogest: quale scegliere?`, `Non c'è una risposta valida per tutti. Parti dai portali su cui pubblichi e chiedi a entrambi i fornitori come funziona oggi l'integrazione con quei portali. Poi prova tutti e due con immobili e contatti veri, controllando app, incroci ed esportazione dei dati.`],
    [`Quali sono le alternative a Getrix?`, `Altri gestionali immobiliari, online o installati sul computer, CRM generici adattati al lavoro di agenzia, e strumenti per la presentazione dell'immobile come foto, video e sito. Questi ultimi non sostituiscono il gestionale ma lo affiancano.`],
    [`Getrix è obbligatorio per pubblicare su Immobiliare.it?`, `Le modalità di pubblicazione dipendono dal contratto con il portale e possono cambiare nel tempo. Chiedi al commerciale di Immobiliare.it quali strumenti puoi usare per pubblicare, se è possibile farlo con un gestionale esterno e con quali condizioni, e fattelo mettere per iscritto.`],
    [`Agente Immo sostituisce il gestionale?`, `No. Agente Immo è uno strumento per presentare gli immobili: foto arredate o svuotate con l'AI, video per i social dalle foto, sito da agente e schede da mandare ai clienti. Si usa accanto al gestionale, che resta lo strumento per clienti, richieste, agenda e portali.`],
    [`Come si cambia gestionale immobiliare senza perdere dati?`, `Prima di disdire, esporta contatti, immobili, note e documenti in un formato leggibile, verifica che il nuovo gestionale possa importarli e fai una prova con una parte dei dati. Pianifica il passaggio prima della scadenza del contratto attuale.`],
  ],
};

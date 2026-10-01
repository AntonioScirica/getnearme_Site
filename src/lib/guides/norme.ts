import type { Guide } from './types';

// Guide su regole, correttezza e costi: virtual staging legale, costo dell'home staging, APE negli annunci.
// Niente leggi, cifre o statistiche inventate: dove non c'è certezza si resta generici e si rimanda al professionista.

const TABLE = 'style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5"';
const TH = 'style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd"';
const TD = 'style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"';

export const virtualStagingLegale: Guide = {
  slug: 'virtual-staging-legale',
  label: 'Virtual staging legale',
  title: 'Virtual staging è legale? Regole per le foto con AI',
  description: 'Il virtual staging è legale negli annunci se non inganna: cosa puoi modificare, cosa mai, come dichiarare l\'arredo virtuale e una checklist per agenti.',
  h1: 'Virtual staging è legale? Come usare le foto arredate con AI negli annunci',
  intro: 'Sì, il virtual staging è legale: arredare in foto una stanza non è vietato. Diventa un problema quando la foto fa credere all\'acquirente qualcosa che non è vero sulla casa. La linea è semplice da ricordare: puoi aggiungere arredi, non puoi cambiare l\'immobile. E devi dirlo.',
  updated: '2026-09-30',
  sections: [
    {
      id: 'e-legale',
      title: 'Virtual staging e legge: cosa dice la normativa',
      html: `<p>In Italia non esiste una legge specifica sul <strong>virtual staging</strong> o sulle foto arredate con AI negli annunci. Valgono però le regole generali che un agente conosce già, e che bastano a capire cosa è lecito:</p>
<ul>
  <li><strong>Le norme sulla pubblicità ingannevole e sulle pratiche commerciali scorrette</strong>, contenute nel Codice del Consumo (D.Lgs. 206/2005): un annuncio non deve indurre il consumatore in errore su caratteristiche essenziali del bene.</li>
  <li><strong>I doveri del mediatore</strong>: la Legge 39/1989 disciplina la professione, e l'art. 1759 del codice civile impone al mediatore di comunicare alle parti le circostanze a lui note relative alla valutazione e alla sicurezza dell'affare.</li>
  <li><strong>Le regole dei portali</strong>, che sono contrattuali: chi pubblica accetta condizioni che possono riguardare anche le immagini.</li>
</ul>
<p>Mettendo insieme questi punti, il criterio pratico è uno: una foto arredata virtualmente è corretta se chi la guarda capisce che l'arredo non c'è e se la casa che vede è la stessa che troverà alla visita. Se hai dubbi su un caso concreto, chiedi alla tua associazione di categoria o a un legale: questa guida dà indicazioni pratiche, non un parere legale.</p>
<p>Per le basi su come funziona l'home staging virtuale e quando usarlo, parti dalla <a href="/it/home-staging-virtuale">guida all'home staging virtuale</a>.</p>`,
    },
    {
      id: 'modifiche-ammesse',
      title: 'Foto arredate con AI: le modifiche ammesse',
      html: `<p>Le modifiche che non creano problemi sono quelle che <strong>aggiungono o tolgono elementi mobili</strong>, cioè cose che il proprietario porta via o l'acquirente porterà dentro:</p>
<ul>
  <li><strong>Mobili e complementi</strong>: divani, letti, tavoli, tappeti, lampade, quadri, piante.</li>
  <li><strong>Rimozione di oggetti</strong>: scatoloni, vestiti, mobili vecchi del proprietario, disordine. Anche qui è buona pratica dirlo, perché chi visita troverà la casa com'è.</li>
  <li><strong>Correzioni fotografiche normali</strong>: raddrizzare le linee, bilanciare la luce, correggere l'esposizione di una foto scura. Sono le stesse che farebbe un fotografo.</li>
  <li><strong>Stili diversi</strong> per la stessa stanza, per far capire come potrebbe essere usata: studio o cameretta, zona pranzo o salotto.</li>
</ul>
<p>Il principio è che tutto ciò che si può spostare con un furgone si può aggiungere in foto. Tutto ciò che richiede un muratore, un idraulico o un'impresa no. Anche lo stile conta: un arredo semplice e credibile, adatto al tipo di immobile, è più corretto e vende meglio di un arredo da rivista in un bilocale da sistemare. Se vuoi migliorare anche le foto di partenza, leggi <a href="/it/migliorare-foto-annuncio-immobiliare">come migliorare le foto di un annuncio</a>.</p>`,
    },
    {
      id: 'cosa-non-modificare',
      title: 'Cosa non alterare mai: struttura, vista, difetti, dimensioni',
      html: `<p>Qui il virtual staging smette di essere presentazione e diventa un'informazione falsa sull'immobile. Non modificare mai:</p>
<ul>
  <li><strong>La struttura</strong>: muri, tramezzi, aperture, porte, finestre, scale, pilastri, travi. Niente pareti abbattute in foto se non sono abbattute davvero.</li>
  <li><strong>La vista</strong>: il palazzo di fronte resta, il cielo grigio può essere schiarito ma il panorama non si inventa.</li>
  <li><strong>I difetti</strong>: macchie di umidità, crepe, infiltrazioni, pavimenti rovinati, impianti a vista. Coprirli con un mobile o con un ritocco è proprio la situazione che l'art. 1759 c.c. chiede di evitare, perché sono circostanze che incidono sulla valutazione.</li>
  <li><strong>Le dimensioni percepite</strong>: mobili sottodimensionati o grandangoli estremi che fanno sembrare la stanza più grande di com'è.</li>
  <li><strong>Finiture e impianti</strong>: pavimenti, infissi, bagni, cucine in muratura, caldaie. Cambiare il pavimento in foto significa mostrare una ristrutturazione che non c'è.</li>
  <li><strong>L'esterno</strong>: facciata, giardino, box, parti comuni.</li>
</ul>
<p>Se vuoi mostrare come potrebbe diventare la casa dopo una ristrutturazione, fallo in modo esplicito: una sezione separata dell'annuncio, con la scritta \"ipotesi di ristrutturazione\" ben visibile, sempre accanto alle foto reali.</p>`,
    },
    {
      id: 'come-dichiararlo',
      title: 'Come dichiarare l\'arredo virtuale nell\'annuncio',
      html: `<p>Dichiarare il virtual staging costa pochissimo e ti mette al riparo da quasi tutti i problemi. Tre accorgimenti:</p>
<ol>
  <li><strong>Una scritta sulla foto</strong>: \"Arredo virtuale\" o \"Immagine con arredamento virtuale\", in un angolo, leggibile anche da telefono. È la più efficace perché segue la foto ovunque venga condivisa.</li>
  <li><strong>Una riga nel testo dell'annuncio</strong>: per esempio \"Alcune foto presentano un arredamento virtuale a scopo illustrativo. L'immobile viene venduto vuoto\" (o con gli arredi effettivamente inclusi).</li>
  <li><strong>La foto originale accanto</strong>: pubblica anche lo scatto reale della stessa stanza, idealmente subito dopo quella arredata. Chi guarda capisce da solo cosa è vero e cosa è proposta.</li>
</ol>
<p>Vale lo stesso per i social: nei post e nei video prima e dopo è naturale mostrare la differenza, ed è proprio quello che funziona. Conserva poi nel fascicolo dell'immobile le foto originali e quelle arredate: se un giorno qualcuno contesta un'immagine, puoi mostrare cosa hai modificato e cosa no.</p>
<p>Con <a href="/it">Agente Immo</a> ogni foto arredata resta collegata all'originale e puoi vederle a confronto prima e dopo, così hai sempre a portata di mano entrambe le versioni da pubblicare.</p>`,
    },
    {
      id: 'portali',
      title: 'Home staging virtuale: le regole dei portali',
      html: `<p>I portali immobiliari hanno condizioni di pubblicazione proprie, che cambiano nel tempo e non sono uguali per tutti. In generale tendono a chiedere che le immagini rappresentino fedelmente l'immobile e che eventuali elaborazioni siano riconoscibili. Alcuni prevedono indicazioni specifiche per render, foto elaborate o immagini non reali, altri si limitano a regole generali sulla veridicità dell'annuncio.</p>
<p>Prima di caricare foto arredate con AI:</p>
<ul>
  <li><strong>Leggi le regole di pubblicazione</strong> di ogni portale che usi, nella sezione dedicata agli inserzionisti o nelle condizioni del contratto.</li>
  <li><strong>Controlla la foto di copertina</strong>: alcuni portali possono avere regole particolari sull'immagine principale. Nel dubbio, la scritta \"arredo virtuale\" sulla copertina risolve.</li>
  <li><strong>Usa lo stesso standard ovunque</strong>: sito, portali, social, stampa in vetrina. Una regola interna unica è più facile da rispettare che dieci regole diverse.</li>
</ul>
<p>Un annuncio segnalato o rimosso non è solo un fastidio: fa perdere visibilità proprio nei giorni in cui l'immobile è nuovo e raccoglie più contatti.</p>`,
    },
    {
      id: 'rischi',
      title: 'I rischi concreti di un virtual staging scorretto',
      html: `<p>Il rischio più frequente non è una sanzione, è <strong>la visita che delude</strong>. L'acquirente arriva con un'idea della casa che la realtà smentisce in dieci secondi, e da quel momento guarda tutto con sospetto, anche le cose vere. Il tempo speso a organizzare la visita è perso, e spesso anche la fiducia.</p>
<p>Poi ci sono i rischi più seri:</p>
<ul>
  <li><strong>Contestazioni</strong> da parte dell'acquirente, se una foto ha nascosto un difetto o mostrato qualcosa che non c'è.</li>
  <li><strong>Segnalazioni e rimozione dell'annuncio</strong> dai portali.</li>
  <li><strong>Profili di pubblicità ingannevole</strong>, secondo le norme a tutela dei consumatori.</li>
  <li><strong>Reputazione</strong>: in una zona ci si conosce. Un agente noto per foto \"che non corrispondono\" perde incarichi, non solo clienti.</li>
</ul>
<p>C'è anche il rischio opposto, meno citato: rinunciare del tutto al virtual staging per paura e lasciare online foto di stanze vuote che non si vendono. Usato bene è uno strumento corretto e utile, sia per vendere sia per <a href="/it/acquisire-incarichi-immobiliari">acquisire incarichi</a>.</p>`,
    },
    {
      id: 'checklist',
      title: 'Checklist: virtual staging legale in 10 controlli',
      html: `<p>Prima di pubblicare una foto arredata con AI, controlla:</p>
<ol>
  <li>Muri, porte e finestre sono identici all'originale.</li>
  <li>Pavimenti, infissi, bagno e cucina fissa non sono cambiati.</li>
  <li>La vista dalle finestre è quella vera.</li>
  <li>Nessun difetto è stato coperto o ritoccato.</li>
  <li>I mobili sono in scala: un letto matrimoniale ha le misure di un letto matrimoniale.</li>
  <li>Lo stile è realistico e adatto al tipo di immobile.</li>
  <li>Sulla foto c'è la scritta \"Arredo virtuale\".</li>
  <li>Nel testo dell'annuncio è indicato che alcune foto hanno arredi virtuali.</li>
  <li>La foto originale della stessa stanza è pubblicata.</li>
  <li>Hai verificato le regole del portale e conservato originali e versioni arredate.</li>
</ol>
<p>Informa anche il proprietario: deve sapere quali foto sono arredate e perché, così non ci sono sorprese quando vede l'annuncio. Ripeti i controlli anche quando riusi le foto arredate in un video o in un post: la regola vale su ogni canale. Se vuoi vedere come si comporta una tua foto, puoi <a href="/it#prova">provare gratis una foto arredata</a> e confrontarla con l'originale.</p>`,
    },
  ],
  faq: [
    ['Il virtual staging è legale in Italia?', 'Sì. Non esiste un divieto di arredare virtualmente le foto di un immobile. Valgono le regole generali contro la pubblicità ingannevole e i doveri di correttezza del mediatore: la foto non deve far credere che la casa sia diversa da com\'è.'],
    ['È obbligatorio scrivere che la foto è arredata virtualmente?', 'Non c\'è una norma che imponga una formula precisa, ma dichiararlo è il modo più semplice per evitare che la foto sia considerata ingannevole. Una scritta sulla foto e una riga nel testo dell\'annuncio bastano nella maggior parte dei casi. Controlla anche le regole del portale.'],
    ['Posso togliere dalla foto i mobili del proprietario?', 'Sì, sono elementi mobili. È comunque buona pratica indicarlo e pubblicare anche la foto reale, perché alla visita l\'acquirente troverà la casa com\'è.'],
    ['Posso cambiare il pavimento o la cucina in foto?', 'Non come foto dell\'immobile: sarebbe una ristrutturazione che non esiste. Se vuoi mostrare un\'ipotesi di ristrutturazione, presentala come tale, separata e ben indicata, accanto alle foto reali.'],
    ['Devo avvisare il proprietario?', 'Sì. Deve sapere quali foto sono arredate virtualmente e approvare come viene presentata la sua casa. Di solito è anche un buon argomento in fase di incarico, perché vede subito il lavoro che fai.'],
    ['Cosa rischio se la foto nasconde un difetto?', 'Contestazioni da parte dell\'acquirente, segnalazioni sui portali e possibili profili di pubblicità ingannevole, oltre a una trattativa compromessa. Per casi concreti rivolgiti alla tua associazione di categoria o a un legale.'],
  ],
};

export const homeStagingCosto: Guide = {
  slug: 'home-staging-costo',
  label: 'Costo dell\'home staging',
  title: 'Home staging costo: quanto costa, fisico o virtuale',
  description: 'Home staging costo: da cosa dipende il prezzo di quello fisico, quanto costa quello virtuale a foto o in abbonamento, chi paga e quando conviene ciascuno.',
  h1: 'Home staging costo: quanto costa davvero, fisico e virtuale',
  intro: 'Il costo dell\'home staging dipende soprattutto da una scelta: allestire la casa dal vivo o arredarla solo in foto. Il fisico ha un prezzo che varia molto e va chiesto con un preventivo; il virtuale costa da pochi centesimi a qualche euro a foto, a seconda dello strumento. Qui trovi da cosa dipendono i costi e quando conviene l\'uno o l\'altro.',
  updated: '2026-09-30',
  sections: [
    {
      id: 'da-cosa-dipende',
      title: 'Quanto costa l\'home staging fisico: da cosa dipende',
      html: `<p>L'home staging fisico non ha un listino unico: ogni professionista fa un preventivo e i prezzi <strong>variano molto</strong> da città a città e da progetto a progetto. Per capire se una cifra è ragionevole, guarda le voci che la compongono:</p>
<ul>
  <li><strong>Dimensione e numero di stanze</strong>: allestire solo soggiorno e camera costa molto meno che arredare tutta la casa.</li>
  <li><strong>Casa vuota o abitata</strong>: in una casa abitata spesso basta riorganizzare, togliere e aggiungere pochi complementi. In una casa vuota servono i mobili.</li>
  <li><strong>Noleggio degli arredi</strong>: è spesso la voce più pesante, perché si paga per tutto il tempo in cui l'immobile resta in vendita.</li>
  <li><strong>Durata</strong>: se la vendita si allunga, il noleggio si allunga. È il costo meno prevedibile.</li>
  <li><strong>Trasporto, montaggio e smontaggio</strong>: furgone, persone, piani senza ascensore, tempi.</li>
  <li><strong>Il professionista</strong>: la consulenza, il progetto e la sua esperienza hanno un valore a sé.</li>
  <li><strong>Piccoli interventi</strong>: tinteggiature, pulizie profonde, piccole riparazioni, a volte incluse, a volte no.</li>
</ul>
<p>Il consiglio pratico: chiedi sempre un preventivo scritto con le voci separate e con il costo di un eventuale prolungamento del noleggio. Solo così puoi confrontare due offerte e spiegare la spesa al proprietario.</p>`,
    },
    {
      id: 'virtuale-prezzo',
      title: 'Home staging virtuale: prezzo e modelli di pagamento',
      html: `<p>L'home staging virtuale costa molto meno perché non ci sono mobili, trasporti né noleggi: si paga il lavoro sulla foto. Esistono due modelli principali:</p>
<ul>
  <li><strong>A foto</strong>: paghi ogni immagine arredata. È il modello dei servizi fatti a mano da un grafico, con prezzi più alti e tempi di consegna di ore o giorni.</li>
  <li><strong>In abbonamento o a crediti</strong>: paghi un canone mensile che include un certo numero di foto. È il modello degli strumenti con intelligenza artificiale, dove la foto è pronta in pochi secondi e puoi rifarla finché non ti convince.</li>
</ul>
<p>Un esempio concreto: su <a href="/it">Agente Immo</a> una foto arredata costa 3 crediti, e il piano Starter costa 19 € al mese con 600 crediti. Significa <strong>pochi centesimi a foto</strong>, anche arredando ogni stanza di ogni incarico. I piani Plus (49 € al mese) e Pro (da 59 € al mese) includono anche più funzioni per chi lavora con volumi maggiori o in squadra.</p>
<p>Quando confronti strumenti diversi, non guardare solo il prezzo per foto. Conta quante volte puoi rigenerare un risultato, se la foto rispetta muri, finestre e pavimenti, se puoi scegliere uno stile realistico e se lo stesso strumento fa anche video e altro, così non paghi tre abbonamenti. Per le basi, vedi la <a href="/it/home-staging-virtuale">guida all'home staging virtuale</a>.</p>`,
    },
    {
      id: 'confronto',
      title: 'Home staging fisico o virtuale: il confronto',
      html: `<p>I due approcci non si escludono, ma rispondono a esigenze diverse. Ecco un confronto qualitativo:</p>
<table ${TABLE}>
  <thead><tr><th ${TH}></th><th ${TH}>Fisico</th><th ${TH}>Virtuale</th></tr></thead>
  <tbody>
    <tr><td ${TD}><strong>Costo</strong></td><td ${TD}>Alto e variabile, con noleggio legato ai tempi di vendita</td><td ${TD}>Basso e prevedibile, a foto o in abbonamento</td></tr>
    <tr><td ${TD}><strong>Tempi</strong></td><td ${TD}>Giorni o settimane tra progetto e allestimento</td><td ${TD}>Minuti, anche prima di pubblicare</td></tr>
    <tr><td ${TD}><strong>Effetto in foto</strong></td><td ${TD}>Ottimo</td><td ${TD}>Ottimo, se lo stile è realistico</td></tr>
    <tr><td ${TD}><strong>Effetto alla visita</strong></td><td ${TD}>La casa è arredata anche dal vivo</td><td ${TD}>La casa resta com'è: va detto chiaramente</td></tr>
    <tr><td ${TD}><strong>Flessibilità</strong></td><td ${TD}>Un solo allestimento</td><td ${TD}>Più stili per la stessa stanza</td></tr>
    <tr><td ${TD}><strong>Organizzazione</strong></td><td ${TD}>Fornitori, chiavi, trasporti, smontaggio</td><td ${TD}>Solo le foto</td></tr>
    <tr><td ${TD}><strong>Adatto a</strong></td><td ${TD}>Immobili di fascia alta, case vuote con molte visite</td><td ${TD}>Tutti gli incarichi, soprattutto case vuote o datate</td></tr>
  </tbody>
</table>
<p>In sintesi: il fisico migliora sia la foto sia la visita, ma costa e richiede organizzazione. Il virtuale migliora la foto a un costo minimo e si può usare su ogni incarico, ma alla visita non cambia nulla, e per questo va sempre dichiarato (vedi <a href="/it/virtual-staging-legale">virtual staging legale</a>).</p>`,
    },
    {
      id: 'quando-conviene',
      title: 'Quando conviene l\'uno e quando l\'altro',
      html: `<p><strong>L'home staging fisico ha senso</strong> quando:</p>
<ul>
  <li>l'immobile è di fascia alta e l'acquirente si aspetta una casa pronta anche alla visita;</li>
  <li>la casa è vuota, fredda, e le visite saranno molte;</li>
  <li>il proprietario è disposto a sostenere la spesa, o la divide con l'agenzia;</li>
  <li>ci sono i tempi per organizzarlo prima di andare online.</li>
</ul>
<p><strong>L'home staging virtuale conviene</strong> quando:</p>
<ul>
  <li>vuoi arredare in foto <strong>ogni</strong> incarico, non solo quelli di pregio;</li>
  <li>la casa è vuota, abitata ma arredata male, o ha mobili datati;</li>
  <li>devi pubblicare subito;</li>
  <li>vuoi mostrare al proprietario, già in fase di acquisizione, come presenterai la sua casa;</li>
  <li>vuoi usare le foto arredate anche per <a href="/it/video-immobiliari-social">video sui social</a>.</li>
</ul>
<p>Spesso la scelta migliore è combinarli: virtual staging su tutti gli incarichi come standard, e allestimento fisico solo per gli immobili dove la visita pesa più della foto. Un passaggio intermedio, gratuito, è il decluttering: chiedere al proprietario di togliere oggetti personali e mobili superflui prima delle foto e delle visite.</p>`,
    },
    {
      id: 'chi-paga',
      title: 'Chi paga l\'home staging: agente o proprietario',
      html: `<p>Non c'è una regola: è un accordo tra agente e proprietario, e va messo per iscritto. Le soluzioni più comuni sono tre.</p>
<ul>
  <li><strong>Paga il proprietario</strong>: tipico per l'home staging fisico, perché la spesa è rilevante e il beneficio è suo. L'agente propone il professionista e spiega cosa ottiene.</li>
  <li><strong>Paga l'agente</strong>: tipico per l'home staging virtuale, che costa così poco da poter essere incluso nel servizio. Diventa un argomento di acquisizione: \"le tue stanze le arredo io, in foto, senza costi per te\".</li>
  <li><strong>Si divide</strong>: per esempio l'agenzia paga il progetto e il proprietario il noleggio, oppure la spesa viene anticipata dall'agenzia e regolata alla vendita. Qualunque formula scegli, scrivila nell'incarico o in un accordo a parte, con cosa succede se la vendita non si conclude.</li>
</ul>
<p>Se includi il virtual staging nel tuo servizio, dillo al momento dell'incarico e mostralo: una foto della sua casa già arredata vale più di qualsiasi promessa. Trovi altri argomenti nella guida su come <a href="/it/acquisire-incarichi-immobiliari">acquisire incarichi immobiliari</a>, e sul tema del compenso nella guida alla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>`,
    },
    {
      id: 'roi',
      title: 'Home staging: come ragionare sul ritorno dell\'investimento',
      html: `<p>Promettere che l'home staging \"fa vendere a un prezzo più alto\" di una certa percentuale è rischioso: dipende dalla casa, dal mercato e dal prezzo di partenza. Meglio ragionare su cosa migliora in modo concreto e verificabile:</p>
<ul>
  <li><strong>Più attenzione sul portale</strong>: una copertina arredata ferma chi scorre più di una stanza vuota. Puoi verificarlo tu, confrontando visualizzazioni e contatti degli annunci con e senza foto arredate.</li>
  <li><strong>Meno visite inutili</strong>: chi arriva ha già capito come si usano gli spazi.</li>
  <li><strong>Meno tempo sul mercato</strong>: ogni mese in più costa al proprietario (spese, rata, immobile fermo) e a te (tempo, ribassi da trattare).</li>
  <li><strong>Più incarichi</strong>: per l'agente il ritorno più immediato spesso è qui, perché la presentazione convince il proprietario a scegliere te.</li>
</ul>
<p>Il calcolo cambia molto tra i due tipi. Per l'home staging fisico il ritorno deve giustificare una spesa importante, quindi va valutato caso per caso. Per quello virtuale la spesa è così bassa che basta un contatto in più, o un incarico acquisito, per ripagare mesi di abbonamento. Per toglierti il dubbio, puoi <a href="/it#prova">provare gratis una foto arredata</a> sul prossimo incarico e misurare tu la differenza.</p>`,
    },
  ],
  faq: [
    ['Quanto costa l\'home staging fisico?', 'Non esiste un prezzo standard: varia molto in base a dimensioni della casa, numero di stanze, noleggio dei mobili, durata, trasporto e professionista. L\'unico modo serio per saperlo è chiedere un preventivo scritto con le voci separate.'],
    ['Quanto costa l\'home staging virtuale?', 'Dipende dal modello: i servizi fatti a mano si pagano a foto e costano di più, gli strumenti con AI funzionano in abbonamento o a crediti. Su Agente Immo una foto costa 3 crediti e il piano Starter da 19 € al mese include 600 crediti, cioè pochi centesimi a foto.'],
    ['Chi paga l\'home staging, l\'agente o il proprietario?', 'È un accordo tra le parti. Il fisico di solito lo paga il proprietario, il virtuale spesso lo include l\'agente nel servizio. In ogni caso conviene metterlo per iscritto.'],
    ['L\'home staging virtuale sostituisce quello fisico?', 'Per le foto sì, per la visita no: la casa resta com\'è. Per questo molti agenti usano il virtuale su tutti gli incarichi e il fisico solo sugli immobili dove la visita pesa di più.'],
    ['Conviene fare home staging anche su case economiche?', 'Il fisico raramente, perché la spesa pesa troppo sul valore. Il virtuale sì, perché costa pochissimo e le case vuote o datate sono proprio quelle che in foto rendono peggio.'],
    ['Quanto tempo richiede l\'home staging virtuale?', 'Con uno strumento AI, pochi secondi per foto più il tempo di scegliere lo stile e controllare il risultato. Si può fare anche il giorno stesso delle foto, prima di pubblicare.'],
  ],
};

export const apeAnnunci: Guide = {
  slug: 'ape-annunci-immobiliari',
  label: 'APE negli annunci',
  title: 'APE negli annunci immobiliari: cosa indicare e come',
  description: 'APE negli annunci immobiliari: obbligo di indicare classe energetica e indice di prestazione energetica in vendita e affitto, chi rilascia l\'APE.',
  h1: 'APE negli annunci immobiliari: classe energetica e indice obbligatori',
  intro: 'Negli annunci di vendita e di affitto la classe energetica e l\'indice di prestazione energetica dell\'immobile vanno indicati: lo prevede il D.Lgs. 192/2005 e le sue modifiche. Qui trovi cosa scrivere, dove prendere i dati, cosa fare se l\'APE non è ancora pronto e una checklist da usare prima di ogni pubblicazione.',
  updated: '2026-09-30',
  sections: [
    {
      id: 'cos-e-ape',
      title: 'Cos\'è l\'APE e cosa contiene',
      html: `<p>L'<strong>APE</strong>, Attestato di Prestazione Energetica, è il documento che descrive quanta energia serve a un immobile per essere riscaldato, raffrescato, avere acqua calda e, nei casi previsti, ventilazione e illuminazione, in condizioni standard. Non misura i consumi reali della famiglia che ci abita, ma le caratteristiche dell'edificio e degli impianti.</p>
<p>Le informazioni che interessano all'agente per l'annuncio sono principalmente:</p>
<ul>
  <li><strong>La classe energetica</strong>: la lettera che colloca l'immobile su una scala dalla più efficiente alla meno efficiente.</li>
  <li><strong>L'indice di prestazione energetica globale</strong> (spesso indicato come EPgl), espresso in kWh/m² anno: è il numero da cui deriva la classe.</li>
  <li>Altri dati utili per rispondere alle domande: le raccomandazioni per migliorare la prestazione, la data di rilascio, il codice identificativo dell'attestato.</li>
</ul>
<p>Per chi compra o affitta, classe e indice sono un modo rapido per confrontare immobili diversi e farsi un'idea delle spese di gestione. Per te sono un dato obbligatorio dell'annuncio e, spesso, un argomento di vendita: un immobile ristrutturato con una buona classe va valorizzato, uno con una classe bassa va presentato con onestà, magari spiegando quali interventi potrebbero migliorarla.</p>`,
    },
    {
      id: 'obbligo',
      title: 'Classe energetica nell\'annuncio: è obbligatoria?',
      html: `<p>Sì. Il <strong>D.Lgs. 192/2005</strong>, come modificato negli anni successivi, prevede che negli annunci di offerta di vendita o di locazione pubblicati tramite mezzi di comunicazione commerciali siano riportati <strong>l'indice di prestazione energetica</strong> dell'involucro e globale dell'edificio o dell'unità immobiliare e <strong>la classe energetica</strong> corrispondente.</p>
<p>In pratica l'obbligo riguarda tutti i canali in cui pubblichi l'offerta:</p>
<ul>
  <li>portali immobiliari;</li>
  <li>il sito della tua agenzia (vedi anche la guida al <a href="/it/sito-web-agente-immobiliare">sito web dell'agente immobiliare</a>);</li>
  <li>cartelli e schede in vetrina;</li>
  <li>volantini, riviste e giornali;</li>
  <li>i post sui social quando presentano un immobile in vendita o in affitto con i suoi dati.</li>
</ul>
<p>Le linee guida nazionali per l'attestazione della prestazione energetica prevedono anche un formato standard per riportare questi dati negli annunci. Molti portali hanno campi dedicati che generano automaticamente l'etichetta: compilali sempre, invece di scrivere i dati solo nel testo.</p>
<p>Oltre all'annuncio, la normativa prevede che l'APE sia messo a disposizione di chi è interessato fin dall'avvio delle trattative e consegnato alla conclusione, e che sia allegato agli atti di compravendita e ai nuovi contratti di locazione nei casi previsti. Esistono alcuni casi particolari di esclusione dall'obbligo di APE: se hai un immobile atipico, verifica con il certificatore.</p>`,
    },
    {
      id: 'come-scriverlo',
      title: 'Indice di prestazione energetica nell\'annuncio: come scriverlo',
      html: `<p>Il modo più sicuro è riportare i dati esattamente come sono sull'APE, senza arrotondamenti creativi e senza interpretazioni. Un esempio di riga da inserire nel testo, oltre ai campi del portale:</p>
<p><strong>\"Classe energetica: D. Indice di prestazione energetica globale: [valore] kWh/m² anno.\"</strong></p>
<p>Alcuni accorgimenti pratici:</p>
<ul>
  <li><strong>Copia i dati dall'APE</strong>, non da un annuncio precedente o da quello che ricorda il proprietario. Se l'APE è stato rifatto, i valori possono essere cambiati.</li>
  <li><strong>Stessi dati su tutti i canali</strong>: portale, sito, vetrina, social. Un annuncio con classe D e uno con classe C per la stessa casa creano confusione e sospetti.</li>
  <li><strong>Non trasformare il dato in slogan</strong>: \"casa efficiente\" su un immobile in classe bassa è fuorviante. Meglio descrivere cosa c'è davvero: infissi nuovi, caldaia recente, cappotto.</li>
  <li><strong>Mettilo in una posizione visibile</strong>, non in fondo dopo i contatti.</li>
</ul>
<p>Se usi l'AI per scrivere le descrizioni, controlla sempre la parte energetica: è uno dei punti dove un testo generato può inventare o arrotondare. Per il resto del testo, vedi <a href="/it/come-scrivere-annuncio-immobiliare">come scrivere un annuncio immobiliare</a>.</p>`,
    },
    {
      id: 'ape-in-corso',
      title: 'APE non ancora pronto: cosa scrivere nell\'annuncio',
      html: `<p>Capita spesso: l'incarico è firmato, le foto sono pronte, ma l'APE non c'è o è scaduto. Nella pratica molti annunci riportano formule come \"APE in fase di rilascio\" o \"classe energetica in fase di definizione\". Attenzione però: l'obbligo di legge è indicare classe e indice, e una formula del genere <strong>non sostituisce il dato</strong>. Nel migliore dei casi è una soluzione di brevissimo periodo.</p>
<p>Come comportarsi:</p>
<ul>
  <li><strong>La soluzione migliore è non pubblicare senza APE</strong>: fai richiedere l'attestato appena firmi l'incarico, o prima, e pubblica quando hai i dati. Di solito servono pochi giorni.</li>
  <li>Se pubblichi comunque, <strong>aggiorna l'annuncio appena l'APE è pronto</strong>, su tutti i canali.</li>
  <li><strong>Non indicare una classe \"presunta\"</strong> stimata a occhio: se poi l'APE dice altro, hai un annuncio sbagliato e un acquirente scontento.</li>
  <li>Verifica con la tua associazione di categoria o con un legale come gestire questi casi, anche alla luce di eventuali indicazioni regionali o dei portali.</li>
</ul>
<p>Il modo più semplice per non trovarsi in questa situazione è inserire l'APE nella lista dei documenti da raccogliere all'acquisizione, insieme a planimetria e visura: trovi un esempio nella guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile in acquisizione</a>.</p>`,
    },
    {
      id: 'chi-rilascia',
      title: 'Chi rilascia l\'APE e quanto dura',
      html: `<p>L'APE è redatto da un <strong>tecnico abilitato come certificatore energetico</strong>, secondo i requisiti previsti dalla normativa nazionale e regionale. Il certificatore deve essere indipendente rispetto all'immobile: per questo di solito non è chi ha progettato o costruito l'edificio. Dopo il sopralluogo e i calcoli, l'attestato viene trasmesso al catasto energetico regionale, dove riceve un codice identificativo.</p>
<p>La <strong>validità dell'APE è di 10 anni</strong> dal rilascio. Ci sono però due casi in cui può servire prima un nuovo attestato:</p>
<ul>
  <li><strong>Interventi</strong> che modificano la prestazione energetica: ristrutturazioni importanti, cambio dell'impianto di riscaldamento, cappotto, sostituzione degli infissi. In questi casi l'APE va aggiornato.</li>
  <li><strong>Controlli dell'impianto termico</strong>: la validità è legata anche al rispetto delle verifiche periodiche di efficienza energetica dell'impianto. Se non sono state fatte, l'APE può decadere prima dei 10 anni.</li>
</ul>
<p>Il costo dell'APE lo decide il tecnico e dipende da dimensione e complessità dell'immobile. Chi lo paga è una questione tra proprietario e agenzia: di solito è a carico del proprietario, che ne ha bisogno comunque per vendere o affittare, ma alcune agenzie lo anticipano o lo includono nel servizio. Come per ogni costo, meglio scriverlo nell'incarico.</p>
<p>Tieni presente che la normativa europea sulla prestazione energetica degli edifici è in evoluzione: controlla periodicamente eventuali aggiornamenti nazionali o regionali.</p>`,
    },
    {
      id: 'sanzioni',
      title: 'Sanzioni per l\'APE mancante negli annunci',
      html: `<p>La mancata indicazione dei dati energetici negli annunci non è una semplice dimenticanza: il D.Lgs. 192/2005 prevede <strong>sanzioni amministrative</strong> per chi non rispetta l'obbligo, e sanzioni sono previste anche per altri inadempimenti legati all'APE, come la mancata dotazione o consegna dell'attestato nei casi in cui è richiesto.</p>
<p>Per l'annuncio, la responsabilità ricade su chi lo pubblica, e nella maggior parte dei casi è proprio l'agenzia. Gli importi e le modalità di applicazione sono stabiliti dalla legge e possono essere integrati da norme regionali: per conoscerli con precisione e capire come si applicano al tuo caso, fai riferimento al testo vigente della norma, alla tua associazione di categoria o a un legale.</p>
<p>Al di là delle sanzioni, ci sono conseguenze pratiche:</p>
<ul>
  <li><strong>I portali</strong> possono chiedere di completare i dati o limitare la visibilità degli annunci incompleti.</li>
  <li><strong>Gli acquirenti</strong> guardano la classe energetica per confrontare gli immobili: un annuncio senza dati sembra nascondere qualcosa.</li>
  <li><strong>La trattativa</strong> si complica se l'APE arriva tardi e la classe è diversa da quella attesa.</li>
</ul>
<p>Un annuncio completo, con classe e indice corretti, è anche il modo più semplice per mostrare al proprietario e all'acquirente che lavori con precisione.</p>`,
    },
    {
      id: 'checklist',
      title: 'Checklist APE per l\'annuncio immobiliare',
      html: `<p>Prima di pubblicare un annuncio di vendita o affitto, controlla:</p>
<ol>
  <li>L'APE esiste ed è in corso di validità (10 anni, controlli dell'impianto in regola, nessun intervento successivo che lo renda superato).</li>
  <li>Hai una copia dell'attestato nel fascicolo dell'immobile.</li>
  <li>La classe energetica è compilata nel campo dedicato del portale.</li>
  <li>L'indice di prestazione energetica è riportato con il valore esatto e l'unità di misura.</li>
  <li>Gli stessi dati sono sul sito, in vetrina, nei volantini e nei post social con i dati dell'immobile.</li>
  <li>La descrizione non contiene affermazioni sull'efficienza in contrasto con la classe.</li>
  <li>Se l'APE è in rilascio, hai una data e un promemoria per aggiornare subito tutti gli annunci.</li>
  <li>L'APE sarà disponibile per gli interessati durante la trattativa e pronto da allegare all'atto o al contratto.</li>
</ol>
<p>Una volta sistemati i documenti, lavora sulla presentazione: foto curate, eventualmente arredate con l'AI e dichiarate come tali (vedi <a href="/it/virtual-staging-legale">virtual staging legale</a>), e una descrizione chiara. Per partire, puoi <a href="/it#prova">provare gratis</a> l'arredo di una stanza sul prossimo annuncio.</p>`,
    },
  ],
  faq: [
    ['È obbligatorio indicare la classe energetica negli annunci immobiliari?', 'Sì. Il D.Lgs. 192/2005, come modificato, prevede che negli annunci di vendita e di affitto siano indicati l\'indice di prestazione energetica e la classe energetica dell\'immobile. L\'obbligo riguarda tutti i mezzi di comunicazione commerciali, non solo i portali.'],
    ['Cosa si scrive se l\'APE non è ancora pronto?', 'Nella pratica si trovano formule come \"APE in fase di rilascio\", ma non sostituiscono il dato richiesto dalla legge. La cosa migliore è pubblicare solo quando l\'APE è disponibile, o aggiornare subito l\'annuncio. Per casi specifici verifica con la tua associazione di categoria o un legale.'],
    ['Quanto dura l\'APE?', 'L\'APE ha una validità di 10 anni. Va aggiornato prima in caso di interventi che modificano la prestazione energetica e può decadere se non sono rispettati i controlli periodici dell\'impianto termico.'],
    ['Chi rilascia l\'APE?', 'Un tecnico abilitato come certificatore energetico, indipendente rispetto all\'immobile. L\'attestato viene poi registrato nel catasto energetico regionale.'],
    ['Chi paga l\'APE, il proprietario o l\'agenzia?', 'Di solito il proprietario, perché è un documento che gli serve per vendere o affittare. Alcune agenzie lo anticipano o lo includono nel servizio: conviene stabilirlo per iscritto nell\'incarico.'],
    ['Ci sono sanzioni se l\'annuncio non riporta i dati energetici?', 'Sì, il D.Lgs. 192/2005 prevede sanzioni amministrative per il mancato rispetto dell\'obbligo, che ricadono su chi pubblica l\'annuncio. Per importi e modalità fai riferimento al testo vigente e alle eventuali norme regionali.'],
    ['L\'APE va indicato anche nei post sui social?', 'Se il post presenta un immobile in vendita o in affitto, è un annuncio a tutti gli effetti: indica classe e indice anche lì, per esempio nella didascalia.'],
  ],
};

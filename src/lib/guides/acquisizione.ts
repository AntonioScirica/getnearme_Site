import type { Guide } from './types';

// Guide operative sull'acquisizione: lettere ai proprietari, telefonate ai privati, valutazione gratuita.
// Approfondiscono la guida 'acquisire-incarichi-immobiliari'. Niente numeri inventati, norme solo generiche e corrette.

export const letteraAcquisizione: Guide = {
  slug: 'lettera-acquisizione-immobili',
  label: 'Lettera di acquisizione',
  title: 'Lettera acquisizione immobili: 5 modelli pronti da usare',
  description: 'Lettera acquisizione immobili: 5 modelli pronti per proprietari di casa (zona, palazzo, privati, eredi, affitto), consegna, follow-up ed errori da evitare.',
  h1: 'Lettera acquisizione immobili: modelli pronti per scrivere ai proprietari di casa',
  intro: 'Una buona lettera di acquisizione non chiede "vuoi vendere?". Dà al proprietario un motivo concreto per chiamarti: una vendita appena chiusa nel suo palazzo, un acquirente che cerca proprio in quella via, una valutazione gratuita e senza impegno. Qui trovi la struttura, cinque modelli da copiare e adattare, e le regole per consegnarla senza infastidire nessuno.',
  updated: '2026-09-30',
  sections: [
    {
      id: 'perche-funziona',
      title: 'Perché la lettera ai proprietari di casa funziona ancora',
      html: `<p>In un periodo in cui tutti ricevono decine di messaggi al giorno, una lettera ben scritta e consegnata a mano si nota. Non vende la casa al posto tuo: serve a <strong>far sapere che esisti</strong> in quella zona, nel momento in cui il proprietario comincia a pensare di vendere o affittare. Quel momento non lo scegli tu, per questo la lettera funziona solo se è <strong>costante</strong> e <strong>legata alla zona</strong>.</p>
<p>La differenza tra un volantino di acquisizione immobiliare che finisce nel cestino e una lettera che viene conservata sta in tre cose:</p>
<ul>
  <li><strong>è specifica</strong>: parla di quella via, di quel palazzo, di una vendita vera;</li>
  <li><strong>è breve</strong>: si legge in trenta secondi;</li>
  <li><strong>offre qualcosa di utile</strong>: una valutazione, un'informazione sul mercato della zona, un contatto diretto con una persona e non con un marchio.</li>
</ul>
<p>La lettera è uno dei canali di acquisizione, non l'unico. Per la strategia completa, cioè come presentarti all'appuntamento e vincere il confronto con le altre agenzie, leggi la guida su <a href="/it/acquisire-incarichi-immobiliari">come acquisire incarichi immobiliari</a>.</p>`,
    },
    {
      id: 'struttura-lettera',
      title: 'Struttura di una lettera di acquisizione efficace',
      html: `<p>Qualunque sia il modello, lo schema resta questo:</p>
<ol>
  <li><strong>Intestazione</strong>: nome, cognome e ruolo, agenzia, numero di iscrizione se lo usi nella tua comunicazione, telefono diretto. Niente centralino.</li>
  <li><strong>Apertura con un fatto</strong>: "Ho appena venduto un appartamento in via Roma 12", "Seguo da anni le compravendite in questo quartiere". Mai frasi generiche tipo "siamo leader nel settore".</li>
  <li><strong>Il motivo per cui scrivi a lui</strong>: una richiesta concreta, un acquirente che cerca in zona, un cambiamento nel mercato del quartiere.</li>
  <li><strong>L'offerta</strong>: una valutazione gratuita e senza impegno, un confronto di dieci minuti, una scheda con i prezzi della zona.</li>
  <li><strong>Un solo invito all'azione</strong>: "Mi chiami o mi scriva su WhatsApp al numero...". Uno, non tre.</li>
  <li><strong>Firma a mano</strong>, anche solo sulla copia stampata: fa la differenza tra una lettera e un volantino.</li>
</ol>
<p>Lunghezza ideale: <strong>mezza pagina</strong>. Carta di buona qualità, busta chiusa, intestazione pulita. Se aggiungi un'immagine, scegli una foto vera di un immobile che hai venduto o presentato, meglio ancora una foto prima e dopo con l'<a href="/it/home-staging-virtuale">home staging virtuale</a>, che fa capire subito come lavori.</p>`,
    },
    {
      id: 'modello-zona-palazzo',
      title: 'Modello 1: lettera ai proprietari della zona o del palazzo',
      html: `<p>È la lettera "di presenza": la usi per farti conoscere in un'area che vuoi presidiare. Da mandare con regolarità, cambiando ogni volta il contenuto.</p>
<p><em>Gentile proprietario,</em></p>
<p><em>mi chiamo [Nome Cognome] e mi occupo di compravendite e affitti nel quartiere [nome quartiere], dove lavoro ogni giorno. Negli ultimi mesi ho seguito diverse trattative tra [via X] e [via Y] e ho un quadro aggiornato di quanto valgono oggi gli appartamenti di questa zona.</em></p>
<p><em>Se sta pensando di vendere, o anche solo vuole sapere quanto vale la sua casa, posso prepararle una valutazione gratuita e senza impegno, basata sulle compravendite reali del quartiere e non sui prezzi degli annunci.</em></p>
<p><em>Può chiamarmi o scrivermi su WhatsApp al [numero]. Rispondo io, personalmente.</em></p>
<p><em>Cordiali saluti,<br>[Nome Cognome], [Agenzia]</em></p>
<p><strong>Consiglio</strong>: se la mandi a un solo palazzo, citalo per nome o per via ("ai proprietari di via Garibaldi 8"). Una lettera che parla di quell'edificio viene letta molto più di una lettera per "tutti".</p>`,
    },
    {
      id: 'modello-vendita-palazzo',
      title: 'Modello 2: lettera dopo una vendita nel palazzo',
      html: `<p>È la lettera più forte che hai, perché si basa su un fatto verificabile: hai appena venduto (o affittato) un appartamento lì. Mandala nei giorni successivi al rogito o alla firma della proposta, nel rispetto della riservatezza del tuo cliente: <strong>non indicare prezzo, nome o piano</strong> senza il suo consenso.</p>
<p><em>Gentili condomini di [via, numero],</em></p>
<p><em>nelle scorse settimane ho seguito la vendita di un appartamento nel vostro palazzo. Durante le visite ho conosciuto diverse persone interessate a questo edificio e a questa via che non hanno ancora trovato casa.</em></p>
<p><em>Se qualcuno di voi sta valutando di vendere, ora o nei prossimi mesi, potrei avere già un contatto interessato. In ogni caso sono disponibile per una valutazione gratuita e riservata del vostro appartamento.</em></p>
<p><em>Mi trovate al [numero] o a [email].</em></p>
<p><em>[Nome Cognome], [Agenzia]</em></p>
<p>Scrivi "potrei avere già un contatto interessato" solo se è vero. Se dopo la telefonata il proprietario scopre che l'acquirente non esiste, hai perso la sua fiducia prima ancora di iniziare.</p>`,
    },
    {
      id: 'modello-privato-eredi',
      title: 'Modello 3 e 4: proprietario che vende da privato, eredi e casa vuota',
      html: `<h3>Modello 3: proprietario con annuncio privato</h3>
<p>Se trovi l'indirizzo esposto (cartello "vendesi" sul portone o sul balcone), puoi lasciare una lettera. Tono rispettoso: ha scelto di vendere da solo e non va giudicato.</p>
<p><em>Gentile proprietario,</em></p>
<p><em>ho visto il cartello "vendesi" sul suo immobile. Non le scrivo per convincerla a cambiare idea: vendere da privati è una scelta legittima. Le lascio solo il mio contatto nel caso le servisse un parere su prezzo, documenti o trattativa, senza impegno. Seguo questa zona da tempo e posso dirle in dieci minuti come si stanno muovendo gli acquirenti qui.</em></p>
<p><em>[Nome Cognome], [numero]</em></p>
<h3>Modello 4: eredi e casa vuota</h3>
<p>Qui serve delicatezza. Non cercare gli eredi tramite necrologi o informazioni su lutti: è invadente e ti fa perdere la reputazione in un quartiere. Se una casa è visibilmente disabitata, una lettera neutra e generica è l'unico approccio corretto.</p>
<p><em>Gentile proprietario,</em></p>
<p><em>mi occupo di immobili in questa zona. Se questo appartamento non è abitato e sta valutando cosa farne, vendita, affitto o semplicemente capire quanto vale, posso aiutarla anche nelle pratiche che spesso rallentano questi casi: documenti catastali, conformità, eventuali successioni da completare con il suo notaio o professionista. Nessun impegno, solo un primo confronto.</em></p>
<p><em>[Nome Cognome], [numero]</em></p>
<p>Per le case vuote l'<a href="/it/home-staging-virtuale">home staging virtuale</a> è un argomento concreto: una stanza spoglia o con mobili datati può essere mostrata arredata già al primo incontro.</p>`,
    },
    {
      id: 'modello-affitto',
      title: 'Modello 5: lettera di acquisizione per affitto',
      html: `<p>Molti proprietari non vogliono vendere ma hanno un immobile sfitto, o sono stanchi di gestire inquilini da soli. È un target diverso, con preoccupazioni diverse: affidabilità dell'inquilino, contratto, tempi.</p>
<p><em>Gentile proprietario,</em></p>
<p><em>ricevo ogni settimana richieste di persone che cercano casa in affitto in [quartiere]: lavoratori, famiglie, studenti. Se ha un appartamento libero, o lo sarà nei prossimi mesi, posso occuparmi della selezione degli inquilini, della verifica della documentazione e della preparazione del contratto insieme a lei.</em></p>
<p><em>Se vuole sapere a quanto potrebbe affittarlo oggi, mi chiami al [numero]: le preparo una stima gratuita.</em></p>
<p><em>[Nome Cognome], [Agenzia]</em></p>
<p>Adatta le categorie di inquilini alla zona reale: se non ricevi richieste da studenti, non citarli.</p>`,
    },
    {
      id: 'come-consegnare',
      title: 'Come consegnare la lettera e il volantino di acquisizione',
      html: `<p>La consegna è parte del messaggio. Qualche regola di buon senso e di educazione:</p>
<ul>
  <li><strong>Rispetta le cassette con "no pubblicità"</strong> o avvisi simili: saltale sempre. Chi lo ha scritto non diventerà tuo cliente se lo ignori.</li>
  <li><strong>Non lasciare fogli sciolti</strong> nell'androne, sulle auto o sotto i portoni: sporcano e irritano condomini e amministratori.</li>
  <li><strong>Chiedi al portiere</strong>, se c'è, invece di entrare di nascosto. Presentarti di persona è già acquisizione.</li>
  <li><strong>Busta chiusa, intestata "Al proprietario"</strong>: non usare i nomi letti sui citofoni o sulle cassette per creare liste o indirizzari. È un trattamento di dati personali che richiede una base giuridica, e non ti serve.</li>
  <li><strong>Distribuisci tu, almeno all'inizio</strong>: capisci meglio la zona, vedi i cartelli "vendesi", incontri le persone.</li>
  <li><strong>Verifica le regole del tuo Comune</strong> sulla distribuzione di materiale pubblicitario: alcuni la regolano con appositi regolamenti.</li>
</ul>
<p>Un'idea che funziona: allega un <strong>QR code</strong> che porta al tuo sito o a una pagina con gli immobili che segui nella zona. Chi è curioso ti guarda prima di chiamarti. Se non hai ancora un sito personale, trovi come impostarlo nella guida al <a href="/it/sito-web-agente-immobiliare">sito web per agente immobiliare</a>.</p>`,
    },
    {
      id: 'follow-up-errori',
      title: 'Follow-up, privacy ed errori da evitare',
      html: `<h3>Il follow-up</h3>
<p>Una lettera singola raramente basta. Pianifica un giro nella stessa zona con cadenza regolare, cambiando ogni volta il motivo: una vendita, un aggiornamento sul mercato del quartiere, un immobile appena preso in incarico. Quando qualcuno ti chiama, <strong>annota il contatto nel tuo <a href="/it/crm-immobiliare">CRM immobiliare</a></strong> con la data e il motivo, e fissa subito il prossimo passo.</p>
<h3>Privacy e GDPR</h3>
<ul>
  <li>La lettera anonima, indirizzata "al proprietario" e consegnata in cassetta, non richiede l'uso di dati personali.</li>
  <li>Quando qualcuno ti contatta, usa i suoi dati solo per rispondere alla sua richiesta. Per inviargli comunicazioni successive (newsletter, aggiornamenti) chiedigli il consenso e fornisci l'informativa privacy prevista dal Regolamento UE 2016/679.</li>
  <li>Non comprare elenchi di nominativi di cui non conosci l'origine.</li>
</ul>
<h3>Errori da evitare</h3>
<ul>
  <li><strong>Promettere acquirenti inesistenti</strong> o prezzi gonfiati per farti chiamare.</li>
  <li><strong>Frasi da volantino</strong>: "Vuoi vendere casa? Chiamaci subito!". Suonano come tutti gli altri.</li>
  <li><strong>Troppi contenuti</strong>: servizi, loghi, premi, dieci numeri di telefono. Uno basta.</li>
  <li><strong>Errori di battitura</strong> e indirizzi sbagliati: chi non cura una lettera non curerà la vendita.</li>
  <li><strong>Sparire dopo la chiamata</strong>: se il proprietario ti chiama, il tuo obiettivo è un appuntamento. Per prepararlo leggi la guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile per l'acquisizione</a>.</li>
</ul>`,
    },
  ],
  faq: [
    ['Cosa scrivere in una lettera di acquisizione immobiliare?', 'Un fatto concreto sulla zona o sul palazzo, il motivo per cui scrivi a quel proprietario, un\'offerta utile come la valutazione gratuita e un solo contatto diretto. Mezza pagina, firmata a mano, senza frasi generiche.'],
    ['Meglio la lettera o il volantino di acquisizione?', 'La lettera in busta chiusa viene letta più facilmente perché sembra personale. Il volantino costa meno e va bene per farsi conoscere in una zona ampia. Molti agenti usano entrambi, ma con lo stesso tono sobrio e specifico.'],
    ['Posso scrivere il nome del proprietario letto sul citofono?', 'Meglio di no. Raccogliere nomi da citofoni o cassette per creare liste è un trattamento di dati personali che richiede una base giuridica. Indirizza la lettera "al proprietario" o "ai condomini di" e lascia che sia lui a contattarti.'],
    ['Posso lasciare lettere nelle cassette con scritto "no pubblicità"?', 'No, è una richiesta esplicita da rispettare. Oltre a essere scortese, rischi di rovinarti la reputazione proprio nella zona che vuoi presidiare. Verifica anche eventuali regolamenti del tuo Comune sulla distribuzione.'],
    ['Ogni quanto mandare la lettera ai proprietari di casa?', 'Con una cadenza regolare, ad esempio legata alle tue vendite o agli aggiornamenti di mercato della zona. Conta più la costanza che il numero di lettere: il proprietario deve ricordarsi di te quando deciderà di vendere.'],
    ['Cosa allegare alla lettera per renderla più efficace?', 'Una foto vera di un immobile che hai presentato, magari prima e dopo l\'arredamento virtuale, oppure un QR code verso il tuo sito con gli immobili della zona. Mostra come lavori, senza aggiungere testo.'],
  ],
};

export const scriptTelefonata: Guide = {
  slug: 'script-telefonata-proprietari',
  label: 'Script telefonata ai privati',
  title: 'Script telefonata acquisizione immobiliare: cosa dire',
  description: 'Script telefonata acquisizione immobiliare: come chiamare un privato che vende casa, apertura, obiezioni, provvigione, appuntamento e regole da rispettare.',
  h1: 'Script telefonata acquisizione immobiliare: come chiamare un privato che vende casa',
  intro: 'Chi pubblica un annuncio da privato riceve molte chiamate di agenzie, quasi tutte uguali. Per ottenere un appuntamento non serve insistere: serve essere diversi nei primi venti secondi, ascoltare, e proporre un incontro breve e utile. Qui trovi lo script completo, le risposte alle obiezioni più frequenti e le regole da rispettare.',
  updated: '2026-09-30',
  sections: [
    {
      id: 'prima-di-chiamare',
      title: 'Prima di chiamare un privato che vende casa: la preparazione',
      html: `<p>La telefonata si vince prima di comporre il numero. In cinque minuti di preparazione:</p>
<ul>
  <li><strong>Leggi tutto l'annuncio</strong>: metratura, piano, stato, prezzo, da quanto è online, se il prezzo è già stato abbassato.</li>
  <li><strong>Controlla se l'annuncio chiede di non essere contattato dalle agenzie</strong>. Se è scritto chiaramente, rispetta la richiesta: al massimo usa il canale previsto dal portale per un messaggio breve e cortese, oppure non contattarlo affatto.</li>
  <li><strong>Confronta il prezzo</strong> con gli immobili simili della zona che conosci: ti serve per capire se c'è un problema di prezzo, di foto o di presentazione.</li>
  <li><strong>Guarda le foto con occhio critico</strong>: sono buie, storte, con stanze in disordine? È il tuo argomento più concreto.</li>
  <li><strong>Prepara due fasce orarie</strong> da proporre per l'appuntamento.</li>
</ul>
<p>Il tuo obiettivo non è ottenere l'incarico al telefono. È ottenere <strong>un incontro di venti minuti</strong>. Tutto lo script serve a questo.</p>`,
    },
    {
      id: 'apertura',
      title: 'Lo script di apertura: i primi venti secondi',
      html: `<p>Il privato ha già risposto ad altre agenzie. Se inizi come loro, chiude. Presentati in modo chiaro, dichiara subito che sei un agente (nasconderlo è scorretto e si scopre in un attimo) e dai un motivo specifico per cui chiami.</p>
<p><em>"Buongiorno, parlo con il signor Rossi? Sono [Nome] di [Agenzia], lavoro nella zona di [quartiere]. La chiamo per il suo appartamento in vendita in via [X]: le rubo un minuto, è un buon momento?"</em></p>
<p>Se ti dice di sì, prosegui con un motivo concreto, scegliendo quello vero per il tuo caso:</p>
<ul>
  <li><em>"Ho visto il suo annuncio e conosco bene quel palazzo: ho seguito una vendita lì vicino di recente."</em></li>
  <li><em>"Seguo alcune persone che cercano proprio in quella zona e con quella metratura."</em></li>
  <li><em>"Ho notato una cosa nel suo annuncio che, secondo me, le sta facendo perdere contatti. Posso dirgliela?"</em></li>
</ul>
<p>Se ti dice che non è un buon momento: <em>"Nessun problema, quando preferisce che la richiami, oggi pomeriggio o domani mattina?"</em>. Poi richiama esattamente all'orario concordato.</p>`,
    },
    {
      id: 'proposta-valore',
      title: 'La proposta di valore: cosa offri che lui da solo non ha',
      html: `<p>Il privato vende da solo per un motivo preciso, quasi sempre per risparmiare la provvigione o perché ha avuto una brutta esperienza. Non dirgli che sbaglia. Mostragli <strong>cosa gli manca</strong>, con domande prima che con affermazioni.</p>
<p><em>"Posso farle due domande veloci? Quante chiamate ha ricevuto da persone realmente interessate, non da agenzie? E quante visite ha fatto finora?"</em></p>
<p>Poi, in base alla risposta:</p>
<p><em>"Guardi, è normale. Il suo appartamento ha potenziale, ma le foto non lo fanno vedere: il soggiorno sembra più piccolo di quello che è. Io lavoro in modo diverso: prima di pubblicare preparo foto curate, le stanze vuote le mostro arredate in modo virtuale, dichiarandolo, e faccio un video per i social. In più verifico i documenti prima, così la trattativa non si blocca dal notaio. Le propongo di vederci venti minuti: le porto una valutazione basata sulle vendite reali della zona e le faccio vedere come presenterei la sua casa. Se non la convinco, avrà comunque un parere gratuito."</em></p>
<p>Punti di forza da usare solo se reali: <strong>acquirenti in cerca in zona</strong>, <strong>filtro dei curiosi</strong> e verifica della capacità di spesa, <strong>controllo documentale</strong> (catasto, conformità, <a href="/it/ape-annunci-immobiliari">APE</a>), <strong>gestione della trattativa</strong>, <strong>presentazione migliore</strong> dell'immobile. Se vuoi mostrargli al telefono cosa intendi, puoi preparare in pochi minuti una stanza arredata partendo da una foto del suo annuncio e mandargliela dopo la chiamata: la <a href="/it#prova">prova gratuita</a> serve esattamente a questo.</p>`,
    },
    {
      id: 'obiezioni-vendo-da-solo',
      title: 'Obiezioni: "vendo da solo" e "non voglio agenzie"',
      html: `<h3>"Vendo da solo, grazie"</h3>
<p><em>"La capisco, ed è giusto provarci. Non le chiedo di cambiare idea oggi. Le propongo solo una cosa: se tra qualche settimana il telefono non squilla come si aspettava, mi permetta di farle vedere cosa farei io. Intanto, posso mandarle su WhatsApp una scheda con i prezzi reali di vendita della sua zona? Le è utile anche se vende da solo."</em></p>
<p>Obiettivo: non l'appuntamento subito, ma <strong>un contatto che resta aperto</strong> e un motivo per risentirvi.</p>
<h3>"Non voglio agenzie"</h3>
<p><em>"È una posizione che sento spesso, di solito dopo un'esperienza non buona. Le è capitato qualcosa in particolare?"</em></p>
<p>Ascolta. Spesso il problema è concreto: un agente sparito, visite inutili, un prezzo proposto e poi abbassato. Rispondi su quel punto:</p>
<p><em>"Ha ragione a essere prudente. Io le posso dire come lavoro: le mando un resoconto dopo ogni visita, le porto solo persone che hanno già verificato di potersi permettere l'acquisto, e le mostro prima come verrà presentata la casa. Venti minuti per vederlo con i suoi occhi, senza firmare nulla."</em></p>
<h3>"Ho già troppe agenzie che mi chiamano"</h3>
<p><em>"Immagino, e mi scuso per essere un'altra. Le chiedo solo un minuto per dirle cosa ho notato nel suo annuncio: se non le è utile, non la richiamo più."</em> E poi <strong>mantieni la promessa</strong>.</p>`,
    },
    {
      id: 'obiezioni-provvigione',
      title: 'Obiezioni: provvigione, prezzo e "devo pensarci"',
      html: `<h3>"La provvigione è troppo alta"</h3>
<p><em>"È una domanda giusta, e ne parliamo con calma all'incontro. Le dico solo come la vedo: la provvigione ha senso se le porto un risultato migliore di quello che otterrebbe da solo, in prezzo, tempi o tranquillità. All'appuntamento le mostro esattamente cosa farei per la sua casa, così giudica lei se vale la pena."</em></p>
<p>Non trattare la provvigione al telefono: senza aver visto la casa e senza aver mostrato il tuo lavoro, stai solo negoziando il prezzo di un servizio che il cliente non conosce. Per i riferimenti su come si calcola e si concorda, vedi la guida alla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>
<h3>"Il mio prezzo è giusto, non lo abbasso"</h3>
<p><em>"Non la chiamo per farle abbassare il prezzo. Voglio capire con lei se il prezzo è coerente con le vendite reali della zona, che sono spesso diverse dai prezzi degli annunci. Se lo è, bene. Se non lo è, meglio saperlo ora che dopo mesi online."</em></p>
<h3>"Ci devo pensare" o "Mi richiami tra un mese"</h3>
<p><em>"Certo. Per evitare di disturbarla a vuoto, le va bene se la richiamo giovedì [data] alle [ora]? Intanto le mando il mio contatto e la scheda dei prezzi della zona."</em></p>
<h3>"Mi mandi una mail con le informazioni"</h3>
<p><em>"Volentieri. Per mandarle qualcosa di utile e non una brochure generica, mi serve vedere la casa dieci minuti. Preferisce martedì pomeriggio o mercoledì mattina?"</em></p>`,
    },
    {
      id: 'chiusura-appuntamento',
      title: 'Chiudere la telefonata con un appuntamento',
      html: `<p>La chiusura deve essere semplice e con <strong>due alternative concrete</strong>, non una domanda aperta.</p>
<p><em>"Allora facciamo così: passo da lei a vedere la casa, venti minuti al massimo. Le porto una valutazione basata sulle vendite della zona e le faccio vedere come presenterei il suo appartamento. Le va meglio martedì alle 18 o mercoledì alle 10?"</em></p>
<p>Quando accetta:</p>
<ul>
  <li><strong>ripeti data, ora e indirizzo</strong>;</li>
  <li>chiedi se ci saranno <strong>tutti i proprietari</strong> (coniuge, fratelli, coeredi): una decisione presa da una persona sola spesso viene ribaltata a casa;</li>
  <li>chiedi di preparare, se li ha, <strong>planimetria, visura e APE</strong>;</li>
  <li>manda subito un <strong>messaggio di conferma</strong> con il tuo nome e il tuo numero.</li>
</ul>
<p><em>Messaggio di conferma: "Buongiorno signor Rossi, sono [Nome] di [Agenzia]. Le confermo l'appuntamento di martedì alle 18 in via [X]. Se riesce, tenga a portata di mano planimetria e APE. A presto."</em></p>
<p>Per preparare l'incontro, cioè cosa portare e come presentare prezzo e piano di vendita, trovi tutto nella guida alla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile per acquisire l'incarico</a>.</p>`,
    },
    {
      id: 'follow-up-regole',
      title: 'Follow-up e regole da rispettare quando chiami i proprietari',
      html: `<h3>Il follow-up</h3>
<p>Molti incarichi arrivano da privati che al primo contatto hanno detto no. Registra ogni telefonata nel tuo <a href="/it/crm-immobiliare">CRM immobiliare</a> con esito, obiezione e data del prossimo contatto. Richiama <strong>solo se lui ha accettato</strong> di essere richiamato, e ogni volta con un motivo nuovo: un calo di interesse sul suo annuncio, una vendita in zona, un acquirente nuovo. Se ti chiede di non chiamarlo più, annotalo e rispettalo.</p>
<h3>Consenso e Registro pubblico delle opposizioni</h3>
<p>Le regole sulle telefonate commerciali sono precise e le sanzioni per chi non le rispetta possono essere pesanti. In termini generali:</p>
<ul>
  <li>Rispondere a un <strong>annuncio pubblicato dal privato</strong>, sul numero che lui stesso ha indicato per quella vendita, è diverso dal chiamare numeri presi da elenchi per fare promozione. Anche in questo caso, rispetta eventuali indicazioni come "no agenzie".</li>
  <li>Per il <strong>telemarketing</strong> verso numeri non raccolti direttamente con consenso, verifica che il numero non sia iscritto al <strong>Registro pubblico delle opposizioni</strong> e informati sugli obblighi aggiornati.</li>
  <li>Se tratti i dati di chi hai contattato (nome, numero, note), devi farlo nel rispetto del <strong>GDPR</strong>: finalità chiara, informativa, conservazione limitata, cancellazione su richiesta.</li>
  <li>Non comprare liste di numeri di origine sconosciuta.</li>
</ul>
<p>Per i dettagli applicabili al tuo caso, confrontati con la tua associazione di categoria o con un consulente privacy.</p>`,
    },
  ],
  faq: [
    ['Come chiamare un privato che vende casa senza essere respinti?', 'Presentati subito come agente, chiedi se è un buon momento e dai un motivo specifico: il palazzo che conosci, un acquirente in zona, un difetto dell\'annuncio. Ascolta più di quanto parli e punta a un incontro breve, non a firmare al telefono.'],
    ['Cosa rispondere a chi dice "vendo da solo"?', 'Non contraddirlo. Riconosci che è una scelta legittima, offri qualcosa di utile anche per chi vende da privato, come i prezzi reali della zona, e chiedi il permesso di risentirvi tra qualche settimana.'],
    ['Come gestire l\'obiezione sulla provvigione al telefono?', 'Rimandala all\'incontro. Al telefono il proprietario non ha ancora visto cosa faresti per la sua casa, quindi qualsiasi discussione sulla provvigione diventa solo una questione di sconto. All\'appuntamento mostri il lavoro e poi parli di compenso.'],
    ['Posso chiamare un privato che nell\'annuncio scrive "no agenzie"?', 'Meglio non farlo. È una richiesta esplicita e ignorarla ti fa partire con un proprietario già irritato. Se proprio vuoi lasciare un contatto, un messaggio breve e cortese tramite il portale è il massimo che conviene fare.'],
    ['Devo controllare il Registro pubblico delle opposizioni?', 'Se fai telemarketing verso numeri che non ti sono stati dati per quel contatto, sì: devi verificare che non siano iscritti e rispettare le regole sul consenso. Per il tuo caso specifico informati presso la tua associazione di categoria o un consulente privacy.'],
    ['Quante volte richiamare un proprietario che ha detto no?', 'Solo se ha accettato di essere richiamato, e ogni volta con un motivo nuovo e utile per lui. Se ti chiede di non chiamarlo più, annotalo nel CRM e rispetta la richiesta.'],
  ],
};

export const valutazioneAcquisizione: Guide = {
  slug: 'valutazione-immobile-acquisizione',
  label: 'Valutazione per acquisire',
  title: 'Valutazione immobile gratuita: come usarla per acquisire',
  description: 'Valutazione immobile gratuita dell\'agente: metodo con comparabili e dati OMI, come presentarla, strategia di prezzo e cosa portare per ottenere l\'incarico.',
  h1: 'Valutazione immobile gratuita: come l\'agente la usa per acquisire l\'incarico',
  intro: 'La valutazione gratuita è il momento in cui il proprietario decide a chi affidare la casa. Non vince chi dice il prezzo più alto: vince chi spiega il prezzo meglio, con dati verificabili, e mostra in modo concreto come venderà l\'immobile. Qui trovi il metodo, come presentarla, come parlare di prezzo e cosa portare all\'appuntamento.',
  updated: '2026-09-30',
  sections: [
    {
      id: 'perche-valutazione',
      title: 'Perché la valutazione gratuita è il cuore dell\'acquisizione',
      html: `<p>Quasi tutti i proprietari che pensano di vendere cominciano con una domanda: <strong>quanto vale la mia casa?</strong>. La valutazione gratuita è la risposta che apre la porta, ed è per questo che la offrono tutte le agenzie. Il punto è cosa ci fai dentro.</p>
<p>Per l'agente la valutazione ha tre scopi, in quest'ordine:</p>
<ol>
  <li><strong>costruire fiducia</strong>, dimostrando di conoscere il mercato della zona meglio del proprietario e dei portali;</li>
  <li><strong>allineare le aspettative</strong> su un prezzo realistico, prima di firmare, non dopo tre mesi senza visite;</li>
  <li><strong>mostrare come lavori</strong>, così che la scelta non sia solo sul prezzo o sulla provvigione.</li>
</ol>
<p>L'errore più comune è trattarla come un numero da comunicare. Un proprietario che riceve tre valutazioni vede tre cifre diverse: se la tua non è spiegata, sceglierà la più alta, o quella dell'agente più simpatico. Per il quadro generale su come vincere il confronto con le altre agenzie, parti dalla guida su <a href="/it/acquisire-incarichi-immobiliari">come acquisire incarichi immobiliari</a>.</p>
<p>Una nota di correttezza: la valutazione dell'agente è una <strong>stima commerciale</strong> del prezzo di vendita probabile, non una perizia giurata. Dillo chiaramente al proprietario.</p>`,
    },
    {
      id: 'metodo-valutazione',
      title: 'Come fare una valutazione immobiliare: il metodo dei comparabili',
      html: `<p>Il metodo più usato e più facile da spiegare al proprietario è il <strong>confronto con immobili simili</strong> (comparabili). In pratica:</p>
<ol>
  <li><strong>Calcola la superficie commerciale</strong>: superficie interna più muri, e quote delle superfici accessorie (balconi, terrazzi, cantina, box) secondo i criteri di ragguaglio che usi abitualmente. Usa sempre lo stesso criterio, e dichiaralo.</li>
  <li><strong>Trova 3-6 comparabili</strong> nella stessa microzona, per tipologia e dimensione simili. Dai priorità alle <strong>compravendite concluse</strong> (tue, dell'agenzia, di colleghi con cui collabori) rispetto ai prezzi richiesti negli annunci, che sono quasi sempre più alti del prezzo finale.</li>
  <li><strong>Correggi le differenze</strong>: piano e ascensore, stato di manutenzione, esposizione e luminosità, affaccio, classe energetica, spese condominiali, presenza di box o posto auto, età e qualità dell'edificio.</li>
  <li><strong>Ricava una forbice</strong> di prezzo, non un numero unico: un valore realistico di vendita e un prezzo di pubblicazione coerente.</li>
</ol>
<h3>I dati OMI come riferimento</h3>
<p>L'<strong>Osservatorio del Mercato Immobiliare</strong> dell'Agenzia delle Entrate pubblica periodicamente intervalli di valori al metro quadro per zona e tipologia. Sono utili per <strong>inquadrare</strong> la zona e per mostrare al proprietario una fonte pubblica e neutrale, ma sono medie per zona, non la valutazione di quella casa: vanno sempre letti insieme ai comparabili e allo stato reale dell'immobile.</p>
<h3>Lo stato dell'immobile e i documenti</h3>
<p>Al sopralluogo verifica stato di impianti e finiture, eventuali lavori necessari, e i documenti: planimetria catastale, conformità urbanistica e catastale, <a href="/it/ape-annunci-immobiliari">APE</a>. Una difformità scoperta tardi pesa sul prezzo e sui tempi più di qualunque finitura.</p>`,
    },
    {
      id: 'presentare-valutazione',
      title: 'Come presentare la valutazione al proprietario',
      html: `<p>La stessa cifra, presentata in due modi diversi, produce due risultati diversi. Una struttura che funziona:</p>
<ol>
  <li><strong>Parti da lui</strong>: <em>"Prima di dirle cosa penso, mi dica lei: che cifra ha in mente e da dove viene?"</em>. Capisci subito la distanza tra aspettativa e mercato.</li>
  <li><strong>Mostra il mercato</strong>: i comparabili con foto, metratura, piano, prezzo e tempi di vendita, più il riferimento OMI della zona.</li>
  <li><strong>Mostra la sua casa nel confronto</strong>: cosa ha in più e cosa ha in meno rispetto ai comparabili, con le correzioni che hai applicato.</li>
  <li><strong>Arriva alla forbice</strong>: <em>"Secondo i dati, la sua casa si vende realisticamente tra X e Y."</em></li>
  <li><strong>Solo dopo, il prezzo di pubblicazione</strong> e la strategia.</li>
</ol>
<p>Consegna tutto in un <strong>report scritto</strong>, con i dati dell'immobile, la zona, i comparabili, la forbice di prezzo e i costi che il proprietario dovrà sostenere per vendere. Un documento curato resta sul tavolo di casa dopo che sei andato via, e viene mostrato al coniuge, ai figli, al commercialista. È la tua presentazione quando non ci sei.</p>
<p>Frase utile quando la tua valutazione è più bassa di un'altra: <em>"Non le do il numero più alto, le do quello che posso spiegare riga per riga. Se un'altra agenzia le ha detto di più, le chieda su quali vendite si basa."</em></p>`,
    },
    {
      id: 'strategia-prezzo',
      title: 'Strategia di prezzo con il proprietario',
      html: `<p>Una volta condivisa la forbice, la decisione sul prezzo di partenza va presa <strong>insieme</strong>, con le conseguenze chiare. Le opzioni tipiche:</p>
<ul>
  <li><strong>Prezzo allineato al mercato</strong>: massimo interesse nelle prime settimane, quando l'annuncio è nuovo e riceve più attenzione.</li>
  <li><strong>Prezzo leggermente sopra</strong>, con margine di trattativa: accettabile se il proprietario ha tempo e se concordate prima quando rivederlo.</li>
  <li><strong>Prezzo molto sopra il mercato</strong>: poche visite, annuncio che invecchia, ribassi successivi che fanno pensare agli acquirenti che ci sia un problema.</li>
</ul>
<p>Se il proprietario insiste su un prezzo alto, non rifiutare subito l'incarico e non accettarlo in silenzio. Proponi un <strong>patto scritto</strong>:</p>
<p><em>"Partiamo dalla sua cifra. Ci diamo un periodo concordato: se in quel tempo le visite e le richieste non sono quelle che ci aspettiamo, rivediamo il prezzo insieme sulla base dei dati che le porterò. D'accordo?"</em></p>
<p>Così il ribasso, se servirà, non sarà una tua sconfitta ma una decisione presa su dati condivisi. Metti in chiaro anche <strong>cosa farai per sostenere il prezzo</strong>: presentazione, canali, tempi di pubblicazione. Un prezzo ambizioso richiede una presentazione all'altezza, ed è qui che entrano foto, video e piano di marketing.</p>`,
    },
    {
      id: 'cosa-portare',
      title: 'Cosa portare all\'appuntamento di valutazione',
      html: `<p>All'incontro il proprietario deve vedere <strong>come verrà venduta la sua casa</strong>, non ascoltarlo. Una checklist pratica:</p>
<ul>
  <li><strong>Report di valutazione</strong> stampato e in PDF: dati dell'immobile, zona, comparabili, forbice di prezzo, costi di vendita a carico del proprietario.</li>
  <li><strong>Una stanza della sua casa già arredata in foto</strong>: se ti ha mandato qualche foto prima dell'incontro, o le trovi nel suo annuncio privato, prepara il soggiorno con l'<a href="/it/home-staging-virtuale">home staging virtuale</a>. Se non hai foto, scattale al sopralluogo e mostragli il risultato prima di andare via. Puoi provarlo gratis su una foto con la <a href="/it#prova">prova sulla home</a>.</li>
  <li><strong>Un'idea di video</strong> per i social, anche solo un esempio fatto su un altro immobile, per fargli capire come verrà promossa la casa. Vedi la guida ai <a href="/it/video-immobiliari-social">video immobiliari per i social</a>.</li>
  <li><strong>Il piano di marketing</strong> in una pagina: foto, eventuale staging virtuale dichiarato, testo, portali, sito, social, gestione delle visite, frequenza degli aggiornamenti al proprietario.</li>
  <li><strong>Il tuo sito</strong> sul telefono o sul tablet, con gli immobili che segui presentati tutti allo stesso livello.</li>
  <li><strong>Lista documenti</strong> da recuperare: planimetria, visura, atto di provenienza, APE, spese condominiali, eventuali pratiche edilizie.</li>
  <li><strong>Bozza di incarico</strong>, da lasciare in lettura se il proprietario non è pronto a firmare subito.</li>
</ul>`,
    },
    {
      id: 'dopo-appuntamento',
      title: 'Dopo la valutazione: follow-up per ottenere l\'incarico',
      html: `<p>Molti proprietari non firmano al primo incontro: vogliono sentire altre agenzie o parlarne in famiglia. Il follow-up decide chi vince.</p>
<ul>
  <li><strong>Entro la giornata</strong> manda il report in PDF e un messaggio breve di ringraziamento.</li>
  <li><strong>Nei giorni successivi</strong> manda qualcosa di nuovo e utile: la stanza arredata in foto se non l'avevi mostrata, un comparabile venduto nel frattempo, la risposta a una domanda rimasta aperta.</li>
  <li><strong>Fissa sempre il prossimo contatto</strong> prima di salutare: <em>"Ne parla con sua moglie questo fine settimana, io la risento lunedì pomeriggio, va bene?"</em></li>
</ul>
<p><em>Messaggio di follow-up: "Buongiorno signora Bianchi, come promesso le mando la valutazione del suo appartamento e la foto del soggiorno arredato che abbiamo visto insieme. Se ha domande sui comparabili o sui costi, mi chiami quando vuole. La risento lunedì come d'accordo."</em></p>
<p>Registra tutto nel tuo <a href="/it/crm-immobiliare">CRM immobiliare</a> o <a href="/it/gestionale-immobiliare">gestionale</a>: data della valutazione, prezzo atteso dal proprietario, forbice proposta, obiezioni, prossimo passo. Anche se l'incarico va a un'altra agenzia, quel proprietario potrebbe richiamarti se la vendita non parte: tieni il contatto con garbo, solo se lui è d'accordo.</p>`,
    },
    {
      id: 'errori-valutazione',
      title: 'Errori da evitare nella valutazione per acquisire incarichi',
      html: `<ul>
  <li><strong>Gonfiare il prezzo per prendere l'incarico</strong>: lo ottieni, ma poi passi mesi a gestire un immobile che non si vende e un proprietario deluso, che parlerà male di te nel quartiere.</li>
  <li><strong>Usare solo i prezzi degli annunci</strong>: sono prezzi richiesti, non prezzi di vendita. Il proprietario può trovarli da solo, non gli stai dando nulla in più.</li>
  <li><strong>Usare i dati OMI come valutazione</strong>: sono un riferimento di zona, non tengono conto di piano, stato, esposizione e dettagli della singola casa.</li>
  <li><strong>Dare il numero al telefono</strong> prima di vedere la casa: ti inchiodi a una cifra che poi dovrai correggere.</li>
  <li><strong>Ignorare i documenti</strong>: una difformità urbanistica o catastale scoperta a trattativa avviata fa saltare la vendita e la tua credibilità.</li>
  <li><strong>Parlare solo di prezzo</strong>: se non mostri come venderai, il confronto si riduce a chi chiede la provvigione più bassa.</li>
  <li><strong>Promettere tempi di vendita</strong> che non puoi garantire.</li>
  <li><strong>Mostrare foto arredate come se fossero reali</strong>: lo staging virtuale va sempre dichiarato, e non deve cambiare muri, finestre o dimensioni. Approfondisci nella guida sul <a href="/it/virtual-staging-legale">virtual staging e le regole da rispettare</a>.</li>
</ul>`,
    },
  ],
  faq: [
    ['La valutazione immobiliare dell\'agente è davvero gratuita?', 'Di solito sì: è il modo in cui l\'agente conosce l\'immobile e propone l\'incarico. È una stima commerciale del prezzo di vendita probabile, non una perizia giurata, e il proprietario non è obbligato a dare l\'incarico dopo averla ricevuta.'],
    ['Come fare una valutazione immobiliare corretta?', 'Calcola la superficie commerciale, trova immobili simili venduti di recente nella stessa zona, correggi le differenze (piano, stato, esposizione, accessori) e ricava una forbice di prezzo. Usa i dati OMI come riferimento di zona, non come risultato finale.'],
    ['A cosa servono i dati OMI nella valutazione?', 'Sono intervalli di valori pubblicati dall\'Osservatorio del Mercato Immobiliare dell\'Agenzia delle Entrate per zona e tipologia. Servono a inquadrare il mercato con una fonte pubblica, ma non descrivono la singola casa: vanno sempre integrati con comparabili e sopralluogo.'],
    ['Cosa fare se il proprietario vuole un prezzo troppo alto?', 'Mostragli i comparabili e la forbice realistica, poi proponi un patto: si parte dalla sua cifra per un periodo concordato e, se visite e richieste non arrivano, si rivede il prezzo sui dati. Mettilo per iscritto per evitare incomprensioni.'],
    ['Cosa portare all\'appuntamento di valutazione per acquisire l\'incarico?', 'Un report scritto con dati, zona, comparabili e costi, una stanza della sua casa già arredata in foto, un esempio di video, un piano di marketing in una pagina, il tuo sito e la lista dei documenti da recuperare.'],
    ['Conviene dare la valutazione per telefono?', 'No. Senza vedere la casa rischi una cifra sbagliata che poi dovrai correggere, e perdi l\'occasione di incontrare il proprietario. Al telefono puoi dare solo un\'idea dei prezzi della zona e proporre il sopralluogo.'],
  ],
};

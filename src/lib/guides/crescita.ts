import type { Guide } from './types';

// Guide per agenti gia' in attivita' (non per chi inizia): AI, video, acquisizione degli incarichi.
// Niente numeri inventati: solo pratica del mestiere.

export const intelligenzaArtificiale: Guide = {
  slug: 'intelligenza-artificiale-agenti-immobiliari',
  label: 'AI per agenti immobiliari',
  title: 'Intelligenza artificiale per agenti immobiliari: cosa usare davvero',
  description: 'Come un agente immobiliare può usare l\'intelligenza artificiale ogni giorno: foto arredate, annunci, video e sito. Cosa funziona, cosa evitare e come non perdere tempo.',
  h1: 'Intelligenza artificiale per agenti immobiliari: cosa usare davvero',
  intro: 'Non serve diventare esperti di tecnologia. Serve sapere in quali punti del lavoro l\'AI fa risparmiare ore e fa presentare meglio gli immobili, e in quali invece è solo rumore.',
  updated: '2026-09-27',
  sections: [
    {
      id: 'dove-serve',
      title: 'Dove l\'AI cambia davvero il lavoro dell\'agente',
      html: `<p>Il mestiere resta lo stesso: acquisire, far vedere, trattare, chiudere. L'intelligenza artificiale non sostituisce nessuna di queste fasi, ma toglie di mezzo il lavoro che sta <strong>intorno</strong> all'immobile e che oggi porta via intere serate:</p>
<ul>
  <li><strong>Foto</strong>: stanze vuote o arredate male che diventano stanze arredate, luminose e ordinate.</li>
  <li><strong>Testi</strong>: descrizioni degli annunci scritte in un attimo, da rileggere e correggere.</li>
  <li><strong>Video</strong>: clip per Instagram e TikTok partendo dalle foto, senza riprese né montaggio.</li>
  <li><strong>Presenza online</strong>: un sito con i tuoi immobili che si aggiorna da solo.</li>
</ul>`,
    },
    {
      id: 'acquisizione',
      title: 'Il punto dove rende di più: l\'acquisizione',
      html: `<p>Il proprietario che vuole vendere sente più agenzie. Quasi tutte gli promettono le stesse cose. L'agente che arriva con <strong>la sua casa già arredata in foto</strong>, un video di prova e la pagina sul proprio sito non sta promettendo: sta mostrando. È qui che l'AI fa la differenza più grande, perché trasforma la presentazione in una prova concreta di come l'immobile verrà venduto.</p>`,
    },
    {
      id: 'annunci',
      title: 'Annunci: foto prima, testo dopo',
      html: `<p>Sui portali la prima cosa che si guarda è la foto di copertina. Con l'home staging virtuale ogni immobile può avere una copertina che ferma chi scorre, anche quando la casa è vuota o da sistemare. Il testo viene dopo: l'AI scrive una prima versione, tu aggiungi quello che conosci solo tu (il vicinato, la luce del pomeriggio, il motivo per cui il proprietario vende).</p>
<p>Una regola vale sempre: <strong>le foto arredate vanno dichiarate</strong> e affiancate a quelle originali. L'AI serve a far immaginare la casa, non a cambiarla.</p>`,
    },
    {
      id: 'errori',
      title: 'Errori da evitare',
      html: `<ul>
  <li><strong>Foto irrealistiche</strong>: arredi da rivista in una casa normale creano aspettative che la visita smentisce. Meglio uno stile semplice e credibile.</li>
  <li><strong>Testi tutti uguali</strong>: se non li rileggi, gli annunci sembrano scritti in serie. Il cliente se ne accorge.</li>
  <li><strong>Cambiare la casa</strong>: niente finestre aggiunte, stanze allargate o viste migliorate. È scorretto e ti si ritorce contro alla visita.</li>
  <li><strong>Dieci strumenti diversi</strong>: un programma per le foto, uno per i video, uno per il sito. Il tempo che risparmi lo perdi a passare dall'uno all'altro.</li>
</ul>`,
    },
    {
      id: 'come-iniziare',
      title: 'Come iniziare senza perdere tempo',
      html: `<p>Parti dal prossimo incarico, non da tutto il portafoglio. Prendi le foto della stanza principale, arredala, preparane un video breve e mettila online sul tuo sito. Portala al proprietario: la sua reazione ti dirà più di qualsiasi guida. Con <a href="/it">Agente Immo</a> puoi provarlo gratis su una tua foto, senza registrarti.</p>`,
    },
  ],
  faq: [
    ['L\'intelligenza artificiale sostituirà gli agenti immobiliari?', 'No. Visite, trattativa e fiducia restano dell\'agente. L\'AI toglie il lavoro ripetitivo intorno all\'immobile (foto, testi, video, sito) e lascia più tempo per clienti e acquisizioni.'],
    ['Le foto arredate con l\'AI sono corrette da pubblicare?', 'Sì, se dichiari che l\'arredamento è virtuale e pubblichi anche la foto originale. Non vanno modificati muri, finestre, dimensioni o vista.'],
    ['Serve saper usare strumenti complicati?', 'No. Gli strumenti pensati per agenti partono da una foto e da una scelta di stile: il resto lo fanno loro.'],
  ],
};

export const videoSocial: Guide = {
  slug: 'video-immobiliari-social',
  label: 'Video immobiliari per i social',
  title: 'Video immobiliari per i social: perché farli e come farli bene',
  description: 'Perché un agente immobiliare dovrebbe pubblicare video su Instagram e TikTok, che video funzionano, ogni quanto pubblicarli e come farli senza videomaker.',
  h1: 'Video immobiliari per i social: perché farli e come farli bene',
  intro: 'Nella tua zona i clienti chiamano l\'agente che conoscono già. E oggi lo conoscono prima di tutto dai video che vedono scorrendo il telefono.',
  updated: '2026-09-27',
  sections: [
    {
      id: 'perche',
      title: 'Perché i video contano più delle foto sui social',
      html: `<p>Sul portale l'acquirente cerca una casa. Sui social, invece, nessuno sta cercando casa: scorre. Per fermarlo serve movimento, ed è quello che fa un video. Ma il vero motivo per pubblicarli è un altro: <strong>i video fanno conoscere te</strong>. Chi vede ogni settimana le case che segui, nella sua zona, quando deciderà di vendere si ricorderà del tuo nome.</p>`,
    },
    {
      id: 'quali',
      title: 'Che video funzionano per un agente',
      html: `<ul>
  <li><strong>Prima e dopo</strong>: la stanza vuota che si arreda. Si capisce in un secondo e si guarda fino alla fine.</li>
  <li><strong>Nuovo incarico</strong>: le stanze migliori della casa appena presa, in pochi secondi.</li>
  <li><strong>Venduto</strong>: la casa con il cartello, il segnale che nella zona lavori davvero.</li>
  <li><strong>Zona</strong>: il quartiere, i servizi, perché ci si vive bene. Ti posiziona come quello che la conosce meglio.</li>
</ul>`,
    },
    {
      id: 'formato',
      title: 'Formato e durata',
      html: `<p>Verticale (9:16) per reel, TikTok e storie; orizzontale per il sito e il portale. Brevi: pochi secondi bastano se il primo fotogramma è già interessante. Niente introduzioni lunghe col logo: il logo va in un angolo, la casa al centro.</p>`,
    },
    {
      id: 'costanza',
      title: 'La costanza conta più della perfezione',
      html: `<p>Un video bellissimo al mese vale meno di un video semplice a settimana. Il pubblico della tua zona ti deve rivedere spesso per ricordarti. Il problema di solito non è l'idea ma il tempo: riprese, montaggio, musica. Per questo conviene partire dalle foto che hai già: ogni nuovo incarico diventa un video senza uscire di casa.</p>`,
    },
    {
      id: 'senza-videomaker',
      title: 'Farli senza videomaker',
      html: `<p>Un videomaker ha senso per l'immobile di pregio. Per il lavoro di tutti i giorni servono video rapidi e frequenti, che oggi si ottengono con l'intelligenza artificiale partendo da una foto. Con <a href="/it">Agente Immo</a> scegli la foto e l'effetto, e il video è pronto da pubblicare.</p>`,
    },
  ],
  faq: [
    ['Ogni quanto dovrebbe pubblicare un agente immobiliare?', 'Meglio poco ma con costanza: un video a settimana tiene il tuo nome davanti a chi vive nella tua zona. Ogni nuovo incarico è già un contenuto.'],
    ['Meglio Instagram o TikTok?', 'Dipende dal pubblico della tua zona. Lo stesso video verticale funziona su entrambi: pubblicarlo in tutti e due non costa lavoro in più.'],
    ['Servono attrezzature per i video?', 'No, se parti dalle foto. Con l\'AI una foto della stanza diventa un video: niente riprese, niente montaggio.'],
  ],
};

export const acquisireIncarichi: Guide = {
  slug: 'acquisire-incarichi-immobiliari',
  label: 'Come acquisire incarichi',
  title: 'Come acquisire più incarichi immobiliari: presentarsi meglio',
  description: 'Come vincere più incarichi di vendita: cosa guarda il proprietario quando sceglie l\'agente e come presentarsi all\'appuntamento con prove concrete, non promesse.',
  h1: 'Come acquisire più incarichi: vince chi si presenta meglio',
  intro: 'Il proprietario ha sentito altre agenzie. Tutte gli hanno promesso di vendere bene e in fretta. Cosa gli fa scegliere te?',
  updated: '2026-09-27',
  sections: [
    {
      id: 'cosa-guarda',
      title: 'Cosa guarda il proprietario quando sceglie',
      html: `<p>Chi affida la propria casa vuole capire tre cose: <strong>quanto vale</strong>, <strong>come verrà presentata</strong> e <strong>chi se ne occuperà</strong>. Sulla valutazione le agenzie si somigliano. È sulla presentazione e sulla fiducia che si vince o si perde l'incarico.</p>`,
    },
    {
      id: 'mostrare',
      title: 'Mostrare, non promettere',
      html: `<p>Frasi come "faremo foto professionali" o "la pubblicheremo ovunque" le dicono tutti. Molto più forte è arrivare all'appuntamento con:</p>
<ul>
  <li><strong>una stanza della sua casa già arredata</strong> in foto, preparata dalle foto che ti ha mandato o scattate al sopralluogo;</li>
  <li><strong>un video di prova</strong> come quello che pubblicherai sui social;</li>
  <li><strong>il tuo sito</strong>, con gli immobili che segui presentati tutti allo stesso livello.</li>
</ul>
<p>Il proprietario vede con i suoi occhi come verrà venduta la sua casa. Gli altri gli hanno lasciato un biglietto da visita.</p>`,
    },
    {
      id: 'presenza',
      title: 'Farsi trovare prima dell\'appuntamento',
      html: `<p>Molti incarichi si decidono prima ancora dell'incontro: il proprietario cerca il tuo nome, guarda i tuoi annunci, i tuoi video, il tuo sito. Se trova annunci curati e una presenza costante nella sua zona, arriva all'appuntamento già convinto a metà. Se trova solo il profilo sul portale, sei uno dei tanti.</p>`,
    },
    {
      id: 'dopo',
      title: 'Dopo l\'incarico: mantenere la promessa',
      html: `<p>L'incarico si rinnova (e porta nuovi clienti per passaparola) se il proprietario vede che hai fatto quello che avevi mostrato. Annuncio con foto arredate dal primo giorno, video pubblicato, pagina sul sito da mandargli. Tienilo aggiornato: la casa presentata bene è anche la tua pubblicità verso il prossimo proprietario.</p>`,
    },
    {
      id: 'strumenti',
      title: 'Gli strumenti per farlo ogni volta',
      html: `<p>Preparare foto arredate, video e sito per ogni acquisizione è possibile solo se richiede minuti, non giorni. <a href="/it">Agente Immo</a> mette tutto in un posto: carichi le foto, arredi le stanze, crei il video, e l'immobile finisce sul tuo sito.</p>`,
    },
  ],
  faq: [
    ['Come convincere un proprietario a dare l\'incarico in esclusiva?', 'Con prove concrete di come presenterai la casa: foto arredate, un video, la pagina sul tuo sito. Un piano visibile convince più di uno sconto sulla provvigione.'],
    ['Conviene preparare le foto arredate prima dell\'incarico?', 'Sì, almeno per la stanza principale: bastano le foto del sopralluogo. Mostrarle all\'appuntamento è il modo più rapido per distinguerti dalle altre agenzie.'],
    ['Quanto conta la presenza online per acquisire incarichi?', 'Molto: il proprietario spesso cerca l\'agente prima di incontrarlo. Annunci curati, video frequenti nella zona e un sito proprio fanno arrivare all\'appuntamento con la fiducia già costruita.'],
  ],
};

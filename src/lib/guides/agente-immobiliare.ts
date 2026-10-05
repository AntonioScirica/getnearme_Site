// Guida "Agente immobiliare" (pagina pilastro SEO per la ricerca "agente immobiliare"): risponde subito, poi rimanda
// a tutte le guide del gruppo (elenco per argomento in related.ts, mostrato in fondo alla pagina).
// Testo in HTML semplice, stilizzato da .guide in globals.css. Norme citate: L. 39/1989, artt. 1754-1765 c.c.,
// D.Lgs. 59/2010 (fine del ruolo, iscrizione al REA), D.Lgs. 231/2007 (antiriciclaggio), D.Lgs. 192/2005 (APE).
// Numeri solo con fonte e data: 49.026 agenti abilitati (marzo 2025, Euromq), 766.757 compravendite di abitazioni nel 2025
// (Agenzia delle Entrate, OMI, Rapporto Immobiliare 2026). Dove i valori cambiano (provvigioni, corsi) si dice da cosa dipendono.

import type { Guide } from './types';

const EUROMQ = 'https://euromq.it/il-mercato-immobiliare-italiano-alcuni-numeri-ed-opportunita/';
const OMI_RI = 'https://www.agenziaentrate.gov.it/portale/cs-21-maggio-2026';

const SECTIONS: Guide['sections'] = [
  {
    id: 'chi-e',
    title: 'Cosa fa un agente immobiliare?',
    html: `<p>L'<strong>agente immobiliare</strong> mette in contatto chi vende (o affitta) una casa con chi la compra (o la prende in affitto) e li accompagna fino alla conclusione dell'affare. Per la legge è un <strong>mediatore</strong>: il Codice civile lo definisce come colui che mette in relazione due o più parti per la conclusione di un affare, senza essere legato a nessuna di esse da rapporti di collaborazione, dipendenza o rappresentanza (art. 1754 c.c.). L'attività è regolata dalla <strong>Legge 39/1989</strong>.</p>
<p>In pratica il lavoro si divide in due metà: <strong>trovare immobili da vendere</strong> (l'acquisizione degli incarichi) e <strong>trovare chi li compra</strong>. Nel mezzo ci sono queste attività:</p>
<ul>
  <li><strong>Valutazione</strong> dell'immobile, confrontando prezzi di zona, stato della casa e mercato: il metodo è nella guida sulla <a href="/it/valutazione-immobile-acquisizione">valutazione dell'immobile per l'acquisizione</a>.</li>
  <li><strong>Incarico di mediazione</strong> firmato con il proprietario, in esclusiva o meno, con durata e provvigione.</li>
  <li><strong>Verifiche</strong> su documenti, conformità urbanistica e catastale, APE, eventuali ipoteche.</li>
  <li><strong>Promozione</strong>: foto, <a href="/it/come-scrivere-annuncio-immobiliare">annuncio</a>, portali, social, sito, cartelli, contatti diretti.</li>
  <li><strong>Visite</strong> con i potenziali acquirenti e raccolta dei loro riscontri.</li>
  <li><strong>Trattativa</strong>, proposta d'acquisto, accettazione e preliminare (compromesso).</li>
  <li><strong>Accompagnamento</strong> fino al rogito dal notaio, spesso coordinando banca e mutuo.</li>
</ul>
<p>Chi fa bene questo mestiere passa gran parte del tempo in strada, con proprietari e acquirenti. Tutto quello che lo tiene al computer (sistemare foto, scrivere annunci, aggiornare siti) è tempo tolto alle trattative.</p>`,
  },
  {
    id: 'numeri',
    title: 'Quanti sono gli agenti immobiliari in Italia?',
    html: `<p>Due numeri aiutano a capire il mercato in cui lavora un agente immobiliare oggi:</p>
<div style="overflow-x:auto"><table style="width:100%;margin-top:1rem;border-collapse:collapse;font-size:1rem;line-height:1.5">
  <thead><tr><th style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd">Dato</th><th style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd">Valore</th><th style="text-align:left;padding:.6rem .75rem;border-bottom:2px solid #ddd">Fonte</th></tr></thead>
  <tbody>
    <tr><td style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top">Agenti immobiliari abilitati in Italia</td><td style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"><strong>49.026</strong> (marzo 2025)</td><td style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"><a href="${EUROMQ}" rel="noopener">Euromq</a></td></tr>
    <tr><td style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top">Compravendite di abitazioni nel 2025</td><td style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"><strong>766.757</strong> (+6,4% sul 2024)</td><td style="padding:.6rem .75rem;border-bottom:1px solid #eee;vertical-align:top"><a href="${OMI_RI}" rel="noopener">Agenzia delle Entrate, OMI, Rapporto Immobiliare 2026</a> (21 maggio 2026)</td></tr>
  </tbody>
</table></div>
<p>Il numero delle compravendite non comprende i comuni dove vige il catasto tavolare, come quelli delle province di Trento e Bolzano. Non tutti gli abilitati lavorano a tempo pieno e non tutte le vendite passano da un'agenzia: per questo il rapporto tra i due numeri è solo indicativo. Il messaggio però è chiaro: il mercato c'è, e la concorrenza anche. Per farsi scegliere conta sempre di più come ti presenti ai proprietari. I prezzi zona per zona delle principali città, sempre dall'OMI, li trovi nelle pagine dei <a href="/it/prezzi-case">prezzi delle case al metro quadro</a>.</p>`,
  },
  {
    id: 'agenzia',
    title: 'Agente immobiliare, agenzia e collaboratore: che differenza c\'è?',
    html: `<p>Nel linguaggio comune "agente immobiliare" e "agenzia immobiliare" si usano come sinonimi, ma le figure sono diverse:</p>
<ul>
  <li><strong>Titolare o legale rappresentante</strong> di un'agenzia: è abilitato alla mediazione, iscritto al Registro delle Imprese o al REA, e risponde dell'attività dell'agenzia.</li>
  <li><strong>Agente abilitato che lavora per un'agenzia</strong>: ha superato l'esame e opera come collaboratore, di solito a provvigione.</li>
  <li><strong>Agente indipendente</strong>: lavora con la propria ditta individuale, senza insegna di un gruppo. Vantaggi, costi e primi passi sono nella guida all'<a href="/it/agente-immobiliare-indipendente">agente immobiliare indipendente</a>.</li>
  <li><strong>Agenzie in franchising</strong>: usano marchio, strumenti e formazione di una rete, pagando una quota.</li>
</ul>
<p>Attenzione a chi collabora con un'agenzia <strong>senza essere abilitato</strong>: può svolgere compiti di supporto, ma non può fare mediazione. La mediazione esercitata senza abilitazione è sanzionata e il mediatore non abilitato non ha diritto alla provvigione.</p>`,
  },
  {
    id: 'requisiti',
    title: 'Quali requisiti servono per fare l\'agente immobiliare?',
    html: `<p>Per esercitare servono requisiti personali, un titolo di studio e l'abilitazione:</p>
<ul>
  <li><strong>maggiore età</strong> e godimento dei diritti civili;</li>
  <li>cittadinanza italiana o di un Paese UE, oppure un permesso di soggiorno valido;</li>
  <li><strong>diploma di scuola secondaria di secondo grado</strong> (la maturità): la laurea non è richiesta;</li>
  <li>assenza delle condanne e delle misure che la legge considera ostative;</li>
  <li>il superamento del <strong>corso abilitante</strong> e dell'<strong>esame</strong> alla Camera di Commercio;</li>
  <li>una <strong>polizza di responsabilità civile professionale</strong>, obbligatoria per esercitare, a tutela dei clienti.</li>
</ul>
<p>La legge prevede anche delle <strong>incompatibilità</strong>, per esempio con il pubblico impiego e con alcune attività imprenditoriali nello stesso settore. Le regole sono state riviste nel tempo: prima di iniziare verificale con la Camera di Commercio della tua provincia.</p>`,
  },
  {
    id: 'come-diventare',
    title: 'Come si diventa agente immobiliare?',
    html: `<p>Il percorso tipico, dal diploma al primo incarico:</p>
<ol>
  <li><strong>Corso di formazione abilitante</strong> riconosciuto dalla Regione. Durata, costo e modalità (in aula o online) cambiano da regione a regione: verifica l'elenco dei corsi autorizzati della tua.</li>
  <li><strong>Esame di abilitazione</strong> presso la Camera di Commercio, con una prova scritta e una orale su diritto civile e tributario, estimo, urbanistica e legislazione di settore.</li>
  <li><strong>Avvio dell'attività</strong>: dal 2010 il vecchio "ruolo degli agenti" non esiste più (D.Lgs. 59/2010). Chi apre un'attività presenta la SCIA e viene iscritto al Registro delle Imprese; chi lavora per un'agenzia viene iscritto al REA.</li>
  <li><strong>Polizza</strong> di responsabilità civile professionale.</li>
  <li><strong>Scelta della strada</strong>: collaboratore in agenzia, rete in franchising o attività in proprio.</li>
</ol>
<p>Ogni passaggio, con cosa preparare e in che ordine, è spiegato nella guida su <a href="/it/come-diventare-agente-immobiliare">come diventare agente immobiliare</a>.</p>`,
  },
  {
    id: 'quanto-guadagna',
    title: 'Quanto guadagna un agente immobiliare?',
    html: `<p>Un agente immobiliare guadagna quasi sempre a <strong>provvigione</strong>, cioè con una percentuale sul prezzo dell'affare concluso. La misura della provvigione è libera e si concorda nell'incarico; in molte zone si fa riferimento agli usi raccolti dalle Camere di Commercio, e nella pratica si vedono spesso valori tra il <strong>2% e il 4% più IVA</strong> per ciascuna parte, venditore e acquirente.</p>
<p>Un esempio solo per capire l'ordine di grandezza: su una casa venduta a 200.000 euro, una provvigione del 3% per parte vale 6.000 euro dal venditore e 6.000 euro dall'acquirente, IVA esclusa. Quella cifra va all'agenzia: se sei un collaboratore, ti spetta la quota concordata con il titolare. Puoi fare i conti con il calcolatore nella guida sulla <a href="/it/provvigione-agente-immobiliare">provvigione dell'agente immobiliare</a>.</p>
<p>Il reddito, quindi, dipende da quattro cose:</p>
<ul>
  <li><strong>quanti incarichi</strong> acquisisci (senza immobili da vendere non si vende niente);</li>
  <li><strong>quanti ne chiudi</strong> e in quanto tempo;</li>
  <li><strong>il prezzo medio</strong> degli immobili della tua zona;</li>
  <li><strong>la tua quota</strong> sulla provvigione e i costi dell'attività (portali, strumenti, auto, polizza).</li>
</ul>
<p>È per questo che gli agenti che guadagnano di più di solito non sono quelli che lavorano più ore, ma quelli che <strong>acquisiscono più incarichi</strong> e vendono in meno tempo.</p>`,
  },
  {
    id: 'provvigione',
    title: 'Quando matura la provvigione e chi la paga?',
    html: `<p>Il diritto alla provvigione nasce quando l'affare è <strong>concluso per effetto dell'intervento</strong> del mediatore (art. 1755 c.c.). Per "concluso" si intende il momento in cui le parti sono vincolate: di solito l'accettazione della proposta d'acquisto o la firma del preliminare, non il rogito.</p>
<p>La provvigione è dovuta da <strong>entrambe le parti</strong>, salvo patti diversi. Se le parti si accordano direttamente dopo che l'agente le ha messe in contatto, la provvigione in genere resta dovuta. Per un proprietario è una delle voci principali di <a href="/it/quanto-costa-vendere-casa">quanto costa vendere casa</a>.</p>
<p>Il mediatore ha anche degli obblighi: deve comunicare alle parti le circostanze che conosce sulla valutazione e la sicurezza dell'affare (art. 1759 c.c.) e rispettare la normativa antiriciclaggio, con l'adeguata verifica dei clienti (D.Lgs. 231/2007).</p>`,
  },
  {
    id: 'incarichi',
    title: 'Come trova incarichi un agente immobiliare?',
    html: `<p>Per un agente immobiliare l'acquisizione è il lavoro che decide tutto il resto. Il proprietario affida la casa all'agente che gli dimostra meglio <strong>come la venderà</strong>, non a quello che promette il prezzo più alto. La strategia completa è nella guida su <a href="/it/acquisire-incarichi-immobiliari">come acquisire incarichi immobiliari</a>; ecco cosa funziona davvero:</p>
<ul>
  <li><strong>Presidia una zona.</strong> Pochi quartieri conosciuti a fondo valgono più di una città intera: prezzi, strade, condomìni, persone.</li>
  <li><strong>Contatta i proprietari nel modo giusto</strong>, con una <a href="/it/lettera-acquisizione-immobili">lettera di acquisizione</a>, un <a href="/it/messaggi-acquisire-immobili">messaggio su WhatsApp</a> quando c'è già un contatto o una telefonata preparata con lo <a href="/it/script-telefonata-proprietari">script per i privati</a>.</li>
  <li><strong>Presentati con materiale concreto.</strong> Arrivare all'incontro con foto arredate, un video e la pagina già pronta sul tuo sito fa capire come verrà promossa la casa, meglio di qualsiasi promessa: è il cuore della <a href="/it/presentazione-acquisizione-immobile">presentazione di acquisizione</a>.</li>
  <li><strong>Fatti trovare.</strong> Una <a href="/it/agenzia-immobiliare-google-maps">scheda su Google Maps</a> con le <a href="/it/recensioni-google-agenzia-immobiliare">recensioni dei clienti</a>, un sito tuo e una presenza costante sui social, con case vere della zona.</li>
  <li><strong>Coltiva la rete.</strong> Amministratori di condominio, notai, geometri, artigiani e clienti soddisfatti sono la fonte di incarichi più affidabile. Altre idee nella guida su <a href="/it/come-trovare-clienti-agente-immobiliare">come trovare clienti</a>.</li>
  <li><strong>Richiama.</strong> Chi oggi dice "non vendo" spesso vende tra sei mesi: tieni traccia in un <a href="/it/crm-immobiliare">CRM immobiliare</a> e fatti sentire.</li>
</ul>`,
  },
  {
    id: 'vendere-prima',
    title: 'Come si vende una casa più in fretta?',
    html: `<p>Sui portali chi cerca casa scorre decine di annunci in pochi secondi, e si ferma sulla prima foto che lo colpisce. Un annuncio che vende prima ha quasi sempre queste caratteristiche:</p>
<ul>
  <li><strong>Foto luminose e ordinate</strong>, scattate in orizzontale, con la stanza più bella come prima immagine. Si possono fare bene anche con lo <a href="/it/foto-immobiliari-smartphone">smartphone</a>.</li>
  <li><strong>Stanze arredate.</strong> Una casa vuota sembra più piccola e più fredda; con l'<a href="/it/home-staging-virtuale">home staging virtuale</a> chi guarda capisce subito come vivrebbe quella casa. Va indicato nell'annuncio che l'arredamento è virtuale: le regole sono nella guida al <a href="/it/virtual-staging-legale">virtual staging legale</a>.</li>
  <li><strong>Un video</strong>, anche breve: su social e portali trattiene l'attenzione molto più di una foto.</li>
  <li><strong>Un testo completo</strong>: metri quadri, piano, esposizione, spese, classe energetica, cosa c'è vicino. La classe energetica va sempre indicata negli annunci di vendita e affitto (<a href="/it/ape-annunci-immobiliari">APE negli annunci</a>).</li>
  <li><strong>Il prezzo giusto dal primo giorno.</strong> Un immobile sopravvalutato resta online, "invecchia" e finisce per vendersi peggio. Se è già successo, parti dalla guida sulla <a href="/it/casa-che-non-si-vende">casa che non si vende</a>.</li>
</ul>`,
  },
  {
    id: 'strumenti',
    title: 'Quali strumenti usa un agente immobiliare nel 2026?',
    html: `<p>Il lavoro in strada resta il cuore del mestiere, ma gli strumenti digitali decidono quanto tempo ti resta per farlo. Quelli che un agente immobiliare usa più spesso:</p>
<ul>
  <li><strong>Portali immobiliari</strong>, per raggiungere chi cerca casa: come funzionano i prezzi è spiegato in <a href="/it/costo-immobiliare-it-agenzie">quanto costano i portali alle agenzie</a>.</li>
  <li><strong>Un <a href="/it/gestionale-immobiliare">gestionale immobiliare</a></strong>, per immobili, clienti, appuntamenti e richiami.</li>
  <li><strong>Un <a href="/it/sito-web-agente-immobiliare">sito personale</a></strong>, per farti trovare e scegliere come agente, non solo come annuncio.</li>
  <li><strong>Strumenti per foto e video</strong>, per presentare ogni immobile al meglio senza pagare ogni volta un fotografo, un home stager o un videomaker. Molti oggi usano l'<a href="/it/intelligenza-artificiale-agenti-immobiliari">intelligenza artificiale</a>.</li>
  <li><strong>Social network e WhatsApp</strong>, per restare presente nella tua zona con i <a href="/it/video-immobiliari-social">video immobiliari</a> e rispondere in fretta con <a href="/it/whatsapp-business-agenzia-immobiliare">WhatsApp Business</a>.</li>
</ul>
<p>Un confronto completo è nella guida ai <a href="/it/software-agenti-immobiliari">software per agenti immobiliari</a>. <strong>Agente Immo</strong> nasce per la parte foto, video e sito: foto arredate con l'AI, video per i social e il tuo sito già pronto, per ogni immobile che acquisisci. Lo provi gratis, senza carta.</p>`,
  },
  {
    id: 'fonti',
    title: 'Fonti e norme citate',
    html: `<ul>
  <li>Legge 3 febbraio 1989, n. 39: disciplina della professione di mediatore.</li>
  <li>Codice civile, artt. 1754-1765: la mediazione (art. 1755 provvigione, art. 1759 obblighi del mediatore).</li>
  <li>D.Lgs. 26 marzo 2010, n. 59: soppressione del ruolo degli agenti d'affari in mediazione.</li>
  <li>D.Lgs. 21 novembre 2007, n. 231: antiriciclaggio.</li>
  <li>D.Lgs. 19 agosto 2005, n. 192: prestazione energetica degli edifici e APE.</li>
  <li><a href="${EUROMQ}" rel="noopener">Euromq, Il mercato immobiliare italiano: alcuni numeri ed opportunità</a>: agenti abilitati a marzo 2025.</li>
  <li><a href="${OMI_RI}" rel="noopener">Agenzia delle Entrate, comunicato del 21 maggio 2026 sul Rapporto Immobiliare 2026</a>: compravendite di abitazioni nel 2025.</li>
</ul>
<p>Guida aggiornata a ottobre 2026. Le regole su corsi, esami e incompatibilità possono cambiare: per il tuo caso fai sempre riferimento alla Camera di Commercio e alla Regione.</p>`,
  },
];

const FAQ: Guide['faq'] = [
  ['Cosa fa un agente immobiliare?', 'Mette in contatto chi vende o affitta una casa con chi la compra o la prende in affitto: valuta l\'immobile, lo promuove, organizza le visite, segue trattativa e proposta e accompagna le parti fino al rogito. Per la legge è un mediatore (art. 1754 c.c., Legge 39/1989).'],
  ['Serve la laurea per fare l\'agente immobiliare?', 'No. Serve il diploma di scuola secondaria di secondo grado, poi il corso di formazione riconosciuto dalla Regione e l\'esame di abilitazione alla Camera di Commercio.'],
  ['Quanti agenti immobiliari ci sono in Italia?', 'A marzo 2025 gli agenti immobiliari abilitati in Italia erano 49.026, secondo i dati riportati da Euromq. Nel 2025 le compravendite di abitazioni sono state 766.757 (Agenzia delle Entrate, OMI, Rapporto Immobiliare 2026).'],
  ['Quanto dura il corso per agente immobiliare?', 'Dipende dalla Regione, che stabilisce durata e programma dei corsi abilitanti. Controlla l\'elenco dei corsi autorizzati nella tua Regione.'],
  ['Si può fare l\'agente immobiliare senza un\'agenzia?', 'Sì. Dopo l\'abilitazione puoi aprire una ditta individuale e lavorare in proprio, oppure collaborare con un\'agenzia esistente.'],
  ['Qual è la provvigione di un agente immobiliare?', 'È libera e si concorda nell\'incarico. Nella pratica si vedono spesso valori tra il 2% e il 4% più IVA per ciascuna parte, ma dipende dalla zona e dall\'accordo.'],
  ['Quando si paga l\'agente immobiliare?', 'La provvigione matura quando l\'affare è concluso grazie al suo intervento, di solito con l\'accettazione della proposta o la firma del preliminare, salvo accordi diversi.'],
  ['Come trova clienti un agente immobiliare?', 'Presidiando una zona, restando visibile con costanza sui social, presentandosi ai proprietari con materiale concreto (foto, video, sito) e coltivando una rete di contatti che segnala chi vuole vendere.'],
];

export const agenteImmobiliare: Guide = {
  slug: 'agente-immobiliare',
  label: 'Agente immobiliare',
  title: 'Agente immobiliare: cosa fa, requisiti e guadagni (2026)',
  description: 'Agente immobiliare: cosa fa, requisiti, corso ed esame per diventarlo, provvigioni e guadagni, strumenti e come trovare più incarichi. Guida 2026.',
  h1: 'Agente immobiliare: cosa fa, come diventarlo, quanto guadagna e come trovare incarichi',
  intro: 'L\'agente immobiliare è il professionista abilitato che fa da mediatore tra chi vende (o affitta) una casa e chi la compra (o la prende in affitto): valuta l\'immobile, lo promuove, organizza le visite, segue la trattativa e accompagna le parti fino al rogito. È pagato a provvigione e, per esercitare, deve superare un corso e un esame alla Camera di Commercio. Qui trovi requisiti, guadagni, strumenti e come trovare più incarichi.',
  summary: 'l\'agente immobiliare è un mediatore abilitato (Legge 39/1989, art. 1754 c.c.) che mette in contatto venditore e acquirente e li segue fino al rogito; guadagna una provvigione concordata, spesso tra il 2% e il 4% più IVA per parte. Per diventarlo servono diploma, corso regionale ed esame alla Camera di Commercio.',
  published: '2026-09-27',
  updated: '2026-10-05',
  sections: SECTIONS,
  faq: FAQ,
};

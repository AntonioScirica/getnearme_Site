// Guida "Agente immobiliare" (pagina pilastro SEO per la ricerca "agente immobiliare").
// Testo in HTML semplice, stilizzato da .guide in globals.css. Norme citate: L. 39/1989, artt. 1754-1765 c.c.,
// D.Lgs. 59/2010 (fine del ruolo, iscrizione al REA), D.Lgs. 231/2007 (antiriciclaggio), D.Lgs. 192/2005 (APE).
// Niente cifre inventate: dove i valori cambiano (provvigioni, corsi, guadagni) si dice da cosa dipendono.

import type { Guide } from './types';

const SECTIONS: Guide['sections'] = [
  {
    id: 'chi-e',
    title: 'Chi è e cosa fa l\'agente immobiliare',
    html: `<p>L'<strong>agente immobiliare</strong> è il professionista che mette in contatto chi vende (o affitta) una casa con chi la compra (o la prende in affitto) e li accompagna fino alla conclusione dell'affare. Per la legge è un <strong>mediatore</strong>: il Codice civile lo definisce come colui che mette in relazione due o più parti per la conclusione di un affare, senza essere legato a nessuna di esse da rapporti di collaborazione, dipendenza o rappresentanza (art. 1754 c.c.). L'attività è regolata dalla <strong>Legge 39/1989</strong>.</p>
<p>In pratica il lavoro di un agente immobiliare si divide in due metà: <strong>trovare immobili da vendere</strong> (l'acquisizione degli incarichi) e <strong>trovare chi li compra</strong>. Nel mezzo ci sono molte attività:</p>
<ul>
  <li><strong>Valutazione</strong> dell'immobile, confrontando prezzi di zona, stato della casa e mercato.</li>
  <li><strong>Incarico di mediazione</strong> firmato con il proprietario, in esclusiva o meno, con durata e provvigione.</li>
  <li><strong>Verifiche</strong> su documenti, conformità urbanistica e catastale, APE, eventuali ipoteche.</li>
  <li><strong>Promozione</strong>: foto, annuncio, portali, social, sito, cartelli, contatti diretti.</li>
  <li><strong>Visite</strong> con i potenziali acquirenti e raccolta dei loro riscontri.</li>
  <li><strong>Trattativa</strong>, proposta d'acquisto, accettazione e preliminare (compromesso).</li>
  <li><strong>Accompagnamento</strong> fino al rogito dal notaio, spesso coordinando banca e mutuo.</li>
</ul>
<p>Chi fa bene questo mestiere passa gran parte del tempo in strada, con proprietari e acquirenti. Tutto quello che lo tiene al computer (sistemare foto, scrivere annunci, aggiornare siti) è tempo tolto alle trattative.</p>`,
  },
  {
    id: 'agenzia',
    title: 'Agente immobiliare, agenzia e collaboratore: le differenze',
    html: `<p>Nel linguaggio comune "agente immobiliare" e "agenzia immobiliare" si usano come sinonimi, ma le figure sono diverse:</p>
<ul>
  <li><strong>Titolare o legale rappresentante</strong> di un'agenzia: è abilitato alla mediazione, iscritto al Registro delle Imprese o al REA, e risponde dell'attività dell'agenzia.</li>
  <li><strong>Agente abilitato che lavora per un'agenzia</strong>: ha superato l'esame e opera come collaboratore, di solito a provvigione.</li>
  <li><strong>Agente indipendente</strong>: lavora con la propria ditta individuale, senza insegna di un gruppo.</li>
  <li><strong>Agenzie in franchising</strong>: usano marchio, strumenti e formazione di una rete, pagando una quota.</li>
</ul>
<p>Attenzione a chi collabora con un'agenzia <strong>senza essere abilitato</strong>: può svolgere compiti di supporto, ma non può fare mediazione. La mediazione esercitata senza abilitazione è sanzionata e il mediatore non abilitato non ha diritto alla provvigione.</p>`,
  },
  {
    id: 'come-diventare',
    title: 'Come diventare agente immobiliare: requisiti, corso ed esame',
    html: `<p>Per diventare agente immobiliare in Italia servono requisiti personali, una formazione specifica e un esame. I passaggi tipici sono questi:</p>
<ol>
  <li><strong>Requisiti personali</strong>: maggiore età, cittadinanza italiana o di un Paese UE (o permesso di soggiorno valido), godimento dei diritti civili, assenza delle condanne che la legge considera ostative.</li>
  <li><strong>Titolo di studio</strong>: diploma di scuola secondaria di secondo grado (maturità). Non serve la laurea.</li>
  <li><strong>Corso di formazione abilitante</strong> riconosciuto dalla Regione. Durata, costo e modalità (in aula o online) cambiano da regione a regione: verifica l'elenco dei corsi autorizzati della tua.</li>
  <li><strong>Esame di abilitazione</strong> presso la Camera di Commercio, con una prova scritta e una orale su diritto civile e tributario, estimo, urbanistica e legislazione di settore.</li>
  <li><strong>Avvio dell'attività</strong>: dal 2010 il vecchio "ruolo degli agenti" non esiste più (D.Lgs. 59/2010). Chi apre un'attività presenta la SCIA e viene iscritto al Registro delle Imprese; chi lavora per un'agenzia viene iscritto al REA.</li>
  <li><strong>Polizza di responsabilità civile professionale</strong>: è obbligatoria per esercitare, a tutela dei clienti.</li>
</ol>
<p>La legge prevede anche delle <strong>incompatibilità</strong>, per esempio con il pubblico impiego e con alcune attività imprenditoriali nello stesso settore. Le regole sono state riviste nel tempo: prima di iniziare verificale con la Camera di Commercio della tua provincia.</p>`,
  },
  {
    id: 'quanto-guadagna',
    title: 'Quanto guadagna un agente immobiliare',
    html: `<p>Un agente immobiliare guadagna quasi sempre a <strong>provvigione</strong>, cioè con una percentuale sul prezzo dell'affare concluso. La misura della provvigione è libera e si concorda nell'incarico; in molte zone si fa riferimento agli usi raccolti dalle Camere di Commercio, e nella pratica si vedono spesso valori tra il <strong>2% e il 4% più IVA</strong> per ciascuna parte, venditore e acquirente.</p>
<p>Un esempio solo per capire l'ordine di grandezza: su una casa venduta a 200.000 euro, una provvigione del 3% per parte vale 6.000 euro dal venditore e 6.000 euro dall'acquirente, IVA esclusa. Quella cifra va all'agenzia: se sei un collaboratore, ti spetta la quota concordata con il titolare.</p>
<p>Il reddito, quindi, dipende da quattro cose:</p>
<ul>
  <li><strong>quanti incarichi</strong> acquisisci (senza immobili da vendere non si vende niente);</li>
  <li><strong>quanti ne chiudi</strong> e in quanto tempo;</li>
  <li><strong>il prezzo medio</strong> degli immobili della tua zona;</li>
  <li><strong>la tua quota</strong> sulla provvigione e i costi dell'attività.</li>
</ul>
<p>È per questo che gli agenti che guadagnano di più di solito non sono quelli che lavorano più ore, ma quelli che <strong>acquisiscono più incarichi</strong> e vendono in meno tempo.</p>`,
  },
  {
    id: 'provvigione',
    title: 'Quando matura la provvigione e chi la paga',
    html: `<p>Il diritto alla provvigione nasce quando l'affare è <strong>concluso per effetto dell'intervento</strong> del mediatore (art. 1755 c.c.). Per "concluso" si intende il momento in cui le parti sono vincolate: di solito l'accettazione della proposta d'acquisto o la firma del preliminare, non il rogito.</p>
<p>La provvigione è dovuta da <strong>entrambe le parti</strong>, salvo patti diversi. Se le parti si accordano direttamente dopo che l'agente le ha messe in contatto, la provvigione in genere resta dovuta.</p>
<p>Il mediatore ha anche degli obblighi: deve comunicare alle parti le circostanze che conosce sulla valutazione e la sicurezza dell'affare (art. 1759 c.c.) e rispettare la normativa antiriciclaggio, con l'adeguata verifica dei clienti (D.Lgs. 231/2007).</p>`,
  },
  {
    id: 'incarichi',
    title: 'Come trovare più incarichi di vendita',
    html: `<p>Per un agente immobiliare l'acquisizione è il lavoro che decide tutto il resto. Il proprietario affida la casa all'agente che gli dimostra meglio <strong>come la venderà</strong>, non a quello che promette il prezzo più alto. Ecco cosa funziona davvero:</p>
<ul>
  <li><strong>Presidia una zona.</strong> Pochi quartieri conosciuti a fondo valgono più di una città intera: prezzi, strade, condomìni, persone. Quando qualcuno pensa di vendere, deve venirgli in mente il tuo nome.</li>
  <li><strong>Fatti vedere con costanza.</strong> Chi pubblica ogni settimana sui social, con case vere della zona, diventa l'agente che la gente conosce. I video dei tuoi immobili sono il contenuto migliore che hai.</li>
  <li><strong>Presentati con materiale concreto.</strong> Arrivare all'incontro con foto arredate, un video e la pagina già pronta sul tuo sito fa capire al proprietario come verrà promossa la sua casa, meglio di qualsiasi promessa.</li>
  <li><strong>Abbi un sito tuo.</strong> Sui portali sei uno dei tanti; il tuo sito è il biglietto da visita da mandare a chi deve scegliere a chi affidare casa.</li>
  <li><strong>Coltiva la rete.</strong> Amministratori di condominio, notai, geometri, artigiani e clienti soddisfatti sono la fonte di incarichi più affidabile.</li>
  <li><strong>Chiedi le recensioni</strong> dopo ogni vendita e mettile dove i proprietari le vedono.</li>
  <li><strong>Richiama.</strong> Chi oggi dice "non vendo" spesso vende tra sei mesi: tieni traccia e fatti sentire.</li>
</ul>`,
  },
  {
    id: 'vendere-prima',
    title: 'Come vendere casa prima: annunci che si notano',
    html: `<p>Sui portali chi cerca casa scorre decine di annunci in pochi secondi, e si ferma sulla prima foto che lo colpisce. Un annuncio che vende prima ha quasi sempre queste caratteristiche:</p>
<ul>
  <li><strong>Foto luminose e ordinate</strong>, scattate in orizzontale, con la stanza più bella come prima immagine.</li>
  <li><strong>Stanze arredate.</strong> Una casa vuota sembra più piccola e più fredda; con l'<strong>home staging virtuale</strong> chi guarda capisce subito come vivrebbe quella casa. È buona regola indicare nell'annuncio che l'arredamento è virtuale.</li>
  <li><strong>Un video</strong>, anche breve: su social e portali trattiene l'attenzione molto più di una foto.</li>
  <li><strong>Un testo completo</strong>: metri quadri, piano, esposizione, spese, classe energetica, cosa c'è vicino. La <strong>classe energetica (APE)</strong> va sempre indicata negli annunci di vendita e affitto.</li>
  <li><strong>Il prezzo giusto dal primo giorno.</strong> Un immobile sopravvalutato resta online, "invecchia" e finisce per vendersi peggio.</li>
</ul>`,
  },
  {
    id: 'strumenti',
    title: 'Gli strumenti digitali di un agente immobiliare oggi',
    html: `<p>Il lavoro in strada resta il cuore del mestiere, ma gli strumenti digitali decidono quanto tempo ti resta per farlo. Quelli che un agente immobiliare usa più spesso:</p>
<ul>
  <li><strong>Portali immobiliari</strong>, per raggiungere chi cerca casa.</li>
  <li><strong>Un gestionale</strong>, per immobili, clienti, appuntamenti e richiami.</li>
  <li><strong>Un sito personale</strong>, per farti trovare e scegliere come agente, non solo come annuncio.</li>
  <li><strong>Strumenti per foto e video</strong>, per presentare ogni immobile al meglio senza pagare ogni volta un fotografo, un home stager o un videomaker.</li>
  <li><strong>Social network</strong>, per restare presente nella tua zona.</li>
</ul>
<p><strong>Agente Immo</strong> nasce per l'ultimo pezzo di questa lista: foto arredate con l'AI, video per i social e il tuo sito già pronto, per ogni immobile che acquisisci. Lo provi gratis, senza carta.</p>`,
  },
];

const FAQ: Guide['faq'] = [
  ['Serve la laurea per fare l\'agente immobiliare?', 'No. Serve il diploma di scuola secondaria di secondo grado, poi il corso di formazione riconosciuto dalla Regione e l\'esame di abilitazione alla Camera di Commercio.'],
  ['Quanto dura il corso per agente immobiliare?', 'Dipende dalla Regione, che stabilisce durata e programma dei corsi abilitanti. Controlla l\'elenco dei corsi autorizzati nella tua Regione.'],
  ['Si può fare l\'agente immobiliare senza un\'agenzia?', 'Sì. Dopo l\'abilitazione puoi aprire una ditta individuale e lavorare in proprio, oppure collaborare con un\'agenzia esistente.'],
  ['Qual è la provvigione di un agente immobiliare?', 'È libera e si concorda nell\'incarico. Nella pratica si vedono spesso valori tra il 2% e il 4% più IVA per ciascuna parte, ma dipende dalla zona e dall\'accordo.'],
  ['Quando si paga l\'agente immobiliare?', 'La provvigione matura quando l\'affare è concluso grazie al suo intervento, di solito con l\'accettazione della proposta o la firma del preliminare, salvo accordi diversi.'],
  ['Come trova clienti un agente immobiliare?', 'Presidiando una zona, restando visibile con costanza sui social, presentandosi ai proprietari con materiale concreto (foto, video, sito) e coltivando una rete di contatti che segnala chi vuole vendere.'],
];

export const agenteImmobiliare: Guide = {
  slug: 'agente-immobiliare',
  label: 'Agente immobiliare',
  title: 'Agente immobiliare: cosa fa, come diventarlo, quanto guadagna (guida 2026)',
  description: 'Guida completa all\'agente immobiliare: cosa fa, requisiti, corso ed esame per diventarlo, provvigioni e guadagni, e come trovare più incarichi e vendere prima.',
  h1: 'Agente immobiliare: cosa fa, come diventarlo, quanto guadagna e come trovare incarichi',
  intro: 'Tutto quello che serve sapere sul mestiere di agente immobiliare in Italia: il lavoro di tutti i giorni, requisiti ed esame, provvigioni, e cosa fa davvero la differenza per acquisire più incarichi e vendere prima.',
  updated: '2026-09-27',
  sections: SECTIONS,
  faq: FAQ,
};

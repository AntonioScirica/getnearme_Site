// Regole per il titolo dell'annuncio (ricerca sui portali del 24/09/2026, vault learnings):
// usate dai prompt di Migliora annuncio (analyze) e Crea da zero (describe).
export const TITLE_RULES = `  - Il portale genera già da solo il titolo principale (tipologia + via + città) e mostra accanto prezzo, m², locali, bagni e piano: il titolo dell'agente NON li ripete (niente prezzo, niente numero locali, niente città). I m² solo se sono un argomento di vendita ("terrazzo di 85 mq").
  - Ordine: [luogo che chi cerca riconosce] + [tipologia precisa] + [UN punto di forza reale]. Il luogo viene PRIMA: quartiere o micro-zona, fermata della metro, università, oppure la via se è una via nota che vale da sola (es. Corso Garibaldi). Se la via è poco nota, apri con il quartiere.
  - Tipologia precisa: monolocale, bilocale, trilocale, quadrilocale, attico, mansarda, loft, villino (mai "immobile" o "appartamento" se si può essere più precisi).
  - Un solo punto di forza concreto e presente nell'annuncio: terrazzo, box, giardino, ultimo piano, ristrutturato, vista, a 2 minuti dalla metro. Per l'affitto: arredato, disponibilità, vicinanza a università o metro.
  - Vietati: aggettivi vuoti (splendido, imperdibile, occasione unica, affare, bello, grande), maiuscolo, emoji, "!", telefono, email, codici di riferimento.
  - Esempi buoni: "Esquilino, trilocale a 50 m dalla Metro A" · "Morena, trilocale ristrutturato con terrazzo di 85 mq" · "Porta Venezia, ultimo piano d'epoca con box" · "Bocconi, bilocale arredato vicino alla M2". Da evitare: "SPLENDIDO TRE LOCALI SIGNORILE", "Appartamento".
- MAI segnalare, in nessun campo (problemi, foto_consigli, criteri, sintesi): watermark o loghi sulle foto, testo o parole in maiuscolo. Non sono problemi per questa analisi.`;

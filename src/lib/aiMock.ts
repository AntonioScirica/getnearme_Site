// Modalita' finta (NEXT_PUBLIC_AI_MOCK=1): nessuna chiamata AI a pagamento.
// Risposte d'esempio con la stessa forma di quelle vere, per lavorare sulla UI.
export const AI_MOCK = process.env.NEXT_PUBLIC_AI_MOCK === '1';

export const mockDelay = (ms = 3000) => new Promise(r => setTimeout(r, ms));

const MOCKS: Record<string, unknown> = {
  analyze: {
    score: 58,
    sintesi: "[DATI FINTI] Annuncio con buone informazioni su zona e dotazioni, penalizzato da foto poco rappresentative, testo con maiuscole e refusi e contatti diretti nella descrizione.",
    punti_forza: [
      'Composizione degli ambienti descritta stanza per stanza',
      'Dotazioni concrete: parquet, infissi triplo vetro, aria condizionata, box',
      'Servizi condominiali distintivi: portineria, piscina, palestra',
    ],
    problemi: [
      {
        area: 'foto', gravita: 'alta', foto_indice: 1, modifica_foto: '',
        problema: "La prima foto mostra l'androne condominiale, non l'appartamento.",
        perche: 'La prima foto decide se l\'annuncio viene aperto: un androne non fa capire cosa si compra.',
        soluzione: 'Sposta al primo posto la foto del salone con cucina a vista e metti l\'androne in fondo alla galleria.',
      },
      {
        area: 'foto', gravita: 'alta', foto_indice: 2, modifica_foto: 'Rimuovi la scritta rossa al centro della foto ricostruendo pavimento e pareti, aumenta leggermente la luminosità',
        problema: 'Watermark rosso enorme al centro della foto 2 che copre il soggetto.',
        perche: 'Nasconde proprio la stanza e abbassa la percezione di professionalità.',
        soluzione: 'Carica la foto senza watermark o con il logo piccolo in un angolo.',
      },
      {
        area: 'foto', gravita: 'media', foto_indice: 3, modifica_foto: 'Raddrizza le linee verticali e bilancia il bianco, mantieni invariati mobili e pareti',
        problema: 'La foto 3 è storta e ha una dominante gialla.',
        perche: 'Le foto storte e gialle fanno sembrare gli ambienti più vecchi e piccoli.',
        soluzione: 'Sostituiscila con la versione corretta (usa "Sistema con AI") prima di ricaricarla sul portale.',
      },
      {
        area: 'descrizione', gravita: 'media', foto_indice: 0, modifica_foto: '',
        problema: 'Molte parole in MAIUSCOLO: "PALESTRA", "PISCINA", "ARREDATO", "LIBERA SUBITO".',
        perche: 'Il maiuscolo online si legge come urlato e sembra poco professionale.',
        soluzione: 'Riscrivi quelle parole in minuscolo, oppure incolla la descrizione riscritta qui sopra.',
      },
      {
        area: 'descrizione', gravita: 'media', foto_indice: 0, modifica_foto: '',
        problema: 'Nel testo c\'è il telefono dell\'agenzia: "TEL. 02/36586417".',
        perche: 'I portali penalizzano i contatti nel testo e perdi il tracciamento delle richieste.',
        soluzione: 'Elimina la riga del telefono: il portale mostra già i tuoi contatti nel box agenzia.',
      },
      {
        area: 'dati', gravita: 'media', foto_indice: 0, modifica_foto: '',
        problema: 'Mancano le spese condominiali, con piscina e palestra sono una domanda certa.',
        perche: 'Chi vede servizi costosi vuole sapere subito quanto paga al mese.',
        soluzione: 'Compila il campo "Spese condominiali" nella scheda dell\'annuncio sul portale.',
      },
    ],
    dati_mancanti: ['Spese condominiali', 'Classe energetica', 'Riscaldamento', 'Anno di costruzione'],
    foto_consigli: [
      'Metti come prima foto il soggiorno, scattato dall\'angolo per dare profondità.',
      'Aggiungi foto di piscina e palestra condominiale: sono il vero punto di forza.',
      'Togli il watermark centrale o riducilo a un logo piccolo in un angolo.',
    ],
    titolo: '[FINTO] Trilocale arredato con box e piscina condominiale, zona Bocconi',
    descrizione: `[DESCRIZIONE FINTA DI ESEMPIO]
In zona Bocconi, a pochi minuti dalla metropolitana e dal centro, proponiamo in vendita un trilocale arredato di 95 mq al primo piano di uno stabile signorile con portineria.

L'immobile si compone di:
- ingresso su salone con cucina a vista
- camera matrimoniale
- seconda camera con angolo studio
- bagno padronale con doccia

Finiture e dotazioni:
- parquet in tutti gli ambienti
- infissi con triplo vetro e tapparelle elettriche
- aria condizionata e impianto di allarme
- box singolo di proprietà

Lo stabile offre servizi poco comuni in zona: piscina, palestra e lavanderia condominiale. La zona è ben servita da negozi, scuole e mezzi pubblici.

Libero subito. Per ricevere la planimetria o fissare una visita contatta la nostra agenzia.`,
  },
  describe: {
    titolo: '[FINTO] Trilocale ristrutturato con balcone, vicino alla metro',
    descrizione: `[DESCRIZIONE FINTA DI ESEMPIO]
Vi presentiamo un trilocale ristrutturato in ottimo stato, in zona ben servita a pochi passi dalla metropolitana.

L'immobile si compone di:
- soggiorno luminoso
- cucina abitabile
- due camere da letto
- bagno finestrato

Completano la proprietà un balcone e una cantina. Libero al rogito.

Per informazioni o per fissare una visita contatta la nostra agenzia.`,
    score: 64,
    suggerimenti: [
      '[FINTO] Aggiungi la classe energetica e le spese condominiali.',
      '[FINTO] Carica almeno 12 foto, tutte le stanze comprese.',
    ],
  },
};

export function mockFor<T>(kind: string): T {
  return structuredClone(MOCKS[kind] ?? {}) as T;
}

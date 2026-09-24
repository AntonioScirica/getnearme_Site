// Modalita' finta (NEXT_PUBLIC_AI_MOCK=1): nessuna chiamata AI a pagamento.
// Risposte d'esempio con la stessa forma di quelle vere, per lavorare sulla UI.
export const AI_MOCK = process.env.NEXT_PUBLIC_AI_MOCK === '1';

export const mockDelay = (ms = 3000) => new Promise(r => setTimeout(r, ms));

const MOCKS: Record<string, unknown> = {
  analyze: {
    criteri: {
      foto: { punti: 14, punti_dopo: 27, nota: 'Prima foto sull\'androne, foto 3 storta e gialla.', limite: 'Mancano foto di bagno e camere: vanno scattate, l\'AI non le crea.' },
      dati: { punti: 16, punti_dopo: 22, nota: 'Mancano spese condominiali, classe energetica, riscaldamento e anno.', limite: 'Anno di costruzione e spese esatte vanno chiesti all\'amministratore.' },
      descrizione: { punti: 11, punti_dopo: 18, nota: 'Contenuti buoni ma con refusi e il telefono nel testo.', limite: 'Senza planimetria e misure delle stanze la descrizione resta generica.' },
      coerenza: { punti: 12, punti_dopo: 15, nota: 'Dati coerenti, penalizzati dai contatti diretti nella descrizione.', limite: '' },
      titolo: { punti: 5, punti_dopo: 9, nota: 'Manca il punto di forza (piscina, box) e la zona.', limite: 'Con 70 caratteri non entrano sia piscina sia box: uno dei due resta fuori.' },
    },
    sintesi: "[DATI FINTI] Annuncio con buone informazioni su zona e dotazioni, penalizzato da foto poco rappresentative, refusi e contatti diretti nella descrizione.",
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
        area: 'foto', gravita: 'media', foto_indice: 3, modifica_foto: 'Raddrizza le linee verticali e bilancia il bianco, mantieni invariati mobili e pareti',
        problema: 'La foto 3 è storta e ha una dominante gialla.',
        perche: 'Le foto storte e gialle fanno sembrare gli ambienti più vecchi e piccoli.',
        soluzione: 'Sostituiscila con la versione corretta (usa "Sistema con AI") prima di ricaricarla sul portale.',
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
      'Raddrizza le verticali: con foto storte gli ambienti sembrano più piccoli.',
    ],
    titolo: '[FINTO] Trilocale arredato con box e piscina condominiale, zona Bocconi',
    descrizione: `[DESCRIZIONE FINTA DI ESEMPIO]
In zona Bocconi, a pochi minuti dalla metropolitana e dal centro, proponiamo in vendita un trilocale arredato di 95 mq al primo piano di uno stabile signorile con portineria.

L'immobile si compone di un ampio salone con cucina a vista, una camera matrimoniale, una seconda camera con angolo studio e un bagno padronale con doccia. Gli ambienti sono luminosi e in ottimo stato.

Finiture e dotazioni:
- parquet in tutti gli ambienti
- infissi con triplo vetro
- tapparelle elettriche
- aria condizionata
- impianto di allarme
- box singolo di proprietà

Lo stabile offre servizi poco comuni in zona, tra cui piscina, palestra e lavanderia condominiale, e la zona è ben servita da negozi, scuole e mezzi pubblici.

Libero subito. Per ricevere la planimetria o fissare una visita contatta la nostra agenzia.`,
  },
  describe: {
    titolo: '[FINTO] Trilocale ristrutturato con balcone, vicino alla metro',
    descrizione: `[DESCRIZIONE FINTA DI ESEMPIO]
Vi presentiamo un trilocale ristrutturato in ottimo stato, in zona ben servita a pochi passi dalla metropolitana.

L'immobile si compone di un soggiorno luminoso, una cucina abitabile, due camere da letto e un bagno finestrato. Completano la proprietà un balcone e una cantina.

Libero al rogito. Per informazioni o per fissare una visita contatta la nostra agenzia.`,
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

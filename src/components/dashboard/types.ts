export type Project = {
  id: string;
  nome: string;
  addr: string;
  prezzo: number;
  mq: number;
  bagni?: number;
  camere?: number;
  locali?: number;
  titolo: string;
  descrizione?: string;
  cover: string;
  thumb?: string; // versione ~100px per avatar/lista (cover = ~500px orizzontale)
  riferimento?: string; // codice annuncio agenzia (dedup import)
  tipologia?: string;   // es. appartamento, villa, attico
  import_data?: Record<string, unknown>; // tutte le colonne grezze dell'import
  createdAt?: string;
  icons?: Record<string, string>;
  nFoto?: number;
  nStaging?: number;
  nVideo?: number;
  nPost?: number;
};

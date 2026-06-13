export type Project = {
  id: string;
  nome: string;
  addr: string;
  prezzo: number;
  mq: number;
  bagni: number;
  camere: number;
  titolo: string;
  cover: string;
  icons?: Record<string, string>;
  nFoto?: number;
  nStaging?: number;
  nVideo?: number;
  nPost?: number;
};

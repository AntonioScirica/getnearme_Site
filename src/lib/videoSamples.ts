// Video d'esempio dei template (landing, prova gratis e chat della piattaforma): un solo elenco per tutti.
// Popup: reel del salotto (verticale, con badge e firma GetNearMe: nelle card 16:9 si vede solo il centro).
// Stop-motion: demo in public/staging/videos. Gli altri: clip dei reel di GetNearMe senza scritte.
const R2 = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili';
const REELS = 'https://ecrnpyksnfyykqwnutwa.supabase.co/storage/v1/object/public/content';
export const VIDEO_SAMPLES = {
  popup: '/staging/videos/prima-dopo.mp4', // reel del salotto ritagliato: senza la scritta STOP MOTION e il marchio GetNearMe (30/09)
  gravity: `${R2}/F9_gravity.mp4`,
  particles: `${REELS}/social-frames/90917b29-e0ff-425b-b3f0-45fa303c6f9d/reveal.mp4`,
  stopmotion: '/staging/videos/stopmotion_room_v2.mp4',
  cantiere: `${REELS}/social-frames/bbe5b3fa-e484-4f34-8c55-341f02907f19/base.mp4`,
  daynight: `${REELS}/social-frames/b4938420-a308-413b-853f-0ea38719dd5e/daynight.mp4`,
  camera: '/staging/videos/camera-v2.mp4', // prova del 29/09 (Kling 1.6, la passeggiata di GetNearMe)
  fpv: '/staging/videos/volo-cantiere.mp4', // prova del 30/09: volo nel cantiere, flip, il palazzo si svela finito
  walk: '/staging/videos/cambia-stile.mp4', // prova del 04/10, tutta AI: l'agente gira il soggiorno e la tendina mostra l'arredo in stile nordico
  agent: '/staging/videos/agente-v3.mp4', // prova del 29/09: l'agente parla, esce e la stanza si arreda
  ristruttura: '/staging/videos/ristrutturazione.mp4', // prova del 05/10, tutta AI: soggiorno in cantiere, finito vuoto, poi arredato (Kling o3, 2 clip)
  // 05/10, anteprime per le card 16:9 (composizioni CardAnnuncio e CardVenduto in remotion/): il video Vivace vero
  // dentro una cornice da telefono, video interi (annuncio 3 foto 15 s, venduto 8 s), il loop riparte dopo la chiusura
  reel: '/staging/videos/annuncio.mp4',
  venduto: '/staging/videos/venduto.mp4',
} as const;
// primo fotogramma da mostrare mentre il video si carica
export const VIDEO_POSTERS: Partial<Record<string, string>> = { [VIDEO_SAMPLES.reel]: '/staging/videos/annuncio.webp', [VIDEO_SAMPLES.venduto]: '/staging/videos/venduto.webp' };

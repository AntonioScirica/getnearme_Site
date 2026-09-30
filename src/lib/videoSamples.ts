// Video d'esempio dei template (landing, prova gratis e chat della piattaforma): un solo elenco per tutti.
// Popup: reel del salotto (verticale, con badge e firma GetNearMe: nelle card 16:9 si vede solo il centro).
// Stop-motion: demo in public/staging/videos. Gli altri: clip dei reel di GetNearMe senza scritte.
const R2 = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/stili';
const REELS = 'https://ecrnpyksnfyykqwnutwa.supabase.co/storage/v1/object/public/content';
export const VIDEO_SAMPLES = {
  popup: `${REELS}/social-videos/2026-07-09_stopmotion_story.mp4`,
  gravity: `${R2}/F9_gravity.mp4`,
  particles: `${REELS}/social-frames/90917b29-e0ff-425b-b3f0-45fa303c6f9d/reveal.mp4`,
  stopmotion: '/staging/videos/stopmotion_room_v2.mp4',
  cantiere: `${REELS}/social-frames/bbe5b3fa-e484-4f34-8c55-341f02907f19/base.mp4`,
  daynight: `${REELS}/social-frames/b4938420-a308-413b-853f-0ea38719dd5e/daynight.mp4`,
  camera: '/staging/videos/camera.mp4', // prova del 29/09 (Kling 1.6, la passeggiata di GetNearMe)
  fpv: '/staging/videos/volo-cantiere.mp4', // prova del 30/09: volo nel cantiere, flip, il palazzo si svela finito
  agent: '/staging/videos/agente.mp4', // prova del 29/09: l'agente parla, esce e la stanza si arreda
} as const;

// Prezzi di Agente Immo (euro al mese, forfettario: niente IVA). Usati da landing, FAQ e dati strutturati.
// Conti del 27/09/2026: foto ~0,07 EUR, video ~0,45 EUR; dopo Stripe (2,2% + 0,25), bollo 2 EUR e tasse (78% x (15% + 26,07%))
// restano ~38 EUR/mese (trimestrale) e ~32 EUR/mese (annuale) prima dei costi AI. Foto "illimitate" = uso ragionevole.
// Crediti (come Higgsfield: numeri grandi, ogni azione al suo costo vero). 1 credito ~ 0,013 EUR di costo nostro.
// Costi 27/09: foto con Nano Banana 2 ~0,065 EUR, modifica con la Lite ~0,033 EUR, video Veo 4 s ~0,21 EUR.
// Starter 29 EUR mensile (sotto 77,47: niente bollo), 200 foto: netto 18,8, costo max 13 -> margine min ~5,8 EUR.
// Pro 59 annuale / 69 trimestrale, 500 foto: netto 38,6 / 44,6, costo max 32,5 -> margine min ~6 / ~12 EUR.
// Video: crediti in proporzione al costo (28/09/2026, incasso al credito peggiore 0,0236 € col Pro annuale, margine ~45%):
// Popup / Dall'alto (Veo, ~0,34 $) e Stop-motion / Particelle / Giorno-notte (Nano Banana + Kling, ~0,37 $) = 25;
// Cantiere (2 Nano Banana + 2 Kling, ~0,73 $) = 50.
// Modifiche (28/09/2026): con GPT Image 2.5 a qualita' bassa costano ~0,014 $; tetto giornaliero per utente in api/platform/photo-edit.
// modifica: le prime 3 su una foto sono gratis, dalla quarta 1 credito (modifica_extra), che e' il nostro costo (0,014 $).
// Video (28/09/2026): Prima e dopo con Veo 3.1 Fast ~0,83 $ tutto compreso -> 75 crediti (1 credito ~0,013 $ di costo);
// Cantiere (2 Kling o3 da 5 s + 2 GPT, ~0,87 $) 150; Giorno e notte (1 Kling da 5 s + 1 GPT, ~0,43 $) 50.
// Crediti per azione (28/09/2026, tre piani): foto 3 (costo 0,013 $), Prima e dopo 100 (Popup con Veo 0,83 $; Dall'alto con Kling 0,45 $), Giorno e notte 70 (0,43 $), Cantiere 200 (0,87 $).
// Starter 1000 crediti = 333 foto o 10 video; Plus 1500 = 500 foto o 15 video; Pro 2500 = 833 foto o 25 video.
// Video Prima e dopo (29/09): 1 credito quando si preparano Prima e Dopo (le foto GPT, pagate anche se poi si annulla),
// il resto (video_render = 99) quando si consegna il video: chi arriva in fondo paga sempre 100 (video).
export const CREDIT_COST = { luminoso: 0, modifica: 0, modifica_extra: 1, arreda: 3, svuota: 3, video: 100, video_prep: 1, video_render: 99, video_cantiere: 200, video_daynight: 40, video_camera: 30, video_agent: 40, video_walk: 150, video_fpv: 200, video_planwalk: 150, video_reel: 10, video_venduto: 5, video_drone: 40, video_stagioni: 40, riscrivi: 1 };
// Giro col drone (05/10): Kling 2.5 Turbo Pro da una foto, 5 s a 1080p (0,35 $, nessuna foto GPT); la Camminata usa Kling 1.6
// standard a 720p (0,28 $ -> 30): a parita' di margine (~107 crediti per $) 0,35 $ fa ~38 -> 40, come Giorno e notte.
// Stagioni (05/10): 1 GPT Image a qualita' bassa (la stagione scelta, ~0,014 $) + Kling 2.5 Turbo Pro primo/ultimo
// fotogramma 5 s (0,35 $) = ~0,37 $, la stessa ricetta e lo stesso costo di Giorno e notte -> 40.
// Video dell'annuncio e Video Venduto o Affittato (05/10): niente AI, solo montaggio FFmpeg (costo nostro ~0): 10 e 5,
// scalati solo a video pronto; correggere i testi dopo e' gratis (3 volte per video, vedi api/platform/video-reel).
// Dalla pianta alla stanza (02/10): 1 GPT (pianta 3D dall'alto, ~0,04 $) + Kling 2.5 Turbo 5 s (discesa, 0,35 $) + Kling 1.6 5 s (camminata, 0,28 $) -> 150.
// Volo nel cantiere (30/09): 1 GPT (quasi finito) + 2 Kling Turbo da 5 s (~0,72 $), intro fissa gia' pagata; prezzo come il Cantiere (scelta del 30/09) -> 200.
// Camminata che cambia stile (29/09, da provare): Kling o3 modifica video ~0,14 $/s, fino a 15 s = ~2,1 $ -> 150.
// Con te in video (29/09): Kling 2.5 Turbo 5 s (0,35 $) + Haiku e montaggio, la foto nello stile si paga a parte (3) -> 40.
// 29/09: Giorno e notte con Kling 2.5 Turbo Pro (0,35 $ + 1 GPT, ~0,37 $) -> 40; Movimento camera con Kling 1.6 standard (0,28 $) -> 30.
// Pacchetti di crediti extra (una tantum, non scadono col mese): per chi finisce i crediti prima del rinnovo.
// Prezzi Stripe con lookup key ai_pack_<crediti>; a credito costano un po' piu' dei piani (0,033 / 0,030 / 0,026 EUR), cosi' non li scavalcano.
// Pacchetti (02/10/2026): sempre piu' cari al credito dei piani (4 c contro 2,8-3,3), cosi' conviene abbonarsi.
// Stripe: ai_pack_300 12 €, ai_pack_600 24 €, ai_pack_1500 59 € (prodotto prod_VLTvE05gUHhG5I; i prezzi vecchi 10/15/39 disattivati)
export const PACKS = [{ id: 'pack300', credits: 300, eur: 12 }, { id: 'pack600', credits: 600, eur: 24 }, { id: 'pack1500', credits: 1500, eur: 59 }] as const;
export type PackId = (typeof PACKS)[number]['id'];
export const FREE_EDITS = 3;
// Tre piani (28/09/2026): Starter foto e video; Plus foto, video e sito; Pro come Plus con piu' crediti, a trimestre o anno.
// 30/09: Starter a 19 € con 600 crediti (piano d'ingresso; Stripe price_1ULLFbFzCo1FYIKToWZ64ZfW, lookup ai_starter_monthly)
export const PRICING = { starter: 19, starterCredits: 600, plus: 49, plusCredits: 1500, quarterly: 69, yearly: 59, credits: 2500 };
export const photosFor = (credits: number) => Math.floor(credits / CREDIT_COST.arreda);
export const videosFor = (credits: number) => Math.floor(credits / CREDIT_COST.video);

// Dicitura del forfettario sulle fatture Stripe: sul cliente gia' prima del pagamento, cosi' c'e' anche sulla prima fattura
export const FORFETTARIO_FOOTER = 'Operazione senza applicazione dell\'IVA ai sensi dell\'art. 1, commi 54-89, L. 190/2014 (regime forfettario). Imposta di bollo assolta sull\'originale per importi superiori a 77,47 euro.'

// Portale clienti Stripe di Agente Immo (30/09/2026): configurazione dedicata, quella di default e' di GetNearMe e non
// conosce questi prezzi. Cambio piano confermato sulla pagina di Stripe, disdetta a fine periodo, carta e fatture.
export const STRIPE_PORTAL_CONFIG = 'bpc_1ULUcQFzCo1FYIKTrUvtn1Pn';

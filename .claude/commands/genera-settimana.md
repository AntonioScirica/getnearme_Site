---
description: Genera una settimana completa di contenuti social (post + 5 video reel) per la settimana successiva
---

Genera una settimana completa di **contenuti social GetNearMe** in-scope (suite AI: staging/video/post/avatar/team — mai analisi/OMI/mappa/report):

- **Post**: ogni giorno 3 feed (rubrica del giorno + 2 vari) + 1 tip = 4 post/giorno.
- **Video** (5 reel/settimana, generati + renderizzati end-to-end, ~10-15 min):
  - Lun / Mer / Ven → **Slider prima/dopo** (3 varianti: vuoto→arredato, pieno→vuoto, vecchio→stile nuovo)
  - Mar → **Costruzione** (scavo→casa, Kling timelapse)
  - Sab → **Giorno→notte** (Kling)

Esegui:

```
cd /Users/antonioscirica/getnearme_Site && node scripts/gen-week-posts.mjs $ARGUMENTS
```

- Senza argomenti → settimana **successiva** all'ultima già nel calendario.
- `YYYY-MM-DD` (un lunedì) → quella settimana.
- `--replace` → sovrascrive i topic non-news di quella settimana.
- `--no-video` → solo post, salta i 5 video.

Pipeline video (automatica): l'edge `generate-social-video` genera i frame/clip AI (Flux/Kling) e li re-ospita su storage; i template headless bloccati (`slider-video.mjs`, `construction-video.mjs`, `daynight-video.mjs`) renderizzano l'MP4 finale brandizzato e settano `video_url`. La costruzione usa il pattern queue→finalize. Serve `BATCH_STAGING_CRON_SECRET` in env + Chrome e ffmpeg locali (se manca il secret, i video vengono saltati con avviso).

Dopo: verifica i topic sul calendario (`/api/social/data?view=calendar` con header `x-metrics-key`) e riporta riepilogo (giorni, post/giorno, 5 video con titoli, eventuali FAIL). Segnala errori.

Se l'utente vuole anche le immagini PNG dei post renderizzate sul calendario, dopo l'insert lancia il render reale per ogni data: `curl "http://localhost:3000/api/social/cron/generate-ped?date=<DATA>&sync=1&account=getnearme"` (serve il dev server attivo).

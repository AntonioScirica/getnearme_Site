# GNM render worker

Renders the branded social video reels **off the local machine** so the pipeline
runs unattended. One-shot: picks up every `proposed` video topic in the next 21
days, drives the edge (`generate-social-video`) to produce the AI frames/clips,
runs the locked headless templates (`slider/daynight/construction/reveal-video.mjs`)
to composite the final MP4, uploads it, sets `video_url`, marks the topic
`approved`, then exits.

With this + the scheduled `monthly-plan` (creates the plan) + the `publish` crons
(post to IG/TikTok), the whole thing is automatic.

## Pipeline fit

```
monthly-plan (cron, biweekly)  →  creates video topics (status=proposed)
        │
        ▼
render-worker (VM cron, every ~10 min)  →  edge Flux/Kling + headless render
        │                                   → video_url set, status=approved
        ▼
publish / publish-ped (cron)   →  posts the reel to IG/TikTok
```

## Build

From the **repo root** (`getnearme_Site/`):

```bash
docker build -f worker/Dockerfile -t gnm-render-worker .
```

## Env (`.env` — see `.env.example`)

| Var | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key (write access) |
| `BATCH_STAGING_CRON_SECRET` | same secret as the edge (`8682…`) |
| `CHROME_PATH` | default `/usr/bin/chromium` (set in image) |
| `MAX_PER_RUN` | max topics per run (default 8) |

## Run (one-shot)

```bash
docker run --rm --env-file .env gnm-render-worker
```

## Schedule on a small VM

Cheapest reliable option: a tiny always-on VM (Hetzner CX22 ~€5/mo, DigitalOcean
~$6, Fly.io). Install Docker, then add a host crontab entry:

```cron
# every 10 minutes, render any pending video reels
*/10 * * * * cd /opt/gnm && /usr/bin/docker run --rm --env-file /opt/gnm/.env gnm-render-worker >> /var/log/gnm-render.log 2>&1
```

Sequential by design — concurrent Kling starts are unreliable, so the worker
processes topics one at a time (a full reel takes ~3-5 min incl. Kling).

## Notes

- Idempotent: only touches `status=proposed` topics; sets them `approved` when
  done, so re-runs skip finished ones.
- Render is identical to the local command (same `*-video.mjs` modules) — the
  template IS the video, so output never drifts.
- ~7 reels/week, ~1 h compute/month → a €5/mo VM is plenty.

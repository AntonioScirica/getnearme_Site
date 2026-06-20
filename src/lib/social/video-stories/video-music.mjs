// ─────────────────────────────────────────────────────────────────────────
//  Background music for the social reels. Picks a RANDOM track from the R2
//  `music/` library (getnearme bucket) and muxes it under the rendered video:
//  looped to the video length, low background volume, gentle fade-out.
//
//  Env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY.
//       R2_MUSIC_BUCKET (default 'getnearme'), R2_MUSIC_PREFIX (default 'music/').
//  If R2 isn't configured or has no tracks, muxMusic returns the silent video
//  unchanged (non-blocking).
// ─────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const BUCKET = process.env.R2_MUSIC_BUCKET || 'getnearme';
const PREFIX = process.env.R2_MUSIC_PREFIX || 'music/';

let _client = null;
let _keysCache = null;

async function client() {
  if (_client) return _client;
  const acc = process.env.R2_ACCOUNT_ID;
  if (!acc || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) return null;
  const { S3Client } = await import('@aws-sdk/client-s3');
  _client = new S3Client({
    region: 'auto',
    endpoint: `https://${acc}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
  });
  return _client;
}

async function listTracks() {
  if (_keysCache) return _keysCache;
  const c = await client();
  if (!c) return [];
  const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
  const keys = [];
  let token;
  do {
    const r = await c.send(new ListObjectsV2Command({ Bucket: BUCKET, Prefix: PREFIX, ContinuationToken: token, MaxKeys: 1000 }));
    for (const o of r.Contents || []) if (/\.(mp3|m4a|aac|wav)$/i.test(o.Key)) keys.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  _keysCache = keys;
  return keys;
}

async function probeDuration(path, ffprobe = 'ffprobe') {
  try {
    const { stdout } = await exec(ffprobe, ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', path]);
    return parseFloat(stdout.trim()) || 0;
  } catch { return 0; }
}

/**
 * Mux a random R2 track under the video. Returns a NEW mp4 path with audio, or
 * the original path unchanged if no music is available.
 * @param {string} videoPath  the silent rendered mp4
 * @param {object} [o]
 * @param {string} [o.ffmpeg]  ffmpeg binary
 * @param {number} [o.volume]  background volume 0..1 (default 0.18)
 */
export async function muxMusic(videoPath, { ffmpeg = 'ffmpeg', volume = 0.18 } = {}) {
  let keys;
  try { keys = await listTracks(); } catch { keys = []; }
  if (!keys.length) return videoPath; // no R2 / no tracks → stay silent

  const key = keys[Math.floor(Math.random() * keys.length)];
  const c = await client();
  const { GetObjectCommand } = await import('@aws-sdk/client-s3');
  const obj = await c.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const buf = Buffer.from(await obj.Body.transformToByteArray());
  const musicPath = `/tmp/mus_${Date.now()}_${Math.floor(Math.random() * 1e6)}.mp3`;
  await fs.writeFile(musicPath, buf);

  const dur = await probeDuration(videoPath);
  const fadeStart = Math.max(0, dur - 1.4);
  const out = videoPath.replace(/\.mp4$/i, '_m.mp4');
  // Loop the track to the video length, lower the volume, fade out at the end,
  // copy the video stream untouched, encode AAC, trim to the video (-shortest).
  await exec(ffmpeg, [
    '-y', '-i', videoPath, '-stream_loop', '-1', '-i', musicPath,
    '-filter_complex', `[1:a]volume=${volume},afade=t=out:st=${fadeStart.toFixed(2)}:d=1.4[a]`,
    '-map', '0:v', '-map', '[a]', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
    '-shortest', '-movflags', '+faststart', out,
  ]);
  await fs.rm(musicPath, { force: true });
  return out;
}

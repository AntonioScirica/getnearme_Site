// Generate N consecutive weeks of content in one shot (posts + 7 videos/week).
// Just runs gen-week-posts.mjs back-to-back; each run auto-picks the week after
// the latest one in the calendar, so they chain into consecutive weeks.
//
// Usage:
//   node scripts/gen-weeks.mjs              # 2 weeks after the latest existing week
//   node scripts/gen-weeks.mjs 3            # 3 weeks
//   node scripts/gen-weeks.mjs 2 2026-07-06 # 2 weeks starting this Monday
//   node scripts/gen-weeks.mjs 2 --no-video # 2 weeks, posts only

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const n = parseInt(args.find((a) => /^\d+$/.test(a)) || '2', 10);
const startArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const passthrough = args.filter((a) => a.startsWith('--')); // e.g. --no-video, --replace

console.log(`\n>>> Genero ${n} settimane di contenuti${startArg ? ` da ${startArg}` : ' (dopo l\'ultima nel calendario)'}\n`);

for (let i = 0; i < n; i++) {
  // First week uses the explicit Monday if given; the rest auto-chain.
  const weekArgs = i === 0 && startArg ? [startArg, ...passthrough] : [...passthrough];
  console.log(`\n========== SETTIMANA ${i + 1}/${n} ==========`);
  try {
    execFileSync('node', [path.join(__dirname, 'gen-week-posts.mjs'), ...weekArgs], { stdio: 'inherit' });
  } catch (e) {
    console.error(`Settimana ${i + 1} interrotta: ${e.message}`);
    process.exit(1);
  }
}

console.log(`\n>>> FATTO. ${n} settimane generate.\n`);

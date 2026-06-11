// E2E test for the PED pipeline (local).
// Usage: node scripts/test-ped-pipeline.mjs generate [date]
//        node scripts/test-ped-pipeline.mjs publish-dry <slot> [date]
//        node scripts/test-ped-pipeline.mjs cleanup [date]
import { readFileSync } from 'fs';

// Load .env.local
for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const [, , cmd, ...args] = process.argv;

function shimRes() {
  return {
    statusCode: 200,
    body: null,
    status(c) { this.statusCode = c; return this; },
    json(b) { this.body = b; console.log(`HTTP ${this.statusCode}`, JSON.stringify(b, null, 2)); return this; },
    setHeader() { return this; },
  };
}

const secret = process.env.CRON_SECRET;

if (cmd === 'generate') {
  const date = args[0] || '2026-06-15';
  const { default: handler } = await import('../src/lib/social/cron/generate-ped.js');
  await handler({ query: { secret, sync: '1', date, verbose: '1' }, headers: {} }, shimRes());
} else if (cmd === 'publish-dry') {
  const slot = args[0] || '0900';
  const date = args[1] || '2026-06-15';
  const { default: handler } = await import('../src/lib/social/cron/publish-ped.js');
  await handler({ query: { secret, sync: '1', dry: '1', slot, date }, headers: {} }, shimRes());
} else if (cmd === 'publish-story-dry') {
  const slot = args[0] || '0900';
  const date = args[1] || '2026-06-15';
  const { default: handler } = await import('../src/lib/social/cron/publish-ped.js');
  await handler({ query: { secret, sync: '1', dry: '1', story: '1', slot, date }, headers: {} }, shimRes());
} else if (cmd === 'cleanup') {
  const date = args[0] || '2026-06-15';
  const { default: supabase } = await import('../src/lib/social/supabase.js');
  // Delete generated_content + reset topic statuses for the date
  const { data: rows } = await supabase
    .from('generated_content').select('id, topic_id').eq('publish_date', date).eq('type', 'ped');
  for (const r of rows || []) {
    await supabase.from('generated_content').delete().eq('id', r.id);
    await supabase.from('content_topics').update({ status: 'proposed' }).eq('id', r.topic_id);
  }
  // Remove storage files
  const { data: topicDirs } = await supabase.storage.from('content').list(`ped/${date}`);
  for (const dir of topicDirs || []) {
    const { data: files } = await supabase.storage.from('content').list(`ped/${date}/${dir.name}`);
    if (files?.length) {
      await supabase.storage.from('content').remove(files.map((f) => `ped/${date}/${dir.name}/${f.name}`));
    }
  }
  console.log(`Cleaned ${rows?.length || 0} generated rows for ${date}`);
} else {
  console.log('Commands: generate [date] | publish-dry <slot> [date] | publish-story-dry <slot> [date] | cleanup [date]');
}

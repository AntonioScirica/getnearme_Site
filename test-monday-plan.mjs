import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { generateMonthlyPlan } from './src/lib/social/ai/monthly-planner.js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const accountId = 'getnearme';

// Step 1: Clear generated_content first (FK → content_topics), then content_topics
console.log('Clearing generated_content...');
const { error: genErr, count: genCount } = await supabase
  .from('generated_content')
  .delete({ count: 'exact' })
  .eq('account_id', accountId)
  .gte('created_at', '2020-01-01');
console.log(`Deleted ${genCount} generated_content. Error: ${genErr?.message || 'none'}`);

console.log('Clearing content_topics...');
const { error: delErr, count } = await supabase
  .from('content_topics')
  .delete({ count: 'exact' })
  .eq('account_id', accountId)
  .gte('plan_date', '2020-01-01');
console.log(`Deleted ${count} topics. Error: ${delErr?.message || 'none'}`);

// Step 2: Generate plan for Monday June 23 only
console.log('\nGenerating plan for Monday 2026-06-23...');
const topics = await generateMonthlyPlan(2026, 6, [], [], {
  startDate: '2026-06-23',
  endDate: '2026-06-23',
});

console.log(`\nGenerated ${topics.length} topics:\n`);
for (const t of topics) {
  console.log(`[${t.category}] ${t.rubric} — ${t.title}`);
  if (t.summary) console.log(`  ${t.summary}`);
  if (t.hook) console.log(`  Hook: ${t.hook}`);
  console.log('');
}

// Step 3: Save to DB
const inserts = topics.map(t => ({
  plan_date: t.date,
  rubric: t.rubric,
  category: t.category,
  title: t.title,
  summary: t.summary,
  status: 'approved',
  template: t.template,
  edition: null,
  account_id: accountId,
  slide_data: t.slide_data || {
    ...(t.use_case ? { use_case: t.use_case } : {}),
    ...(t.video_type ? { video_type: t.video_type, hook: t.hook } : {}),
  },
}));

const { error: insErr } = await supabase.from('content_topics').insert(inserts);
if (insErr) {
  console.error('Insert error:', insErr.message);
} else {
  console.log(`Saved ${inserts.length} topics to DB.`);
}

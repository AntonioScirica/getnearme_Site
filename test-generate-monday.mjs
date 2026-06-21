import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Check what topics exist for Monday
const { data: topics } = await supabase
  .from('content_topics')
  .select('id, plan_date, rubric, category, template, title, status, slide_data')
  .eq('account_id', 'getnearme')
  .eq('plan_date', '2026-06-23')
  .order('created_at');

console.log(`Found ${topics?.length || 0} topics for 2026-06-23:\n`);
for (const t of (topics || [])) {
  console.log(`  [${t.category}] ${t.rubric} | template: ${t.template} | status: ${t.status}`);
  console.log(`    ${t.title}`);
  console.log(`    slide_data keys: ${Object.keys(t.slide_data || {}).join(', ')}`);
  console.log('');
}

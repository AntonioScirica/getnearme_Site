import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const user_id = 'a0574f29-144a-41de-a482-4e2beed40a46';

  // Upsert a logo
  await admin.from('user_brand').upsert(
    { user_id, logo_black_v: 'test_black_v_upsert' },
    { onConflict: 'user_id' }
  );

  // Fetch again
  const { data: user4 } = await admin.from('user_brand').select('*').eq('user_id', user_id).single();
  console.log('User after upsert black_v:', user4);
}
run();

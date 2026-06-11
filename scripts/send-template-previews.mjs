// Render one real topic per PED template and send slides + story to Telegram.
// Usage: node scripts/send-template-previews.mjs
import { readFileSync } from 'fs';

for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { default: supabase } = await import('../src/lib/social/supabase.js');
const { buildSlidesForTopic, buildStoryForTopic, PED_CSS, STORY_CSS } = await import('../src/lib/social/ped/templates.js');
const { renderPedSlides } = await import('../src/lib/social/ped/renderer.js');
const { sendMediaGroup, sendMessage } = await import('../src/lib/social/telegram.js');

const TEMPLATES = [
  'ped-carosello-dati',
  'ped-carosello-edu',
  'ped-carosello-feature',
  'ped-post-singolo',
  'ped-tip',
  'ped-carosello-referral',
];

await sendMessage('🎨 <b>Preview template PED</b> — 1 esempio per tipo, slide + story');

for (const template of TEMPLATES) {
  const { data: topics } = await supabase
    .from('content_topics')
    .select('*')
    .eq('template', template)
    .not('slide_data', 'is', null)
    .order('plan_date', { ascending: true })
    .limit(1);

  const topic = topics?.[0];
  if (!topic) {
    await sendMessage(`⚠️ Nessun topic per template <code>${template}</code>`);
    continue;
  }

  console.log(`Rendering ${template}: ${topic.title}`);

  try {
    const slides = buildSlidesForTopic(topic);
    const images = await renderPedSlides(slides, PED_CSS, { width: 1080, height: 1350 }, (m) => console.log(`  ${m}`));

    const storyHtml = buildStoryForTopic(topic);
    if (storyHtml) {
      const [storyImg] = await renderPedSlides([{ html: storyHtml, label: 'story' }], STORY_CSS, { width: 1080, height: 1920 }, (m) => console.log(`  ${m}`));
      images.push(storyImg);
    }

    // Telegram album max 10 items
    await sendMediaGroup(
      images.slice(0, 10),
      `<b>${template}</b>\n${topic.title}\n(ultima immagine = story teaser)`
    );
    console.log(`  sent ${images.length} images`);
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
    await sendMessage(`❌ Render fallito per <code>${template}</code>: ${err.message?.slice(0, 150)}`);
  }
}

console.log('Done');

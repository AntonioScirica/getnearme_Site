import supabase from '../supabase.js';
import { generateCarouselContent, generatePromptContent } from '../ai/writer.js';
import { renderCarousel } from '../carousel/renderer.js';
import { sendMediaGroup, sendMessage } from '../telegram.js';

export const config = { maxDuration: 300 }; // 5min for video rendering

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Async mode: respond immediately, self-invoke with ?sync=1
  // (also for type=video: cron-job.org kills at 30s and may retry → duplicate pipelines)
  if (!req.query.sync) {
    const qs = new URLSearchParams(req.query);
    qs.set('sync', '1');
    fetch(`https://${req.headers.host || 'getnearme.it'}/api/social/cron/generate?${qs}`).catch(() => {});
    return res.json({ ok: true, message: `generate triggered async (type=${req.query.type || 'carousel'})` });
  }

  // Video: not supported on GetNearMe (carousel/prompt only)
  if (req.query.type === 'video') {
    return res.json({ message: 'Video generation not available on this project' });
  }

  const accountId = req.query.account || 'getnearme';
  const today = new Date().toISOString().split('T')[0];

  // Always autopilot — pick all actionable statuses.
  // plan_date = today only: stray approved topics from past test runs must not regenerate.
  const { data: account } = await supabase.from('brand_accounts').select('*').eq('id', accountId).single();
  const validStatuses = ['approved', 'planned', 'proposed'];
  const { data: topics, error: topicError } = await supabase
    .from('content_topics')
    .select('*')
    .in('status', validStatuses)
    .eq('account_id', accountId)
    .eq('plan_date', today)
    .order('created_at', { ascending: false })
    .limit(10);

  // Auto-approve any planned/proposed topics
  if (topics?.length) {
    const toApprove = topics.filter(t => t.status !== 'approved').map(t => t.id);
    if (toApprove.length) {
      await supabase.from('content_topics')
        .update({ status: 'approved' })
        .in('id', toApprove);
      console.log(`Auto-approved ${toApprove.length} topics`);
    }
  }

  if (topicError) {
    return res.status(500).json({ error: topicError.message });
  }

  if (!topics?.length) {
    return res.json({ message: 'No approved topics', debug: { accountId, supabaseUrl: process.env.SUPABASE_URL?.slice(0, 30) } });
  }

  // Debug: log what we found
  await sendMessage(`🔧 Generate debug: found ${topics.length} topics\n${topics.map(t => `[${t.category}] ${t.title}`).join('\n')}`);

  const results = [];

  for (const topic of topics) {
    await supabase
      .from('content_topics')
      .update({ status: 'generating' })
      .eq('id', topic.id);

    try {
      if (topic.category === 'carousel') {
        // For news topics: map slide_data.top5 → news_digest format expected by writer.js
        let topicForGeneration = topic;
        if (topic.template === 'news' || topic.rubric === 'news') {
          const top5 = topic.slide_data?.top5 || [];
          if (!top5.length) {
            console.log(`Skipping news topic ${topic.id}: no top5 news (plan not run yet)`);
            await supabase.from('content_topics').update({ status: 'approved' }).eq('id', topic.id);
            results.push({ id: topic.id, type: 'carousel', skipped: 'no_news' });
            continue;
          }
          if (top5.length) {
            const newsDigest = top5.map(n => ({
              headline: n.headline,
              source: n.source || n.original_source,
              summary: n.summary,
              image_url: n.image_url || '',
              published_at: n.published_at || '',
            }));
            topicForGeneration = { ...topic, slide_data: { ...topic.slide_data, news_digest: newsDigest } };
          }
        }
        const content = await generateCarouselContent(topicForGeneration, topic.source_news);
        const images = await renderCarousel(content, topic.template, topic.rubric);

        const imageUrls = [];
        for (let i = 0; i < images.length; i++) {
          const path = `carousels/${topic.plan_date}/${topic.id}/slide_${i}.jpg`;
          const { error } = await supabase.storage
            .from('content')
            .upload(path, images[i], { contentType: 'image/jpeg', upsert: true });
          if (error) console.error(`Upload error slide ${i}:`, error.message);

          const { data: urlData } = supabase.storage.from('content').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }

        if (account?.notify_telegram) {
          await sendMediaGroup(
            images,
            `<b>${topic.rubric.toUpperCase()} - ${topic.title}</b>\n\n${content.caption?.slice(0, 800) || ''}`
          );
        }

        // Ensure rubric + edition are in content_data for publish slot matching
        const enrichedContent = {
          ...content,
          rubric: content.rubric || topic.rubric || topic.category,
          edition: content.edition || topic.edition || null,
        };

        await supabase
          .from('generated_content')
          .insert({
            topic_id: topic.id,
            post_id: `${topic.category}_${topic.id.slice(0, 8)}`,
            type: 'carousel',
            content_data: enrichedContent,
            image_urls: imageUrls,
            status: 'approved',
            publish_date: topic.plan_date,
            account_id: accountId,
          });

        await supabase
          .from('content_topics')
          .update({ status: 'generated', slide_data: enrichedContent })
          .eq('id', topic.id);

        results.push({ id: topic.id, type: 'carousel', slides: images.length });

      } else if (topic.category === 'prompt') {
        const content = await generatePromptContent(topic);
        const images = await renderCarousel(content, 'prompt', topic.rubric);

        const imageUrls = [];
        for (let i = 0; i < images.length; i++) {
          const path = `prompts/${topic.plan_date}/${topic.id}/slide_${i}.jpg`;
          const { error } = await supabase.storage
            .from('content')
            .upload(path, images[i], { contentType: 'image/jpeg', upsert: true });
          if (error) console.error(`Upload error slide ${i}:`, error.message);

          const { data: urlData } = supabase.storage.from('content').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }

        if (account?.notify_telegram) {
          await sendMediaGroup(
            images,
            `<b>PROMPT DEL GIORNO - ${topic.title}</b>\n\n${content.caption?.slice(0, 800) || ''}`
          );
        }

        const enrichedPromptContent = {
          ...content,
          rubric: content.rubric || 'prompt',
        };

        await supabase
          .from('generated_content')
          .insert({
            topic_id: topic.id,
            post_id: `prompt_${topic.id.slice(0, 8)}`,
            type: 'prompt',
            content_data: enrichedPromptContent,
            image_urls: imageUrls,
            status: 'approved',
            publish_date: topic.plan_date,
            account_id: accountId,
          });

        await supabase
          .from('content_topics')
          .update({ status: 'generated', slide_data: enrichedPromptContent })
          .eq('id', topic.id);

        results.push({ id: topic.id, type: 'prompt', slides: images.length });

      } else if (topic.category === 'video') {
        // Video: skip on Vercel (60s timeout too short for XTTS+Whisper+Lambda).
        // Video topics are generated by a separate cron endpoint.
        await supabase.from('content_topics')
          .update({ status: 'approved' }) // Keep approved for video-generate cron
          .eq('id', topic.id);
        continue; // Don't count as generated

        results.push({ id: topic.id, type: 'video' });
      }

    } catch (err) {
      console.error(`Generation failed for topic ${topic.id}:`, err.message);
      await supabase
        .from('content_topics')
        .update({ status: 'approved' })
        .eq('id', topic.id);

      if (account?.notify_telegram) {
        await sendMessage(`❌ <b>Generazione fallita</b>\n${topic.title}\n<code>${err.message?.slice(0, 200)}</code>`);
      }
    }
  }

  return res.json({ generated: results.length, results });
}

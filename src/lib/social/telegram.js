const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendMessage(text, options = {}) {
  const body = {
    chat_id: CHAT_ID,
    // Prefix: same bot+chat as ai-for-dumbs, messages must be distinguishable
    text: `🏠 <b>[GetNearMe]</b> ${text}`,
    parse_mode: 'HTML',
    ...options,
  };

  const res = await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json();
}

export async function deleteMessage(messageId) {
  const res = await fetch(`${API}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: CHAT_ID, message_id: messageId }),
  });
  return res.json();
}

export async function sendPhoto(photoBuffer, caption) {
  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);
  formData.append('photo', new Blob([photoBuffer], { type: 'image/png' }), 'slide.png');
  if (caption) {
    formData.append('caption', caption.slice(0, 1024));
    formData.append('parse_mode', 'HTML');
  }

  const res = await fetch(`${API}/sendPhoto`, {
    method: 'POST',
    body: formData,
  });

  return res.json();
}

export async function sendVideo(videoBuffer, caption) {
  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);
  formData.append('video', new Blob([videoBuffer], { type: 'video/mp4' }), 'reel.mp4');
  formData.append('supports_streaming', 'true');
  if (caption) {
    formData.append('caption', caption.slice(0, 1024));
    formData.append('parse_mode', 'HTML');
  }
  const res = await fetch(`${API}/sendVideo`, { method: 'POST', body: formData });
  return res.json();
}

export async function sendMediaGroup(photoBuffers, caption) {
  const formData = new FormData();
  formData.append('chat_id', CHAT_ID);

  const media = photoBuffers.map((_, i) => ({
    type: 'photo',
    media: `attach://photo_${i}`,
    ...(i === 0 && caption ? { caption: caption.slice(0, 1024), parse_mode: 'HTML' } : {}),
  }));

  formData.append('media', JSON.stringify(media));

  photoBuffers.forEach((buf, i) => {
    formData.append(`photo_${i}`, new Blob([buf], { type: 'image/png' }), `slide_${i}.png`);
  });

  const res = await fetch(`${API}/sendMediaGroup`, {
    method: 'POST',
    body: formData,
  });

  return res.json();
}

const RUBRIC_EMOJI = {
  news: '📰',
  education: '🎓',
  people: '👤',
  myths: '🔮',
  tools: '🛠',
  world: '🌍',
  question: '❓',
};

const CATEGORY_LABEL = {
  carousel: '📸 Carosello',
  video: '🎬 Video Reel',
};

export async function sendTopicProposals(topics, publishDate) {
  await sendMessage(
    `<b>📋 Proposte per ${publishDate}</b>\n\n` +
    `Ho preparato ${topics.length} contenuti. Approva o rifiuta ciascuno:`
  );

  for (let i = 0; i < topics.length; i++) {
    if (i > 0) await sendMessage('━━━━━━━━━━━━━━━━━━');
    const topic = topics[i];
    const emoji = RUBRIC_EMOJI[topic.rubric] || '📝';
    const catLabel = CATEGORY_LABEL[topic.category] || topic.category;

    let sourceInfo = '';
    if (topic.source_news) {
      const meta = topic.source_news.metadata || {};
      if (topic.source_news.source_type === 'twitter' && meta.author_name) {
        sourceInfo = `\n\n🐦 <b>${meta.author_name}</b> (@${meta.author_handle})`;
        if (meta.engagement) {
          sourceInfo += `\n❤️ ${meta.engagement.likes}  🔄 ${meta.engagement.retweets}  💬 ${meta.engagement.replies}`;
        }
      } else {
        sourceInfo = `\n\n📎 Fonte: ${topic.source_news.source}`;
      }
    }

    const templateTag = topic.template === 'news' ? ' [NEWS]' : '';

    const result = await sendMessage(
      `${emoji} <b>${topic.title}</b>${templateTag}\n` +
      `${catLabel} | Rubrica: ${topic.rubric}\n\n` +
      `${topic.summary || ''}` +
      sourceInfo,
      {
        reply_markup: {
          inline_keyboard: [
            [
              { text: '✅ Approva', callback_data: `approve_topic:${topic.id}` },
              { text: '❌ Rifiuta', callback_data: `reject_topic:${topic.id}` },
            ],
          ],
        },
      }
    );

    if (result.ok && result.result?.message_id) {
      // Store telegram message_id for reference
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      await supabase
        .from('content_topics')
        .update({ telegram_message_id: result.result.message_id })
        .eq('id', topic.id);
    }
  }

  await sendMessage(
    '👆 Approva singolarmente oppure:',
    {
      reply_markup: {
        inline_keyboard: [
          [{ text: '✅ Approva tutti', callback_data: `approve_all:${publishDate}` }],
        ],
      },
    }
  );
}

export async function sendApprovalRequest(postId, postTitle) {
  return sendMessage(
    `<b>Approva contenuto generato?</b>\n\n📝 <b>${postTitle}</b>\n\nID: <code>${postId}</code>`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approva', callback_data: `approve_${postId}` },
            { text: '✏️ Modifica', callback_data: `edit_${postId}` },
            { text: '❌ Rifiuta', callback_data: `reject_${postId}` },
          ],
        ],
      },
    }
  );
}

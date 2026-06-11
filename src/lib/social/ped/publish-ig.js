// Instagram publisher for PED content.
// Reads credentials from app_config.instagram_tokens (page token, never expires).
// Completely independent from the extension's social_accounts table.

import supabase from '../supabase.js';

const API = 'https://graph.facebook.com/v21.0';

let _cached = null;

/**
 * Get IG credentials from app_config.instagram_tokens.
 * Returns { igUserId, accessToken } or throws.
 */
export async function getIgCredentials() {
  if (_cached) return _cached;

  const { data: config, error } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'instagram_tokens')
    .single();

  if (error || !config?.value?.access_token) {
    throw new Error('No instagram_tokens in app_config — run the token setup');
  }

  const { access_token, ig_user_id, expires_at } = config.value;

  if (expires_at && expires_at > 0 && expires_at < Math.floor(Date.now() / 1000)) {
    throw new Error('Instagram page token expired — regenerate from Graph Explorer');
  }

  _cached = { igUserId: ig_user_id, accessToken: access_token };
  return _cached;
}

async function pollContainerStatus(containerId, accessToken, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${API}/${containerId}?fields=status_code&access_token=${accessToken}`);
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error('IG container processing failed');
    await new Promise((r) => setTimeout(r, 5000));
  }
  throw new Error('IG container processing timeout');
}

/**
 * Publish a single image post.
 */
export async function publishImage(imageUrl, caption) {
  const { igUserId, accessToken } = await getIgCredentials();

  const res = await fetch(`${API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_url: imageUrl, caption, access_token: accessToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`IG container error: ${data.error.message}`);

  await pollContainerStatus(data.id, accessToken);

  const pubRes = await fetch(`${API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: data.id, access_token: accessToken }),
  });
  const pubData = await pubRes.json();
  if (pubData.error) throw new Error(`IG publish error: ${pubData.error.message}`);
  return pubData.id;
}

/**
 * Publish a carousel (2-10 images).
 */
export async function publishCarousel(imageUrls, caption) {
  const { igUserId, accessToken } = await getIgCredentials();

  const containerIds = [];
  for (const url of imageUrls) {
    const res = await fetch(`${API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: url, is_carousel_item: true, access_token: accessToken }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`IG carousel item error: ${data.error.message}`);
    containerIds.push(data.id);
  }

  const carRes = await fetch(`${API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: containerIds.join(','),
      caption,
      access_token: accessToken,
    }),
  });
  const carData = await carRes.json();
  if (carData.error) throw new Error(`IG carousel error: ${carData.error.message}`);

  await pollContainerStatus(carData.id, accessToken);

  const pubRes = await fetch(`${API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: carData.id, access_token: accessToken }),
  });
  const pubData = await pubRes.json();
  if (pubData.error) throw new Error(`IG carousel publish error: ${pubData.error.message}`);
  return pubData.id;
}

/**
 * Publish a story image.
 */
export async function publishStory(imageUrl) {
  const { igUserId, accessToken } = await getIgCredentials();

  const res = await fetch(`${API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ media_type: 'STORIES', image_url: imageUrl, access_token: accessToken }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`IG story container error: ${data.error.message}`);

  await pollContainerStatus(data.id, accessToken);

  const pubRes = await fetch(`${API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: data.id, access_token: accessToken }),
  });
  const pubData = await pubRes.json();
  if (pubData.error) throw new Error(`IG story publish error: ${pubData.error.message}`);
  return pubData.id;
}

/**
 * Get insights for a media object (post, carousel or story).
 */
export async function getMediaInsights(mediaId, isStory = false) {
  const { accessToken } = await getIgCredentials();

  const metricSets = isStory
    ? [['reach', 'views', 'replies', 'total_interactions'], ['reach', 'views'], ['reach']]
    : [['reach', 'views', 'likes', 'comments', 'saved', 'shares', 'total_interactions'], ['reach', 'total_interactions'], ['reach']];

  for (const metrics of metricSets) {
    const res = await fetch(
      `${API}/${mediaId}/insights?metric=${metrics.join(',')}&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.error) {
      if (data.error.code === 100 || /metric/i.test(data.error.message || '')) continue;
      throw new Error(`IG insights error: ${data.error.message}`);
    }
    const out = {};
    for (const m of data.data || []) {
      out[m.name] = m.values?.[0]?.value ?? m.total_value?.value ?? 0;
    }
    return out;
  }
  throw new Error('IG insights: no supported metric set for this media');
}

/**
 * Get current account followers count.
 */
export async function getFollowersCount() {
  const { igUserId, accessToken } = await getIgCredentials();
  const res = await fetch(`${API}/${igUserId}?fields=followers_count&access_token=${accessToken}`);
  const data = await res.json();
  if (data.error) throw new Error(`IG followers error: ${data.error.message}`);
  return data.followers_count ?? null;
}

/**
 * Get recent IG media (for rate-limit recovery dedup).
 */
export async function getRecentMedia(limit = 5) {
  const { igUserId, accessToken } = await getIgCredentials();
  const res = await fetch(
    `${API}/${igUserId}/media?fields=id,caption,timestamp&limit=${limit}&access_token=${accessToken}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.data || [];
}

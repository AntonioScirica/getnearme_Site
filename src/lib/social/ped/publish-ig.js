// Instagram publisher for PED content.
// Uses the token saved by the GetNearMe extension in social_accounts
// (Facebook Login flow → graph.facebook.com, NOT graph.instagram.com).

import supabase from '../supabase.js';

const API = 'https://graph.facebook.com/v21.0';

/**
 * Get IG credentials from social_accounts (extension-connected account).
 * Returns { igUserId, accessToken } or throws.
 */
export async function getIgCredentials() {
  const { data: account, error } = await supabase
    .from('social_accounts')
    .select('external_account_id, access_token, token_expires_at')
    .eq('platform', 'instagram')
    .order('last_used_at', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle();

  if (error || !account) throw new Error('No Instagram account in social_accounts');

  const expiresAt = new Date(account.token_expires_at).getTime();
  if (expiresAt && expiresAt < Date.now()) {
    throw new Error(`Instagram token expired on ${account.token_expires_at} — reconnect from the extension`);
  }

  return { igUserId: account.external_account_id, accessToken: account.access_token };
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

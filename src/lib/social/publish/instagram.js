import supabase from '../supabase.js';

// IG Content Publishing API via the Facebook Graph host: the app_config token is
// a Facebook page token (EAA...), same one ped/publish-ig.js uses on graph.facebook.com.
// graph.instagram.com would reject it ("Cannot parse access token").
const API = 'https://graph.facebook.com/v21.0';

/**
 * Get valid access token, refreshing if expiring within 7 days.
 * Stored in Supabase app_config key: 'instagram_tokens'.
 * Falls back to env vars if no DB record.
 */
async function getAccessToken() {
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'instagram_tokens')
    .single();

  let accessToken = process.env.META_ACCESS_TOKEN;
  let igUserId = process.env.META_IG_USER_ID;
  let expiresAt = 0;

  if (config?.value) {
    accessToken = config.value.access_token || accessToken;
    igUserId = config.value.ig_user_id || igUserId;
    expiresAt = config.value.expires_at || 0;
  }

  // Refresh if expires within 7 days (Instagram long-lived tokens last 60 days, refreshable)
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt && now > expiresAt - 604800 && accessToken) {
    console.log('Instagram token expiring soon, refreshing...');
    try {
      const res = await fetch(
        `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${accessToken}`
      );
      const data = await res.json();
      if (data.access_token) {
        accessToken = data.access_token;
        const newExpiresAt = now + (data.expires_in || 5183944);
        await supabase.from('app_config').upsert({
          key: 'instagram_tokens',
          value: {
            access_token: accessToken,
            ig_user_id: igUserId,
            expires_at: newExpiresAt,
            refreshed_at: new Date().toISOString(),
          },
        }, { onConflict: 'key' });
        console.log('Instagram token refreshed, expires:', new Date(newExpiresAt * 1000).toISOString());
      } else {
        console.error('Instagram refresh failed:', data.error?.message);
      }
    } catch (err) {
      console.error('Instagram refresh error:', err.message);
    }
  }

  return { accessToken, igUserId };
}

export async function publishCarousel(imageUrls, caption) {
  const { accessToken, igUserId } = await getAccessToken();
  const containerIds = [];

  for (const url of imageUrls) {
    const res = await fetch(`${API}/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: url,
        is_carousel_item: true,
        access_token: accessToken,
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`IG container error: ${data.error.message}`);
    containerIds.push(data.id);
  }

  const carouselRes = await fetch(`${API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'CAROUSEL',
      children: containerIds.join(','),
      caption,
      access_token: accessToken,
    }),
  });
  const carouselData = await carouselRes.json();
  if (carouselData.error) throw new Error(`IG carousel error: ${carouselData.error.message}`);

  // Poll until carousel container is FINISHED before publishing
  await pollContainerStatus(carouselData.id, accessToken);

  const publishRes = await fetch(`${API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: carouselData.id,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`IG publish error: ${publishData.error.message}`);

  return publishData.id;
}

export async function publishReel(videoUrl, caption) {
  const { accessToken, igUserId } = await getAccessToken();

  const containerRes = await fetch(`${API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'REELS',
      video_url: videoUrl,
      caption,
      access_token: accessToken,
    }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(`IG reel container error: ${containerData.error.message}`);

  await pollContainerStatus(containerData.id, accessToken);

  const publishRes = await fetch(`${API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`IG reel publish error: ${publishData.error.message}`);

  return publishData.id;
}

export async function publishStory(imageUrl) {
  const { accessToken, igUserId } = await getAccessToken();

  const containerRes = await fetch(`${API}/${igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'STORIES',
      image_url: imageUrl,
      access_token: accessToken,
    }),
  });
  const containerData = await containerRes.json();
  if (containerData.error) throw new Error(`IG story container error: ${containerData.error.message}`);

  await pollContainerStatus(containerData.id, accessToken);

  const publishRes = await fetch(`${API}/${igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      creation_id: containerData.id,
      access_token: accessToken,
    }),
  });
  const publishData = await publishRes.json();
  if (publishData.error) throw new Error(`IG story publish error: ${publishData.error.message}`);

  return publishData.id;
}

async function pollContainerStatus(containerId, accessToken, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(
      `${API}/${containerId}?fields=status_code,status&access_token=${accessToken}`
    );
    const data = await res.json();
    if (data.status_code === 'FINISHED') return;
    if (data.status_code === 'ERROR') throw new Error(`IG container processing failed: ${data.status || 'no detail'}`);
    await new Promise(r => setTimeout(r, 5000));
  }
  throw new Error('IG container processing timeout');
}

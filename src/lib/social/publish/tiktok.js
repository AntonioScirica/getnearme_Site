import supabase from '../supabase.js';

const API = 'https://open.tiktokapis.com/v2';

/**
 * Get a valid access token, refreshing if needed.
 * Tokens stored in Supabase app_config table (key: 'tiktok_tokens').
 * Falls back to env var on first run.
 */
async function getAccessToken() {
  // Try to get stored tokens from DB
  const { data: config } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'tiktok_tokens')
    .single();

  let accessToken = process.env.TIKTOK_ACCESS_TOKEN;
  let refreshToken = process.env.TIKTOK_REFRESH_TOKEN;
  let expiresAt = 0;

  if (config?.value) {
    accessToken = config.value.access_token || accessToken;
    refreshToken = config.value.refresh_token || refreshToken;
    expiresAt = config.value.expires_at || 0;
  }

  // Refresh if expires within 1 hour
  const now = Math.floor(Date.now() / 1000);
  if (expiresAt && now > expiresAt - 3600 && refreshToken) {
    console.log('TikTok token expiring, refreshing...');
    try {
      const res = await fetch(`${API}/oauth/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: process.env.TIKTOK_CLIENT_KEY,
          client_secret: process.env.TIKTOK_CLIENT_SECRET,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      const data = await res.json();
      if (data.access_token) {
        accessToken = data.access_token;
        refreshToken = data.refresh_token || refreshToken;
        const newExpiresAt = now + (data.expires_in || 86400);

        // Store refreshed tokens
        await supabase
          .from('app_config')
          .upsert({
            key: 'tiktok_tokens',
            value: {
              access_token: accessToken,
              refresh_token: refreshToken,
              expires_at: newExpiresAt,
              open_id: data.open_id || config?.value?.open_id,
              refreshed_at: new Date().toISOString(),
            },
          }, { onConflict: 'key' });

        console.log('TikTok token refreshed, expires:', new Date(newExpiresAt * 1000).toISOString());
      } else {
        console.error('TikTok refresh failed:', data.error);
      }
    } catch (err) {
      console.error('TikTok refresh error:', err.message);
    }
  }

  return accessToken;
}

/**
 * Store initial tokens from env vars (call once after OAuth).
 */
export async function storeInitialTokens() {
  const now = Math.floor(Date.now() / 1000);
  await supabase
    .from('app_config')
    .upsert({
      key: 'tiktok_tokens',
      value: {
        access_token: process.env.TIKTOK_ACCESS_TOKEN,
        refresh_token: process.env.TIKTOK_REFRESH_TOKEN,
        open_id: process.env.TIKTOK_OPEN_ID,
        expires_at: now + 86400, // 1 day from now
        stored_at: new Date().toISOString(),
      },
    }, { onConflict: 'key' });
}

export async function publishVideo(videoUrl, caption) {
  const token = await getAccessToken();

  // Step 1: Init upload with FILE_UPLOAD (no domain verification needed)
  // First, download the video to get its size
  const videoRes = await fetch(videoUrl);
  if (!videoRes.ok) throw new Error(`Failed to download video: ${videoRes.status}`);
  const videoBuffer = Buffer.from(await videoRes.arrayBuffer());
  const videoSize = videoBuffer.length;

  console.log(`TikTok: downloaded video ${videoSize} bytes, initiating upload...`);

  const initRes = await fetch(`${API}/post/publish/video/init/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      post_info: {
        title: caption.slice(0, 150),
        privacy_level: 'SELF_ONLY',
        disable_duet: false,
        disable_comment: false,
        disable_stitch: false,
      },
      source_info: {
        source: 'FILE_UPLOAD',
        video_size: videoSize,
        chunk_size: videoSize,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initRes.json();
  if (initData.error?.code) throw new Error(`TikTok init error: ${initData.error.code} - ${initData.error.message}`);

  const uploadUrl = initData.data.upload_url;
  const publishId = initData.data.publish_id;

  console.log(`TikTok: uploading video to ${uploadUrl.slice(0, 80)}...`);

  // Step 2: Upload the video binary via PUT
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'video/mp4',
      'Content-Length': String(videoSize),
      'Content-Range': `bytes 0-${videoSize - 1}/${videoSize}`,
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    const uploadErr = await uploadRes.text();
    throw new Error(`TikTok upload failed: ${uploadRes.status} - ${uploadErr}`);
  }

  console.log('TikTok: video uploaded successfully');
  return publishId;
}

export async function getPublishStatus(publishId) {
  const token = await getAccessToken();

  const res = await fetch(`${API}/post/publish/status/fetch/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ publish_id: publishId }),
  });

  const data = await res.json();
  return {
    status: data.data?.status,
    publishId: data.data?.publish_id,
  };
}

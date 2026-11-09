// TikTok Login Kit + Display API + Content Posting (inbox) for the ChibiClips demo.
// Server only: the client secret comes from Cloudflare environment variables and
// tokens live only inside a single request (never stored in the browser or the repo).

const API = 'https://open.tiktokapis.com/v2';
export const SCOPES = 'user.info.basic,user.info.stats,video.list,video.upload';
export const STATE_COOKIE = 'cc_tt_state';
const SITE = 'https://thesortty.dev';
export const DEMO_VIDEO = `${SITE}/chibiclips/demo.mp4`;

export function config() {
  const clientKey = process.env.TIKTOK_CLIENT_KEY || '';
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET || '';
  const redirectUri = process.env.TIKTOK_REDIRECT_URI || `${SITE}/chibiclips/connect`;
  return { clientKey, clientSecret, redirectUri, ready: Boolean(clientKey && clientSecret) };
}

export function authorizeUrl(state: string) {
  const { clientKey, redirectUri } = config();
  const q = new URLSearchParams({ client_key: clientKey, scope: SCOPES, response_type: 'code', redirect_uri: redirectUri, state });
  return `https://www.tiktok.com/v2/auth/authorize/?${q}`;
}

type TikTokError = { code?: string; message?: string };
async function api<T>(path: string, token: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: init.method ?? 'GET',
    headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json; charset=UTF-8' } : {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; error?: TikTokError };
  if (json.error && json.error.code && json.error.code !== 'ok') throw new Error(json.error.message || json.error.code);
  if (!res.ok) throw new Error(`TikTok answered ${res.status}`);
  return json.data as T;
}

export async function exchangeCode(code: string) {
  const { clientKey, clientSecret, redirectUri } = config();
  const res = await fetch(`${API}/oauth/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
    cache: 'no-store',
  });
  const json = (await res.json().catch(() => ({}))) as { access_token?: string; scope?: string; error?: string; error_description?: string };
  if (!json.access_token) throw new Error(json.error_description || json.error || `TikTok answered ${res.status}`);
  return { token: json.access_token, scope: json.scope ?? '' };
}

export type TikTokUser = {
  display_name?: string; avatar_url?: string;
  follower_count?: number; following_count?: number; likes_count?: number; video_count?: number;
};
export async function getUser(token: string) {
  const fields = 'open_id,display_name,avatar_url,follower_count,following_count,likes_count,video_count';
  return (await api<{ user: TikTokUser }>(`/user/info/?fields=${fields}`, token)).user;
}

export type TikTokVideo = {
  id: string; title?: string; share_url?: string; create_time?: number;
  view_count?: number; like_count?: number; comment_count?: number; share_count?: number;
};
export async function listVideos(token: string) {
  const fields = 'id,title,share_url,create_time,view_count,like_count,comment_count,share_count';
  return (await api<{ videos?: TikTokVideo[] }>(`/video/list/?fields=${fields}`, token, { method: 'POST', body: { max_count: 10 } })).videos ?? [];
}

// Sends the short demo episode to the account's TikTok inbox as a draft.
export async function uploadDraft(token: string) {
  const data = await api<{ publish_id: string }>('/post/publish/inbox/video/init/', token, {
    method: 'POST',
    body: { source_info: { source: 'PULL_FROM_URL', video_url: DEMO_VIDEO } },
  });
  return data.publish_id;
}

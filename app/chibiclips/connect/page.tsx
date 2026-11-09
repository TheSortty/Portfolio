import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { STATE_COOKIE, exchangeCode, getUser, listVideos, uploadDraft, type TikTokUser, type TikTokVideo } from '@/lib/chibiclips/tiktok';
import '../chibiclips.css';

// TikTok sends the user back here. Everything happens in this one server request:
// code → token → account, stats and videos (and the draft upload when asked). The token is then dropped.
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'ChibiClips · TikTok', robots: { index: false } };

type Search = { code?: string; state?: string; error?: string; error_description?: string };
const n = (v?: number) => (v == null ? '–' : new Intl.NumberFormat('en-US').format(v));

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="cc" lang="en">
      <div className="cc-wrap">
        <div className="cc-mark" aria-hidden><span>A</span><span>B</span></div>
        {children}
        <p className="cc-foot">
          <a href="/chibiclips">ChibiClips</a> · <a href="/chibiclips/legal#terms">Terms</a> · <a href="/chibiclips/legal#privacy">Privacy</a>
        </p>
      </div>
    </main>
  );
}

function Failed({ message }: { message: string }) {
  return (
    <Shell>
      <h1>TikTok did not connect</h1>
      <div className="cc-card cc-err"><p>{message}</p></div>
      <a className="cc-btn" href="/chibiclips/login">Connect again</a>
    </Shell>
  );
}

export default async function Connect({ searchParams }: { searchParams: Promise<Search> }) {
  const q = await searchParams;
  if (q.error) return <Failed message={q.error_description || q.error} />;
  const saved = (await cookies()).get(STATE_COOKIE)?.value;
  if (!q.code || !q.state || !saved || saved !== q.state) {
    return <Failed message="This sign-in link is no longer valid. Please connect again." />;
  }
  const wantsUpload = q.state.endsWith('.upload');

  let user: TikTokUser, videos: TikTokVideo[], scope: string;
  let upload: { ok: true; id: string } | { ok: false; message: string } | null = null;
  try {
    const t = await exchangeCode(q.code);
    scope = t.scope;
    [user, videos] = await Promise.all([getUser(t.token), listVideos(t.token)]);
    if (wantsUpload) {
      try {
        upload = { ok: true, id: await uploadDraft(t.token) };
      } catch (err) {
        upload = { ok: false, message: (err as Error).message };
      }
    }
  } catch (err) {
    return <Failed message={(err as Error).message} />;
  }

  return (
    <Shell>
      <div className="cc-user">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {user.avatar_url && <img src={user.avatar_url} alt="" referrerPolicy="no-referrer" />}
        <div>
          <p>Connected TikTok account</p>
          <strong>{user.display_name ?? 'TikTok account'}</strong>
        </div>
      </div>

      {upload && (
        <div className={`cc-card ${upload.ok ? 'cc-ok' : 'cc-err'}`}>
          <p>
            {upload.ok
              ? 'Draft sent. Open TikTok: the episode is waiting in your inbox notifications, ready to edit and post.'
              : `The draft could not be sent: ${upload.message}`}
          </p>
        </div>
      )}

      <h2>Account statistics</h2>
      <div className="cc-stats">
        <div><b>{n(user.follower_count)}</b><span>Followers</span></div>
        <div><b>{n(user.following_count)}</b><span>Following</span></div>
        <div><b>{n(user.likes_count)}</b><span>Likes</span></div>
        <div><b>{n(user.video_count)}</b><span>Videos</span></div>
      </div>

      <h2>Latest videos</h2>
      <div className="cc-table">
        <table>
          <thead>
            <tr><th>Video</th><th>Views</th><th>Likes</th><th>Comments</th><th>Shares</th></tr>
          </thead>
          <tbody>
            {videos.length === 0 && <tr><td colSpan={5}>No videos yet.</td></tr>}
            {videos.map((v) => (
              <tr key={v.id}>
                <td>{v.share_url ? <a href={v.share_url} target="_blank" rel="noreferrer">{v.title || 'Untitled'}</a> : v.title || 'Untitled'}</td>
                <td>{n(v.view_count)}</td><td>{n(v.like_count)}</td><td>{n(v.comment_count)}</td><td>{n(v.share_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Upload a draft</h2>
      <p>Sends a short ChibiClips episode to this account&apos;s TikTok inbox as a draft. Nothing is posted publicly.</p>
      <a className="cc-btn is-alt" href="/chibiclips/login?next=upload">Upload draft</a>
      <p className="cc-foot">Permissions granted: {scope || '–'}. The access token is used only for this page and is not stored.</p>
    </Shell>
  );
}

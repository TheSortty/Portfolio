import type { Metadata } from 'next';
import './chibiclips.css';

export const metadata: Metadata = {
  title: 'ChibiClips',
  description: 'ChibiClips: animated stories where the audience decides what happens next.',
  robots: { index: false },
};

const ERRORS: Record<string, string> = {
  setup: 'The TikTok connection is not configured on the server yet.',
};

export default async function ChibiClips({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="cc" lang="en">
      <div className="cc-wrap">
        <div className="cc-mark" aria-hidden><span>A</span><span>B</span></div>
        <h1>ChibiClips</h1>
        <p>
          Animated stories where the audience decides what happens next. This internal tool connects our own TikTok
          accounts to read their statistics and send finished episodes to the TikTok inbox as drafts.
        </p>
        {error && <div className="cc-card cc-err"><p>{ERRORS[error] ?? 'Something went wrong. Please try again.'}</p></div>}
        <a className="cc-btn" href="/chibiclips/login">Connect TikTok</a>
        <p className="cc-foot">
          <a href="/chibiclips/legal#terms">Terms of Service</a> · <a href="/chibiclips/legal#privacy">Privacy Policy</a>
        </p>
      </div>
    </main>
  );
}

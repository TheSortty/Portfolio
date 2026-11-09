import { NextResponse, type NextRequest } from 'next/server';
import { STATE_COOKIE, authorizeUrl, config } from '@/lib/chibiclips/tiktok';

// Starts TikTok Login Kit: a random state in a short-lived httpOnly cookie, then off to TikTok.
// ?next=upload makes /chibiclips/connect also send the demo draft (the token never leaves the server).
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!config().ready) return NextResponse.redirect(new URL('/chibiclips?error=setup', request.url));
  const next = request.nextUrl.searchParams.get('next') === 'upload' ? 'upload' : 'view';
  const state = `${crypto.randomUUID().replace(/-/g, '')}.${next}`;
  const res = NextResponse.redirect(authorizeUrl(state));
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, secure: true, sameSite: 'lax', path: '/chibiclips', maxAge: 600 });
  return res;
}

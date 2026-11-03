import type { NextRequest } from 'next/server';
import { gatewayFetch, json, requireUser } from '@/lib/dashboard/server';

// Proxy entre el navegador y el gateway del servidor: estado completo para el panel.

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const denied = await requireUser(request);
  if (denied) return denied;

  const r = await gatewayFetch('/v1/overview');
  if (!r.ok) return r.response;
  if (r.status >= 400) {
    return json({ error: (r.body as { error?: string }).error ?? `El servidor respondió con un error (${r.status}).` }, 502);
  }
  return json(r.body);
}

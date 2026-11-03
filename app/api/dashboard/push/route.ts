import type { NextRequest } from 'next/server';
import { gatewayFetch, json, requireUser, sameOrigin } from '@/lib/dashboard/server';

// Notificaciones del panel instalado como app.
//   GET  → clave pública VAPID y cuántos dispositivos están suscriptos
//   POST { action: 'subscribe', subscription } | { action: 'unsubscribe', endpoint } | { action: 'test' }

export const dynamic = 'force-dynamic';

const relay = (r: Awaited<ReturnType<typeof gatewayFetch>>) => (r.ok ? json(r.body, r.status) : r.response);

export async function GET(request: NextRequest) {
  const denied = await requireUser(request);
  if (denied) return denied;
  return relay(await gatewayFetch('/v1/push/key'));
}

export async function POST(request: NextRequest) {
  const denied = await requireUser(request);
  if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'Origen no permitido.' }, 403);

  const body = (await request.json().catch(() => null)) as { action?: string; subscription?: unknown; endpoint?: unknown } | null;
  switch (body?.action) {
    case 'subscribe':
      return relay(await gatewayFetch('/v1/push/subscribe', { method: 'POST', body: { subscription: body.subscription } }));
    case 'unsubscribe':
      return relay(await gatewayFetch('/v1/push/unsubscribe', { method: 'POST', body: { endpoint: body.endpoint } }));
    case 'test':
      return relay(await gatewayFetch('/v1/push/test', { method: 'POST', body: {} }));
    default:
      return json({ error: 'Acción desconocida.' }, 400);
  }
}

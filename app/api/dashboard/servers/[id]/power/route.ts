import type { NextRequest } from 'next/server';
import { gatewayFetch, json, requireUser, sameOrigin } from '@/lib/dashboard/server';

// Encender, apagar, reiniciar o forzar el apagado de un servidor de Pterodactyl.
// POST { signal: 'start' | 'stop' | 'restart' | 'kill' }

export const dynamic = 'force-dynamic';

const SIGNALS = new Set(['start', 'stop', 'restart', 'kill']);

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireUser(request);
  if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'Origen no permitido.' }, 403);

  const { id } = await params;
  if (!/^[a-z0-9]{8}$/.test(id)) return json({ error: 'Servidor no encontrado.' }, 404);
  const body = (await request.json().catch(() => null)) as { signal?: string } | null;
  if (!body?.signal || !SIGNALS.has(body.signal)) return json({ error: 'Acción no válida.' }, 400);

  const r = await gatewayFetch(`/v1/servers/${id}/power`, { method: 'POST', body: { signal: body.signal } });
  return r.ok ? json(r.body, r.status) : r.response;
}

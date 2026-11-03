import type { NextRequest } from 'next/server';
import { gatewayFetch, json, requireUser, sameOrigin } from '@/lib/dashboard/server';

// Crea un backup del servidor en Pterodactyl (respeta el límite de backups del servidor).

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireUser(request);
  if (denied) return denied;
  if (!sameOrigin(request)) return json({ error: 'Origen no permitido.' }, 403);

  const { id } = await params;
  if (!/^[a-z0-9]{8}$/.test(id)) return json({ error: 'Servidor no encontrado.' }, 404);
  const r = await gatewayFetch(`/v1/servers/${id}/backup`, { method: 'POST', body: {} });
  return r.ok ? json(r.body, r.status) : r.response;
}

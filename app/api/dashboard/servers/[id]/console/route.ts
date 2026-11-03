import type { NextRequest } from 'next/server';
import { gatewayFetch, json, requireUser } from '@/lib/dashboard/server';

// Permiso temporal (10 min) para abrir la consola en vivo de un servidor.
// Devuelve { token, socket }: el navegador se conecta directo a Wings.

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireUser(request);
  if (denied) return denied;

  const { id } = await params;
  if (!/^[a-z0-9]{8}$/.test(id)) return json({ error: 'Servidor no encontrado.' }, 404);
  const r = await gatewayFetch(`/v1/servers/${id}/console`);
  return r.ok ? json(r.body, r.status) : r.response;
}

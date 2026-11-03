import { NextResponse } from 'next/server';

// Estado público del servidor de casa para la portada del portafolio.
// Pide al gateway solo el resumen inofensivo (/v1/public) con el mismo
// service token del dashboard; el navegador nunca ve credenciales.

export const dynamic = 'force-dynamic';

export type PublicStatus =
  | { available: false }
  | {
      available: true;
      generatedAt: string;
      online: boolean;
      uptimeDays: number | null;
      cpuTemp: number | null;
      gameServers: { running: number; total: number } | null;
      backupOk: boolean | null;
    };

const reply = (body: PublicStatus) =>
  NextResponse.json(body, { headers: { 'Cache-Control': 'public, max-age=30', 'X-Robots-Tag': 'noindex' } });

export async function GET() {
  const env = process.env;
  const gatewayUrl = env.DASHBOARD_GATEWAY_URL?.replace(/\/+$/, '');
  if (!gatewayUrl || !env.DASHBOARD_GATEWAY_CLIENT_ID || !env.DASHBOARD_GATEWAY_CLIENT_SECRET) return reply({ available: false });

  try {
    const res = await fetch(`${gatewayUrl}/v1/public`, {
      headers: {
        Accept: 'application/json',
        'CF-Access-Client-Id': env.DASHBOARD_GATEWAY_CLIENT_ID,
        'CF-Access-Client-Secret': env.DASHBOARD_GATEWAY_CLIENT_SECRET,
      },
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(6_000),
    });
    // 502/504/530: el túnel no responde, la PC está apagada o sin internet.
    if ([502, 504, 530].includes(res.status)) {
      return reply({ available: true, generatedAt: new Date().toISOString(), online: false, uptimeDays: null, cpuTemp: null, gameServers: null, backupOk: null });
    }
    if (!res.ok) return reply({ available: false });
    const body = await res.json();
    return reply({
      available: true,
      generatedAt: String(body.generatedAt),
      online: Boolean(body.online),
      uptimeDays: typeof body.uptimeDays === 'number' ? body.uptimeDays : null,
      cpuTemp: typeof body.cpuTemp === 'number' ? body.cpuTemp : null,
      gameServers: body.gameServers && typeof body.gameServers.running === 'number' ? { running: body.gameServers.running, total: body.gameServers.total } : null,
      backupOk: typeof body.backupOk === 'boolean' ? body.backupOk : null,
    });
  } catch {
    return reply({ available: false });
  }
}

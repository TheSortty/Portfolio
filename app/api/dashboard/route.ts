import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessJwt } from '@/lib/dashboard/access';

// Proxy entre el navegador y el gateway del servidor (api.thesortty.dev).
// Las credenciales viven solo en el Worker, como secrets de Cloudflare:
//   DASHBOARD_ACCESS_TEAM_DOMAIN     ej: thesortty.cloudflareaccess.com
//   DASHBOARD_ACCESS_AUD             AUD de la aplicación de Access que protege /dashboard
//   DASHBOARD_GATEWAY_URL            https://api.thesortty.dev
//   DASHBOARD_GATEWAY_CLIENT_ID      service token de Access para el gateway
//   DASHBOARD_GATEWAY_CLIENT_SECRET
// Solo en `next dev` se puede saltear Access con DASHBOARD_DEV_BYPASS=1.

export const dynamic = 'force-dynamic';

const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

export async function GET(request: NextRequest) {
  const env = process.env;
  const devBypass = process.env.NODE_ENV === 'development' && env.DASHBOARD_DEV_BYPASS === '1';

  if (!devBypass) {
    const teamDomain = env.DASHBOARD_ACCESS_TEAM_DOMAIN;
    const audience = env.DASHBOARD_ACCESS_AUD;
    if (!teamDomain || !audience) return json({ error: 'El dashboard todavía no está configurado.' }, 503);

    const token = request.headers.get('cf-access-jwt-assertion') ?? request.cookies.get('CF_Authorization')?.value ?? null;
    let identity = null;
    try {
      identity = await verifyAccessJwt(token, { teamDomain, audience });
    } catch {
      return json({ error: 'No se pudo verificar tu sesión. Probá recargar la página.' }, 503);
    }
    if (!identity) return json({ error: 'Acceso denegado.' }, 403);
  }

  const gatewayUrl = env.DASHBOARD_GATEWAY_URL?.replace(/\/+$/, '');
  if (!gatewayUrl) return json({ error: 'Falta configurar la dirección del servidor.' }, 503);

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (env.DASHBOARD_GATEWAY_CLIENT_ID && env.DASHBOARD_GATEWAY_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = env.DASHBOARD_GATEWAY_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = env.DASHBOARD_GATEWAY_CLIENT_SECRET;
  }

  let res: Response;
  try {
    res = await fetch(`${gatewayUrl}/v1/overview`, {
      headers,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return json({ error: 'El servidor no responde.', offline: true }, 502);
  }

  // Access responde con una redirección a su login cuando no acepta el service token.
  if (res.status >= 300 && res.status < 400) {
    return json({ error: 'Cloudflare Access no aceptó el token de servicio del dashboard.' }, 502);
  }
  // 502/504/530 vienen de Cloudflare cuando el túnel está caído (PC apagada o sin internet).
  if ([502, 504, 530].includes(res.status)) return json({ error: 'El servidor no responde.', offline: true }, 502);

  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!res.ok || !body) {
    return json({ error: body?.error ?? `El servidor respondió con un error (${res.status}).` }, 502);
  }
  return json(body);
}

import { NextResponse, type NextRequest } from 'next/server';
import { verifyAccessJwt } from './access';

// Piezas compartidas por las rutas /api/dashboard/*: verificar la sesión de
// Cloudflare Access y hablar con el gateway del servidor (api.thesortty.dev).
// Las credenciales viven solo en el Worker, como secrets de Cloudflare:
//   DASHBOARD_ACCESS_TEAM_DOMAIN     ej: thesortty.cloudflareaccess.com
//   DASHBOARD_ACCESS_AUD             AUD de la aplicación de Access que protege /dashboard
//   DASHBOARD_GATEWAY_URL            https://api.thesortty.dev
//   DASHBOARD_GATEWAY_CLIENT_ID      service token de Access para el gateway
//   DASHBOARD_GATEWAY_CLIENT_SECRET
// Solo en `next dev` se puede saltear Access con DASHBOARD_DEV_BYPASS=1.

export const json = (body: unknown, status = 200) =>
  NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } });

/** Devuelve una respuesta de error si el pedido no trae una sesión válida; null si está todo bien. */
export async function requireUser(request: NextRequest): Promise<NextResponse | null> {
  const env = process.env;
  if (process.env.NODE_ENV === 'development' && env.DASHBOARD_DEV_BYPASS === '1') return null;

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
  return identity ? null : json({ error: 'Acceso denegado.' }, 403);
}

/** Los pedidos que cambian algo solo se aceptan desde el propio sitio. */
export function sameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

type GatewayResult = { ok: true; status: number; body: unknown } | { ok: false; response: NextResponse };

/** Llama al gateway con el service token y traduce los errores a mensajes claros. */
export async function gatewayFetch(pathname: string, init: { method?: 'GET' | 'POST'; body?: unknown } = {}): Promise<GatewayResult> {
  const env = process.env;
  const gatewayUrl = env.DASHBOARD_GATEWAY_URL?.replace(/\/+$/, '');
  if (!gatewayUrl) return { ok: false, response: json({ error: 'Falta configurar la dirección del servidor.' }, 503) };

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (init.body !== undefined) headers['Content-Type'] = 'application/json';
  if (env.DASHBOARD_GATEWAY_CLIENT_ID && env.DASHBOARD_GATEWAY_CLIENT_SECRET) {
    headers['CF-Access-Client-Id'] = env.DASHBOARD_GATEWAY_CLIENT_ID;
    headers['CF-Access-Client-Secret'] = env.DASHBOARD_GATEWAY_CLIENT_SECRET;
  }

  let res: Response;
  try {
    res = await fetch(`${gatewayUrl}${pathname}`, {
      method: init.method ?? 'GET',
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
      cache: 'no-store',
      redirect: 'manual',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    return { ok: false, response: json({ error: 'El servidor no responde.', offline: true }, 502) };
  }

  // Access responde con una redirección a su login cuando no acepta el service token.
  if (res.status >= 300 && res.status < 400) {
    return { ok: false, response: json({ error: 'Cloudflare Access no aceptó el token de servicio del dashboard.' }, 502) };
  }
  // 502/504/530 vienen de Cloudflare cuando el túnel está caído (PC apagada o sin internet).
  if ([502, 504, 530].includes(res.status)) return { ok: false, response: json({ error: 'El servidor no responde.', offline: true }, 502) };

  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  if (!body) return { ok: false, response: json({ error: `El servidor respondió con un error (${res.status}).` }, 502) };
  return { ok: true, status: res.status, body };
}

// Verificación del JWT que Cloudflare Access agrega a cada pedido autorizado
// (header Cf-Access-Jwt-Assertion). Usa WebCrypto, disponible en Workers y en Node.

type Jwk = JsonWebKey & { kid?: string };

const keyCache = new Map<string, { at: number; keys: Jwk[] }>();

async function getKeys(teamDomain: string, force = false): Promise<Jwk[]> {
  const cached = keyCache.get(teamDomain);
  const age = cached ? Date.now() - cached.at : Infinity;
  if (cached && (age < 3_600_000 || (force && age < 30_000))) return cached.keys;

  const res = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`No se pudieron obtener las claves de Access (${res.status})`);
  const keys = ((await res.json()) as { keys?: Jwk[] }).keys ?? [];
  keyCache.set(teamDomain, { at: Date.now(), keys });
  return keys;
}

function b64urlToBytes(part: string): Uint8Array<ArrayBuffer> {
  const b64 = part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=');
  const bin = atob(b64);
  const bytes = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

const decodeJson = (part: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(part)));

export interface AccessIdentity {
  email: string | null;
}

/** Devuelve la identidad si el token es válido para esta aplicación de Access, o null. */
export async function verifyAccessJwt(
  token: string | null,
  opts: { teamDomain: string; audience: string },
): Promise<AccessIdentity | null> {
  const parts = (token ?? '').split('.');
  if (parts.length !== 3) return null;

  let header: { alg?: string; kid?: string };
  let payload: { aud?: string | string[]; exp?: number; nbf?: number; iss?: string; email?: string };
  try {
    header = decodeJson(parts[0]);
    payload = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;

  let jwk = (await getKeys(opts.teamDomain)).find((k) => k.kid === header.kid);
  if (!jwk) jwk = (await getKeys(opts.teamDomain, true)).find((k) => k.kid === header.kid);
  if (!jwk) return null;

  const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return null;

  const now = Math.floor(Date.now() / 1000);
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(opts.audience)) return null;
  if (typeof payload.exp !== 'number' || payload.exp < now - 30) return null;
  if (typeof payload.nbf === 'number' && payload.nbf > now + 30) return null;
  if (payload.iss !== `https://${opts.teamDomain}`) return null;

  return { email: payload.email ?? null };
}

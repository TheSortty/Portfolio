'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, BellRing, Smartphone } from 'lucide-react';

// Control de avisos para este dispositivo. En el iPhone, Safari solo permite
// notificaciones si el panel está agregado a la pantalla de inicio.

type State =
  | { kind: 'checking' }
  | { kind: 'install-ios' }
  | { kind: 'unsupported' }
  | { kind: 'server-off' }
  | { kind: 'denied' }
  | { kind: 'off' }
  | { kind: 'on'; endpoint: string }
  | { kind: 'error'; message: string };

const SW_URL = '/littlemc-sw.js';
const SCOPE = '/dashboard';

function keyToBytes(key: string) {
  const pad = '='.repeat((4 - (key.length % 4)) % 4);
  const raw = atob((key + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

async function api(body?: object) {
  const res = await fetch('/api/dashboard/push', {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
    redirect: 'manual',
  });
  if (res.type === 'opaqueredirect') throw new Error('Tu sesión venció. Recargá la página para volver a entrar.');
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data;
}

export function NotifyControl() {
  const [state, setState] = useState<State>({ kind: 'checking' });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    if (!supported) {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
      setState({ kind: ios && !standalone ? 'install-ios' : 'unsupported' });
      return;
    }
    try {
      const reg = await navigator.serviceWorker.register(SW_URL, { scope: SCOPE });
      const key = await api();
      if (!key.enabled) return setState({ kind: 'server-off' });
      if (Notification.permission === 'denied') return setState({ kind: 'denied' });
      const sub = await reg.pushManager.getSubscription();
      setState(sub ? { kind: 'on', endpoint: sub.endpoint } : { kind: 'off' });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enable = async () => {
    setBusy(true);
    setNote(null);
    try {
      // El permiso tiene que pedirse dentro del toque, sin esperas antes.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return setState({ kind: permission === 'denied' ? 'denied' : 'off' });
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api();
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
      await api({ action: 'subscribe', subscription: sub.toJSON() });
      setState({ kind: 'on', endpoint: sub.endpoint });
      await api({ action: 'test' });
      setNote('Te mandé una notificación de prueba.');
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (state.kind !== 'on') return;
    setBusy(true);
    setNote(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      await api({ action: 'unsubscribe', endpoint: state.endpoint });
      await sub?.unsubscribe();
      setState({ kind: 'off' });
    } catch (err) {
      setState({ kind: 'error', message: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    setNote(null);
    try {
      const r = await api({ action: 'test' });
      setNote(r.sent ? 'Listo, revisá las notificaciones.' : 'No se pudo entregar. Probá desactivar y activar de nuevo.');
    } catch (err) {
      setNote((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (state.kind === 'checking') return null;

  const view: Record<Exclude<State['kind'], 'checking'>, { icon: React.ElementType; tone: string; text: React.ReactNode }> = {
    'install-ios': {
      icon: Smartphone,
      tone: 't-accent',
      text: <>Para recibir avisos en el iPhone, tocá <b>Compartir</b> y después <b>Agregar a inicio</b>. Abrí el panel desde ese ícono y activalos ahí.</>,
    },
    unsupported: { icon: BellOff, tone: 't-muted', text: 'Este navegador no permite notificaciones.' },
    'server-off': { icon: BellOff, tone: 't-muted', text: 'Los avisos todavía no están configurados en el servidor.' },
    denied: { icon: BellOff, tone: 't-warn', text: 'Los avisos están bloqueados para este sitio. Habilitalos en la configuración del navegador o del celular.' },
    off: { icon: Bell, tone: 't-muted', text: 'Recibí un aviso en este dispositivo si algo se cae, falla un backup o la PC se calienta.' },
    on: { icon: BellRing, tone: 't-ok', text: <><b>Avisos activados</b> en este dispositivo.</> },
    error: { icon: BellOff, tone: 't-crit', text: (state as { message?: string }).message ?? 'Algo falló.' },
  };
  const v = view[state.kind];

  return (
    <div className={`d-notify d-glass ${v.tone}`} role="status">
      <v.icon aria-hidden />
      <p>
        {v.text}
        {note && <> {note}</>}
      </p>
      <div className="d-notify-actions">
        {state.kind === 'off' && (
          <button type="button" className="d-text-btn is-primary" onClick={enable} disabled={busy}>Activar avisos</button>
        )}
        {state.kind === 'on' && (
          <>
            <button type="button" className="d-text-btn" onClick={test} disabled={busy}>Enviar prueba</button>
            <button type="button" className="d-text-btn" onClick={disable} disabled={busy}>Desactivar</button>
          </>
        )}
        {state.kind === 'error' && (
          <button type="button" className="d-text-btn" onClick={refresh} disabled={busy}>Reintentar</button>
        )}
      </div>
    </div>
  );
}

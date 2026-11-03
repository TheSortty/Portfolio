// Service worker del panel instalado como app (thesortty.dev/dashboard).
// Solo recibe las notificaciones del servidor: no guarda ni intercepta datos,
// así el estado del servidor nunca queda en caché en el dispositivo.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'littlemc', body: event.data ? event.data.text() : '' };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'littlemc', {
      body: data.body || '',
      tag: data.tag,
      renotify: Boolean(data.tag),
      icon: '/icons/littlemc-192.png',
      badge: '/icons/littlemc-192.png',
      data: { url: data.url || '/dashboard' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  // Solo se abren páginas del propio panel.
  const target = new URL(event.notification.data?.url || '/dashboard', self.location.origin);
  const url = target.origin === self.location.origin && target.pathname.startsWith('/dashboard') ? target.href : `${self.location.origin}/dashboard`;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      const open = windows.find((w) => new URL(w.url).pathname.startsWith('/dashboard'));
      if (open) return open.focus();
      return self.clients.openWindow(url);
    })(),
  );
});

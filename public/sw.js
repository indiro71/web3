// Build replaces these markers with a content version and the complete public shell.
const cachePrefix = 'web3-shell-';
const cacheName = `${cachePrefix}__SHELL_VERSION__`;
const shellUrls = /* __SHELL_URLS__ */ [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/pwa.svg',
];

self.addEventListener('install', (event) => {
  // New versions activate once existing tabs close; never interrupt a trade dialog.
  event.waitUntil(
    caches.open(cacheName).then((cache) => cache.addAll(shellUrls)),
  );
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(cachePrefix) && name !== cacheName)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin)
    return;
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000);
        try {
          const response = await fetch(event.request, {
            signal: controller.signal,
          });
          if (response.ok) return response;
          const cached = await caches
            .open(cacheName)
            .then((cache) => cache.match('/index.html'));
          return cached || response;
        } catch {
          return (
            (await caches
              .open(cacheName)
              .then((cache) => cache.match('/index.html'))) || Response.error()
          );
        } finally {
          clearTimeout(timer);
        }
      })(),
    );
    return;
  }
  // Never store authentication, private API responses or trading requests.
  if (!shellUrls.includes(url.pathname) && !url.pathname.startsWith('/assets/'))
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    })(),
  );
});

function readPayload(event) {
  try {
    const payload = event.data?.json();
    return payload && typeof payload === 'object' ? payload : {};
  } catch {
    return { body: event.data?.text() || '' };
  }
}

self.addEventListener('push', (event) => {
  const payload = readPayload(event);
  const notification = payload.notification || payload;
  event.waitUntil(
    (async () => {
      // Always show a visible notification, including legacy/silent/malformed payloads.
      // Stable per-event tags replace a transport retry without alerting a second time.
      await self.registration.showNotification(
        notification.title || 'Trading monitor',
        {
          body:
            typeof notification.body === 'string' && notification.body.trim()
              ? notification.body
              : 'Новое событие. Откройте Web3 для обновления данных.',
          icon: '/pwa.svg',
          tag: notification.tag || payload.eventId || undefined,
          renotify: false,
          data: {
            eventId: notification.data?.eventId || payload.eventId,
            url: notification.navigate || '/',
          },
        },
      );
      const badge = Number(
        notification.app_badge ?? payload.badge ?? payload.activeButtonsCount,
      );
      if (Number.isFinite(badge)) {
        try {
          if (badge > 0) await self.navigator.setAppBadge?.(badge);
          else await self.navigator.clearAppBadge?.();
        } catch {
          /* Badge failure must never prevent notification display. */
        }
      }
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      windows.forEach((client) => client.postMessage({ type: 'web3:refresh' }));
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      let url;
      try {
        url = new URL(
          event.notification.data?.url || '/',
          self.location.origin,
        );
      } catch {
        url = new URL('/', self.location.origin);
      }
      if (url.origin !== self.location.origin)
        url = new URL('/', self.location.origin);
      const windows = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      const client = windows.find(
        (item) => new URL(item.url).origin === self.location.origin,
      );
      if (client) {
        await client.focus();
        client.postMessage({ type: 'web3:refresh' });
      } else await self.clients.openWindow(url.href);
    })(),
  );
});

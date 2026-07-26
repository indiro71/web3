const appShellCachePrefix = 'web3-shell-';

const getPushPayload = (event) => {
  if (!event.data) {
    return {};
  }

  try {
    return event.data.json();
  } catch {
    return {
      body: event.data.text(),
      title: 'Trading monitor',
    };
  }
};

const updateBadge = async (count) => {
  if (!self.registration.setAppBadge || !self.registration.clearAppBadge) {
    return;
  }

  if (count > 0) {
    await self.registration.setAppBadge(count);
    return;
  }

  await self.registration.clearAppBadge();
};

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => Promise.all(
        cacheNames
          .filter((cacheName) => !cacheName.startsWith(appShellCachePrefix))
          .map((cacheName) => caches.delete(cacheName)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('push', (event) => {
  const payload = getPushPayload(event);
  const badgeCount = Number(payload.badge || payload.activeButtonsCount || 0);

  event.waitUntil((async () => {
    await updateBadge(badgeCount);

    if (badgeCount <= 0) {
      return;
    }

    await self.registration.showNotification(payload.title || 'Trading monitor', {
      badge: '/pwa.svg',
      body: payload.body || `Активных торговых сигналов: ${badgeCount}`,
      icon: '/pwa.svg',
      tag: payload.tag || 'trading-signals',
      renotify: true,
    });
  })());
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil((async () => {
    const clientList = await self.clients.matchAll({
      includeUncontrolled: true,
      type: 'window',
    });
    const visibleClient = clientList.find((client) => 'focus' in client);

    if (visibleClient) {
      await visibleClient.focus();
      return;
    }

    if (self.clients.openWindow) {
      await self.clients.openWindow('/');
    }
  })());
});

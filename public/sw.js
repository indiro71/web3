const CACHE_NAME = 'web3-pwa-v2';
const APP_SHELL = ['/', '/manifest.webmanifest', '/pwa.svg'];
const STATIC_PATHS = ['/assets/', '/manifest.webmanifest', '/pwa.svg'];
const API_PATH_PREFIXES = ['/api/', '/api-v2/', '/socket.io/'];
const API_HOSTS = ['indiro.ru', 'localhost', '127.0.0.1'];

const isSameOrigin = (url) => url.origin === self.location.origin;

const isApiRequest = (url) => {
  if (url.protocol === 'ws:' || url.protocol === 'wss:') {
    return true;
  }

  if (!API_HOSTS.includes(url.hostname)) {
    return false;
  }

  return API_PATH_PREFIXES.some((pathPrefix) => url.pathname.startsWith(pathPrefix));
};

const isStaticRequest = (url) => {
  return isSameOrigin(url) && STATIC_PATHS.some((pathPrefix) => url.pathname.startsWith(pathPrefix));
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  if (isApiRequest(url)) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseToCache = response.clone();

          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put('/', responseToCache));
          }

          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  if (isStaticRequest(url)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request).then((response) => {
          const responseToCache = response.clone();

          if (response.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseToCache));
          }

          return response;
        });
      }),
    );
  }
});

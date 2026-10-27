import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, access } from 'node:fs/promises';

const source = await readFile(
  new URL('../public/sw.js', import.meta.url),
  'utf8',
);
function worker(overrides = {}) {
  const handlers = {};
  const shown = [];
  const deleted = [];
  const messages = [];
  const cache = {
    addAll: async () => {},
    match: async () => ({ offline: true }),
    put: async () => {},
  };
  const client = {
    url: 'https://web3.example/',
    focus: async () => {},
    postMessage: (value) => messages.push(value),
  };
  const self = {
    location: { origin: 'https://web3.example' },
    navigator: {},
    registration: {
      showNotification: async (...args) => {
        shown.push(args);
      },
    },
    clients: {
      claim: async () => {},
      matchAll: async () => [client],
      openWindow: async (url) => url,
    },
    addEventListener: (event, handler) => {
      handlers[event] = handler;
    },
  };
  const context = {
    self,
    URL,
    Response,
    AbortController,
    setTimeout,
    clearTimeout,
    caches: {
      open: async () => cache,
      keys: async () => ['unrelated-cache', 'web3-shell-old'],
      delete: async (name) => {
        deleted.push(name);
      },
    },
    fetch: async () => {
      throw new Error('offline');
    },
    ...overrides,
  };
  vm.runInNewContext(source, context);
  async function fire(name, event = {}) {
    let done;
    handlers[name]({
      waitUntil: (promise) => {
        done = promise;
      },
      respondWith: (promise) => {
        done = promise;
      },
      ...event,
    });
    return done;
  }
  return { self, fire, shown, deleted, cache, messages };
}

test('visible fallback for missing, malformed and legacy silent pushes', async () => {
  for (const data of [
    undefined,
    {
      json() {
        throw new Error();
      },
      text() {
        return '';
      },
    },
    { json: () => ({ showNotification: false, badge: 2 }) },
    { json: () => null },
  ]) {
    const instance = worker();
    await instance.fire('push', { data });
    assert.equal(instance.shown.length, 1);
    assert.ok(instance.shown[0][1].body);
  }
});
test('declarative payload and retries use the event tag without a second alert', async () => {
  const instance = worker();
  const data = {
    json: () => ({
      web_push: 8030,
      notification: {
        title: 'Emergency',
        body: 'Risk',
        tag: 'event-1',
        navigate: 'https://web3.example/',
        app_badge: '2',
      },
    }),
  };
  await instance.fire('push', { data });
  await instance.fire('push', { data });
  assert.equal(instance.shown[0][0], 'Emergency');
  assert.equal(instance.shown[0][1].tag, instance.shown[1][1].tag);
  assert.equal(instance.shown[0][1].renotify, false);
  assert.equal(instance.messages[0].type, 'web3:refresh');
});
test('badge rejection cannot suppress visible notification', async () => {
  const instance = worker();
  instance.self.navigator.setAppBadge = async () => {
    throw new Error('badge failed');
  };
  await instance.fire('push', {
    data: { json: () => ({ title: 'Risk', body: 'Warning', badge: 1 }) },
  });
  assert.equal(instance.shown.length, 1);
});
test('only own obsolete caches are removed', async () => {
  const instance = worker();
  await instance.fire('activate');
  assert.deepEqual(instance.deleted, ['web3-shell-old']);
});
test('offline navigation returns cached shell, API and trading requests bypass cache', async () => {
  const instance = worker();
  const offline = await instance.fire('fetch', {
    request: { url: 'https://web3.example/', method: 'GET', mode: 'navigate' },
  });
  assert.equal(offline.offline, true);
  for (const request of [
    { url: 'https://web3.example/api/pairs', method: 'GET' },
    { url: 'https://web3.example/trade', method: 'POST' },
    { url: 'https://api.example/pairs', method: 'GET' },
  ])
    assert.equal(await instance.fire('fetch', { request }), undefined);
});
test('notification click rejects external navigation and refreshes existing app', async () => {
  const instance = worker();
  await instance.fire('notificationclick', {
    notification: { close() {}, data: { url: 'https://untrusted.example/' } },
  });
  assert.equal(instance.messages[0].type, 'web3:refresh');
});
test('built worker precaches the emitted hashed assets and has no template markers', async () => {
  const built = await readFile(
    new URL('../dist/sw.js', import.meta.url),
    'utf8',
  );
  assert.ok(!built.includes('__SHELL_VERSION__'));
  assert.ok(!built.includes('__SHELL_URLS__'));
  const urls = JSON.parse(built.match(/const shellUrls = (\[[^;]+\]);/)[1]);
  assert.ok(urls.some((url) => /\/assets\/.+\.js$/.test(url)));
  for (const url of urls.filter((url) => url !== '/'))
    await access(new URL(`../dist${url}`, import.meta.url));
});

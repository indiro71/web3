import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { stripTypeScriptTypes } from 'node:module';
import { readFile } from 'node:fs/promises';

const source = (
  await readFile(new URL('../src/api/push.ts', import.meta.url), 'utf8')
)
  .replace(/^import .* from ['"]\.\/pairs['"];\n/m, '')
  .replace(/^export /gm, '');
const script =
  stripTypeScriptTypes(source) +
  '\nglobalThis.api = { subscribeToPushNotifications, restorePushSubscription, getPushStatus, testPush };';
function client({
  permission = 'granted',
  existing = true,
  rotated = false,
  status = 200,
} = {}) {
  const calls = [];
  const key = new Uint8Array(65).fill(1);
  const subscription = {
    endpoint: 'https://fcm.googleapis.com/fake',
    options: {
      applicationServerKey: (rotated ? new Uint8Array(65).fill(2) : key).buffer,
    },
    unsubscribe: async () => {
      calls.push({ kind: 'unsubscribe' });
    },
    toJSON: () => ({
      endpoint: 'https://fcm.googleapis.com/fake',
      keys: { auth: 'fake', p256dh: 'fake' },
    }),
  };
  const registration = {
    pushManager: {
      getSubscription: async () => (existing ? subscription : null),
      subscribe: async () => {
        calls.push({ kind: 'subscribe' });
        return subscription;
      },
    },
  };
  const Notification = {
    permission,
    requestPermission: async () => {
      calls.push({ kind: 'permission' });
      Notification.permission = 'granted';
      return 'granted';
    },
  };
  const context = {
    API_BASE_URL: 'https://api.example',
    UnauthorizedError: class UnauthorizedError extends Error {},
    window: {
      isSecureContext: true,
      PushManager: class {},
      Notification,
      location: { origin: 'https://web3.example' },
      atob,
    },
    Notification,
    navigator: {
      userAgent: 'Chrome',
      platform: 'Linux',
      maxTouchPoints: 0,
      serviceWorker: {
        register: async () => registration,
        ready: Promise.resolve(registration),
      },
    },
    matchMedia: () => ({ matches: false }),
    AbortSignal,
    setTimeout,
    clearTimeout,
    fetch: async (url, options) => {
      calls.push({
        kind: 'fetch',
        url,
        body: options.body ? JSON.parse(options.body) : undefined,
      });
      return {
        status,
        ok: status === 200,
        json: async () => ({
          enabled: true,
          publicKey: Buffer.from(key).toString('base64url'),
          subscribed: true,
        }),
      };
    },
  };
  vm.runInNewContext(script, context);
  return { api: context.api, calls, Notification, context };
}

test('permission request happens in click before network or worker awaits', async () => {
  const instance = client({ permission: 'default', existing: false });
  const pending = instance.api.subscribeToPushNotifications('fake-token');
  assert.equal(instance.calls[0].kind, 'permission');
  await pending;
  const link = instance.calls.find((call) => call.url?.endsWith('/subscribe'));
  assert.equal(link.body.appUrl, 'https://web3.example');
});
test('automatic recovery never prompts for permission', async () => {
  const instance = client({ permission: 'default' });
  assert.equal(await instance.api.restorePushSubscription('fake-token'), null);
  assert.equal(instance.calls.length, 0);
});
test('existing permission and subscription are relinked without creating duplicates', async () => {
  const instance = client();
  await instance.api.restorePushSubscription('fake-token');
  assert.ok(instance.calls.find((call) => call.url?.endsWith('/subscribe')));
  assert.ok(
    !instance.calls.find((call) =>
      ['permission', 'subscribe', 'unsubscribe'].includes(call.kind),
    ),
  );
});
test('missing subscription is recreated when permission remains granted', async () => {
  const instance = client({ existing: false });
  await instance.api.restorePushSubscription('fake-token');
  assert.equal(
    instance.calls.filter((call) => call.kind === 'subscribe').length,
    1,
  );
});
test('rotated VAPID key replaces the obsolete browser subscription', async () => {
  const instance = client({ rotated: true });
  await instance.api.restorePushSubscription('fake-token');
  assert.equal(
    instance.calls.filter((call) => call.kind === 'unsubscribe').length,
    1,
  );
  assert.equal(
    instance.calls.filter((call) => call.kind === 'subscribe').length,
    1,
  );
});
test('failed backend registration is retryable on the next recovery', async () => {
  const instance = client({ status: 503 });
  await assert.rejects(instance.api.restorePushSubscription('fake-token'));
  await assert.rejects(instance.api.restorePushSubscription('fake-token'));
  assert.equal(
    instance.calls.filter((call) => call.url?.endsWith('/public-key')).length,
    2,
  );
});
test('iPhone outside installed PWA gets actionable instructions before any prompt', async () => {
  const instance = client({ permission: 'default' });
  instance.context.navigator.userAgent = 'iPhone';
  await assert.rejects(
    instance.api.subscribeToPushNotifications('fake-token'),
    /экран Домой/,
  );
  assert.equal(instance.calls.length, 0);
});
test('diagnostic status targets the requested event even if later trading events exist', async () => {
  const instance = client();
  const subscription = await instance.api.restorePushSubscription('fake-token');
  await instance.api.getPushStatus('fake-token', subscription, 'test-event');
  assert.equal(instance.calls.at(-1).body.eventId, 'test-event');
});

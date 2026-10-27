import { API_BASE_URL, UnauthorizedError } from './pairs';

interface PushPublicKeyResponse {
  enabled: boolean;
  publicKey: string | null;
}
export interface PushDeliveryStatus {
  subscribed: boolean;
  lastDelivery: {
    eventId: string;
    state: string;
    attempts: number;
    statusCode?: number;
    acceptedAt?: string;
  } | null;
}

const urlBase64ToUint8Array = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Uint8Array.from(
    window.atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4)),
    (char) => char.charCodeAt(0),
  );
};

const request = async (path: string, token: string, body?: unknown) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await response.json().catch(() => null);
  if (response.status === 401) throw new UnauthorizedError(data?.message);
  if (!response.ok)
    throw new Error(data?.message || 'Сервер уведомлений недоступен');
  return data;
};

export function pushSupportError(): string | null {
  if (!window.isSecureContext)
    return 'Для уведомлений откройте приложение по HTTPS';
  const ios =
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (
    ios &&
    !matchMedia('(display-mode: standalone)').matches &&
    !(navigator as Navigator & { standalone?: boolean }).standalone
  ) {
    return 'Добавьте приложение на экран Домой и откройте с его иконки';
  }
  if (
    !('serviceWorker' in navigator) ||
    !('PushManager' in window) ||
    !('Notification' in window)
  ) {
    return 'Этот браузер не поддерживает push-уведомления';
  }
  return null;
}

async function readyWorker() {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      (async () => {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          updateViaCache: 'none',
        });
        await navigator.serviceWorker.ready;
        return registration;
      })(),
      new Promise<ServiceWorkerRegistration>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                'Не удалось запустить уведомления. Откройте приложение заново',
              ),
            ),
          15_000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function getPushPublicKey(
  token: string,
): Promise<PushPublicKeyResponse> {
  return request('/push/public-key', token);
}

let subscriptionTask: Promise<PushSubscription> | null = null;
async function linkSubscription(token: string) {
  const key = await getPushPublicKey(token);
  if (!key.enabled || !key.publicKey)
    throw new Error('Уведомления пока не настроены на сервере');
  const registration = await readyWorker();
  let subscription = await registration.pushManager.getSubscription();
  const applicationServerKey = urlBase64ToUint8Array(key.publicKey);
  if (subscription?.options.applicationServerKey) {
    const existingKey = new Uint8Array(
      subscription.options.applicationServerKey,
    );
    if (
      existingKey.length !== applicationServerKey.length ||
      existingKey.some((value, index) => value !== applicationServerKey[index])
    ) {
      await subscription.unsubscribe();
      subscription = null;
    }
  }
  subscription ||= await registration.pushManager.subscribe({
    applicationServerKey,
    userVisibleOnly: true,
  });
  await request('/push/subscribe', token, {
    ...subscription.toJSON(),
    appUrl: window.location.origin,
  });
  return subscription;
}

// Called on startup/resume only when permission already exists. Never opens a permission prompt.
export async function restorePushSubscription(token: string) {
  const unsupported = pushSupportError();
  if (unsupported) throw new Error(unsupported);
  if (Notification.permission !== 'granted') return null;
  // Serialize browser subscription changes (including React StrictMode effects).
  const task = (subscriptionTask || Promise.resolve())
    .catch(() => undefined)
    .then(() => linkSubscription(token));
  subscriptionTask = task;
  try {
    return await task;
  } finally {
    if (subscriptionTask === task) subscriptionTask = null;
  }
}

export async function subscribeToPushNotifications(token: string) {
  const unsupported = pushSupportError();
  if (unsupported) throw new Error(unsupported);
  // Must run synchronously in the click handler, before network/worker awaits on iOS.
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    throw new Error(
      'Разрешите уведомления в настройках приложения или браузера',
    );
  return restorePushSubscription(token);
}

export async function testPush(
  token: string,
  subscription: PushSubscription,
): Promise<{ eventId: string }> {
  return request('/push/test', token, { endpoint: subscription.endpoint });
}
export async function getPushStatus(
  token: string,
  subscription: PushSubscription,
  eventId?: string,
): Promise<PushDeliveryStatus> {
  return request('/push/status', token, {
    endpoint: subscription.endpoint,
    eventId,
  });
}

export async function updateAppBadge(count: number) {
  if (count > 0) await navigator.setAppBadge?.(count);
  else await navigator.clearAppBadge?.();
}

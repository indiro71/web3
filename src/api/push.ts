import { API_BASE_URL, UnauthorizedError } from './pairs';

interface PushPublicKeyResponse {
  enabled: boolean;
  publicKey: string | null;
}

const readResponseBody = async (response: Response) => {
  try {
    return await response.json();
  } catch {
    return null;
  }
};

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
};

const request = async (path: string, token: string, options: RequestInit = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await readResponseBody(response);

  if (response.status === 401) {
    throw new UnauthorizedError(data?.message);
  }

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Push request failed');
  }

  return data;
};

export async function getPushPublicKey(token: string): Promise<PushPublicKeyResponse> {
  return request('/push/public-key', token);
}

export async function subscribeToPushNotifications(token: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  const publicKeyResponse = await getPushPublicKey(token);

  if (!publicKeyResponse.enabled || !publicKeyResponse.publicKey) {
    return false;
  }

  if ('Notification' in window && Notification.permission === 'denied') {
    return false;
  }

  if ('Notification' in window && Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      return false;
    }
  }

  const registration = await navigator.serviceWorker.ready;
  const existingSubscription = await registration.pushManager.getSubscription();
  const subscription = existingSubscription || await registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(publicKeyResponse.publicKey),
    userVisibleOnly: true,
  });

  await request('/push/subscribe', token, {
    body: JSON.stringify(subscription.toJSON()),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  return true;
}

export async function updateAppBadge(count: number) {
  const setAppBadge = navigator.setAppBadge?.bind(navigator);
  const clearAppBadge = navigator.clearAppBadge?.bind(navigator);

  if (!setAppBadge || !clearAppBadge) {
    return;
  }

  if (count > 0) {
    await setAppBadge(count);
    return;
  }

  await clearAppBadge();
}

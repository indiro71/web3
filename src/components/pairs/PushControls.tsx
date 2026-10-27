import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pushSupportError,
  restorePushSubscription,
  subscribeToPushNotifications,
} from '../../api/push';
import { UnauthorizedError } from '../../api/pairs';
import { RefreshButton } from './PairsDashboard.style';

export function PushControls({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const supportError = pushSupportError();
  const [needsPermission, setNeedsPermission] = useState(
    () => !supportError && Notification.permission === 'default',
  );
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const inFlight = useRef(false);

  const failed = useCallback(
    (error: unknown) => {
      if (!active.current) return;
      if (error instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      console.warn('Push registration unavailable; recovery will retry in the background');
    },
    [onUnauthorized],
  );

  useEffect(() => {
    active.current = true;
    const restore = async () => {
      if (document.hidden || inFlight.current || supportError) return;
      setNeedsPermission(Notification.permission === 'default');
      if (!navigator.onLine || Notification.permission !== 'granted') return;
      inFlight.current = true;
      try {
        await restorePushSubscription(token);
      } catch (error) {
        failed(error);
      } finally {
        inFlight.current = false;
      }
    };
    const resume = () => { void restore(); };
    void restore();
    const timer = window.setInterval(resume, 30_000);
    window.addEventListener('online', resume);
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active.current = false;
      clearInterval(timer);
      window.removeEventListener('online', resume);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [token, supportError, failed]);

  const enable = async () => {
    setBusy(true);
    try {
      // Request permission directly in the gesture, before network/worker awaits.
      await subscribeToPushNotifications(token);
    } catch (error) {
      failed(error);
    } finally {
      if (active.current) {
        setBusy(false);
        setNeedsPermission(!supportError && Notification.permission === 'default');
      }
    }
  };

  if (supportError || !needsPermission) return null;

  return (
    <RefreshButton type="button" onClick={enable} disabled={busy}>
      Включить уведомления
    </RefreshButton>
  );
}

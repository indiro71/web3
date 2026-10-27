import { useCallback, useEffect, useRef, useState } from 'react';
import {
  getPushStatus,
  pushSupportError,
  restorePushSubscription,
  subscribeToPushNotifications,
  testPush,
} from '../../api/push';
import { UnauthorizedError } from '../../api/pairs';
import { RefreshButton } from './PairsDashboard.style';
import styled from 'styled-components';

const Controls = styled.div`
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 0;
  color: ${({ theme }) => theme.colors.secondaryText};
  font-size: 0.8rem;
`;

export function PushControls({
  token,
  onUnauthorized,
}: {
  token: string;
  onUnauthorized: () => void;
}) {
  const [status, setStatus] = useState('Проверка уведомлений…');
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const subscription = useRef<PushSubscription | null>(null);
  const active = useRef(false);
  const inFlight = useRef(false);
  const testId = useRef<string | null>(null);
  const supportError = pushSupportError();

  const failed = useCallback(
    (error: unknown) => {
      if (!active.current) return;
      if (error instanceof UnauthorizedError) {
        onUnauthorized();
        return;
      }
      setConnected(false);
      setStatus(
        error instanceof Error
          ? error.message
          : 'Не удалось подключить уведомления',
      );
    },
    [onUnauthorized],
  );

  useEffect(() => {
    active.current = true;
    const restore = async () => {
      if (document.hidden || inFlight.current || testId.current) return;
      if (!navigator.onLine) {
        setConnected(false);
        setStatus('Нет сети — подключим уведомления после восстановления');
        return;
      }
      if (supportError) {
        setStatus(supportError);
        return;
      }
      if (Notification.permission !== 'granted') {
        setConnected(false);
        setStatus(
          Notification.permission === 'denied'
            ? 'Уведомления запрещены в настройках'
            : 'Уведомления не включены',
        );
        return;
      }
      inFlight.current = true;
      try {
        const restored = await restorePushSubscription(token);
        if (active.current) {
          subscription.current = restored;
          setConnected(Boolean(restored));
          setStatus(
            restored
              ? 'Уведомления подключены'
              : 'Нажмите «Включить уведомления»',
          );
        }
      } catch (error) {
        failed(error);
      } finally {
        inFlight.current = false;
      }
    };
    const resume = () => {
      void restore();
    };
    const offline = () => {
      setConnected(false);
      setStatus('Нет сети — уведомления ожидают подключения');
    };
    void restore();
    const timer = window.setInterval(resume, 30_000);
    window.addEventListener('online', resume);
    window.addEventListener('offline', offline);
    window.addEventListener('pageshow', resume);
    document.addEventListener('visibilitychange', resume);
    return () => {
      active.current = false;
      clearInterval(timer);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', offline);
      window.removeEventListener('pageshow', resume);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [token, supportError, failed]);

  useEffect(() => {
    if (!testing) return;
    let cancelled = false;
    const started = Date.now();
    const check = async () => {
      if (!subscription.current || document.hidden) return;
      if (Date.now() - started > 6 * 60_000) {
        testId.current = null;
        setTesting(false);
        setStatus('Проверка завершена. Повторите тест');
        return;
      }
      try {
        const result = await getPushStatus(
          token,
          subscription.current,
          testId.current || undefined,
        );
        if (cancelled) return;
        const delivery = result.lastDelivery;
        if (!result.subscribed) {
          testId.current = null;
          setTesting(false);
          setConnected(false);
          setStatus('Подписка удалена. Подключите уведомления заново');
        } else if (delivery?.eventId === testId.current) {
          if (delivery.state === 'accepted') {
            testId.current = null;
            setTesting(false);
            setStatus(
              'Push-сервис принял тест. Проверьте уведомление на устройстве',
            );
          } else if (
            ['failed', 'expired', 'unsubscribed'].includes(delivery.state)
          ) {
            testId.current = null;
            setTesting(false);
            setStatus(
              `Тест не отправлен (${
                delivery.statusCode || delivery.state
              }). Подключите уведомления заново`,
            );
          }
        }
      } catch (error) {
        if (!cancelled) {
          testId.current = null;
          setTesting(false);
          failed(error);
        }
      }
    };
    const timer = window.setInterval(() => {
      void check();
    }, 5000);
    const resume = () => {
      void check();
    };
    document.addEventListener('visibilitychange', resume);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', resume);
    };
  }, [testing, token, failed]);

  const enable = async () => {
    setBusy(true);
    try {
      // Call directly from the gesture; do not add an await before this call.
      const linked = await subscribeToPushNotifications(token);
      if (!active.current) return;
      subscription.current = linked;
      setConnected(Boolean(linked));
      setStatus('Уведомления подключены');
    } catch (error) {
      failed(error);
    } finally {
      if (active.current) setBusy(false);
    }
  };
  const test = async () => {
    if (!subscription.current) return;
    setBusy(true);
    try {
      const result = await testPush(token, subscription.current);
      if (!active.current) return;
      testId.current = result.eventId;
      setTesting(true);
      setStatus(
        'Тест поставлен в очередь: через 5 секунд — заблокируйте экран',
      );
    } catch (error) {
      failed(error);
    } finally {
      if (active.current) setBusy(false);
    }
  };
  return (
    <Controls aria-label="Уведомления">
      <span role="status">{status}</span>
      {!supportError && (
        <RefreshButton
          type="button"
          onClick={enable}
          disabled={busy || testing}
        >
          {connected ? 'Переподключить' : 'Включить уведомления'}
        </RefreshButton>
      )}
      {connected && (
        <RefreshButton type="button" onClick={test} disabled={busy || testing}>
          Тест push
        </RefreshButton>
      )}
    </Controls>
  );
}

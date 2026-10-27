import { useCallback, useEffect, useRef, useState } from 'react';
import {
  pushSupportError,
  restorePushSubscription,
  subscribeToPushNotifications,
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
  const active = useRef(false);
  const inFlight = useRef(false);
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
      if (document.hidden || inFlight.current) return;
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

  const enable = async () => {
    setBusy(true);
    try {
      // Call directly from the gesture; do not add an await before this call.
      const linked = await subscribeToPushNotifications(token);
      if (!active.current) return;
      setConnected(Boolean(linked));
      setStatus('Уведомления подключены');
    } catch (error) {
      failed(error);
    } finally {
      if (active.current) setBusy(false);
    }
  };
  if (connected) return null;

  return (
    <Controls aria-label="Уведомления">
      <span role="status">{status}</span>
      {!supportError && Notification.permission !== 'granted' && (
        <RefreshButton
          type="button"
          onClick={enable}
          disabled={busy}
        >
          Включить уведомления
        </RefreshButton>
      )}
    </Controls>
  );
}

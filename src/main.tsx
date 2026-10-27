import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const registerWorker = () => {
    void navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .catch((error: unknown) => {
        console.error('Service worker registration failed:', error);
      });
  };
  if (document.readyState === 'complete') registerWorker();
  else window.addEventListener('load', registerWorker, { once: true });
}

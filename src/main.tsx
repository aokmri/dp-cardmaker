import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

if (typeof window !== 'undefined') {
  window.addEventListener(
    'error',
    (event) => {
      const msg = event?.message || event?.error?.message || '';
      const name = event?.error?.name || '';
      if (
        name === 'SecurityError' ||
        msg.includes('Blocked a frame with origin') ||
        msg.includes('cross-origin frame')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event?.reason;
      const msg =
        typeof reason === 'string' ? reason : reason?.message || '';
      const name = reason?.name || '';
      if (
        name === 'SecurityError' ||
        msg.includes('Blocked a frame with origin') ||
        msg.includes('cross-origin frame')
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

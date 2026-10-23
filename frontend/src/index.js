import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/nunito';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { seedDemoOnce } from './lib/demo';

// the website copy shows a few children who have already played
if (process.env.REACT_APP_STATIC_SITE === '1') seedDemoOnce();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline support: the service worker keeps the app, pictures and voice on the tablet.
// Browsers only allow it on https or localhost; elsewhere the game simply stays online-only.
// the website copy (REACT_APP_STATIC_SITE) has no server for the offline worker to cache
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && window.isSecureContext && process.env.REACT_APP_STATIC_SITE !== '1') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Offline mode is unavailable:', error);
    });
    // ask the browser not to evict the cached voice when the tablet runs low on space
    navigator.storage?.persist?.().catch(() => {});
  });
}
reportWebVitals();

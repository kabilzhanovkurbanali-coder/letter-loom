import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource-variable/nunito';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Offline support: the service worker keeps the app, pictures and voice on the tablet.
// Browsers only allow it on https or localhost; elsewhere the game simply stays online-only.
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production' && window.isSecureContext) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('Offline mode is unavailable:', error);
    });
    // ask the browser not to evict the cached voice when the tablet runs low on space
    navigator.storage?.persist?.().catch(() => {});
  });
}
reportWebVitals();

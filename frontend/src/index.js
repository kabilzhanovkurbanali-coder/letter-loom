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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => registration.unregister());
    }).catch((error) => {
      console.error('Service worker cleanup failed:', error);
    });
  });
}
reportWebVitals();

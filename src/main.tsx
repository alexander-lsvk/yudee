import React from 'react';
import { createRoot } from 'react-dom/client';
import * as Sentry from "@sentry/react";
import App from './App';
import './i18n';
import './index.css';

Sentry.init({
  dsn: "https://bb2d6428c29e67ccf5ea851cef3c4671@o4509175211950080.ingest.us.sentry.io/4509175221321728", 
  integrations: [
    new Sentry.BrowserTracing({
      tracePropagationTargets: ["localhost", /^https:\/\/yourdomain\.com/],
    }),
    new Sentry.Replay(),
  ],
  tracesSampleRate: 1.0, // Adjust in production
  replaysSessionSampleRate: 0.1, // Adjust in production
  replaysOnErrorSampleRate: 1.0,
});

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
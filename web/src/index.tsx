import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import CaptureApp from './capture/App';
import Nui, { EventListener } from './Nui';
import './capture/capture.css';

if (!import.meta.env.PROD) {
  window.Nui = Nui;
}

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
    <CaptureApp />
    <EventListener />
  </React.StrictMode>,
);

import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import 'vexflow/bravura';

// Bravura and Academico are embedded in the local bundle, never fetched from a CDN.
await document.fonts.ready;
createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

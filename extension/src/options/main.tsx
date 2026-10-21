import React from 'react';
import ReactDOM from 'react-dom/client';
import { Settings } from './Settings';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <Settings />
    </React.StrictMode>
  );
}

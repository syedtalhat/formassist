import React from 'react';
import ReactDOM from 'react-dom/client';
import { Onboarding } from './Onboarding';

const rootEl = document.getElementById('root');
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <Onboarding />
    </React.StrictMode>
  );
}

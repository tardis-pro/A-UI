import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { StateProviderWithSync } from './state';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <StateProviderWithSync>
      <App />
    </StateProviderWithSync>
  </React.StrictMode>
);
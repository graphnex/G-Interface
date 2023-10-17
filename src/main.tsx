import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';

import App from './App';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        error: {
          duration: Infinity,
        },
      }}
    />
    <App />
  </React.StrictMode>,
);

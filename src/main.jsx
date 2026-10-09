import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/components/query-provider';
import { ConfirmProvider } from '@/hooks/use-confirm';
import App from './App';
import '@/app/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryProvider>
        <ConfirmProvider>
          <Toaster />
          <App />
        </ConfirmProvider>
      </QueryProvider>
    </BrowserRouter>
  </React.StrictMode>
);

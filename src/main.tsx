import { createRoot } from 'react-dom/client';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </HelmetProvider>
);

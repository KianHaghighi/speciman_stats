import type { AppProps } from 'next/app';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { ToastProvider } from '@/components/ui/Toaster';
import '@/styles/globals.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={queryClient}>
        <trpc.Provider client={trpc} queryClient={queryClient}>
          <ToastProvider>
            <Component {...pageProps} />
          </ToastProvider>
        </trpc.Provider>
      </QueryClientProvider>
    </SessionProvider>
  );
} 
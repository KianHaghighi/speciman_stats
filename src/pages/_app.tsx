import type { AppProps } from 'next/app';
import Head from 'next/head';
import { SessionProvider } from 'next-auth/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc, trpcClient } from '@/utils/trpc';
import { ToastProvider } from '@/components/ui/Toaster';
import '@/styles/globals.css';
import { useState } from 'react';

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  // Create a client per request to avoid sharing state between requests
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <SessionProvider session={session}>
      <Head>
        <title>SpecimenStats</title>
        <meta name="description" content="Track your fitness metrics and compete on the leaderboard" />
      </Head>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Component {...pageProps} />
          </ToastProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </SessionProvider>
  );
} 
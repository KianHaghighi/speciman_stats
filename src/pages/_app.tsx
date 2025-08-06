import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useEffect, useState, createContext, useContext, PropsWithChildren } from 'react';
import OnboardingModal from '@/components/OnboardingModal';
import { SessionProvider, useSession, signOut } from 'next-auth/react';
import { trpc } from '@/utils/trpc';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { signIn } from 'next-auth/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { logger } from '@/utils/logger';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        // Don't retry on 4xx errors
        if ((error as { data?: { code?: string } })?.data?.code === 'UNAUTHORIZED' || (error as { data?: { code?: string } })?.data?.code === 'FORBIDDEN') {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({ 
      url: '/api/trpc',
    }),
  ],
});

// Dark mode context
const DarkModeContext = createContext({ dark: false, toggle: () => {} });

function useDarkMode() {
  return useContext(DarkModeContext);
}

function DarkModeProvider({ children }: PropsWithChildren<unknown>) {
  const [dark, setDark] = useState(false);
  
  useEffect(() => {
    // Load dark mode preference from localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setDark(savedDarkMode === 'true');
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setDark(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [dark]);

  const toggle = () => setDark((d) => !d);
  
  return (
    <DarkModeContext.Provider value={{ dark, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

function LandingPage() {
  const sections = [
    {
      title: 'Track Metrics',
      desc: `Create custom metrics to track your progress. Whether it's weight, reps, or personal records.`,
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      href: '/metrics',
    },
    {
      title: 'Leaderboards',
      desc: `Compete with friends and see who's making the most progress. Stay motivated with friendly competition.`,
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/leaderboard',
    },
    {
      title: 'Community',
      desc: `Join a community of like-minded individuals. Share your progress and support others on their journey.`,
      icon: (
        <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/community',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-blue-700 dark:text-blue-200 transition-colors duration-300 relative">
      {/* Main Content */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-extrabold mb-8 text-blue-600 dark:text-blue-400 tracking-tight futuristic-glow">SpecimenStats</h1>
        <p className="mb-8 text-xl text-blue-400 dark:text-blue-200 text-center max-w-xl">
          Track your progress, compete with friends, and achieve your fitness goals. 
          <span className="block mt-2 font-semibold text-blue-500">Sign in with Discord to get started!</span>
        </p>
        
        {/* Prominent Sign In Button */}
        <div className="mb-12">
          <button
            onClick={() => {
              logger.authEvent('sign_in_attempt', undefined, { provider: 'discord' });
              signIn('discord', { callbackUrl: '/' });
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-4 rounded-2xl text-2xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105"
          >
            Sign In with Discord
          </button>
          <p className="mt-4 text-sm text-blue-300 dark:text-blue-400">
            Join thousands of athletes tracking their progress
          </p>
        </div>
      </div>

      {/* Features Preview */}
      <div className="w-full max-w-5xl px-4">
        <h2 className="text-2xl font-bold text-center mb-8 text-blue-600 dark:text-blue-400">
          What you can do with SpecimenStats
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {sections.map((section) => (
            <div
              key={section.title}
              className="bg-white dark:bg-[#181828] rounded-2xl shadow-lg p-8 border border-blue-400 hover:border-blue-600 transition-all duration-200 group cursor-pointer flex flex-col items-start"
              style={{ boxShadow: '0 2px 16px 0 rgba(37,99,235,0.08)' }}
            >
              <div className="inline-flex items-center justify-center p-3 bg-blue-500 dark:bg-blue-700 rounded-md shadow-lg mb-4 group-hover:scale-110 transition-transform duration-200">
                {section.icon}
              </div>
              <h3 className="mt-2 text-lg font-semibold text-blue-900 dark:text-blue-200 tracking-tight">{section.title}</h3>
              <p className="mt-3 text-base text-blue-500 dark:text-blue-300 text-left">{section.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AppContent({ Component, pageProps }: AppProps) {
  const { data: session, status, update } = useSession();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (session && !session.user?.id) {
      logger.warn('Invalid session detected - missing user ID', { session });
      signOut({ callbackUrl: '/' });
    } else if (session?.user && (!session.user.class || !session.user.age)) {
      logger.info('New user needs onboarding', { userId: session.user.id });
      setShowOnboarding(true);
    } else {
      setShowOnboarding(false);
    }
  }, [session, status]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-200">
        <div className="text-center">
          <div className="text-5xl font-extrabold text-white mb-8 drop-shadow-lg">
            SPECIMENSTATS
          </div>
          <div className="text-xl text-white font-bold">
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!session || !session.user?.id) {
    return <LandingPage />;
  }
  
  return (
    <>
      <OnboardingModal 
        open={showOnboarding} 
        onFinish={() => { 
          setShowOnboarding(false); 
          update(); 
          logger.info('Onboarding completed', { userId: session.user.id });
        }} 
      />
      <Component {...pageProps} />
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <ErrorBoundary>
      <DarkModeProvider>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <SessionProvider 
              session={props.pageProps.session}
              refetchInterval={5 * 60} // Refetch session every 5 minutes
              refetchOnWindowFocus={true}
            >
              <AppContent {...props} />
            </SessionProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </DarkModeProvider>
    </ErrorBoundary>
  );
}

export { useDarkMode }; 
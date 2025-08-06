import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import { SettingsModal } from '../auth';
import { logger } from '@/utils/logger';

export default function SignInPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (session) {
      logger.authEvent('redirect_after_signin', session.user?.id);
      router.replace('/');
    }
  }, [session, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-white">Loading…</div>;
  }

  if (session) {
    return null;
  }

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      logger.authEvent('sign_in_attempt', undefined, { provider: 'discord', page: 'signin' });
      await signIn('discord', { callbackUrl: '/' });
    } catch (error) {
      logger.error('Sign in failed', error as Error, { provider: 'discord' });
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-blue-700 dark:text-blue-200 transition-colors duration-300 relative">
      {/* Settings Button */}
      <button
        className="absolute top-8 right-8 p-3 rounded-full bg-blue-100 dark:bg-[#23234a] hover:bg-blue-200 dark:hover:bg-blue-700 shadow-md transition-all duration-200"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
      >
        <FiSettings className="h-6 w-6 text-blue-700 dark:text-blue-200" />
      </button>

      {/* Main Content */}
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-extrabold mb-6 text-blue-600 dark:text-blue-400 tracking-tight">
          Welcome to SpecimenStats
        </h1>
        
        <p className="mb-8 text-lg text-blue-400 dark:text-blue-200">
          Track your fitness progress, compete with friends, and achieve your goals.
        </p>

        {/* Sign In Button */}
        <div className="mb-8">
          <button
            onClick={handleSignIn}
            disabled={isSigningIn}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-4 rounded-2xl text-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 disabled:transform-none"
          >
            {isSigningIn ? 'Signing In...' : 'Sign In with Discord'}
          </button>
        </div>

        {/* Benefits */}
        <div className="text-left space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 dark:text-blue-400">Track Your Progress</h3>
              <p className="text-sm text-blue-400 dark:text-blue-300">Monitor your fitness metrics and see your improvement over time</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 dark:text-blue-400">Compete with Friends</h3>
              <p className="text-sm text-blue-400 dark:text-blue-300">Join leaderboards and challenge your friends to stay motivated</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-blue-600 dark:text-blue-400">Join the Community</h3>
              <p className="text-sm text-blue-400 dark:text-blue-300">Connect with like-minded athletes and share your journey</p>
            </div>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-400 dark:text-blue-300 hover:text-blue-600 dark:hover:text-blue-200 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
} 
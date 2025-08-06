import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { logger } from '@/utils/logger';

export default function AuthErrorPage() {
  const router = useRouter();
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const { error: errorParam } = router.query;
    
    if (errorParam) {
      logger.error('Authentication error', new Error(errorParam as string), { error: errorParam });
      
      switch (errorParam) {
        case 'Configuration':
          setError('There is a problem with the server configuration. Please contact support.');
          break;
        case 'AccessDenied':
          setError('You do not have permission to sign in. Please try again or contact support.');
          break;
        case 'Verification':
          setError('The verification token has expired or has already been used. Please try signing in again.');
          break;
        case 'Default':
        default:
          setError('An unexpected error occurred during sign in. Please try again.');
          break;
      }
    }
  }, [router.query]);

  const handleRetry = () => {
    logger.authEvent('retry_signin_after_error', undefined, { error });
    signIn('discord', { callbackUrl: '/' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-black text-blue-700 dark:text-blue-200 transition-colors duration-300">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-red-600 dark:text-red-400 mb-4">
            Sign In Error
          </h1>
          <p className="text-lg text-blue-400 dark:text-blue-200 mb-6">
            {error || 'An error occurred during sign in.'}
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-lg font-semibold shadow-lg transition-all duration-200"
          >
            Try Again
          </button>
          
          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 px-6 py-3 rounded-xl text-lg font-semibold transition-all duration-200"
          >
            Back to Home
          </button>
        </div>

        <div className="mt-8 text-sm text-blue-300 dark:text-blue-400">
          <p>If this problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
} 
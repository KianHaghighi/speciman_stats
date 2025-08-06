import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';
import { signIn, signOut } from 'next-auth/react';
import { trpc } from '@/utils/trpc';

interface SpecimenLevel {
  elo: number;
  tier: string;
  classElos?: Record<string, number>;
  percentiles?: Array<{ metricId: number; metricName: string; percentile: number }>;
  rank: number;
}

export function Navbar() {
  const router = useRouter();
  const { user } = useUser();

  // Fetch Elo/rank/tier if logged in
  const specimenLevelQuery = typeof user?.id === 'string'
    ? trpc.user.specimenLevel.useQuery({ id: user.id })
    : { data: undefined };
  const specimenLevel = specimenLevelQuery.data as SpecimenLevel | undefined;

  const isActive = (path: string) => router.pathname === path;

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-800">
                SpecimenStats
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/metrics"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/metrics')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Metrics
              </Link>
              <Link
                href="/leaderboard"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/leaderboard')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Leaderboard
              </Link>
              <Link
                href="/specimens"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/specimens')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                Specimens
              </Link>
              <Link
                href="/specimen/me"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/specimen/me')
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`}
              >
                My Specimen
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            {/* Elo/Rank/Tier display */}
            {specimenLevel && (
              <div className="flex flex-col items-end mr-4">
                <span className="text-xs text-gray-700 font-bold">Elo: <span className="text-blue-600">{specimenLevel.elo}</span></span>
                <span className="text-xs text-gray-700">Rank: <span className="text-blue-600">#{specimenLevel.rank}</span></span>
                <span className="text-xs text-gray-700">Tier: <span className="font-bold text-purple-600">{specimenLevel.tier}</span></span>
              </div>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{user.name}</span>
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('discord')}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
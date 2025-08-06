import React from 'react';
import Link from 'next/link';
import { useUser } from '@/hooks/useUser';

export default function Dashboard() {
  const { user } = useUser();
  return (
    <main className="p-4 min-h-screen">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold">Dashboard</h2>
        {user ? (
          <span className="text-xs text-gray-300">{user.email}</span>
        ) : (
          <Link href="/">
            <button className="py-1 px-3 bg-blue-600 text-white rounded">Sign in</button>
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="font-semibold mb-2">Today&apos;s PRs</h3>
          <ul className="text-sm text-gray-700">
            <li>100m Dash: 12.3s</li>
            <li>Bench Press: 110kg</li>
          </ul>
        </div>
        <div className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
          <h3 className="font-semibold mb-2">Specimen Score</h3>
          <span className="text-3xl font-bold text-blue-600">82</span>
        </div>
        <Link href="/metrics">
          <button className="fixed bottom-6 right-6 bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg text-3xl">
            +
          </button>
        </Link>
      </div>
    </main>
  );
} 
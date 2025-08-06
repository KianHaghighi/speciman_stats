import React from 'react';

export default function ProfileUser() {
  // Placeholder data
  const badges = ['🥉', '🥈', '🥇', '💎', '🐉', '👑'];
  return (
    <main className="p-4 min-h-screen">
      <h2 className="text-xl font-bold mb-4">Your Profile</h2>
      <div className="bg-white rounded shadow p-4 mb-4">
        <h3 className="font-semibold mb-2">Progress Charts</h3>
        <div className="h-32 bg-gray-100 rounded flex items-center justify-center text-gray-400">[Chart Placeholder]</div>
      </div>
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-semibold mb-2">Badges</h3>
        <div className="flex gap-2 text-2xl">
          {badges.map((b, i) => <span key={i}>{b}</span>)}
        </div>
      </div>
    </main>
  );
} 
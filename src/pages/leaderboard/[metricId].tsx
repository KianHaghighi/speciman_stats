import React, { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { motion, AnimatePresence } from 'framer-motion';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

type LeaderboardBackendEntry = {
  user_id?: string;
  user?: {
    id?: string;
    name?: string | null;
    image?: string | null;
    class?: string | null;
    sex?: string | null;
    tier?: string | null;
  } | null;
  elo?: number | null;
  value?: number;
};

interface Metric {
  id: number;
  name: string;
  unit: string;
  category: string;
}

interface User {
  id: string;
  name: string | null;
  image: string | null;
  class: string | null;
  sex: string | null;
  tier: string | null;
  entries?: Array<{
    metric?: {
      name: string;
    };
    percentile?: number;
  }>;
}

const classEmojis: Record<string, string> = {
  'The Titan': '💪',
  'The Beast': '🦍',
  'Bodyweight Master': '🧗',
  'Super Athlete': '⚡',
  'Hunter Gatherer': '🏃',
};
const tierColors: Record<string, string> = {
  Tin: 'bg-gray-400',
  Bronze: 'bg-amber-600',
  Silver: 'bg-gray-300',
  Gold: 'bg-yellow-400',
  Platinum: 'bg-blue-400',
  Diamond: 'bg-purple-400',
  Bionic: 'bg-green-400',
};

export default function LeaderboardMetric() {
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSex, setSelectedSex] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedMetric, setSelectedMetric] = useState('');
  const [compareUser, setCompareUser] = useState<LeaderboardBackendEntry | null>(null);
  const { data: leaderboard } = trpc.metrics.leaderboard.useQuery({ metricId: Number(selectedMetric) || 1 });
  const { data: metrics } = trpc.metrics.all.useQuery();
  const { data: user } = trpc.user.me.useQuery();

  // Filter leaderboard by class, sex, tier
  const filtered = (leaderboard ?? []).filter((row: LeaderboardBackendEntry) => {
    if (selectedClass && (!row.user || row.user.class !== selectedClass)) return false;
    if (selectedSex && (!row.user || row.user.sex !== selectedSex)) return false;
    if (selectedTier && (!row.user || row.user.tier !== selectedTier)) return false;
    return true;
  });

  return (
    <main className="p-4 min-h-screen bg-[#0d0d0d]">
      <h2 className="text-xl font-bold mb-4 text-white">Leaderboard</h2>
      <div className="flex flex-wrap gap-4 mb-6">
        <select className="p-2 rounded bg-[#181828] text-white" value={selectedMetric} onChange={e => setSelectedMetric(e.target.value)}>
          <option value="">All Metrics</option>
          {metrics?.map((m: Metric) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
        <select className="p-2 rounded bg-[#181828] text-white" value={selectedClass} onChange={e => setSelectedClass(e.target.value)}>
          <option value="">All Classes</option>
          {Object.keys(classEmojis).map(c => (
            <option key={c} value={c}>{classEmojis[c]} {c}</option>
          ))}
        </select>
        <select className="p-2 rounded bg-[#181828] text-white" value={selectedSex} onChange={e => setSelectedSex(e.target.value)}>
          <option value="">All Sexes</option>
          <option value="M">♂️ Male</option>
          <option value="F">♀️ Female</option>
        </select>
        <select className="p-2 rounded bg-[#181828] text-white" value={selectedTier} onChange={e => setSelectedTier(e.target.value)}>
          <option value="">All Tiers</option>
          {Object.keys(tierColors).map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="bg-[#181828] rounded-xl shadow-lg overflow-x-auto">
        <table className="w-full text-white text-sm">
          <thead>
            <tr className="border-b border-[#23234a]">
              <th className="p-2">#</th>
              <th className="p-2">Avatar</th>
              <th className="p-2">Username</th>
              <th className="p-2">Class</th>
              <th className="p-2">Tier</th>
              <th className="p-2">ELO</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row: LeaderboardBackendEntry, i: number) => (
              <tr key={row.user_id || i} className="hover:bg-[#23234a] cursor-pointer transition-all" onClick={() => setCompareUser(row)}>
                <td className="p-2 font-bold">{i + 1}</td>
                <td className="p-2"><img src={row.user?.image || ''} alt="avatar" className="w-8 h-8 rounded-full" /></td>
                <td className="p-2 font-semibold">{row.user?.name || ''}</td>
                <td className="p-2 text-2xl">{classEmojis[row.user?.class || ''] || '\u2753'}</td>
                <td className="p-2"><span className={`px-2 py-1 rounded ${tierColors[row.user?.tier || ''] || 'bg-gray-600'} text-xs font-bold`}>{row.user?.tier || ''}</span></td>
                <td className="p-2 font-mono text-blue-400">{row.elo || row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Side-panel Specimen Compare */}
      <AnimatePresence>
        {compareUser && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', duration: 0.7 }}
            className="fixed top-0 right-0 w-full max-w-lg h-full bg-[#181828] shadow-2xl z-50 p-8 overflow-y-auto"
          >
            <button className="absolute top-4 right-4 text-white text-2xl" onClick={() => setCompareUser(null)}>×</button>
            <div className="flex items-center gap-4 mb-6">
              <img src={compareUser.user?.image || ''} alt="avatar" className="w-16 h-16 rounded-full" />
              <div>
                <div className="text-2xl font-bold text-white">{compareUser.user?.name}</div>
                <div className="text-lg">{classEmojis[compareUser.user?.class || ''] || '❓'} {compareUser.user?.class}</div>
                <div className="text-sm"><span className={`px-2 py-1 rounded ${tierColors[compareUser.user?.tier || ''] || 'bg-gray-600'} text-xs font-bold`}>{compareUser.user?.tier}</span></div>
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-4">Specimen Compare</h3>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData(compareUser, user)}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="category" stroke="#aaa" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#aaa" />
                <Radar name="You" dataKey="user" stroke="#a259ff" fill="#a259ff" fillOpacity={0.4} />
                <Radar name="Specimen" dataKey="compare" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.3} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

// Helper to generate radar chart data
function getRadarData(compareUser: LeaderboardBackendEntry, user: User | undefined) {
  // Define categories and their associated metric names
  const categoryMap: Record<string, string[]> = {
    Strength: ['Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Front Squat', 'Romanian Deadlift', 'Incline Bench Press', 'Barbell Row', 'Power Clean', 'Snatch'],
    Endurance: ['Mile Run', '5k Run', '10k Run', 'Half Marathon', 'Marathon'],
    Power: ['100m Dash', '400m Dash', 'Box Jump (24")', 'Power Clean', 'Snatch'],
    Mobility: ['Plank', 'Side Plank', 'Hollow Hold', 'Arch Hold', 'L-sit Hold', 'Planche Hold', 'Front Lever Hold', 'Back Lever Hold'],
    Bodyweight: ['Pull-ups', 'Push-ups', 'Dips', 'Chin-ups', 'Muscle-ups', 'Handstand Push-ups', 'Burpees'],
  };
  // Helper to get best percentile for a user in a category
  function getCategoryPercentile(u: User | undefined, cat: string) {
    if (!u?.entries) return 0;
    const relevant = u.entries.filter((e) => categoryMap[cat].includes(e.metric?.name || ''));
    if (!relevant.length) return 0;
    // Use percentile if available, else estimate from value
    const best = Math.max(...relevant.map((e) => e.percentile ?? 0));
    return Math.round(best * 100);
  }
  return Object.keys(categoryMap).map(cat => ({
    category: cat,
    user: getCategoryPercentile(user, cat),
    compare: getCategoryPercentile(compareUser.user as User, cat),
  }));
} 
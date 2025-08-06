import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface Metric {
  id: number;
  name: string;
  unit: string;
}

type LeaderboardBackendEntry = {
  id?: string;
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
  value?: number;
};

export default function LeaderboardPage() {
  const { data: metrics } = trpc.metrics.all.useQuery();
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const { data: leaderboard, isLoading } = trpc.metrics.leaderboard.useQuery(
    { metricId: selectedMetric ? Number(selectedMetric) : 1 }
  );

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <h1 className="text-4xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
        Leaderboard
      </h1>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <label className="block text-white text-lg mb-2">Select Metric</label>
          <select
            className="w-full p-2 rounded bg-gray-800 text-white border border-blue-500"
            onChange={(e) => setSelectedMetric(e.target.value)}
            value={selectedMetric || ''}
          >
            <option value="">Select a metric</option>
            {metrics?.map((metric: Metric) => (
              <option key={metric.id} value={metric.id}>
                {metric.name}
              </option>
            ))}
          </select>
        </div>
        {isLoading ? (
          <div className="text-center text-white">Loading...</div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {leaderboard?.map((entry: LeaderboardBackendEntry, index: number) => (
              <motion.div
                key={entry.id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-between"
              >
                <div className="flex items-center">
                  <span className="text-2xl font-bold text-blue-500 mr-4">#{index + 1}</span>
                  <img src={entry.user?.image || ''} alt={entry.user?.name || ''} className="w-10 h-10 rounded-full mr-4" />
                  <span className="text-white text-lg">{entry.user?.name || ''}</span>
                </div>
                <span className="text-blue-400 text-lg">{entry.value}</span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </main>
  );
} 
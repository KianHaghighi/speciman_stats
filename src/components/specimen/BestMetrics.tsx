import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Target } from 'lucide-react';
import { trpc } from '@/utils/trpc';

interface BestMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  rank: 'Tin' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Bionic';
  elo: number;
  percentile: number;
  change: number;
}

const rankConfig = {
  Tin: { color: 'bg-amber-800', text: 'text-amber-800', bg: 'bg-amber-50' },
  Bronze: { color: 'bg-amber-600', text: 'text-amber-600', bg: 'bg-amber-50' },
  Silver: { color: 'bg-gray-500', text: 'text-gray-600', bg: 'bg-gray-50' },
  Gold: { color: 'bg-yellow-500', text: 'text-yellow-600', bg: 'bg-yellow-50' },
  Platinum: { color: 'bg-gray-300', text: 'text-gray-700', bg: 'bg-gray-50' },
  Diamond: { color: 'bg-cyan-400', text: 'text-cyan-600', bg: 'bg-cyan-50' },
  Bionic: { color: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' },
};

export default function BestMetrics() {
  const { data: userData } = trpc.user.me.useQuery();

  // Mock best metrics data
  const bestMetrics: BestMetric[] = [
    {
      id: '1',
      name: 'Deadlift',
      value: 405,
      unit: 'lbs',
      rank: 'Diamond',
      elo: 1850,
      percentile: 95,
      change: 12.5,
    },
    {
      id: '2',
      name: 'Squat',
      value: 365,
      unit: 'lbs',
      rank: 'Platinum',
      elo: 1750,
      percentile: 88,
      change: 8.2,
    },
    {
      id: '3',
      name: 'Bench Press',
      value: 275,
      unit: 'lbs',
      rank: 'Gold',
      elo: 1650,
      percentile: 82,
      change: 5.7,
    },
    {
      id: '4',
      name: '5K Run',
      value: 19.5,
      unit: 'min',
      rank: 'Gold',
      elo: 1620,
      percentile: 78,
      change: -2.1,
    },
    {
      id: '5',
      name: 'Pull-ups',
      value: 22,
      unit: 'reps',
      rank: 'Silver',
      elo: 1550,
      percentile: 72,
      change: 15.3,
    },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Trophy className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Best 5 Metrics</h3>
          <p className="text-sm text-gray-500">Your top performing exercises</p>
        </div>
      </div>

      {/* Metrics List */}
      <div className="space-y-4">
        {bestMetrics.map((metric, index) => {
          const rank = rankConfig[metric.rank];
          
          return (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors"
            >
              {/* Rank Badge */}
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full ${rank.bg} flex items-center justify-center`}>
                  <span className={`text-xs font-bold ${rank.text}`}>#{index + 1}</span>
                </div>
              </div>

              {/* Metric Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{metric.name}</span>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${rank.bg} ${rank.text}`}>
                    {metric.rank}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="font-semibold">
                    {metric.value} {metric.unit}
                  </span>
                  <span>•</span>
                  <span>Top {metric.percentile}%</span>
                  <span>•</span>
                  <span>ELO {metric.elo}</span>
                </div>
              </div>

              {/* Change Indicator */}
              <div className="flex items-center gap-1">
                {metric.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingUp className="w-4 h-4 text-red-500 transform rotate-180" />
                )}
                <span className={`text-sm font-medium ${
                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600">
              {bestMetrics.filter(m => m.rank === 'Diamond' || m.rank === 'Bionic').length}
            </div>
            <div className="text-sm text-gray-600">Elite</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {bestMetrics.filter(m => m.rank === 'Platinum' || m.rank === 'Gold').length}
            </div>
            <div className="text-sm text-gray-600">Advanced</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {bestMetrics.filter(m => m.rank === 'Silver' || m.rank === 'Bronze').length}
            </div>
            <div className="text-sm text-gray-600">Intermediate</div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-6 text-center">
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Target className="w-4 h-4" />
          View All Metrics
        </button>
      </div>
    </div>
  );
}

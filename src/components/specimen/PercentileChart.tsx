import { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Target, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/utils/trpc';

interface MetricPercentile {
  id: string;
  name: string;
  percentile: number;
  value: number;
  unit: string;
  rank: string;
  change: number;
}

export default function PercentileChart() {
  const [selectedMetric, setSelectedMetric] = useState<string>('deadlift');
  const { data: userData } = trpc.user.me.useQuery();

  // Mock percentile data for different metrics
  const metricsData: Record<string, MetricPercentile[]> = {
    deadlift: [
      { id: '1', name: 'Deadlift', percentile: 95, value: 405, unit: 'lbs', rank: 'Diamond', change: 12.5 },
      { id: '2', name: 'Deadlift', percentile: 92, value: 385, unit: 'lbs', rank: 'Diamond', change: 8.2 },
      { id: '3', name: 'Deadlift', percentile: 88, value: 365, unit: 'lbs', rank: 'Platinum', change: 5.7 },
      { id: '4', name: 'Deadlift', percentile: 85, value: 345, unit: 'lbs', rank: 'Platinum', change: 3.1 },
      { id: '5', name: 'Deadlift', percentile: 82, value: 325, unit: 'lbs', rank: 'Gold', change: 1.8 },
    ],
    squat: [
      { id: '1', name: 'Squat', percentile: 88, value: 365, unit: 'lbs', rank: 'Platinum', change: 8.2 },
      { id: '2', name: 'Squat', percentile: 85, value: 345, unit: 'lbs', rank: 'Platinum', change: 6.5 },
      { id: '3', name: 'Squat', percentile: 82, value: 325, unit: 'lbs', rank: 'Gold', change: 4.8 },
      { id: '4', name: 'Squat', percentile: 78, value: 305, unit: 'lbs', rank: 'Gold', change: 2.9 },
      { id: '5', name: 'Squat', percentile: 75, value: 285, unit: 'lbs', rank: 'Silver', change: 1.2 },
    ],
    bench: [
      { id: '1', name: 'Bench Press', percentile: 82, value: 275, unit: 'lbs', rank: 'Gold', change: 5.7 },
      { id: '2', name: 'Bench Press', percentile: 78, value: 255, unit: 'lbs', rank: 'Gold', change: 4.1 },
      { id: '3', name: 'Bench Press', percentile: 75, value: 235, unit: 'lbs', rank: 'Silver', change: 2.8 },
      { id: '4', name: 'Bench Press', percentile: 72, value: 215, unit: 'lbs', rank: 'Silver', change: 1.5 },
      { id: '5', name: 'Bench Press', percentile: 68, value: 195, unit: 'lbs', rank: 'Bronze', change: 0.8 },
    ],
    run: [
      { id: '1', name: '5K Run', percentile: 78, value: 19.5, unit: 'min', rank: 'Gold', change: -2.1 },
      { id: '2', name: '5K Run', percentile: 75, value: 20.2, unit: 'min', rank: 'Gold', change: -1.8 },
      { id: '3', name: '5K Run', percentile: 72, value: 21.1, unit: 'min', rank: 'Silver', change: -1.2 },
      { id: '4', name: '5K Run', percentile: 68, value: 22.0, unit: 'min', rank: 'Silver', change: -0.7 },
      { id: '5', name: '5K Run', percentile: 65, value: 23.2, unit: 'min', rank: 'Bronze', change: 0.3 },
    ],
    pullups: [
      { id: '1', name: 'Pull-ups', percentile: 72, value: 22, unit: 'reps', rank: 'Silver', change: 15.3 },
      { id: '2', name: 'Pull-ups', percentile: 68, value: 20, unit: 'reps', rank: 'Silver', change: 12.8 },
      { id: '3', name: 'Pull-ups', percentile: 65, value: 18, unit: 'reps', rank: 'Bronze', change: 9.5 },
      { id: '4', name: 'Pull-ups', percentile: 62, value: 16, unit: 'reps', rank: 'Bronze', change: 6.2 },
      { id: '5', name: 'Pull-ups', percentile: 58, value: 14, unit: 'reps', rank: 'Tin', change: 3.8 },
    ],
  };

  const currentData = metricsData[selectedMetric] || [];
  const currentMetric = currentData[0];

  const metricOptions = [
    { key: 'deadlift', label: 'Deadlift', icon: '🏋️' },
    { key: 'squat', label: 'Squat', icon: '🦵' },
    { key: 'bench', label: 'Bench Press', icon: '💪' },
    { key: 'run', label: '5K Run', icon: '🏃' },
    { key: 'pullups', label: 'Pull-ups', icon: '🎯' },
  ];

  // Prepare chart data
  const chartData = currentData.map((entry, index) => ({
    entry: `Entry ${index + 1}`,
    percentile: entry.percentile,
    value: entry.value,
    rank: entry.rank,
  }));

  const getRankColor = (rank: string) => {
    const colors: Record<string, string> = {
      Tin: '#8B7355',
      Bronze: '#CD7F32',
      Silver: '#C0C0C0',
      Gold: '#FFD700',
      Platinum: '#E5E4E2',
      Diamond: '#B9F2FF',
      Bionic: '#FF6B6B',
    };
    return colors[rank] || '#6B7280';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header with Metric Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Percentile Performance</h3>
          <p className="text-sm text-gray-500">Track your progress over time</p>
        </div>
        
        {/* Metric Selector */}
        <div className="flex gap-2">
          {metricOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedMetric(option.key)}
              className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                selectedMetric === option.key
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="mr-1">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Current Metric Summary */}
      {currentMetric && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 font-medium">{currentMetric.name}</div>
              <div className="text-2xl font-bold text-gray-900">
                {currentMetric.value} {currentMetric.unit}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Current Percentile</div>
              <div className="text-2xl font-bold text-blue-600">{currentMetric.percentile}%</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${currentMetric.percentile}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="entry" 
              stroke="#9ca3af"
              fontSize={12}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              domain={[0, 100]}
              label={{ value: 'Percentile', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              formatter={(value: number, name: string, props: any) => [
                `${value}%`,
                `Percentile (${props.payload.rank})`
              ]}
            />
            <Bar
              dataKey="percentile"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Entries */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Entries</h4>
        <div className="space-y-2">
          {currentData.slice(0, 3).map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getRankColor(entry.rank) }}
                ></div>
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {entry.value} {entry.unit}
                  </div>
                  <div className="text-xs text-gray-500">{entry.rank} Rank</div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-900">
                  {entry.percentile}%
                </span>
                {entry.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs font-medium ${
                  entry.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {entry.change > 0 ? '+' : ''}{entry.change}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

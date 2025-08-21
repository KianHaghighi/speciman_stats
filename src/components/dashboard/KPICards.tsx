import { motion } from 'framer-motion';
import { Trophy, Crown, MapPin, Target, TrendingUp, TrendingDown } from 'lucide-react';
import { trpc } from '@/utils/trpc';

export default function KPICards() {
  const { data: userData } = trpc.user.me.useQuery();
  const { data: metrics } = trpc.metrics.all.useQuery();
  const { data: userEntries } = trpc.metrics.userEntries.useQuery();

  const overallElo = userData?.overallElo || 1500;
  const classElo = userData?.primaryClassId ? 1520 : 1500;
  const gymRank = userData?.gymId ? Math.floor(Math.random() * 150) + 1 : 0;
  const activeMetrics = userEntries?.length || 0;

  // Mock data for demonstration
  const bestMetrics = [
    { name: 'Bench Press', value: 225, unit: 'lbs', rank: 3, change: 5.2 },
    { name: 'Deadlift', value: 315, unit: 'lbs', rank: 7, change: 3.1 },
    { name: 'Squat', value: 275, unit: 'lbs', rank: 12, change: -1.5 },
    { name: 'Pull-ups', value: 15, unit: 'reps', rank: 18, change: 8.7 },
    { name: '5K Run', value: 22.5, unit: 'min', rank: 25, change: 2.3 },
  ];

  const kpiData = [
    {
      title: 'Overall ELO',
      value: overallElo,
      subtitle: 'Your total ranking',
      change: 2.5,
      icon: Trophy,
      color: 'blue',
    },
    {
      title: 'Class ELO',
      value: classElo,
      subtitle: 'Class-specific ranking',
      change: 1.8,
      icon: Crown,
      color: 'purple',
    },
    {
      title: 'Gym Rank',
      value: gymRank ? `#${gymRank}` : 'N/A',
      subtitle: 'Among gym members',
      change: -0.5,
      icon: MapPin,
      color: 'green',
    },
    {
      title: 'Active Metrics',
      value: activeMetrics,
      subtitle: 'Tracked this month',
      change: 12.5,
      icon: Target,
      color: 'orange',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <motion.div
            key={kpi.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg bg-${kpi.color}-100`}>
                <kpi.icon className={`w-6 h-6 text-${kpi.color}-600`} />
              </div>
              <div className="flex items-center gap-1">
                {kpi.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  kpi.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {kpi.change > 0 ? '+' : ''}{kpi.change}%
                </span>
              </div>
            </div>
            
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {kpi.value}
            </div>
            <div className="text-sm text-gray-600">{kpi.subtitle}</div>
          </motion.div>
        ))}
      </div>

      {/* Best 5 Metrics */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Best 5 Metrics</h3>
        <div className="space-y-3">
          {bestMetrics.map((metric, index) => (
            <motion.div
              key={metric.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-bold text-blue-600">#{metric.rank}</span>
                </div>
                <div>
                  <div className="font-medium text-gray-900">{metric.name}</div>
                  <div className="text-sm text-gray-500">
                    {metric.value} {metric.unit}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {metric.change > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  metric.change > 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Skeleton component
KPICards.Skeleton = function KPICardsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <div className="animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
                <div className="w-16 h-4 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded mb-1"></div>
              <div className="w-32 h-4 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="w-32 h-6 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="w-24 h-4 bg-gray-200 rounded"></div>
                  <div className="w-20 h-3 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

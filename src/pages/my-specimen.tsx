import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  TrendingUp, 
  Target, 
  BarChart3, 
  ArrowRight,
  Info,
  Zap
} from 'lucide-react';
import { trpc } from '@/utils/trpc';
import MySpecimenFigure from '@/components/MySpecimenFigure';
import { calculateAllMuscleElos, type RankTier } from '@/lib/elo/muscle';
import { RANK_COLORS } from '@/lib/elo/muscle';

interface MuscleEloData {
  elo: number;
  percentile: number;
  tier: RankTier;
  topContributor: string;
  topValue: number;
}

export default function MySpecimenPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [muscleElos, setMuscleElos] = useState<Record<string, MuscleEloData>>({});

  // Fetch user data
  const { data: user } = trpc.user.me.useQuery();
  const { data: metrics } = trpc.metrics.all.useQuery();
  const { data: userEntries } = trpc.metrics.userEntries.useQuery();
  const { data: allEntries } = trpc.metrics.allEntries.useQuery();

  // Calculate muscle ELOs when data changes
  useEffect(() => {
    if (userEntries && metrics && allEntries) {
      // Transform user entries to the format expected by muscle ELO calculation
      const transformedUserEntries = userEntries.map(entry => ({
        metric_slug: entry.metric.slug || entry.metric.name.toLowerCase().replace(/\s+/g, '_'),
        value: entry.value
      }));

      // Transform all entries to the format expected by muscle ELO calculation
      const transformedAllEntries: Record<string, Array<{ value: number; higherIsBetter: boolean }>> = {};
      
      metrics.forEach(metric => {
        const metricSlug = metric.slug || metric.name.toLowerCase().replace(/\s+/g, '_');
        const metricEntries = allEntries.filter(entry => entry.metricId === metric.id);
        
        transformedAllEntries[metricSlug] = metricEntries.map(entry => ({
          value: entry.value,
          higherIsBetter: metric.higherIsBetter ?? true
        }));
      });

      const calculatedElos = calculateAllMuscleElos(transformedUserEntries, transformedAllEntries, user?.primaryClassId);
      setMuscleElos(calculatedElos);
    }
  }, [userEntries, metrics, allEntries, user?.primaryClassId]);

  // Handle muscle click - navigate to metrics page
  const handleMuscleClick = (muscleGroupId: string, muscleData: MuscleEloData) => {
    setSelectedMuscle(muscleGroupId);
    
    // Navigate to metrics page with muscle filter
    router.push({
      pathname: '/metrics',
      query: { muscle: muscleGroupId }
    });
  };

  // Calculate overall specimen score
  const overallScore = Object.values(muscleElos).reduce((sum, muscle) => sum + muscle.elo, 0) / Math.max(Object.keys(muscleElos).length, 1);
  const overallTier = Object.values(muscleElos).reduce((counts, muscle) => {
    counts[muscle.tier] = (counts[muscle.tier] || 0) + 1;
    return counts;
  }, {} as Record<RankTier, number>);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your specimen...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Specimen
          </h1>
          <p className="text-lg text-gray-600">
            Your muscle ELO ratings and performance breakdown
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Figure */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Muscle ELO Visualization
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Info className="w-4 h-4" />
                  <span>Click muscles to view details</span>
                </div>
              </div>
              
              <MySpecimenFigure
                muscleElos={muscleElos}
                onMuscleClick={handleMuscleClick}
                className="w-full"
              />
            </div>
          </motion.div>

          {/* Stats Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 mr-2 text-yellow-500" />
                Overall Specimen Score
              </h3>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">
                  {Math.round(overallScore)}
                </div>
                <div className="text-sm text-gray-500 mb-4">ELO Rating</div>
                
                {/* Tier breakdown */}
                <div className="space-y-2">
                  {Object.entries(overallTier).map(([tier, count]) => (
                    <div key={tier} className="flex items-center justify-between text-sm">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: RANK_COLORS[tier as RankTier] }}
                        />
                        <span className="capitalize text-gray-700">{tier}</span>
                      </div>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Performers */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                Top Performers
              </h3>
              
              <div className="space-y-3">
                {Object.entries(muscleElos)
                  .sort(([,a], [,b]) => b.elo - a.elo)
                  .slice(0, 5)
                  .map(([muscleId, muscleData]) => (
                    <motion.div
                      key={muscleId}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => handleMuscleClick(muscleId, muscleData)}
                    >
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: RANK_COLORS[muscleData.tier] }}
                        />
                        <span className="font-medium text-gray-800 capitalize">
                          {muscleId.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {Math.round(muscleData.elo)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {muscleData.percentile.toFixed(1)}%
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="w-5 h-5 mr-2 text-blue-500" />
                Quick Actions
              </h3>
              
              <div className="space-y-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/metrics')}
                  className="w-full flex items-center justify-between p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <span className="text-blue-700 font-medium">View All Metrics</span>
                  <ArrowRight className="w-4 h-4 text-blue-500" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center justify-between p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <span className="text-green-700 font-medium">Dashboard</span>
                  <BarChart3 className="w-4 h-4 text-green-500" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push('/leaderboards')}
                  className="w-full flex items-center justify-between p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                >
                  <span className="text-purple-700 font-medium">Leaderboards</span>
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Selected Muscle Details */}
        {selectedMuscle && muscleElos[selectedMuscle] && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-white rounded-2xl shadow-lg p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedMuscle.replace('_', ' ').toUpperCase()} Details
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(muscleElos[selectedMuscle].elo)}
                </div>
                <div className="text-sm text-gray-500">ELO Rating</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {muscleElos[selectedMuscle].percentile.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Percentile</div>
              </div>
              
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 capitalize">
                  {muscleElos[selectedMuscle].tier}
                </div>
                <div className="text-sm text-gray-500">Tier</div>
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <strong>Top Contributing Metric:</strong> {muscleElos[selectedMuscle].topContributor}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

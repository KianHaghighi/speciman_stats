import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  ArrowLeft,
  Target,
  BarChart3
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageTransition from '@/components/PageTransition';

interface ComparisonData {
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    overallElo: number;
    primaryClassId: string | null;
  };
  targetUser: {
    id: string;
    name: string | null;
    displayName: string | null;
    image: string | null;
    overallElo: number;
    primaryClassId: string | null;
  };
  comparisons: Array<{
    metricId: string;
    metricName: string;
    metricSlug: string;
    unit: string;
    higherIsBetter: boolean;
    userValue: number;
    targetValue: number;
    difference: number;
    userHasValue: boolean;
    targetHasValue: boolean;
  }>;
  overallEloDifference: number;
}

export default function ComparePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { id: targetUserId } = router.query;
  
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  // Load comparison data
  useEffect(() => {
    if (session && targetUserId) {
      loadComparisonData();
    }
  }, [session, targetUserId, loadComparisonData]);

  const loadComparisonData = React.useCallback(async () => {
    if (!targetUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/friends?action=compare&targetUserId=${targetUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setComparisonData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load comparison data');
      }
    } catch (error) {
      console.error('Error loading comparison data:', error);
      setError('Failed to load comparison data');
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  const getDifferenceBadge = (difference: number, higherIsBetter: boolean) => {
    if (difference === 0) return { text: 'Tie', color: 'bg-gray-100 text-gray-800' };
    
    const isPositive = higherIsBetter ? difference > 0 : difference < 0;
    
    if (isPositive) {
      return { text: 'Better', color: 'bg-green-100 text-green-800' };
    } else {
      return { text: 'Behind', color: 'bg-red-100 text-red-800' };
    }
  };

  const getDifferenceIcon = (difference: number, higherIsBetter: boolean) => {
    if (difference === 0) return <Minus className="w-4 h-4 text-gray-500" />;
    
    const isPositive = higherIsBetter ? difference > 0 : difference < 0;
    
    if (isPositive) {
      return <TrendingUp className="w-4 h-4 text-green-500" />;
    } else {
      return <TrendingDown className="w-4 h-4 text-red-500" />;
    }
  };

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return null;
  }

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">Loading comparison...</div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="text-red-600 mb-4">{error}</div>
            <button
              onClick={() => router.push('/friends')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Friends
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  if (!comparisonData) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">No comparison data available</div>
        </div>
      </AppShell>
    );
  }

  const { user, targetUser, comparisons, overallEloDifference } = comparisonData;

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.push('/friends')}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Friends</span>
            </button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Stats Comparison</h1>
              <p className="text-gray-600">See how you stack up against your friend</p>
            </motion.div>
          </div>

          {/* User Profiles */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8"
          >
            {/* Current User */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                {user.image ? (
                  <img src={user.image} alt="" className="w-20 h-20 rounded-full" />
                ) : (
                  <Users className="w-10 h-10 text-blue-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {user.displayName || user.name} (You)
              </h3>
              <div className="text-3xl font-bold text-blue-600 mb-1">
                {user.overallElo}
              </div>
              <div className="text-sm text-gray-500">Overall ELO</div>
            </div>

            {/* Target User */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-20 h-20 bg-purple-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                {targetUser.image ? (
                  <img src={targetUser.image} alt="" className="w-20 h-20 rounded-full" />
                ) : (
                  <Users className="w-10 h-10 text-purple-600" />
                )}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {targetUser.displayName || targetUser.name}
              </h3>
              <div className="text-3xl font-bold text-purple-600 mb-1">
                {targetUser.overallElo}
              </div>
              <div className="text-sm text-gray-500">Overall ELO</div>
            </div>
          </motion.div>

          {/* Overall ELO Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white text-center mb-8"
          >
            <h3 className="text-xl font-bold mb-4">Overall ELO Difference</h3>
            <div className="text-4xl font-bold mb-2">
              {overallEloDifference > 0 ? '+' : ''}{overallEloDifference}
            </div>
            <div className="text-blue-100">
              {overallEloDifference > 0 
                ? `You're ${overallEloDifference} points ahead!` 
                : overallEloDifference < 0 
                ? `You're ${Math.abs(overallEloDifference)} points behind`
                : "You're tied!"
              }
            </div>
          </motion.div>

          {/* Metrics Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Metrics Comparison</h2>
            
            {comparisons.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>No metrics to compare</p>
                <p className="text-sm">Both users need to have entries for the same metrics</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {comparisons.map((comparison, index) => (
                  <motion.div
                    key={comparison.metricId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {comparison.metricName}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                        getDifferenceBadge(comparison.difference, comparison.higherIsBetter).color
                      }`}>
                        {getDifferenceBadge(comparison.difference, comparison.higherIsBetter).text}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {/* User Value */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600 mb-1">
                          {comparison.userHasValue ? comparison.userValue : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">You</div>
                      </div>

                      {/* Target Value */}
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600 mb-1">
                          {comparison.targetHasValue ? comparison.targetValue : 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">Friend</div>
                      </div>
                    </div>

                    {/* Difference */}
                    {comparison.userHasValue && comparison.targetHasValue && (
                      <div className="text-center pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-center space-x-2">
                          {getDifferenceIcon(comparison.difference, comparison.higherIsBetter)}
                          <span className={`text-sm font-medium ${
                            comparison.difference > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {comparison.difference > 0 ? '+' : ''}{comparison.difference} {comparison.unit}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {comparison.difference > 0 
                            ? `You're ahead by ${comparison.difference} ${comparison.unit}`
                            : comparison.difference < 0
                            ? `You're behind by ${Math.abs(comparison.difference)} ${comparison.unit}`
                            : "You're tied!"
                          }
                        </div>
                      </div>
                    )}

                    {/* Missing Data Notice */}
                    {(!comparison.userHasValue || !comparison.targetHasValue) && (
                      <div className="text-center pt-4 border-t border-gray-100">
                        <div className="text-sm text-gray-500">
                          {!comparison.userHasValue && !comparison.targetHasValue
                            ? "Neither user has data for this metric"
                            : !comparison.userHasValue
                            ? "You don't have data for this metric"
                            : "Your friend doesn't have data for this metric"
                          }
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-center"
          >
            <button
              onClick={() => router.push('/friends')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors mr-4"
            >
              Back to Friends
            </button>
            <button
              onClick={() => router.push('/metrics')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Target className="w-4 h-4 mr-2 inline" />
              Add More Metrics
            </button>
          </motion.div>
        </div>
      </PageTransition>
    </AppShell>
  );
}

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { CLASSES, CLASS_COLORS, CLASS_DESCRIPTIONS } from '@/config/classes';
import { motion } from 'framer-motion';

interface UserClassElo {
  classId: string;
  elo: number;
  className: string;
}

interface DashboardData {
  overallElo: number;
  classElos: UserClassElo[];
  primaryClass?: string;
}

export default function ProfessionalDashboard() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string>('');

  useEffect(() => {
    if (session?.user?.id) {
      fetchDashboardData();
    }
  }, [session]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // This would be replaced with actual API call
      // For now, using mock data
      const mockData: DashboardData = {
        overallElo: 1250,
        classElos: CLASSES.map((cls, index) => ({
          classId: cls.slug,
          elo: 1000 + Math.random() * 500,
          className: cls.name
        })),
        primaryClass: 'powerlifting'
      };
      
      setDashboardData(mockData);
      setSelectedClass(mockData.primaryClass || '');
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEloColor = (elo: number) => {
    if (elo >= 1400) return 'text-purple-600';
    if (elo >= 1200) return 'text-blue-600';
    if (elo >= 1000) return 'text-green-600';
    if (elo >= 800) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEloTier = (elo: number) => {
    if (elo >= 1400) return 'Elite';
    if (elo >= 1200) return 'Advanced';
    if (elo >= 1000) return 'Intermediate';
    if (elo >= 800) return 'Beginner';
    return 'Novice';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center text-gray-500 py-8">
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall ELO Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-6 text-white"
      >
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Overall ELO Rating</h2>
          <div className="text-6xl font-bold mb-2">{Math.round(dashboardData.overallElo)}</div>
          <div className="text-xl opacity-90">{getEloTier(dashboardData.overallElo)}</div>
        </div>
      </motion.div>

      {/* Class Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Select Your Primary Class</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {CLASSES.map((cls, index) => (
            <motion.button
              key={cls.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => setSelectedClass(cls.slug)}
              className={`p-4 rounded-xl border-2 transition-all ${
                selectedClass === cls.slug
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full ${CLASS_COLORS[cls.slug]} mb-2`}></div>
              <div className="font-semibold text-gray-800">{cls.name}</div>
              <div className="text-sm text-gray-600 mt-1">{CLASS_DESCRIPTIONS[cls.slug]}</div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Class ELO Ratings */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Class ELO Ratings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dashboardData.classElos.map((classElo, index) => (
            <motion.div
              key={classElo.classId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${CLASS_COLORS[classElo.classId as keyof typeof CLASS_COLORS]}`}></div>
                <span className="font-medium text-gray-800">{classElo.className}</span>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getEloColor(classElo.elo)}`}>
                  {Math.round(classElo.elo)}
                </div>
                <div className="text-sm text-gray-500">{getEloTier(classElo.elo)}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors"
          >
            Log New Entry
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors"
          >
            View Leaderboard
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            My Progress
          </motion.button>
        </div>
      </div>
    </div>
  );
}

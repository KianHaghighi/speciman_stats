import { motion } from 'framer-motion';
import { Trophy, Star, Crown } from 'lucide-react';
import { trpc } from '@/utils/trpc';

interface DashboardHeroProps {
  user: { name?: string | null; email?: string | null };
}

export default function DashboardHero({ user }: DashboardHeroProps) {
  const { data: userData } = trpc.user.me.useQuery();
  const { data: metrics } = trpc.metrics.all.useQuery();

  const overallElo = userData?.overallElo || 1500;
  const classElo = userData?.primaryClassId ? 1520 : 1500;
  const overallRank = userData?.overallElo ? Math.floor(Math.random() * 100) + 1 : 'N/A';
  const classRank = userData?.primaryClassId ? Math.floor(Math.random() * 50) + 1 : 'N/A';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Welcome Section */}
        <div className="flex-1">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-bold mb-2"
          >
            Welcome{user.name ? `, ${user.name}` : ""} 👋
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-blue-100 text-lg"
          >
            Track your progress and dominate the leaderboards
          </motion.p>
        </div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Overall ELO */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-300" />
            <div className="text-2xl font-bold">{overallElo}</div>
            <div className="text-sm text-blue-100">Overall ELO</div>
          </div>

          {/* Class ELO */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-purple-300" />
            <div className="text-2xl font-bold">{classElo}</div>
            <div className="text-sm text-blue-100">Class ELO</div>
          </div>

          {/* Overall Rank */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Star className="w-6 h-6 mx-auto mb-2 text-blue-300" />
            <div className="text-2xl font-bold">
              {typeof overallRank === 'number' ? `#${overallRank}` : overallRank}
            </div>
            <div className="text-sm text-blue-100">Overall Rank</div>
          </div>

          {/* Class Rank */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Crown className="w-6 h-6 mx-auto mb-2 text-green-300" />
            <div className="text-2xl font-bold">
              {typeof classRank === 'number' ? `#${classRank}` : classRank}
            </div>
            <div className="text-sm text-blue-100">Class Rank</div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

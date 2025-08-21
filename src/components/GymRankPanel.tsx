import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Trophy, Users, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';

interface GymRankPanelProps {
  gymName: string;
  overallRank: number;
  classRank: number;
  totalUsers: number;
  totalClassUsers: number;
  className?: string;
}

export default function GymRankPanel({ 
  gymName, 
  overallRank, 
  classRank, 
  totalUsers, 
  totalClassUsers,
  className = '' 
}: GymRankPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRankBadge = (rank: number, total: number) => {
    const percentage = (rank / total) * 100;
    if (percentage <= 1) return { text: '🥇 Elite', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage <= 5) return { text: '🥈 Top 5%', color: 'bg-gray-100 text-gray-800' };
    if (percentage <= 10) return { text: '🥉 Top 10%', color: 'bg-amber-100 text-amber-800' };
    if (percentage <= 25) return { text: '🏅 Top 25%', color: 'bg-blue-100 text-blue-800' };
    if (percentage <= 50) return { text: '🎖️ Top 50%', color: 'bg-green-100 text-green-800' };
    return { text: '📊 Ranked', color: 'bg-gray-100 text-gray-600' };
  };

  const overallBadge = getRankBadge(overallRank, totalUsers);
  const classBadge = getRankBadge(classRank, totalClassUsers);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MapPin className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Current Gym</h3>
            <p className="text-sm text-gray-500">{gymName}</p>
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown 
            className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        </button>
      </div>

      {/* Rank Display */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* Overall Rank */}
        <div className="text-center p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
            <span className="text-sm font-medium text-gray-600">Overall</span>
          </div>
          <div className="text-2xl font-bold text-gray-900 mb-1">
            #{overallRank}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            of {totalUsers} users
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${overallBadge.color}`}>
            {overallBadge.text}
          </span>
        </div>

        {/* Class Rank */}
        <div className="text-center p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center justify-center mb-2">
            <Users className="w-5 h-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-gray-600">Class</span>
          </div>
          <div className="text-2xl font-bold text-blue-600 mb-1">
            #{classRank}
          </div>
          <div className="text-xs text-gray-500 mb-2">
            of {totalClassUsers} users
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${classBadge.color}`}>
            {classBadge.text}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      <motion.div
        initial={false}
        animate={{ height: isExpanded ? 'auto' : 0, opacity: isExpanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="pt-4 border-t border-gray-100 space-y-4">
          {/* Rank Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Overall Percentile:</span>
              <span className="ml-2 font-medium text-gray-900">
                {((totalUsers - overallRank + 1) / totalUsers * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="text-gray-500">Class Percentile:</span>
              <span className="ml-2 font-medium text-gray-900">
                {((totalClassUsers - classRank + 1) / totalClassUsers * 100).toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <Link
              href="/leaderboards"
              className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Trophy className="w-4 h-4 mr-2" />
              View Leaderboards
            </Link>
            <Link
              href="/map"
              className="flex-1 flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Settings className="w-4 h-4 mr-2" />
              Change Gym
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

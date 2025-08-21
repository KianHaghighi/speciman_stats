import { motion } from 'framer-motion';
import { MapPin, Trophy, Users, ArrowRight } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import Link from 'next/link';

export default function GymCard() {
  const { data: userData } = trpc.user.me.useQuery();
  const { data: gyms } = trpc.gyms.all.useQuery();

  // Mock data for demonstration
  const currentGym = gyms?.find(g => g.id === userData?.gymId) || {
    id: '1',
    name: 'Gold\'s Gym Downtown',
    city: 'Austin',
    state: 'TX',
    memberCount: 1247,
  };

  const gymRank = userData?.gymId ? Math.floor(Math.random() * 150) + 1 : 0;
  const totalMembers = currentGym.memberCount || 1247;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Gym Info */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">{currentGym.name}</h3>
          </div>
          <p className="text-gray-600">{currentGym.city}, {currentGym.state}</p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">#{gymRank}</div>
          <div className="text-sm text-gray-500">Gym Rank</div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <Users className="w-6 h-6 mx-auto mb-2 text-gray-600" />
          <div className="text-xl font-bold text-gray-900">{totalMembers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Members</div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4 text-center">
          <Trophy className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
          <div className="text-xl font-bold text-gray-900">Top 15%</div>
          <div className="text-sm text-gray-600">Percentile</div>
        </div>
      </div>

      {/* Change Gym CTA */}
      <Link
        href="/map"
        className="group flex items-center justify-between w-full p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 hover:border-blue-300 transition-all hover:shadow-sm"
      >
        <div>
          <div className="font-medium text-blue-900">Want to change gyms?</div>
          <div className="text-sm text-blue-700">Find a new location near you</div>
        </div>
        <ArrowRight className="w-5 h-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
      </Link>
    </div>
  );
}

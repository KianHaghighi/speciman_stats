import { motion } from 'framer-motion';
import { BarChart3, Target, Trophy, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  {
    title: 'Log Metric',
    description: 'Record your latest performance',
    icon: BarChart3,
    href: '/metrics/log',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    textColor: 'text-blue-700',
  },
  {
    title: 'My Specimen',
    description: 'View your progress visualization',
    icon: Target,
    href: '/specimen/me',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    textColor: 'text-purple-700',
  },
  {
    title: 'Leaderboards',
    description: 'See how you rank against others',
    icon: Trophy,
    href: '/leaderboards',
    color: 'from-yellow-500 to-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    textColor: 'text-yellow-700',
  },
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <motion.div
            key={action.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="group"
          >
            <Link
              href={action.href}
              className={`block h-full p-6 rounded-2xl border-2 transition-all hover:shadow-lg ${action.bgColor} ${action.borderColor} hover:border-opacity-60`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color} text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowRight className={`w-5 h-5 ${action.textColor} group-hover:translate-x-1 transition-transform`} />
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {action.title}
              </h3>
              <p className="text-gray-600">
                {action.description}
              </p>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

// Skeleton component
QuickActions.Skeleton = function QuickActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-40 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-5 h-5 bg-gray-200 rounded"></div>
            </div>
            <div className="w-32 h-6 bg-gray-200 rounded mb-2"></div>
            <div className="w-48 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
};

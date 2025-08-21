import { motion } from 'framer-motion';
import { Clock, CheckCircle, Clock as ClockIcon, XCircle, AlertCircle } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import Link from 'next/link';

const statusConfig = {
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 border-green-200',
  },
  pending: {
    label: 'Pending',
    icon: ClockIcon,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'bg-red-100 text-red-800 border-red-200',
  },
  review: {
    label: 'Under Review',
    icon: AlertCircle,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
  },
};

export default function RecentActivity() {
  const { data: userEntries } = trpc.metrics.userEntries.useQuery();
  const { data: metrics } = trpc.metrics.all.useQuery();

  // Mock recent activity data
  const recentActivity = [
    {
      id: '1',
      metricName: 'Bench Press',
      value: 225,
      unit: 'lbs',
      status: 'approved' as keyof typeof statusConfig,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      reviewer: 'Coach Mike',
    },
    {
      id: '2',
      metricName: 'Deadlift',
      value: 315,
      unit: 'lbs',
      status: 'pending' as keyof typeof statusConfig,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      reviewer: null,
    },
    {
      id: '3',
      metricName: '5K Run',
      value: 22.5,
      unit: 'min',
      status: 'review' as keyof typeof statusConfig,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      reviewer: 'Admin',
    },
    {
      id: '4',
      metricName: 'Pull-ups',
      value: 15,
      unit: 'reps',
      status: 'rejected' as keyof typeof statusConfig,
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      reviewer: 'Coach Sarah',
      reason: 'Video quality too low',
    },
    {
      id: '5',
      metricName: 'Squat',
      value: 275,
      unit: 'lbs',
      status: 'approved' as keyof typeof statusConfig,
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      reviewer: 'Coach Mike',
    },
  ];

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <Link
          href="/metrics/log"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Activity List */}
      <div className="space-y-4">
        {recentActivity.map((activity, index) => {
          const status = statusConfig[activity.status];
          const StatusIcon = status.icon;
          
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Status Icon */}
              <div className="flex-shrink-0">
                <StatusIcon className="w-5 h-5 text-gray-400" />
              </div>

              {/* Activity Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-gray-900">{activity.metricName}</span>
                  <span className="text-gray-500">•</span>
                  <span className="font-semibold text-gray-900">
                    {activity.value} {activity.unit}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                  
                  {activity.reviewer && (
                    <>
                      <span>•</span>
                      <span>Reviewed by {activity.reviewer}</span>
                    </>
                  )}
                  
                  {activity.reason && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">{activity.reason}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Status Badge */}
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {recentActivity.length === 0 && (
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
          <p className="text-gray-500 mb-4">Start logging your metrics to see them here</p>
          <Link
            href="/metrics/log"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Log Your First Metric
          </Link>
        </div>
      )}
    </div>
  );
}

// Skeleton component
RecentActivity.Skeleton = function RecentActivitySkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="w-32 h-6 bg-gray-200 rounded"></div>
        <div className="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
      
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="w-48 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

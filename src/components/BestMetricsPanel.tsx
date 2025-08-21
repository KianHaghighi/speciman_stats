import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award, Star, Zap } from 'lucide-react';
import Link from 'next/link';

interface BestMetric {
  id: string;
  name: string;
  slug: string;
  value: number;
  unit: string;
  rank: number;
  percentile: number;
  change: number;
}

interface BestMetricsPanelProps {
  metrics: BestMetric[];
  className?: string;
}

const rankIcons = [
  <Trophy key="1" className="w-5 h-5 text-yellow-500" />,
  <Medal key="2" className="w-5 h-5 text-gray-400" />,
  <Award key="3" className="w-5 h-5 text-amber-600" />,
  <Star key="4" className="w-5 h-5 text-blue-500" />,
  <Zap key="5" className="w-5 h-5 text-purple-500" />,
];

const rankColors = [
  'bg-yellow-100 text-yellow-800',
  'bg-gray-100 text-gray-800',
  'bg-amber-100 text-amber-800',
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
];

export default function BestMetricsPanel({ metrics, className = '' }: BestMetricsPanelProps) {
  if (!metrics.length) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          No metrics data available
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Best 5 Metrics</h3>
          <p className="text-sm text-gray-500">Your top performing areas</p>
        </div>
        <Link
          href="/metrics"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Metrics List */}
      <div className="space-y-4">
        {metrics.slice(0, 5).map((metric, index) => (
          <motion.div
            key={metric.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {/* Rank Icon */}
            <div className="flex-shrink-0">
              {rankIcons[index]}
            </div>

            {/* Metric Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {metric.name}
                </h4>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${rankColors[index]}`}>
                  #{metric.rank}
                </span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-gray-500">
                <span>
                  {metric.value} {metric.unit}
                </span>
                <span>
                  Top {metric.percentile}%
                </span>
                {metric.change !== 0 && (
                  <span className={metric.change > 0 ? 'text-green-600' : 'text-red-600'}>
                    {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>

            {/* View Button */}
            <Link
              href={`/metrics/${metric.slug}`}
              className="flex-shrink-0 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
            >
              View
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="text-center">
          <Link
            href="/metrics"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Track more metrics to improve your ranking
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

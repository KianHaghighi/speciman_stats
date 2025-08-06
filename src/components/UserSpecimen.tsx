import { motion } from 'framer-motion';
import { useState } from 'react';
import dynamic from 'next/dynamic';
import { PercentileChart } from './PercentileChart';

const AnatomyModel = dynamic(() => import('./AnatomyModel.client'), { ssr: false });

interface UserSpecimenProps {
  user: {
    id: string;
    display_name: string;
    avatar_url: string | null;
  };
  metrics: {
    name: string;
    value: number;
    percentile: number;
  }[];
}

export function UserSpecimen({ user, metrics }: UserSpecimenProps) {
  const [selectedMetric, setSelectedMetric] = useState(metrics[0]?.name || '');

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto p-6"
    >
      <motion.div
        variants={itemVariants}
        className="flex items-center space-x-4 mb-8"
      >
        <img
          src={user.avatar_url || 'https://via.placeholder.com/150'}
          alt={user.display_name}
          className="w-16 h-16 rounded-full border-4 border-blue-500"
        />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
            {user.display_name}&apos;s Specimen
          </h1>
          <p className="text-gray-600">Performance Analysis</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Metric Selection
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric) => (
                <motion.button
                  key={metric.name}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedMetric(metric.name)}
                  className={`p-4 rounded-lg ${
                    selectedMetric === metric.name
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  <div className="font-medium">{metric.name}</div>
                  <div className="text-sm opacity-75">
                    {metric.value} ({metric.percentile}th percentile)
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <PercentileChart
            data={{
              labels: metrics.map((m) => m.name),
              datasets: [
                {
                  label: 'Your Percentile',
                  data: metrics.map((m) => m.percentile),
                  borderColor: 'rgb(59, 130, 246)',
                  backgroundColor: 'rgba(59, 130, 246, 0.5)',
                },
              ],
            }}
            title="Performance Percentiles"
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          <AnatomyModel 
            selectedMetric={selectedMetric} 
            userValue={metrics.find(m => m.name === selectedMetric)?.value}
            allValues={metrics.map(m => m.value)}
          />
        </motion.div>
      </div>
    </motion.div>
  );
} 
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ELODataPoint {
  date: string;
  overallElo: number;
  classElo: number;
}

interface DualELOChartProps {
  data: ELODataPoint[];
  className?: string;
}

const timeRanges = [
  { label: '1D', value: '1d' },
  { label: '7D', value: '7d' },
  { label: '1M', value: '1m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
  { label: 'ALL', value: 'all' },
];

export default function DualELOChart({ data, className = '' }: DualELOChartProps) {
  const [selectedRange, setSelectedRange] = useState('1m');

  const filteredData = useMemo(() => {
    if (!data.length) return [];
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (selectedRange) {
      case '1d':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '1m':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '6m':
        cutoffDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case '5y':
        cutoffDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return data;
    }
    
    return data.filter(point => new Date(point.date) >= cutoffDate);
  }, [data, selectedRange]);

  const calculateChange = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const overallChange = useMemo(() => {
    if (filteredData.length < 2) return 0;
    const current = filteredData[filteredData.length - 1].overallElo;
    const previous = filteredData[0].overallElo;
    return calculateChange(current, previous);
  }, [filteredData]);

  const classChange = useMemo(() => {
    if (filteredData.length < 2) return 0;
    const current = filteredData[filteredData.length - 1].classElo;
    const previous = filteredData[0].classElo;
    return calculateChange(current, previous);
  }, [filteredData]);

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (!data.length) {
    return (
      <div className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 ${className}`}>
        <div className="text-center text-gray-500 py-8">
          No ELO data available
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
          <h3 className="text-lg font-semibold text-gray-900">ELO Progress</h3>
          <p className="text-sm text-gray-500">Track your performance over time</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.value}
              onClick={() => setSelectedRange(range.value)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                selectedRange === range.value
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ELO Values and Changes */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Overall ELO */}
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {filteredData[filteredData.length - 1]?.overallElo || 0}
          </div>
          <div className="text-sm text-gray-500 mb-2">Overall ELO</div>
          <div className={`flex items-center justify-center space-x-1 ${getChangeColor(overallChange)}`}>
            {getChangeIcon(overallChange)}
            <span className="text-sm font-medium">
              {overallChange > 0 ? '+' : ''}{overallChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Class ELO */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600 mb-1">
            {filteredData[filteredData.length - 1]?.classElo || 0}
          </div>
          <div className="text-sm text-gray-500 mb-2">Class ELO</div>
          <div className={`flex items-center justify-center space-x-1 ${getChangeColor(classChange)}`}>
            {getChangeIcon(classChange)}
            <span className="text-sm font-medium">
              {classChange > 0 ? '+' : ''}{classChange.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Placeholder */}
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <div className="text-gray-500 text-sm">
          Chart visualization would go here
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {filteredData.length} data points • {selectedRange.toUpperCase()} range
        </div>
      </div>
    </motion.div>
  );
}

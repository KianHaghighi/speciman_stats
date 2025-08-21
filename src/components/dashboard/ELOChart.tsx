import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trpc } from '@/utils/trpc';

const timeRanges = [
  { key: '1d', label: '1D', days: 1 },
  { key: '7d', label: '7D', days: 7 },
  { key: '1m', label: '1M', days: 30 },
  { key: '6m', label: '6M', days: 180 },
  { key: '1y', label: '1Y', days: 365 },
  { key: '5y', label: '5Y', days: 1825 },
  { key: 'all', label: 'ALL', days: 0 },
];

interface ELODataPoint {
  date: string;
  overallElo: number;
  classElo: number;
}

export default function ELOChart() {
  const [selectedRange, setSelectedRange] = useState('1m');
  const [eloData, setEloData] = useState<ELODataPoint[]>([]);
  const { data: userData } = trpc.user.me.useQuery();

  // Generate mock ELO data based on selected range
  useEffect(() => {
    const generateEloData = () => {
      const data: ELODataPoint[] = [];
      const now = new Date();
      let overallElo = userData?.overallElo || 1500;
      let classElo = userData?.primaryClassId ? 1520 : 1500;
      
      const days = timeRanges.find(r => r.key === selectedRange)?.days || 30;
      const dataPoints = Math.min(days, 30); // Max 30 data points
      
      for (let i = dataPoints; i >= 0; i--) {
        const date = new Date(now.getTime() - i * (days / dataPoints) * 24 * 60 * 60 * 1000);
        
        // Add some random variation
        overallElo += (Math.random() - 0.5) * (days > 30 ? 20 : 10);
        classElo += (Math.random() - 0.5) * (days > 30 ? 15 : 8);
        
        data.push({
          date: date.toISOString().split('T')[0],
          overallElo: Math.max(1000, Math.min(2000, overallElo)),
          classElo: Math.max(1000, Math.min(2000, classElo)),
        });
      }
      
      setEloData(data);
    };

    generateEloData();
  }, [selectedRange, userData]);

  // Calculate percentage change
  const calculateChange = (data: ELODataPoint[], field: 'overallElo' | 'classElo') => {
    if (data.length < 2) return 0;
    const first = data[0][field];
    const last = data[data.length - 1][field];
    return ((last - first) / first) * 100;
  };

  const overallChange = calculateChange(eloData, 'overallElo');
  const classChange = calculateChange(eloData, 'classElo');

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">ELO Progress</h3>
        
        {/* Time range tabs */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          {timeRanges.map((range) => (
            <button
              key={range.key}
              onClick={() => setSelectedRange(range.key)}
              className={`
                px-3 py-1 text-sm font-medium rounded-md transition-colors
                ${selectedRange === range.key
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                }
              `}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Change indicators */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Overall ELO</span>
          <span className={`text-sm font-medium ${
            overallChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {overallChange > 0 ? '+' : ''}{overallChange.toFixed(1)}%
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Class ELO</span>
          <span className={`text-sm font-medium ${
            classChange > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {classChange > 0 ? '+' : ''}{classChange.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={eloData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                if (selectedRange === '1d') return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                if (selectedRange === '7d') return date.toLocaleDateString([], { weekday: 'short' });
                if (selectedRange === '1m') return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                return date.toLocaleDateString([], { month: 'short', year: '2-digit' });
              }}
            />
            <YAxis 
              stroke="#9ca3af"
              fontSize={12}
              domain={['dataMin - 50', 'dataMax + 50']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString([], { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });
              }}
              formatter={(value: number, name: string) => [
                Math.round(value),
                name === 'overallElo' ? 'Overall ELO' : 'Class ELO'
              ]}
            />
            <Line
              type="monotone"
              dataKey="overallElo"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="classElo"
              stroke="#8b5cf6"
              strokeWidth={3}
              dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

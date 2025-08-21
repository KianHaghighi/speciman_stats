import { useState } from 'react';
import { motion } from 'framer-motion';
import { trpc } from '@/utils/trpc';

interface Muscle {
  id: string;
  name: string;
  path: string;
  rank: 'Tin' | 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' | 'Bionic';
  elo: number;
  metrics: string[];
}

const rankColors = {
  Tin: '#8B7355',
  Bronze: '#CD7F32',
  Silver: '#C0C0C0',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Diamond: '#B9F2FF',
  Bionic: '#FF6B6B',
};

const rankGradients = {
  Tin: 'from-amber-800 to-amber-900',
  Bronze: 'from-amber-600 to-amber-700',
  Silver: 'from-gray-400 to-gray-500',
  Gold: 'from-yellow-400 to-yellow-500',
  Platinum: 'from-gray-200 to-gray-300',
  Diamond: 'from-cyan-300 to-cyan-400',
  Bionic: 'from-red-400 to-red-500',
};

export default function Humanoid2D() {
  const [selectedMuscle, setSelectedMuscle] = useState<Muscle | null>(null);
  const { data: userData } = trpc.user.me.useQuery();

  // Mock muscle data with ELO rankings
  const muscles: Muscle[] = [
    {
      id: 'chest',
      name: 'Chest',
      path: 'M 50 80 Q 100 60 150 80 Q 200 100 150 120 Q 100 140 50 120 Z',
      rank: 'Gold',
      elo: 1650,
      metrics: ['Bench Press', 'Push-ups', 'Dumbbell Flyes'],
    },
    {
      id: 'back',
      name: 'Back',
      path: 'M 50 80 Q 100 100 150 80 Q 200 60 150 40 Q 100 20 50 40 Z',
      rank: 'Platinum',
      elo: 1750,
      metrics: ['Deadlift', 'Pull-ups', 'Rows'],
    },
    {
      id: 'shoulders',
      name: 'Shoulders',
      path: 'M 80 60 Q 100 40 120 60 Q 140 80 120 100 Q 100 120 80 100 Z',
      rank: 'Silver',
      elo: 1550,
      metrics: ['Overhead Press', 'Lateral Raises', 'Front Raises'],
    },
    {
      id: 'arms',
      name: 'Arms',
      path: 'M 40 100 Q 60 80 80 100 Q 100 120 80 140 Q 60 160 40 140 Z',
      rank: 'Bronze',
      elo: 1450,
      metrics: ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls'],
    },
    {
      id: 'legs',
      name: 'Legs',
      path: 'M 70 120 Q 100 100 130 120 Q 150 140 130 160 Q 100 180 70 160 Z',
      rank: 'Diamond',
      elo: 1850,
      metrics: ['Squat', 'Lunges', 'Leg Press'],
    },
    {
      id: 'core',
      name: 'Core',
      path: 'M 80 100 Q 100 80 120 100 Q 140 120 120 140 Q 100 160 80 140 Z',
      rank: 'Gold',
      elo: 1650,
      metrics: ['Planks', 'Crunches', 'Russian Twists'],
    },
  ];

  const handleMuscleClick = (muscle: Muscle) => {
    setSelectedMuscle(muscle);
  };

  const handleMuscleHover = (muscle: Muscle) => {
    // Could add hover effects here
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      {/* Humanoid SVG */}
      <div className="relative">
        <svg
          viewBox="0 0 200 200"
          className="w-full h-80 mx-auto"
          style={{ maxHeight: '320px' }}
        >
          {/* Background humanoid outline */}
          <path
            d="M 100 20 Q 120 40 130 60 Q 140 80 130 100 Q 120 120 100 140 Q 80 120 70 100 Q 60 80 70 60 Q 80 40 100 20 Z"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="2"
            strokeDasharray="5,5"
          />
          
          {/* Muscles */}
          {muscles.map((muscle) => (
            <motion.path
              key={muscle.id}
              d={muscle.path}
              fill={`url(#${muscle.rank.toLowerCase()}-gradient)`}
              stroke="#374151"
              strokeWidth="1"
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => handleMuscleClick(muscle)}
              onMouseEnter={() => handleMuscleHover(muscle)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            />
          ))}

          {/* Gradients */}
          <defs>
            {Object.entries(rankGradients).map(([rank, gradient]) => (
              <linearGradient key={rank} id={`${rank.toLowerCase()}-gradient`}>
                <stop offset="0%" stopColor={rankColors[rank as keyof typeof rankColors]} />
                <stop offset="100%" stopColor={rankColors[rank as keyof typeof rankColors]} />
              </linearGradient>
            ))}
          </defs>
        </svg>

        {/* Tooltip */}
        {selectedMuscle && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-0 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-xs z-10"
            style={{
              left: '50%',
              transform: 'translateX(-50%)',
              top: '10px',
            }}
          >
            <div className="text-center">
              <div className="font-semibold text-gray-900 mb-2">{selectedMuscle.name}</div>
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                `bg-${rankColors[selectedMuscle.rank] === '#8B7355' ? 'amber' : 
                  rankColors[selectedMuscle.rank] === '#CD7F32' ? 'amber' :
                  rankColors[selectedMuscle.rank] === '#C0C0C0' ? 'gray' :
                  rankColors[selectedMuscle.rank] === '#FFD700' ? 'yellow' :
                  rankColors[selectedMuscle.rank] === '#E5E4E2' ? 'gray' :
                  rankColors[selectedMuscle.rank] === '#B9F2FF' ? 'cyan' : 'red'}-100`
              } ${
                `text-${rankColors[selectedMuscle.rank] === '#8B7355' ? 'amber' : 
                  rankColors[selectedMuscle.rank] === '#CD7F32' ? 'amber' :
                  rankColors[selectedMuscle.rank] === '#C0C0C0' ? 'gray' :
                  rankColors[selectedMuscle.rank] === '#FFD700' ? 'yellow' :
                  rankColors[selectedMuscle.rank] === '#E5E4E2' ? 'gray' :
                  rankColors[selectedMuscle.rank] === '#B9F2FF' ? 'cyan' : 'red'}-800`
              }`}>
                {selectedMuscle.rank}
              </div>
              <div className="text-sm text-gray-600 mb-2">ELO: {selectedMuscle.elo}</div>
              <div className="text-xs text-gray-500">
                {selectedMuscle.metrics.join(', ')}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-900 mb-3">Rank Legend</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(rankColors).map(([rank, color]) => (
            <div key={rank} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              ></div>
              <span className="text-gray-600">{rank}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        Click on muscles to see details • Hover for more info
      </div>
    </div>
  );
}

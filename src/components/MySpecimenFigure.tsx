import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MUSCLE_GROUPS, RANK_COLORS, type RankTier } from '@/lib/elo/muscle';

interface MuscleEloData {
  elo: number;
  percentile: number;
  tier: RankTier;
  topContributor: string;
  topValue: number;
}

interface MySpecimenFigureProps {
  muscleElos: Record<string, MuscleEloData>;
  onMuscleClick?: (muscleGroupId: string, muscleData: MuscleEloData) => void;
  className?: string;
}

export default function MySpecimenFigure({ 
  muscleElos, 
  onMuscleClick,
  className = '' 
}: MySpecimenFigureProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const handleMuscleHover = (muscleId: string, event: React.MouseEvent) => {
    setHoveredMuscle(muscleId);
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltipPosition({
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleMuscleClick = (muscleId: string) => {
    if (onMuscleClick && muscleElos[muscleId]) {
      onMuscleClick(muscleId, muscleElos[muscleId]);
    }
  };

  const getTierColor = (tier: RankTier) => {
    return RANK_COLORS[tier] || RANK_COLORS.unranked;
  };

  const getTierName = (tier: RankTier) => {
    const tierNames = {
      unranked: 'Unranked',
      bronze: 'Bronze',
      silver: 'Silver',
      gold: 'Gold',
      platinum: 'Platinum',
      diamond: 'Diamond',
      legendary: 'Legendary'
    };
    return tierNames[tier] || 'Unknown';
  };

  return (
    <div className={`relative ${className}`}>
      {/* Base Human Figure */}
      <div className="relative w-full max-w-md mx-auto">
        <svg
          viewBox="0 0 300 500"
          className="w-full h-auto"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,0,0,0.3))' }}
        >
          {/* Background human silhouette */}
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Human outline */}
          <path
            d="M 150,50 Q 150,30 130,30 Q 110,30 100,50 Q 90,80 100,100 Q 110,120 130,120 Q 150,120 170,120 Q 190,120 200,100 Q 210,80 200,50 Q 190,30 170,30 Q 150,30 150,50 Z M 80,140 Q 100,120 120,140 Q 100,160 80,140 Z M 180,140 Q 200,120 220,140 Q 200,160 180,140 Z M 120,180 Q 150,160 180,180 Q 150,200 120,180 Z M 100,120 Q 150,100 200,120 Q 150,160 100,120 Z M 120,100 Q 150,80 180,100 Q 150,120 120,100 Z M 130,220 Q 150,200 170,220 Q 150,240 130,220 Z M 120,300 Q 150,350 180,300 Q 150,250 120,300 Z M 140,80 Q 150,60 160,80 Q 150,100 140,80 Z"
            fill="none"
            stroke="#374151"
            strokeWidth="2"
            opacity="0.3"
          />

          {/* Muscle regions with ELO colors */}
          {Object.entries(MUSCLE_GROUPS).map(([muscleId, muscleGroup]) => {
            const muscleData = muscleElos[muscleId];
            const color = muscleData ? getTierColor(muscleData.tier) : RANK_COLORS.unranked;
            const isHovered = hoveredMuscle === muscleId;
            
            return (
              <motion.path
                key={muscleId}
                d={muscleGroup.svgPath}
                fill={color}
                opacity={isHovered ? 0.9 : 0.7}
                stroke={isHovered ? '#ffffff' : 'none'}
                strokeWidth={isHovered ? 2 : 0}
                filter={isHovered ? 'url(#glow)' : 'none'}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={(e) => handleMuscleHover(muscleId, e)}
                onMouseLeave={() => setHoveredMuscle(null)}
                onClick={() => handleMuscleClick(muscleId)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredMuscle && muscleElos[hoveredMuscle] && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="absolute z-50 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-sm max-w-xs"
          style={{
            left: tooltipPosition.x - 100,
            top: tooltipPosition.y - 80,
            pointerEvents: 'none'
          }}
        >
          <div className="font-semibold text-white mb-1">
            {MUSCLE_GROUPS[hoveredMuscle]?.displayName}
          </div>
          <div className="text-gray-300 mb-1">
            Tier: <span className="text-white font-medium">
              {getTierName(muscleElos[hoveredMuscle].tier)}
            </span>
          </div>
          <div className="text-gray-300 mb-1">
            ELO: <span className="text-white font-mono">
              {Math.round(muscleElos[hoveredMuscle].elo)}
            </span>
          </div>
          <div className="text-gray-300 mb-1">
            Percentile: <span className="text-white font-medium">
              {muscleElos[hoveredMuscle].percentile.toFixed(1)}%
            </span>
          </div>
          <div className="text-gray-300">
            Top: <span className="text-white font-medium">
              {muscleElos[hoveredMuscle].topContributor}
            </span>
          </div>
          
          {/* Tooltip arrow */}
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"
          />
        </motion.div>
      )}

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-2 text-xs">
        {Object.entries(RANK_COLORS).map(([tier, color]) => (
          <div key={tier} className="flex items-center space-x-2">
            <div 
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="capitalize text-gray-700">{tier}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

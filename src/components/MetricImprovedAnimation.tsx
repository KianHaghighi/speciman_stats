import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown } from 'lucide-react';
import { playEloUp, playEloDown } from '@/lib/sfx';

export type AnimationType = 'elo_up' | 'elo_down' | 'rank_up' | 'rank_down';

interface MetricImprovedAnimationProps {
  show: boolean;
  type: AnimationType;
  points?: number;
  oldRank?: number;
  newRank?: number;
  onDone?: () => void;
}

export function MetricImprovedAnimation({ 
  show, 
  type, 
  points = 0, 
  oldRank, 
  newRank, 
  onDone 
}: MetricImprovedAnimationProps) {
  const [visible, setVisible] = useState(show);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      setShowConfetti(true);
      
      // Play appropriate sound
      if (type === 'elo_up' || type === 'rank_up') {
        playEloUp();
      } else {
        playEloDown();
      }
      
      // Hide confetti after animation
      setTimeout(() => setShowConfetti(false), 3000);
    }
  }, [show, type]);

  if (!visible) return null;

  const isPositive = type === 'elo_up' || type === 'rank_up';
  const isRankChange = type === 'rank_up' || type === 'rank_down';

  const getConfig = () => {
    switch (type) {
      case 'elo_up':
        return {
          title: '🎉 ELO Increased! 🎉',
          subtitle: 'Great improvement! Keep pushing forward.',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
        };
      case 'elo_down':
        return {
          title: '📉 ELO Decreased',
          subtitle: 'Don\'t worry, every champion has setbacks.',
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
        };
      case 'rank_up':
        return {
          title: '🏆 Rank Up! 🏆',
          subtitle: 'You\'ve climbed the leaderboard!',
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
        };
      case 'rank_down':
        return {
          title: '📊 Rank Changed',
          subtitle: 'Time to reclaim your position!',
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
        };
    }
  };

  const config = getConfig();

  // Confetti particles
  const confettiColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA726', '#66BB6A', '#AB47BC'];
  const confettiParticles = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    color: confettiColors[i % confettiColors.length],
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
    x: Math.random() * 100,
    rotation: Math.random() * 360,
  }));

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        >
          {/* Confetti Animation for positive changes */}
          {showConfetti && isPositive && (
            <div className="absolute inset-0 pointer-events-none">
              {confettiParticles.map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    y: -20, 
                    x: `${particle.x}vw`, 
                    rotate: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    y: '110vh', 
                    rotate: particle.rotation,
                    opacity: 0 
                  }}
                  transition={{
                    duration: particle.duration,
                    delay: particle.delay,
                    ease: 'easeOut'
                  }}
                  className="absolute w-3 h-3 rounded-full"
                  style={{ backgroundColor: particle.color }}
                />
              ))}
            </div>
          )}

          {/* Rain Animation for negative changes */}
          {showConfetti && !isPositive && (
            <div className="absolute inset-0 pointer-events-none">
              {confettiParticles.slice(0, 20).map((particle) => (
                <motion.div
                  key={particle.id}
                  initial={{ 
                    y: -20, 
                    x: `${particle.x}vw`, 
                    opacity: 0.7 
                  }}
                  animate={{ 
                    y: '110vh', 
                    opacity: 0 
                  }}
                  transition={{
                    duration: 1.5,
                    delay: particle.delay,
                    ease: 'linear'
                  }}
                  className="absolute w-1 h-8 bg-blue-400 rounded-full"
                />
              ))}
            </div>
          )}

          {/* Main Animation Card */}
          <motion.div
            initial={{ scale: 0.8, rotate: -4, opacity: 0, y: 50 }}
            animate={{ scale: 1, rotate: 0, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -50 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className={`rounded-2xl ${config.bgColor} ${config.borderColor} border-2 p-8 shadow-2xl max-w-md mx-4`}
          >
            {/* Title */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className={`text-2xl font-bold text-center ${config.color} mb-4`}
            >
              {config.title}
            </motion.div>

            {/* Points Change */}
            {points !== 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center mb-4"
              >
                <div className={`flex items-center space-x-2 px-4 py-2 rounded-full ${config.bgColor} border ${config.borderColor}`}>
                  {isPositive ? (
                    <ArrowUp className={`w-5 h-5 ${config.color}`} />
                  ) : (
                    <ArrowDown className={`w-5 h-5 ${config.color}`} />
                  )}
                  <span className={`font-bold ${config.color}`}>
                    {isPositive ? '+' : ''}{points} points
                  </span>
                </div>
              </motion.div>
            )}

            {/* Rank Change */}
            {isRankChange && oldRank && newRank && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">From</div>
                    <div className="text-lg font-bold">#{oldRank}</div>
                  </div>
                  <motion.div
                    animate={{ x: [0, 10, 0] }}
                    transition={{ repeat: 3, duration: 0.5 }}
                  >
                    {isPositive ? (
                      <TrendingUp className={`w-6 h-6 ${config.color}`} />
                    ) : (
                      <TrendingDown className={`w-6 h-6 ${config.color}`} />
                    )}
                  </motion.div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">To</div>
                    <div className={`text-lg font-bold ${config.color}`}>#{newRank}</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-center text-gray-600 mb-6"
            >
              {config.subtitle}
            </motion.div>

            {/* Close Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={() => {
                setVisible(false);
                onDone?.();
              }}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                isPositive
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Continue
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playRankUp, playRankDown } from '@/lib/sfx';

interface RankChangeProps {
  show: boolean;
  oldRank: number;
  newRank: number;
  onDone?: () => void;
}

export default function RankChange({ show, oldRank, newRank, onDone }: RankChangeProps) {
  const [stage, setStage] = useState<'breaking' | 'reforming' | 'complete'>('breaking');
  const [visible, setVisible] = useState(show);

  const isRankUp = newRank < oldRank; // Lower rank number is better

  useEffect(() => {
    if (show) {
      setVisible(true);
      setStage('breaking');
      
      // Play sound
      if (isRankUp) {
        playRankUp();
      } else {
        playRankDown();
      }

      // Animation sequence
      setTimeout(() => setStage('reforming'), 1000);
      setTimeout(() => setStage('complete'), 2000);
      setTimeout(() => {
        setVisible(false);
        onDone?.();
      }, 4000);
    }
  }, [show, isRankUp, onDone]);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
        >
          <div className="relative">
            {/* Breaking Badge Animation */}
            {stage === 'breaking' && (
              <motion.div
                initial={{ scale: 1, rotate: 0 }}
                animate={{ 
                  scale: [1, 1.1, 0.8, 1.2, 0],
                  rotate: [0, -5, 5, -10, 15],
                }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl ${
                  isRankUp ? 'bg-gradient-to-br from-yellow-400 to-orange-500' : 'bg-gradient-to-br from-gray-400 to-gray-600'
                }`}
              >
                #{oldRank}
                
                {/* Crack lines */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="absolute inset-0"
                >
                  <div className="absolute top-4 left-8 w-16 h-0.5 bg-black/30 rotate-45"></div>
                  <div className="absolute top-12 right-6 w-12 h-0.5 bg-black/30 -rotate-45"></div>
                  <div className="absolute bottom-8 left-6 w-20 h-0.5 bg-black/30 rotate-12"></div>
                </motion.div>

                {/* Breaking particles */}
                {Array.from({ length: 8 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      scale: 1,
                      x: Math.cos(i * 45 * Math.PI / 180) * 100,
                      y: Math.sin(i * 45 * Math.PI / 180) * 100,
                      opacity: 0
                    }}
                    transition={{ delay: 0.7, duration: 0.3 }}
                    className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                  />
                ))}
              </motion.div>
            )}

            {/* Reforming Badge Animation */}
            {stage === 'reforming' && (
              <motion.div
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: 'spring', 
                  stiffness: 200, 
                  damping: 15,
                  duration: 1 
                }}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl ${
                  isRankUp 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-600' 
                    : 'bg-gradient-to-br from-red-400 to-red-600'
                }`}
              >
                #{newRank}
                
                {/* Sparkle effects for rank up */}
                {isRankUp && Array.from({ length: 12 }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      opacity: [0, 1, 0]
                    }}
                    transition={{ 
                      delay: i * 0.1,
                      duration: 0.6,
                      repeat: 2
                    }}
                    className="absolute w-2 h-2 bg-yellow-300 rounded-full"
                    style={{
                      left: `${50 + 40 * Math.cos(i * 30 * Math.PI / 180)}%`,
                      top: `${50 + 40 * Math.sin(i * 30 * Math.PI / 180)}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                  />
                ))}
              </motion.div>
            )}

            {/* Complete Badge with Celebration */}
            {stage === 'complete' && (
              <motion.div
                initial={{ scale: 1 }}
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 2, -2, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut'
                }}
                className={`relative w-32 h-32 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-2xl ${
                  isRankUp 
                    ? 'bg-gradient-to-br from-emerald-400 to-green-600' 
                    : 'bg-gradient-to-br from-red-400 to-red-600'
                }`}
              >
                #{newRank}
                
                {/* Celebration text */}
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: -60 }}
                  transition={{ delay: 0.5 }}
                  className="absolute text-center whitespace-nowrap"
                >
                  <div className={`text-lg font-bold ${
                    isRankUp ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {isRankUp ? '🎉 Rank Up! 🎉' : '📉 Rank Down'}
                  </div>
                </motion.div>

                {/* Continuous sparkles for rank up */}
                {isRankUp && (
                  <div className="absolute inset-0">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <motion.div
                        key={i}
                        animate={{ 
                          scale: [0, 1, 0],
                          opacity: [0, 1, 0],
                          rotate: [0, 360]
                        }}
                        transition={{ 
                          delay: i * 0.3,
                          duration: 1.5,
                          repeat: Infinity,
                          ease: 'easeInOut'
                        }}
                        className="absolute w-3 h-3 bg-yellow-300 rounded-full"
                        style={{
                          left: `${50 + 50 * Math.cos(i * 60 * Math.PI / 180)}%`,
                          top: `${50 + 50 * Math.sin(i * 60 * Math.PI / 180)}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

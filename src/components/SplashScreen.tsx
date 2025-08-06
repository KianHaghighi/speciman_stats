import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const taglines = [
  'Unleashing inner beast…',
  'Calibrating vertical jump…',
  'Optimizing ELO engine…',
  'Syncing muscle fibers…',
  'Loading cyber-athlete core…',
  'Analyzing PRs…',
  'Powering up leaderboard…',
];

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [progress, setProgress] = useState(0);
  const [taglineIdx, setTaglineIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setTimeout(onFinish, 500);
          return 100;
        }
        return p + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onFinish]);

  useEffect(() => {
    const taglineInterval = setInterval(() => {
      setTaglineIdx((i) => (i + 1) % taglines.length);
    }, 1200);
    return () => clearInterval(taglineInterval);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-200">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          className="text-5xl font-extrabold text-white mb-8 drop-shadow-lg"
        >
          SPECIMENSTATS
        </motion.div>
      </AnimatePresence>
      <div className="w-80 h-4 bg-blue-100 rounded-full overflow-hidden mb-6 border-2 border-blue-300">
        <motion.div
          className="h-4 bg-gradient-to-r from-blue-500 to-blue-300"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      <div className="text-xl text-white font-bold mb-2 text-center">
        {taglines[taglineIdx]}
      </div>
    </div>
  );
}

// Add glitch effect CSS in global styles:
// .glitch { position: relative; }
// .glitch:before, .glitch:after { ... } 
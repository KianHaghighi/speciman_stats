import { motion } from 'framer-motion';

interface SpecimenWheelProps {
  metrics: { name: string; value: number; percentile: number }[];
  selected: string;
  onSelect: (name: string) => void;
}

export function SpecimenWheel({ metrics, selected, onSelect }: SpecimenWheelProps) {
  const radius = 120;
  const center = 140;
  const angleStep = (2 * Math.PI) / metrics.length;

  return (
    <div className="relative w-[280px] h-[280px] mx-auto my-8">
      <motion.div
        className="absolute left-1/2 top-1/2"
        style={{ transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      >
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-700 to-purple-700 flex items-center justify-center shadow-2xl border-4 border-blue-400">
          <span className="text-white text-2xl font-bold tracking-widest">Specimen</span>
        </div>
      </motion.div>

      {/* Background Ring */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[240px] h-[240px] rounded-full border-2 border-gray-700"
        style={{ transform: 'translate(-50%, -50%)' }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />

      {metrics.map((metric, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * Math.cos(angle) - 40;
        const y = center + radius * Math.sin(angle) - 40;
        const isSelected = selected === metric.name;

        return (
          <motion.button
            key={metric.name}
            className={`absolute w-20 h-20 rounded-full flex flex-col items-center justify-center font-semibold shadow-lg border-2 transition-all ${
              isSelected
                ? 'bg-blue-500 border-blue-300 text-white scale-110 z-10'
                : 'bg-gray-800 border-gray-700 text-blue-200 hover:bg-blue-600 hover:text-white'
            }`}
            style={{ left: x, top: y }}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelect(metric.name)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
          >
            <span className="text-lg">{metric.name}</span>
            <span className="text-xs opacity-70">
              {metric.value} ({metric.percentile.toFixed(1)}%)
            </span>
          </motion.button>
        );
      })}

      {/* Connection Lines */}
      {metrics.map((_, i) => {
        const angle = i * angleStep - Math.PI / 2;
        const x1 = center + (radius - 20) * Math.cos(angle);
        const y1 = center + (radius - 20) * Math.sin(angle);
        const x2 = center + (radius + 20) * Math.cos(angle);
        const y2 = center + (radius + 20) * Math.sin(angle);

        return (
          <motion.line
            key={`line-${i}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#4a5568"
            strokeWidth="1"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          />
        );
      })}
    </div>
  );
} 
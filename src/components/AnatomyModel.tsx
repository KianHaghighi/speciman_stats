import { motion } from 'framer-motion';

interface MuscleGroup {
  name: string;
  color: string;
  overlay: string; // SVG path for highlight
  position: { x: number; y: number };
}

const muscleGroups: Record<string, MuscleGroup> = {
  'Bench Press': {
    name: 'Chest',
    color: '#FF6B6B',
    overlay: 'M 120,180 Q 150,160 180,180 Q 150,200 120,180 Z',
    position: { x: 150, y: 180 }
  },
  'Squat': {
    name: 'Legs',
    color: '#4ECDC4',
    overlay: 'M 120,300 Q 150,350 180,300 Q 150,250 120,300 Z',
    position: { x: 150, y: 300 }
  },
  'Deadlift': {
    name: 'Back',
    color: '#45B7D1',
    overlay: 'M 100,120 Q 150,100 200,120 Q 150,160 100,120 Z',
    position: { x: 150, y: 120 }
  },
  'Pull-up': {
    name: 'Back',
    color: '#45B7D1',
    overlay: 'M 100,120 Q 150,100 200,120 Q 150,160 100,120 Z',
    position: { x: 150, y: 120 }
  },
  'Overhead Press': {
    name: 'Shoulders',
    color: '#96CEB4',
    overlay: 'M 120,100 Q 150,80 180,100 Q 150,120 120,100 Z',
    position: { x: 150, y: 100 }
  }
};

interface AnatomyModelProps {
  selectedMetric: string;
  userValue: number | undefined;
  allValues: number[];
}

export default function AnatomyModel({ selectedMetric, userValue, allValues }: AnatomyModelProps) {
  const selectedMuscle = muscleGroups[selectedMetric];
  const isActive = !!selectedMetric;

  // Use the ARK-style SVG human image
  const humanImg = '/ark_human.svg';

  // Calculate bell curve data
  const calculateBellCurve = () => {
    if (!allValues.length) return [];
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const range = max - min;
    const step = range / 20;
    const points = [];
    
    for (let i = 0; i <= 20; i++) {
      const x = min + (step * i);
      const y = allValues.filter(v => Math.abs(v - x) < step/2).length;
      points.push({ x, y });
    }
    
    return points;
  };

  const bellCurvePoints = calculateBellCurve();
  const maxY = Math.max(...bellCurvePoints.map(p => p.y));

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      {/* Base Human SVG Image */}
      <img
        src={humanImg}
        alt="Human Specimen"
        className="w-auto h-full object-contain select-none pointer-events-none"
        draggable={false}
        style={{ filter: 'drop-shadow(0 0 20px #222)' }}
      />
      {/* SVG Overlay for muscle highlight and lines */}
      <svg
        viewBox="0 0 300 500"
        className="absolute top-0 left-0 w-full h-full pointer-events-none"
      >
        {isActive && selectedMuscle && (
          <>
            {/* Futuristic Line */}
            <motion.line
              initial={{ x2: 150, y2: 30, opacity: 0 }}
              animate={{ x2: selectedMuscle.position.x, y2: selectedMuscle.position.y, opacity: 1 }}
              x1={150}
              y1={30}
              x2={selectedMuscle.position.x}
              y2={selectedMuscle.position.y}
              stroke={selectedMuscle.color}
              strokeWidth={3}
              strokeDasharray="6 6"
            />
            {/* Muscle Highlight */}
            <motion.path
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.7 }}
              d={selectedMuscle.overlay}
              fill={selectedMuscle.color}
              filter="url(#glow)"
            />
            {/* Glow filter */}
            <defs>
              <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          </>
        )}
      </svg>

      {/* Bell Curve */}
      {isActive && bellCurvePoints.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-0 left-0 right-0 h-48 bg-gray-800/50 rounded-lg p-4"
        >
          <svg
            viewBox={`0 0 ${bellCurvePoints.length} ${maxY}`}
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Bell Curve Line */}
            <path
              d={bellCurvePoints.map((p, i) => 
                `${i === 0 ? 'M' : 'L'} ${i} ${maxY - p.y}`
              ).join(' ')}
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="2"
            />
            
            {/* User's Position Line */}
            {userValue !== undefined && (
              <motion.line
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                x1={bellCurvePoints.findIndex(p => p.x >= userValue)}
                y1="0"
                x2={bellCurvePoints.findIndex(p => p.x >= userValue)}
                y2={maxY}
                stroke="#FF6B6B"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
            )}
          </svg>
        </motion.div>
      )}
    </div>
  );
} 
import { useRouter } from 'next/router';
import { trpc } from '@/utils/trpc';
import { useState, useMemo, useEffect, useRef } from 'react';
import AnatomyModel from '@/components/AnatomyModel';
import { motion, AnimatePresence } from 'framer-motion';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceDot, CartesianGrid, Area } from 'recharts';

interface UserMetric {
  metric_id: number;
  value?: number;
  name: string;
  unit: string;
  percentile?: number;
}

function calculatePercentile(value: number, allValues: number[]): number {
  if (!allValues.length) return 0;
  const sortedValues = [...allValues].sort((a, b) => a - b);
  const index = sortedValues.findIndex(v => v >= value);
  return ((index / sortedValues.length) * 100);
}

interface Metric {
  id: number;
  name: string;
  unit: string;
  category: string;
}

interface Entry {
  metric_id: number;
  value: number;
  user_id: string;
  created_at: string;
}

interface SpecimenLevel {
  elo: number;
  rank: number;
  totalUsers: number;
  tier: string;
  percentiles: Array<{
    metricId: number;
    metricName: string;
    percentile: number;
  }>;
}

// BellCurveGraph component using true normal distribution
function BellCurveGraph({ values, userValue }: { values: number[]; userValue?: number }) {
  if (!values.length || userValue === undefined) return null;
  // Calculate mean and stddev
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const std = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);
  const min = Math.min(...values);
  const max = Math.max(...values);
  // Generate points for the normal distribution curve
  const points = [];
  const steps = 100;
  let maxY = 0;
  for (let i = 0; i <= steps; i++) {
    const x = min + ((max - min) * i) / steps;
    const y = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / std, 2));
    if (y > maxY) maxY = y;
    points.push({ x, y });
  }
  // Normalize y values for better chart visibility
  const normPoints = points.map(p => ({ x: p.x, y: p.y / maxY }));
  // Find y for user value
  const userY = (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((userValue - mean) / std, 2)) / maxY;

  return (
    <div style={{ width: '100%', height: 180 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normPoints} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey="x" type="number" domain={[min, max]} tick={{ fill: '#aaa', fontSize: 12 }} />
          <YAxis domain={[0, 1]} tick={{ fill: '#aaa', fontSize: 12 }} />
          <Tooltip formatter={(value: number) => [value, 'Density']} labelFormatter={x => `Value: ${x}`} />
          <Area type="monotone" dataKey="y" stroke="#4ECDC4" fill="#4ECDC4" fillOpacity={0.15} isAnimationActive={false} />
          <Line type="monotone" dataKey="y" stroke="#4ECDC4" strokeWidth={3} dot={false} isAnimationActive={false} />
          <ReferenceDot x={userValue} y={userY} r={8} fill="#FF6B6B" stroke="#fff" strokeWidth={2} isFront />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function SpecimenPage() {
  const router = useRouter();
  const { id } = router.query;
  const [selectedTab, setSelectedTab] = useState<'stats' | 'level' | 'goals'>('stats');
  const [selectedMetric, setSelectedMetric] = useState<string>('');
  const [newValue, setNewValue] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'strength' | 'endurance' | 'custom'>('all');
  const [selectedTier, setSelectedTier] = useState<'tin' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'bionic'>('tin');

  const { data: user, isLoading: isLoadingUser } = trpc.user.byId.useQuery(
    { id: id as string }
  );
  const { data: specimenLevel, isLoading: isLoadingLevel } = trpc.user.specimenLevel.useQuery(
    { id: id as string }
  ) as { data: SpecimenLevel | undefined; isLoading: boolean };

  const { data: metrics, isLoading: isLoadingMetrics } = trpc.metrics.all.useQuery();
  const { data: entries, isLoading: isLoadingEntries } = trpc.metrics.allEntries.useQuery();
  const addEntry = trpc.metrics.addEntry.useMutation({
    onSuccess: () => setNewValue(''),
  });

  // Map all metrics, showing user value if exists
  const allUserMetrics: UserMetric[] = useMemo(() => {
    if (!metrics) return [];
    return metrics.map((metric: Metric) => {
      const entry = user?.entries?.find((e: Entry) => e.metric_id === metric.id);
      const allValues = entries?.filter((e: Entry) => e.metric_id === metric.id).map((e: Entry) => e.value) || [];
      return {
        metric_id: metric.id,
        value: entry?.value,
        name: metric.name,
        unit: metric.unit,
        percentile: entry ? calculatePercentile(entry.value, allValues) : undefined,
      };
    });
  }, [user?.entries, metrics, entries]);

  // Example metric categories (customize as needed)
  const metricCategories: Record<string, 'strength' | 'endurance' | 'custom'> = {
    'Bench Press': 'strength',
    'Squat': 'strength',
    'Deadlift': 'strength',
    'Pull-ups': 'strength',
    'Mile Run': 'endurance',
  };

  // Filtered and searched metrics
  const filteredMetrics = allUserMetrics.filter((metric) => {
    const matchesSearch = metric.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || metricCategories[metric.name] === filter;
    return matchesSearch && matchesFilter;
  });

  // Auto-select first filtered metric if none selected
  useEffect(() => {
    if (!selectedMetric && filteredMetrics.length > 0) {
      setSelectedMetric(filteredMetrics[0].name);
    }
  }, [filteredMetrics]);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'tin': return 'bg-gray-400';
      case 'bronze': return 'bg-amber-600';
      case 'silver': return 'bg-gray-300';
      case 'gold': return 'bg-yellow-400';
      case 'platinum': return 'bg-blue-400';
      case 'diamond': return 'bg-purple-400';
      case 'bionic': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  // Real-world goal values for all metrics
  const realWorldGoals: Record<string, Record<string, number>> = {
    // Running/Distance Events (time-based, lower is better)
    "100m Dash": { tin: 20, bronze: 17, silver: 15, gold: 13, platinum: 12, diamond: 11, bionic: 10 }, // seconds
    "400m Dash": { tin: 90, bronze: 75, silver: 65, gold: 60, platinum: 55, diamond: 50, bionic: 45 }, // seconds
    "800m Run": { tin: 240, bronze: 210, silver: 180, gold: 165, platinum: 150, diamond: 135, bionic: 120 }, // seconds
    "1.5 Mile Run": { tin: 900, bronze: 780, silver: 660, gold: 600, platinum: 540, diamond: 480, bionic: 420 }, // seconds
    "5k Run": { tin: 1800, bronze: 1560, silver: 1320, gold: 1200, platinum: 1080, diamond: 960, bionic: 840 }, // seconds
    "10k Run": { tin: 3600, bronze: 3120, silver: 2640, gold: 2400, platinum: 2160, diamond: 1920, bionic: 1680 }, // seconds
    "Half Marathon": { tin: 7200, bronze: 6240, silver: 5280, gold: 4800, platinum: 4320, diamond: 3840, bionic: 3360 }, // seconds
    "Marathon": { tin: 14400, bronze: 12480, silver: 10560, gold: 9600, platinum: 8640, diamond: 7680, bionic: 6720 }, // seconds

    // Strength Exercises (weight-based, higher is better)
    "Deadlift": { tin: 135, bronze: 225, silver: 315, gold: 405, platinum: 495, diamond: 585, bionic: 675 }, // lbs
    "Bench Press": { tin: 135, bronze: 185, silver: 225, gold: 275, platinum: 315, diamond: 365, bionic: 405 }, // lbs
    "Squat": { tin: 135, bronze: 225, silver: 315, gold: 405, platinum: 495, diamond: 585, bionic: 675 }, // lbs
    "Overhead Press": { tin: 65, bronze: 95, silver: 135, gold: 155, platinum: 185, diamond: 225, bionic: 275 }, // lbs
    "Front Squat": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Romanian Deadlift": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Incline Bench Press": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Barbell Row": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Power Clean": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Snatch": { tin: 65, bronze: 95, silver: 135, gold: 155, platinum: 185, diamond: 225, bionic: 275 }, // lbs

    // Bodyweight Exercises (rep-based, higher is better)
    "Pull-ups": { tin: 1, bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25, bionic: 30 }, // reps
    "Push-ups": { tin: 10, bronze: 25, silver: 40, gold: 55, platinum: 70, diamond: 85, bionic: 100 }, // reps
    "Dips": { tin: 5, bronze: 15, silver: 25, gold: 35, platinum: 45, diamond: 55, bionic: 65 }, // reps
    "Chin-ups": { tin: 1, bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25, bionic: 30 }, // reps
    "Muscle-ups": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
    "Handstand Push-ups": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
    "L-sit Hold": { tin: 5, bronze: 15, silver: 30, gold: 45, platinum: 60, diamond: 75, bionic: 90 }, // seconds
    "Planche Hold": { tin: 0, bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25, bionic: 30 }, // seconds
    "Front Lever Hold": { tin: 0, bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25, bionic: 30 }, // seconds
    "Back Lever Hold": { tin: 0, bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25, bionic: 30 }, // seconds

    // Endurance/HIIT Exercises (rep-based, higher is better)
    "Burpees": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Box Jump (24\")": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Wall Ball (20lb)": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Kettlebell Swing (53lb)": { tin: 10, bronze: 20, silver: 30, gold: 40, platinum: 50, diamond: 60, bionic: 70 }, // reps
    "Farmers Walk (50m, 2x32kg)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // rounds
    "Battle Ropes (30s)": { tin: 20, bronze: 30, silver: 40, gold: 50, platinum: 60, diamond: 70, bionic: 80 }, // reps
    "Rope Climb (15ft)": { tin: 0, bronze: 1, silver: 2, gold: 3, platinum: 4, diamond: 5, bionic: 6 }, // reps
    "Sled Push (50m)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // rounds
    "Sled Pull (50m)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // rounds
    "Tire Flip (400lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps

    // Core/Stability Exercises (time-based or rep-based)
    "Plank": { tin: 30, bronze: 60, silver: 90, gold: 120, platinum: 150, diamond: 180, bionic: 210 }, // seconds
    "Side Plank": { tin: 20, bronze: 40, silver: 60, gold: 80, platinum: 100, diamond: 120, bionic: 140 }, // seconds
    "Hollow Hold": { tin: 20, bronze: 40, silver: 60, gold: 80, platinum: 100, diamond: 120, bionic: 140 }, // seconds
    "Arch Hold": { tin: 20, bronze: 40, silver: 60, gold: 80, platinum: 100, diamond: 120, bionic: 140 }, // seconds
    "Dragon Flag": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
    "Ab Wheel Rollout": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Hanging Leg Raise": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Russian Twist (20lb)": { tin: 10, bronze: 20, silver: 30, gold: 40, platinum: 50, diamond: 60, bionic: 70 }, // reps
    "Pallof Press (30s)": { tin: 10, bronze: 20, silver: 30, gold: 40, platinum: 50, diamond: 60, bionic: 70 }, // reps
    "Turkish Get-up (53lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps

    // Mobility/Flexibility (time-based, higher is better)
    "Overhead Squat Hold": { tin: 30, bronze: 60, silver: 90, gold: 120, platinum: 150, diamond: 180, bionic: 210 }, // seconds
    "Pike Stretch": { tin: 30, bronze: 60, silver: 90, gold: 120, platinum: 150, diamond: 180, bionic: 210 }, // seconds
    "Bridge Hold": { tin: 20, bronze: 40, silver: 60, gold: 80, platinum: 100, diamond: 120, bionic: 140 }, // seconds
    "Splits Hold": { tin: 30, bronze: 60, silver: 90, gold: 120, platinum: 150, diamond: 180, bionic: 210 }, // seconds
    "Shoulder Dislocate": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Hip Mobility": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Ankle Mobility": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Thoracic Extension": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Hip Flexor Stretch": { tin: 30, bronze: 60, silver: 90, gold: 120, platinum: 150, diamond: 180, bionic: 210 }, // seconds
    "Hamstring Stretch": { tin: 30, bronze: 60, silver: 90, gold: 120, platinum: 150, diamond: 180, bionic: 210 }, // seconds

    // Olympic Lifts (weight-based, higher is better)
    "Clean & Jerk": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Snatch Balance": { tin: 65, bronze: 95, silver: 135, gold: 155, platinum: 185, diamond: 225, bionic: 275 }, // lbs
    "Hang Clean": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Hang Snatch": { tin: 65, bronze: 95, silver: 135, gold: 155, platinum: 185, diamond: 225, bionic: 275 }, // lbs
    "Push Press": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Jerk Balance": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Drop Snatch": { tin: 65, bronze: 95, silver: 135, gold: 155, platinum: 185, diamond: 225, bionic: 275 }, // lbs
    "Clean Pull": { tin: 135, bronze: 185, silver: 225, gold: 275, platinum: 315, diamond: 365, bionic: 405 }, // lbs
    "Snatch Pull": { tin: 95, bronze: 135, silver: 185, gold: 225, platinum: 275, diamond: 315, bionic: 365 }, // lbs
    "Overhead Squat": { tin: 65, bronze: 95, silver: 135, gold: 155, platinum: 185, diamond: 225, bionic: 275 }, // lbs

    // Strongman Events (weight-based or time-based)
    "Atlas Stone (200lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps
    "Log Press (200lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps
    "Car Deadlift (500lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps
    "Yoke Walk (400lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // rounds
    "Frame Carry (400lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // rounds
    "Circus Dumbbell (100lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps
    "Sandbag Carry (200lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // rounds
    "Tire Deadlift (600lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps
    "Axle Press (200lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps
    "Keg Toss (50lb)": { tin: 1, bronze: 2, silver: 3, gold: 4, platinum: 5, diamond: 6, bionic: 7 }, // reps

    // Gymnastics Skills (rep-based or time-based)
    "Ring Muscle-up": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
    "Bar Muscle-up": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
    "Ring Support Hold": { tin: 10, bronze: 20, silver: 30, gold: 40, platinum: 50, diamond: 60, bionic: 70 }, // seconds
    "Ring L-sit": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // seconds
    "Ring Dips": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Ring Rows": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Ring Push-ups": { tin: 5, bronze: 10, silver: 15, gold: 20, platinum: 25, diamond: 30, bionic: 35 }, // reps
    "Ring Pull-ups": { tin: 1, bronze: 5, silver: 10, gold: 15, platinum: 20, diamond: 25, bionic: 30 }, // reps
    "Ring Support to L-sit": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
    "Ring Support to Handstand": { tin: 0, bronze: 1, silver: 3, gold: 5, platinum: 7, diamond: 9, bionic: 12 }, // reps
  };

  // For any metric not in the above, generate reasonable placeholders
  const getGoalForMetric = (metricName: string, tier: string): number => {
    // First check if we have a real-world goal for this metric
    if (realWorldGoals[metricName]?.[tier]) {
      return realWorldGoals[metricName][tier];
    }

    // For metrics not in our predefined list, generate reasonable goals
    const baseValue = 10; // Base value for tin tier
    const tierMultipliers: Record<string, number> = {
      tin: 1,
      bronze: 1.5,
      silver: 2,
      gold: 2.5,
      platinum: 3,
      diamond: 3.5,
      bionic: 4
    };

    return Math.round(baseValue * tierMultipliers[tier]);
  };

  // Use real-world goals for progress bars
  const getTierValue = (metricName: string, tier: string) => {
    return getGoalForMetric(metricName, tier);
  };

  const getProgressPercentage = (metricName: string, tier: string) => {
    const userMetric = allUserMetrics.find(m => m.name === metricName);
    if (!userMetric || typeof userMetric.value !== 'number') return 0;
    const targetValue = getTierValue(metricName, tier);
    // For Mile Run, lower is better
    if (metricName === 'Mile Run') {
      if (!targetValue) return 0;
      return Math.min((targetValue / userMetric.value) * 100, 100);
    }
    return Math.min((userMetric.value / targetValue) * 100, 100);
  };

  const prevRank = useRef<number | null>(null);
  const prevTier = useRef<string | null>(null);
  const [rankAnim, setRankAnim] = useState<'up' | 'down' | null>(null);
  const [tierAnim, setTierAnim] = useState<'up' | 'down' | null>(null);

  useEffect(() => {
    if (specimenLevel) {
      if (prevRank.current !== null && specimenLevel.rank !== prevRank.current) {
        setRankAnim(specimenLevel.rank < prevRank.current ? 'up' : 'down');
        setTimeout(() => setRankAnim(null), 2000);
      }
      if (prevTier.current !== null && specimenLevel.tier !== prevTier.current) {
        setTierAnim(specimenLevel.tier > prevTier.current ? 'up' : 'down');
        setTimeout(() => setTierAnim(null), 2000);
      }
      prevRank.current = specimenLevel.rank;
      prevTier.current = specimenLevel.tier;
    }
  }, [specimenLevel]);

  if (isLoadingUser || isLoadingMetrics || isLoadingEntries || isLoadingLevel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-2xl"
        >
          Loading...
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-white text-2xl"
        >
          User not found
        </motion.div>
      </div>
    );
  }

  const selectedMetricData = allUserMetrics.find((m) => m.name === selectedMetric);
  const allValues = entries?.filter((e: Entry) => e.metric_id === selectedMetricData?.metric_id).map((e: Entry) => e.value) || [];

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMetricData || !newValue) return;
    addEntry.mutate({
      metricId: selectedMetricData.metric_id,
      value: parseFloat(newValue),
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">{user.name || 'Unknown User'}</h1>
          <p className="text-gray-400">Specimen Analysis</p>
        </motion.div>

        {/* Tabs */}
        <div className="flex justify-center mb-8 gap-4">
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${selectedTab === 'stats' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setSelectedTab('stats')}
          >
            Stats
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${selectedTab === 'level' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setSelectedTab('level')}
          >
            Specimen Level
          </button>
          <button
            className={`px-4 py-2 rounded-t-lg font-semibold transition-all ${selectedTab === 'goals' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
            onClick={() => setSelectedTab('goals')}
          >
            Goals
          </button>
        </div>

        {selectedTab === 'level' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl mx-auto bg-gray-800/60 rounded-lg p-8 text-center shadow-lg"
          >
            {isLoadingLevel ? (
              <div className="text-white text-xl">Loading level...</div>
            ) : specimenLevel ? (
              <>
                <div className="relative flex flex-col items-center mb-4">
                  <AnimatePresence>
                    {rankAnim === 'up' && (
                      <motion.div
                        key="rank-up"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="absolute z-10 text-green-400 text-3xl font-bold left-1/2 -translate-x-1/2"
                      >
                        + Rank Up!
                      </motion.div>
                    )}
                    {rankAnim === 'down' && (
                      <motion.div
                        key="rank-down"
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 10, opacity: 0 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="absolute z-10 text-red-400 text-3xl font-bold left-1/2 -translate-x-1/2"
                      >
                        - Rank Down
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.div
                    animate={tierAnim === 'up' ? { scale: [1, 1.3, 1] } : tierAnim === 'down' ? { scale: [1, 0.8, 1] } : {}}
                    transition={{ duration: 1 }}
                    className="flex flex-col items-center"
                  >
                    <h2 className="text-3xl font-bold text-blue-400 mb-2">Elo {specimenLevel?.elo}</h2>
                    <div className="text-white text-lg mb-2">Rank #{specimenLevel?.rank} / {specimenLevel?.totalUsers}</div>
                    <div className="text-white text-lg mb-4">Tier: <span className="font-bold text-blue-300">{specimenLevel?.tier}</span></div>
                  </motion.div>
                  {/* Confetti burst on rank up */}
                  <AnimatePresence>
                    {rankAnim === 'up' && (
                      <motion.div
                        key="confetti"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 1 }}
                        className="absolute inset-0 pointer-events-none z-20"
                      >
                        {/* Simple confetti effect (can be replaced with a confetti lib) */}
                        <div className="w-full h-full flex flex-wrap justify-center items-center">
                          {[...Array(30)].map((_, i) => (
                            <motion.div
                              key={i}
                              initial={{ y: 0, opacity: 1 }}
                              animate={{ y: [0, 80 + Math.random() * 40], opacity: [1, 0] }}
                              transition={{ duration: 1.2, delay: i * 0.03 }}
                              className="w-2 h-2 rounded-full"
                              style={{ background: `hsl(${Math.random() * 360}, 80%, 60%)`, margin: 2 }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-6 text-left">
                  <h3 className="text-lg font-semibold text-blue-300 mb-2">Percentile Breakdown</h3>
                  <ul className="space-y-1">
                    {specimenLevel.percentiles.map((p) => (
                      <li key={p.metricId} className="flex justify-between text-gray-200">
                        <span>{p.metricName}</span>
                        <span>{(p.percentile * 100).toFixed(1)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <div className="text-red-400">No level data available.</div>
            )}
          </motion.div>
        ) : selectedTab === 'goals' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto bg-gray-800/60 rounded-lg p-8 shadow-lg"
          >
            {/* User's overall tier above search bar */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg font-bold text-white">Tier:</span>
              <span className="text-xl font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 text-white shadow">
                {specimenLevel?.tier || 'Unknown'}
              </span>
            </div>
            {/* Search bar */}
            <div className="mb-6 flex items-center gap-4">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search exercise..."
                className="flex-1 p-2 rounded bg-gray-900 text-white border border-gray-700"
              />
            </div>
            {/* Tier Selection */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {(['tin', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'bionic'] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    selectedTier === tier 
                      ? `${getTierColor(tier)} text-white` 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </button>
              ))}
            </div>
            <div className="space-y-4">
              {metrics?.filter((m: Metric) => m.name.toLowerCase().includes(search.toLowerCase())).map((metric: Metric) => {
                const progress = getProgressPercentage(metric.name, selectedTier);
                const targetValue = getTierValue(metric.name, selectedTier);
                const userMetric = allUserMetrics.find((m: UserMetric) => m.name === metric.name);
                return (
                  <div key={metric.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-white">{metric.name}</h3>
                      <div className="text-gray-300">
                        {userMetric ? `${userMetric.value} / ${targetValue}` : `0 / ${targetValue}`}
                        {metric.name === 'Mile Run' ? ' min' : ` ${metric.unit}`}
                      </div>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-4 overflow-hidden">
                      <div
                        className={`${getTierColor(selectedTier)} h-4 transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-sm text-gray-400">
                      {progress >= 100 
                        ? 'Goal achieved! 🎉' 
                        : `${Math.round(progress)}% complete`}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left side: 2D Human Model */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm"
            >
              <AnatomyModel
                selectedMetric={selectedMetric}
                userValue={selectedMetricData?.value}
                allValues={allValues}
              />
              {/* Stat boxes above the bell curve graph */}
              {selectedMetricData && selectedMetricData.value !== undefined && (
                <div className="mt-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm">Current Value</h3>
                    <p className="text-white text-2xl font-bold">
                      {selectedMetricData.value} {selectedMetricData.unit}
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm">Percentile Rank</h3>
                    <p className="text-white text-2xl font-bold">
                      {selectedMetricData.percentile?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <h3 className="text-gray-400 text-sm">Total Entries</h3>
                    <p className="text-white text-2xl font-bold">{allValues.length}</p>
                  </div>
                </div>
              )}
              {/* Bell Curve Graph directly under the human */}
              {selectedMetricData && selectedMetricData.value !== undefined && (
                <div className="mt-6">
                  <BellCurveGraph values={allValues} userValue={selectedMetricData.value} />
                </div>
              )}
            </motion.div>

            {/* Right side: Metric Selection and Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-6"
            >
              {/* Metric Selection */}
              <div className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm">
                <h2 className="text-xl font-bold text-white mb-4">Select Exercise</h2>
                {/* Search and Filter */}
                <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search exercise..."
                    className="flex-1 p-2 rounded bg-gray-900 text-white border border-gray-700"
                  />
                  <div className="flex gap-2 mt-2 md:mt-0">
                    <button onClick={() => setFilter('all')} className={`px-3 py-1 rounded ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>All</button>
                    <button onClick={() => setFilter('strength')} className={`px-3 py-1 rounded ${filter === 'strength' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Strength</button>
                    <button onClick={() => setFilter('endurance')} className={`px-3 py-1 rounded ${filter === 'endurance' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Endurance</button>
                    <button onClick={() => setFilter('custom')} className={`px-3 py-1 rounded ${filter === 'custom' ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'}`}>Custom</button>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {filteredMetrics.map((metric) => (
                    <motion.button
                      key={metric.name}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedMetric(metric.name)}
                      className={`p-4 rounded-lg text-left transition-all ${
                        selectedMetric === metric.name
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-semibold text-lg">{metric.name}</h3>
                          <p className="text-sm opacity-75">
                            {metric.value !== undefined ? `${metric.value} ${metric.unit}` : 'No entry yet'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {metric.percentile !== undefined ? `${metric.percentile.toFixed(1)}%` : '--'}
                          </p>
                          <p className="text-xs opacity-75">Percentile</p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Add Entry Form if no entry */}
              {selectedMetricData && selectedMetricData.value === undefined ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gray-800/50 rounded-lg p-6 backdrop-blur-sm"
                >
                  <h2 className="text-xl font-bold text-white mb-4">No Entry Yet</h2>
                  <form onSubmit={handleAddEntry} className="flex gap-2 items-center">
                    <input
                      type="number"
                      step="any"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder={`Enter value in ${selectedMetricData.unit}`}
                      className="flex-1 p-2 rounded bg-gray-900 text-white border border-gray-700"
                      required
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                      disabled={addEntry.status === 'pending'}
                    >
                      {addEntry.status === 'pending' ? 'Adding...' : 'Add Entry'}
                    </button>
                  </form>
                </motion.div>
              ) : null}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
} 
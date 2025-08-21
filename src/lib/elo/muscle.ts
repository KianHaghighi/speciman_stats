import { eloFromPercentile } from './math';
import { calculatePercentile } from '../stats/percentile';

// Muscle group definitions with related metrics and weights
export interface MuscleGroup {
  id: string;
  name: string;
  displayName: string;
  metrics: Array<{
    slug: string;
    weight: number;
    description: string;
  }>;
  svgPath: string; // SVG path for the muscle region
  position: { x: number; y: number }; // Position for tooltips
}

export const MUSCLE_GROUPS: Record<string, MuscleGroup> = {
  chest: {
    id: 'chest',
    name: 'Chest',
    displayName: 'Chest',
    metrics: [
      { slug: 'bench_press', weight: 0.4, description: 'Bench Press' },
      { slug: 'incline_bench_press', weight: 0.3, description: 'Incline Bench Press' },
      { slug: 'decline_bench_press', weight: 0.2, description: 'Decline Bench Press' },
      { slug: 'dumbbell_bench_press', weight: 0.1, description: 'Dumbbell Bench Press' },
    ],
    svgPath: 'M 120,180 Q 150,160 180,180 Q 150,200 120,180 Z',
    position: { x: 150, y: 180 }
  },
  back: {
    id: 'back',
    name: 'Back',
    displayName: 'Back',
    metrics: [
      { slug: 'deadlift', weight: 0.4, description: 'Deadlift' },
      { slug: 'pull_ups', weight: 0.3, description: 'Pull-ups' },
      { slug: 'barbell_row', weight: 0.2, description: 'Barbell Row' },
      { slug: 'lat_pulldown', weight: 0.1, description: 'Lat Pulldown' },
    ],
    svgPath: 'M 100,120 Q 150,100 200,120 Q 150,160 100,120 Z',
    position: { x: 150, y: 120 }
  },
  shoulders: {
    id: 'shoulders',
    name: 'Shoulders',
    displayName: 'Shoulders',
    metrics: [
      { slug: 'overhead_press', weight: 0.5, description: 'Overhead Press' },
      { slug: 'lateral_raise', weight: 0.3, description: 'Lateral Raise' },
      { slug: 'front_raise', weight: 0.2, description: 'Front Raise' },
    ],
    svgPath: 'M 120,100 Q 150,80 180,100 Q 150,120 120,100 Z',
    position: { x: 150, y: 100 }
  },
  arms: {
    id: 'arms',
    name: 'Arms',
    displayName: 'Arms',
    metrics: [
      { slug: 'bicep_curl', weight: 0.4, description: 'Bicep Curl' },
      { slug: 'tricep_pushdown', weight: 0.4, description: 'Tricep Pushdown' },
      { slug: 'hammer_curl', weight: 0.2, description: 'Hammer Curl' },
    ],
    svgPath: 'M 80,140 Q 100,120 120,140 Q 100,160 80,140 Z M 180,140 Q 200,120 220,140 Q 200,160 180,140 Z',
    position: { x: 150, y: 140 }
  },
  core: {
    id: 'core',
    name: 'Core',
    displayName: 'Core',
    metrics: [
      { slug: 'plank', weight: 0.3, description: 'Plank Hold' },
      { slug: 'russian_twist', weight: 0.3, description: 'Russian Twist' },
      { slug: 'pallof_press', weight: 0.2, description: 'Pallof Press' },
      { slug: 'turkish_getup', weight: 0.2, description: 'Turkish Get-up' },
    ],
    svgPath: 'M 130,220 Q 150,200 170,220 Q 150,240 130,220 Z',
    position: { x: 150, y: 220 }
  },
  legs: {
    id: 'legs',
    name: 'Legs',
    displayName: 'Legs',
    metrics: [
      { slug: 'squat', weight: 0.4, description: 'Squat' },
      { slug: 'front_squat', weight: 0.2, description: 'Front Squat' },
      { slug: 'leg_press', weight: 0.2, description: 'Leg Press' },
      { slug: 'leg_extension', weight: 0.1, description: 'Leg Extension' },
      { slug: 'leg_curl', weight: 0.1, description: 'Leg Curl' },
    ],
    svgPath: 'M 120,300 Q 150,350 180,300 Q 150,250 120,300 Z',
    position: { x: 150, y: 300 }
  },
  cardio: {
    id: 'cardio',
    name: 'Cardio',
    displayName: 'Cardiovascular',
    metrics: [
      { slug: 'mile_run', weight: 0.3, description: 'Mile Run' },
      { slug: '5k_run', weight: 0.3, description: '5K Run' },
      { slug: '100m_dash', weight: 0.2, description: '100m Dash' },
      { slug: '400m_dash', weight: 0.2, description: '400m Dash' },
    ],
    svgPath: 'M 140,80 Q 150,60 160,80 Q 150,100 140,80 Z',
    position: { x: 150, y: 80 }
  }
};

// Rank colors for muscle ELO tiers
export const RANK_COLORS = {
  unranked: '#6B7280', // gray-500
  bronze: '#D97706',   // amber-600
  silver: '#9CA3AF',   // gray-400
  gold: '#EAB308',     // yellow-500
  platinum: '#3B82F6', // blue-500
  diamond: '#8B5CF6',  // violet-500
  legendary: '#EF4444', // red-500
} as const;

export type RankTier = keyof typeof RANK_COLORS;

// Calculate muscle ELO from user's metric entries
export function calculateMuscleElo(
  muscleGroupId: string,
  userEntries: Array<{ metric_slug: string; value: number }>,
  allEntries: Record<string, Array<{ value: number; higherIsBetter: boolean }>>,
  userClass?: string
): {
  elo: number;
  percentile: number;
  tier: RankTier;
  topContributor: string;
  topValue: number;
} {
  const muscleGroup = MUSCLE_GROUPS[muscleGroupId];
  if (!muscleGroup) {
    return {
      elo: 500,
      percentile: 50,
      tier: 'unranked',
      topContributor: 'Unknown',
      topValue: 0
    };
  }

  // Filter user entries for this muscle group
  const relevantEntries = userEntries.filter(entry => 
    muscleGroup.metrics.some(metric => metric.slug === entry.metric_slug)
  );

  if (relevantEntries.length === 0) {
    return {
      elo: 500,
      percentile: 50,
      tier: 'unranked',
      topContributor: 'No data',
      topValue: 0
    };
  }

  // Calculate weighted average percentile for the muscle group
  let totalWeightedPercentile = 0;
  let totalWeight = 0;
  let topContributor = '';
  let topValue = 0;

  for (const metric of muscleGroup.metrics) {
    const userEntry = relevantEntries.find(e => e.metric_slug === metric.slug);
    if (!userEntry) continue;

    const metricData = allEntries[metric.slug];
    if (!metricData || metricData.length === 0) continue;

    // Find the metric config to determine if higher is better
    const higherIsBetter = metricData[0]?.higherIsBetter ?? true;
    
    // Calculate percentile for this metric
    const values = metricData.map(d => d.value);
    const percentile = calculatePercentile(values, userEntry.value, higherIsBetter);
    
    // Weight the percentile
    totalWeightedPercentile += percentile.percentile * metric.weight;
    totalWeight += metric.weight;

    // Track top contributor
    if (percentile.percentile > topValue) {
      topValue = percentile.percentile;
      topContributor = metric.description;
    }
  }

  if (totalWeight === 0) {
    return {
      elo: 500,
      percentile: 50,
      tier: 'unranked',
      topContributor: 'No data',
      topValue: 0
    };
  }

  // Calculate final weighted percentile
  const finalPercentile = totalWeightedPercentile / totalWeight;
  
  // Convert to ELO
  const elo = eloFromPercentile(finalPercentile);
  
  // Determine tier
  const tier = percentileToTier(finalPercentile);

  return {
    elo,
    percentile: finalPercentile,
    tier,
    topContributor,
    topValue: topValue
  };
}

// Convert percentile to tier
function percentileToTier(percentile: number): RankTier {
  if (percentile >= 95) return 'legendary';
  if (percentile >= 85) return 'diamond';
  if (percentile >= 70) return 'platinum';
  if (percentile >= 50) return 'gold';
  if (percentile >= 25) return 'silver';
  if (percentile >= 10) return 'bronze';
  return 'unranked';
}

// Get all muscle ELOs for a user
export function calculateAllMuscleElos(
  userEntries: Array<{ metric_slug: string; value: number }>,
  allEntries: Record<string, Array<{ value: number; higherIsBetter: boolean }>>,
  userClass?: string
): Record<string, ReturnType<typeof calculateMuscleElo>> {
  const results: Record<string, ReturnType<typeof calculateMuscleElo>> = {};
  
  for (const muscleGroupId of Object.keys(MUSCLE_GROUPS)) {
    results[muscleGroupId] = calculateMuscleElo(muscleGroupId, userEntries, allEntries, userClass);
  }
  
  return results;
}

// Get muscle group by metric slug
export function getMuscleGroupByMetric(metricSlug: string): MuscleGroup | null {
  for (const muscleGroup of Object.values(MUSCLE_GROUPS)) {
    if (muscleGroup.metrics.some(m => m.slug === metricSlug)) {
      return muscleGroup;
    }
  }
  return null;
}

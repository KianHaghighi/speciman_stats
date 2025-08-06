// Comprehensive Elo system for multi-metric fitness app
// Classic Elo with K-factor 32, class-specific ratings, and tier system

export const MIN_ELO = 0;
export const TIN_ELO = 500;
export const MAX_ELO = 3000;

// Tier thresholds
export const TIER_THRESHOLDS = {
  TIN: 1000,
  BRONZE: 1200,
  SILVER: 1400,
  GOLD: 1600,
  PLATINUM: 1800,
  DIAMOND: 2000,
  BIONIC: 2000, // ≥2000
};

// Fitness classes
export const FITNESS_CLASSES = {
  TITAN: 'The Titan',
  BEAST: 'The Beast',
  BODYWEIGHT: 'Bodyweight Master',
  SUPER_ATHLETE: 'Super Athlete',
  HUNTER_GATHERER: 'Hunter-Gatherer',
} as const;

export type FitnessClass = typeof FITNESS_CLASSES[keyof typeof FITNESS_CLASSES];

// Classic Elo calculation with K-factor 32
export function calcElo(expected: number, score: number, k: number = 32): number {
  return Math.round(expected + k * (score - expected));
}

// Calculate expected score for player A vs player B
export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

// Calculate new Elo rating after a match
export function newRating(rating: number, score: number, expected: number, k: number = 32): number {
  return calcElo(expected, score, k);
}

// Convert percentile (0-1) to Elo rating
export function percentileToElo(percentile: number): number {
  if (percentile <= 0) return TIN_ELO;
  // Use a curve for more reward at the top
  return Math.round(TIN_ELO + (MAX_ELO - TIN_ELO) * Math.pow(percentile, 1.5));
}

// Calculate class Elo from percentiles
export function classElo(percentiles: number[]): number {
  if (!percentiles.length) return MIN_ELO;
  const avg = percentiles.reduce((a, b) => a + b, 0) / percentiles.length;
  return percentileToElo(avg);
}

// Calculate total Elo from class Elos
export function totalElo(classElos: Record<string, number>): number {
  const elos = Object.values(classElos).filter((e: number) => e > 0);
  if (!elos.length) return MIN_ELO;
  return Math.round(elos.reduce((a, b) => a + b, 0) / elos.length);
}

// Determine tier from Elo rating
export function tierFromElo(elo: number): string {
  if (elo < TIER_THRESHOLDS.TIN) return 'Tin';
  if (elo < TIER_THRESHOLDS.BRONZE) return 'Bronze';
  if (elo < TIER_THRESHOLDS.SILVER) return 'Silver';
  if (elo < TIER_THRESHOLDS.GOLD) return 'Gold';
  if (elo < TIER_THRESHOLDS.PLATINUM) return 'Platinum';
  if (elo < TIER_THRESHOLDS.DIAMOND) return 'Diamond';
  return 'Bionic';
}

// Calculate percentile from value and distribution
export function calculatePercentile(value: number, distribution: number[]): number {
  if (!distribution.length) return 0;
  
  const sorted = [...distribution].sort((a, b) => a - b);
  const index = sorted.findIndex(v => v >= value);
  
  if (index === -1) return 1; // Value is higher than all others
  if (sorted.length === 1) return 1; // Only one value
  
  return index / (sorted.length - 1);
}

// Class-specific metric mappings
export const CLASS_METRICS: Record<FitnessClass, string[]> = {
  [FITNESS_CLASSES.TITAN]: [
    'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Front Squat',
    'Romanian Deadlift', 'Incline Bench Press', 'Barbell Row', 'Power Clean', 'Snatch'
  ],
  [FITNESS_CLASSES.BEAST]: [
    'Dumbbell Bench Press', 'Dumbbell Row', 'Lat Pulldown', 'Leg Press', 'Hack Squat',
    'Chest Fly', 'Triceps Pushdown', 'Biceps Curl', 'Leg Extension', 'Leg Curl'
  ],
  [FITNESS_CLASSES.BODYWEIGHT]: [
    'Pull-ups', 'Push-ups', 'Dips', 'Chin-ups', 'Muscle-ups',
    'Handstand Push-ups', 'Burpees', 'Plank', 'L-sit Hold', 'Planche Hold'
  ],
  [FITNESS_CLASSES.SUPER_ATHLETE]: [
    'Mile Run', '100m Dash', '400m Dash', 'Box Jump (24")', 'Power Clean',
    'Snatch', 'Vertical Jump', 'Broad Jump'
  ],
  [FITNESS_CLASSES.HUNTER_GATHERER]: [
    '5k Run', '10k Run', 'Half Marathon', 'Marathon', 'Cycling 20km',
    'Row 2k', 'Swim 1k'
  ],
};

// Calculate all class Elos for a user
export function calculateUserClassElos(
  userEntries: Array<{ metric_id: number; value: number }>,
  allEntries: Array<{ metric_id: number; value: number }>,
  metrics: Array<{ id: number; name: string; category: string }>
): Record<string, number> {
  const classElos: Record<string, number> = {};
  
  // Calculate Elo for each class
  Object.entries(CLASS_METRICS).forEach(([className, metricNames]) => {
    const percentiles: number[] = [];
    
    metricNames.forEach(metricName => {
      const metric = metrics.find(m => m.name === metricName);
      if (!metric) return;
      
      const metricEntries = allEntries.filter(e => e.metric_id === metric.id);
      const userMetricEntries = userEntries.filter(e => e.metric_id === metric.id);
      
      if (!userMetricEntries.length || !metricEntries.length) return;
      
      const userBest = Math.max(...userMetricEntries.map(e => e.value));
      const percentile = calculatePercentile(userBest, metricEntries.map(e => e.value));
      percentiles.push(percentile);
    });
    
    classElos[className] = classElo(percentiles);
  });
  
  return classElos;
}

// In-memory cache for development (replace with Redis in production)
const eloCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 seconds

export function getCachedElo<T>(userId: string): T | null {
  const cached = eloCache.get(userId);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    eloCache.delete(userId);
    return null;
  }
  
  return cached.data as T;
}

export function setCachedElo<T>(userId: string, data: T): void {
  eloCache.set(userId, { data, timestamp: Date.now() });
}

export function clearEloCache(): void {
  eloCache.clear();
} 
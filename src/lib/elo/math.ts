/**
 * Core ELO calculation system with logistic mapping to 0-3000 range
 * Median ≈ 500, P95 ≈ 1800, P99 ≈ 2500
 */

import { calculatePercentile } from '../stats/percentile';

// ELO system constants
export const ELO_CONSTANTS = {
  K_FACTOR: 32, // Base K-factor for rating changes
  BASE_RATING: 500, // Base rating (median)
  MAX_RATING: 3000, // Maximum possible rating
  MIN_RATING: 0, // Minimum possible rating
  SCALE_FACTOR: 400, // Scaling factor for logistic function
  LOGISTIC_STEEPNESS: 0.01, // Controls how steep the logistic curve is
} as const;

/**
 * Convert percentile (0-100) to ELO rating using logistic function
 * @param percentile - Percentile value (0-100)
 * @returns ELO rating (0-3000)
 */
export function eloFromPercentile(percentile: number): number {
  // Convert percentile to 0-1 range
  const p = Math.max(0.001, Math.min(0.999, percentile / 100));
  
  // Use logistic function to map to ELO range
  // This creates a smooth S-curve with median at 500
  const logit = Math.log(p / (1 - p));
  const elo = ELO_CONSTANTS.BASE_RATING + (logit * ELO_CONSTANTS.SCALE_FACTOR);
  
  // Clamp to valid range
  return Math.max(ELO_CONSTANTS.MIN_RATING, Math.min(ELO_CONSTANTS.MAX_RATING, elo));
}

/**
 * Convert ELO rating to percentile (0-100)
 * @param elo - ELO rating (0-3000)
 * @returns Percentile value (0-100)
 */
export function percentileFromElo(elo: number): number {
  // Normalize ELO to base rating
  const normalizedElo = (elo - ELO_CONSTANTS.BASE_RATING) / ELO_CONSTANTS.SCALE_FACTOR;
  
  // Convert using inverse logistic function
  const p = 1 / (1 + Math.exp(-normalizedElo));
  
  // Convert to percentile and clamp
  return Math.max(0, Math.min(100, p * 100));
}

/**
 * Calculate expected score between two ELO ratings
 * @param ratingA - First player's ELO rating
 * @param ratingB - Second player's ELO rating
 * @returns Expected score for player A (0-1)
 */
export function expectedScore(ratingA: number, ratingB: number): number {
  const ratingDiff = ratingB - ratingA;
  return 1 / (1 + Math.pow(10, ratingDiff / ELO_CONSTANTS.SCALE_FACTOR));
}

/**
 * Calculate new ELO rating after a match/performance
 * @param currentRating - Current ELO rating
 * @param expectedScore - Expected score (0-1)
 * @param actualScore - Actual score (0-1)
 * @param kFactor - K-factor for this match (default: ELO_CONSTANTS.K_FACTOR)
 * @returns New ELO rating
 */
export function calculateNewRating(
  currentRating: number,
  expectedScore: number,
  actualScore: number,
  kFactor: number = ELO_CONSTANTS.K_FACTOR
): number {
  const ratingChange = kFactor * (actualScore - expectedScore);
  const newRating = currentRating + ratingChange;
  
  // Clamp to valid range
  return Math.max(ELO_CONSTANTS.MIN_RATING, Math.min(ELO_CONSTANTS.MAX_RATING, newRating));
}

/**
 * Calculate ELO change for a performance improvement
 * @param oldValue - Previous metric value
 * @param newValue - New metric value
 * @param allValues - Array of all values for this metric
 * @param higherIsBetter - Whether higher values are better
 * @param currentElo - Current ELO rating
 * @returns Object with new ELO and change amount
 */
export function calculateEloChange(
  oldValue: number,
  newValue: number,
  allValues: number[],
  higherIsBetter: boolean,
  currentElo: number
): { newElo: number; change: number } {
  // Calculate old and new percentiles
  const oldPercentile = calculatePercentile(allValues, oldValue, higherIsBetter);
  const newPercentile = calculatePercentile(allValues, newValue, higherIsBetter);
  
  // Convert percentiles to ELO
  const oldElo = eloFromPercentile(oldPercentile.percentile);
  const newElo = eloFromPercentile(newPercentile.percentile);
  
  // Calculate change
  const change = newElo - oldElo;
  
  return {
    newElo: Math.max(ELO_CONSTANTS.MIN_RATING, Math.min(ELO_CONSTANTS.MAX_RATING, currentElo + change)),
    change,
  };
}

/**
 * Calculate K-factor based on performance tier and number of games
 * Higher tiers get lower K-factors (more stable ratings)
 * @param currentElo - Current ELO rating
 * @param gamesPlayed - Number of games/performances
 * @returns K-factor for rating calculation
 */
export function calculateKFactor(currentElo: number, gamesPlayed: number): number {
  let kFactor = ELO_CONSTANTS.K_FACTOR;
  
  // Reduce K-factor for higher ratings (more stable)
  if (currentElo >= 2000) kFactor *= 0.5;
  else if (currentElo >= 1500) kFactor *= 0.75;
  else if (currentElo >= 1000) kFactor *= 0.9;
  
  // Reduce K-factor for experienced players
  if (gamesPlayed >= 100) kFactor *= 0.8;
  else if (gamesPlayed >= 50) kFactor *= 0.9;
  else if (gamesPlayed >= 20) kFactor *= 0.95;
  
  return Math.max(8, kFactor); // Minimum K-factor of 8
}

/**
 * Calculate overall ELO from multiple class ELOs
 * @param classElos - Object with class IDs as keys and ELO values
 * @param weights - Optional weights for each class (default: equal)
 * @returns Overall ELO rating
 */
export function calculateOverallElo(
  classElos: Record<string, number>,
  weights?: Record<string, number>
): number {
  const classIds = Object.keys(classElos);
  if (classIds.length === 0) return ELO_CONSTANTS.BASE_RATING;
  
  // Use equal weights if none provided
  const defaultWeight = 1 / classIds.length;
  const effectiveWeights = weights || Object.fromEntries(classIds.map(id => [id, defaultWeight]));
  
  // Calculate weighted average
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const classId of classIds) {
    const weight = effectiveWeights[classId] || defaultWeight;
    weightedSum += classElos[classId] * weight;
    totalWeight += weight;
  }
  
  if (totalWeight === 0) return ELO_CONSTANTS.BASE_RATING;
  
  return weightedSum / totalWeight;
}

/**
 * Validate ELO rating is within bounds
 * @param elo - ELO rating to validate
 * @returns True if valid, false otherwise
 */
export function isValidElo(elo: number): boolean {
  return Number.isFinite(elo) && 
         elo >= ELO_CONSTANTS.MIN_RATING && 
         elo <= ELO_CONSTANTS.MAX_RATING;
}

/**
 * Get ELO tier based on rating
 * @param elo - ELO rating
 * @returns Tier string
 */
export function eloToTier(elo: number): string {
  if (elo >= 2500) return 'legendary';
  if (elo >= 2000) return 'master';
  if (elo >= 1500) return 'expert';
  if (elo >= 1000) return 'advanced';
  if (elo >= 500) return 'intermediate';
  return 'beginner';
}

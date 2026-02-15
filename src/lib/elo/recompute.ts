/**
 * ELO recomputation system with population drift
 * Builds distributions from latest APPROVED entries with rolling windows
 * Filters by sex at birth, age, and bodyweight ranges
 */

import { prisma } from '@/utils/prisma';
import { calculatePercentile } from '../stats/percentile';
import { eloFromPercentile, calculateOverallElo } from './math';
import { adjustElo, UserProfile } from './adjust';
import { createEloEvent } from './events';

export interface EloRecomputeResult {
  userId: string;
  classId: string;
  oldElo: number;
  newElo: number;
  change: number;
  oldTier: string;
  newTier: string;
  tierChanged: boolean;
  factors: {
    metricCount: number;
    populationSize: number;
    adjustmentApplied: boolean;
  };
}

export interface RecomputeOptions {
  rollingDays?: number;
  weightStrategy?: 'equal' | 'metric_weight';
  enableAdjustments?: boolean;
  minPopulationSize?: number;
}

const DEFAULT_OPTIONS: Required<RecomputeOptions> = {
  rollingDays: parseInt(process.env.ELO_ROLLING_DAYS || '180'),
  weightStrategy: (process.env.WEIGHT_STRATEGY as 'equal' | 'metric_weight') || 'equal',
  enableAdjustments: true,
  minPopulationSize: 10,
};

/**
 * Recompute ELO ratings for a specific user and class
 * @param userId - User ID to recompute for
 * @param classId - Class ID to recompute for
 * @param options - Recompute options
 * @returns EloRecomputeResult with old/new ELO and change details
 */
export async function recomputeUserClassElo(
  userId: string,
  classId: string,
  options: RecomputeOptions = {}
): Promise<EloRecomputeResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // Get user's current ELO
    const currentElo = await prisma.userClassElo.findUnique({
      where: { userId_classId: { userId, classId } },
    });
    
    if (!currentElo) {
      throw new Error(`No ELO found for user ${userId} in class ${classId}`);
    }
    
    // Get user profile for adjustments
    const userProfile = await getUserProfile(userId);
    
    // Get latest APPROVED metric entries for this user and class
    const userEntries = await getLatestApprovedEntries(userId, classId, opts.rollingDays);
    
    if (userEntries.length === 0) {
      // No entries, maintain current ELO
      return {
        userId,
        classId,
        oldElo: currentElo.elo,
        newElo: currentElo.elo,
        change: 0,
        oldTier: eloToTier(currentElo.elo),
        newTier: eloToTier(currentElo.elo),
        tierChanged: false,
        factors: {
          metricCount: 0,
          populationSize: 0,
          adjustmentApplied: false,
        },
      };
    }
    
    // Build population distributions with filtering
    const distributions = await buildPopulationDistributions(
      classId,
      userProfile,
      opts.rollingDays,
      opts.minPopulationSize
    );
    
    // Calculate new ELO from percentiles
    const newElo = calculateClassEloFromDistributions(
      userEntries,
      distributions,
      opts.weightStrategy,
      userProfile,
      opts.enableAdjustments
    );
    
    // Determine if tier changed
    const oldTier = eloToTier(currentElo.elo);
    const newTier = eloToTier(newElo);
    const tierChanged = oldTier !== newTier;
    
    // Track ELO event if there was a change
    if (Math.abs(newElo - currentElo.elo) > 0.01) {
      try {
        await createEloEvent({
          userId,
          classId,
          eventType: tierChanged ? 'tier_change' : 'rating_change',
          oldValue: currentElo.elo,
          newValue: newElo,
          change: newElo - currentElo.elo,
          metadata: {
            reason: 'recompute',
            metricCount: userEntries.length,
            populationSize: Math.min(...Object.values(distributions).map(d => d.length)),
            adjustmentApplied: opts.enableAdjustments,
            oldTier,
            newTier,
          },
        });
      } catch (eventError) {
        console.error(`[ERROR] Failed to create ELO event:`, eventError);
        // Don't fail recompute if event tracking fails
      }
    }
    
    return {
      userId,
      classId,
      oldElo: currentElo.elo,
      newElo,
      change: newElo - currentElo.elo,
      oldTier,
      newTier,
      tierChanged,
      factors: {
        metricCount: userEntries.length,
        populationSize: Math.min(...Object.values(distributions).map(d => d.length)),
        adjustmentApplied: opts.enableAdjustments,
      },
    };
    
  } catch (error) {
    console.error(`Error recomputing ELO for user ${userId} in class ${classId}:`, error);
    throw error;
  }
}

/**
 * Recompute ELO for all users in a specific class
 * @param classId - Class ID to recompute for
 * @param options - Recompute options
 * @returns Array of EloRecomputeResult
 */
export async function recomputeClassElos(
  classId: string,
  _options: RecomputeOptions = {}
): Promise<EloRecomputeResult[]> {
  // const opts = { ...DEFAULT_OPTIONS, _options };
  
  // Get all users in this class
  const userClassElos = await prisma.userClassElo.findMany({
    where: { classId },
    select: { userId: true },
  });
  
  const results: EloRecomputeResult[] = [];
  
  for (const userClassElo of userClassElos) {
    try {
      const result = await recomputeUserClassElo(userClassElo.userId, classId, _options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to recompute ELO for user ${userClassElo.userId}:`, error);
    }
  }
  
  return results;
}

/**
 * Recompute overall ELO for a specific user
 * @param userId - User ID to recompute for
 * @param options - Recompute options
 * @returns Overall ELO result
 */
export async function recomputeOverallElo(
  userId: string,
  _options: RecomputeOptions = {}
): Promise<{ oldElo: number; newElo: number; change: number }> {
  // const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Get user's current overall ELO
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { overallElo: true },
  });
  
  if (!user) {
    throw new Error(`User ${userId} not found`);
  }
  
  // Get all class ELOs for this user
  const classElos = await prisma.userClassElo.findMany({
    where: { userId },
    select: { classId: true, elo: true },
  });
  
  if (classElos.length === 0) {
    return { oldElo: user.overallElo, newElo: user.overallElo, change: 0 };
  }
  
  // Calculate new overall ELO
  const classEloMap = Object.fromEntries(classElos.map(ce => [ce.classId, ce.elo]));
  const newOverallElo = calculateOverallElo(classEloMap);
  
  return {
    oldElo: user.overallElo,
    newElo: newOverallElo,
    change: newOverallElo - user.overallElo,
  };
}

/**
 * Get user profile for ELO adjustments
 * @param userId - User ID
 * @returns UserProfile object
 */
async function getUserProfile(userId: string): Promise<UserProfile> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      gender: true,
      dateOfBirth: true,
    },
  });
  
  if (!user || !user.dateOfBirth) {
    throw new Error(`Incomplete profile for user ${userId}`);
  }
  
  // heightCm and weightKg are not yet in the User schema — use defaults
  // TODO: Add heightCm and weightKg fields to the User model
  return {
    sexAtBirth: user.gender as 'MALE' | 'FEMALE' | 'OTHER',
    dateOfBirth: user.dateOfBirth,
    heightCm: 170,
    weightKg: 75,
  };
}

/**
 * Get latest APPROVED metric entries for a user in a class
 * @param userId - User ID
 * @param classId - Class ID
 * @param rollingDays - Number of days to look back
 * @returns Array of metric entries
 */
async function getLatestApprovedEntries(
  userId: string,
  classId: string,
  rollingDays: number
): Promise<Array<{ metricId: string; value: number; createdAt: Date }>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - rollingDays);
  
  // Get metrics for this class
  const metrics = await prisma.metric.findMany({
    where: { classId },
    select: { id: true },
  });
  
  const metricIds = metrics.map(m => m.id);
  
  if (metricIds.length === 0) return [];
  
  // Get latest APPROVED entry for each metric
  const entries = await prisma.userMetricEntry.findMany({
    where: {
      userId,
      metricId: { in: metricIds },
      status: 'APPROVED',
      createdAt: { gte: cutoffDate },
    },
    select: {
      metricId: true,
      value: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  
  // Group by metric and take the latest entry for each
  const latestEntries = new Map<string, typeof entries[0]>();
  for (const entry of entries) {
    if (!latestEntries.has(entry.metricId) || 
        entry.createdAt > latestEntries.get(entry.metricId)!.createdAt) {
      latestEntries.set(entry.metricId, entry);
    }
  }
  
  return Array.from(latestEntries.values());
}

/**
 * Build population distributions with intelligent filtering
 * @param classId - Class ID
 * @param userProfile - User profile for filtering
 * @param rollingDays - Number of days to look back
 * @param minPopulationSize - Minimum population size required
 * @returns Object with metric IDs as keys and arrays of values
 */
async function buildPopulationDistributions(
  classId: string,
  userProfile: UserProfile,
  rollingDays: number,
  minPopulationSize: number
): Promise<Record<string, number[]>> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - rollingDays);
  
  // Get metrics for this class
  const metrics = await prisma.metric.findMany({
    where: { classId },
    select: { id: true, slug: true, higherIsBetter: true },
  });
  
  const distributions: Record<string, number[]> = {};
  
  for (const metric of metrics) {
    // Start with ±10% bodyweight filter
    let filterWidth = 0.1;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      const weightRange = userProfile.weightKg * filterWidth;
      const minWeight = userProfile.weightKg - weightRange;
      const maxWeight = userProfile.weightKg + weightRange;
      
      // Get population data with current filter
      const populationData = await getFilteredPopulationData(
        metric.id,
        userProfile,
        cutoffDate,
        minWeight,
        maxWeight
      );
      
      if (populationData.length >= minPopulationSize) {
        distributions[metric.id] = populationData.map(d => d.value);
        break;
      }
      
      // Widen filter if population is too small
      filterWidth *= 2;
      attempts++;
    }
    
    // If still too small, use global data
    if (!distributions[metric.id]) {
      const globalData = await getGlobalPopulationData(metric.id, cutoffDate);
      distributions[metric.id] = globalData.map(d => d.value);
    }
  }
  
  return distributions;
}

/**
 * Get filtered population data based on user profile
 * @param metricId - Metric ID
 * @param userProfile - User profile for filtering
 * @param cutoffDate - Cutoff date for rolling window
 * @param minWeight - Minimum weight filter
 * @param maxWeight - Maximum weight filter
 * @returns Array of metric entries with user data
 */
async function getFilteredPopulationData(
  metricId: string,
  userProfile: UserProfile,
  cutoffDate: Date,
  minWeight: number,
  maxWeight: number
): Promise<Array<{ value: number; userGender: string; userAge: number }>> {
  const entries = await prisma.userMetricEntry.findMany({
    where: {
      metricId,
      status: 'APPROVED',
      createdAt: { gte: cutoffDate },
      user: {
        gender: userProfile.sexAtBirth,
        // TODO: Add weightKg to User schema to enable bodyweight filtering
        dateOfBirth: { not: null },
      },
    },
    select: {
      value: true,
      user: {
        select: {
          gender: true,
          dateOfBirth: true,
        },
      },
    },
  });
  
  return entries.map(entry => ({
    value: entry.value,
    userGender: entry.user.gender!,
    userAge: calculateAge(entry.user.dateOfBirth!),
  }));
}

/**
 * Get global population data without filtering
 * @param metricId - Metric ID
 * @param cutoffDate - Cutoff date for rolling window
 * @returns Array of metric entries
 */
async function getGlobalPopulationData(
  metricId: string,
  cutoffDate: Date
): Promise<Array<{ value: number }>> {
  return await prisma.userMetricEntry.findMany({
    where: {
      metricId,
      status: 'APPROVED',
      createdAt: { gte: cutoffDate },
    },
    select: { value: true },
  });
}

/**
 * Calculate class ELO from distributions
 * @param userEntries - User's metric entries
 * @param distributions - Population distributions
 * @param weightStrategy - Weight strategy to use
 * @param userProfile - User profile for adjustments
 * @param enableAdjustments - Whether to apply adjustments
 * @returns Calculated ELO rating
 */
function calculateClassEloFromDistributions(
  userEntries: Array<{ metricId: string; value: number }>,
  distributions: Record<string, number[]>,
  weightStrategy: 'equal' | 'metric_weight',
  userProfile: UserProfile,
  enableAdjustments: boolean
): number {
  let totalWeight = 0;
  let weightedSum = 0;
  
  for (const entry of userEntries) {
    const distribution = distributions[entry.metricId];
    if (!distribution || distribution.length === 0) continue;
    
    // Calculate percentile
    const percentile = calculatePercentile(distribution, entry.value, true).percentile;
    
    // Convert to ELO
    const elo = eloFromPercentile(percentile);
    
    // Apply weight
    const weight = weightStrategy === 'metric_weight' ? 1 : 1; // TODO: Get from metric.weight
    weightedSum += elo * weight;
    totalWeight += weight;
  }
  
  if (totalWeight === 0) return 500; // Default ELO
  
  const rawElo = weightedSum / totalWeight;
  
  // Apply adjustments if enabled
  if (enableAdjustments) {
    const adjusted = adjustElo(rawElo, userProfile);
    return adjusted.adjustedElo;
  }
  
  return rawElo;
}

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date of birth
 * @returns Age in years
 */
function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Convert ELO to tier
 * @param elo - ELO rating
 * @returns Tier string
 */
function eloToTier(elo: number): string {
  if (elo >= 2500) return 'legendary';
  if (elo >= 2000) return 'master';
  if (elo >= 1500) return 'expert';
  if (elo >= 1000) return 'advanced';
  if (elo >= 500) return 'intermediate';
  return 'beginner';
}

/**
 * Batch recompute ELOs for multiple users
 * @param userIds - Array of user IDs
 * @param classId - Class ID (optional, if not provided recomputes all classes)
 * @param options - Recompute options
 * @returns Array of EloRecomputeResult
 */
export async function batchRecomputeElos(
  userIds: string[],
  classId?: string,
  _options: RecomputeOptions = {}
): Promise<EloRecomputeResult[]> {
  const results: EloRecomputeResult[] = [];
  
  for (const userId of userIds) {
    try {
      if (classId) {
        // Recompute specific class
        const result = await recomputeUserClassElo(userId, classId, _options);
        results.push(result);
      } else {
        // Recompute all classes for user
        const userClassElos = await prisma.userClassElo.findMany({
          where: { userId },
          select: { classId: true },
        });
        
        for (const userClassElo of userClassElos) {
          const result = await recomputeUserClassElo(userId, userClassElo.classId, _options);
          results.push(result);
        }
      }
    } catch (error) {
      console.error(`Failed to recompute ELO for user ${userId}:`, error);
    }
  }
  
  return results;
}

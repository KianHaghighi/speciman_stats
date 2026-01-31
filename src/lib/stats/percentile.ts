/**
 * Binary search percentile calculation for efficient ranking
 * Handles large datasets with O(log n) performance
 */

export interface PercentileResult {
  percentile: number; // 0-100
  rank: number; // 1-based rank
  totalCount: number;
  value: number;
}

/**
 * Calculate percentile using binary search for efficiency
 * @param values - Sorted array of numeric values (ascending)
 * @param targetValue - Value to find percentile for
 * @param higherIsBetter - Whether higher values are better (default: true)
 * @returns PercentileResult with percentile, rank, and metadata
 */
export function calculatePercentile(
  values: number[],
  targetValue: number,
  higherIsBetter: boolean = true
): PercentileResult {
  if (values.length === 0) {
    return { percentile: 0, rank: 0, totalCount: 0, value: targetValue };
  }

  // Sort values if not already sorted
  const sortedValues = [...values].sort((a, b) => a - b);
  
  // Find the position and handle interpolation
  let percentile = 0;
  let rank = 0;
  
  if (higherIsBetter) {
    // Count values <= targetValue
    let left = 0;
    let right = sortedValues.length - 1;
    let count = 0;
    let exactMatch = false;
    let lowerBound = -Infinity;
    let upperBound = Infinity;
    
    // Find position using binary search
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (sortedValues[mid] <= targetValue) {
        count = mid + 1;
        lowerBound = sortedValues[mid];
        if (sortedValues[mid] === targetValue) {
          exactMatch = true;
        }
        left = mid + 1;
      } else {
        if (mid === 0 || sortedValues[mid - 1] <= targetValue) {
          upperBound = sortedValues[mid];
        }
        right = mid - 1;
      }
    }
    
    rank = count;
    
    // If value is between two data points, interpolate
    if (!exactMatch && lowerBound !== -Infinity && upperBound !== Infinity) {
      // Linear interpolation between lower and upper bounds
      const lowerPercentile = (count / sortedValues.length) * 100;
      const upperPercentile = ((count + 1) / sortedValues.length) * 100;
      const interpolationFactor = (targetValue - lowerBound) / (upperBound - lowerBound);
      percentile = lowerPercentile + (upperPercentile - lowerPercentile) * interpolationFactor;
    } else {
      percentile = (count / sortedValues.length) * 100;
    }
  } else {
    // Count values >= targetValue (lower is better, so higher values are worse)
    let left = 0;
    let right = sortedValues.length - 1;
    let firstIndex = sortedValues.length;
    let exactMatch = false;
    let lowerBound = -Infinity;
    let upperBound = Infinity;
    
    // Find leftmost position where value >= targetValue
    while (left <= right) {
      const mid = Math.floor((left + right) / 2);
      if (sortedValues[mid] >= targetValue) {
        firstIndex = mid;
        upperBound = sortedValues[mid];
        if (sortedValues[mid] === targetValue) {
          exactMatch = true;
        }
        right = mid - 1;
      } else {
        if (mid === sortedValues.length - 1 || sortedValues[mid + 1] >= targetValue) {
          lowerBound = sortedValues[mid];
        }
        left = mid + 1;
      }
    }
    
    // Count from firstIndex to end (values that are worse or equal)
    const count = sortedValues.length - firstIndex;
    rank = count;
    
    // If value is between two data points, interpolate
    if (!exactMatch && lowerBound !== -Infinity && upperBound !== Infinity) {
      // For lower is better, interpolation is inverted
      const upperPercentile = (count / sortedValues.length) * 100;
      const lowerPercentile = ((count + 1) / sortedValues.length) * 100;
      const interpolationFactor = (targetValue - lowerBound) / (upperBound - lowerBound);
      percentile = lowerPercentile + (upperPercentile - lowerPercentile) * interpolationFactor;
    } else {
      percentile = (count / sortedValues.length) * 100;
    }
  }
  
  // Ensure percentile is within bounds
  const clampedPercentile = Math.max(0, Math.min(100, percentile));
  
  return {
    percentile: clampedPercentile,
    rank: rank, // 1-based rank (number of values that are better/equal)
    totalCount: sortedValues.length,
    value: targetValue,
  };
}

/**
 * Calculate percentile for a specific metric across all users
 * @param metricEntries - Array of metric entries with values
 * @param targetUserId - User ID to calculate percentile for
 * @param higherIsBetter - Whether higher values are better
 * @returns PercentileResult for the target user
 */
export function calculateUserPercentile(
  metricEntries: Array<{ userId: string; value: number }>,
  targetUserId: string,
  higherIsBetter: boolean = true
): PercentileResult | null {
  const targetEntry = metricEntries.find(entry => entry.userId === targetUserId);
  if (!targetEntry) return null;

  const values = metricEntries.map(entry => entry.value);
  return calculatePercentile(values, targetEntry.value, higherIsBetter);
}

/**
 * Calculate multiple percentiles for a user across different metrics
 * @param userMetrics - Object with metric slugs as keys and values
 * @param allMetricData - Object with metric slugs as keys and arrays of all user values
 * @param metricConfigs - Object with metric slugs as keys and config (higherIsBetter)
 * @returns Object with metric slugs as keys and PercentileResult values
 */
export function calculateUserPercentiles(
  userMetrics: Record<string, number>,
  allMetricData: Record<string, number[]>,
  metricConfigs: Record<string, { higherIsBetter: boolean }>
): Record<string, PercentileResult> {
  const results: Record<string, PercentileResult> = {};

  for (const [metricSlug, userValue] of Object.entries(userMetrics)) {
    const allValues = allMetricData[metricSlug];
    const config = metricConfigs[metricSlug];
    
    if (allValues && config) {
      results[metricSlug] = calculatePercentile(
        allValues,
        userValue,
        config.higherIsBetter
      );
    }
  }

  return results;
}

/**
 * Convert percentile to tier (bronze, silver, gold, platinum, diamond)
 * @param percentile - Percentile value (0-100)
 * @returns Tier string
 */
export function percentileToTier(percentile: number): string {
  if (percentile >= 95) return 'diamond';
  if (percentile >= 85) return 'platinum';
  if (percentile >= 70) return 'gold';
  if (percentile >= 50) return 'silver';
  if (percentile >= 25) return 'bronze';
  return 'unranked';
}

/**
 * Get tier thresholds for display
 * @returns Object with tier names and percentile thresholds
 */
export function getTierThresholds(): Record<string, number> {
  return {
    diamond: 95,
    platinum: 85,
    gold: 70,
    silver: 50,
    bronze: 25,
  };
}

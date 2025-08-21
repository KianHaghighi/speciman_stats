/**
 * ELO adjustment system for fair cross-category comparisons
 * Normalizes ratings by sex at birth, age, weight, and height
 */

export interface UserProfile {
  sexAtBirth: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth: Date;
  heightCm: number;
  weightKg: number;
}

export interface AdjustmentFactors {
  sexFactor: number;
  ageFactor: number;
  weightFactor: number;
  heightFactor: number;
  totalFactor: number;
}

export interface AdjustedElo {
  rawElo: number;
  adjustedElo: number;
  adjustment: number;
  factors: AdjustmentFactors;
}

/**
 * Calculate adjustment factors for fair ELO comparison
 * @param userProfile - User's physical profile
 * @returns AdjustmentFactors object
 */
export function calculateAdjustmentFactors(userProfile: UserProfile): AdjustmentFactors {
  const age = calculateAge(userProfile.dateOfBirth);
  
  // Sex adjustment (based on physiological differences)
  const sexFactor = calculateSexFactor(userProfile.sexAtBirth);
  
  // Age adjustment (peak performance typically 25-35)
  const ageFactor = calculateAgeFactor(age);
  
  // Weight adjustment (relative to height)
  const bmi = userProfile.weightKg / Math.pow(userProfile.heightCm / 100, 2);
  const weightFactor = calculateWeightFactor(bmi);
  
  // Height adjustment (some sports favor certain heights)
  const heightFactor = calculateHeightFactor(userProfile.heightCm);
  
  // Combine factors (geometric mean for balanced adjustment)
  const totalFactor = Math.pow(
    sexFactor * ageFactor * weightFactor * heightFactor,
    0.25
  );
  
  return {
    sexFactor,
    ageFactor,
    weightFactor,
    heightFactor,
    totalFactor,
  };
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
 * Calculate sex-based adjustment factor
 * @param sexAtBirth - Sex at birth
 * @returns Adjustment factor (1.0 = no adjustment)
 */
function calculateSexFactor(sexAtBirth: 'MALE' | 'FEMALE' | 'OTHER'): number {
  switch (sexAtBirth) {
    case 'MALE':
      return 1.0; // Baseline
    case 'FEMALE':
      return 1.15; // Slight boost to account for physiological differences
    case 'OTHER':
      return 1.05; // Neutral adjustment
    default:
      return 1.0;
  }
}

/**
 * Calculate age-based adjustment factor
 * Peak performance typically occurs between 25-35 years
 * @param age - Age in years
 * @returns Adjustment factor (1.0 = no adjustment)
 */
function calculateAgeFactor(age: number): number {
  if (age < 13) return 0.7; // Pre-adolescent
  if (age < 18) return 0.85; // Adolescent
  if (age < 25) return 0.95; // Young adult
  if (age < 35) return 1.0; // Peak performance
  if (age < 45) return 0.95; // Mature adult
  if (age < 55) return 0.9; // Middle age
  if (age < 65) return 0.85; // Senior
  return 0.8; // Elder
}

/**
 * Calculate weight-based adjustment factor
 * Considers BMI relative to optimal athletic ranges
 * @param bmi - Body Mass Index
 * @returns Adjustment factor (1.0 = no adjustment)
 */
function calculateWeightFactor(bmi: number): number {
  // Optimal athletic BMI ranges
  if (bmi < 18.5) return 0.9; // Underweight
  if (bmi >= 18.5 && bmi < 25) return 1.0; // Normal weight (optimal)
  if (bmi >= 25 && bmi < 30) return 0.95; // Overweight
  if (bmi >= 30 && bmi < 35) return 0.9; // Obese class I
  if (bmi >= 35 && bmi < 40) return 0.85; // Obese class II
  return 0.8; // Obese class III
}

/**
 * Calculate height-based adjustment factor
 * Some sports favor certain height ranges
 * @param heightCm - Height in centimeters
 * @returns Adjustment factor (1.0 = no adjustment)
 */
function calculateHeightFactor(heightCm: number): number {
  if (heightCm < 150) return 0.9; // Very short
  if (heightCm >= 150 && heightCm < 160) return 0.95; // Short
  if (heightCm >= 160 && heightCm < 175) return 1.0; // Average (optimal)
  if (heightCm >= 175 && heightCm < 190) return 1.0; // Tall
  if (heightCm >= 190 && heightCm < 200) return 0.98; // Very tall
  return 0.95; // Extremely tall
}

/**
 * Apply adjustments to raw ELO rating
 * @param rawElo - Raw ELO rating
 * @param userProfile - User's physical profile
 * @returns AdjustedElo object with raw, adjusted, and factor details
 */
export function adjustElo(rawElo: number, userProfile: UserProfile): AdjustedElo {
  const factors = calculateAdjustmentFactors(userProfile);
  
  // Apply adjustment factor
  const adjustedElo = rawElo * factors.totalFactor;
  
  return {
    rawElo,
    adjustedElo,
    adjustment: adjustedElo - rawElo,
    factors,
  };
}

/**
 * Remove adjustments to get raw ELO from adjusted ELO
 * @param adjustedElo - Adjusted ELO rating
 * @param userProfile - User's physical profile
 * @returns Raw ELO rating
 */
export function deadjustElo(adjustedElo: number, userProfile: UserProfile): number {
  const factors = calculateAdjustmentFactors(userProfile);
  return adjustedElo / factors.totalFactor;
}

/**
 * Compare two users' ELO ratings fairly
 * @param userA - First user's profile and ELO
 * @param userB - Second user's profile and ELO
 * @returns Object with comparison details
 */
export function compareAdjustedElos(
  userA: { profile: UserProfile; elo: number },
  userB: { profile: UserProfile; elo: number }
): {
  userAAdjusted: AdjustedElo;
  userBAdjusted: AdjustedElo;
  fairComparison: boolean;
  recommendation: string;
} {
  const userAAdjusted = adjustElo(userA.elo, userA.profile);
  const userBAdjusted = adjustElo(userB.elo, userB.profile);
  
  // Determine if comparison is fair
  const profileSimilarity = calculateProfileSimilarity(userA.profile, userB.profile);
  const fairComparison = profileSimilarity >= 0.8; // 80% similarity threshold
  
  let recommendation = '';
  if (fairComparison) {
    recommendation = 'Direct comparison is fair';
  } else if (profileSimilarity >= 0.6) {
    recommendation = 'Comparison requires adjustment consideration';
  } else {
    recommendation = 'Comparison may not be meaningful due to significant profile differences';
  }
  
  return {
    userAAdjusted,
    userBAdjusted,
    fairComparison,
    recommendation,
  };
}

/**
 * Calculate similarity between two user profiles
 * @param profileA - First user profile
 * @param profileB - Second user profile
 * @returns Similarity score (0-1, higher = more similar)
 */
function calculateProfileSimilarity(profileA: UserProfile, profileB: UserProfile): number {
  const sexSimilarity = profileA.sexAtBirth === profileB.sexAtBirth ? 1 : 0.5;
  
  const ageDiff = Math.abs(calculateAge(profileA.dateOfBirth) - calculateAge(profileB.dateOfBirth));
  const ageSimilarity = Math.max(0, 1 - ageDiff / 20); // 20 year difference = 0 similarity
  
  const heightDiff = Math.abs(profileA.heightCm - profileB.heightCm);
  const heightSimilarity = Math.max(0, 1 - heightDiff / 50); // 50cm difference = 0 similarity
  
  const weightDiff = Math.abs(profileA.weightKg - profileB.weightKg);
  const weightSimilarity = Math.max(0, 1 - weightDiff / 30); // 30kg difference = 0 similarity
  
  // Weighted average of similarities
  return (
    sexSimilarity * 0.3 +
    ageSimilarity * 0.3 +
    heightSimilarity * 0.2 +
    weightSimilarity * 0.2
  );
}

/**
 * Get adjustment explanation for display
 * @param factors - Adjustment factors
 * @returns Human-readable explanation
 */
export function getAdjustmentExplanation(factors: AdjustmentFactors): string {
  const explanations: string[] = [];
  
  if (factors.sexFactor !== 1.0) {
    explanations.push(`Sex adjustment: ${factors.sexFactor > 1 ? '+' : ''}${((factors.sexFactor - 1) * 100).toFixed(1)}%`);
  }
  
  if (factors.ageFactor !== 1.0) {
    explanations.push(`Age adjustment: ${factors.ageFactor > 1 ? '+' : ''}${((factors.ageFactor - 1) * 100).toFixed(1)}%`);
  }
  
  if (factors.weightFactor !== 1.0) {
    explanations.push(`Weight adjustment: ${factors.weightFactor > 1 ? '+' : ''}${((factors.weightFactor - 1) * 100).toFixed(1)}%`);
  }
  
  if (factors.heightFactor !== 1.0) {
    explanations.push(`Height adjustment: ${factors.heightFactor > 1 ? '+' : ''}${((factors.heightFactor - 1) * 100).toFixed(1)}%`);
  }
  
  if (explanations.length === 0) {
    return 'No adjustments applied';
  }
  
  return explanations.join(', ');
}

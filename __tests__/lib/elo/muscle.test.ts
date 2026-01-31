import { vi } from 'vitest';
import { calculateAllMuscleElos, MUSCLE_GROUPS } from '@/lib/elo/muscle';

// Mock the percentile calculation
vi.mock('@/lib/stats/percentile', () => ({
      calculatePercentile: vi.fn((values, userValue, higherIsBetter) => {
    // Simple mock implementation
    const position = values.indexOf(userValue);
    if (position === -1) {
      // If exact value not found, estimate position
      const sorted = [...values].sort((a, b) => higherIsBetter ? a - b : b - a);
      const index = sorted.findIndex(v => higherIsBetter ? v >= userValue : v <= userValue);
      return ((index / sorted.length) * 100) || 0;
    }
    return ((position + 1) / values.length) * 100;
  })
}));

describe('Muscle ELO System', () => {
  describe('MUSCLE_GROUPS', () => {
    it('should have all required muscle groups', () => {
      const expectedMuscles = [
        'chest', 'back', 'shoulders', 'arms', 'core', 'quads', 
        'hamstrings', 'glutes', 'calves', 'forearms', 'traps', 'lats'
      ];

      expectedMuscles.forEach(muscle => {
        expect(MUSCLE_GROUPS[muscle]).toBeDefined();
      });
    });

    it('should have valid structure for each muscle group', () => {
      Object.values(MUSCLE_GROUPS).forEach(muscle => {
        expect(muscle).toHaveProperty('name');
        expect(muscle).toHaveProperty('description');
        expect(muscle).toHaveProperty('svgPath');
        expect(muscle).toHaveProperty('tooltipPosition');
        expect(muscle).toHaveProperty('relatedMetrics');
        expect(Array.isArray(muscle.relatedMetrics)).toBe(true); 
        
        // Check tooltip position structure
        expect(muscle.tooltipPosition).toHaveProperty('x');
        expect(muscle.tooltipPosition).toHaveProperty('y');
        expect(typeof muscle.tooltipPosition.x).toBe('number');
        expect(typeof muscle.tooltipPosition.y).toBe('number');
      });
    });

    it('should have weighted metrics for each muscle group', () => {
      Object.values(MUSCLE_GROUPS).forEach(muscle => {
        muscle.relatedMetrics.forEach(metric => {
          expect(metric).toHaveProperty('slug');
          expect(metric).toHaveProperty('weight');
          expect(typeof metric.slug).toBe('string');
          expect(typeof metric.weight).toBe('number');
          expect(metric.weight).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('calculateAllMuscleElos', () => {
    const mockUserEntries = [
      { metricId: 'bench_press', value: 225 },
      { metricId: 'deadlift', value: 315 },
      { metricId: 'squat', value: 275 },
      { metricId: 'pull_ups', value: 15 },
    ];

    const mockAllEntries = [
      { metricId: 'bench_press', value: 135 },
      { metricId: 'bench_press', value: 185 },
      { metricId: 'bench_press', value: 225 },
      { metricId: 'bench_press', value: 275 },
      { metricId: 'deadlift', value: 225 },
      { metricId: 'deadlift', value: 315 },
      { metricId: 'deadlift', value: 405 },
      { metricId: 'squat', value: 185 },
      { metricId: 'squat', value: 275 },
      { metricId: 'squat', value: 365 },
      { metricId: 'pull_ups', value: 10 },
      { metricId: 'pull_ups', value: 15 },
      { metricId: 'pull_ups', value: 20 },
    ];

    const mockMetrics = [
      { id: 'bench_press', slug: 'bench_press', name: 'Bench Press', higherIsBetter: true },
      { id: 'deadlift', slug: 'deadlift', name: 'Deadlift', higherIsBetter: true },
      { id: 'squat', slug: 'squat', name: 'Squat', higherIsBetter: true },
      { id: 'pull_ups', slug: 'pull_ups', name: 'Pull-ups', higherIsBetter: true },
    ];

    it('should calculate ELOs for all muscle groups', () => {
      const result = calculateAllMuscleElos(
        mockUserEntries,
        mockAllEntries,
        mockMetrics,
        null // No class filter
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      
      // Should have entries for muscle groups that have related metrics
      const muscleKeys = Object.keys(result);
      expect(muscleKeys.length).toBeGreaterThan(0);
      
      // Each muscle should have the correct structure
      Object.values(result).forEach(muscleData => {
        expect(muscleData).toHaveProperty('elo');
        expect(muscleData).toHaveProperty('percentile');
        expect(muscleData).toHaveProperty('tier');
        expect(muscleData).toHaveProperty('topContributor');
        expect(typeof muscleData.elo).toBe('number');
        expect(typeof muscleData.percentile).toBe('number');
        expect(typeof muscleData.tier).toBe('string');
      });
    });

    it('should handle empty user entries', () => {
      const result = calculateAllMuscleElos(
        [],
        mockAllEntries,
        mockMetrics,
        null
      );

      expect(result).toBeDefined();
      expect(Object.keys(result).length).toBe(0);
    });

    it('should handle empty all entries', () => {
      const result = calculateAllMuscleElos(
        mockUserEntries,
        [],
        mockMetrics,
        null
      );

      expect(result).toBeDefined();
      // Should still return muscle groups but with default values
      Object.values(result).forEach(muscleData => {
        expect(muscleData.percentile).toBe(0);
        expect(muscleData.elo).toBe(1000); // Default ELO
      });
    });

    it('should calculate weighted averages correctly', () => {
      const result = calculateAllMuscleElos(
        mockUserEntries,
        mockAllEntries,
        mockMetrics,
        null
      );

      // Chest muscle should be influenced by bench press
      if (result.chest) {
        expect(result.chest.topContributor).toBe('Bench Press');
        expect(result.chest.elo).toBeGreaterThan(1000);
      }

      // Back muscle should be influenced by deadlift and pull-ups
      if (result.back) {
        expect(result.back.elo).toBeGreaterThan(1000);
      }
    });

    it('should assign correct tiers based on percentile', () => {
      const result = calculateAllMuscleElos(
        mockUserEntries,
        mockAllEntries,
        mockMetrics,
        null
      );

      Object.values(result).forEach(muscleData => {
        const { percentile, tier } = muscleData;
        
        if (percentile >= 90) {
          expect(tier).toBe('diamond');
        } else if (percentile >= 75) {
          expect(tier).toBe('platinum');
        } else if (percentile >= 50) {
          expect(tier).toBe('gold');
        } else if (percentile >= 25) {
          expect(tier).toBe('silver');
        } else {
          expect(tier).toBe('bronze');
        }
      });
    });

    it('should handle class filtering', () => {
      const classMetrics = mockMetrics.filter(m => 
        ['bench_press', 'deadlift', 'squat'].includes(m.slug)
      );

      const result = calculateAllMuscleElos(
        mockUserEntries,
        mockAllEntries,
        classMetrics,
        'titan' // Class filter
      );

      expect(result).toBeDefined();
      // Should only include muscles related to class metrics
    });
  });
});

import { calculatePercentile } from '@/lib/stats/percentile';

describe('calculatePercentile', () => {
  describe('basic functionality', () => {
    it('should calculate percentile correctly for higher is better', () => {
      const values = [10, 20, 30, 40, 50];
      const userValue = 35;
      const higherIsBetter = true;

      const result = calculatePercentile(values, userValue, higherIsBetter);
      
      // 35 is between 30 and 40, so it should be around 60th percentile (3rd out of 5)
      expect(result.percentile).toBeCloseTo(60, 0);
    });

    it('should calculate percentile correctly for lower is better', () => {
      const values = [10, 20, 30, 40, 50];
      const userValue = 15;
      const higherIsBetter = false;

      const result = calculatePercentile(values, userValue, higherIsBetter);
      
      // For lower is better, 15 (between 10 and 20) should be around 100th percentile (best time)
      expect(result.percentile).toBeCloseTo(100, 0);
    });

    it('should handle edge cases', () => {
      const values = [1, 2, 3, 4, 5];

      // Test minimum value
      expect(calculatePercentile(values, 1, true).percentile).toBe(20);
      expect(calculatePercentile(values, 1, false).percentile).toBe(100);

      // Test maximum value
      expect(calculatePercentile(values, 5, true).percentile).toBe(100);
      expect(calculatePercentile(values, 5, false).percentile).toBe(20);
    });

    it('should handle single value array', () => {
      const values = [42];
      
      expect(calculatePercentile(values, 42, true).percentile).toBe(100);
      expect(calculatePercentile(values, 42, false).percentile).toBe(100);
      expect(calculatePercentile(values, 50, true).percentile).toBe(100);
      expect(calculatePercentile(values, 30, false).percentile).toBe(100);
    });

    it('should handle empty array', () => {
      const values: number[] = [];
      
      expect(calculatePercentile(values, 42, true).percentile).toBe(0);
      expect(calculatePercentile(values, 42, false).percentile).toBe(0);
    });

    it('should handle duplicate values', () => {
      const values = [10, 10, 20, 20, 30, 30];
      
      expect(calculatePercentile(values, 20, true).percentile).toBeCloseTo(66.67, 1);
      expect(calculatePercentile(values, 20, false).percentile).toBeCloseTo(100, 1);
    });
  });

  describe('real-world scenarios', () => {
    it('should handle bench press data correctly', () => {
      const benchPressValues = [135, 185, 225, 275, 315, 365];
      
            // Someone who benches 250 should be in high percentile
      const result = calculatePercentile(benchPressValues, 250, true); 
      expect(result.percentile).toBeGreaterThan(50);
      expect(result.percentile).toBeLessThan(100);
    });

    it('should handle 5K run times correctly', () => {
      const runTimes = [16, 18, 20, 22, 24, 26, 28]; // minutes
      
      // Someone who runs 19 minutes should be in high percentile (lower is better)
      const result = calculatePercentile(runTimes, 19, false);
      expect(result.percentile).toBeGreaterThan(70);
    });
  });
});

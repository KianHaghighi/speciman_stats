import { 
  expectedScore, 
  calculateNewRating, 
  eloFromPercentile,
  percentileFromElo 
} from '@/lib/elo/math';

describe('ELO Math Functions', () => {
  describe('expectedScore', () => {
    it('should return 0.5 for equal ratings', () => {
      expect(expectedScore(1500, 1500)).toBeCloseTo(0.5, 3);
    });

    it('should return higher than 0.5 for higher rating', () => {
      expect(expectedScore(1600, 1500)).toBeGreaterThan(0.5);
    });

    it('should return lower than 0.5 for lower rating', () => {
      expect(expectedScore(1400, 1500)).toBeLessThan(0.5);
    });

    it('should handle extreme differences', () => {
      expect(expectedScore(2000, 1000)).toBeCloseTo(1, 1);
      expect(expectedScore(1000, 2000)).toBeCloseTo(0, 1);
    });
  });

  describe('calculateNewRating', () => {
    it('should increase ELO on win', () => {
      const expectedScoreVal = expectedScore(1500, 1500);
      const newElo = calculateNewRating(1500, expectedScoreVal, 1, 32);
      expect(newElo).toBeGreaterThan(1500);
    });

    it('should decrease ELO on loss', () => {
      const expectedScoreVal = expectedScore(1500, 1500);
      const newElo = calculateNewRating(1500, expectedScoreVal, 0, 32);
      expect(newElo).toBeLessThan(1500);
    });

    it('should not change ELO on expected result against equal opponent', () => {
      const expectedScoreVal = expectedScore(1500, 1500);
      const newElo = calculateNewRating(1500, expectedScoreVal, expectedScoreVal, 32);
      expect(newElo).toBeCloseTo(1500, 1);
    });

    it('should change less with smaller K-factor', () => {
      const expectedScoreVal = expectedScore(1500, 1500);
      const change32 = Math.abs(calculateNewRating(1500, expectedScoreVal, 1, 32) - 1500);
      const change16 = Math.abs(calculateNewRating(1500, expectedScoreVal, 1, 16) - 1500);
      expect(change16).toBeLessThan(change32);
    });
  });

  describe('eloFromPercentile', () => {
    it('should return 500 for 50th percentile', () => {
      expect(eloFromPercentile(50)).toBeCloseTo(500, 1);
    });

    it('should return higher ELO for higher percentiles', () => {
      expect(eloFromPercentile(90)).toBeGreaterThan(500);
      expect(eloFromPercentile(95)).toBeGreaterThan(eloFromPercentile(90));
    });

    it('should return lower ELO for lower percentiles', () => {
      expect(eloFromPercentile(10)).toBeLessThan(500);
      expect(eloFromPercentile(5)).toBeLessThanOrEqual(eloFromPercentile(10));
    });

    it('should handle edge cases', () => {
      expect(eloFromPercentile(1)).toBeGreaterThanOrEqual(0);
      expect(eloFromPercentile(99)).toBeLessThan(3000);
    });
  });

  describe('percentileFromElo', () => {
    it('should return 50 for 500 ELO', () => {
      expect(percentileFromElo(500)).toBeCloseTo(50, 1);
    });

    it('should be inverse of eloFromPercentile', () => {
      const percentiles = [10, 25, 50, 75, 90];
      
      percentiles.forEach(percentile => {
        const elo = eloFromPercentile(percentile);
        const backToPercentile = percentileFromElo(elo);
        expect(backToPercentile).toBeCloseTo(percentile, 0);
      });
    });
  });
});

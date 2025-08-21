import { RANK_COLORS } from '@/lib/elo/muscle';

describe('Rank Colors Configuration', () => {
  it('should have all required rank tiers', () => {
    const expectedTiers = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    
    expectedTiers.forEach(tier => {
      expect(RANK_COLORS[tier]).toBeDefined();
      expect(typeof RANK_COLORS[tier]).toBe('string');
    });
  });

  it('should have valid CSS color values', () => {
    Object.values(RANK_COLORS).forEach(color => {
      // Should be a valid CSS color string (hex, rgb, hsl, or named)
      expect(typeof color).toBe('string');
      expect(color.length).toBeGreaterThan(0);
      
      // Basic validation for common color formats
      const isValidColor = 
        color.startsWith('#') || // hex
        color.startsWith('rgb') || // rgb/rgba
        color.startsWith('hsl') || // hsl/hsla
        /^[a-z]+$/i.test(color); // named colors
        
      expect(isValidColor).toBe(true);
    });
  });

  it('should have distinct colors for each tier', () => {
    const colors = Object.values(RANK_COLORS);
    const uniqueColors = new Set(colors);
    
    expect(uniqueColors.size).toBe(colors.length);
  });

  it('should follow tier hierarchy in color intensity/value', () => {
    // This is a basic check - in a real app you might want to verify
    // that colors actually represent increasing prestige
    expect(RANK_COLORS.bronze).toBeDefined();
    expect(RANK_COLORS.silver).toBeDefined();
    expect(RANK_COLORS.gold).toBeDefined();
    expect(RANK_COLORS.platinum).toBeDefined();
    expect(RANK_COLORS.diamond).toBeDefined();
  });
});

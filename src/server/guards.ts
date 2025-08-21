// Server-side guards for preventing unauthorized operations

export const METRIC_GUARDS = {
  /**
   * Prevents user-created metrics - only placeholder metrics are allowed
   */
  preventUserMetricCreation: () => {
    return {
      ok: false,
      error: "User metrics are disabled. Only predefined metrics are available."
    };
  },

  /**
   * Checks if a metric slug is allowed (exists in our placeholder set)
   */
  isAllowedMetric: (slug: string): boolean => {
    const allowedSlugs = [
      // The Titan
      'bench_press', 'squat', 'deadlift', 'bicep_curl', 'shoulder_press',
      // The Beast
      'power_clean', 'snatch', 'clean_jerk', 'farmers_walk', 'atlas_stone',
      // The Body Weight Master
      'pull_ups', 'push_ups', 'handstand_hold', 'muscle_ups', 'l_sit_hold',
      // The Hunter Gatherer
      '5k_time', '10k_time', 'half_marathon_time', 'marathon_time', 'vertical_jump',
      // The Super Athlete
      '100m_sprint', '400m_sprint', 'mile_time', 'broad_jump', 'box_jump'
    ];
    
    return allowedSlugs.includes(slug);
  },

  /**
   * Validates metric data against our schema
   */
  validateMetricData: (data: any) => {
    if (!data.slug || !METRIC_GUARDS.isAllowedMetric(data.slug)) {
      return {
        ok: false,
        error: "Invalid metric slug. Only predefined metrics are allowed."
      };
    }
    
    return { ok: true };
  }
};

export const USER_GUARDS = {
  /**
   * Ensures user has completed onboarding
   */
  requireOnboarding: (user: any) => {
    if (!user.gender || !user.primaryClassId) {
      return {
        ok: false,
        error: "Please complete your profile setup first."
      };
    }
    
    return { ok: true };
  }
};

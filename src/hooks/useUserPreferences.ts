import { useState, useEffect } from 'react';

export interface UserPreferences {
  units: 'metric' | 'imperial';
  language: 'en';
  sfxEnabled: boolean;
  sfxVolume: number;
}

const defaultPreferences: UserPreferences = {
  units: 'imperial',
  language: 'en',
  sfxEnabled: true,
  sfxVolume: 0.6,
};

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        const parsed = JSON.parse(stored);
        setPreferences({ ...defaultPreferences, ...parsed });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    try {
      localStorage.setItem('userPreferences', JSON.stringify(newPreferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  };

  // Convenience methods
  const toggleSfx = () => updatePreferences({ sfxEnabled: !preferences.sfxEnabled });
  const setSfxVolume = (volume: number) => updatePreferences({ sfxVolume: Math.max(0, Math.min(1, volume)) });
  const setUnits = (units: 'metric' | 'imperial') => updatePreferences({ units });
  const setLanguage = (language: 'en') => updatePreferences({ language });

  return {
    preferences,
    isLoaded,
    updatePreferences,
    toggleSfx,
    setSfxVolume,
    setUnits,
    setLanguage,
  };
}

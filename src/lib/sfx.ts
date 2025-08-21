/**
 * Sound Effects System
 * Handles audio playback with user preferences
 */

export type SoundType = 'elo_up' | 'elo_down' | 'rank_up' | 'rank_down';

export interface UserPreferences {
  sfxEnabled: boolean;
  sfxVolume: number; // 0.0 to 1.0
  units: 'metric' | 'imperial';
  language: string;
}

class SoundEffectsManager {
  private audioCache: Map<SoundType, HTMLAudioElement> = new Map();
  private preferences: UserPreferences = {
    sfxEnabled: true,
    sfxVolume: 0.7,
    units: 'imperial',
    language: 'en'
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.loadPreferences();
      this.preloadSounds();
    }
  }

  private loadPreferences(): void {
    try {
      const stored = localStorage.getItem('userPreferences');
      if (stored) {
        this.preferences = { ...this.preferences, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save user preferences:', error);
    }
  }

  private preloadSounds(): void {
    const soundTypes: SoundType[] = ['elo_up', 'elo_down', 'rank_up', 'rank_down'];
    
    soundTypes.forEach(type => {
      try {
        const audio = new Audio(`/sfx/${type}.mp3`);
        audio.preload = 'auto';
        audio.volume = this.preferences.sfxVolume;
        this.audioCache.set(type, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${type}`, error);
      }
    });
  }

  public playSound(type: SoundType): void {
    if (!this.preferences.sfxEnabled || typeof window === 'undefined') {
      return;
    }

    try {
      const audio = this.audioCache.get(type);
      if (audio) {
        audio.currentTime = 0;
        audio.volume = this.preferences.sfxVolume;
        audio.play().catch(error => {
          console.warn(`Failed to play sound: ${type}`, error);
        });
      }
    } catch (error) {
      console.warn(`Error playing sound: ${type}`, error);
    }
  }

  public updatePreferences(newPreferences: Partial<UserPreferences>): void {
    this.preferences = { ...this.preferences, ...newPreferences };
    this.savePreferences();

    // Update audio volumes if changed
    if (newPreferences.sfxVolume !== undefined) {
      this.audioCache.forEach(audio => {
        audio.volume = this.preferences.sfxVolume;
      });
    }
  }

  public getPreferences(): UserPreferences {
    return { ...this.preferences };
  }

  public setSfxEnabled(enabled: boolean): void {
    this.updatePreferences({ sfxEnabled: enabled });
  }

  public setSfxVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.updatePreferences({ sfxVolume: clampedVolume });
  }

  public setUnits(units: 'metric' | 'imperial'): void {
    this.updatePreferences({ units });
  }

  public setLanguage(language: string): void {
    this.updatePreferences({ language });
  }
}

// Singleton instance
export const sfxManager = new SoundEffectsManager();

// Convenience functions
export const playEloUp = () => sfxManager.playSound('elo_up');
export const playEloDown = () => sfxManager.playSound('elo_down');
export const playRankUp = () => sfxManager.playSound('rank_up');
export const playRankDown = () => sfxManager.playSound('rank_down');

// React hook for preferences
import { useState, useEffect } from 'react';

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(sfxManager.getPreferences());

  useEffect(() => {
    const updatePreferences = () => {
      setPreferences(sfxManager.getPreferences());
    };

    // Listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'userPreferences') {
        updatePreferences();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    sfxManager.updatePreferences(newPreferences);
    setPreferences(sfxManager.getPreferences());
  };

  return {
    preferences,
    updatePreferences,
    setSfxEnabled: sfxManager.setSfxEnabled.bind(sfxManager),
    setSfxVolume: sfxManager.setSfxVolume.bind(sfxManager),
    setUnits: sfxManager.setUnits.bind(sfxManager),
    setLanguage: sfxManager.setLanguage.bind(sfxManager),
  };
}

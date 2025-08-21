import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Save, 
  RotateCcw, 
  User, 
  Settings as SettingsIcon,
  Shield,
  Volume2,
  VolumeX,
  Globe,
  Ruler
} from 'lucide-react';
import AppShell from '@/components/AppShell';
import PageTransition from '@/components/PageTransition';
import ClientOnly from '@/components/ClientOnly';
import { useUserPreferences } from '@/lib/sfx';

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { preferences, updatePreferences } = useUserPreferences();
  
  const [localPreferences, setLocalPreferences] = useState(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, status, router]);

  React.useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);

  const handlePreferenceChange = (key: keyof typeof preferences, value: unknown) => {
    setLocalPreferences(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updatePreferences(localPreferences);
      setHasChanges(false);
      
      // Show success feedback
      setTimeout(() => {
        setIsSaving(false);
      }, 500);
    } catch (error) {
      console.error('Failed to save preferences:', error);
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
    setHasChanges(false);
  };

  const testSound = () => {
    // Test sound effect
    const audio = new Audio('/sfx/elo_up.mp3');
    audio.volume = localPreferences.sfxVolume;
    audio.play().catch(console.warn);
  };

  if (status === 'loading') {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">Loading...</div>
        </div>
      </AppShell>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <AppShell>
      <PageTransition>
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="flex items-center justify-center space-x-3 mb-4">
              <SettingsIcon className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            </div>
            <p className="text-gray-600">Customize your experience</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Settings Panels */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Audio Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Volume2 className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Audio Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Sound Effects Toggle */}
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Sound Effects</label>
                      <p className="text-sm text-gray-500">Play sounds for ELO and rank changes</p>
                    </div>
                    <button
                      onClick={() => handlePreferenceChange('sfxEnabled', !localPreferences.sfxEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        localPreferences.sfxEnabled ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          localPreferences.sfxEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Volume Control */}
                  {localPreferences.sfxEnabled && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="font-medium text-gray-900">Volume</label>
                        <span className="text-sm text-gray-500">
                          {Math.round(localPreferences.sfxVolume * 100)}%
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <VolumeX className="w-4 h-4 text-gray-400" />
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={localPreferences.sfxVolume}
                          onChange={(e) => handlePreferenceChange('sfxVolume', parseFloat(e.target.value))}
                          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                        <Volume2 className="w-4 h-4 text-gray-400" />
                        <button
                          onClick={testSound}
                          className="px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Units Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Ruler className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Units & Measurement</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-medium text-gray-900 mb-3 block">Measurement System</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handlePreferenceChange('units', 'imperial')}
                        className={`p-4 rounded-lg border text-center transition-colors ${
                          localPreferences.units === 'imperial'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold">Imperial</div>
                        <div className="text-sm text-gray-500">lbs, ft, in</div>
                      </button>
                      <button
                        onClick={() => handlePreferenceChange('units', 'metric')}
                        className={`p-4 rounded-lg border text-center transition-colors ${
                          localPreferences.units === 'metric'
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold">Metric</div>
                        <div className="text-sm text-gray-500">kg, cm, m</div>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Language Settings */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Globe className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Language & Region</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="font-medium text-gray-900 mb-3 block">Language</label>
                    <select
                      value={localPreferences.language}
                      onChange={(e) => handlePreferenceChange('language', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="en">English</option>
                      <option value="es" disabled>Spanish (Coming Soon)</option>
                      <option value="fr" disabled>French (Coming Soon)</option>
                      <option value="de" disabled>German (Coming Soon)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Additional languages coming soon
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Privacy & Notifications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <Shield className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Privacy & Notifications</h2>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Friend Requests</label>
                      <p className="text-sm text-gray-500">Notify when someone sends a friend request</p>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Leaderboard Updates</label>
                      <p className="text-sm text-gray-500">Notify about ranking changes</p>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-medium text-gray-900">Profile Visibility</label>
                      <p className="text-sm text-gray-500">Allow others to see your stats</p>
                    </div>
                    <button
                      className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600"
                    >
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Save Panel */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Save Changes</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                  
                  <button
                    onClick={handleReset}
                    disabled={!hasChanges}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset</span>
                  </button>
                </div>
                
                {hasChanges && (
                  <p className="text-xs text-amber-600 mt-2">
                    You have unsaved changes
                  </p>
                )}
              </motion.div>

              {/* Account Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Account</h3>
                </div>
                
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <ClientOnly>
                      <span className="ml-2 font-medium">{session.user.name}</span>
                    </ClientOnly>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <ClientOnly>
                      <span className="ml-2 font-medium">{session.user.email}</span>
                    </ClientOnly>
                  </div>
                  <div>
                    <span className="text-gray-500">Member since:</span>
                    <span className="ml-2 font-medium">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100"
              >
                <h3 className="font-semibold text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current ELO:</span>
                    <span className="font-bold text-blue-600">1500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Friends:</span>
                    <span className="font-bold text-purple-600">0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Metrics Tracked:</span>
                    <span className="font-bold text-green-600">0</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </PageTransition>
    </AppShell>
  );
}

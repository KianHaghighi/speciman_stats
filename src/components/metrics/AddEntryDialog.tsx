import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Upload, Play, Camera, AlertTriangle, 
  Trophy, Medal, Award, Star, Crown, Gem
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

interface Metric {
  id: string;
  name: string;
  unit: string;
  higherIsBetter: boolean;
  rankBreakpoints?: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
  group?: string;
}

interface AddEntryDialogProps {
  metric: Metric;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface TierInfo {
  tier: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  textColor: string;
  requiresVideo: boolean;
}

const TIER_INFO: Record<string, TierInfo> = {
  unranked: {
    tier: 'Unranked',
    icon: <Star className="w-4 h-4" />,
    color: 'gray-400',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    requiresVideo: false,
  },
  bronze: {
    tier: 'Bronze',
    icon: <Medal className="w-4 h-4" />,
    color: 'amber-600',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-800',
    requiresVideo: false,
  },
  silver: {
    tier: 'Silver',
    icon: <Medal className="w-4 h-4" />,
    color: 'gray-500',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    requiresVideo: false,
  },
  gold: {
    tier: 'Gold',
    icon: <Award className="w-4 h-4" />,
    color: 'yellow-500',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-800',
    requiresVideo: false,
  },
  platinum: {
    tier: 'Platinum',
    icon: <Trophy className="w-4 h-4" />,
    color: 'blue-500',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    requiresVideo: true,
  },
  diamond: {
    tier: 'Diamond',
    icon: <Gem className="w-4 h-4" />,
    color: 'purple-500',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    requiresVideo: true,
  },
  legendary: {
    tier: 'Legendary',
    icon: <Crown className="w-4 h-4" />,
    color: 'rose-500',
    bgColor: 'bg-rose-100',
    textColor: 'text-rose-800',
    requiresVideo: true,
  },
};

export default function AddEntryDialog({ metric, isOpen, onClose, onSuccess }: AddEntryDialogProps) {
  const { addToast } = useToast();
  const [value, setValue] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTier, setCurrentTier] = useState<TierInfo>(TIER_INFO.unranked);

  // Calculate tier based on current value
  useEffect(() => {
    if (!value || !metric.rankBreakpoints) {
      setCurrentTier(TIER_INFO.unranked);
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setCurrentTier(TIER_INFO.unranked);
      return;
    }

    const breakpoints = metric.rankBreakpoints;
    let tier = 'unranked';

    if (metric.higherIsBetter) {
      if (numValue >= breakpoints.diamond) tier = 'diamond';
      else if (numValue >= breakpoints.platinum) tier = 'platinum';
      else if (numValue >= breakpoints.gold) tier = 'gold';
      else if (numValue >= breakpoints.silver) tier = 'silver';
      else if (numValue >= breakpoints.bronze) tier = 'bronze';
    } else {
      if (numValue <= breakpoints.diamond) tier = 'diamond';
      else if (numValue <= breakpoints.platinum) tier = 'platinum';
      else if (numValue <= breakpoints.gold) tier = 'gold';
      else if (numValue <= breakpoints.silver) tier = 'silver';
      else if (numValue <= breakpoints.bronze) tier = 'bronze';
    }

    setCurrentTier(TIER_INFO[tier] || TIER_INFO.unranked);
  }, [value, metric]);

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('video/')) {
      addToast({
        type: 'error',
        title: 'Invalid File Type',
        message: 'Please upload a video file.',
      });
      return;
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      addToast({
        type: 'error',
        title: 'File Too Large',
        message: 'Video file must be less than 100MB.',
      });
      return;
    }

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const removeVideo = () => {
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoFile(null);
    setVideoPreview('');
  };

  const canSubmit = () => {
    if (!value || isNaN(parseFloat(value))) return false;
    if (currentTier.requiresVideo && !videoFile) return false;
    return true;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('metricId', metric.id);
      formData.append('value', value);
      formData.append('notes', notes);
      formData.append('tier', currentTier.tier);

      if (videoFile) {
        formData.append('video', videoFile);
      }

      const response = await fetch('/api/metrics/entries', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit entry');
      }

      // Show appropriate success message
      if (result.status === 'PENDING') {
        addToast({
          type: 'info',
          title: 'Entry Submitted for Review',
          message: 'Your platinum/diamond entry has been sent for review. You\'ll be notified once it\'s processed.',
        });
      } else {
        addToast({
          type: 'success',
          title: 'Entry Recorded!',
          message: `Your ${metric.name} entry has been approved automatically.`,
        });
      }

      // Reset form
      setValue('');
      setNotes('');
      removeVideo();
      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error submitting entry:', error);
      addToast({
        type: 'error',
        title: 'Submission Failed',
        message: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add {metric.name} Entry</h2>
              <p className="text-sm text-gray-600 mt-1">
                Record your personal best • Unit: {metric.unit}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Value Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Value ({metric.unit})
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={`Enter your ${metric.name.toLowerCase()}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                  step="any"
                />
              </div>

              {/* Tier Display */}
              {value && !isNaN(parseFloat(value)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-lg ${currentTier.bgColor} border border-${currentTier.color}/20`}
                >
                  <div className="flex items-center space-x-2">
                    <div className={`text-${currentTier.color}`}>
                      {currentTier.icon}
                    </div>
                    <span className={`font-semibold ${currentTier.textColor}`}>
                      {currentTier.tier} Tier
                    </span>
                    {currentTier.requiresVideo && (
                      <div className="flex items-center space-x-1 text-orange-600">
                        <Camera className="w-4 h-4" />
                        <span className="text-xs font-medium">Video Required</span>
                      </div>
                    )}
                  </div>
                  
                  {currentTier.requiresVideo && (
                    <p className="text-xs text-gray-600 mt-2">
                      Platinum and above performances require video verification for approval.
                    </p>
                  )}
                </motion.div>
              )}

              {/* Video Upload Section */}
              {currentTier.requiresVideo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="border-2 border-dashed border-orange-300 rounded-lg p-6 bg-orange-50">
                    <div className="text-center">
                      {!videoFile ? (
                        <>
                          <Camera className="w-12 h-12 text-orange-500 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-orange-900 mb-2">
                            Video Verification Required
                          </h3>
                          <p className="text-sm text-orange-700 mb-4">
                            Upload a video showing your {metric.name.toLowerCase()} performance.
                            This helps maintain the integrity of our leaderboards.
                          </p>
                          <label className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 cursor-pointer transition-colors">
                            <Upload className="w-4 h-4 mr-2" />
                            Choose Video File
                            <input
                              type="file"
                              accept="video/*"
                              onChange={handleVideoUpload}
                              className="hidden"
                            />
                          </label>
                          <p className="text-xs text-orange-600 mt-2">
                            Max file size: 100MB • Supported: MP4, MOV, AVI
                          </p>
                        </>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-center space-x-2 text-green-700">
                            <Play className="w-5 h-5" />
                            <span className="font-medium">Video uploaded: {videoFile.name}</span>
                          </div>
                          {videoPreview && (
                            <video
                              src={videoPreview}
                              controls
                              className="w-full max-w-md mx-auto rounded-lg"
                              style={{ maxHeight: '200px' }}
                            />
                          )}
                          <button
                            type="button"
                            onClick={removeVideo}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove Video
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Video Requirements Warning */}
                  {!videoFile && (
                    <div className="flex items-start space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-red-800">
                          Cannot submit without video
                        </p>
                        <p className="text-red-700">
                          Platinum and Diamond tier performances require video proof to prevent false claims.
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any context about this performance..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Review Process Info */}
              {currentTier.requiresVideo && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Review Process</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Your entry will be marked as "Pending Review"</li>
                    <li>• A reviewer will verify your video within 48 hours</li>
                    <li>• You'll receive an in-app notification with the decision</li>
                    <li>• Approved entries will update your stats immediately</li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            
            <button
              onClick={handleSubmit}
              disabled={!canSubmit() || isSubmitting}
              className={`
                px-6 py-2 rounded-lg font-medium transition-colors
                ${canSubmit() && !isSubmitting
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Submitting...</span>
                </span>
              ) : (
                `Submit ${currentTier.requiresVideo ? 'for Review' : 'Entry'}`
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

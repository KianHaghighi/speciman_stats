import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Calendar, Scale, Ruler, Target, MapPin, 
  ChevronRight, ChevronLeft, Check, AlertCircle,
  Upload, Play, Camera
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { CLASSES, CLASS_DESCRIPTIONS, CLASS_ICONS } from '@/config/classes';

interface OnboardingData {
  dateOfBirth: string;
  sexAtBirth: 'MALE' | 'FEMALE' | 'OTHER';
  heightCm: number;
  weightKg: number;
  bodyFatPct: number;
  primaryClassId: string;
  gymId?: string;
  newGymName?: string;
  newGymCity?: string;
  newGymState?: string;
  initialMetrics: {
    metricId: string;
    value: number;
    videoUrl?: string;
  }[];
}

interface Gym {
  id: string;
  name: string;
  city?: string;
  state?: string;
}

const STEPS = [
  { id: 1, title: "Personal Info", subtitle: "Basic information about you" },
  { id: 2, title: "Body Metrics", subtitle: "Height, weight, and body composition" },
  { id: 3, title: "Fitness Class", subtitle: "Choose your primary focus" },
  { id: 4, title: "Gym Selection", subtitle: "Where do you train?" },
  { id: 5, title: "Initial Metrics", subtitle: "Add your current best lifts" },
];

export default function Onboarding() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const { addToast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [availableGyms, setAvailableGyms] = useState<Gym[]>([]);
  const [availableMetrics, setAvailableMetrics] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [data, setData] = useState<OnboardingData>({
    dateOfBirth: '',
    sexAtBirth: 'MALE',
    heightCm: 175,
    weightKg: 70,
    bodyFatPct: 15,
    primaryClassId: '',
    initialMetrics: [],
  });

  useEffect(() => {
    if (!session) {
      router.push('/auth/login');
      return;
    }
    
    // Check if user already completed onboarding
    if (session.user?.gender && session.user?.primaryClassId) {
      router.push('/dashboard');
      return;
    }
  }, [session, router]);

  useEffect(() => {
    // Load gyms and metrics when component mounts
    loadGyms();
    loadMetrics();
  }, []);

  const loadGyms = async () => {
    try {
      const response = await fetch('/api/gyms');
      if (response.ok) {
        const gyms = await response.json();
        setAvailableGyms(gyms);
      }
    } catch (error) {
      console.error('Failed to load gyms:', error);
    }
  };

  const loadMetrics = async () => {
    try {
      const response = await fetch('/api/metrics');
      if (response.ok) {
        const metrics = await response.json();
        setAvailableMetrics(metrics);
      }
    } catch (error) {
      console.error('Failed to load metrics:', error);
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!data.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          const age = new Date().getFullYear() - new Date(data.dateOfBirth).getFullYear();
          if (age < 13 || age > 100) {
            newErrors.dateOfBirth = 'Age must be between 13 and 100';
          }
        }
        break;
        
      case 2:
        if (data.heightCm < 100 || data.heightCm > 250) {
          newErrors.heightCm = 'Height must be between 100-250 cm';
        }
        if (data.weightKg < 30 || data.weightKg > 300) {
          newErrors.weightKg = 'Weight must be between 30-300 kg';
        }
        if (data.bodyFatPct < 3 || data.bodyFatPct > 50) {
          newErrors.bodyFatPct = 'Body fat % must be between 3-50%';
        }
        break;
        
      case 3:
        if (!data.primaryClassId) {
          newErrors.primaryClassId = 'Please select a fitness class';
        }
        break;
        
      case 4:
        if (!data.gymId && !data.newGymName) {
          newErrors.gym = 'Please select a gym or create a new one';
        }
        if (data.newGymName && (!data.newGymCity || !data.newGymState)) {
          newErrors.newGym = 'City and state are required for new gyms';
        }
        break;
        
      case 5:
        // Validate initial metrics
        for (const metric of data.initialMetrics) {
          if (!metric.value || metric.value <= 0) {
            newErrors[`metric_${metric.metricId}`] = 'Value is required';
          }
          
          // Check if video is required (tier >= platinum)
          if (needsVideo(metric.value, metric.metricId) && !metric.videoUrl) {
            newErrors[`video_${metric.metricId}`] = 'Video is required for this performance level';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const needsVideo = (value: number, metricId: string): boolean => {
    // Simple check - if value is high enough to warrant platinum tier
    // This would normally check against actual rank breakpoints
    const metric = availableMetrics.find(m => m.id === metricId);
    if (!metric?.rankBreakpoints) return false;
    
    const platinum = metric.rankBreakpoints.platinum || 0;
    return metric.higherIsBetter ? value >= platinum : value <= platinum;
  };

  const computeDerivedMetrics = () => {
    const heightM = data.heightCm / 100;
    const bmi = data.weightKg / (heightM * heightM);
    
    // Fat-Free Mass Index calculation
    const leanMass = data.weightKg * (1 - data.bodyFatPct / 100);
    const ffmi = leanMass / (heightM * heightM);
    
    // Adjusted FFMI (normalized for height)
    const adjustedFFMI = ffmi + (6.1 * (1.8 - heightM));
    
    return { bmi, ffmi: adjustedFFMI };
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    
    try {
      const { bmi, ffmi } = computeDerivedMetrics();
      
      // Submit onboarding data
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          derivedMetrics: [
            { slug: 'bmi', value: bmi },
            { slug: 'ffmi', value: ffmi },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
      }

      // Update session
      await update();
      
      addToast({
        type: 'success',
        title: 'Welcome to SpecimenStats!',
        message: 'Your profile has been created successfully.',
      });
      
      router.push('/dashboard');
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Onboarding Failed',
        message: 'Please try again or contact support.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const uploadVideo = async (file: File, metricId: string) => {
    // Placeholder video upload logic
    // In a real app, you'd upload to a storage service
    const videoUrl = URL.createObjectURL(file);
    
    setData(prev => ({
      ...prev,
      initialMetrics: prev.initialMetrics.map(m => 
        m.metricId === metricId ? { ...m, videoUrl } : m
      ),
    }));
  };

  const addInitialMetric = () => {
    if (availableMetrics.length > 0) {
      setData(prev => ({
        ...prev,
        initialMetrics: [
          ...prev.initialMetrics,
          {
            metricId: availableMetrics[0].id,
            value: 0,
          },
        ],
      }));
    }
  };

  const removeInitialMetric = (index: number) => {
    setData(prev => ({
      ...prev,
      initialMetrics: prev.initialMetrics.filter((_, i) => i !== index),
    }));
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                  }
                `}>
                  {currentStep > step.id ? <Check className="w-5 h-5" /> : step.id}
                </div>
                {index < STEPS.length - 1 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {STEPS[currentStep - 1].title}
            </h2>
            <p className="text-gray-600 mt-1">
              {STEPS[currentStep - 1].subtitle}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl shadow-xl p-8 mb-8"
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Personal Info */}
            {currentStep === 1 && (
              <motion.div key="step1" className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={data.dateOfBirth}
                    onChange={(e) => setData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {errors.dateOfBirth && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.dateOfBirth}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sex at Birth
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['MALE', 'FEMALE', 'OTHER'] as const).map((sex) => (
                      <button
                        key={sex}
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, sexAtBirth: sex }))}
                        className={`
                          px-4 py-3 rounded-lg border font-medium transition-colors
                          ${data.sexAtBirth === sex
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        {sex.charAt(0) + sex.slice(1).toLowerCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Body Metrics */}
            {currentStep === 2 && (
              <motion.div key="step2" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Ruler className="inline w-4 h-4 mr-1" />
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={data.heightCm}
                      onChange={(e) => setData(prev => ({ ...prev, heightCm: parseInt(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="100"
                      max="250"
                    />
                    {errors.heightCm && (
                      <p className="mt-1 text-sm text-red-600">{errors.heightCm}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Scale className="inline w-4 h-4 mr-1" />
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={data.weightKg}
                      onChange={(e) => setData(prev => ({ ...prev, weightKg: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="30"
                      max="300"
                      step="0.1"
                    />
                    {errors.weightKg && (
                      <p className="mt-1 text-sm text-red-600">{errors.weightKg}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Body Fat Percentage (%)
                  </label>
                  <input
                    type="number"
                    value={data.bodyFatPct}
                    onChange={(e) => setData(prev => ({ ...prev, bodyFatPct: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="3"
                    max="50"
                    step="0.1"
                  />
                  {errors.bodyFatPct && (
                    <p className="mt-1 text-sm text-red-600">{errors.bodyFatPct}</p>
                  )}
                  
                  {/* BMI & FFMI Preview */}
                  {data.heightCm > 0 && data.weightKg > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Calculated Metrics</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-blue-700">BMI:</span>
                          <span className="ml-2 font-medium">
                            {(data.weightKg / Math.pow(data.heightCm / 100, 2)).toFixed(1)}
                          </span>
                        </div>
                        <div>
                          <span className="text-blue-700">Adjusted FFMI:</span>
                          <span className="ml-2 font-medium">
                            {computeDerivedMetrics().ffmi.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 3: Class Selection */}
            {currentStep === 3 && (
              <motion.div key="step3" className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    <Target className="inline w-4 h-4 mr-1" />
                    Choose Your Primary Fitness Class
                  </label>
                  <div className="grid grid-cols-1 gap-4">
                    {CLASSES.map((cls) => (
                      <button
                        key={cls.slug}
                        type="button"
                        onClick={() => setData(prev => ({ ...prev, primaryClassId: `class_${cls.slug}` }))}
                        className={`
                          p-4 rounded-lg border text-left transition-colors
                          ${data.primaryClassId === `class_${cls.slug}`
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{cls.name}</h3>
                            <p className={`text-sm mt-1 ${
                              data.primaryClassId === `class_${cls.slug}` 
                                ? 'text-blue-100' 
                                : 'text-gray-500'
                            }`}>
                              {CLASS_DESCRIPTIONS[cls.slug]}
                            </p>
                          </div>
                          <div className="text-2xl">
                            {CLASS_ICONS[cls.slug]}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {errors.primaryClassId && (
                    <p className="mt-2 text-sm text-red-600">{errors.primaryClassId}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 4: Gym Selection */}
            {currentStep === 4 && (
              <motion.div key="step4" className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    <MapPin className="inline w-4 h-4 mr-1" />
                    Where do you train?
                  </label>
                  
                  {/* Existing Gyms */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Select an existing gym:</h4>
                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                      {availableGyms.map((gym) => (
                        <button
                          key={gym.id}
                          type="button"
                          onClick={() => setData(prev => ({ ...prev, gymId: gym.id, newGymName: '', newGymCity: '', newGymState: '' }))}
                          className={`
                            p-3 rounded-lg border text-left transition-colors
                            ${data.gymId === gym.id
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className="font-medium">{gym.name}</div>
                          {gym.city && gym.state && (
                            <div className={`text-sm ${
                              data.gymId === gym.id ? 'text-blue-100' : 'text-gray-500'
                            }`}>
                              {gym.city}, {gym.state}
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Create New Gym */}
                  <div className="border-t pt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Or create a new gym:</h4>
                    <div className="space-y-4">
                      <input
                        type="text"
                        placeholder="Gym name"
                        value={data.newGymName || ''}
                        onChange={(e) => setData(prev => ({ 
                          ...prev, 
                          newGymName: e.target.value,
                          gymId: e.target.value ? '' : prev.gymId 
                        }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          value={data.newGymCity || ''}
                          onChange={(e) => setData(prev => ({ ...prev, newGymCity: e.target.value }))}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={data.newGymState || ''}
                          onChange={(e) => setData(prev => ({ ...prev, newGymState: e.target.value }))}
                          className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {(errors.gym || errors.newGym) && (
                    <p className="mt-2 text-sm text-red-600">
                      {errors.gym || errors.newGym}
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 5: Initial Metrics */}
            {currentStep === 5 && (
              <motion.div key="step5" className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Add your current best lifts (optional)
                    </label>
                    <button
                      type="button"
                      onClick={addInitialMetric}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Add Metric
                    </button>
                  </div>

                  <div className="space-y-4">
                    {data.initialMetrics.map((metric, index) => {
                      const metricInfo = availableMetrics.find(m => m.id === metric.metricId);
                      const requiresVideo = needsVideo(metric.value, metric.metricId);
                      
                      return (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-gray-900">Metric #{index + 1}</h4>
                            <button
                              type="button"
                              onClick={() => removeInitialMetric(index)}
                              className="text-red-600 hover:text-red-800 text-sm"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Metric
                              </label>
                              <select
                                value={metric.metricId}
                                onChange={(e) => setData(prev => ({
                                  ...prev,
                                  initialMetrics: prev.initialMetrics.map((m, i) => 
                                    i === index ? { ...m, metricId: e.target.value } : m
                                  ),
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              >
                                <option value="">Select a metric</option>
                                {availableMetrics.map((m) => (
                                  <option key={m.id} value={m.id}>
                                    {m.name} ({m.unit})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Value {metricInfo && `(${metricInfo.unit})`}
                              </label>
                              <input
                                type="number"
                                value={metric.value || ''}
                                onChange={(e) => setData(prev => ({
                                  ...prev,
                                  initialMetrics: prev.initialMetrics.map((m, i) => 
                                    i === index ? { ...m, value: parseFloat(e.target.value) || 0 } : m
                                  ),
                                }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                step="0.1"
                                min="0"
                              />
                              {errors[`metric_${metric.metricId}`] && (
                                <p className="mt-1 text-sm text-red-600">
                                  {errors[`metric_${metric.metricId}`]}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Video Upload for High-Tier Performance */}
                          {requiresVideo && (
                            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                              <div className="flex items-start space-x-2">
                                <Camera className="w-5 h-5 text-orange-600 mt-0.5" />
                                <div className="flex-1">
                                  <h5 className="font-medium text-orange-900">Video Required</h5>
                                  <p className="text-sm text-orange-700 mb-3">
                                    This performance level requires video verification.
                                  </p>
                                  
                                  {metric.videoUrl ? (
                                    <div className="flex items-center space-x-2">
                                      <Play className="w-4 h-4 text-green-600" />
                                      <span className="text-sm text-green-700">Video uploaded</span>
                                      <button
                                        type="button"
                                        onClick={() => setData(prev => ({
                                          ...prev,
                                          initialMetrics: prev.initialMetrics.map((m, i) => 
                                            i === index ? { ...m, videoUrl: undefined } : m
                                          ),
                                        }))}
                                        className="text-sm text-red-600 hover:text-red-800"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : (
                                    <div>
                                      <input
                                        type="file"
                                        accept="video/*"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            uploadVideo(file, metric.metricId);
                                          }
                                        }}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                                      />
                                      {errors[`video_${metric.metricId}`] && (
                                        <p className="mt-1 text-sm text-red-600">
                                          {errors[`video_${metric.metricId}`]}
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {data.initialMetrics.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Target className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No metrics added yet. Click "Add Metric" to get started.</p>
                      <p className="text-sm mt-1">You can always add these later from your dashboard.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </button>
          
          {currentStep < STEPS.length ? (
            <button
              onClick={nextStep}
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? 'Completing...' : 'Complete Setup'}
              <Check className="w-4 h-4 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

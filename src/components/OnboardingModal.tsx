import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import { signOut, useSession, signIn } from 'next-auth/react';
import { CLASSES, CLASS_COLORS, CLASS_DESCRIPTIONS } from '@/config/classes';

export default function OnboardingModal({ open, onFinish }: { open: boolean; onFinish: () => void }) {
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState('');
  const [gender, setGender] = useState<'MALE' | 'FEMALE' | 'OTHER' | 'UNSPECIFIED'>('UNSPECIFIED');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: async () => {
      await update();
      onFinish();
    },
    onError: (error) => {
      setError(error.message);
      setLoading(false);
    },
  });

  if (!session || !session.user?.id) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="bg-white rounded-3xl shadow-2xl p-12 flex flex-col items-center">
          <h2 className="text-3xl font-bold text-blue-900 mb-6">Sign in to continue</h2>
          <p className="mb-6 text-lg text-gray-700 text-center">You must sign in with Discord to create your profile and save your stats.</p>
          <button
            onClick={() => signIn('discord', { callbackUrl: '/' })}
            className="bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-blue-700"
          >
            Sign in with Discord
          </button>
          <div className="mt-4 text-red-500 text-center">
            {(!session || !session.user?.id) && 'Session is invalid or missing user ID. Please sign out and sign in again.'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-3xl shadow-2xl w-full h-full md:w-[100vw] md:h-[90vh] max-w-none max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-4xl md:text-6xl font-bold text-blue-900">Create Your Profile</h2>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="ml-4 px-4 py-2 bg-blue-100 text-blue-900 rounded-xl font-bold hover:bg-blue-200"
              >
                Sign Out
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {step === 1 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <h3 className="text-3xl font-bold mb-8 text-blue-900">Choose Your Gender</h3>
                  <div className="grid grid-cols-2 gap-6 max-w-md mx-auto">
                    <button
                      onClick={() => setGender('MALE')}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        gender === 'MALE'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">👨</div>
                      <div className="font-semibold text-gray-800">Male</div>
                    </button>
                    <button
                      onClick={() => setGender('FEMALE')}
                      className={`p-6 rounded-2xl border-2 transition-all ${
                        gender === 'FEMALE'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">👩</div>
                      <div className="font-semibold text-gray-800">Female</div>
                    </button>
                    <button
                      onClick={() => setGender('OTHER')}
                      className={`p-6 rounded-2xl border-2 transition-all col-span-2 ${
                        gender === 'OTHER'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">🌈</div>
                      <div className="font-semibold text-gray-800">Other</div>
                    </button>
                    <button
                      onClick={() => setGender('UNSPECIFIED')}
                      className={`p-6 rounded-2xl border-2 transition-all col-span-2 ${
                        gender === 'UNSPECIFIED'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">🤷</div>
                      <div className="font-semibold text-gray-800">Prefer not to say</div>
                    </button>
                  </div>
                  
                  <button
                    onClick={() => setStep(2)}
                    disabled={gender === 'UNSPECIFIED'}
                    className="mt-8 bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continue
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="text-center"
                >
                  <h3 className="text-3xl font-bold mb-8 text-blue-900">Select Your Primary Fitness Class</h3>
                  <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                    Choose the fitness discipline that best represents your primary focus. 
                    You can change this later, and you'll have ELO ratings for all classes.
                  </p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                    {CLASSES.map((cls, index) => (
                      <motion.button
                        key={cls.slug}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => setSelectedClass(cls.slug)}
                        className={`p-6 rounded-2xl border-2 transition-all ${
                          selectedClass === cls.slug
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full ${CLASS_COLORS[cls.slug]} mb-3 mx-auto`}></div>
                        <div className="font-semibold text-gray-800 text-lg mb-2">{cls.name}</div>
                        <div className="text-sm text-gray-600">{CLASS_DESCRIPTIONS[cls.slug]}</div>
                      </motion.button>
                    ))}
                  </div>
                  
                  <div className="mt-8 flex gap-4 justify-center">
                    <button
                      onClick={() => setStep(1)}
                      className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-medium hover:border-gray-400"
                    >
                      Back
                    </button>
                    <button
                      onClick={async () => {
                        if (!session?.user?.id) {
                          setError('Session is invalid or missing user ID. Please sign out and sign in again.');
                          return;
                        }
                        
                        if (!selectedClass) {
                          setError('Please select a primary fitness class.');
                          return;
                        }
                        
                        setLoading(true);
                        setError('');
                        
                        try {
                          // Find the class ID for the selected slug
                          const classResponse = await fetch('/api/classes');
                          if (!classResponse.ok) {
                            throw new Error('Failed to fetch classes');
                          }
                          const classes = await classResponse.json();
                          const selectedClassData = classes.find((c: any) => c.slug === selectedClass);
                          
                          if (!selectedClassData) {
                            throw new Error('Selected class not found');
                          }
                          
                          await updateProfile.mutateAsync({
                            gender,
                            primaryClassId: selectedClassData.id,
                          });
                        } catch (err) {
                          let errMsg = 'Failed to update profile';
                          if (err instanceof Error && err.message) errMsg += ': ' + err.message;
                          setError(errMsg);
                          console.error('Update profile error:', err);
                        }
                        
                        setLoading(false);
                      }}
                      disabled={loading || !selectedClass}
                      className="px-8 py-3 bg-blue-600 text-white rounded-xl text-xl font-bold shadow-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Saving...' : 'Complete Profile'}
                    </button>
                  </div>
                  
                  {error && (
                    <div className="mt-4 text-red-500 text-center">
                      {error}
                      {error.includes('sign out') && (
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="block mx-auto mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
                        >
                          Sign Out
                        </button>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
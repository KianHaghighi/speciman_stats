import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/utils/trpc';
import { signOut, useSession, signIn } from 'next-auth/react';
import dayjs from 'dayjs';

const classImages = [
  { key: 'theTitan', base: 'class-titan' },
  { key: 'theBeast', base: 'class-beast' },
  { key: 'bodyweightMaster', base: 'class-bodyweight' },
  { key: 'superAthlete', base: 'class-superathlete' },
  { key: 'hunterGatherer', base: 'class-hunter' },
];

// Add unit toggles and conversion helpers
const convertLbsToKg = (lbs: number) => Math.round(lbs * 0.453592 * 10) / 10;
const convertFtInToCm = (feet: number, inches: number) => Math.round(((feet * 12) + inches) * 2.54);

export default function OnboardingModal({ open, onFinish }: { open: boolean; onFinish: () => void }) {
  const { data: session, update } = useSession();
  const [step, setStep] = useState(1);
  const [selectedClass, setSelectedClass] = useState('');
  const [sex, setSex] = useState<'male' | 'female' | ''>('');
  const [birthDate, setBirthDate] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ftin'>('cm');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [height, setHeight] = useState('');

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
                >
                  <h3 className="text-lg font-semibold mb-4 text-white">Choose Your Gender</h3>
                  <div className="flex gap-4 mb-6 justify-center">
                    <button
                      onClick={() => setSex('male')}
                      className={`flex-1 p-4 rounded-lg border-4 transition-all text-white text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 ${
                        sex === 'male' ? 'border-white shadow-lg scale-105' : 'border-blue-300 opacity-80'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      onClick={() => setSex('female')}
                      className={`flex-1 p-4 rounded-lg border-4 transition-all text-white text-xl font-bold bg-gradient-to-br from-blue-600 to-blue-400 hover:from-blue-700 hover:to-blue-500 ${
                        sex === 'female' ? 'border-white shadow-lg scale-105' : 'border-blue-300 opacity-80'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                  <button
                    onClick={() => setStep(2)}
                    disabled={!sex}
                    className="mt-6 w-full bg-blue-600 text-white py-2 rounded-lg disabled:opacity-50"
                  >
                    Next
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  className="w-full h-full flex flex-col items-center justify-center"
                >
                  <h3 className="text-6xl font-extrabold mb-12 text-blue-900 text-center">Choose Your Class</h3>
                  <div className="w-full flex justify-center">
                    <div className="hidden md:grid grid-cols-5 gap-12 mb-10">
                      {classImages.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => setSelectedClass(c.key)}
                          className={`aspect-square w-80 h-80 rounded-3xl flex items-center justify-center border-4 transition-all bg-gradient-to-br from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 shadow-xl ${
                            selectedClass === c.key ? 'border-white shadow-2xl scale-110' : 'border-blue-200 opacity-95'
                          }`}
                          style={{ boxShadow: selectedClass === c.key ? '0 8px 32px 0 rgba(0, 112, 244, 0.25)' : '0 4px 16px 0 rgba(0,0,0,0.10)' }}
                        >
                          <div className="bg-white rounded-2xl p-2 flex items-center justify-center w-full h-full">
                            <img src={`/${c.base}-${sex === 'male' ? 'm' : 'f'}.png`} alt={c.key} className="w-full h-full object-contain" />
                          </div>
                        </button>
                      ))}
                    </div>
                    {/* Mobile: horizontal scroll */}
                    <div className="flex md:hidden gap-10 px-2 overflow-x-auto mb-10">
                      {classImages.map((c) => (
                        <button
                          key={c.key}
                          onClick={() => setSelectedClass(c.key)}
                          className={`aspect-square min-w-[240px] min-h-[240px] rounded-3xl flex items-center justify-center border-4 transition-all bg-gradient-to-br from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 shadow-xl ${
                            selectedClass === c.key ? 'border-white shadow-2xl scale-110' : 'border-blue-200 opacity-95'
                          }`}
                          style={{ boxShadow: selectedClass === c.key ? '0 8px 32px 0 rgba(0, 112, 244, 0.25)' : '0 4px 16px 0 rgba(0,0,0,0.10)' }}
                        >
                          <div className="bg-white rounded-2xl p-1 flex items-center justify-center w-full h-full">
                            <img src={`/${c.base}-${sex === 'male' ? 'm' : 'f'}.png`} alt={c.key} className="w-full h-full object-contain" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(3)}
                    disabled={!selectedClass}
                    className="mt-12 w-1/2 bg-blue-600 text-white py-3 rounded-xl text-lg font-bold disabled:opacity-50 shadow-lg"
                  >
                    Next
                  </button>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="max-w-xl mx-auto bg-black/80 rounded-2xl p-10 shadow-2xl flex flex-col gap-8"
                >
                  <h3 className="text-3xl font-extrabold mb-6 text-blue-600 text-center">Enter Your Stats</h3>
                  {/* Birth Date Picker */}
                  <div>
                    <label className="block text-lg font-semibold mb-2">Birth Date</label>
                    <input
                      type="date"
                      value={birthDate}
                      onChange={e => setBirthDate(e.target.value)}
                      className="w-full bg-black border border-blue-700 rounded-lg px-4 py-3 text-white text-lg"
                      max={dayjs().format('YYYY-MM-DD')}
                    />
                    {birthDate && (
                      <div className="text-blue-300 mt-1 text-sm">Age: {dayjs().diff(dayjs(birthDate), 'year')}</div>
                    )}
                  </div>
                  {/* Height Input with Unit Toggle */}
                  <div>
                    <label className="block text-lg font-semibold mb-2">Height</label>
                    <div className="flex gap-2 items-center mb-2">
                      <button
                        className={`px-4 py-1 rounded-full font-bold border-2 ${heightUnit === 'cm' ? 'bg-blue-600 text-white border-blue-600' : 'bg-black text-blue-400 border-blue-400'}`}
                        onClick={() => setHeightUnit('cm')}
                      >
                        cm
                      </button>
                      <button
                        className={`px-4 py-1 rounded-full font-bold border-2 ${heightUnit === 'ftin' ? 'bg-blue-600 text-white border-blue-600' : 'bg-black text-blue-400 border-blue-400'}`}
                        onClick={() => setHeightUnit('ftin')}
                      >
                        ft/in
                      </button>
                    </div>
                    {heightUnit === 'cm' ? (
                      <input
                        type="number"
                        value={height}
                        onChange={e => setHeight(e.target.value)}
                        className="w-full bg-black border border-blue-700 rounded-lg px-4 py-3 text-white text-lg"
                        placeholder="Enter your height in cm"
                      />
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={heightFt}
                          onChange={e => setHeightFt(e.target.value)}
                          className="w-1/2 bg-black border border-blue-700 rounded-lg px-4 py-3 text-white text-lg"
                          placeholder="Feet"
                        />
                        <input
                          type="number"
                          value={heightIn}
                          onChange={e => setHeightIn(e.target.value)}
                          className="w-1/2 bg-black border border-blue-700 rounded-lg px-4 py-3 text-white text-lg"
                          placeholder="Inches"
                        />
                      </div>
                    )}
                  </div>
                  {/* Weight Slider with Unit Toggle */}
                  <div>
                    <label className="block text-lg font-semibold mb-2">Weight</label>
                    <div className="flex gap-2 items-center mb-2">
                      <button
                        className={`px-4 py-1 rounded-full font-bold border-2 ${weightUnit === 'kg' ? 'bg-blue-600 text-white border-blue-600' : 'bg-black text-blue-400 border-blue-400'}`}
                        onClick={() => setWeightUnit('kg')}
                      >
                        kg
                      </button>
                      <button
                        className={`px-4 py-1 rounded-full font-bold border-2 ${weightUnit === 'lbs' ? 'bg-blue-600 text-white border-blue-600' : 'bg-black text-blue-400 border-blue-400'}`}
                        onClick={() => setWeightUnit('lbs')}
                      >
                        lbs
                      </button>
                    </div>
                    <input
                      type="range"
                      min={weightUnit === 'kg' ? 30 : 66}
                      max={weightUnit === 'kg' ? 200 : 440}
                      step={weightUnit === 'kg' ? 0.5 : 1}
                      value={weight}
                      onChange={e => setWeight(e.target.value)}
                      className="w-full accent-blue-600"
                    />
                    <div className="flex justify-between text-blue-300 text-sm mt-1">
                      <span>{weightUnit === 'kg' ? '30kg' : '66lbs'}</span>
                      <span>{weightUnit === 'kg' ? '200kg' : '440lbs'}</span>
                    </div>
                    <div className="text-blue-200 text-lg mt-2 font-bold text-center">
                      {weight} {weightUnit}
                    </div>
                  </div>
                  <button
                    onClick={async () => {
                      if (!session?.user?.id) {
                        setError('Session is invalid or missing user ID. Please sign out and sign in again.');
                        return;
                      }
                      // Validation
                      const heightCmVal = heightUnit === 'cm' ? Number(height) : convertFtInToCm(Number(heightFt), Number(heightIn));
                      const weightKgVal = weightUnit === 'kg' ? Number(weight) : convertLbsToKg(Number(weight));
                      const ageVal = birthDate ? dayjs().diff(dayjs(birthDate), 'year') : '';
                      let errorMsg = '';
                      if (!birthDate || isNaN(Number(ageVal)) || Number(ageVal) < 0 || Number(ageVal) > 120) errorMsg = 'Please enter a valid birth date.';
                      else if (heightUnit === 'cm' && (!height || isNaN(Number(height)) || Number(height) < 80 || Number(height) > 250)) errorMsg = 'Please enter a valid height.';
                      else if (heightUnit === 'ftin' && (!heightFt || heightIn === '' || isNaN(Number(heightFt)) || isNaN(Number(heightIn)) || Number(heightFt) < 2 || Number(heightFt) > 8 || Number(heightIn) < 0 || Number(heightIn) > 11)) errorMsg = 'Please enter a valid height in feet and inches.';
                      else if (!weight || isNaN(Number(weight)) || Number(weightKgVal) < 25 || Number(weightKgVal) > 300) errorMsg = 'Please enter a valid weight.';
                      if (errorMsg) {
                        setError(errorMsg);
                        return;
                      }
                      // Always recalculate BMI using metric units
                      const heightM = Number(heightCmVal) / 100;
                      let bmiValue = Number(weightKgVal) / (heightM * heightM);
                      if (!bmiValue || isNaN(bmiValue) || !isFinite(bmiValue)) {
                        setError('Could not calculate BMI. Please check your height and weight.');
                        return;
                      }
                      bmiValue = Number(bmiValue.toFixed(1));
                      setLoading(true);
                      setError('');
                      try {
                        await updateProfile.mutateAsync({
                          class: selectedClass,
                          sex,
                          age: Number(ageVal),
                          heightCm: Number(heightCmVal),
                          weightKg: Number(weightKgVal),
                          bmi: bmiValue,
                        });
                      } catch (err) {
                        let errMsg = 'Failed to update profile';
                        if (err instanceof Error && err.message) errMsg += ': ' + err.message;
                        errMsg += `\nclass: ${selectedClass}, sex: ${sex}, age: ${Number(ageVal)}, heightCm: ${Number(heightCmVal)}, weightKg: ${Number(weightKgVal)}, bmi: ${bmiValue}`;
                        setError(errMsg);
                        console.error('Update profile error:', err, {
                          class: selectedClass,
                          sex,
                          age: Number(ageVal),
                          heightCm: Number(heightCmVal),
                          weightKg: Number(weightKgVal),
                          bmi: bmiValue,
                        });
                      }
                      setLoading(false);
                    }}
                    disabled={loading || !session?.user?.id}
                    className="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl text-2xl font-bold disabled:opacity-50 shadow-lg"
                  >
                    {loading ? 'Saving...' : 'Finish'}
                  </button>
                  {error && (
                    <div className="mt-2 text-red-500 text-sm text-center">
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
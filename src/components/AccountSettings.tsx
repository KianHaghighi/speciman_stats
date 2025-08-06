import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { trpc } from '@/utils/trpc';

const classes = [
  { key: 'theTitan', label: 'The Titan', emoji: '💪' },
  { key: 'theBeast', label: 'The Beast', emoji: '🦍' },
  { key: 'bodyweightMaster', label: 'Bodyweight Master', emoji: '🧗' },
  { key: 'superAthlete', label: 'Super Athlete', emoji: '⚡' },
  { key: 'hunterGatherer', label: 'Hunter-Gatherer', emoji: '🏃' },
];

export default function AccountSettings() {
  const { data: session, update } = useSession();
  const [selectedClass, setSelectedClass] = useState(session?.user?.class || '');
  const [sex, setSex] = useState(session?.user?.sex || '');
  const [height, setHeight] = useState(session?.user?.heightCm || '');
  const [weight, setWeight] = useState(session?.user?.weightKg || '');
  const [age, setAge] = useState(session?.user?.age || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const updateProfile = trpc.user.updateProfile.useMutation();

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const heightNum = Number(height);
      const weightNum = Number(weight);
      const ageNum = Number(age);
      const bmi = heightNum && weightNum ? Number((weightNum / ((heightNum / 100) ** 2)).toFixed(1)) : 0;
      await updateProfile.mutateAsync({
        class: selectedClass,
        sex,
        age: ageNum,
        heightCm: heightNum,
        weightKg: weightNum,
        bmi,
      });
      await update();
    } catch {
      setError('Failed to update settings');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 bg-[#181828] rounded-xl max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Account Settings</h2>
      <div className="mb-4">
        <label className="block mb-1">Class</label>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full p-2 rounded">
          <option value="">Select Class</option>
          {classes.map(c => (
            <option key={c.key} value={c.key}>{c.emoji} {c.label}</option>
          ))}
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Sex</label>
        <select value={sex} onChange={e => setSex(e.target.value)} className="w-full p-2 rounded">
          <option value="">Select Sex</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1">Height (cm)</label>
        <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full p-2 rounded" />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Weight (kg)</label>
        <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full p-2 rounded" />
      </div>
      <div className="mb-4">
        <label className="block mb-1">Age</label>
        <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full p-2 rounded" />
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <button onClick={handleSave} disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded">
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
} 
import React, { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { motion, AnimatePresence } from 'framer-motion';

// Placeholder for SFX integration
function playSfx() {
  // TODO: Integrate with howler or other SFX library
}

interface AddMetricModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddMetricModal({ isOpen, onClose }: AddMetricModalProps) {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);

  const utils = trpc.useContext();
  const addMetric = trpc.metrics.create.useMutation({
    onSuccess: () => {
      utils.metrics.all.invalidate();
      setShowLevelUp(true);
      playSfx();
      setTimeout(() => {
        setShowLevelUp(false);
        onClose();
        setName('');
        setUnit('');
        setCategory('');
        setError('');
      }, 1800);
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) {
      setError('Please fill in all fields');
      return;
    }
    addMetric.mutate({ 
      name: name.trim(), 
      unit: unit.trim(),
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-lg p-6 w-full max-w-md relative"
            initial={{ rotateY: 0 }}
            animate={showLevelUp ? { rotateY: 180 } : { rotateY: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            style={{ perspective: 1000 }}
          >
            {!showLevelUp ? (
              <form onSubmit={handleSubmit}>
                <h2 className="text-xl font-bold mb-4">Add New Metric</h2>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Bench Press"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., kg"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border rounded"
                    placeholder="e.g., Strength"
                    required
                  />
                </div>
                {error && (
                  <div className="mb-4 text-red-500 text-sm">{error}</div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    disabled={addMetric.status === 'pending'}
                  >
                    {addMetric.status === 'pending' ? 'Adding...' : 'Add Metric'}
                  </button>
                </div>
              </form>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center h-48"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6 }}
              >
                <div className="text-4xl font-extrabold text-gradient bg-gradient-to-r from-indigo-500 to-violet-600 mb-2">Stat Level Up!</div>
                <motion.div
                  className="w-full h-4 bg-gray-200 rounded-full overflow-hidden mt-4"
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1 }}
                >
                  <motion.div
                    className="h-4 bg-gradient-to-r from-indigo-500 to-violet-600"
                    initial={{ x: '-100%' }}
                    animate={{ x: 0 }}
                    transition={{ duration: 1 }}
                  />
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 
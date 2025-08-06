import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/hooks/useUser';
import { trpc } from '@/utils/trpc';

interface Entry {
  id: string;
  user_id: string;
  metric_id: number;
  value: number;
  created_at: string;
  user: { 
    id: string;
    name: string | null;
    email: string | null;
    emailVerified: string | null;
    image: string | null;
    class: string | null;
    sex: string | null;
    age: number | null;
    heightCm: number | null;
    weightKg: number | null;
    bmi: number | null;
    elo?: number | null;
    tier: string | null;
  };
}

export default function MetricDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [newValue, setNewValue] = useState('');
  const utils = trpc.useContext();
  
  const { data: metric, isLoading: isLoadingMetric } = trpc.metrics.byId.useQuery(
    { id: Number(id) }
  );
  
  const { data: entries, isLoading: isLoadingEntries } = trpc.metrics.entries.useQuery(
    { metricId: Number(id) }
  );

  const addEntry = trpc.metrics.addEntry.useMutation({
    onSuccess: () => {
      setNewValue('');
      utils.metrics.entries.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue || !metric) return;
    
    addEntry.mutate({
      metricId: metric.id,
      value: parseFloat(newValue),
    });
  };

  if (isLoadingMetric || isLoadingEntries) {
    return <div className="p-4">Loading...</div>;
  }

  if (!metric) {
    return <div className="p-4">Metric not found</div>;
  }

  return (
    <main className="p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{metric.name}</h1>
          <p className="text-gray-600">Unit: {metric.unit}</p>
        </div>

        {user && (
          <form onSubmit={handleSubmit} className="mb-8 p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-4">Add New Entry</h2>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder={`Enter value in ${metric.unit}`}
                className="flex-1 p-2 border rounded"
                required
              />
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={addEntry.status === 'pending'}
              >
                {addEntry.status === 'pending' ? 'Adding...' : 'Add Entry'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded shadow">
          <h2 className="text-lg font-semibold p-4 border-b">Recent Entries</h2>
          <div className="divide-y">
            {entries?.map((entry: Entry) => (
              <div key={entry.id} className="p-4 flex justify-between items-center">
                <div>
                  <span className="font-medium">{entry.value} {metric.unit}</span>
                  <span className="text-gray-500 ml-2">by {entry.user.name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(entry.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
} 
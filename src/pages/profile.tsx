import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';

interface MetricEntry {
  id: string;
  value: number;
  created_at: string;
}

interface UserMetric {
  id: number;
  name: string;
  unit: string;
  entries: MetricEntry[];
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const router = useRouter();
  // const { data: userMetrics } = trpc.metrics.userMetrics.useQuery<UserMetric[]>(undefined, {
  //   enabled: !!session?.user?.id,
  // });
  const userMetrics: UserMetric[] = []; // Placeholder for now

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center text-white">
          <h1 className="text-2xl mb-4">Please sign in to view your profile</h1>
          <button
            onClick={() => router.push('/api/auth/signin')}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-gray-800 rounded-lg shadow-xl p-8 mb-8">
          <div className="flex items-center space-x-6">
            <motion.img
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              src={session.user?.image || ''}
              alt={session.user?.name || ''}
              className="w-24 h-24 rounded-full border-4 border-blue-500"
            />
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{session.user?.name}</h1>
              <p className="text-gray-400">Discord User</p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-6">Your Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {(userMetrics as UserMetric[] | undefined)?.map((metric, index) => (
            <motion.div
              key={metric.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800 rounded-lg p-6 shadow-lg"
            >
              <h3 className="text-xl font-semibold text-white mb-4">{metric.name}</h3>
              <div className="space-y-4">
                {metric.entries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex justify-between items-center bg-gray-700 rounded p-3"
                  >
                    <span className="text-gray-300">{new Date(entry.created_at).toLocaleDateString()}</span>
                    <span className="text-blue-400 font-semibold">
                      {entry.value} {metric.unit}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </main>
  );
} 
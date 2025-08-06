import { useState } from 'react';
import { trpc } from '@/utils/trpc';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

// Define a type for our metric for stronger type safety
interface Metric {
  id: number;
  name: string;
  unit: string;
  category: string;
}

// Mapping from class key to image filename base
const classImageMap: { [key: string]: string } = {
  'The Titan': 'class-titan',
  'The Beast': 'class-beast',
  'Bodyweight Master': 'class-bodyweight',
  'Super Athlete': 'class-superathlete',
  'Hunter-Gatherer': 'class-hunter',
};

export default function MetricsPage() {
  const router = useRouter();
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      router.push('/auth/signin');
    },
  });

  const { data: metrics, isLoading, error } = trpc.metrics.all.useQuery();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Explicitly type the metrics data and ensure categories are strings
  const typedMetrics: Metric[] = (metrics as Metric[]) || [];
  const categories: string[] = Array.from(new Set(typedMetrics.map((m) => m.category)));

  if (isLoading || !session) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-blue-800">Loading...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center bg-white text-red-500">Error: {error.message}</div>;
  }

  const filteredMetrics = selectedCategory ? typedMetrics.filter(m => m.category === selectedCategory) : typedMetrics;

  // Assuming user sex is available in the session for gendered images
  const userSex = session.user?.sex === 'F' ? 'f' : 'm';

  return (
    <div className="min-h-screen bg-white text-blue-900 font-sans">
      <header className="bg-blue-600 text-white p-8 shadow-lg">
        <h1 className="text-5xl font-extrabold text-center">Track Your Metrics</h1>
        <p className="text-center text-blue-100 mt-2 text-lg">Select a metric to view leaderboards and log your progress.</p>
      </header>

      <main className="p-4 md:p-8">
        {/* Category Filters with Images */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8 text-blue-800">Choose Your Arena</h2>
          <div className="flex justify-center flex-wrap gap-4 md:gap-8">
            {categories.map((category) => {
              const imageBase = classImageMap[category];
              const imageUrl = imageBase ? `/${imageBase}-${userSex}.png` : '/humanoid.svg';
              
              return (
                <motion.button
                  key={category}
                  onClick={() => setSelectedCategory(category === selectedCategory ? null : category)}
                  className={`p-4 rounded-3xl shadow-xl transition-all duration-300 w-40 h-40 md:w-56 md:h-56 flex flex-col items-center justify-end text-white font-bold bg-cover bg-center ${selectedCategory === category ? 'ring-8 ring-blue-500 transform scale-110' : 'ring-2 ring-transparent hover:ring-blue-400'}`}
                  style={{ backgroundImage: `linear-gradient(to top, rgba(29, 78, 216, 0.8), rgba(0,0,0,0.1)), url(${imageUrl})` }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span className="text-lg md:text-xl drop-shadow-lg">{category}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredMetrics?.map(metric => (
            <motion.div
              key={metric.id}
              className="bg-blue-50 rounded-2xl shadow-md hover:shadow-2xl transition-shadow duration-300 cursor-pointer overflow-hidden flex flex-col"
              onClick={() => router.push(`/metrics/${metric.id}`)}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="p-8 flex-grow">
                <h3 className="text-3xl font-extrabold text-blue-800">{metric.name}</h3>
                <p className="text-blue-500 mt-1">Unit: {metric.unit}</p>
              </div>
              <div className="bg-blue-500 text-white text-center py-4 px-8 text-xl font-bold">
                View Leaderboard &rarr;
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Button */}
        <div className="text-center mt-16">
            <button
              onClick={() => router.push('/metrics/create')}
              className="px-20 py-6 bg-blue-600 text-white text-3xl font-bold rounded-2xl shadow-lg hover:bg-blue-700 transition-all duration-200 transform hover:scale-105"
            >
              Create a New Metric
            </button>
        </div>
      </main>
    </div>
  );
} 
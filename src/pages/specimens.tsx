import { trpc } from '@/utils/trpc';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export default function SpecimensPage() {
  const { data: users, isLoading } = trpc.user.all.useQuery();
  const router = useRouter();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-2xl">Loading...</div>;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <h1 className="text-4xl font-extrabold text-center mb-12 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">Select a Specimen</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
        {users?.map((user: User, idx: number) => (
          <motion.div
            key={user.id}
            whileHover={{ scale: 1.07, boxShadow: '0 0 32px #60a5fa' }}
            whileTap={{ scale: 0.97 }}
            className="bg-gradient-to-br from-gray-800 to-gray-700 rounded-2xl p-6 flex flex-col items-center cursor-pointer border-2 border-transparent hover:border-blue-500 transition-all"
            onClick={() => router.push(`/specimen/${user.id}`)}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <img src={user.image || ''} alt={user.name || 'User'} className="w-24 h-24 rounded-full border-4 border-blue-500 mb-4 shadow-lg" />
            <div className="text-xl font-bold text-white mb-1">{user.name}</div>
            <div className="text-blue-400 text-sm">{user.email}</div>
          </motion.div>
        ))}
      </div>
    </main>
  );
} 
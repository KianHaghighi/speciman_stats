import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useDarkMode } from './_app';
// import { FaCog } from 'react-icons/fa'; // fallback if lucide not available

function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [master, setMaster] = useState(() => Number(localStorage.getItem('masterVolume')) || 80);
  const [sfx, setSfx] = useState(() => Number(localStorage.getItem('sfxVolume')) || 60);
  const { dark, toggle } = useDarkMode();

  const save = () => {
    localStorage.setItem('masterVolume', String(master));
    localStorage.setItem('sfxVolume', String(sfx));
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className={`fixed inset-0 ${dark ? 'bg-black/80' : 'bg-blue-100/80'} flex items-center justify-center z-50`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className={`rounded-xl p-8 w-96 shadow-xl ${dark ? 'bg-[#181828] text-white' : 'bg-white text-blue-900'}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
            <h2 className="text-2xl font-bold mb-4 text-accent-gradient">Settings</h2>
            <div className="mb-4">
              <label className="block mb-1">Master Volume</label>
              <input type="range" min={0} max={100} value={master} onChange={e => setMaster(Number(e.target.value))} className="w-full" />
              <span className="text-sm text-gray-400">{master}</span>
            </div>
            <div className="mb-4">
              <label className="block mb-1">SFX Volume</label>
              <input type="range" min={0} max={100} value={sfx} onChange={e => setSfx(Number(e.target.value))} className="w-full" />
              <span className="text-sm text-gray-400">{sfx}</span>
            </div>
            <div className="mb-4 flex items-center justify-between">
              <span className="font-semibold">Dark Mode</span>
              <button onClick={toggle} className={`px-4 py-2 rounded transition-all duration-200 ${dark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900 hover:bg-blue-200'}`}>{dark ? 'Disable' : 'Enable'}</button>
            </div>
            <button className="mt-4 w-full" onClick={save}>Save</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export { SettingsModal };

export default function AuthPage() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-white">Loading…</div>;
  }
  if (session) {
    router.replace('/dashboard');
    return null;
  }

  const handleSignIn = async () => {
    setError('');
    try {
      await signIn('discord');
    } catch {
      setError('Sign in failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0d0d0d]">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-extrabold text-accent-gradient">SPECIMENSTATS</h1>
        <button onClick={() => setSettingsOpen(true)} className="p-2 rounded-full bg-[#181828] hover:bg-[#23234a]">
          {/* <FaCog className="text-xl text-accent-gradient" /> */}
          <span role="img" aria-label="settings">⚙️</span>
        </button>
      </div>
      <div className="flex flex-col gap-4 w-80">
        <button onClick={handleSignIn}>Sign In with Discord</button>
      </div>
      {error && <div className="text-red-400 mt-4">{error}</div>}
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
} 
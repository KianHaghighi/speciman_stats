import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Bell, 
  Settings, 
  LogOut, 
  ChevronDown,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';
import { useUserPreferences } from '@/hooks/useUserPreferences';

export default function TopBarUser() {
  const { data: session } = useSession();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { preferences } = useUserPreferences();

  if (!session?.user) {
    return (
      <div className="flex items-center gap-4">
        <Link
          href="/auth/login"
          className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      {/* Notifications */}
      <Link
        href="/notifications"
        className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
        data-testid="nav-notifications"
      >
        <Bell className="w-5 h-5" />
        {/* TODO: Add notification count badge */}
      </Link>

      {/* User menu */}
      <div className="relative">
        <button
          onClick={() => setUserMenuOpen(!userMenuOpen)}
          className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          data-testid="user-menu-button"
        >
          <div className="flex items-center gap-2">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <UserCircle className="w-8 h-8 text-gray-400" />
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900">
                {session.user.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {session.user.email}
              </p>
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
            userMenuOpen ? 'rotate-180' : ''
          }`} />
        </button>

        <AnimatePresence>
          {userMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            >
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">
                  {session.user.name || 'User'}
                </p>
                <p className="text-sm text-gray-500">
                  {session.user.email}
                </p>
              </div>
              
              <div className="py-1">
                <Link
                  href="/profile"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <User className="w-4 h-4" />
                  Profile
                </Link>
                
                <Link
                  href="/settings"
                  className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
              
              <div className="border-t border-gray-100 py-1">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut({ callbackUrl: '/auth/login' });
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

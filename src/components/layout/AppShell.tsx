import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  X, 
  Home, 
  Target, 
  Trophy, 
  MapPin, 
  BarChart3, 
  Users, 
  Bell, 
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import TopBarUser from './TopBarUser';
import { useUserPreferences } from '@/hooks/useUserPreferences';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, testId: 'nav-dashboard' },
  { name: 'My Specimen', href: '/specimen/me', icon: Target, testId: 'nav-specimen' },
  { name: 'Leaderboards', href: '/leaderboards', icon: Trophy, testId: 'nav-leaderboards' },
  { name: 'Map', href: '/map', icon: MapPin, testId: 'nav-map' },
  { name: 'Metrics', href: '/metrics/log', icon: BarChart3, testId: 'nav-metrics' },
  { name: 'Friends', href: '/friends', icon: Users, testId: 'nav-friends' },
  { name: 'Notifications', href: '/notifications', icon: Bell, testId: 'nav-notifications' },
  { name: 'Settings', href: '/settings', icon: Settings, testId: 'nav-settings' },
];

export default function AppShell({ children, title }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const router = useRouter();
  const { preferences } = useUserPreferences();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.asPath]);

  const currentPath = router.asPath;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ 
          width: sidebarCollapsed ? '4rem' : '16rem',
          x: sidebarOpen ? 0 : '-100%'
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-xl lg:translate-x-0"
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200">
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xl font-bold text-blue-600"
            >
              SPECIMENSTATS
            </motion.div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 transition-colors"
              data-testid="sidebar-toggle"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navigation.map((item) => {
            const isActive = currentPath === item.href || 
                           (item.href !== '/dashboard' && currentPath.startsWith(item.href));
            
            return (
              <motion.a
                key={item.name}
                href={item.href}
                data-testid={item.testId}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }
                `}
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.95 }}
              >
                <item.icon className={`
                  mr-3 h-5 w-5 flex-shrink-0
                  ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'}
                `} />
                {!sidebarCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="truncate"
                  >
                    {item.name}
                  </motion.span>
                )}
              </motion.a>
            );
          })}
        </nav>
      </motion.div>

      {/* Main content */}
      <div className={`
        transition-all duration-300 ease-in-out
        ${sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'}
      `}>
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                data-testid="mobile-menu-button"
              >
                <Menu className="w-5 h-5" />
              </button>
              {title && (
                <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              )}
            </div>
            <TopBarUser />
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

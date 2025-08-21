import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { 
  Home, 
  BarChart3, 
  Trophy, 
  Target,
  MapPin,
  Users
} from 'lucide-react';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/metrics', icon: BarChart3, label: 'Metrics' },
  { href: '/leaderboards', icon: Trophy, label: 'Leaderboards' },
  { href: '/friends', icon: Users, label: 'Friends' },
  { href: '/my-specimen', icon: Target, label: 'Specimen' },
  { href: '/map', icon: MapPin, label: 'Map' },
];

export default function BottomNav() {
  const router = useRouter();

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
    >
      <div className="max-w-md mx-auto px-4">
        <div className="flex justify-around items-center py-3">
          {navItems.map(({ href, icon: Icon, label }) => {
            const isActive = router.pathname === href;
            
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="relative"
                >
                  <Icon
                    size={20}
                    className={`${
                      isActive 
                        ? 'text-blue-600' 
                        : 'text-gray-500'
                    } transition-colors`}
                  />
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </motion.div>
                <span
                  className={`text-xs font-medium ${
                    isActive 
                      ? 'text-blue-600' 
                      : 'text-gray-500'
                  } transition-colors`}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

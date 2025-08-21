import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Navbar } from './Navbar';
import BottomNav from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export default function AppShell({ children, showBottomNav = true, className = '' }: AppShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Navbar />
      
      <motion.main
        key={router.asPath}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`pb-20 ${className}`}
      >
        {children}
      </motion.main>

      {showBottomNav && <BottomNav />}
    </div>
  );
}

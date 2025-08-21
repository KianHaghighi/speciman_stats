import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/utils/cn';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({ className = '', width, height }: SkeletonProps) {
  return (
    <motion.div
      className={`bg-gray-200 rounded animate-pulse ${className}`}
      style={{ width, height }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    />
  );
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-200 p-6", className)}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
        <div className="space-y-2">
          <div className="w-full h-4 bg-gray-200 rounded"></div>
          <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
          <div className="w-1/2 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: SkeletonProps) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-200 p-6", className)}>
      <div className="animate-pulse space-y-4">
        <div className="flex items-center justify-between">
          <div className="w-32 h-6 bg-gray-200 rounded"></div>
          <div className="w-48 h-8 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="w-full h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

export function SkeletonList({ className, items = 5 }: SkeletonProps & { items?: number }) {
  return (
    <div className={cn("bg-white rounded-2xl shadow-sm border border-gray-200 p-6", className)}>
      <div className="animate-pulse space-y-4">
        <div className="w-32 h-6 bg-gray-200 rounded"></div>
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="w-48 h-4 bg-gray-200 rounded"></div>
              <div className="w-32 h-3 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonGrid({ className, cols = 3, rows = 2 }: SkeletonProps & { cols?: number; rows?: number }) {
  return (
    <div className={cn("grid", `grid-cols-1 md:grid-cols-${cols}`, "gap-6", className)}>
      {Array.from({ length: cols * rows }).map((_, i) => (
        <div key={i} className="h-40 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-8 bg-gray-200 rounded mb-1"></div>
            <div className="w-32 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonMetric() {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-8 w-20 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

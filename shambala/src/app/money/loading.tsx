'use client';

import { SkeletonCard, SkeletonLine } from '@/components/Skeletons';

export default function MoneyLoading() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <SkeletonLine width="w-40" height="h-7" />
        <div className="flex gap-2">
          <div className="w-24 h-8 bg-bg-elevated rounded-full animate-pulse-subtle" />
          <div className="w-24 h-8 bg-bg-elevated rounded-full animate-pulse-subtle" />
        </div>
      </div>

      {/* Total balance */}
      <SkeletonCard height="h-24" />

      {/* Accounts */}
      <div className="mt-4 space-y-2">
        <SkeletonLine width="w-20" height="h-3" />
        {[...Array(3)].map((_, i) => (
          <SkeletonCard key={i} height="h-[72px]" />
        ))}
      </div>

      {/* Recent */}
      <div className="mt-6 space-y-2">
        <SkeletonLine width="w-32" height="h-3" />
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} height="h-[72px]" />
        ))}
      </div>
    </div>
  );
}

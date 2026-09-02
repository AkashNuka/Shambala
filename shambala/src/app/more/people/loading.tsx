'use client';

import { SkeletonCard, SkeletonLine } from '@/components/Skeletons';

export default function PeopleLoading() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto animate-fade-in">
      <div className="flex items-center justify-between mb-5">
        <SkeletonLine width="w-44" height="h-7" />
        <div className="w-10 h-10 bg-bg-elevated rounded-xl animate-pulse-subtle" />
      </div>

      {/* Search */}
      <div className="h-12 bg-bg-card border border-border rounded-xl mb-4 animate-pulse-subtle" />

      {/* List */}
      <div className="space-y-2">
        {[...Array(8)].map((_, i) => (
          <SkeletonCard key={i} height="h-[64px]" />
        ))}
      </div>
    </div>
  );
}

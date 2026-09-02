'use client';

/**
 * Reusable skeleton primitives for loading states.
 * Used by all loading.tsx files across the app.
 */

export function SkeletonLine({ width = 'w-full', height = 'h-4' }: { width?: string; height?: string }) {
  return <div className={`${width} ${height} bg-bg-elevated rounded-lg animate-pulse-subtle`} />;
}

export function SkeletonCard({ height = 'h-20' }: { height?: string }) {
  return (
    <div className={`bg-bg-card border border-border rounded-2xl p-4 ${height} animate-pulse-subtle`} />
  );
}

export function SkeletonFormPage() {
  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto animate-fade-in">
      {/* Back button + title */}
      <div className="flex items-center mb-6 gap-3">
        <div className="w-8 h-8 bg-bg-elevated rounded-lg animate-pulse-subtle" />
        <SkeletonLine width="w-48" height="h-7" />
      </div>

      {/* Form card */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-4 mb-4">
        <SkeletonLine width="w-24" height="h-3" />
        <SkeletonCard height="h-12" />
        <SkeletonLine width="w-20" height="h-3" />
        <SkeletonCard height="h-12" />
        <SkeletonLine width="w-28" height="h-3" />
        <SkeletonCard height="h-12" />
      </div>

      {/* Second card */}
      <div className="bg-bg-card border border-border rounded-2xl p-5 space-y-4 mb-4">
        <SkeletonLine width="w-32" height="h-3" />
        <SkeletonCard height="h-12" />
        <SkeletonLine width="w-24" height="h-3" />
        <SkeletonCard height="h-12" />
      </div>

      {/* Submit button */}
      <div className="h-14 bg-bg-elevated rounded-2xl animate-pulse-subtle mt-4" />
    </div>
  );
}

export function SkeletonListPage() {
  return (
    <main className="p-4 max-w-lg mx-auto pb-24 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <SkeletonLine width="w-40" height="h-7" />
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <SkeletonCard key={i} height="h-[72px]" />
        ))}
      </div>
    </main>
  );
}

export function SkeletonHomePage() {
  return (
    <div className="px-4 pt-6 max-w-lg mx-auto pb-24 animate-fade-in">
      {/* Greeting */}
      <div className="mb-6">
        <SkeletonLine width="w-40" height="h-7" />
        <div className="mt-2">
          <SkeletonLine width="w-24" height="h-4" />
        </div>
      </div>

      {/* Balance cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <SkeletonCard height="h-20" />
        <SkeletonCard height="h-20" />
      </div>

      {/* Month spent */}
      <SkeletonCard height="h-20" />

      {/* Quick entry */}
      <div className="mt-6 mb-4">
        <SkeletonLine width="w-24" height="h-3" />
        <div className="grid grid-cols-2 gap-3 mt-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonCard key={i} height="h-24" />
          ))}
        </div>
      </div>
    </div>
  );
}

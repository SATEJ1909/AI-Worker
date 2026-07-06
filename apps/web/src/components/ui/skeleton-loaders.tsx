'use client';

/**
 * Reusable skeleton loading components for the dashboard.
 * Uses the CSS shimmer animation defined in globals.css.
 */

export function SkeletonLine({ className = '' }: { className?: string }) {
  return <div className={`skeleton h-4 ${className}`} />;
}

export function SkeletonCircle({ className = '' }: { className?: string }) {
  return <div className={`skeleton rounded-full ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="skeleton w-10 h-10 rounded-lg" />
        <div className="skeleton w-16 h-5 rounded-full" />
      </div>
      <div className="skeleton h-7 w-16 mb-2" />
      <div className="skeleton h-4 w-32" />
    </div>
  );
}

export function ConversationListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 flex items-center gap-4">
          <div className="skeleton w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-3/4" />
            <div className="skeleton h-3 w-1/2" />
          </div>
          <div className="skeleton h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function CardGridSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="skeleton w-12 h-12 rounded-xl" />
            <div className="skeleton w-20 h-5 rounded-full" />
          </div>
          <div className="skeleton h-5 w-24 mb-2" />
          <div className="skeleton h-4 w-full mb-1" />
          <div className="skeleton h-4 w-2/3 mb-6" />
          <div className="skeleton h-9 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2">
      <div className="skeleton h-8 w-48" />
      <div className="skeleton h-4 w-72" />
    </div>
  );
}

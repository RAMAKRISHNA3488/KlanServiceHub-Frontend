import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ReportsAnalyticsSkeleton = () => {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 select-none animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-neutral-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-72 rounded-lg" />
            <Skeleton className="h-4 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-96 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>

      {/* Filter Bar Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* High-Level Overview KPIs (5 Cards) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 rounded" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-7 w-16 rounded" />
            <Skeleton className="h-2.5 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Tabs Row */}
      <div className="flex gap-2 border-b border-neutral-200 pb-1">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-md" />
        ))}
      </div>

      {/* 2x2 Dashboard Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-2xs min-h-[300px]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <Skeleton className="h-4 w-36 rounded" />
              <Skeleton className="h-6 w-20 rounded-lg" />
            </div>
            <div className="space-y-3 pt-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-5/6 rounded" />
              <Skeleton className="h-40 w-full rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

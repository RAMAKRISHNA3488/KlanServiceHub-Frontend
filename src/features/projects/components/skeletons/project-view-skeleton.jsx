import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const ProjectViewSkeleton = () => {
  return (
    <div className="flex flex-col gap-y-4 select-none animate-in fade-in duration-150">
      {/* Project Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-48 rounded-lg" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-3 w-64 rounded" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-1.5 shadow-2xs">
            <Skeleton className="h-2.5 w-16 rounded" />
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-2 w-20 rounded" />
          </div>
        ))}
      </div>

      {/* Task View Switcher Tabs & Filters */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 rounded-md" />
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
          <Skeleton className="h-7 w-32 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-7 w-28 rounded-lg" />
        </div>

        {/* Board Column Placeholder */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl bg-neutral-50/80 p-3 space-y-3 border border-neutral-100 min-h-[300px]">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-24 rounded" />
                <Skeleton className="size-4 rounded-full" />
              </div>
              {[...Array(2)].map((_, j) => (
                <div key={j} className="rounded-lg bg-white p-3 space-y-2 border border-neutral-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-3 w-12 rounded" />
                    <Skeleton className="h-3 w-8 rounded" />
                  </div>
                  <Skeleton className="h-3.5 w-full rounded" />
                  <Skeleton className="h-3.5 w-2/3 rounded" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const WorkspaceDashboardSkeleton = () => {
  return (
    <div className="flex h-full flex-col space-y-5 select-none animate-in fade-in duration-150">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-56 rounded-lg" />
            <Skeleton className="h-4 w-12 rounded-full" />
          </div>
          <Skeleton className="h-3 w-80 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-32 rounded-lg" />
        </div>
      </div>

      {/* 5 Analytics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-3.5 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16 rounded" />
              <Skeleton className="size-4 rounded-full" />
            </div>
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-2.5 w-24 rounded" />
          </div>
        ))}
      </div>

      {/* Grid: Projects (Left) and Tasks (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Projects Card Skeleton */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 p-3 space-y-2 bg-neutral-50/50">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="size-8 rounded-lg" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-3 w-3/4 rounded" />
                    <Skeleton className="h-2.5 w-1/2 rounded" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <Skeleton className="h-2 w-16 rounded" />
                  <Skeleton className="h-2 w-10 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Members Card Skeleton */}
        <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3.5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div className="flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-28 rounded" />
            </div>
            <Skeleton className="h-7 w-20 rounded-lg" />
          </div>

          <div className="space-y-2.5">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50/50 border border-neutral-100">
                <div className="flex items-center gap-3">
                  <Skeleton className="size-8 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-32 rounded" />
                    <Skeleton className="h-2.5 w-44 rounded" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Tasks List Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3.5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <div className="flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-32 rounded" />
          </div>
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>

        <div className="divide-y divide-neutral-100">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <Skeleton className="h-4 w-16 rounded font-mono" />
                <Skeleton className="h-4 w-12 rounded" />
                <Skeleton className="h-4 flex-1 max-w-sm rounded" />
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <Skeleton className="h-3 w-20 rounded hidden sm:block" />
                <Skeleton className="size-6 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CfdSkeleton = () => {
  return (
    <div className="space-y-6 select-none animate-in fade-in duration-150">
      {/* Header & Filter Toolbar Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="size-5 rounded" />
              <Skeleton className="h-5 w-56 rounded-lg" />
              <Skeleton className="h-4 w-24 rounded-full" />
            </div>
            <Skeleton className="h-3 w-80 max-w-full rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-6 w-20 rounded" />
          </div>
        </div>

        {/* Filter Pills */}
        <div className="pt-2.5 border-t border-neutral-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
            <Skeleton className="h-6 w-16 rounded" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-24 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </div>
      </div>

      {/* 7 Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="rounded-xl border border-neutral-200 bg-white p-3 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="size-3.5 rounded" />
            </div>
            <Skeleton className="h-6 w-12 rounded" />
            <Skeleton className="h-2 w-16 rounded" />
          </div>
        ))}
      </div>

      {/* Interactive Stacked Area Chart Canvas Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-2xs">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 rounded" />
          <div className="flex gap-1.5">
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
          </div>
        </div>

        {/* Status Legend Buttons */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-6 w-24 rounded-lg" />
          ))}
        </div>

        {/* Simulated Area Chart Lines */}
        <div className="rounded-xl bg-neutral-50/70 p-4 border border-neutral-100 h-[380px] flex flex-col justify-between">
          <div className="flex justify-between border-b border-neutral-200/60 pb-2">
            <Skeleton className="h-2 w-8 rounded" />
            <Skeleton className="h-2 w-full max-w-2xl rounded mx-4" />
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 pb-2">
            <Skeleton className="h-2 w-8 rounded" />
            <Skeleton className="h-2 w-full max-w-2xl rounded mx-4" />
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 pb-2">
            <Skeleton className="h-2 w-8 rounded" />
            <Skeleton className="h-2 w-full max-w-2xl rounded mx-4" />
          </div>
          <div className="flex justify-between border-b border-neutral-200/60 pb-2">
            <Skeleton className="h-2 w-8 rounded" />
            <Skeleton className="h-2 w-full max-w-2xl rounded mx-4" />
          </div>
          <div className="flex justify-between pt-2">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="h-2.5 w-12 rounded" />
            ))}
          </div>
        </div>
      </div>

      {/* Bottlenecks Card Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-2xs">
        <Skeleton className="h-5 w-64 rounded" />
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 p-3 space-y-2 bg-neutral-50/50">
              <Skeleton className="h-4 w-24 rounded" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

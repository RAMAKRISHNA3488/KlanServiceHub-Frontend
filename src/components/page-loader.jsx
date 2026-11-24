import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const PageLoader = () => {
  return (
    <div className="h-screen flex flex-col bg-[#F4F5F7] overflow-hidden select-none">
      {/* Top Navbar Skeleton */}
      <header className="h-12 border-b border-neutral-200/90 bg-white px-4 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-4">
          <Skeleton className="h-7 w-28 rounded-lg" />
          <Skeleton className="h-6 w-36 rounded-md hidden md:block" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-48 rounded-lg hidden sm:block" />
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="size-8 rounded-full" />
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Sidebar Skeleton */}
        <aside className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-neutral-200/90 bg-white p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-8 rounded-lg" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-3/4 rounded" />
              <Skeleton className="h-2 w-1/2 rounded" />
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-2 rounded-lg">
                <Skeleton className="size-4 rounded" />
                <Skeleton className="h-3 flex-1 rounded" />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-2">
            <Skeleton className="h-3 w-1/3 rounded mb-2" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2.5 p-1.5 rounded-lg">
                <Skeleton className="size-3.5 rounded" />
                <Skeleton className="h-2.5 flex-1 rounded" />
              </div>
            ))}
          </div>
        </aside>

        {/* Main Canvas Viewport Skeleton */}
        <div className="flex-1 min-w-0 flex flex-col h-full overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6 max-w-[1400px] w-full mx-auto">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
            <div className="space-y-1.5">
              <Skeleton className="h-6 w-64 rounded-lg" />
              <Skeleton className="h-3.5 w-96 max-w-full rounded" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
          </div>

          {/* 4 Analytics Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="size-4 rounded-full" />
                </div>
                <Skeleton className="h-7 w-16 rounded" />
                <Skeleton className="h-2.5 w-28 rounded" />
              </div>
            ))}
          </div>

          {/* Main Board / Table Area Card */}
          <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4 shadow-2xs flex-1 min-h-[360px]">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <Skeleton className="h-5 w-40 rounded" />
              <Skeleton className="h-7 w-32 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {[...Array(3)].map((_, colIdx) => (
                <div key={colIdx} className="rounded-xl bg-neutral-50/80 p-3.5 space-y-3 border border-neutral-100">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="size-4 rounded-full" />
                  </div>
                  {[...Array(3)].map((_, cardIdx) => (
                    <div key={cardIdx} className="rounded-lg bg-white p-3 space-y-2 border border-neutral-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-14 rounded" />
                        <Skeleton className="h-3 w-10 rounded" />
                      </div>
                      <Skeleton className="h-3.5 w-full rounded" />
                      <Skeleton className="h-3.5 w-3/4 rounded" />
                      <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                        <Skeleton className="size-5 rounded-full" />
                        <Skeleton className="h-2.5 w-16 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageLoader;

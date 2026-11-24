import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const AdminTableSkeleton = ({ title = 'Administration', subtitle = 'Manage organization resources' }) => {
  return (
    <div className="space-y-5 select-none animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-neutral-900">{title}</h2>
          <p className="text-xs text-neutral-500">{subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-lg" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
      </div>

      {/* Search & Actions Bar */}
      <div className="rounded-xl border border-neutral-200 bg-white p-3.5 flex items-center justify-between gap-3 shadow-2xs">
        <Skeleton className="h-8 w-64 rounded-lg" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-20 rounded-lg" />
        </div>
      </div>

      {/* Table Container Skeleton */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-2xs">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-neutral-50/80 border-b border-neutral-200">
          <div className="col-span-4">
            <Skeleton className="h-3 w-20 rounded" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="col-span-3">
            <Skeleton className="h-3 w-16 rounded" />
          </div>
          <div className="col-span-2 text-right">
            <Skeleton className="h-3 w-12 rounded ml-auto" />
          </div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-neutral-100">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center">
              <div className="col-span-4 flex items-center gap-3">
                <Skeleton className="size-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-3 w-32 rounded" />
                  <Skeleton className="h-2 w-40 rounded" />
                </div>
              </div>
              <div className="col-span-3">
                <Skeleton className="h-4 w-24 rounded" />
              </div>
              <div className="col-span-3">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="col-span-2 flex justify-end gap-1.5">
                <Skeleton className="size-7 rounded-lg" />
                <Skeleton className="size-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const TaskTableSkeleton = () => {
  return (
    <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-2xs overflow-hidden select-none animate-in fade-in duration-150">
      {/* Table Header */}
      <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-neutral-50/80 border-b border-neutral-200 text-xs font-bold text-neutral-500">
        <div className="col-span-2">
          <Skeleton className="h-3 w-14 rounded" />
        </div>
        <div className="col-span-4">
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <div className="col-span-2">
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="col-span-2">
          <Skeleton className="h-3 w-16 rounded" />
        </div>
        <div className="col-span-1">
          <Skeleton className="h-3 w-12 rounded" />
        </div>
        <div className="col-span-1 text-right">
          <Skeleton className="h-3 w-8 rounded ml-auto" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-neutral-100">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="grid grid-cols-12 gap-3 px-4 py-3.5 items-center hover:bg-neutral-50/50">
            {/* Key & Icon */}
            <div className="col-span-2 flex items-center gap-2">
              <Skeleton className="size-3.5 rounded" />
              <Skeleton className="h-3.5 w-16 rounded font-mono" />
            </div>

            {/* Task Name */}
            <div className="col-span-4">
              <Skeleton className="h-3.5 w-4/5 rounded" />
            </div>

            {/* Assignee */}
            <div className="col-span-2 flex items-center gap-2">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-3 w-20 rounded" />
            </div>

            {/* Status */}
            <div className="col-span-2">
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Priority */}
            <div className="col-span-1">
              <Skeleton className="h-4 w-14 rounded" />
            </div>

            {/* Actions */}
            <div className="col-span-1 flex justify-end">
              <Skeleton className="size-5 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

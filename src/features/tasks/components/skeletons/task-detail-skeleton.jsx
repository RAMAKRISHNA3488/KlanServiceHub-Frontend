import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const TaskDetailSkeleton = ({ isModal = false }) => {
  return (
    <div
      className={`w-full bg-white select-none animate-in fade-in duration-150 ${
        isModal ? 'max-h-[85vh] overflow-y-auto' : ''
      }`}
    >
      {/* Top Header / Breadcrumb */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Skeleton className="size-4 rounded" />
          <Skeleton className="h-3.5 w-20 rounded font-mono" />
          <span className="text-neutral-300">/</span>
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
      </div>

      {/* Main Dual-Pane Body */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-5">
        {/* Left Primary Pane (Work Area, 66%) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Issue Title Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-7 w-4/5 rounded-lg" />
            <Skeleton className="h-7 w-1/2 rounded-lg" />
          </div>

          {/* Description Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-3 w-16 rounded" />
            </div>
            <div className="rounded-xl border border-neutral-200 bg-neutral-50/40 p-4 space-y-2.5">
              <Skeleton className="h-3.5 w-full rounded" />
              <Skeleton className="h-3.5 w-11/12 rounded" />
              <Skeleton className="h-3.5 w-4/5 rounded" />
              <Skeleton className="h-3.5 w-2/3 rounded" />
            </div>
          </div>

          {/* Attached Images Section */}
          <div className="space-y-2.5">
            <Skeleton className="h-4 w-32 rounded" />
            <div className="flex gap-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="size-20 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Subtasks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-6 w-24 rounded-lg" />
            </div>
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg border border-neutral-100 bg-neutral-50/40">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-3 flex-1 rounded" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Comments Stream */}
          <div className="space-y-3 pt-3 border-t border-neutral-100">
            <Skeleton className="h-4 w-28 rounded" />
            <div className="rounded-xl border border-neutral-200 p-3 space-y-3">
              <Skeleton className="h-16 w-full rounded-lg" />
              <div className="flex justify-end">
                <Skeleton className="h-7 w-20 rounded-lg" />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-neutral-50/60">
                  <Skeleton className="size-7 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-28 rounded" />
                      <Skeleton className="h-2 w-16 rounded" />
                    </div>
                    <Skeleton className="h-3 w-full rounded" />
                    <Skeleton className="h-3 w-3/4 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Metadata Sidebar Pane (33%) */}
        <div className="lg:col-span-1 rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-5 h-fit">
          <Skeleton className="h-4 w-24 rounded mb-2" />

          {/* Status field */}
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-12 rounded" />
            <Skeleton className="h-8 w-full rounded-lg" />
          </div>

          {/* Assignee field */}
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-14 rounded" />
            <div className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 bg-white">
              <Skeleton className="size-6 rounded-full" />
              <Skeleton className="h-3 flex-1 rounded" />
            </div>
          </div>

          {/* Priority field */}
          <div className="space-y-1.5">
            <Skeleton className="h-2.5 w-12 rounded" />
            <Skeleton className="h-7 w-28 rounded-lg" />
          </div>

          {/* Sprint & Story Points */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-200/80">
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-12 rounded" />
              <Skeleton className="h-6 w-full rounded" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-2.5 w-16 rounded" />
              <Skeleton className="h-6 w-full rounded" />
            </div>
          </div>

          {/* Timestamps */}
          <div className="space-y-2 pt-3 border-t border-neutral-200/80">
            <div className="flex justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-2.5 w-14 rounded" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

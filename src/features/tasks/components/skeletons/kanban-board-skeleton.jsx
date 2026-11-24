import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const KanbanBoardSkeleton = () => {
  const columns = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];

  return (
    <div className="w-full overflow-x-auto custom-scrollbar pb-4 select-none animate-in fade-in duration-150">
      <div className="flex gap-4 min-w-[1000px]">
        {columns.map((colName, colIdx) => (
          <div
            key={colIdx}
            className="flex-1 min-w-[240px] max-w-[320px] rounded-xl bg-neutral-100/70 p-3 flex flex-col gap-3 border border-neutral-200/60"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Skeleton className="size-2.5 rounded-full" />
                <span className="text-xs font-bold text-neutral-600">{colName}</span>
              </div>
              <Skeleton className="h-4 w-6 rounded-full" />
            </div>

            {/* Simulated Column Overload Indicator Line */}
            <div className="h-1 w-full rounded-full bg-neutral-200" />

            {/* Column Task Cards Skeletons */}
            <div className="flex flex-col gap-2.5 flex-1 min-h-[350px]">
              {[...Array(colIdx === 2 ? 3 : 2)].map((_, cardIdx) => (
                <div
                  key={cardIdx}
                  className="rounded-xl border border-neutral-200/90 bg-white p-3.5 shadow-2xs space-y-2.5"
                >
                  {/* Card Header: Type Icon, Key, Priority */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="size-3.5 rounded" />
                      <Skeleton className="h-3 w-14 rounded font-mono" />
                    </div>
                    <Skeleton className="h-3.5 w-12 rounded" />
                  </div>

                  {/* Card Title */}
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-full rounded" />
                    <Skeleton className="h-3.5 w-3/4 rounded" />
                  </div>

                  {/* Tags / Subtask progress */}
                  <div className="flex items-center gap-2 pt-1">
                    <Skeleton className="h-3 w-16 rounded" />
                    <Skeleton className="h-3 w-10 rounded" />
                  </div>

                  {/* Card Footer: Assignee & Story Points & Due Date */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="size-5 rounded-full" />
                      <Skeleton className="h-2.5 w-14 rounded" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Skeleton className="h-4 w-5 rounded" />
                      <Skeleton className="h-4 w-12 rounded" />
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Card Skeleton Button */}
              <div className="border border-dashed border-neutral-300/80 rounded-lg h-9 flex items-center justify-center">
                <Skeleton className="h-3 w-20 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

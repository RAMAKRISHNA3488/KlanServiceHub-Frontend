import React from 'react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { AnalyticsCard } from './analytics-card';
import { DottedSeparator } from './dotted-separator';

export const Analytics = ({ data }) => {
  const safeData = data || {};
  const taskCount = safeData.taskCount ?? 0;
  const taskDiff = safeData.taskDifference ?? 0;
  const assignedCount = safeData.assignedTaskCount ?? 0;
  const assignedDiff = safeData.assignedTaskDifference ?? 0;
  const completedCount = safeData.completedTaskCount ?? 0;
  const completedDiff = safeData.completedTaskDifference ?? 0;
  const overdueCount = safeData.overdueTaskCount ?? 0;
  const overdueDiff = safeData.overdueTaskDifference ?? 0;
  const incompleteCount = safeData.incompleteTaskCount ?? (safeData.incompletedTaskCount ?? 0);
  const incompleteDiff = safeData.incompleteTaskDifference ?? (safeData.incompletedTaskDifference ?? 0);

  return (
    <ScrollArea className="w-full shrink-0 whitespace-nowrap rounded-2xl border border-neutral-200/80 bg-white shadow-xs">
      <div className="flex w-full flex-row">
        <div className="flex flex-1 items-center">
          <AnalyticsCard
            title="Total tasks"
            value={taskCount}
            variant={taskDiff >= 0 ? 'up' : 'down'}
            increaseValue={Math.abs(taskDiff)}
          />
          <DottedSeparator direction="vertical" />
        </div>

        <div className="flex flex-1 items-center">
          <AnalyticsCard
            title="Assigned tasks"
            value={assignedCount}
            variant={assignedDiff >= 0 ? 'up' : 'down'}
            increaseValue={Math.abs(assignedDiff)}
          />
          <DottedSeparator direction="vertical" />
        </div>

        <div className="flex flex-1 items-center">
          <AnalyticsCard
            title="Completed tasks"
            value={completedCount}
            variant={completedDiff >= 0 ? 'up' : 'down'}
            increaseValue={Math.abs(completedDiff)}
          />
          <DottedSeparator direction="vertical" />
        </div>

        <div className="flex flex-1 items-center">
          <AnalyticsCard
            title="Overdue tasks"
            value={overdueCount}
            variant={overdueDiff <= 0 ? 'up' : 'down'}
            increaseValue={Math.abs(overdueDiff)}
          />
          <DottedSeparator direction="vertical" />
        </div>

        <div className="flex flex-1 items-center">
          <AnalyticsCard
            title="Incomplete tasks"
            value={incompleteCount}
            variant={incompleteDiff <= 0 ? 'up' : 'down'}
            increaseValue={Math.abs(incompleteDiff)}
          />
        </div>
      </div>

      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
};

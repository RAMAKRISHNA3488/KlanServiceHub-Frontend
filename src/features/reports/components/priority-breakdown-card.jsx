import React from 'react';
import { PriorityAxisChart } from './charts/priority-axis-chart';
import { AlertCircle, Clock, ChevronRight, ShieldAlert } from 'lucide-react';

export const PriorityBreakdownCard = ({ priorityData, loading = false, onDrillDown, onManagePriorities }) => {
  const { total = 0, breakdown = [], highestUnresolved = 0, highOverdue = 0 } = priorityData || {};

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4 h-[340px]">
        <div className="h-4 w-36 bg-neutral-200 rounded" />
        <div className="h-3 w-64 bg-neutral-100 rounded" />
        <div className="h-44 bg-neutral-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[340px] transition-all hover:shadow-sm">
      {/* Card Header matching screenshot 1 */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Priority breakdown</h3>
          {total > 0 && (
            <span className="text-[11px] font-semibold text-neutral-400">
              {total} items prioritized
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          Get a holistic view of how work is being prioritized.{' '}
          <button
            onClick={onManagePriorities}
            className="text-blue-600 hover:underline font-medium focus:outline-hidden"
          >
            How to manage priorities for projects
          </button>
        </p>
      </div>

      {/* Center Chart (matching axis styling in screenshot 1) */}
      <div className="my-auto py-2">
        <PriorityAxisChart
          data={breakdown}
          total={total}
          onPriorityClick={(p) =>
            onDrillDown &&
            onDrillDown({
              priority: p.priority.toUpperCase(),
              title: `${p.priority} Priority Work Items`,
            })
          }
        />
      </div>

      {/* Bottom Insights Banner: Highest unresolved & high overdue */}
      <div className="pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2 text-xs">
        <div
          onClick={() =>
            highestUnresolved > 0 &&
            onDrillDown &&
            onDrillDown({ priority: 'CRITICAL', title: 'Critical Priority Unresolved Issues' })
          }
          className={`flex items-center gap-2 p-2 rounded-xl transition ${
            highestUnresolved > 0
              ? 'bg-rose-50/70 border border-rose-100 text-rose-800 cursor-pointer hover:bg-rose-100/70'
              : 'bg-neutral-50 text-neutral-500'
          }`}
        >
          <ShieldAlert className="size-4 shrink-0 text-rose-600" />
          <div className="truncate">
            <span className="font-bold text-neutral-900 mr-1">{highestUnresolved}</span>
            <span className="text-[11px]">Critical Unresolved</span>
          </div>
        </div>

        <div
          onClick={() =>
            highOverdue > 0 &&
            onDrillDown &&
            onDrillDown({ drillType: 'OVERDUE', priority: 'HIGH', title: 'P1 High Priority Overdue Items' })
          }
          className={`flex items-center gap-2 p-2 rounded-xl transition ${
            highOverdue > 0
              ? 'bg-amber-50/70 border border-amber-100 text-amber-900 cursor-pointer hover:bg-amber-100/70'
              : 'bg-neutral-50 text-neutral-500'
          }`}
        >
          <Clock className="size-4 shrink-0 text-amber-600" />
          <div className="truncate">
            <span className="font-bold text-neutral-900 mr-1">{highOverdue}</span>
            <span className="text-[11px]">P1 High Overdue</span>
          </div>
        </div>
      </div>
    </div>
  );
};

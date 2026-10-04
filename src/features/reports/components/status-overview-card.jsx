import React from 'react';
import { DonutChart } from './charts/donut-chart';
import { Layers, ChevronRight, PlusCircle } from 'lucide-react';

export const StatusOverviewCard = ({ statusData, loading = false, onDrillDown, onCreateTask }) => {
  const { totalWorkItems = 0, breakdown = [] } = statusData || {};

  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xs animate-pulse space-y-4 h-[320px]">
        <div className="h-4 w-32 bg-neutral-200 rounded" />
        <div className="h-3 w-56 bg-neutral-100 rounded" />
        <div className="flex items-center justify-center h-48">
          <div className="size-36 rounded-full border-4 border-neutral-200 border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  const isEmpty = totalWorkItems === 0;

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs flex flex-col justify-between min-h-[340px] transition-all hover:shadow-sm">
      {/* Card Header (strictly matches screenshot reference) */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-900">Status overview</h3>
          {!isEmpty && (
            <span className="text-[11px] font-semibold text-neutral-400">
              {totalWorkItems} {totalWorkItems === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500 mt-1">
          {isEmpty ? (
            <>
              The status overview for this space will display here after you{' '}
              <button
                onClick={onCreateTask}
                className="text-blue-600 hover:underline font-medium focus:outline-hidden"
              >
                create some work items
              </button>
            </>
          ) : (
            'Real-time distribution of active and completed items across workflow stages.'
          )}
        </p>
      </div>

      {/* Main Content Area */}
      {isEmpty ? (
        /* Empty State Matching Screenshot 1 */
        <div className="my-auto flex flex-col items-center justify-center py-6 text-center select-none">
          <span className="text-4xl font-black text-neutral-900 tracking-tight">0</span>
          <span className="text-xs font-semibold text-neutral-600 mt-1">Total work items</span>
        </div>
      ) : (
        /* Populated State with Donut Chart and Interactive Drilldown rows */
        <div className="my-auto pt-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Donut Chart Visualizer */}
          <div className="shrink-0 flex items-center justify-center">
            <DonutChart
              data={breakdown}
              total={totalWorkItems}
              onSliceClick={(slice) =>
                onDrillDown && onDrillDown({ status: slice.key, title: `${slice.label} Work Items` })
              }
            />
          </div>

          {/* Breakdown Rows */}
          <div className="w-full flex-1 space-y-2">
            {breakdown.map((item) => (
              <div
                key={item.key}
                onClick={() =>
                  onDrillDown && onDrillDown({ status: item.key, title: `${item.label} Work Items` })
                }
                className="group flex items-center justify-between text-xs p-1.5 rounded-lg hover:bg-neutral-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-[100px]">
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="font-semibold text-neutral-700 group-hover:text-neutral-900 truncate">
                    {item.label}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex-1 mx-3 hidden sm:block">
                  <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-neutral-900">{item.count}</span>
                  <span className="text-[10px] text-neutral-400 w-8 text-right">
                    {item.percentage}%
                  </span>
                  <ChevronRight className="size-3 text-neutral-300 opacity-0 group-hover:opacity-100 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Footer Helper */}
      <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-400">
        <span>Click any status to drill down</span>
        {!isEmpty && (
          <button
            onClick={() => onDrillDown && onDrillDown({ title: 'All Status Work Items' })}
            className="text-blue-600 hover:underline font-medium"
          >
            View all
          </button>
        )}
      </div>
    </div>
  );
};
